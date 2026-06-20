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
    <div className="fixed left-3 top-24 z-50">

      <button
        onClick={() => setShow(!show)}
        className="
          bg-green-600
          text-white
          px-4
          py-2
          rounded-full
          shadow-lg
          font-bold
        "
      >
        🎮 Live Games ({rooms.length})
      </button>

      {show && (

        <div
          className="
            mt-2
            w-72
            bg-zinc-900
            border
            border-zinc-700
            rounded-xl
            shadow-2xl
            overflow-hidden
          "
        >

          {rooms.map(room => (

            <div
              key={room.roomId}
              onClick={() =>
                navigate(
                  `/game/room/${room.roomId}`
                )
              }
              className="
                p-3
                border-b
                border-zinc-800
                cursor-pointer
                hover:bg-zinc-800
                text-white
              "
            >

              <div className="font-bold">
                Room {room.roomId}
              </div>

              <div className="text-sm text-zinc-400">
                👥 {room.players} Players
              </div>

              <div className="text-xs">
                {room.gameStarted
                  ? "🔥 Playing"
                  : "⏳ Waiting"}
              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}