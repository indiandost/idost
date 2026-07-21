// ============================================================
// LudoGame.jsx — single-file Live Ludo (2/3/4 players)
// React + Vite + Tailwind
// ------------------------------------------------------------
// USAGE:
//   <LudoGame socket={socket} apiBase="/api/ludo" />
//
// ASSUMPTIONS:
//   - `socket` is your ALREADY-CONNECTED socket.io-client instance
//     (reuse the one your app already opens app-wide — don't create
//     a second connection here).
//   - IMPORTANT: wherever that socket is created (io(url, {...})),
//     make sure you pass the JWT so the backend can authenticate the
//     socket the same way it authenticates REST calls:
//
//       const socket = io(SOCKET_URL, {
//         auth: { token: localStorage.getItem("token") },
//       });
//
//     Without this, the backend has no reliable way to know which
//     user a given socket belongs to.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";

// localStorage key used to remember "I'm currently in an active Ludo
// room" across accidental navigation / app backgrounding / component
// remounts — without this, leaving the page even briefly loses all
// context and the player would have to re-enter a room code manually
// (or worse, might create a fresh room and pay the entry fee again).
const LUDO_ACTIVE_ROOM_KEY = "ludo_active_room";

const COLORS = ["red", "green", "yellow", "blue"];

const COLOR_THEME = {
  red: {
    base: "#ef4444",
    dark: "#7f1d1d",
    grad: "linear-gradient(145deg, #f87171, #dc2626)",
    glow: "rgba(239,68,68,0.55)",
    yardBg: "linear-gradient(160deg, #4c1414, #2a0a0a)",
    yardBorder: "rgba(239,68,68,0.35)",
  },
  green: {
    base: "#22c55e",
    dark: "#14532d",
    grad: "linear-gradient(145deg, #4ade80, #16a34a)",
    glow: "rgba(34,197,94,0.55)",
    yardBg: "linear-gradient(160deg, #123420, #081c11)",
    yardBorder: "rgba(34,197,94,0.35)",
  },
  yellow: {
    base: "#eab308",
    dark: "#713f12",
    grad: "linear-gradient(145deg, #fde047, #ca8a04)",
    glow: "rgba(234,179,8,0.55)",
    yardBg: "linear-gradient(160deg, #3a2c08, #1f1704)",
    yardBorder: "rgba(234,179,8,0.35)",
  },
  blue: {
    base: "#3b82f6",
    dark: "#1e3a8a",
    grad: "linear-gradient(145deg, #60a5fa, #2563eb)",
    glow: "rgba(59,130,246,0.55)",
    yardBg: "linear-gradient(160deg, #10203f, #071021)",
    yardBorder: "rgba(59,130,246,0.35)",
  },
};

const START_OFFSET = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// Active-room persistence — survives accidental navigation, app
// backgrounding, or the component fully unmounting/remounting.
// ------------------------------------------------------------
function saveActiveRoom(roomCode) {
  try {
    localStorage.setItem(LUDO_ACTIVE_ROOM_KEY, roomCode);
  } catch (e) {
    console.log("Could not persist active room:", e);
  }
}
function loadActiveRoom() {
  try {
    return localStorage.getItem(LUDO_ACTIVE_ROOM_KEY);
  } catch {
    return null;
  }
}
function clearActiveRoom() {
  try {
    localStorage.removeItem(LUDO_ACTIVE_ROOM_KEY);
  } catch (e) {
    console.log("Could not clear active room:", e);
  }
}

// 52-cell common track coordinates on a 15x15 grid — used for actual
// pawn ring positions (verified: 52 distinct cells, correct start/safe
// cell alignment). Consecutive entries occasionally step diagonally at
// the 4 board corners — that's fine, pawns animate cell-to-cell, they
// don't render a connecting line, so it's visually invisible.
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

// The 4 corner cells of the center cross (visually needed to fill the
// board completely — not used for pawn ring positions, purely background).
const CORNER_FILLER_CELLS = [[6, 6], [6, 8], [8, 8], [8, 6]];

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

const GRID = 15;
const CELL_PCT = 100 / GRID;

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

