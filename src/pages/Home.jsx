import React, { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
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
  const BirthdayUsers = lazy(() => import("../components/BirthdayUsers"));
  const NewUsers = lazy(() => import("../components/NewUsers"));
  const MoodBar = lazy(() => import("../components/MoodBar"));
  const myId = JSON.parse(localStorage.getItem("user"))?.srno;
  const token = localStorage.getItem("token"); 
  const [selectedMood, setSelectedMood] = useState("");
  const limit=9;
const [currentMood, setCurrentMood] = useState( JSON.parse(localStorage.getItem("user"))?.mood || "");
useEffect(() => {
  if (currentMood) {
    setSelectedMood(currentMood);
  }
}, [currentMood]);
//online check
const [onlineUsers, setOnlineUsers] = useState([]);


  // =========================
  // ONLINE USERS
  // =========================
  useEffect(() => {
    const handler = (list) => {
       console.log("ONLINE USERS RECEIVED:", list);
        setOnlineUsers(list);
    };
    socket.on("onlineUsers", handler);
    return () => {
      socket.off("onlineUsers", handler);
    };
  }, []);

const [exploreOpen, setExploreOpen] = useState(false);
 // ======================
// LOAD USERS
// ======================
useEffect(() => {

  // 🔥 instant load first
  fetchDefaultUsers(pageNum);

  // 🔥 then try location
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(

    async (pos) => {

      try {

        setLoading(true);

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const res = await fetch(

          `${API}/users?lat=${lat}&lng=${lng}&myId=${myId}&page=${pageNum}&limit=${limit}`,

          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }

        );

        const data = await res.json();

        if (!Array.isArray(data)) return;

        // no more records
        if (data.length < limit) {
          setHasMore(false);
        }

        // first page
        if (pageNum === 1) {

          setUsers(data);

        } else {

          setUsers((prev) => [...prev, ...data]);

        }

      } catch (err) {

        console.log(err);

      } finally {

        setLoading(false);

      }

    },

    (err) => {

      console.log(err);

    },

    {
      timeout: 5000,
      maximumAge: 60000,
      enableHighAccuracy: false,
    }

  );

}, [pageNum]);


// ======================
// DEFAULT USERS
// ======================
const fetchDefaultUsers = async (page = 1) => {

  try {

    setLoading(true);

    const res = await fetch(

      `${API}/users?page=${page}&limit=${limit}&myId=${myId}`,

      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

    );

    const data = await res.json();

    if (!Array.isArray(data)) return;

    // no more data
    if (data.length < limit) {
      setHasMore(false);
    }

    // first page
    if (page === 1) {

      setUsers(data);

    }

    // next pages
    else {

      setUsers((prev) => [...prev, ...data]);

    }

  } catch (err) {

    console.log(err);
    setError("Failed to load users");

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
      // ✅ prevent HTML/error response crash
      const text = await res.text();
      let data = [];
      try {
        data = JSON.parse(text);
      } catch {
        console.log("Invalid JSON:", text);
        data = [];
      }
      // ✅ ensure always array
      if (Array.isArray(data)) {
        setLiveUsers(data);
      } else {
        setLiveUsers([]);
      }
    } catch (err) {
      console.log("Live users fetch error:", err);
      setLiveUsers([]);
    }
  };
  fetchLiveUsers();
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
      absolute
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
      e.stopPropagation();
      navigate(`/profile/${u.srno}`);
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

    <div
      className="
        text-[11px]
        text-gray-200
      "
    >
       {onlineUsers.some(id => String(id) === String(u.srno))
        ? "🟢 Online"
        : "⚪ Offline"}
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
          Explore
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
      <div className="mb-6">      
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

    </div>

  </div>

)}
    </div>
    
  );
}