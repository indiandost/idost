import { useEffect, useState, useRef, lazy } from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Geolocation } from "@capacitor/geolocation";
import { Camera } from "@capacitor/camera";
import Splash from "./Splash";
import { OnlineUsersContext } from "./context/OnlineUsersContext";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Chat from "./pages/Chat";
import ChatsList from "./pages/ChatsList";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MyProfile from "./pages/MyProfile";
import Friends from "./pages/Friends";
import MeetingRoom from "./pages/MeetingRoom";
import BlockedUsers from "./pages/BlockedUsers";
import MyVisitors from "./pages/MyVisitors";
import MyRefer from "./pages/MyRefer";
import Timeline from "./pages/Timeline";
import { useCoins } from "./context/CoinContext";
import useLoadCoins from "./hooks/useLoadCoins";
import useDailyReward from "./hooks/useDailyReward";
import RewardsHistory from "./pages/RewardsHistory";
import Withdraw from "./pages/Withdraw";
import WithdrawReq from "./pages/WithdrawReq";
import Deposit from "./pages/Deposit";
import Games from "./pages/Games";
import GameRoom from "./pages/GameRoom";
import GameHome from "./pages/GameHome";
import JamRoom from "./pages/JamRoom";
import CreateJamRoom from "./pages/CreateJamRoom";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RiskTower from "./pages/RiskTower";
import QuizBattles from "./pages/QuizBattles";
import QuizPlay from "./pages/QuizPlay";
import QuizResult from "./pages/QuizResult";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { HelmetProvider } from "react-helmet-async";
import socket from "./socket";
import LiveRoomsAlert from "./components/LiveRoomsAlert";
import HireMeEnroll from "./pages/HireMeEnroll";
import HireMeEdit from "./pages/HireMeEdit";
import HireMePayment from "./pages/HireMePayment";
import HireMeDirectory from "./pages/HireMeDirectory";
import HireMeProfile from "./pages/HireMeProfile";
import HireMeAdmin from "./pages/HireMeAdmin";
import HireRequests from "./pages/HireRequests";
import Toaster from "react-hot-toast";
import {
  Home as HomeIcon,
  Users,
  MessageCircle,
  UsersRound,
  Video,
  ShieldBan,
  Eye,
  User,
  Newspaper,
  Menu,
  X,
  Coins,
  Gamepad2,
  Music,
  Search,
  BriefcaseBusiness,
  Inbox,
} from "lucide-react";
import {  App as CapacitorApp } from "@capacitor/app";
import notificationSound from "./assets/sounds/notification.mp3";
//import notificationSound2 from "./assets/sounds/notification2.mp3";
import notificationSound2 from "./assets/sounds/notification-mini.mp3";
import { AdMob } from "@capacitor-community/admob";

const API = import.meta.env.VITE_API_URL;
// 🔐 Protected Route
function PrivateRoute({ children }) {
  const user = localStorage.getItem("user");
  return user ? children : <Navigate to="/login" />;
}
//const user = JSON.parse(localStorage.getItem("user") || "null");
//const viewer = user?.srno || 0;
// 🔝 Navbar
function Navbar({
  menuOpen,
  setMenuOpen,
  searchOpen,
  setSearchOpen,
  search,
  setSearch
}) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
const viewer = user?.srno || 0;
 const token = localStorage.getItem("token");
 // const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const location = useLocation();
  const { coins, setCoins } = useCoins();
  const [pendingQuizCount, setPendingQuizCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
// ✅ custom hook
useLoadCoins(user?.srno);
// ✅ socket listener
useEffect(() => {
  const handleCoinUpdate = (data) => {
    if (typeof data?.coins !== "undefined") {
      setCoins(data.coins);
    }
  };
  socket.on("coinUpdate", handleCoinUpdate);
  return () => {
    socket.off("coinUpdate", handleCoinUpdate);
  };
}, [setCoins]);
//my quiz alert pending
useEffect(() => {

   loadPendingQuizCount();
   loadLiveRooms();

   const id = setInterval(() => {

      if(document.visibilityState==="visible"){
         loadPendingQuizCount();
         loadLiveRooms();
      }

   },30000);

   return ()=>clearInterval(id);

},[]);


//live rooms
const loadLiveRooms = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API}/api/jam-room/live`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    if (data.success) {
      setLiveCount(data.rooms?.length || 0);
    }
  } catch (err) {
    console.log(err);
  }
};

const loadPendingQuizCount = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API}/api/quiz/my-battles`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    const pending =
      (data.battles || []).filter(
        (b) =>
          b.status === "accepted" &&
          Number(b.my_answers) < 5
      ).length;

    setPendingQuizCount(pending);

  } catch (err) {
    console.log(err);
  }
};

  //reward popup
