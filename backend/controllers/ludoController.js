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
//   2. `verifyToken` (../middlewares/auth.js) is an Express-style
//      middleware: (req, res, next) => { ... sets req.user ... }.
//      Both the REST routes AND the socket handlers below authenticate
//      through this SAME function now — the socket side just calls it
//      with a fake req/res, so there is exactly one place that decides
//      who a token belongs to.
//   3. In server.js you already do something like:
//         import { ludoRouter, registerLudoSocket } from "./controllers/ludoController.js";
//         app.use("/api/ludo", ludoRouter);
//         io.on("connection", (socket) => registerLudoSocket(io, socket));
//   4. On the client, wherever the shared socket is created, the JWT
//      must be sent at connect time so verifyToken has something to
//      check:
//         const socket = io(SOCKET_URL, {
//           auth: { token: localStorage.getItem("token") },
//         });
//      If verifyToken instead expects the token as a normal
//      `Authorization: Bearer <token>` header, that also works — the
//      fake req below sets that header from socket.handshake too.
// ============================================================

import express from "express";
import rawDb from "../db.js";               // <-- your mysql pool/wrapper
import rewardUser from "../utils/rewardUser.js";
import { verifyToken } from "../middlewares/auth.js";

const db = typeof rawDb.promise === "function" ? rawDb.promise() : rawDb;

export const ludoRouter = express.Router();

// Same field-priority everywhere a user id is read off req.user /
// socket.user, so REST and sockets can never disagree about who the
// user is.
function resolveUserId(payload) {
  return payload?.srno || payload?.id || payload?.userId || null;
}

function getUserId(req) {
  return resolveUserId(req.user);
}

// ---------------- SOCKET AUTH (reuses verifyToken, no raw JWT here) ----------------
// verifyToken is an Express middleware: (req, res, next). Sockets
// don't have a real req/res, so we build the minimal fake versions it
// needs and capture whatever it sets on req.user. Whether verifyToken
// succeeds by calling next(), or fails by calling res.status(401).json(...),
// this always resolves (never hangs) — with the user on success, or
// null on failure.
function authenticateSocket(socket) {
  return new Promise((resolve) => {
    const token =
      socket.handshake?.auth?.token ||
      (socket.handshake?.headers?.authorization || "").replace(/^Bearer\s+/i, "");

    const fakeReq = {
      headers: { authorization: token ? `Bearer ${token}` : "" },
    };

    let settled = false;
    const finish = (user) => {
      if (settled) return;
      settled = true;
      resolve(user || null);
    };

    const fakeRes = {
      status() {
        return this;
      },
      json() {
        finish(null); // verifyToken responded with an error -> auth failed
        return this;
      },
      send() {
        finish(null);
        return this;
      },
    };

    try {
      verifyToken(fakeReq, fakeRes, () => finish(fakeReq.user)); // verifyToken called next() -> success
    } catch (err) {
      console.error("ludo socket verifyToken threw:", err);
      finish(null);
    }
  });
}

// ---------------- CONSTANTS ----------------
const ENTRY_FEE = 20;
const WINNER_REWARD = 500;
const COLORS = ["red", "green", "yellow", "blue"];
const START_OFFSET = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47]; // global track indices (start + star squares)

// ✅ NEW: how long a disconnected player has to reconnect before the
// game is declared abandoned in favour of the remaining player(s).
// Covers exactly the "phone call / accidental nav" scenario — without
// this, ANY disconnect that drops active players to 1 ends the game
// and pays out the 500-coin reward INSTANTLY, even for a 3-second
// network blip.
const RECONNECT_GRACE_MS = 60000; // 60 seconds

// ---------------- IN-MEMORY LIVE STATE ----------------
// roomCode -> { id, maxPlayers, status, players:[{userId,color,seatNo,pawns,consecutiveSixes,socketId,active}], turnIndex, lastDice }
// NOTE: this Map only lives in ONE process's memory. If you run this
// behind a cluster (PM2 cluster mode, multiple dynos, etc.) or the
// dev server restarts (nodemon) between a create and a join, the
// second request can land on a process that never saw the room ->
// "Room not found". If you're seeing that intermittently in dev,
// it's almost always a nodemon restart between create and join, not
// a logic bug. For production with multiple instances you'd want
// this state in Redis instead of a local Map.
const liveRooms = new Map();

