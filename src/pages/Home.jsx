import React, { useEffect, useState, useContext, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { OnlineUsersContext } from "../context/OnlineUsersContext";
import socket from "../socket";
import { Helmet } from "react-helmet-async";
export default function Home() {
  const navigate = useNavigate();
  const [liveUsers, setLiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [moodUsers, setMoodUsers] = useState([]);
  //const [page, setPage] = useState(1);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const API = import.meta.env.VITE_API_URL;
  const UserSwipeViewer = lazy(() => import("../components/UserSwipeViewer"));
  const ActivityTicker = lazy(() => import("../components/ActivityTicker"));
  const BirthdayUsers = lazy(() => import("../components/BirthdayUsers"));
  const NewUsers = lazy(() => import("../components/NewUsers"));
  const MoodBar = lazy(() => import("../components/MoodBar"));
const myId = Number(JSON.parse(localStorage.getItem("user") || "{}").srno) || 0;
  const token = localStorage.getItem("token"); 
  const [selectedMood, setSelectedMood] = useState("");
  const limit=10;
const [currentMood, setCurrentMood] = useState( JSON.parse(localStorage.getItem("user"))?.mood || "");
const onlineUsers = useContext(OnlineUsersContext);
useEffect(() => {
  if (currentMood) {
    setSelectedMood(currentMood);
  }
}, [currentMood]);
//online check
const [exploreOpen, setExploreOpen] = useState(false);
 // ======================
// LOAD USERS
// ======================
const [location, setLocation] = useState(null);
useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            });
        },
        () => {
            setLocation(null);
        }
    );

}, []);

useEffect(() => {
    fetchUsers();
}, [pageNum, location]);

const fetchUsers = async () => {
    setLoading(true);
    try {
        let url = `${API}/users?page=${pageNum}&limit=${limit}&myId=${myId}`;
        if (location) {
            url += `&lat=${location.lat}&lng=${location.lng}`;
        }
        const res = await fetch(url, {
                headers: {Authorization: `Bearer ${token}`,},
        });
        const data = await res.json();
        if (!Array.isArray(data)) return;
        setHasMore(data.length === limit);
        setUsers(prev =>
            pageNum === 1
                ? data
                : [...prev, ...data]
        );
    } finally {
        setLoading(false);
    }
};


// ======================
// INFINITE SCROLL
// ======================
useEffect(() => {
  const handleScroll = () => {
    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 300 &&
      !loading &&
      hasMore
    ) {
     if (selectedMood?.trim() && moodUsers.length > 0) return;
      setPageNum((prev) => prev + 1);
    }
  };
  window.addEventListener("scroll", handleScroll);
  return () => {
    window.removeEventListener(
      "scroll",
      handleScroll
    );
  };
}, [loading, hasMore]);

