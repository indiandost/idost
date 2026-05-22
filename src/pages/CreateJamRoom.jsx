// ==========================================
// FILE: src/pages/CreateJamRoom.jsx
// ==========================================

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function CreateJamRoom() {

  // ==========================================
  // USER
  // ==========================================

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  // ==========================================
  // NAVIGATE
  // ==========================================

  const navigate =
    useNavigate();

  // ==========================================
  // STATES
  // ==========================================

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [roomType, setRoomType] =
    useState("jam");

  const [loading, setLoading] =
    useState(false);

  const [liveRooms, setLiveRooms] =
    useState([]);

  const [loadingRooms, setLoadingRooms] =
    useState(true);

  // ==========================================
  // FETCH LIVE ROOMS
  // ==========================================

  const fetchLiveRooms =
    async () => {

      try {

        setLoadingRooms(true);

        const res =
          await fetch(
            `${API}/api/jam-room/live`
          );

        const data =
          await res.json();

        console.log(
          "LIVE ROOMS:",
          data
        );

        if (data.success) {

          setLiveRooms(
            data.rooms || []
          );

        }

      }

      catch (err) {

        console.log(
          "LIVE ROOM ERROR:",
          err
        );

      }

      finally {

        setLoadingRooms(false);

      }

    };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {

    fetchLiveRooms();

  }, []);

  // ==========================================
  // CREATE ROOM
  // ==========================================

  const createRoom =
    async () => {

      try {

        // ==========================
        // VALIDATION
        // ==========================

        if (
          !title.trim()
        ) {

          alert(
            "Please enter room title"
          );

          return;

        }

        // ==========================
        // USER CHECK
        // ==========================

        if (
          !user?.srno
        ) {

          alert(
            "User not found"
          );

          return;

        }

        setLoading(true);

        // ==========================
        // API CALL
        // ==========================

        const res =
          await fetch(

            `${API}/api/jam-room/create`,

            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({

                  hostId:
                    Number(
                      user.srno
                    ),

                  title,

                  description,

                  roomType,

                }),

            }

          );

        const data =
          await res.json();

        console.log(
          "CREATE ROOM:",
          data
        );

        // ==========================
        // SUCCESS
        // ==========================

        if (
          data.success
        ) {

          navigate(
            `/jam-room/${data.roomId}`
          );

        }

        else {

          alert(

            data.message ||

            "Failed to create room"

          );

        }

      }

      catch (err) {

        console.log(
          "CREATE ROOM ERROR:",
          err
        );

        alert(
          "Something went wrong"
        );

      }

      finally {

        setLoading(false);

      }

    };

  // ==========================================
  // JOIN ROOM
  // ==========================================

  const joinRoom =
    (roomId) => {

      navigate(
        `/jam-room/${roomId}`
      );

    };

  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="min-h-screen bg-black text-white p-5">

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">

        {/* ===================================== */}
        {/* CREATE ROOM */}
        {/* ===================================== */}

        <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 h-fit">

          {/* TITLE */}

          <h1 className="text-3xl font-bold mb-2">

            🎤 Create Jam Room

          </h1>

          <p className="text-gray-400 mb-6">

            Start your live music or voice room

          </p>

          {/* ROOM TITLE */}

          <div className="mb-4">

            <label className="block mb-2 text-sm text-gray-300">

              Room Title

            </label>

            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="Enter room title"
              className="w-full bg-gray-800 rounded-xl p-4 outline-none border border-gray-700"
            />

          </div>

          {/* DESCRIPTION */}

          <div className="mb-4">

            <label className="block mb-2 text-sm text-gray-300">

              Description

            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Room description..."
              rows={4}
              className="w-full bg-gray-800 rounded-xl p-4 outline-none border border-gray-700 resize-none"
            />

          </div>

          {/* ROOM TYPE */}

          <div className="mb-6">

            <label className="block mb-2 text-sm text-gray-300">

              Room Type

            </label>

            <select
              value={roomType}
              onChange={(e) =>
                setRoomType(
                  e.target.value
                )
              }
              className="w-full bg-gray-800 rounded-xl p-4 outline-none border border-gray-700"
            >

              <option value="jam">
                🎵 Jam Session
              </option>

              <option value="battle">
                ⚔️ Music Battle
              </option>

              <option value="karaoke">
                🎤 Karaoke
              </option>

            </select>

          </div>

          {/* BUTTON */}

          <button
            onClick={createRoom}
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700 transition-all px-5 py-4 rounded-xl w-full font-semibold"
          >

            {
              loading
                ? "Creating..."
                : "Create Room"
            }

          </button>

        </div>

        {/* ===================================== */}
        {/* LIVE ROOMS */}
        {/* ===================================== */}

        <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-2xl font-bold">

                🔴 Live Jam Rooms

              </h2>

              <p className="text-gray-400 text-sm mt-1">

                Join any live room

              </p>

            </div>

            <button
              onClick={fetchLiveRooms}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm"
            >

              Refresh

            </button>

          </div>

          {/* LOADING */}

          {
            loadingRooms && (

              <div className="text-center py-10 text-gray-400">

                Loading live rooms...

              </div>

            )
          }

          {/* EMPTY */}

          {
            !loadingRooms &&
            liveRooms.length === 0 && (

              <div className="text-center py-14">

                <div className="text-6xl mb-4">

                  🎧

                </div>

                <div className="text-gray-400">

                  No live rooms available

                </div>

              </div>

            )
          }

          {/* ROOMS */}

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">

            {
              liveRooms.map(
                (room) => (

                  <div
                    key={
                      room.room_id
                    }
                    className="bg-gray-800 border border-gray-700 rounded-2xl p-4"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex-1">

                        <div className="flex items-center gap-2 mb-2">

                          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />

                          <span className="text-sm text-red-400">

                            LIVE

                          </span>

                        </div>

                        <h3 className="text-lg font-bold mb-1">

                          {
                            room.title
                          }

                        </h3>

                        <div className="text-sm text-gray-400 mb-2">

                          Room ID:
                          {" "}
                          {
                            room.room_id
                          }

                        </div>

                        <div className="flex flex-wrap gap-2">

                          <div className="bg-gray-700 px-3 py-1 rounded-full text-xs">

                            🎵
                            {" "}
                            {
                              room.room_type
                            }

                          </div>

                          <div className="bg-gray-700 px-3 py-1 rounded-full text-xs">

                            👀
                            {" "}
                            {
                              room.total_users || 0
                            }
                            {" "}
                            viewers

                          </div>

                        </div>

                      </div>

                      <button
                        onClick={() =>
                          joinRoom(
                            room.room_id
                          )
                        }
                        className="bg-pink-600 hover:bg-pink-700 px-5 py-3 rounded-xl font-semibold whitespace-nowrap"
                      >

                        Join Room

                      </button>

                    </div>

                  </div>

                )
              )
            }

          </div>

        </div>

      </div>

    </div>

  );

}