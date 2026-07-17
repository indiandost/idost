// ============================================================
// controllers/ludoController.js
// Live Ludo (2/3/4 players) — REST routes + socket handlers
// ------------------------------------------------------------
// ASSUMPTIONS (adjust to match your actual project):
//   1. ../db.js exports a callback-style mysql2 pool. It's wrapped
//      with .promise() below so every db.execute() here returns a
//      real Promise resolving to [rows/result, fields] — standard
//      mysql2/promise behaviour. If ../db.js already exports a
//      mysql2/promise pool, the wrap is a no-op.
//   2. `verifyToken` (../middlewares/auth.js) sets req.user, and
//      getUserId() below reads srno/id/userId off it — adjust the
//      field name if your JWT payload uses something else.
//   3. Your socket layer authenticates the socket first and sets
//      socket.user = { userId, sessionToken } before any ludo event
//      fires (adjust the two spots marked "AUTH" below if your
//      pattern is different).
//   4. In server.js you already do something like:
//         import { ludoRouter, registerLudoSocket } from "./controllers/ludoController.js";
//         app.use("/api/ludo", ludoRouter);
//         io.on("connection", (socket) => registerLudoSocket(io, socket));
// ============================================================

import express from "express";
import rawDb from "../db.js";               // <-- your mysql pool/wrapper
import rewardUser from "../utils/rewardUser.js";
import { verifyToken } from "../middlewares/auth.js";

// If ../db.js exports a callback-style mysql2 pool (mysql.createPool),
// db.execute(sql, params) with no callback silently returns undefined
// and never resolves -> ("Cannot read insertId", "cb is not a function").
// Wrapping with .promise() gives every call below a real Promise.
// If ../db.js already exports a mysql2/promise pool, rawDb.promise is
// undefined and we just use it as-is.
const db = typeof rawDb.promise === "function" ? rawDb.promise() : rawDb;

export const ludoRouter = express.Router();

function getUserId(req) {
  return req.user?.srno || req.user?.id || req.user?.userId || null;
}

// ---------------- CONSTANTS ----------------
const ENTRY_FEE = 20;
const WINNER_REWARD = 500;
const COLORS = ["red", "green", "yellow", "blue"];
const START_OFFSET = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47]; // global track indices (start + star squares)

// ---------------- IN-MEMORY LIVE STATE ----------------
// roomCode -> { id, maxPlayers, status, players:[{userId,color,seatNo,pawns,consecutiveSixes,socketId,active}], turnIndex, lastDice }
const liveRooms = new Map();

function genRoomCode() {
  return "LD" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function freshPawns() {
  return [0, 0, 0, 0];
}

function globalIndex(color, step) {
  if (step < 1 || step > 51) return -1;
  return (START_OFFSET[color] + step - 1) % 52;
}

function isSafeCell(idx) {
  return SAFE_CELLS.includes(idx);
}

function getValidPawnMoves(pawns, dice) {
  const movable = [];
  pawns.forEach((step, i) => {
    if (step === 0 && dice === 6) movable.push(i);
    else if (step > 0 && step < 57 && step + dice <= 57) movable.push(i);
  });
  return movable;
}

// Applies a move server-side, handles capture + finish detection.
function applyMove(room, playerColor, pawnIndex, dice) {
  const player = room.players.find((p) => p.color === playerColor);
  const pawns = player.pawns;
  let step = pawns[pawnIndex];
  step = step === 0 ? 1 : step + dice;
  pawns[pawnIndex] = step;

  let captured = false;
  if (step >= 1 && step <= 51) {
    const gIdx = globalIndex(playerColor, step);
    if (!isSafeCell(gIdx)) {
      room.players.forEach((op) => {
        if (op.color === playerColor) return;
        op.pawns.forEach((oStep, oi) => {
          if (oStep >= 1 && oStep <= 51 && globalIndex(op.color, oStep) === gIdx) {
            op.pawns[oi] = 0;
            captured = true;
          }
        });
      });
    }
  }

  const finished = pawns.every((s) => s === 57);
  return { captured, finished };
}

function nextTurnIndex(room) {
  const n = room.players.length;
  let idx = room.turnIndex;
  for (let i = 1; i <= n; i++) {
    const cand = (idx + i) % n;
    if (room.players[cand].active) return cand;
  }
  return idx;
}

function publicState(room) {
  return {
    roomCode: room.roomCode,
    status: room.status,
    maxPlayers: room.maxPlayers,
    turnColor: room.players[room.turnIndex]?.color,
    players: room.players.map((p) => ({
      userId: p.userId,
      color: p.color,
      seatNo: p.seatNo,
      pawns: p.pawns,
      active: p.active,
    })),
    lastDice: room.lastDice,
  };
}

async function persistRoomSnapshot(room) {
  for (const p of room.players) {
    await db.execute(`UPDATE ludo_players SET pawns_json = ? WHERE room_id = ? AND user_id = ?`, [
      JSON.stringify(p.pawns),
      room.id,
      p.userId,
    ]);
  }
}

// ============================================================
// REST ROUTES
// ============================================================

// POST /api/ludo/create  { maxPlayers: 2|3|4 }
ludoRouter.post("/create", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req); // AUTH
    const maxPlayers = [2, 3, 4].includes(Number(req.body.maxPlayers)) ? Number(req.body.maxPlayers) : 4;
    const roomCode = genRoomCode();

    const [result] = await db.execute(
      `INSERT INTO ludo_rooms (room_code, max_players, entry_fee, winner_reward, status) VALUES (?,?,?,?,'waiting')`,
      [roomCode, maxPlayers, ENTRY_FEE, WINNER_REWARD]
    );

    liveRooms.set(roomCode, {
      id: result.insertId,
      roomCode,
      maxPlayers,
      status: "waiting",
      players: [],
      turnIndex: 0,
      lastDice: null,
    });

    res.json({ success: true, roomCode, maxPlayers, entryFee: ENTRY_FEE, winnerReward: WINNER_REWARD });
  } catch (err) {
    console.error("ludo/create error:", err);
    res.status(500).json({ success: false, message: "Could not create room" });
  }
});