useEffect(() => {

   const rewardHandler=(data)=>{
      toast.success(`+${data.coins} Coins`);
   };

   socket.on("rewardReceived",rewardHandler);

   return ()=>{
      socket.off("rewardReceived",rewardHandler);
   };

},[]);

 useEffect(() => {

  const controller = new AbortController();

  if (!search.trim()) {
    setSearchResults([]);
    return;
  }

  const delay = setTimeout(async () => {

    try {

      const res = await fetch(
        `${API}/users/search?q=${encodeURIComponent(search)}&viewer=${viewer}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal
        }
      );

      const data = await res.json();

      setSearchResults(
        Array.isArray(data.users)
          ? data.users
          : []
      );

    } catch (err) {

      if (err.name !== "AbortError") {
        console.log(err);
      }

    }

  }, 300);

  return () => {
    clearTimeout(delay);
    controller.abort();
  };

}, [search, viewer, token]); 

const logout = async () => {
   try{
      const u=JSON.parse(localStorage.getItem("user"));
      await fetch(`${API}/api/logout`);
   }catch(e){
      console.log(e);
   }finally{
      socket.disconnect();
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      navigate("/login");

   }

};


  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
      {/* ================= HEADER ================= */}
      <div className="fixed top-0 left-0 w-full h-14 bg-gray-900 flex items-center justify-between px-4 z-50 border-b border-gray-700">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          {/* MENU BUTTON */}
          <button onClick={() => setMenuOpen(true)} className="text-white">
            <Menu size={28} />
          </button>

          {/* LOGO */}
        <div
          onClick={() => {
            if (location.pathname !== "/") {
              navigate("/");
            }
          }}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg cursor-pointer"
        >
          <span className="text-2xl font-extrabold text-white">ID</span>
        </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 💰 COINS DISPLAY (NEW) */}
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full text-black font-bold shadow-md">
            💰 {coins}
          </div>
           {liveCount > 0 && (
    <button
      onClick={() => navigate("/create-jam")}
      className="
        relative
        text-xl
        animate-pulse
      "
    >
      🔴

      <span
        className="
          absolute
          -top-2
          -right-2
          bg-red-600
          text-white
          text-[10px]
          rounded-full
          px-1
        "
      >
        {liveCount}
      </span>
    </button>
  )}
  {/* ⚔️ QUIZ ALERT */}
  {pendingQuizCount > 0 && (
    <button
      onClick={() => navigate("/quiz-battles")}
      className="relative text-xl"
      title="Pending Quiz Battles"
    >
      ⚔️

      <span
        className="
          absolute
          -top-2
          -right-2
          bg-red-500
          text-white
          text-[10px]
          min-w-[18px]
          h-[18px]
          rounded-full
          flex
          items-center
          justify-center
          font-bold
        "
      >
        {pendingQuizCount > 9
          ? "9+"
          : pendingQuizCount}
      </span>
    </button>
  )}
          {/* SEARCH AREA */}

         <button
          onClick={() => setSearchOpen(true)}
          className="
            p-2
            rounded-full
            hover:bg-zinc-800
            transition
          "
        >
          <Search size={20} />
        </button>
        </div>

        {searchOpen && (
          <div className="fixed inset-0 bg-black/90 z-[9999] p-4">
            {/* TOP */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username or email..."
                className="
          flex-1
          p-3
          rounded-xl
          bg-gray-800
          text-white
          outline-none
        "
              />

              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearch("");
                }}
                className="text-white text-xl"
              >
                ✖
              </button>
            </div>

            {/* RESULTS */}
            <div className="space-y-2 overflow-y-auto max-h-[80vh]">
              {searchResults.map((u) => (
                <Link
                  key={u.srno}
                  to={`/profile/${u.srno}`}
                  onClick={() => {
                    setSearchOpen(false);
                    setSearch("");
                  }}
                  className="
            flex
            items-center
            gap-3
            bg-gray-800
            p-3
            rounded-xl
            hover:bg-gray-700
          "
                >
                  <img
                    src={u.pic || "https://indiandost.com//default-user.png"}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  <div>
                    <div className="text-white font-semibold">{u.name}</div>

                    <div className="text-gray-400 text-sm">{u.email}</div>
                  </div>
                </Link>
              ))}

              {search && searchResults.length === 0 && (
                <div className="text-gray-400 text-center mt-10">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= OVERLAY ================= */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= SIDE MENU ================= */}
        <div
          className="fixed top-0 left-0 h-screen w-72 bg-gray-900 z-[9999] flex flex-col transition-transform duration-300"
          style={{
            transform: menuOpen
              ? "translateX(0)"
              : "translateX(-100%)",
          }}
        >
        {/* TOP */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-white text-lg font-bold">Menu</h2>

          <button onClick={() => setMenuOpen(false)} className="text-white">
            <X size={26} />
          </button>
        </div>

        {/* MENU LINKS */}
          {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-white">
        <div className="flex flex-col p-3 space-y-2 text-white">
         {user ? (
            <>            <div className="flex items-center gap-3">
              <span className="text-sm">Hi, {user.name}</span>
              <button
                onClick={logout} 
                className="bg-red-500 px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </div>
          
          <Link
            to="/me"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            👤 My Profile
          </Link>
          </>
          ): (
            <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left  gap-2"
          >
            <User size={20}/> <span>Login / Register</span>
          </Link>
          )}
          <Link
            to="/games"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left gap-2"
          >
             <Gamepad2 size={20} /> <span>Games</span>  
          </Link>
          <Link
            to="/create-jam"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left  gap-2"
          >
            <Music size={20}/> <span>Jamming</span>
          </Link>
           {user && (<>
          <Link
            to="/my-visitors"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            🎥 My Visitors
          </Link>
          <Link
            to="/friends"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            🎥 Friends
          </Link>
          <Link
  to="/hire-requests"
  onClick={() => setMenuOpen(false)}
  className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-800 text-left"
>
  <Inbox size={20} />
  <span>Hire Requests</span>
</Link>
         
           <Link
            to="/my-refer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            🎥 My Referrals
          </Link>
         
          <Link
            to="/blocked-users"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            🚫 Block List
          </Link>

          <Link
            to="/my-rewards"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            💰 Rewards History
          </Link>

         {/* <Link
            to={`/meeting/${Math.random().toString(36).substring(2, 8)}`}
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            🎥 Meeting Room
          </Link>*/}
         <Link
            to="/deposit"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            🪙 Deposit
          </Link>
           <Link
            to="/withdraw-req"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            🪙 Withdraw Request
          </Link>
          </>)}
           <Link
            to="/hire-me-directory"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            <BriefcaseBusiness  size={20} /> <span> Hire Me</span>
          </Link>
           <Link
            to="/withdraw"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left  gap-2"
          >
            <Coins size={20} /> <span>Coins Withdraw Info</span>
          </Link>
              {user && ( <Link
            to="/settings"
            onClick={() => setMenuOpen(false)}
            className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
          >
            ⚙️ Settings
          </Link>)}

          {/*  <button
          onClick={() => {
            setMenuOpen(false);
            logout();
          }}
          className="flex items-center p-3 rounded-lg hover:bg-gray-800 text-left"
        >
          🚪 Logout
        </button>*/}
        </div>
        </div>
      </div>
    </div>
  );
}

// 🔽 Bottom Nav
function BottomNav({ setMenuOpen, setSearchOpen, setSearch }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token"); 
  const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  // User not logged in
  if (!token) return;
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch(`${API}/api/chat/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error(err);
    }
  };
  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 10000);
  return () => clearInterval(interval);
}, [token]);

//const user = JSON.parse(localStorage.getItem("user") || "null");
  const navItems = user
  ? [
      {
        name: "Home",
        path: "/",
        icon: HomeIcon,
      },
      {
        name: "Hire Me",
        path: "/hire-me-directory",
        icon: BriefcaseBusiness,
      },
      {
        name: "Friends",
        path: "/friends",
        icon: Users,
      },
      {
        name: "Chat",
        path: "/chats",
        icon: MessageCircle,
      },
      {
        name: "Post",
        path: "/timeline",
        icon: Newspaper,
      },
    ] 
  : [
      {
        name: "Home",
        path: "/home",
        icon: HomeIcon,
      },
      {
        name: "Login",
        path: "/login",
        icon: User,
      },
      {
        name: "Earn Coins",
        path: "/withdraw",
        icon: Coins,
      },
       {
        name: "Games",
        path: "/games",
        icon: Gamepad2,
      },
       {
        name: "Hire Me",
        path: "/hire-me-directory",
        icon: BriefcaseBusiness,
      },
      {
        name: "Post",
        path: "/timeline",
        icon: Newspaper,
      },
    ];
  return (
    <>
      {/* Bottom spacing */}
      <div className="h-16"></div>

      {/* Bottom Navbar */}
      <div className="fixed bottom-0 left-0 w-full z-50 px-2">
        <div className="bg-gray-900/95 backdrop-blur-lg border border-gray-800 rounded-t-2xl shadow-2xl">
          <div className="flex justify-around items-center py-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;

              const active =
                location.pathname === item.path ||
                (item.name === "Meet" &&
                  location.pathname.startsWith("/meeting"));

              return (
     <Link
  key={item.name}
  to={item.path}
  onClick={(e) => {

    if (
      item.path === "/" &&
      location.pathname === "/"
    ) {
      e.preventDefault();
      return;
    }

    setMenuOpen(false);
                    setSearchOpen(false);
                    setSearch("");
   
  }}
  className={`flex flex-col items-center min-w-[65px] transition-all duration-300 ${
    active
      ? "text-pink-400"
      : "text-gray-400 hover:text-white"
  }`}
>
                  <div
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      active
                        ? "bg-pink-500/20 shadow-lg shadow-pink-500/20 scale-110"
                        : "hover:bg-gray-800"
                    }`}
                  >
                   <div className="relative">
  <Icon size={22} />

  {item.name === "Chat" && unreadCount > 0 && (
    <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold">
      {unreadCount}
    </span>
  )}
</div>
                  </div>

                  <span className="text-[11px] mt-1 font-medium">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  //console.log("APP RENDER");
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const viewer = user?.srno || 0;
  const token = localStorage.getItem("token"); 
  const isLoggedIn = !!localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [chatNotice, setChatNotice] = useState(null);

  const [incomingCall, setIncomingCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const incomingCallRef = useRef(null);
  const [isInCall, setIsInCall] = useState(false);
  const inMeetingRef = useRef(false);
  const location = useLocation();
  const [onlineUsers, setOnlineUsers] = useState([]);
  //const [callStartTime, setCallStartTime] = useState(null);
  const hideLayoutRoutes = ["/login", "/register", "/forgot-password"];
  const shouldHideLayout = hideLayoutRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/reset-password/");

  const hideLayout = hideLayoutRoutes.includes(location.pathname);
   //const location = useLocation();

  const hideAlert =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/quiz/");

  //for ads 
useEffect(() => {
    const init = async () => {
        await AdMob.initialize();
        console.log("AdMob Initialized");
    };
    init();
}, []); 
//check sockit connection
useEffect(() => {
  const listener = CapacitorApp.addListener(
    "appStateChange",
    ({ isActive }) => {

      if (!isActive) return;

      console.log("📱 App resumed");

      if (!socket.connected) {
        socket.connect();
      }

    }
  );

  return () => {
    listener.then((l) => l.remove());
  };
}, []);
//health check 
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API}/health`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        console.log("⚠️ Health check failed:", res.status);
      }
    } catch (err) {
      console.log("⚠️ Health check error");
    }
  }, 600000); // 10 minutes

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
  setMenuOpen(false);
}, []);

