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
const [rewardCoins, setRewardCoins] =  useState(0);
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

  /*nst handleGameStarted = () => {
    setGameStarted(true);
    setWinner(null);
  };*/

const handleGameEnd = (data) => {
  setWinner(data?.winner || null);
  setRewardCoins(data?.rewardCoins || 0);
  setGameStarted(false);
  setCurrentColor("gray");
};

  const handleError = (msg) => {
    setError(msg);
  };

  //socket.off(); // 🔥 IMPORTANT: clears old duplicates

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
    // (gameStarted) return;
     if (gameStarted) {
    console.log("Game already started");
    return;
  }
    console.log( "🚀 START CLICKED"+roomId );
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

   <div
  className="
      min-h-screen
      bg-black
      text-white
      pb-20
    "
>
  {/* HEADER */}
  <div
    className="
        sticky
        top-0
        z-30
        bg-zinc-950/90
        backdrop-blur
        border-b
        border-zinc-800
        px-4
        py-4
      "
  >
    <div
      className="
          flex
          items-center
          justify-between
        "
    >
      <div>
        <h1
          className="
              text-2xl
              md:text-4xl
              text-white
            "
        >
          🎮 Color Crash
        </h1>

        <p
          className="
              text-zinc-400
              text-sm
              mt-1
            "
        >
          Room ID: {roomId}
        </p>
      </div>

      {/* TIMER */}
      <div
        className="
            bg-zinc-900
            border
            border-zinc-700
            rounded-2xl
            px-5
            py-3
            text-center
            min-w-[110px]
          "
      >
        <p
          className="
              text-xs
              text-zinc-400
            "
        >
          Time Left
        </p>

        <h2
          className="
              text-3xl
              font-black
              text-yellow-400
            "
        >
          {gameTime}s
        </h2>
      </div>
    </div>
  </div>

  {/* LOADING */}
  {loading && (
    <div
      className="
          flex
          items-center
          justify-center
          h-[60vh]
          text-2xl
          font-bold
        "
    >
      Loading Room...
    </div>
  )}

{!loading && (

<div className="max-w-7xl mx-auto p-3">

  {/* TOP SECTION */}
  <div className="grid grid-cols-2 gap-3">

    {/* COLOR TARGET */}
    <div
      className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        p-3
        shadow-xl
      "
    >

      <p className="text-zinc-400 text-xs mb-2">
        TAP THIS COLOR
      </p>

      <div
        className="
          w-30
          h-24
          md:w-32
          md:h-32
          mx-auto
          rounded-2xl
          border-2
          border-white
        "
        style={{
          background: currentColor
        }}
      />

      <h2
        className="
          mt-3
          text-center
          text-xl
          md:text-3xl
          font-white
          uppercase
        "
      >
        {currentColor}
      </h2>

      {/* MY SCORE */}
      <div
        className="
          mt-3
          bg-black/40
          rounded-xl
          p-2
          text-center
        "
      >

        <p className="text-zinc-400 text-xs text-white">
          Your Score
        </p>

        <h3
          className="
            text-2xl
            font-black
            text-yellow-400
          "
        >
          {myScore}
        </h3>

      </div>

    </div>


    {/* LEADERBOARD */}
    <div
      className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        p-3
        shadow-xl
      "
    >

      <div className="flex justify-between items-center mb-2">

        <h2
          className="
            text-lg
            text-white          "
        >
          🏆 Scores
        </h2>

        {topPlayer && (
          <span
            className="
              text-yellow-400
              text-xs
              font-bold
            "
          >
            👑 {topPlayer.name}
          </span>
        )}

      </div>

      <Leaderboard players={players} />

    </div>

  </div>


  {/* COLOR BUTTONS */}
  <div className="mt-3">

    <ColorButtons
      tapColor={tapColor}
    />

  </div>


  {/* START BUTTON */}
  {!gameStarted && (

    <button
      onClick={startGame}
      className="
        w-full
        mt-3
        bg-green-500
        hover:bg-green-600
        py-3
        rounded-2xl
        text-lg
        font-black
      "
    >

      🚀 START GAME

    </button>

  )}


  {/* CHAT */}
  <div
    className="
      mt-3
      bg-zinc-900
      border
      border-zinc-800
      rounded-2xl
      p-3
    "
  >

    <ChatBox
      roomId={roomId}
      messages={messages}
    />

  </div>

</div>

)}

  {/* WINNER POPUP */}
  {winner && (
    <div
      className="
          fixed
          inset-0
          bg-black/90
          flex
          items-center
          justify-center
          z-50
          p-5
        "
    >
      <div
        className="
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
          "
      >
        <div
          className="
              text-8xl
            "
        >
          🏆
        </div>

        <h1
          className="
              text-5xl
              font-black
              text-yellow-400
              mt-4
            "
        >
          WINNER
        </h1>

        <h2
          className="
              mt-6
              text-4xl
              font-bold
              text-white
            "
        >
          {winner?.name}
        </h2>

        <p
          className="
              mt-4
              text-2xl
              text-zinc-300
            "
        >
          Score: {winner?.score}
        </p>

        <p
          className="
              mt-3
              text-green-400
              text-xl
              font-bold
            "
        >
        +{winner?.rewardCoins || 0} Coins Reward
        </p>

        <button
  onClick={() => {
    setWinner(null);
    setRewardCoins(0);
  }}
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
  Play Next Round
</button>
      </div>
    </div>
  )}
</div>

  );
}