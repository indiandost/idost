import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../../socket";

const API =
  import.meta.env.VITE_API_URL;

export default function ChatHeader({
  onAudioCall,
  onVideoCall,
  }) {

  const { id: friendId } =
    useParams();

  const [friendData, setFriendData] =
    useState(null);

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  // =========================
  // LOAD FRIEND DETAILS
  // =========================
  useEffect(() => {

    const currentUser =
      JSON.parse(
        localStorage.getItem("user")
      );

    if (!friendId) return;

    fetch(
      `${API}/users/${friendId}?viewer=${currentUser?.srno}`
    )
      .then((res) => res.json())
      .then((data) => {

        console.log(data);

        setFriendData(data);

      })
      .catch((err) =>
        console.log(err)
      );

  }, [friendId]);

  // =========================
  // ONLINE USERS
  // =========================
  useEffect(() => {

    const handler = (list) => {

      setOnlineUsers(list);

    };

    socket.on(
      "onlineUsers",
      handler
    );

    return () => {

      socket.off(
        "onlineUsers",
        handler
      );

    };

  }, []);

  // =========================
  // ONLINE STATUS
  // =========================
  const isOnline =
    onlineUsers.includes(
      String(friendId)
    );

  return (
    <div
  className="
    fixed top-[55px] left-0 right-0
    z-40
    bg-gray-900/95 backdrop-blur-md
    border-b border-gray-800
    px-4 py-3
    flex items-center justify-between
    shadow-lg
  "
>

      {/* LEFT */}
      <div className="flex items-center gap-3 min-w-0">

        <div className="relative">

          <img
            src={
              friendData?.pic ||
              "/idost/default-user.png"
            }
            alt="user"
            className="
              w-12 h-12
              rounded-full
              object-cover
              border-2 border-gray-700
            "
          />

          <div
            className={`
              absolute bottom-0 right-0
              w-3.5 h-3.5 rounded-full border-2 border-gray-900
              ${
                isOnline
                  ? "bg-green-500"
                  : "bg-gray-500"
              }
            `}
          />

        </div>

        <div className="min-w-0">

          <h2
            className="
              text-white font-semibold
              text-[15px]
              truncate
            "
          >
            {friendData?.name || "Loading..."}
          </h2>

          <div className="flex items-center gap-2 text-xs mt-0.5">

            {friendData?.age && (
              <span className="text-gray-400">
                {friendData.age} yrs
              </span>
            )}

            <span
              className={
                isOnline
                  ? "text-green-400"
                  : "text-gray-500"
              }
            >
              {isOnline
                ? "Online"
                : "Offline"}
            </span>

          </div>

        </div>

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2">

        {/* AUDIO */}
        <button
          onClick={onAudioCall}
          className="
            w-11 h-11
            rounded-full
            bg-green-500/20
            hover:bg-green-500/30
            flex items-center justify-center
            transition
          "
        >
          <span className="text-lg">
            📞
          </span>
        </button>

        {/* VIDEO */}
        <button
          onClick={onVideoCall}
          className="
            w-11 h-11
            rounded-full
            bg-purple-500/20
            hover:bg-purple-500/30
            flex items-center justify-center
            transition
          "
        >
          <span className="text-lg">
            🎥
          </span>
        </button>

         </div>

    </div>
  );

}