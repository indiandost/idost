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
   {/* Back Button */}
      <button
        onClick={() => navigate("/games")}
        className="mb-4 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
      >
        ← Back to Games
      </button>
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8">

        <div className="text-5xl">
          🎮
        </div>

        <div>

          <h1 className="text-4xl font-bold text-white">
            Color Crash
          </h1>

          <p className="text-zinc-400">
            Create room & win coins
          </p>
        </div>
      </div>


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
      <div className="bg-gray-900 text-white rounded-xl p-4 mb-4 border border-gray-700">
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

      </button></div>

<div className="bg-gray-900 text-white rounded-xl p-4 mb-4 border border-gray-700">
  <h2 className="text-xl font-bold mb-3 text-white">
    🎨 Color Crash - Rules & Prize Distribution
  </h2>

  <ul className="space-y-2 text-sm text-gray-300">
    <li>
      ✅ Tap your chosen color while the round is active.
    </li>

    <li>
      ✅ Each tap costs <strong>10 Coins</strong> and is recorded as one entry.
    </li>

    <li>
      ✅ You may tap multiple times to create multiple entries before the round ends.
    </li>

    <li>
      ✅ After the timer ends, the winning color is revealed automatically.
    </li>

    <li>
      ✅ Entries placed on the winning color qualify for rewards.
    </li>

    <li>
      ✅ The total coin pool is created from all player entries in the round.
    </li>

    <li>
      ✅ A platform fee of <strong>20%</strong> is deducted from the total pool.
    </li>

    <li>
      ✅ The remaining pool is distributed equally among all winning entries.
    </li>

    <li>
      💰 Rewards are credited automatically to winners.
    </li>
  </ul>

  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
    <h3 className="font-semibold text-green-300 mb-2">
      Example
    </h3>

    <div className="text-sm text-gray-300 space-y-1">
      <p>• 100 total entries are placed.</p>
      <p>• Entry fee = 10 Coins each.</p>
      <p>• Total pool = 1000 Coins.</p>
      <p>• Platform fee (20%) = 200 Coins.</p>
      <p>• Reward pool = 800 Coins.</p>
      <p>• If there are 20 winning entries, each winning entry receives 40 Coins.</p>
    </div>
  </div>

  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
    <p className="text-yellow-300 font-semibold mb-1">
      ⚠️ Important Notice
    </p>

    <p className="text-xs text-gray-300">
      Results are generated independently for each round. Previous results
      do not influence future results. Entry fees are non-refundable once
      a tap is submitted. Play responsibly and only spend coins you are
      willing to risk.
    </p>
  </div>

  <div className="mt-4 text-xs text-gray-400 border-t border-gray-700 pt-3">
    By participating in Color Crash, you agree to the game rules and
    platform policies. Any attempt to exploit bugs, automate gameplay,
    manipulate results, abuse multiple accounts, or engage in fraudulent
    activity may result in reward cancellation, withdrawal restrictions,
    or account suspension.
  </div>
</div>
    </div>
  );
}