//push notification 
useEffect(() => {
   if (Capacitor.getPlatform() === "web") return;
  PushNotifications.addListener(
    "pushNotificationReceived",
    (notification) => {
      console.log(
        "🔔 Notification:",
        notification
      );
    }
  );
  return () => {
    PushNotifications.removeAllListeners();
  };
}, []);

//open chat onclick from notification
useEffect(() => {
   if (Capacitor.getPlatform() === "web") return;
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (event) => {
        const data = event.notification?.data || {};
        // chat
        if (data.senderId) {
          navigate(`/chat/${data.senderId}`);
          return;
        }
        // battle
        if (data.type === "battleInvite") {
          navigate("/quiz-battles");
        }
      }
    );
}, [navigate]);


useEffect(() => {
  const askPermissions = async () => {
    try {
      // Prevent asking again
      const permissionAsked = localStorage.getItem("perm_done");
      if (permissionAsked) {
        return;
      }
      const isNative =
        Capacitor.isNativePlatform &&
        Capacitor.isNativePlatform();

      // =========================
      // 1. LOCATION
      // =========================
      try {
        if (isNative) {
          // Android / iOS
          await Geolocation.requestPermissions();

          await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
          });

          console.log("Native location permission granted");
        } else if (navigator.geolocation) {
          // Web browser
          navigator.geolocation.getCurrentPosition(
            () => {
              console.log("Web location permission granted");
            },
            (err) => {
              console.log("Web location denied", err);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
            }
          );
        }
      } catch (err) {
        console.log("Location permission error:", err);
      }

      // =========================
      // 2. CAMERA (NATIVE ONLY)
      // =========================
      try {
        if (isNative) {
          await Camera.requestPermissions({
            permissions: ["camera"],
          });

          console.log("Native camera permission granted");
        }
      } catch (err) {
        console.log("Camera permission error:", err);
      }

      // =========================
      // 3. MIC + CAMERA (WEB SAFE)
      // =========================
      try {
        if (
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        ) {
          const stream =
            await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true,
            });

          // Stop immediately after permission granted
          stream.getTracks().forEach((track) => {
            track.stop();
          });

          console.log("Mic + Camera permission granted");
        }
      } catch (err) {
        console.log("Media permission denied:", err);
      }

      // Save flag
      localStorage.setItem("perm_done", "1");

    } catch (err) {
      console.log("Permission error:", err);
    }
  };

  askPermissions();
}, []);
/*
const permissionAsked = localStorage.getItem("perm_done");

if (!permissionAsked) {
  // ask permissions
  localStorage.setItem("perm_done", "1");
}
  */
  //check meeting
  /*useEffect(() => {

  const checkMeeting = () => {

    const activeMeeting =
      localStorage.getItem(
        "in_meeting"
      );

    inMeetingRef.current =
      activeMeeting === "1";
  };

  checkMeeting();

  const interval =
    setInterval(checkMeeting, 1000);

  return () =>
    clearInterval(interval);

}, []);
*/
//battel invitation
useEffect(() => {
  const handleBattleInvite = ({ battleId }) => {
    if (
      window.confirm(
        "⚔️ New Quiz Battle Challenge"
      )
    ) {
      navigate("/quiz-battles");
    }
  };

  const handleBattleAccepted = () => {
    alert(
      "✅ Your battle was accepted"
    );
  };

  const handleBattleRejected = () => {
    alert(
      "❌ Your battle was rejected"
    );
  };

  socket.on("battleInvite", handleBattleInvite);
  socket.on("battleAccepted", handleBattleAccepted);
  socket.on("battleRejected", handleBattleRejected);

  return () => {
    socket.off("battleInvite", handleBattleInvite);
    socket.off("battleAccepted", handleBattleAccepted);
    socket.off("battleRejected", handleBattleRejected);
  };
}, [navigate]);

