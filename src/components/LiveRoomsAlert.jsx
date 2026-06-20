import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

export default function LiveRoomsAlert() {

  const [rooms, setRooms] = useState([]);
  const [show, setShow] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {

    socket.on(
      "live_rooms_update",
      (data) => {
        setRooms(data || []);
      }
    );

    return () => {
      socket.off("live_rooms_update");
    };

  }, []);

  if (!rooms.length) return null;

  return (
   <div className="fixed left-36 top-2 z-50">

  {/* Toggle Button */}
  <button
    onClick={() => setShow(!show)}
    className="
      flex
      items-center
      gap-2
      bg-gradient-to-r
      from-green-500
      to-emerald-600
      text-white
      px-3
      py-2
      rounded-full
      shadow-xl
      text-sm
      font-semibold
      hover:scale-105
      transition-all
    "
  >
    <span className="animate-pulse">
      🎮
    </span>

    <span>
      {rooms.length}
    </span>
  </button>

  {/* Room List */}
  {show && (

    <div
      className="
        mt-2
        w-64
        max-h-80
        overflow-y-auto
        bg-zinc-900/95
        backdrop-blur-md
        border
        border-zinc-700
        rounded-2xl
        shadow-2xl
      "
    >

      {/* Header */}
      <div
        className="
          sticky
          top-0
          bg-zinc-950
          px-4
          py-3
          border-b
          border-zinc-800
          flex
          justify-between
          items-center
        "
      >
        <span
          className="
            text-white
            font-bold
            text-sm
          "
        >
          🎮 Live Games
        </span>

        <span
          className="
            bg-green-500
            text-black
            text-xs
            px-2
            py-0.5
            rounded-full
            font-bold
          "
        >
          {rooms.length}
        </span>
      </div>

      {/* Rooms */}
      {rooms.map((room) => (

        <div
          key={room.roomId}
          onClick={() => {
            navigate(
              `/game/room/${room.roomId}`
            );
            setShow(false);
          }}
          className="
            p-3
            border-b
            border-zinc-800
            cursor-pointer
            hover:bg-zinc-800
            transition
          "
        >

          <div
            className="
              flex
              justify-between
              items-center
            "
          >

            <div
              className="
                text-white
                font-semibold
                text-sm
              "
            >
              #{room.roomId}
            </div>

            <div
              className={`
                text-[10px]
                px-2
                py-1
                rounded-full
                font-bold
                ${
                  room.gameStarted
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }
              `}
            >
              {room.gameStarted
                ? "LIVE"
                : "WAIT"}
            </div>

          </div>

          <div
            className="
              mt-1
              text-xs
              text-zinc-400
              flex
              justify-between
            "
          >
            <span>
              👥 {room.players} Players
            </span>

            <span>
              Join →
            </span>
          </div>

        </div>

      ))}

    </div>

  )}

</div>
  );
}