useEffect(() => {
  const fetchLiveUsers = async () => {
    try {
      const res = await fetch(
        `${API}/users/live-users?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setLiveUsers(Array.isArray(data) ? data : []);

    } catch {
      setLiveUsers([]);
    }
  };

  // First load
  fetchLiveUsers();

  // Socket update
  socket.on("liveUsersUpdated", fetchLiveUsers);

  return () => {
    socket.off("liveUsersUpdated", fetchLiveUsers);
  };
}, []);
// same mood users
useEffect(() => {

  if (!selectedMood?.trim()) return;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      try {

        const res = await fetch(
          `${API}/users/mood-users?myId=${myId}&lat=${lat}&lng=${lng}&mood=${encodeURIComponent(selectedMood)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        setMoodUsers(Array.isArray(data) ? data : []);

      } catch (err) {

        console.log(err);
        setMoodUsers([]);

      }

    }
  );

}, [selectedMood]);

  // 🔄 Loading state
  /* if (loading) {
    return (
      <div className="text-white p-4 pt-24 text-center">
        📍 Fetching nearby users...
      </div>
    );
  }
*/
  return (
      <>
    <Helmet>
    <title>IndianDost Home - Meet Friends, Chat & Earn Rewards</title>
    <meta
      name="description"
      content="Connect with nearby members, discover online friends, find mood matches, chat in real time, and earn exciting rewards on IndianDost."
    />
    </Helmet>
    <div className="p-3 space-y-3">
      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-yellow-600 text-sm p-2 rounded">{error}</div>
      )}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-lg font-bold">🔴 Live Now</h2>
        </div>

        {/* LIVE USERS SCROLL */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {liveUsers.map((u, index) => (
            <div
              key={`${u.srno}-${index}`}
              onClick={() => navigate(`/meeting/${u.live_room}`)}
              className="
          min-w-[120px]
          bg-gray-800
          hover:bg-gray-700
          rounded-2xl
          p-3
          cursor-pointer
          transition
          shadow-lg
          border border-gray-700
          flex
          flex-col
          items-center
          relative
        "
            >
              {/* LIVE DOT */}
              <div
                className="
          absolute
          top-2
          right-2
          w-3
          h-3
          bg-red-500
          rounded-full
          animate-pulse
        "
              />

              {/* USER IMAGE */}
              <img
                src={
                  u.pic
                    ? u.pic.startsWith("http://") ||
                      u.pic.startsWith("https://")
                      ? u.pic
                      : `https://indiandost.com/${u.pic}`
                    : "https://indiandost.com//default-user.png"
                }
                className="
            w-16
            h-16
            rounded-full
            object-cover
            border-2
            border-red-500
          "
              />

              {/* USER NAME */}
              <div
                className="
          text-white
          text-sm
          font-bold
          mt-2
          text-center
          truncate
          w-full
        "
              >
                {u.name}
              </div>

              {/* LIVE TEXT */}
              <div
                className="
          text-red-400
          text-xs
          mt-1
        "
              >
                LIVE NOW
              </div>
            </div>
          ))}
        </div>
      </div>
      <Suspense fallback={null}>
<MoodBar
  myId={myId}
  token={token}
  currentMood={currentMood}
  onMoodChange={(mood) => {
  setSelectedMood(mood);
  setCurrentMood(mood);
}}
/></Suspense>
  <Suspense fallback={null}><ActivityTicker /></Suspense>

{selectedMood && moodUsers.length > 0 && (

  <div className="mb-5">

    <h2 className="text-lg font-semibold text-white mb-3">
      {selectedMood} Nearby
    </h2>

    <div className="flex gap-3 overflow-x-auto scrollbar-hide">

      {moodUsers.map((u, index) => (

        <div
  key={`${u.srno}-${index}`}
  onClick={() => navigate(`/profile/${u.srno}`)}
  className="
    min-w-[90px]
    flex
    flex-col
    items-center
    cursor-pointer
    relative
  "
>

  {/* IMAGE */}
  <div className="relative">

   <img
        src={
          u.pic
            ? u.pic.startsWith("http://") ||
              u.pic.startsWith("https://")
              ? u.pic
              : `https://indiandost.com/${u.pic}`
            : "https://indiandost.com//default-user.png"
        }
      className="
        w-20
        h-20
        rounded-full
        object-cover
        border-2
        border-pink-500
        shadow-lg
      "
    />

    {/* ONLINE DOT */}

    <div
  className={
    "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-black " +
    (onlineUsers.includes(String(u.srno))
      ? "bg-green-500"
      : "bg-gray-400")
  }
/>
  </div>

  {/* NAME */}
  <div
    className="
      text-white
      text-xs
      font-semibold
      mt-2
      text-center
      truncate
      w-20
    "
  >
    {u.name}, {u.age}
  </div>

  {/* DISTANCE */}
  <div className="text-[11px] text-gray-400">
    📍 {Number(u.distance).toFixed(1)} km
  </div>

</div>
      ))}

    </div>

  </div>

)}

{/*
<Suspense fallback={null}>
  <BirthdayUsers />
</Suspense>

<Suspense fallback={null}>
  <NewUsers />
</Suspense>
*/}
      <hr />

      <h2 className="text-lg font-semibold text-white">Nearby Users</h2>
      {/* USER GRID */}
      <div className="grid grid-cols-2 gap-3">
        {users.map((u, index) => (
          <div
  key={`${u.srno}-${index}`}
  onClick={() => {
    setStartIndex(index);
    setViewerOpen(true);
  }}
  className="
    relative
    rounded-2xl
    overflow-hidden
    cursor-pointer
    h-44
    bg-gray-800
    shadow-lg
    hover:scale-[1.03]
    transition-all
    duration-300
  "
>
  {/* IMAGE */}
  <img
    loading="lazy"
    src={
      u.pic
        ? u.pic.startsWith("http://") ||
          u.pic.startsWith("https://")
          ? u.pic
          : `https://indiandost.com/${u.pic}`
        : "https://indiandost.com//default-user.png"
    }
    alt=""
    className="
      w-full
      h-full
      object-cover
    "
  />
<span
    className={`
      absolute
      top-2
      right-2
      w-3.5
      h-3.5
      rounded-full
      border-2
      border-white
      ${
        onlineUsers.some(id => String(id) === String(u.id))
          ? "bg-green-500"
          : "bg-gray-400"
      }
    `}
  />
  {/* DARK OVERLAY */}
  <div
    className="
      absolute
      inset-0
      bg-gradient-to-t
      from-black/90
      via-black/20
      to-transparent
    "
  />

  {/* ONLINE DOT */}
  <div
    className={`
      absolute*/}
      top-2
      right-2
      w-3
      h-3
      rounded-full
      border
      border-white
      ${Number(u.onst) === 1
        ? "bg-green-400"
        : "bg-gray-400"}
    `}
  />

  {/* DISTANCE BADGE */}
  <div
    className="
      absolute
      top-2
      left-2
      px-2
      py-1
      rounded-full
      bg-black/50
      backdrop-blur-md
      text-white
      text-[10px]
      font-medium
    "
  >
    📍 {Number(u.distance || 0).toFixed(1)} km
  </div>

  {/* USER INFO */}
  <div
    className="
      absolute
      bottom-0
      left-0
      w-full
      p-3
      text-white
    "
    onClick={(e) => {
      //e.stopPropagation();
      navigate(`/profile/${u.id}`);
    }}
  >
    <div
      className="
        font-bold
        text-sm
        truncate
      "
    >
      {u.name}, {u.age} 
          </div>

  </div>
</div>
        ))}
      </div>
      {viewerOpen && (
     <Suspense fallback={null}>
      <UserSwipeViewer
        token={token}
        users={users}
        startIndex={startIndex}
        onClose={() => setViewerOpen(false)}
       onOpenProfile={(id) => {
        setViewerOpen(false);
        navigate(`/profile/${id}`);
      }}
      />
    </Suspense>
      )}
      {loading && (
        <div className="text-center text-gray-400 py-4">
          Loading more users...
        </div>
      )}
      {!hasMore && (
          <div className="text-center text-gray-500 py-4">
            No more users
          </div>
        )}

        {/* EXPLORE FLOAT BUTTON */}

<button
  onClick={() => setExploreOpen(true)}
  className="
    fixed
    bottom-24
    right-4
    z-40

    w-14
    h-14

    rounded-full

    bg-gradient-to-br
    from-pink-500
    to-purple-600

    shadow-2xl

    flex
    items-center
    justify-center

    text-2xl

    active:scale-95
    transition-all
  "
>
  ✨
</button>
{/* EXPLORE POPUP */}

{exploreOpen && (

  <div
    className="
      fixed
      inset-0
      z-50
      bg-black/70
      backdrop-blur-sm

      flex
      items-end
    "
  >

    {/* BACKDROP */}
    <div
      className="absolute inset-0"
      onClick={() => setExploreOpen(false)}
    />

    {/* SHEET */}
    <div
      className="
        relative
        w-full

        bg-[#111]

        rounded-t-3xl
        bottom-[70px]
        p-4

        max-h-[80vh]
        overflow-y-auto

        animate-in
        slide-in-from-bottom
      "
    >

      {/* HANDLE */}
      <div
        className="
          w-14
          h-1.5
          bg-gray-600
          rounded-full
          mx-auto
          mb-4
        "
      />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">

        <h2 className="text-xl font-bold text-white">
        {myId && ("  Explore ")}
        </h2>

        <button
          onClick={() => setExploreOpen(false)}
          className="
            text-gray-400
            text-xl
          "
        >
          ✕
        </button>

      </div>

      {/* BIRTHDAY */}

  {myId ?(<>      <div className="mb-6">      
        <Suspense fallback={null}>
          <BirthdayUsers />
        </Suspense>

      </div>

      {/* NEW USERS */}
      <div>

       <Suspense fallback={null}>
          <NewUsers />
        </Suspense>

      </div>
      </> ): (
        <>
      <h2 className="text-2xl font-bold text-center text-pink-400">
  💙 Meet New Friends, Chat, Play & Earn on IndianDost
</h2>

<p className="text-center text-gray-500 mt-2">
 IndianDost is a growing social networking platform of India where you can:
</p>

<div className="mt-4 space-y-2 text-white">
  <div>💬 Make New Friends</div>
  <div>🎮 Play Fun Games</div>
  <div>🎤 Join Live Jamming Rooms</div>
  <div>🪙 Earn Coins Daily</div>
  <div>💸 Redeem Rewards</div>
</div>

<button className="w-full mt-5 bg-pink-600 py-3 rounded-xl font-bold text-white" onClick={() => navigate(`/register`)}>
  🚀 Join Free Now
</button>
        
        </>
      )}

    </div>

  </div>

)}
    </div>
    </>
  );
}