useEffect(() => {
    // initial check
    inMeetingRef.current = localStorage.getItem("in_meeting") === "1";

    // listen changes
    const handleStorage = () => {
      inMeetingRef.current = localStorage.getItem("in_meeting") === "1";
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

// 🔊 create notification audio ONCE
  const notificationAudioRef = useRef(null);

  useEffect(() => {
    notificationAudioRef.current = new Audio(notificationSound);

    return () => {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current.currentTime = 0;
        notificationAudioRef.current = null;
      }
    };
  }, []);

  //chat notification
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user"));

    const handleMessageNotification = async (data) => {
      console.log("🔔 GLOBAL MSG:", data);

      // 🚫 IGNORE OWN MESSAGE
      if (Number(data.from) === Number(currentUser?.srno)) {
        return;
      }

      // ✅ CHECK ACTIVE CHAT
      const currentPath = window.location.pathname;

      const activeChatMatch = currentPath.match(/\/chat\/(\d+)/);

      const activeChatUserId = activeChatMatch?.[1];

      // 🚫 already inside same chat
      if (activeChatUserId && Number(activeChatUserId) === Number(data.from)) {
        return;
      }

      // ✅ reuse single Audio instance instead of creating a new one every message
      if (notificationAudioRef.current) {
        notificationAudioRef.current.currentTime = 0;
        notificationAudioRef.current.play().catch(() => {});
      }

      try {
        const res = await fetch(`${API}/users/${data.from}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = await res.json();
        setChatNotice({
          ...data,
          senderName: user.name,
          senderPic: user.pic,
        });
      } catch (err) {
        console.log(err);
      }
    };
    socket.on("receiveMessage", handleMessageNotification);
    return () => {
      socket.off("receiveMessage", handleMessageNotification);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
  // 📍 Location update
  useEffect(() => {
    if (!user || !navigator.geolocation) return;

    let watchId;

    const sendLocation = (pos) => {
      fetch(`${API}/users/update-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.srno,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      });
    };

    const handleError = (err) => {
      console.log("Location error:", err.message);
    };

    // ✅ Better than setInterval
    watchId = navigator.geolocation.watchPosition(sendLocation, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    });

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  // 🔌 Register socket
  /*useEffect(() => {
  if (user?.srno) {
    socket.emit("register", user.srno);
    console.log('user register'); 
  }
}, [user]);
*/
  /*useEffect(() => {
    if (!user?.srno) return;

    const handleConnect = () => {
      socket.emit("register", Number(user.srno));
      console.log("user re-registered after reconnect");
    };

    socket.on("connect", handleConnect);

    // initial register
    socket.emit("register", Number(user.srno));

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user?.srno]); 
  */
// ==============================
// SOCKET REGISTER
// ==============================
// ==============================
// SOCKET REGISTER
// ==============================
useEffect(() => {
  if (!user?.srno) return;

  const registerUser = () => {
    if (!socket.connected) return;

    console.log(
      "✅ Register:",
      user.srno,
      socket.id
    );

    socket.emit("register", String(user.srno));

    // Immediately ask for latest online users
    socket.emit("getOnlineUsers");
  };

  const handleConnect = () => {
    console.log(
      "🟢 Socket Connected:",
      socket.id
    );

    registerUser();
  };

  const handleDisconnect = (reason) => {
    console.log(
      "🔴 Socket Disconnected:",
      reason
    );
  };

  const handleConnectError = (err) => {
    console.log(
      "⚠️ Socket Error:",
      err?.message
    );
  };

  // Already connected
  if (socket.connected) {
    registerUser();
  }

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("connect_error", handleConnectError);

  return () => {
    socket.off("connect", handleConnect);
    socket.off("disconnect", handleDisconnect);
    socket.off("connect_error", handleConnectError);
  };

}, [user?.srno]);


// ==============================
// ONLINE USERS
// ==============================
useEffect(() => {

  const onlineHandler = (list = []) => {

    console.log("🟢 Online Users:", list);

    setOnlineUsers(
      list.map(String)
    );

  };

  socket.on("onlineUsers", onlineHandler);

  // Initial request
  if (socket.connected) {
    socket.emit("getOnlineUsers");
  }

  // Refresh every 30 seconds
  const timer = setInterval(() => {

    if (socket.connected) {

      socket.emit("getOnlineUsers");

    }

  }, 30000);

  return () => {

    clearInterval(timer);

    socket.off(
      "onlineUsers",
      onlineHandler
    );

  };

}, []);
// 📞 Incoming call ringtone
  const ringtoneRef = useRef(null);

  // 🔊 create ringtone ONCE
  useEffect(() => {
    ringtoneRef.current = new Audio(notificationSound2);
    ringtoneRef.current.loop = true;

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    };
  }, []);

  // 🔇 stop ringtone
  const stopRingtone = () => {
    try {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    } catch (err) {
      console.log(err);
    }

    setIncomingCall(null);
  };

  /// call refresh issue fix
  useEffect(() => {
    const cleanup = () => {
      localStorage.removeItem("isInCall");
      incomingCallRef.current = null;
      setIncomingCall(null);
    };

    window.addEventListener("beforeunload", cleanup);

    return () => window.removeEventListener("beforeunload", cleanup);
  }, []);

