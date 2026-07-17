// ============================================================
// LudoGame.jsx — single-file Live Ludo (2/3/4 players)
// React + Vite + Tailwind
// ------------------------------------------------------------
// USAGE:
//   <LudoGame socket={socket} currentUser={{ userId }} apiBase="/api/ludo" />
//
// ASSUMPTIONS:
//   - `socket` is your ALREADY-CONNECTED socket.io-client instance
//     (reuse the one your app already opens app-wide — don't create
//     a second connection here).
//   - Your axios/fetch call to apiBase automatically attaches auth
//     (cookie / bearer token) the same way the rest of your app does.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";

const COLORS = ["red", "green", "yellow", "blue"];
const COLOR_HEX = { red: "#ef4444", green: "#22c55e", yellow: "#eab308", blue: "#3b82f6" };
const START_OFFSET = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];
 const token = localStorage.getItem("token"); // <-- your JWT
// 52-cell common track coordinates on a 15x15 grid
const PATH_COORDS = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

const HOME_COORDS = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

const BASE_SLOTS = {
  red: [[1, 1], [1, 4], [4, 1], [4, 4]],
  green: [[1, 10], [1, 13], [4, 10], [4, 13]],
  yellow: [[10, 10], [10, 13], [13, 10], [13, 13]],
  blue: [[10, 1], [10, 4], [13, 1], [13, 4]],
};

function globalIndex(color, step) {
  if (step < 1 || step > 51) return -1;
  return (START_OFFSET[color] + step - 1) % 52;
}

function getPawnCoord(color, step, pawnIdx) {
  if (step === 0) return BASE_SLOTS[color][pawnIdx];
  if (step >= 1 && step <= 51) return PATH_COORDS[globalIndex(color, step)];
  if (step >= 52 && step <= 57) return HOME_COORDS[color][step - 52];
  return [7, 7];
}

function Cell({ row, col, bg, border }) {
  return (
    <div
      className="absolute"
      style={{
        top: `${(row / 15) * 100}%`,
        left: `${(col / 15) * 100}%`,
        width: `${100 / 15}%`,
        height: `${100 / 15}%`,
        background: bg,
        border: border || "1px solid #d1d5db",
        boxSizing: "border-box",
      }}
    />
  );
}

function Pawn({ row, col, color, onClick, clickable, stackIndex = 0 }) {
  const offset = stackIndex * 4;
  return (
    <div
      onClick={onClick}
      className={`absolute rounded-full border-2 border-white shadow-md flex items-center justify-center ${
        clickable ? "cursor-pointer animate-bounce ring-2 ring-white" : ""
      }`}
      style={{
        top: `calc(${(row / 15) * 100}% + ${offset}%)`,
        left: `calc(${(col / 15) * 100}% + ${offset}%)`,
        width: `${100 / 15 - 2}%`,
        height: `${100 / 15 - 2}%`,
        background: COLOR_HEX[color],
        zIndex: 10 + stackIndex,
        transition: "top 0.3s ease, left 0.3s ease",
      }}
    />
  );
}