// GET /api/ludo/open-rooms
ludoRouter.get("/open-rooms", async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.room_code, r.max_players, r.entry_fee, COUNT(p.id) AS joined
       FROM ludo_rooms r LEFT JOIN ludo_players p ON p.room_id = r.id AND p.is_active = 1
       WHERE r.status = 'waiting'
       GROUP BY r.id
       HAVING joined < r.max_players
       ORDER BY r.created_at DESC LIMIT 30`
    );
    res.json({ success: true, rooms: rows });
  } catch (err) {
    console.error("ludo/open-rooms error:", err);
    res.status(500).json({ success: false, message: "Could not fetch rooms" });
  }
});

// POST /api/ludo/join  { roomCode }
ludoRouter.post("/join", verifyToken, async (req, res) => {
  const { roomCode } = req.body;
  const userId = getUserId(req);              // AUTH
  const sessionToken = req.user?.sessionToken; // AUTH

  const room = liveRooms.get(roomCode);
  if (!room) return res.status(404).json({ success: false, message: "Room not found" });
  if (room.status !== "waiting") return res.status(400).json({ success: false, message: "Room already started" });
  if (room.players.length >= room.maxPlayers)
    return res.status(400).json({ success: false, message: "Room is full" });
  if (room.players.some((p) => p.userId === userId))
    return res.status(400).json({ success: false, message: "Already joined" });

  try {
    // Debit entry fee using your existing reward util (1 = debit)
    await rewardUser(db, req.app.get("io"), userId, ENTRY_FEE, "GAME_FEES", sessionToken, 1);

    const seatNo = room.players.length;
    const color = COLORS[seatNo];
    const pawns = freshPawns();

    await db.execute(
      `INSERT INTO ludo_players (room_id, user_id, seat_no, color, pawns_json, entry_debited) VALUES (?,?,?,?,?,1)`,
      [room.id, userId, seatNo, color, JSON.stringify(pawns)]
    );

    room.players.push({ userId, color, seatNo, pawns, consecutiveSixes: 0, socketId: null, active: true });

    if (room.players.length === room.maxPlayers) {
      room.status = "playing";
      await db.execute(`UPDATE ludo_rooms SET status='playing' WHERE id = ?`, [room.id]);
    }

    const io = req.app.get("io");
    io.to(roomCode).emit("ludo:state", publicState(room));

    res.json({ success: true, roomCode, color, seatNo, state: publicState(room) });
  } catch (err) {
    console.error("ludo/join error:", err);
    res.status(500).json({ success: false, message: "Join failed (entry fee debit may have failed)" });
  }
});

// GET /api/ludo/room/:roomCode
ludoRouter.get("/room/:roomCode", async (req, res) => {
  const room = liveRooms.get(req.params.roomCode);
  if (!room) return res.status(404).json({ success: false, message: "Room not found" });
  res.json({ success: true, state: publicState(room) });
});

// ============================================================
// SOCKET HANDLERS
// ============================================================

export function registerLudoSocket(io, socket) {
  const userId = socket.user?.userId || socket.handshake?.auth?.userId; // AUTH
  const sessionToken = socket.user?.sessionToken || socket.handshake?.auth?.sessionToken; // AUTH

  socket.on("ludo:joinSocket", ({ roomCode }) => {
    const room = liveRooms.get(roomCode);
    if (!room) return socket.emit("ludo:error", { message: "Room not found" });

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return socket.emit("ludo:error", { message: "You have not joined this room" });

    player.socketId = socket.id;
    player.active = true;
    socket.join(roomCode);
    socket.data.ludoRoomCode = roomCode;

    io.to(roomCode).emit("ludo:state", publicState(room));
  });

  socket.on("ludo:rollDice", async ({ roomCode }) => {
    const room = liveRooms.get(roomCode);
    if (!room || room.status !== "playing") return;

    const player = room.players[room.turnIndex];
    if (!player || player.userId !== userId) return socket.emit("ludo:error", { message: "Not your turn" });

    const dice = 1 + Math.floor(Math.random() * 6);
    room.lastDice = dice;

    if (dice === 6) player.consecutiveSixes += 1;
    else player.consecutiveSixes = 0;

    const movable = getValidPawnMoves(player.pawns, dice);

    await db.execute(`INSERT INTO ludo_moves (room_id, user_id, dice_value) VALUES (?,?,?)`, [
      room.id,
      userId,
      dice,
    ]);

    io.to(roomCode).emit("ludo:diceRolled", { color: player.color, dice, movablePawns: movable });

    // Three sixes in a row -> forfeit turn immediately
    if (player.consecutiveSixes >= 3) {
      player.consecutiveSixes = 0;
      room.turnIndex = nextTurnIndex(room);
      room.lastDice = null;
      io.to(roomCode).emit("ludo:turnChanged", { turnColor: room.players[room.turnIndex].color });
      return;
    }

    // No legal moves -> auto pass
    if (movable.length === 0) {
      room.turnIndex = nextTurnIndex(room);
      room.lastDice = null;
      io.to(roomCode).emit("ludo:turnChanged", { turnColor: room.players[room.turnIndex].color });
    }
  });

  socket.on("ludo:movePawn", async ({ roomCode, pawnIndex }) => {
    const room = liveRooms.get(roomCode);
    if (!room || room.status !== "playing") return;

    const player = room.players[room.turnIndex];
    if (!player || player.userId !== userId) return socket.emit("ludo:error", { message: "Not your turn" });
    if (room.lastDice == null) return socket.emit("ludo:error", { message: "Roll the dice first" });

    const dice = room.lastDice;
    const movable = getValidPawnMoves(player.pawns, dice);
    if (!movable.includes(pawnIndex)) return socket.emit("ludo:error", { message: "Invalid move" });

    const { captured, finished } = applyMove(room, player.color, pawnIndex, dice);

    await db.execute(
      `INSERT INTO ludo_moves (room_id, user_id, dice_value, pawn_index, captured) VALUES (?,?,?,?,?)`,
      [room.id, userId, dice, pawnIndex, captured ? 1 : 0]
    );
    await persistRoomSnapshot(room);

    io.to(roomCode).emit("ludo:moveMade", { state: publicState(room), captured });

    const allFinished = player.pawns.every((s) => s === 57);
    if (allFinished) {
      room.status = "completed";
      await db.execute(`UPDATE ludo_rooms SET status='completed', winner_user_id=? WHERE id=?`, [
        userId,
        room.id,
      ]);
      await db.execute(`UPDATE ludo_players SET reward_credited=1 WHERE room_id=? AND user_id=?`, [
        room.id,
        userId,
      ]);

      try {
        await rewardUser(db, io, userId, WINNER_REWARD, "GAME_WINNING", sessionToken, 0); // 0 = credit
      } catch (err) {
        console.error("ludo winner reward error:", err);
      }

      io.to(roomCode).emit("ludo:gameOver", { winnerUserId: userId, winnerColor: player.color });
      liveRooms.delete(roomCode);
      return;
    }

    // extra turn on six, otherwise rotate
    room.lastDice = null;
    if (dice !== 6) {
      room.turnIndex = nextTurnIndex(room);
      io.to(roomCode).emit("ludo:turnChanged", { turnColor: room.players[room.turnIndex].color });
    } else {
      io.to(roomCode).emit("ludo:turnChanged", { turnColor: player.color, extraTurn: true });
    }
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.ludoRoomCode;
    if (!roomCode) return;
    const room = liveRooms.get(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) player.active = false;

    const activePlayers = room.players.filter((p) => p.active);
    if (room.status === "playing" && activePlayers.length === 1) {
      const winner = activePlayers[0];
      room.status = "completed";
      db.execute(`UPDATE ludo_rooms SET status='completed', winner_user_id=? WHERE id=?`, [
        winner.userId,
        room.id,
      ]).catch((e) => console.error(e));

      rewardUser(db, io, winner.userId, WINNER_REWARD, "GAME_WINNING", sessionToken, 0).catch((e) =>
        console.error("ludo disconnect reward error:", e)
      );

      io.to(roomCode).emit("ludo:gameOver", { winnerUserId: winner.userId, winnerColor: winner.color, reason: "opponents_left" });
      liveRooms.delete(roomCode);
    } else if (room.status === "playing" && room.players[room.turnIndex]?.socketId === socket.id) {
      room.turnIndex = nextTurnIndex(room);
      room.lastDice = null;
      io.to(roomCode).emit("ludo:turnChanged", { turnColor: room.players[room.turnIndex]?.color });
    }
  });
}
