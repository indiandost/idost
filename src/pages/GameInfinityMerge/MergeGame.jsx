import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const SIZE = 4;

export default function MergeGame() {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState({});
  const [sessionToken, setSessionToken] = useState("");

  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [highestTile, setHighestTile] = useState(2);
  const [duration, setDuration] = useState(0);
  const [entryFee, setEntryFee] = useState(0);

  // last-submit result (for reward/rank banner)
  const [lastResult, setLastResult] = useState(null);

  const [board, setBoard] = useState(
    Array(SIZE).fill(null).map(() => Array(SIZE).fill(0))
  );

  // ---------- initial load ----------
  useEffect(() => {
    loadPage();
  }, []);

  // ---------- timer ----------
  useEffect(() => {
    if (!started || gameOver) return;
    const t = setInterval(() => {
      setDuration((v) => v + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [started, gameOver]);

  async function loadPage() {
    try {
      const lb = await axios.get(`${API}/api/merge/leaderboard`);
      // ✅ FIX: controller { success, leaderboard: [...] } bhejta hai — array unwrap karna zaroori hai
      setLeaderboard(lb.data?.leaderboard || []);

      const me = await axios.get(`${API}/api/merge/me`, {
        headers: { Authorization: `Bearer ${token}` }, // ✅ FIX: stray "S" hataya
      });
      setMyStats(me.data);
      // ✅ FIX: controller bestScore (camelCase) bhejta hai, best_score nahi
      setBestScore(me.data?.bestScore || 0);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  }

  // ---------- board helpers ----------
  function getEmptyCells(grid) {
    const cells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) cells.push({ r, c });
      }
    }
    return cells;
  }

  function spawnRandomTile(grid) {
    const empty = getEmptyCells(grid);
    if (empty.length === 0) return grid;
    const randomCell = empty[Math.floor(Math.random() * empty.length)];
    grid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return grid;
  }

  function createNewBoard() {
    let grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
    grid = spawnRandomTile(grid);
    grid = spawnRandomTile(grid);
    return grid;
  }

  function cloneBoard(b) {
    return b.map((row) => [...row]);
  }

  function compress(row) {
    const filtered = row.filter((v) => v !== 0);
    while (filtered.length < SIZE) filtered.push(0);
    return filtered;
  }

  function merge(row) {
    let gained = 0;
    row = compress(row);

    for (let i = 0; i < SIZE - 1; i++) {
      if (row[i] !== 0 && row[i] === row[i + 1]) {
        row[i] *= 2;
        gained += row[i];
        row[i + 1] = 0;
      }
    }

    row = compress(row);
    return { row, gained };
  }

  function reverseBoardRows(grid) {
    return grid.map((row) => [...row].reverse());
  }

  function transpose(grid) {
    const result = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        result[c][r] = grid[r][c];
      }
    }
    return result;
  }

  function executeLeft(grid) {
    let changed = false;
    let totalScore = 0;
    const newBoard = cloneBoard(grid);

    for (let r = 0; r < SIZE; r++) {
      const before = [...newBoard[r]];
      const result = merge(newBoard[r]);
      newBoard[r] = result.row;
      totalScore += result.gained;

      if (JSON.stringify(before) !== JSON.stringify(result.row)) {
        changed = true;
      }
    }

    return { board: newBoard, changed, score: totalScore };
  }

  // is there any legal move left on this grid?
  function canMove(grid) {
    if (getEmptyCells(grid).length > 0) return true;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = grid[r][c];
        if (c < SIZE - 1 && grid[r][c + 1] === v) return true;
        if (r < SIZE - 1 && grid[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  function finishMove(newBoard, gainedScore) {
    spawnRandomTile(newBoard);

    let highest = 2;
    newBoard.forEach((row) => {
      row.forEach((v) => {
        if (v > highest) highest = v;
      });
    });

    const finalScore = score + gainedScore;
    const finalMoves = moves + 1;

    setBoard(newBoard);
    setScore(finalScore);
    setMoves(finalMoves);
    setHighestTile(highest);

    if (!canMove(newBoard)) {
      endGame(finalScore, highest, finalMoves);
    }
  }

  function moveLeft() {
    const result = executeLeft(board);
    if (!result.changed) return;
    finishMove(result.board, result.score);
  }

  function moveRight() {
    const grid = reverseBoardRows(board);
    const result = executeLeft(grid);
    if (!result.changed) return;
    result.board = reverseBoardRows(result.board);
    finishMove(result.board, result.score);
  }

  function moveUp() {
    const grid = transpose(board);
    const result = executeLeft(grid);
    if (!result.changed) return;
    result.board = transpose(result.board);
    finishMove(result.board, result.score);
  }

  function moveDown() {
    let grid = transpose(board);
    grid = reverseBoardRows(grid);
    const result = executeLeft(grid);
    if (!result.changed) return;
    result.board = reverseBoardRows(result.board);
    result.board = transpose(result.board);
    finishMove(result.board, result.score);
  }

  // ---------- keyboard controls (all 4 directions wired up) ----------
  useEffect(() => {
    function keyHandler(e) {
      if (!started || gameOver) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          moveLeft();
          break;
        case "ArrowRight":
          e.preventDefault();
          moveRight();
          break;
        case "ArrowUp":
          e.preventDefault();
          moveUp();
          break;
        case "ArrowDown":
          e.preventDefault();
          moveDown();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [board, started, gameOver]);

  // ---------- end of game: submit result to backend ----------
  async function endGame(finalScore, finalHighest, finalMoves) {
    setGameOver(true);
    try {
      // ✅ FIX: endpoint /end nahi, /submit hai (routes/controller me yahi define hai)
      // ✅ FIX: body me sessionToken bhejna hai (controller isi field ko dhoondta hai)
      // Note: controller sirf { sessionToken, score } accept karta hai — highestTile/moves/duration
      // sirf local UI display ke liye hain, backend inhe store nahi karta abhi
      const res = await axios.post(
        `${API}/api/merge/submit`,
        {
          sessionToken,
          score: finalScore,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        // ✅ FIX: bestScore (camelCase)
        if (res.data.bestScore !== undefined) {
          setBestScore(res.data.bestScore);
        } else if (finalScore > bestScore) {
          setBestScore(finalScore);
        }

        setLastResult(res.data); // isNewBest, rank, reward — game-over banner me dikhane ke liye
      }

      // refresh leaderboard / stats after submitting
      loadPage();
    } catch (err) {
      console.log(err);
    }
  }

  async function startGame() {
    try {
      const res = await axios.post(
        `${API}/api/merge/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data.success) {
        alert(res.data.message);
        return;
      }

      // ✅ FIX: controller sessionToken bhejta hai, sessionId nahi
      setSessionToken(res.data.sessionToken);
      // ✅ FIX: controller coinsLeft nahi, entryFee bhejta hai
      setEntryFee(res.data.entryFee || 0);
      setScore(0);
      setMoves(0);
      setHighestTile(2);
      setDuration(0);
      setGameOver(false);
      setLastResult(null);
      setBoard(createNewBoard());
      setStarted(true);
    } catch (e) {
      console.log(e);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-black text-white">Infinity Merge</h1>
            <p className="text-slate-400 mt-2">
              Merge blocks • Beat today's champion • Win Coins
            </p>
          </div>

          <button
            onClick={startGame}
            disabled={started && !gameOver}
            className="mt-4 lg:mt-0 px-7 py-3 rounded-xl
            bg-yellow-400 hover:bg-yellow-500
            disabled:opacity-50 disabled:cursor-not-allowed
            text-black font-bold shadow-xl"
          >
            {started && !gameOver ? "Game in progress" : "▶ Play"}
          </button>
        </div>

        {/* Top Section */}
        <div className="grid lg:grid-cols-4 gap-5">
          {/* LEFT */}
          <div className="lg:col-span-3 space-y-5">
            {/* Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-2xl p-5">
                <div className="text-slate-400 text-sm">Current Score</div>
                <div className="text-3xl font-black mt-2">{score}</div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5">
                <div className="text-slate-400 text-sm">Best Score</div>
                <div className="text-3xl font-black mt-2">{bestScore}</div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5">
                <div className="text-slate-400 text-sm">Highest Tile</div>
                <div className="text-3xl font-black mt-2">{highestTile}</div>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5">
                <div className="text-slate-400 text-sm">Time</div>
                <div className="text-3xl font-black mt-2">{duration}s</div>
              </div>
            </div>

            {/* Game Area */}
            <div className="bg-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between mb-4">
                <div>
                  <h2 className="font-bold text-xl text-white">Game Board</h2>
                  <p className="text-slate-400">Moves : {moves}</p>
                </div>
                <div>
                  Entry Fee
                  <div className="text-yellow-400 text-2xl font-bold">
                    {entryFee}
                  </div>
                </div>
              </div>

              {gameOver && (
                <div className="mb-4 rounded-xl bg-red-500/20 border border-red-500 px-4 py-3 text-center">
                  <div className="font-bold">
                    Game Over — final score {score}. Press Play to try again.
                  </div>

                  {lastResult?.isNewBest && (
                    <div className="mt-2 text-sm text-yellow-300 font-semibold">
                      {lastResult.rank === 1
                        ? "👑 New #1 on the leaderboard!"
                        : lastResult.rank
                        ? `🏅 New personal best — Rank #${lastResult.rank}`
                        : "🎉 New personal best!"}
                      {lastResult.reward > 0 && (
                        <span className="text-green-400"> · +{lastResult.reward} coins</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-4 gap-3 bg-slate-700 rounded-2xl p-3">
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="aspect-square rounded-xl flex items-center justify-center text-3xl font-black transition-all duration-200"
                      style={{
                        background:
                          cell === 0
                            ? "#374151"
                            : cell === 2
                            ? "#f8fafc"
                            : cell === 4
                            ? "#fde68a"
                            : cell === 8
                            ? "#fb923c"
                            : cell === 16
                            ? "#ef4444"
                            : cell === 32
                            ? "#8b5cf6"
                            : cell === 64
                            ? "#3b82f6"
                            : cell === 128
                            ? "#10b981"
                            : cell === 256
                            ? "#f97316"
                            : cell === 512
                            ? "#dc2626"
                            : cell === 1024
                            ? "#7c3aed"
                            : "#111827",
                        color: cell <= 4 ? "#111" : "#fff",
                      }}
                    >
                      {cell !== 0 && cell}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <div className="bg-slate-800 rounded-3xl p-5 sticky top-5">
              <h2 className="font-black text-xl mb-4 text-white">🏆 Leaderboard</h2>

              {leaderboard.length === 0 && (
                <div className="text-slate-400 text-sm text-center py-6">
                  No scores yet — be the first!
                </div>
              )}

              {leaderboard.map((p, index) => (
                <div
                  key={p.userId ?? index}
                  className="flex justify-between items-center py-3 border-b border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                      {index === 0 ? "👑" : index + 1}
                    </div>
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-slate-400">Best Score</div>
                    </div>
                  </div>
                  {/* ✅ FIX: controller bestScore (camelCase) bhejta hai */}
                  <div className="font-bold">{p.bestScore}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* ================= HOW TO PLAY ================= */}
<div className="mt-6 rounded-2xl bg-slate-800/70 border border-slate-700 p-5">

    <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
        🎮 How to Play Infinity Merge
    </h3>

    <div className="space-y-3 text-sm text-slate-300 leading-7">

        <p>
            • Tap or swipe <span className="text-white font-semibold">Up, Down, Left or Right</span> to move all blocks.
        </p>

        <p>
            • When two blocks with the <span className="text-green-400 font-semibold">same number</span> touch each other,
            they merge into one bigger block.
        </p>

        <p>
            Example:
            <span className="ml-2 font-bold text-cyan-400">
                2 + 2 = 4 → 4 + 4 = 8 → 8 + 8 = 16 → 32 → 64 → 128...
            </span>
        </p>

        <p>
            • Every merge increases your <span className="text-yellow-400 font-semibold">Score</span>.
        </p>

        <p>
            • The game ends when there are <span className="text-red-400 font-semibold">no more possible moves</span>.
        </p>

        <p>
            • Try to create the <span className="text-green-400 font-semibold">highest tile</span> and beat your own record.
        </p>

        <p>
            • Climb the <span className="text-orange-400 font-semibold">Global Leaderboard</span> and become the Champion.
        </p>

        <div className="rounded-xl bg-slate-900 border border-yellow-600 p-4 mt-4 text-left">

            <div className="font-bold text-yellow-400 mb-2">
                🏆 Tips to Score Higher
            </div>

            <ul className="list-disc pl-5 space-y-2 text-left">

                <li>Keep your biggest tile in one corner.</li>

                <li>Don't move randomly.</li>

                <li>Always plan your next merge.</li>

                <li>Leave empty spaces whenever possible.</li>

                <li>Think 2–3 moves ahead.</li>

            </ul>

        </div>

    </div>
</div>
      </div>
    </div>
  );
}