function buildBoardCells() {
  const cells = [];
  // 4 base quadrants
  cells.push(
    <div
      key="base-red"
      className="absolute rounded-md"
      style={{ top: "0%", left: "0%", width: "40%", height: "40%", background: "#fee2e2" }}
    />
  );
  cells.push(
    <div
      key="base-green"
      className="absolute rounded-md"
      style={{ top: "0%", left: "60%", width: "40%", height: "40%", background: "#dcfce7" }}
    />
  );
  cells.push(
    <div
      key="base-yellow"
      className="absolute rounded-md"
      style={{ top: "60%", left: "60%", width: "40%", height: "40%", background: "#fef9c3" }}
    />
  );
  cells.push(
    <div
      key="base-blue"
      className="absolute rounded-md"
      style={{ top: "60%", left: "0%", width: "40%", height: "40%", background: "#dbeafe" }}
    />
  );
  // center home triangle area
  cells.push(
    <div
      key="center"
      className="absolute flex items-center justify-center text-xs font-bold"
      style={{ top: `${(6 / 15) * 100}%`, left: `${(6 / 15) * 100}%`, width: `${(3 / 15) * 100}%`, height: `${(3 / 15) * 100}%`, background: "#fbbf24" }}
    >
      HOME
    </div>
  );
  // common path cells
  PATH_COORDS.forEach(([r, c], i) => {
    cells.push(
      <Cell
        key={`path-${i}`}
        row={r}
        col={c}
        bg={SAFE_CELLS.includes(i) ? "#e5e7eb" : "#ffffff"}
      />
    );
  });
  // home stretch cells
  COLORS.forEach((color) => {
    HOME_COORDS[color].forEach(([r, c], i) => {
      cells.push(<Cell key={`${color}-home-${i}`} row={r} col={c} bg={COLOR_HEX[color] + "55"} />);
    });
  });
  return cells;
}