const missedCallTimeoutRef = useRef(null);

  useEffect(() => {
    const incomingHandler = (data) => {
      console.log("INCOMING", data, "isInCall:", localStorage.getItem("isInCall"));

      // ❌ only REAL busy check
      const isBusy = localStorage.getItem("isInCall") === "1";
      if (isBusy) {
        socket.emit("rejectCall", {
          from: data.from,
          to: data.to,
          reason: "busy",
        });
        return;
      }

      // ✅ clear any previous pending missed-call timer before starting a new call
      if (missedCallTimeoutRef.current) {
        clearTimeout(missedCallTimeoutRef.current);
        missedCallTimeoutRef.current = null;
      }

      // ✅ create unique call
      const callData = {
        ...data,
        callId: data.callId || `${data.from}_${data.to}_${Date.now()}`,
        uiKey: Date.now(), // used as React key to force remount, not a second state update
      };

      incomingCallRef.current = callData;

      // ✅ single state update — no need for a second setTimeout-delayed call
      setIncomingCall(callData);

      // ringtone
      stopRingtone();
      if (ringtoneRef.current) {
        ringtoneRef.current.loop = true;
        ringtoneRef.current.play().catch(() => {});
      }

      // missed call timer
      const currentCallId = callData.callId;
      missedCallTimeoutRef.current = setTimeout(() => {
        if (incomingCallRef.current?.callId === currentCallId) {
          socket.emit("sendMessage", {
            from: data.from,
            to: data.to,
            message: `Missed ${data.type} call`,
            type: "call_missed",
            createdAt: new Date().toISOString(),
          });

          stopRingtone();
          setIncomingCall(null);
          incomingCallRef.current = null;
        }

        missedCallTimeoutRef.current = null;
      }, 30000);
    };

    socket.on("incomingCall", incomingHandler);

    return () => {
      socket.off("incomingCall", incomingHandler);

      if (missedCallTimeoutRef.current) {
        clearTimeout(missedCallTimeoutRef.current);
        missedCallTimeoutRef.current = null;
      }
    };
  }, []);

  // ❌ ALL STOP EVENTS
  useEffect(() => {
    const stopHandler = () => {
      console.log("🔇 stopping ringtone");
      stopRingtone();
    };

    socket.on("callRejected", stopHandler);
    socket.on("callAcceptedSelf", stopHandler);
    socket.on("callEnded", stopHandler);

    return () => {
      socket.off("callRejected", stopHandler);
      socket.off("callAcceptedSelf", stopHandler);
      socket.off("callEnded", stopHandler);
    };
  }, []);

  //daily login rewards
  useDailyReward(user?.srno);
  // ✅ SHOW SPLASH FIRST
  if (loading) {
    return <Splash />;
  }

  return (
    <>
     <Toaster position="top-center" />
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* search function */}
      {!shouldHideLayout && <Navbar
  menuOpen={menuOpen}
  setMenuOpen={setMenuOpen}
  searchOpen={searchOpen}
  setSearchOpen={setSearchOpen}
  search={search}
  setSearch={setSearch}
/>}


      <div className="flex-grow">
       <HelmetProvider>
          {!hideAlert && <LiveRoomsAlert />}
      <OnlineUsersContext.Provider value={onlineUsers}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />          
          <Route path="/post/:id" element={<Timeline />} />
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/timeline" replace />
              )
            }
          />
          <Route path="/home" element={<Home />} />
          <Route path="/timeline" element={<Timeline />} />          
          <Route
            path="/me"
            element={
              <PrivateRoute>
                <MyProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <PrivateRoute>
                <Explore />
              </PrivateRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <PrivateRoute>
                <Friends />
              </PrivateRoute>
            }
          />
          <Route
            path="/chats"
            element={
              <PrivateRoute>
                <ChatsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route
            path="/community"
            element={
              <PrivateRoute>
                <Community />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/meeting/:roomId"
            element={
              <PrivateRoute>
                {" "}
                <MeetingRoom />{" "}
              </PrivateRoute>
            }
          />
          <Route
            path="/blocked-users"
            element={
              <PrivateRoute>
                <BlockedUsers />{" "}
              </PrivateRoute>
            }
          />
          <Route
            path="/my-visitors"
            element={
              <PrivateRoute>
                <MyVisitors />{" "}
              </PrivateRoute>
            }
          />
           <Route
            path="/my-refer"
            element={
              <PrivateRoute>
                <MyRefer />{" "}
              </PrivateRoute>
            }
          />
          <Route
            path="/my-rewards"
            element={
              <PrivateRoute>
                <RewardsHistory />{" "}
              </PrivateRoute>
            }
          />
           <Route
            path="/withdraw-req"
            element={
              <PrivateRoute>
                <WithdrawReq />{" "}
              </PrivateRoute>
            }
          />
       
           <Route
            path="/deposit"
            element={
              <PrivateRoute>
                <Deposit />{" "}
              </PrivateRoute>
            }
          /> 
           
           <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/games" element={<Games />} />
         {/*  <Route
            path="/withdraw"
            element={
              <PrivateRoute>
                <Withdraw />{" "}
              </PrivateRoute>
            }
          />
          <Route
            path="/games"
            element={
              <PrivateRoute>
                <Games />{" "}
              </PrivateRoute>
            }
          /> */}
          <Route
            path="/game"
            element={
              <PrivateRoute>
                <GameHome />{" "}
              </PrivateRoute>
            }
          />
          <Route
            path="/game/room/:roomId"
            element={
              <PrivateRoute>
                <GameRoom />{" "}
              </PrivateRoute>
            }
          />
           <Route path="/create-jam" element={ <CreateJamRoom/> } />
          {/*<Route
            path="/create-jam"
            element={
              <PrivateRoute>
                {" "}
                <CreateJamRoom />{" "}
              </PrivateRoute>
            }
          />*/}
          <Route
            path="/jam-room/:roomId"
            element={
              <PrivateRoute>
                {" "}
                <JamRoom />
              </PrivateRoute>
            }
          />
          <Route
            path="/risk-tower"
            element={
              <PrivateRoute>
                {" "}
                <RiskTower />
              </PrivateRoute>
            }
          />

          <Route path="/quiz-battles"  element={<PrivateRoute> {" "}<QuizBattles /></PrivateRoute>} />
          <Route path="/quiz-result/:battleId" element={<PrivateRoute>{" "}<QuizResult /></PrivateRoute>}/>           
           <Route  path="/quiz/:battleId" element={<PrivateRoute> {" "} <QuizPlay /></PrivateRoute>}/>            
            <Route path="/hire-me-enroll" element={<PrivateRoute> {" "} <HireMeEnroll /></PrivateRoute>} />
            <Route path="/hire-me-directory" element={<HireMeDirectory />}/>
            <Route path="/hire-me/:id" element={<PrivateRoute> {" "} <HireMeProfile /></PrivateRoute>} />
             <Route path="/hireme-edit" element={<PrivateRoute> {" "} <HireMeEdit /></PrivateRoute>} />
             <Route path="/hireme-payment" element={<PrivateRoute> {" "} <HireMePayment /></PrivateRoute>} />
            <Route path="/admin/hire-me" element={<PrivateRoute> {" "} <HireMeAdmin /></PrivateRoute>} />
             <Route path="/hire-requests" element={<PrivateRoute> {" "} <HireRequests /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes></OnlineUsersContext.Provider>
        </HelmetProvider>
      </div>
      {/*!shouldHideLayout && <BottomNav  setMenuOpen={setMenuOpen} />*/}
 <BottomNav  setMenuOpen={setMenuOpen} 
      setSearchOpen={setSearchOpen}
      setSearch={setSearch} />
      {/* 📞 GLOBAL CALL POPUP (FIXED POSITION) */}

      {incomingCall && (
        <div key={incomingCall.uiKey} className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <h2 className="text-white text-xl">
            📞 Incoming {incomingCall.type} call
          </h2>

          <div className="flex gap-4 mt-5">
            {/* ================= ACCEPT ================= */}
            <button
              className="
              bg-green-500
              hover:bg-green-600
              px-5 py-2
              rounded-lg
              text-white
              font-semibold
            "
              onClick={async () => {
                try {
                  if (!incomingCall) return;

                  const callData = {
                    ...incomingCall,
                  };

                  console.log("✅ ACCEPTING CALL", callData);

                  // stop ringtone first
                  stopRingtone();

                  // IMPORTANT
                  // clear popup immediately
                  setIncomingCall(null);

                  incomingCallRef.current = null;

                  // lock call state
                  localStorage.setItem("isInCall", "1");

                  setIsInCall(true);

                  // send accepted event
                  socket.emit("acceptCall", {
                    callId: callData.callId,
                    from: callData.from,
                    to: user.srno,
                    type: callData.type || "video",
                  });

                  // SMALL DELAY
                  // helps socket sync
                  setTimeout(() => {
                    navigate(
                      `/chat/${callData.from}?autoStart=true&type=${
                        callData.type || "video"
                      }`
                    );
                  }, 300);
                } catch (err) {
                  console.log("ACCEPT ERROR", err);
                }
              }}
            >
              Accept
            </button>

            {/* ================= REJECT ================= */}
            <button
              className="
    bg-red-500
    hover:bg-red-600
    px-5 py-2
    rounded-lg
    text-white
    font-semibold
  "
              onClick={() => {
                try {
                  if (!incomingCall) return;

                  const callData = {
                    ...incomingCall,
                  };

                  console.log("❌ REJECTING CALL", callData);

                  stopRingtone();

                  // clear popup FIRST
                  setIncomingCall(null);

                  incomingCallRef.current = null;

                  // unlock call
                  localStorage.removeItem("isInCall");

                  setIsInCall(false);

                  // notify caller
                  socket.emit("rejectCall", {
                    callId: callData.callId,
                    from: callData.from,
                    to: user.srno,
                  });

                  // optional chat msg
                  socket.emit("sendMessage", {
                    from: user.srno,
                    to: callData.from,
                    message: `Rejected ${callData.type} call`,
                    type: "call_rejected",
                    createdAt: new Date().toISOString(),
                  });
                } catch (err) {
                  console.log("REJECT ERROR", err);
                }
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {chatNotice && (
        <div className="fixed top-10 right-5 bg-gray-900 text-white p-3 rounded-xl shadow-2xl z-[9999] w-72 border border-gray-700">
          <div className="flex justify-between items-start">
            <div
              onClick={() => {
                navigate(`/chat/${chatNotice.from}`);
                setChatNotice(null);
              }}
              className="flex items-center gap-3 cursor-pointer flex-1"
            >
              <img
                src={chatNotice.senderPic || "https://indiandost.com/idost/default-user.png"}
                className="w-12 h-12 rounded-full object-cover"
              />

              <div>
                <div className="font-bold">{chatNotice.senderName}</div>

                <div className="text-sm text-gray-300 truncate">
                  {chatNotice.message || "📷 Photo"}
                </div>
              </div>
            </div>

            {/* ❌ Close */}
            <button
              onClick={() => setChatNotice(null)}
              className="ml-2 text-gray-400 text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}