function genRoomCode() {
  return "LD" + Math.random().toString(36).slice(2, 4).toUpperCase();
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
// NOTE: this does NOT implement the "blockade" rule (2+ same-color
// pawns stacked on one cell being un-capturable) — every opponent
// pawn found on the landed cell gets sent home unconditionally. Most
// casual Ludo implementations skip blockades entirely so this may be
// intentional; flagging it here in case you want that rule added.
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

// ✅ NEW: instead of ending the game the instant only one active
// player remains, wait RECONNECT_GRACE_MS for someone to come back
// via ludo:joinSocket. If nobody does, THEN settle the game.
function scheduleGameOverIfStillAbandoned(io, room) {
  if (room.abandonTimeout) return; // already counting down, don't restart it

  room.abandonTimeout = setTimeout(async () => {
    room.abandonTimeout = null;

    // room may have been deleted/finished normally while we waited
    const currentRoom = liveRooms.get(room.roomCode);
    if (!currentRoom || currentRoom.status !== "playing") return;

    const activePlayers = currentRoom.players.filter((p) => p.active);

    // enough players reconnected during the grace period — carry on
    if (activePlayers.length > 1) return;

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      currentRoom.status = "completed";

      try {
        await db.execute(
          `UPDATE ludo_rooms SET status='completed', winner_user_id=? WHERE id=?`,
          [winner.userId, currentRoom.id]
        );
        // ✅ FIX: 6th arg is the reference id (roomCode), not the coin amount again
        await rewardUser(
          rawDb,
          io,
          winner.userId,
          WINNER_REWARD,
          "LUDO_WINNING",
          currentRoom.roomCode,
          0 // credit
        );
      } catch (err) {
        console.error("ludo abandon reward error:", err);
      }

      io.to(currentRoom.roomCode).emit("ludo:gameOver", {
        winnerUserId: winner.userId,
        winnerColor: winner.color,
        reason: "opponents_left",
      });
      liveRooms.delete(currentRoom.roomCode);
    } else {
      // everyone disconnected — no winner, just close the room out
      currentRoom.status = "completed";
      try {
        await db.execute(`UPDATE ludo_rooms SET status='completed' WHERE id=?`, [currentRoom.id]);
      } catch (err) {
        console.error("ludo all-abandoned cleanup error:", err);
      }
      io.to(currentRoom.roomCode).emit("ludo:gameOver", {
        winnerUserId: null,
        reason: "all_left",
      });
      liveRooms.delete(currentRoom.roomCode);
    }
  }, RECONNECT_GRACE_MS);
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
      abandonTimeout: null, // ✅ NEW
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
  try {
    const { roomCode } = req.body;

    const userId = getUserId(req);
    const io = req.app.get("io");

    const room = liveRooms.get(roomCode);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // ✅ Reconnect path: same user rejoining a room they already paid
    // into (e.g. after the frontend's auto-rejoin-on-mount kicks in) —
    // treat this as a resume, not a fresh join / second entry fee.
    const existingPlayer = room.players.find((p) => p.userId === userId);
    if (existingPlayer) {
      if (room.abandonTimeout) {
        clearTimeout(room.abandonTimeout);
        room.abandonTimeout = null;
      }
      existingPlayer.active = true;

      return res.json({
        success: true,
        roomCode,
        color: existingPlayer.color,
        seatNo: existingPlayer.seatNo,
        state: publicState(room),
      });
    }

    if (room.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "Room already started",
      });
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({
        success: false,
        message: "Room is full",
      });
    }

    // Debit Entry Fee
    const debit = 1;
    await rewardUser(
      rawDb,
      io,
      userId,
      ENTRY_FEE,
      "LUDO_FEES",
      roomCode, // ✅ FIX: reference id, was ENTRY_FEE (duplicate of the coin amount) before
      debit
    );

    const seatNo = room.players.length;
    const color = COLORS[seatNo];
    const pawns = freshPawns();

    await db.execute(
      `INSERT INTO ludo_players
      (room_id,user_id,seat_no,color,pawns_json,entry_debited)
      VALUES (?,?,?,?,?,1)`,
      [
        room.id,
        userId,
        seatNo,
        color,
        JSON.stringify(pawns),
      ]
    );

    room.players.push({
      userId,
      color,
      seatNo,
      pawns,
      consecutiveSixes: 0,
      socketId: null,
      active: true,
    });

    // Send latest room state
    io.to(roomCode).emit("ludo:state", publicState(room));

    // Start game automatically
    if (room.players.length === room.maxPlayers) {

      room.status = "playing";
      room.turnIndex = 0;
      room.lastDice = null;

      await db.execute(
        `UPDATE ludo_rooms
         SET status='playing'
         WHERE id=?`,
        [room.id]
      );

      io.to(roomCode).emit("ludo:state", publicState(room));

      io.to(roomCode).emit("ludo:turnChanged", {
        turnColor: room.players[0].color,
      });
    }

    return res.json({
      success: true,
      roomCode,
      color,
      seatNo,
      state: publicState(room),
    });

  } catch (err) {

    console.error("========== LUDO JOIN ERROR ==========");
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
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

export async function registerLudoSocket(io, socket) {
  // Authenticate via the SAME verifyToken middleware the REST routes
  // use — no separate JWT logic to keep in sync.
  const user = await authenticateSocket(socket);
  const userId = resolveUserId(user);

  if (!userId) {
    socket.emit("ludo:error", { message: "Socket authentication failed — please reconnect and try again" });
    socket.disconnect(true);
    return;
  }

  socket.on("ludo:joinSocket", ({ roomCode }) => {
    const room = liveRooms.get(roomCode);
    if (!room) return socket.emit("ludo:error", { message: "Room not found" });

    const player = room.players.find((p) => p.userId === userId);
    if (!player) return socket.emit("ludo:error", { message: "You have not joined this room" });

    player.socketId = socket.id;
    player.active = true;
    socket.join(roomCode);

    // ✅ NEW: this player is back — cancel any pending "opponents left"
    // countdown for this room so the game doesn't get settled out from
    // under them right as they reconnect.
    if (room.abandonTimeout) {
      clearTimeout(room.abandonTimeout);
      room.abandonTimeout = null;
    }

    if (
      room.status === "playing" &&
      room.players.every(p => p.socketId)
    ) {
      io.to(roomCode).emit("ludo:turnChanged", {
        turnColor: room.players[room.turnIndex].color
      });
    }

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
    io.to(roomCode).emit("ludo:state", publicState(room));

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

      // ✅ a normal finish also means any pending abandon-timer is stale
      if (room.abandonTimeout) {
        clearTimeout(room.abandonTimeout);
        room.abandonTimeout = null;
      }

      await db.execute(`UPDATE ludo_rooms SET status='completed', winner_user_id=? WHERE id=?`, [
        userId,
        room.id,
      ]);
      await db.execute(`UPDATE ludo_players SET reward_credited=1 WHERE room_id=? AND user_id=?`, [
        room.id,
        userId,
      ]);

      try {
        // ✅ FIX: 6th arg is the reference id (roomCode), not the coin amount again
        await rewardUser(rawDb, io, userId, WINNER_REWARD, "LUDO_WINNING", roomCode, 0); // 0 = credit
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

    // ✅ let everyone else's UI reflect the disconnect (state.players[].active)
    io.to(roomCode).emit("ludo:state", publicState(room));

    const activePlayers = room.players.filter((p) => p.active);

    if (room.status === "playing" && activePlayers.length <= 1) {
      // ✅ FIX: don't end the game instantly — give a reconnect window
      scheduleGameOverIfStillAbandoned(io, room);
    } else if (room.status === "playing" && room.players[room.turnIndex]?.socketId === socket.id) {
      room.turnIndex = nextTurnIndex(room);
      room.lastDice = null;
      io.to(roomCode).emit("ludo:turnChanged", { turnColor: room.players[room.turnIndex]?.color });
    }
  });
}