// ------------------------------------------------------------
// Static background cell (fills exactly one grid square)
// ------------------------------------------------------------
function Cell({ row, col, bg, isSafe }) {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        top: `${row * CELL_PCT}%`,
        left: `${col * CELL_PCT}%`,
        width: `${CELL_PCT}%`,
        height: `${CELL_PCT}%`,
        background: bg,
        border: "1px solid rgba(255,255,255,0.05)",
        boxSizing: "border-box",
      }}
    >
      {isSafe && (
        <span style={{ fontSize: "0.5rem", opacity: 0.6 }}>★</span>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Pawn token — properly CENTERED within its cell (this was the bug):
// a pawn smaller than the cell needs half the leftover space added
// as an offset, not just placed at the cell's top-left corner.
// ------------------------------------------------------------
function Pawn({ row, col, color, onClick, clickable, stackIndex = 0, stackTotal = 1 }) {
  const theme = COLOR_THEME[color];

  // when alone in a cell: big pawn, dead-center.
  // when sharing a cell with others: shrink + arrange in a 2x2 sub-grid
  // so multiple tokens on the same square are all visible.
  const sizePct = stackTotal > 1 ? CELL_PCT * 0.46 : CELL_PCT * 0.72;
  const subRow = stackTotal > 1 ? Math.floor(stackIndex / 2) : 0;
  const subCol = stackTotal > 1 ? stackIndex % 2 : 0;
  const subOffsetY = stackTotal > 1 ? subRow * (CELL_PCT * 0.48) : 0;
  const subOffsetX = stackTotal > 1 ? subCol * (CELL_PCT * 0.48) : 0;

  const centerOffset = (CELL_PCT - sizePct) / 2;

  return (
    <div
      onClick={onClick}
      className={clickable ? "cursor-pointer" : ""}
      style={{
        position: "absolute",
        top: `${row * CELL_PCT + centerOffset - (stackTotal > 1 ? CELL_PCT * 0.24 : 0) + subOffsetY}%`,
        left: `${col * CELL_PCT + centerOffset - (stackTotal > 1 ? CELL_PCT * 0.24 : 0) + subOffsetX}%`,
        width: `${sizePct}%`,
        height: `${sizePct}%`,
        borderRadius: "50%",
        background: theme.grad,
        border: "2px solid rgba(255,255,255,0.85)",
        boxShadow: clickable
          ? `0 0 0 3px ${theme.glow}, 0 0 14px ${theme.glow}, 0 2px 6px rgba(0,0,0,0.5)`
          : "0 2px 5px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.4)",
        zIndex: 20 + stackIndex,
        transition: "top 0.35s ease, left 0.35s ease, box-shadow 0.2s ease",
        animation: clickable ? "ludoPawnPulse 1s ease-in-out infinite" : "none",
      }}
    />
  );
}

function buildBoardCells() {
  const cells = [];

  // yards
  const yardStyle = (theme, top, left) => ({
    position: "absolute",
    top: `${top}%`,
    left: `${left}%`,
    width: "40%",
    height: "40%",
    background: theme.yardBg,
    border: `1px solid ${theme.yardBorder}`,
    borderRadius: "18px",
    boxShadow: `inset 0 0 30px rgba(0,0,0,0.4)`,
  });

  cells.push(<div key="yard-red" style={yardStyle(COLOR_THEME.red, 0, 0)} />);
  cells.push(<div key="yard-green" style={yardStyle(COLOR_THEME.green, 0, 60)} />);
  cells.push(<div key="yard-yellow" style={yardStyle(COLOR_THEME.yellow, 60, 60)} />);
  cells.push(<div key="yard-blue" style={yardStyle(COLOR_THEME.blue, 60, 0)} />);

  // parking-slot dimples inside each yard (purely decorative)
  Object.entries(BASE_SLOTS).forEach(([color, slots]) => {
    slots.forEach(([r, c], i) => {
      cells.push(
        <div
          key={`slot-${color}-${i}`}
          style={{
            position: "absolute",
            top: `${r * CELL_PCT + CELL_PCT * 0.15}%`,
            left: `${c * CELL_PCT + CELL_PCT * 0.15}%`,
            width: `${CELL_PCT * 1.7}%`,
            height: `${CELL_PCT * 1.7}%`,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.35)",
            border: `1px dashed ${COLOR_THEME[color].yardBorder}`,
          }}
        />
      );
    });
  });

  // center HOME hub
  cells.push(
    <div
      key="center"
      className="absolute flex items-center justify-center"
      style={{
        top: `${6 * CELL_PCT}%`,
        left: `${6 * CELL_PCT}%`,
        width: `${3 * CELL_PCT}%`,
        height: `${3 * CELL_PCT}%`,
        background:
          "conic-gradient(from 0deg, #ef4444 0deg 90deg, #22c55e 90deg 180deg, #eab308 180deg 270deg, #3b82f6 270deg 360deg)",
        borderRadius: "6px",
        boxShadow: "0 0 20px rgba(255,255,255,0.25)",
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>🏆</span>
    </div>
  );

  // ring path cells
  PATH_COORDS.forEach(([r, c], i) => {
    const isStart = [0, 13, 26, 39].includes(i);
    let bg = "#111827";
    let colorForCell = null;
    COLORS.forEach((color) => {
      if (isStart && START_OFFSET[color] === i) colorForCell = color;
    });
    if (colorForCell) {
      bg = COLOR_THEME[colorForCell].dark;
    } else if (SAFE_CELLS.includes(i)) {
      bg = "#1f2937";
    }
    cells.push(
      <Cell key={`path-${i}`} row={r} col={c} bg={bg} isSafe={SAFE_CELLS.includes(i)} />
    );
  });

  // corner filler cells (visual completeness only, not used for pawn positions)
  CORNER_FILLER_CELLS.forEach(([r, c], i) => {
    cells.push(<Cell key={`corner-${i}`} row={r} col={c} bg="#111827" />);
  });

  // home-stretch lanes
  COLORS.forEach((color) => {
    HOME_COORDS[color].forEach(([r, c], i) => {
      cells.push(
        <Cell
          key={`${color}-home-${i}`}
          row={r}
          col={c}
          bg={`linear-gradient(145deg, ${COLOR_THEME[color].base}55, ${COLOR_THEME[color].base}22)`}
        />
      );
    });
  });

  return cells;
}

export default function LudoGame({ socket, apiBase = "/api/ludo" }) {
  const currentUser = useMemo(() => getCurrentUser(), []);

  const [screen, setScreen] = useState("lobby"); // lobby | waiting | playing | over
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [myColor, setMyColor] = useState(null);
  const [state, setState] = useState(null);
  const [dice, setDice] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [movablePawns, setMovablePawns] = useState([]);
  const [error, setError] = useState("");
  const [winner, setWinner] = useState(null);
  const [connectionLost, setConnectionLost] = useState(false);
  const [checkingRejoin, setCheckingRejoin] = useState(true);
  const boardCells = useMemo(buildBoardCells, []);

  const roomCodeRef = useRef(roomCode);
  roomCodeRef.current = roomCode;

  const myColorRef = useRef();
  useEffect(() => {
    myColorRef.current = myColor;
  }, [myColor]);

  // gameActiveRef mirrors "am I currently mid-game" for use inside
  // event listeners (beforeunload / popstate / click) that shouldn't
  // re-subscribe on every state change — same pattern used elsewhere
  // in this app for the color-crash game screen guard.
  const gameActiveRef = useRef(false);
  useEffect(() => {
    gameActiveRef.current = screen === "playing" || screen === "waiting";
  }, [screen]);

  // ------------------------------------------------------------
  // AUTO-REJOIN: on mount, if a room was left mid-game (accidental
  // nav, phone call, app backgrounded and remounted), silently
  // rejoin it instead of dropping the player back to an empty lobby.
  // ------------------------------------------------------------
  useEffect(() => {
    const savedRoom = loadActiveRoom();
    if (savedRoom) {
      joinRoomByCode(savedRoom, true).finally(() => setCheckingRejoin(false));
    } else {
      setCheckingRejoin(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------
  // CONNECTION LOSS — show a "reconnecting" overlay instead of a
  // silently frozen board when the socket drops mid-game (network
  // blip, app backgrounded for a call, etc.), and clear it once the
  // socket reconnects and the room is re-synced.
  // ------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const onDisconnect = () => {
      if (gameActiveRef.current) setConnectionLost(true);
    };
    const onReconnected = () => {
      setConnectionLost(false);
    };

    socket.on("disconnect", onDisconnect);
    // fires after onConnect's re-join succeeds and fresh ludo:state arrives
    socket.on("ludo:state", onReconnected);

    return () => {
      socket.off("disconnect", onDisconnect);
      socket.off("ludo:state", onReconnected);
    };
  }, [socket]);

  // ------------------------------------------------------------
  // NAVIGATION GUARD — warn before leaving mid-game so a stray
  // back-button press or bottom-nav tap doesn't silently abandon
  // a room the player already paid an entry fee for.
  // ------------------------------------------------------------
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (gameActiveRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const blockBack = () => {
      if (gameActiveRef.current) {
        const leave = window.confirm(
          "Game abhi chal raha hai! Is page se jaane par aap turn miss kar sakte hain — game background me chalta rahega. Continue?"
        );
        if (!leave) {
          window.history.pushState(null, "", window.location.href);
        }
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", blockBack);
    return () => window.removeEventListener("popstate", blockBack);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onState = (s) => {
      setState(s);
      setScreen(s.status === "waiting" ? "waiting" : s.status === "playing" ? "playing" : "over");
    };

    const onDice = ({ color, dice, movablePawns }) => {
      setRolling(false);
      setDice(dice);
      if (color === myColor) setMovablePawns(movablePawns);
      else setMovablePawns([]);
    };

    const onMoveMade = ({ state: s }) => {
      setState(s);
    };

    const onTurnChanged = ({ turnColor }) => {
      setDice(null);
      setMovablePawns([]);
      setState((prev) => (prev ? { ...prev, turnColor } : prev));
    };

    const onGameOver = ({ winnerUserId, winnerColor }) => {
      setWinner({ userId: winnerUserId, color: winnerColor });
      setScreen("over");
    };

    const onError = ({ message }) => {
      setRolling(false);
      setError(message);
    };

    const onConnect = () => {
      if (roomCodeRef.current) {
        socket.emit("ludo:joinSocket", { roomCode: roomCodeRef.current });
      }
    };

    socket.on("connect", onConnect);
    socket.on("ludo:state", onState);
    socket.on("ludo:diceRolled", onDice);
    socket.on("ludo:moveMade", onMoveMade);
    socket.on("ludo:turnChanged", onTurnChanged);
    socket.on("ludo:gameOver", onGameOver);
    socket.on("ludo:error", onError);

    return () => {
      socket.off("connect", onConnect);
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
    try {
      const res = await fetch(`${apiBase}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ maxPlayers }),
      }).then((r) => r.json());

      if (!res.success) return setError(res.message);
      await joinRoomByCode(res.roomCode);
    } catch (err) {
      console.error("createRoom error:", err);
      setError("Could not create room");
    }
  }

  async function joinRoomByCode(code, silent = false) {
    if (!silent) setError("");
    try {
      const res = await fetch(`${apiBase}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ roomCode: code }),
      }).then((r) => r.json());

      if (!res.success) {
        // silent rejoin attempt failed (room ended / already finished
        // while we were away) — just clear the stale pointer and let
        // the player land on a normal lobby instead of showing an error
        if (silent) {
          clearActiveRoom();
          return;
        }
        return setError(res.message);
      }

      setRoomCode(code);
      setMyColor(res.color);
      setState(res.state);
      setScreen(res.state.status === "waiting" ? "waiting" : "playing");
      socket.emit("ludo:joinSocket", { roomCode: code });
      saveActiveRoom(code);
    } catch (err) {
      console.error("joinRoomByCode error:", err);
      if (!silent) setError("Could not join room");
    }
  }

  function rollDice() {
    setRolling(true);
    setError("");
    socket.emit("ludo:rollDice", { roomCode: roomCodeRef.current });
  }

  function movePawn(pawnIndex) {
    if (!movablePawns.includes(pawnIndex)) return;
    socket.emit("ludo:movePawn", { roomCode: roomCodeRef.current, pawnIndex });
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      alert("✅ Room code copied!");
    } catch (err) {
      console.log(err);
      alert("Unable to copy.");
    }
  };

  const isMyTurn = state && state.turnColor === myColor;

  // ------------------------------------------------------------
  // build a lookup of pawn stacking so multiple tokens on the same
  // square render as a visible 2x2 cluster instead of overlapping
  // ------------------------------------------------------------
  const stackMap = useMemo(() => {
    if (!state?.players) return {};
    const map = {};
    state.players.forEach((p) => {
      p.pawns.forEach((step, idx) => {
        const [row, col] = getPawnCoord(p.color, step, idx);
        const key = `${row}-${col}`;
        if (!map[key]) map[key] = [];
        map[key].push({ color: p.color, idx });
      });
    });
    return map;
  }, [state]);

  // ---------------- SHARED STYLES ----------------
  const pageWrap = "min-h-screen bg-black text-white flex items-center justify-center px-4 py-8";
  const cardWrap =
    "max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6";

  // ---------------- CHECKING FOR AN IN-PROGRESS ROOM ----------------
  // Brief loading state while we check localStorage + ping the backend
  // for a room this player might already be in — avoids a flash of the
  // "Create Room" lobby right before silently jumping into the game.
  if (checkingRejoin) {
    return (
      <div className={pageWrap}>
        <div className="text-zinc-500 text-sm flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-400 rounded-full animate-spin" />
          Checking for an active game…
        </div>
      </div>
    );
  }

  // ---------------- LOBBY ----------------
  if (screen === "lobby") {
    return (
      <div className={pageWrap}>
        <div className={cardWrap}>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎲</div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              Live Ludo
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Entry <span className="text-amber-400 font-semibold">20 coins</span> · Winner gets{" "}
              <span className="text-amber-400 font-semibold">500 coins</span>
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-zinc-400 tracking-wide uppercase mb-2">
              Players
            </label>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold transition ${
                    maxPlayers === n
                      ? "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white border-transparent shadow-lg"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={createRoom}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black shadow-lg active:scale-95 transition mb-5"
          >
            🚀 Create Room
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] tracking-widest text-zinc-500 font-semibold">
              OR JOIN WITH CODE
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div className="flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => joinRoomByCode(roomCode)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold active:scale-95 transition"
            >
              Join
            </button>
          </div>

          {error && (
            <p className="text-rose-400 text-sm mt-4 text-center">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // ---------------- WAITING ROOM ----------------
  if (screen === "waiting") {
    return (
      <div className={pageWrap}>
        <div className={`${cardWrap} text-center`}>
          <div className="text-4xl mb-2">⏳</div>
          <h2 className="text-xl font-bold mb-4">Waiting for players…</h2>

          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-zinc-500 text-sm">Room Code:</span>
            <button
              onClick={copyRoomCode}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-mono font-bold text-indigo-400 transition"
              title="Click to copy"
            >
              {roomCode}
            </button>
            <button
              onClick={copyRoomCode}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition"
              title="Copy"
            >
              📋
            </button>
          </div>

          <div className="flex justify-center gap-3 mb-5">
            {state?.players.map((p) => (
              <div
                key={p.userId}
                className="w-12 h-12 rounded-full border-2 border-zinc-700 shadow-lg flex items-center justify-center text-xs font-bold"
                style={{ background: COLOR_THEME[p.color].grad }}
                title={p.color}
              >
                {p.userId === currentUser?.srno ? "YOU" : ""}
              </div>
            ))}
            {Array.from({
              length: (state?.maxPlayers || maxPlayers) - (state?.players.length || 0),
            }).map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-700"
              />
            ))}
          </div>

          <p className="text-sm text-zinc-500">Share the room code with friends to start.</p>
          {error && <p className="text-rose-400 text-sm mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  // ---------------- GAME OVER ----------------
  if (screen === "over") {
    const won = winner?.userId === currentUser?.srno;
    return (
      <div className={pageWrap}>
        <div className={`${cardWrap} text-center`}>
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl shadow-2xl"
            style={{
              background: COLOR_THEME[winner?.color || "red"].grad,
              boxShadow: `0 0 40px ${COLOR_THEME[winner?.color || "red"].glow}`,
            }}
          >
            {won ? "👑" : "🎲"}
          </div>
          <h2 className="text-2xl font-black mb-2">
            {won ? "You Won! 🎉" : "Game Over"}
          </h2>
          <p className="text-zinc-400 mb-6">
            {won
              ? "500 coins have been credited to your wallet."
              : `${winner?.color?.toUpperCase()} player won the game.`}
          </p>
          <button
            onClick={() => {
              clearActiveRoom();
              setScreen("lobby");
              setState(null);
              setWinner(null);
              setRoomCode("");
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black active:scale-95 transition"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // ---------------- PLAYING ----------------
  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <div className="max-w-lg mx-auto px-4 pt-5">
        {/* TURN STRIP */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            {state?.players.map((p) => {
              const active = state.turnColor === p.color;
              return (
                <div
                  key={p.userId}
                  className="px-3 py-1.5 rounded-full text-[11px] font-black text-white flex items-center gap-1"
                  style={{
                    background: COLOR_THEME[p.color].grad,
                    boxShadow: active ? `0 0 0 2px white, 0 0 14px ${COLOR_THEME[p.color].glow}` : "none",
                    opacity: active ? 1 : 0.55,
                  }}
                >
                  {active && <span className="animate-pulse">●</span>}
                  {p.color.toUpperCase()}
                  {p.color === myColor && <span className="opacity-80">(you)</span>}
                </div>
              );
            })}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">{roomCode}</span>
        </div>

        {/* BOARD */}
        <div
          className="relative w-full aspect-square rounded-2xl border-2 overflow-hidden shadow-2xl"
          style={{
            background: "#0a0b16",
            borderColor: "rgba(99,102,241,0.35)",
            boxShadow: "0 0 40px rgba(99,102,241,0.15)",
          }}
        >
          {boardCells}

          {state?.players.map((p) =>
            p.pawns.map((step, idx) => {
              const [row, col] = getPawnCoord(p.color, step, idx);
              const key = `${row}-${col}`;
              const group = stackMap[key] || [];
              const stackTotal = group.length;
              const stackIndex = group.findIndex(
                (g) => g.color === p.color && g.idx === idx
              );
              const clickable =
                isMyTurn && p.color === myColor && movablePawns.includes(idx);

              return (
                <Pawn
                  key={`${p.color}-${idx}`}
                  row={row}
                  col={col}
                  color={p.color}
                  stackIndex={stackIndex === -1 ? 0 : stackIndex}
                  stackTotal={stackTotal || 1}
                  clickable={clickable}
                  onClick={() => clickable && movePawn(idx)}
                />
              );
            })
          )}
        </div>

        {/* CONTROLS */}
        <div className="flex items-center justify-between mt-5">
          <div>
            {isMyTurn ? (
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Your turn
              </span>
            ) : (
              <span className="text-zinc-500 text-sm">
                Waiting for <b className="text-zinc-300">{state?.turnColor}</b>…
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Dice value={dice} rolling={rolling} />
            <button
              onClick={rollDice}
              disabled={!isMyTurn || dice != null || rolling}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-bold disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed active:scale-95 transition"
            >
              {rolling ? "Rolling…" : "Roll Dice"}
            </button>
          </div>
        </div>

        {error && <p className="text-rose-400 text-sm mt-3 text-center">{error}</p>}
      </div>

      {/* PAUSED / RECONNECTING OVERLAY — shown when the socket drops
          mid-game (app backgrounded for a call, network blip, etc.).
          The room itself stays alive server-side; this just tells the
          player clearly what's happening instead of a frozen board. */}
      {connectionLost && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-12 h-12 border-4 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
          <h2 className="text-lg font-bold">Connection paused</h2>
          <p className="text-zinc-400 text-sm max-w-xs">
            Aapka game background me safe hai. Wapas connect hote hi board apne aap sync ho jayega.
          </p>
        </div>
      )}

      <style>{`
        @keyframes ludoPawnPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes ludoDiceRoll {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------
// Dice with real pip faces instead of a plain number
// ------------------------------------------------------------
function Dice({ value, rolling }) {
  const PIP_LAYOUTS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const active = PIP_LAYOUTS[value] || [];

  return (
    <div
      className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-lg"
      style={{
        animation: rolling ? "ludoDiceRoll 0.5s linear infinite" : "none",
      }}
    >
      {value == null && !rolling && (
        <span className="text-zinc-300 text-xl">?</span>
      )}
      {(value != null || rolling) && (
        <div className="grid grid-cols-3 grid-rows-3 gap-[3px] w-9 h-9">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                background: active.includes(i) ? "#18181b" : "transparent",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
