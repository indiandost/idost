import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function UserProfile() {
  const { id } = useParams();
const myId = JSON.parse(localStorage.getItem("user"))?.srno;

  const [user, setUser] = useState(null);
  const [album, setAlbum] = useState([]);
  const [activeImg, setActiveImg] = useState(null);
  const [friendStatus, setFriendStatus] = useState("loading");
  const [friendReqId, setfriendReqId] = useState(null);
  const [blocked, setBlocked] = useState(false);
const API = import.meta.env.VITE_API_URL;
const navigate = useNavigate();
useEffect(() => {
  // ✅ 1. Fetch user
 // JSON.parse(localStorage.getItem("user"));

fetch( `${API}/users/${id}?viewer=${myId}`) .then(res => res.json())
  .then(data => {
    // 🚫 blocked
    if (data.blocked) {
      setBlocked(true);
      return;
    }
    setUser(data);
  });

  // ✅ 2. Fetch album (FIXED URL)
  fetch(`${API}/users/photogallery/${id}`)
    .then(res => res.json())
    .then(data => {
      const imgs = data.map(p => p.url); // ✅ already full URL
      setAlbum(imgs);
    });

  fetch(`${API}/friends/status/${myId}/${id}`)
    .then(res => res.json())
    .then(data => {
      console.log(data.status);
      setFriendStatus(data.status);
      setfriendReqId(data.id);
    });
}, [id]);


const sendRequest = () => {
  fetch(`${API}/friends/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: myId, user2: id })
  })
  .then(res => res.json())
  .then(() => setFriendStatus("sent"));
};

const acceptRequest = () => {
  fetch(`${API}/friends/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: friendReqId })
  })
  .then(() => setFriendStatus("friends"));
};
const rejectRequest = () => {
  fetch(`${API}/friends/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: friendReqId })
  })
  .then(() => setFriendStatus("➕ Add Friend"));
};
//user block function
const blockUser = async () => {
  if (!window.confirm("Block this user?")) {
    return;
  }
  //const me =  JSON.parse(localStorage.getItem("user"));
  const res = await fetch(`${API}/api/block`,  {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: myId,
        user2: id,
      }),
    }
  );
  const data = await res.json();
  if (data.success) {
    alert("User blocked");
    navigate("/");
  }
};

if (blocked) {
  return (
    <div className="text-white p-5 text-center">
      🚫 This profile is unavailable
    </div>
  );
}
  if (!user) {
    return <div className="text-white p-4">Loading profile...</div>;
  }

  // fallback
  const finalAlbum = album.length > 0 ? album : [user.pic];

  return (
    <div className="text-white bg-gray-900 min-h-screen">

      {/* PROFILE HEADER */}
      <div className="relative">
        <img src={user.pic} className="w-full h-72 object-cover" />

        <div className="absolute inset-0 bg-gradient-to-t from-black"></div>

        <div className="absolute bottom-4 left-4">
          <h2 className="text-2xl font-bold text-white">
            {user.name}, {user.age}
          </h2>
  {user.live_status == 1 && user.live_room && (
  <div
    onClick={() =>
      navigate(`/meeting/${user.live_room}`)
    }
    className="
      inline-block
      mt-3
      bg-red-500
      hover:bg-red-600
      px-4
      py-2
      rounded-lg
      text-white
      font-bold
      animate-pulse
      cursor-pointer
    "
  >
    🔴 Join Live
  </div>
)}
          <p className="text-sm text-gray-300">📍 {user.city}</p>
        </div>
      </div>

      {/* DETAILS */}
      <div className="p-4 space-y-3">

        <p>
           {Number(user.onst) === 1  ? "🟢 Online"  : "⚪ Offline"}
        </p>

        <p className="text-gray-300">
          {user.online || "No bio available"}
        </p>

       {/* ACTIONS */}
<div className="grid grid-cols-4 gap-3">
 {Number(myId) !== Number(id) && (
  <>
    <button className="bg-pink-500 py-2 rounded-xl">
      ❤️ Like
    </button>

    <button
      onClick={blockUser}
      className="bg-red-600 px-4 py-2 rounded"
    >
      Block User
    </button>

   {/* <button
      onClick={() => navigate(`/chat/${id}?call=audio`)}
      className="bg-green-500 py-2 rounded-xl"
    >
      📞 Call
    </button>

    <button
      onClick={() => navigate(`/chat/${id}?call=video`)}
      className="bg-purple-500 py-2 rounded-xl"
    >
      🎥 Video
    </button>
    */}

{/* 👇 FRIEND BUTTON */}
  {friendStatus === "loading" && (
    <button className="w-full bg-gray-600 py-2 rounded-xl">
      Loading...
    </button>
  )}

  {friendStatus === "none" && (
    <button
      onClick={sendRequest}
      className="w-full bg-green-500 py-2 rounded-xl"
    >
      ➕ Add Friend
    </button>
  )}

  {friendStatus === "received" && (
  <div className="flex flex-col gap-2">
    <button
      onClick={acceptRequest}
      className="w-full bg-purple-500 py-2 rounded-xl"
    >
      ✅ Accept Request
    </button>

    <button
      onClick={rejectRequest}
      className="w-full bg-red-500 py-2 rounded-xl"
    >
      ❌ Reject Request
    </button>
      </div>
)}

  {friendStatus === "friends" && (
    <button className="w-full bg-gray-700 py-2 rounded-xl">
      👥 Friends
    </button>
  )}
{friendStatus === "sent" && (
  <button className="w-full bg-yellow-500 py-2 rounded-xl">
    ⏳ Request Sent
  </button>
)}
  </>
)}
    <button
      onClick={() => navigate(`/chat/${id}`)}
      className="bg-blue-500 py-2 rounded-xl"
    >
      💬 Chat
    </button>
</div>

        {/* 📸 ALBUM */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Photos</h3>

          <div className="grid grid-cols-3 gap-2">
            {finalAlbum.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setActiveImg(img)}
                className="w-full h-28 object-cover rounded-xl cursor-pointer hover:scale-105 transition"
              />
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {activeImg && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center"
          onClick={() => setActiveImg(null)}
        >
          <img src={activeImg} className="max-h-[90%] max-w-[90%]" />
        </div>
      )}
    </div>
  );
}