export default function LudoGame({ socket, apiBase = "/api/ludo" }) {
  //console.log(currentUser);
  const currentUser = localStorage.getItem("user");
  const [screen, setScreen] = useState("lobby"); // lobby | waiting | playing | over
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [myColor, setMyColor] = useState(null);
  const [state, setState] = useState(null); // { players, turnColor, status, lastDice }
  const [dice, setDice] = useState(null);
  const [movablePawns, setMovablePawns] = useState([]);
  const [error, setError] = useState("");
  const [winner, setWinner] = useState(null);
  const boardCells = useMemo(buildBoardCells, []);

  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;

  useEffect(() => {
    if (!socket) return;

    const onState = (s) => {
      setState(s);
      setScreen(s.status === "waiting" ? "waiting" : s.status === "playing" ? "playing" : "over");
    };
    const onDice = ({ color, dice, movablePawns }) => {
      setDice(dice);
      if (color === myColor) setMovablePawns(movablePawns);
      else setMovablePawns([]);
    };
    const onMoveMade = ({ state: s }) => {
      setState(s);
      setMovablePawns([]);
    };
    const onTurnChanged = () => {
      setDice(null);
      setMovablePawns([]);
    };
    const onGameOver = ({ winnerUserId, winnerColor }) => {
      setWinner({ userId: winnerUserId, color: winnerColor });
      setScreen("over");
    };
    const onError = ({ message }) => setError(message);

    socket.on("ludo:state", onState);
    socket.on("ludo:diceRolled", onDice);
    socket.on("ludo:moveMade", onMoveMade);
    socket.on("ludo:turnChanged", onTurnChanged);
    socket.on("ludo:gameOver", onGameOver);
    socket.on("ludo:error", onError);

    return () => {
      socket.off("ludo:state", onState);
      socket.off("ludo:diceRolled", onDice);
      socket.off("ludo:moveMade", onMoveMade);
      socket.off("ludo:turnChanged", onTurnChanged);
      socket.off("ludo:gameOver", onGameOver);
      socket.off("ludo:error", onError);
    };
  }, [socket, myColor]);

  async function createRoom() {
    setError("");
    const res = await fetch(`${apiBase}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json",  Authorization: `Bearer ${token}` },
      
      body: JSON.stringify({ maxPlayers }),
    }).then((r) => r.json());
    if (!res.success) return setError(res.message);
    await joinRoomByCode(res.roomCode);
  }

  async function joinRoomByCode(code) {
    setError("");
    const res = await fetch(`${apiBase}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" ,  Authorization: `Bearer ${token}`},
      body: JSON.stringify({ roomCode: code }),
    }).then((r) => r.json());
    if (!res.success) return setError(res.message);

    setRoomCode(code);
    setMyColor(res.color);
    setState(res.state);
    setScreen(res.state.status === "waiting" ? "waiting" : "playing");
    socket.emit("ludo:joinSocket", { roomCode: code });
  }

  function rollDice() {
    socket.emit("ludo:rollDice", { roomCode: roomCodeRef.current });
  }

  function movePawn(pawnIndex) {
    if (!movablePawns.includes(pawnIndex)) return;
    socket.emit("ludo:movePawn", { roomCode: roomCodeRef.current, pawnIndex });
  }

  const isMyTurn = state && state.turnColor === myColor;

  // ---------------- LOBBY ----------------
  if (screen === "lobby") {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg mt-8">
        <h1 className="text-2xl font-bold text-center mb-1">Live Ludo</h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Entry 20 coins &middot; Winner gets 500 coins
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Players</label>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setMaxPlayers(n)}
                className={`flex-1 py-2 rounded-xl border font-semibold ${
                  maxPlayers === n ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={createRoom}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold mb-4 hover:bg-indigo-700"
        >
          Create Room
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR JOIN WITH CODE</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex gap-2">
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2"
          />
          <button
            onClick={() => joinRoomByCode(roomCode)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            Join
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    );
  }

  // ---------------- WAITING ROOM ----------------
  if (screen === "waiting") {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg mt-8 text-center">
        <h2 className="text-xl font-bold mb-2">Waiting for players…</h2>
        <p className="text-gray-500 mb-4">
          Room code: <span className="font-mono font-bold">{roomCode}</span>
        </p>
        <div className="flex justify-center gap-3 mb-4">
          {state?.players.map((p) => (
            <div
              key={p.userId}
              className="w-10 h-10 rounded-full border-2 border-white shadow"
              style={{ background: COLOR_HEX[p.color] }}
            />
          ))}
          {Array.from({ length: (state?.maxPlayers || maxPlayers) - (state?.players.length || 0) }).map(
            (_, i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300" />
            )
          )}
        </div>
        <p className="text-sm text-gray-400">Share the room code with friends to start.</p>
      </div>
    );
  }

  // ---------------- GAME OVER ----------------
  if (screen === "over") {
    const won = winner?.userId === currentUser?.srno;
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg mt-8 text-center">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4"
          style={{ background: COLOR_HEX[winner?.color || "red"] }}
        />
        <h2 className="text-2xl font-bold mb-2">{won ? "You Won! 🎉" : "Game Over"}</h2>
        <p className="text-gray-500 mb-6">
          {won ? "500 coins have been credited to your wallet." : `${winner?.color?.toUpperCase()} player won the game.`}
        </p>
        <button
          onClick={() => {
            setScreen("lobby");
            setState(null);
            setWinner(null);
            setRoomCode("");
          }}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
        >
          Play Again
        </button>
      </div>
    );
  }

  // ---------------- PLAYING ----------------
  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {state?.players.map((p) => (
            <div
              key={p.userId}
              className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                state.turnColor === p.color ? "ring-2 ring-offset-2 ring-black" : "opacity-60"
              }`}
              style={{ background: COLOR_HEX[p.color] }}
            >
              {p.color.toUpperCase()}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-400 font-mono">{roomCode}</span>
      </div>

      <div className="relative w-full aspect-square bg-gray-50 rounded-xl border-2 border-gray-300 overflow-hidden shadow-inner">
        {boardCells}
        {state?.players.map((p) =>
          p.pawns.map((step, idx) => {
            const [row, col] = getPawnCoord(p.color, step, idx);
            const clickable = isMyTurn && p.color === myColor && movablePawns.includes(idx);
            return (
              <Pawn
                key={`${p.color}-${idx}`}
                row={row}
                col={col}
                color={p.color}
                stackIndex={idx % 2}
                clickable={clickable}
                onClick={() => clickable && movePawn(idx)}
              />
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm">
          {isMyTurn ? (
            <span className="font-semibold text-emerald-600">Your turn</span>
          ) : (
            <span className="text-gray-400">Waiting for {state?.turnColor}…</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center text-xl font-bold shadow">
            {dice ?? "-"}
          </div>
          <button
            onClick={rollDice}
            disabled={!isMyTurn || dice != null}
            className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700"
          >
            Roll Dice
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
