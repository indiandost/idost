import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import socket from "../socket";

const API = import.meta.env.VITE_API_URL;

export default function Home() {

  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const user = JSON.parse(
    localStorage.getItem("user")
  );


  // =========================
  // GET ROOMS
  // =========================
  const getRooms = async () => {

    try {

      const res = await fetch(
        `${API}/api/game/rooms`
      );

      const data = await res.json();

      setRooms(data.rooms || []);

    } catch (err) {

      console.log(err);
    }
  };


  useEffect(() => {

    getRooms();

  }, []);


  // =========================
  // CREATE ROOM
  // =========================
  const createRoom = () => {

    // LOGIN CHECK
    if (!user) {

      alert("Please login first");

      return;
    }

    // STOP MULTIPLE CLICK
    if (loading) return; 

    // ONLY ONE ROOM CHECK
    const alreadyCreatedRoom =
      rooms.find(
        (room) =>
          room.host_user_id ===
          user.srno &&
          room.status !== "ended"
      );

    if (alreadyCreatedRoom) {

      alert(
        "⚠️ You already have an active room"
      );

      navigate(
        `/game/room/${alreadyCreatedRoom.room_id}`
      );

      return;
    }

    setLoading(true);

    console.log(
      "🎮 EMIT CREATE ROOM"
    );

    socket.emit("create_room", {
      hostUserId: user.srno,
    });
  };


  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {

    // ROOM CREATED
    const handleRoomCreated =
      (data) => {

        setLoading(false);

        alert(
          "✅ Room Created Successfully"
        );

        getRooms();

        navigate(
          `/game/room/${data.roomId}`
        );
      };


    // ERROR
    const handleError = (msg) => {

      setLoading(false);

      alert(msg);
    };


    socket.on(
      "room_created",
      handleRoomCreated
    );

    socket.on(
      "error_message",
      handleError
    );


    return () => {

      socket.off(
        "room_created",
        handleRoomCreated
      );

      socket.off(
        "error_message",
        handleError
      );
    };

  }, [navigate]);


  return (

    <div className="min-h-screen bg-black text-white p-5">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8">

        <div className="text-5xl">
          🎮
        </div>

        <div>

          <h1 className="text-4xl font-bold">
            Color Crash
          </h1>

          <p className="text-zinc-400">
            Create room & win coins
          </p>
        </div>
      </div>


      {/* CREATE BUTTON */}
      <button
        onClick={createRoom}
        disabled={loading} 
        className="
          bg-green-500
          hover:bg-green-600
          transition
          px-6
          py-4
          rounded-2xl
          font-bold
          text-lg
          disabled:opacity-50
        "
      >

        {
          loading
            ? "Creating..."
            : "Create Room (FREE)"
        }

      </button>


      {/* ROOMS */}
      <div className="mt-10 grid gap-4">

        {rooms.length === 0 && (

          <div className="text-zinc-500">

            No active rooms

          </div>
        )}


        {rooms.map((room) => (

          <div
            key={room.room_id}
            className="
              bg-zinc-900
              border
              border-zinc-800
              p-5
              rounded-2xl
            "
          >

            <div className="
              flex
              justify-between
              items-center
            ">

              <div>

                <h2 className="
                  text-2xl
                  font-bold
                ">

                  🎯 Room
                  {" "}
                  {room.room_id}

                </h2>

                <p className="
                  text-zinc-400
                  mt-1
                ">

                  Status:
                  {" "}
                  {room.status}

                </p>

              </div>


              <button
                onClick={() =>
                  navigate(
                    `/game/room/${room.room_id}`
                  )
                }
                className="
                  bg-blue-500
                  hover:bg-blue-600
                  transition
                  px-5
                  py-3
                  rounded-xl
                  font-bold
                "
              >

                Join Game

              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}