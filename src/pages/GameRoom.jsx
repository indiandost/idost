import { useEffect, useMemo, useState, useRef } from "react";

import { useNavigate, useParams } from "react-router-dom";

import socket from "../socket";

import ChatBox from "../components/ChatBox";
import Leaderboard from "../components/Leaderboard";
import ColorButtons from "../components/ColorButtons";

export default function GameRoom() {

  const navigate = useNavigate();

  const { roomId } = useParams();
  const joinedRef = useRef(false);
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [room, setRoom] =
    useState(null);

  const [players, setPlayers] =
    useState([]);

  const [messages, setMessages] =
    useState([]);

  const [currentColor, setCurrentColor] =
    useState("gray");

  const [gameTime, setGameTime] =
    useState(45);

  const [winner, setWinner] =
    useState(null);

  const [clicked, setClicked] =
    useState(false);

  const [gameStarted, setGameStarted] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================
  // USER CHECK
  // =========================
  useEffect(() => {

    if (!user) {

      navigate("/login");

      return;
    }

  }, []);


  // =========================
  // JOIN ROOM
  // =========================
useEffect(() => {
  if (!roomId || !user) return;

  if (joinedRef.current) return;
  joinedRef.current = true;

  socket.emit("join_room", {
    roomId,
    userId: user.srno,
    name: user.name || "Player",
  });

  return () => {
    socket.emit("leave_room", {
      roomId,
      userId: user.srno,
    });

    joinedRef.current = false;
  };
}, [roomId]);


//////
const handleGameStarted = () => {
  setGameTime(45);
  //setGameStarted(true);
  setWinner(null);
};

useEffect(() => {
  if (!roomId || !user) return;

  socket.emit("join_room", {
    roomId,
    userId: user.srno,
    name: user.name || "Player",
  });

  const handleRoomUpdate = (data) => {
    setRoom(data);
    setPlayers(data.players || []);
    setLoading(false);
  };

  const handleNewColor = (data) => {
    setCurrentColor(data.color || "gray");

    setGameTime((prev) =>
      typeof data.gameTime === "number" ? data.gameTime : prev
    );

    setGameStarted(true);
  };

  const handleScoreUpdate = (data) => {
    if (Array.isArray(data)) setPlayers(data);
  };

  const handleMessage = (msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const handleGameStarted = () => {
    setGameStarted(true);
    setWinner(null);
  };

  const handleGameEnd = (data) => {
    setWinner(data?.winner || null);
    setGameStarted(false);
    setCurrentColor("gray");
  };

  const handleError = (msg) => {
    setError(msg);
  };

  socket.off(); // 🔥 IMPORTANT: clears old duplicates

  socket.on("room_update", handleRoomUpdate);
  socket.on("new_color", handleNewColor);
  socket.on("score_update", handleScoreUpdate);
  socket.on("color:receive_message", handleMessage);
  socket.on("game_started", handleGameStarted);
  socket.on("game_ended", handleGameEnd);
  socket.on("error_message", handleError);

  return () => {
    socket.off("room_update", handleRoomUpdate);
    socket.off("new_color", handleNewColor);
    socket.off("score_update", handleScoreUpdate);
    socket.off("color:receive_message", handleMessage);
    socket.off("game_started", handleGameStarted);
    socket.off("game_ended", handleGameEnd);
    socket.off("error_message", handleError);

    socket.emit("leave_room", {
      roomId,
      userId: user.srno,
    });
  };
}, [roomId]);


  // =========================
  // START GAME
  // =========================
  const startGame = () => {

    if (gameStarted) return;

    console.log(
      "🚀 START CLICKED"
    );

    socket.emit(
      "start_game",
      {
        roomId,
      }
    );
  };


  // =========================
  // TAP COLOR
  // =========================
  const tapColor = (color) => {

    if (!gameStarted) return;

    // ANTI SPAM
    if (clicked) return;

    setClicked(true);

    console.log(
      "👆 TAPPED:",
      color
    );

    socket.emit(
      "tap_color",
      {
        roomId,
        userId: user?.srno,
        color,
      }
    );

    setTimeout(() => {

      setClicked(false);

    }, 250);
  };


  // =========================
  // TOP PLAYER
  // =========================
  const topPlayer =
    useMemo(() => {

      return [...players]
        .sort(
          (a, b) =>
            b.score -
            a.score
        )[0];

    }, [players]);


  // =========================
  // MY SCORE
  // =========================
const myPlayer = players.find(
  (p) =>
    String(p.userId) ===
    String(user?.srno)
);

const myScore =
  myPlayer?.score ?? 0;


  return (

    <div className="
      min-h-screen
      bg-black
      text-white
      pb-20
    ">

      {/* HEADER */}
      <div className="
        sticky
        top-0
        z-30
        bg-zinc-950/90
        backdrop-blur
        border-b
        border-zinc-800
        px-4
        py-4
      ">

        <div className="
          flex
          items-center
          justify-between
        ">

          <div>

            <h1 className="
              text-2xl
              md:text-4xl
              font-black
            ">

              🎮 Color Crash

            </h1>

            <p className="
              text-zinc-400
              text-sm
              mt-1
            ">

              Room ID:
              {" "}
              {roomId}

            </p>

          </div>


          {/* TIMER */}
          <div className="
            bg-zinc-900
            border
            border-zinc-700
            rounded-2xl
            px-5
            py-3
            text-center
            min-w-[110px]
          ">

            <p className="
              text-xs
              text-zinc-400
            ">
              Time Left
            </p>

            <h2 className="
              text-3xl
              font-black
              text-yellow-400
            ">

              {gameTime}s

            </h2>

          </div>

        </div>

      </div>


      {/* LOADING */}
      {loading && (

        <div className="
          flex
          items-center
          justify-center
          h-[60vh]
          text-2xl
          font-bold
        ">

          Loading Room...

        </div>
      )}


      {!loading && (

        <div className="
          max-w-7xl
          mx-auto
          p-4
          grid
          grid-cols-1
          lg:grid-cols-3
          gap-6
        ">

          {/* LEFT SIDE */}
          <div className="
            lg:col-span-2
          ">

            {/* CURRENT TARGET */}
            <div className="
              bg-zinc-900
              border
              border-zinc-800
              rounded-3xl
              p-6
              text-center
              shadow-2xl
            ">

              <p className="
                text-zinc-400
                text-lg
                tracking-wider
              ">

                TAP THIS COLOR

              </p>

              <div
                className="
                  w-44
                  h-44
                  md:w-56
                  md:h-56
                  mx-auto
                  mt-6
                  rounded-3xl
                  border-4
                  border-white
                  shadow-2xl
                  transition-all
                  duration-300
                "
                style={{
                  background:
                    currentColor,
                }}
              />

              <h2 className="
                mt-6
                text-5xl
                md:text-6xl
                font-black
                uppercase
                tracking-widest
              ">

                {currentColor}

              </h2>

            </div>


            {/* BUTTONS */}
            <div className="
              mt-6
            ">

              <ColorButtons
                tapColor={
                  tapColor
                }
              />

            </div>


            {/* GAME BUTTON */}
            {!gameStarted && (

              <button
                onClick={
                  startGame
                }
                className="
                  w-full
                  mt-6
                  bg-green-500
                  hover:bg-green-600
                  active:scale-95
                  transition-all
                  py-4
                  rounded-2xl
                  text-2xl
                  font-black
                  shadow-lg
                "
              >

                🚀 START GAME

              </button>
            )}


            {/* MY SCORE */}
            <div className="
              mt-6
              bg-zinc-900
              border
              border-zinc-800
              rounded-3xl
              p-5
              text-center
            ">

              <p className="
                text-zinc-400
              ">

                Your Score

              </p>

              <h2 className="
                text-5xl
                font-black
                mt-2
                text-yellow-400
              ">

                {myScore}

              </h2>

            </div>

          </div>


          {/* RIGHT SIDE */}
          <div className="
            space-y-6
          ">

            {/* LEADERBOARD */}
            <div className="
              bg-zinc-900
              border
              border-zinc-800
              rounded-3xl
              p-5
            ">

              <div className="
                flex
                items-center
                justify-between
                mb-4
              ">

                <h2 className="
                  text-2xl
                  font-black
                ">

                  🏆 Leaderboard

                </h2>

                {topPlayer && (

                  <div className="
                    text-yellow-400
                    font-bold
                  ">

                    👑
                    {" "}
                    {topPlayer.name}

                  </div>
                )}

              </div>

              <Leaderboard
                players={players}
              />

            </div>


            {/* CHAT */}
            <div className="
              bg-zinc-900
              border
              border-zinc-800
              rounded-3xl
              p-5
            ">

              <h2 className="
                text-2xl
                font-black
                mb-4
              ">

                💬 Live Chat

              </h2>

              <ChatBox
                roomId={roomId}
                messages={messages}
              />

            </div>

          </div>

        </div>
      )}


      {/* WINNER POPUP */}
      {winner && (

        <div className="
          fixed
          inset-0
          bg-black/90
          flex
          items-center
          justify-center
          z-50
          p-5
        ">

          <div className="
            bg-zinc-900
            border
            border-yellow-500
            p-10
            rounded-3xl
            text-center
            shadow-2xl
            max-w-md
            w-full
            animate-pulse
          ">

            <div className="
              text-8xl
            ">

              🏆

            </div>

            <h1 className="
              text-5xl
              font-black
              text-yellow-400
              mt-4
            ">

              WINNER

            </h1>

            <h2 className="
              mt-6
              text-4xl
              font-bold
            ">

              {winner?.name}

            </h2>

            <p className="
              mt-4
              text-2xl
              text-zinc-300
            ">

              Score:
              {" "}
              {winner?.score}

            </p>

            <p className="
              mt-3
              text-green-400
              text-xl
              font-bold
            ">

              +50 Coins Reward

            </p>

            <button
              onClick={() =>
                navigate("/game")
              }
              className="
                mt-8
                bg-yellow-500
                hover:bg-yellow-600
                text-black
                px-6
                py-3
                rounded-2xl
                font-black
                w-full
              "
            >

              Back To Lobby

            </button>

          </div>

        </div>
      )}

    </div>
  );
}