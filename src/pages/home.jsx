import React, { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import UserSwipeViewer from "../components/UserSwipeViewer";

export default function Home() {
	const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [liveUsers, setLiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
const [startIndex, setStartIndex] = useState(0);
const API = import.meta.env.VITE_API_URL;
const UserSwipeViewer = lazy(() =>
  import("../components/UserSwipeViewer")
);
const myId = JSON.parse(localStorage.getItem("user"))?.srno;
  useEffect(() => {

  // 🔥 instant load first
  fetchDefaultUsers();

  // 🔥 then try location
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {

      try {

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const res = await fetch(
          `${API}/users?lat=${lat}&lng=${lng}&myId=${myId}`
        );

        const data = await res.json();

        // update nearby users later
        setUsers(data);

      } catch (err) {
        console.log(err);
      }

    },
    (err) => {
      console.log(err);
    },
    {
      timeout: 5000,
      maximumAge: 60000,
      enableHighAccuracy: false
    }
  );

}, []);

  const fetchDefaultUsers = async () => {
  try {
    const res = await fetch(`${API}/users`);
    const data = await res.json();
    setUsers(data);
  } catch (err) {
    console.log(err);
    setError("Failed to load users");
  }
  setLoading(false);
};

useEffect(() => {
  fetch(`${API}/users/live-users?limit=10`)
    .then((res) => res.json())
    .then((data) => {
      setLiveUsers(data);
    });
}, []);



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
        <div className="bg-yellow-600 text-sm p-2 rounded">
          {error}
        </div>
      )}
      <div className="mt-4">

  <div className="flex items-center justify-between mb-3">

    <h2 className="text-white text-lg font-bold">
      🔴 Live Now
    </h2>

  </div>

  {/* LIVE USERS SCROLL */}
  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">

    {liveUsers.map((u) => (

      <div
        key={u.srno}
        onClick={() =>
          navigate(`/meeting/${u.live_room}`)
        }
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
        <div className="
          absolute
          top-2
          right-2
          w-3
          h-3
          bg-red-500
          rounded-full
          animate-pulse
        " />

        {/* USER IMAGE */}
        <img
          src={
            u.pic || "/default-user.png"
          }
          alt={u.name}
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
        <div className="
          text-white
          text-sm
          font-bold
          mt-2
          text-center
          truncate
          w-full
        ">
          {u.name}
        </div>

        {/* LIVE TEXT */}
        <div className="
          text-red-400
          text-xs
          mt-1
        ">
          LIVE NOW
        </div>

      </div>

    ))}

  </div>

</div>
        <hr/>

      <h2 className="text-lg font-semibold text-white">Nearby Users</h2>

      {/* USER GRID */}
      <div className="grid grid-cols-2 gap-3">
        {users.map((u) => (       
			<div
			  key={u.id}
			  //onClick={() => navigate(`/profile/${u.id}`)}
         onClick={() => {
              setStartIndex(users.findIndex(x => x.id === u.id));
              setViewerOpen(true);
            }}
			  className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition"
			>
            {u.pic ? (
              <img  loading="lazy" src={u.pic} alt="" className="w-full h-40 object-cover" />
            ) : (
              <div className="bg-gray-700 h-64 flex items-center justify-center">
                No Image
              </div>
            )}

            <div className="p-2 text-white" onClick={() => navigate(`/profile/${u.id}`)}>
              <h3 className="text-sm font-semibold">
                {u.name}, {u.age}
              </h3>

              <p className="text-xs text-gray-400">
                📍 {u.distance}
              </p>

              <p className="text-xs">
               {Number(u.onst) === 1  ? "🟢 Online"  : "⚪ Offline"}
              </p>
            </div>

          </div>
        ))}
      </div>
   {viewerOpen && (  <Suspense fallback={null}>
  <UserSwipeViewer
    users={users}
    startIndex={startIndex}
    onClose={() => setViewerOpen(false)}
    onOpenProfile={(user) =>
      navigate(`/profile/${user.id}`)
    }
  /></Suspense>
)}
    </div>

  );
}