import express from "express";

//import mysql from "mysql2";

import cors from "cors";

import http from "http";

import { Server } from "socket.io";

import chatSocket from "./sockets/chatSocket.js";

// ✅ Routes
import users from "./users.js"; //for socket users
import usersRoutes from "./routes/users.js";

import callRoutes from "./routes/call.js";

import loginRoutes from "./routes/login.js";

import registerRoutes from "./routes/register.js";

// ✅ Socket file

import profileRoutes from "./routes/profile.js";

import friendsRoutes from "./routes/friends.js";

import blockRoutes from "./routes/block.js";

import forgotPasswordRoute from "./routes/forgotPassword.js";

import resetPasswordRoute from "./routes/resetPassword.js";

import giftsRoutes from "./routes/gifts.js";
import rewardsRoutes from "./routes/rewards.js";


import multer from "multer";
import { verifyToken } from "./middlewares/auth.js";
import dns from "dns";

import gameRoutes from "./routes/gameRoutes.js";
import colorCrashSocket from "./sockets/colorCrashSocket.js";
import jamRoomSocket from "./sockets/jamRoomSocket.js";
import jamRoutes from "./routes/jamRoomRoutes.js";
import notificationRoutes from "./routes/notification.js";
import riskGameRoutes from "./routes/riskgame.js";
import withdrawRoutes from "./routes/withdraw.js";
import depositRoutes from "./routes/deposit.js";
import quizRoutes from "./routes/quiz.js";
import hiremeRoutes from "./routes/hireme.js";


//import colorCrashSocket from "./sockets/colorCrashSocket.js";


dns.setDefaultResultOrder("ipv4first");

import path from "path";

import { fileURLToPath } from "url";

import dotenv from "dotenv";

import db from "./db.js";

import postRoutes from "./routes/posts.js";

// 🔥 FIX __dirname for ES Modules

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

dotenv.config({ quiet: true });

const app = express();

app.use(cors());

//app.use(express.json());
app.use(express.json({
  limit: "10mb"
}));



// 👉 Make DB usable in all routes

app.set("db", db);
//app.use("/uploads", express.static("uploads"));
app.use("/api", postRoutes);
//app.set("io", io);



//chat history
app.get("/api/chat/:user1/:user2", verifyToken, (req, res) => {
  const { user1, user2 } = req.params;
  const sql = `
    SELECT 
      id,
      sender_id AS \`from\`,
      receiver_id AS \`to\`,
      message,
      media_url,
      message_type AS type,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM chat_messages
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `;
  db.query(sql, [user1, user2, user2, user1], (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

// 📁 Absolute upload path
//const UPLOAD_DIR = path.join( __dirname,  process.env.UPLOAD_DIR || "uploads");//old
const UPLOAD_DIR = process.env.UPLOAD_DIR;
console.log("UPLOAD_DIR =", UPLOAD_DIR);
// 📁 storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
filename: (req, file, cb) => {
  const ext = path.extname(file.originalname);
  const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
  cb(null, Date.now() + "-" + name + ext);
}
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// 📦 make uploads public
app.use("/uploads", express.static(UPLOAD_DIR));
// 🚀 UPLOAD API
app.post("/api/upload",  verifyToken, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  // ✅ Use FILE_URL from env
  const fileUrl = process.env.FILE_URL || `${process.env.BASE_URL}/uploads`;
  const url = `${fileUrl}/${req.file.filename}`;
  res.json({ url });
});



// =============================
// 📥 GET CONVERSATIONS LIST
// =============================
app.get("/api/conversations/:userId", verifyToken, (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT 
      u.srno as userId,
      u.name,
      u.pic,
      m.message,
      m.media_url,
      m.created_at,
         (
        SELECT COUNT(*)
        FROM chat_messages cm
        WHERE cm.sender_id = u.srno
          AND cm.receiver_id = ?
          AND cm.is_read = 0
      ) AS unreadCount 
    FROM chat_messages m
    JOIN users u 
      ON u.srno = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
    WHERE m.id IN (SELECT MAX(id) FROM chat_messages WHERE sender_id = ? OR receiver_id = ?
      GROUP BY 
        LEAST(sender_id, receiver_id),
        GREATEST(sender_id, receiver_id)
    )
    ORDER BY m.created_at DESC
  `;
  db.query(sql, [userId, userId, userId, userId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

//Read mark api
app.post("/api/chat/read", verifyToken, (req, res) => {
  const { myId, friendId } = req.body;
  db.query(    `
    UPDATE chat_messages
    SET is_read = 1
    WHERE sender_id = ?
      AND receiver_id = ?
      AND is_read = 0
    `,
    [friendId, myId],
    (err) => {
      if (err) {
        return res.status(500).json(err);
      }
      res.json({ success: true });
    }
  );
});

//unread count
app.get("/api/chat/unread-count", verifyToken, (req, res) => {
  const userId = req.user.id;
  db.query(
    `
    SELECT COUNT(*) AS unreadCount
    FROM chat_messages
    WHERE receiver_id = ?
      AND is_read = 0
    `,
    [userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({
        unreadCount: result[0].unreadCount,
      });
    }
  );
});

// =============================
// ❌ DELETE CHAT
// =============================
app.post("/api/chat/delete", verifyToken, (req, res) => {
  const { user1, user2 } = req.body;
  const sql = `
    DELETE FROM chat_messages
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
  `;
  db.query(sql, [user1, user2, user2, user1], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});
//health check
app.get("/health", (req, res) => {
  res.sendStatus(200);
});
// =============================
// ✅ ROUTES
// =============================

app.use("/api", registerRoutes);

app.use("/api", forgotPasswordRoute);

app.use("/api", resetPasswordRoute);

app.use("/users", usersRoutes);

app.use("/call", callRoutes);

app.use("/api", loginRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/gifts", giftsRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/notification", notificationRoutes);
app.use("/risk", riskGameRoutes);
app.use("/withdraw", withdrawRoutes);
app.use("/deposit", depositRoutes);
// serve images

//app.use("/uploads", express.static("uploads"));

app.use("/friends", friendsRoutes);

app.use("/api", blockRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/jam-room", jamRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/hireme",hiremeRoutes);

// =============================

// ✅ TEST API

// =============================

app.get("/", (req, res) => {

  res.send("API Running 🚀");

});





// =============================

// ⚡ SOCKET.IO SETUP

// =============================

const server = http.createServer(app);

const io = new Server(server, {

  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },

  transports: ["websocket", "polling"],

  pingTimeout: 60000,

  pingInterval: 25000

});

// IMPORTANT
app.set("io", io);

// =============================
// USERS MAP
// =============================
//const users = {}; // userId -> socketId
//export const users = {};

io.on("connection", (socket) => {

  console.log("🔌 Connected:", socket.id);
  chatSocket(io, socket, db);
  jamRoomSocket(io, socket);
  colorCrashSocket(io, socket);
  socket.on("giftSent", (data) => {
    try {
      console.log(
        "🎁 Gift received on server:",
        data
      );
      if (!data?.roomId) return;
      // send to room
      io.to(data.roomId).emit(
        "giftReceived",
        data
      );
    } catch (err) {
      console.log(
        "❌ GIFT ERROR:",
        err
      );
    }
  });
  
socket.on("register", (userId) => {

  userId = String(userId);

  socket.userId = userId;

  // same user already connected?
  if (
    users[userId] &&
    users[userId] !== socket.id
  ) {

    const oldSocket =
      io.sockets.sockets.get(
        users[userId]
      );

    if (oldSocket) {

      console.log(
        `♻️ Replacing old socket for user ${userId}`
      );

      oldSocket.disconnect(true);

    }

  }

  users[userId] = socket.id;

  socket.join(`user-${userId}`);

  console.log(
    `👤 User ${userId} registered -> ${socket.id}`
  );

  console.log(
    "ONLINE USERS:",
    Object.keys(users)
  );

  io.emit(
    "onlineUsers",
    Object.keys(users)
  );

});

  socket.on("disconnect", () => {

    console.log(
      "🔌 Disconnected:",
      socket.id
    );

    if (!socket.userId) return;

    const userId = socket.userId;

    if (
      users[userId] &&
      users[userId] === socket.id
    ) {

      delete users[userId];

      console.log(
        `❌ User Offline: ${userId}`
      );

      io.emit(
        "onlineUsers",
        Object.keys(users)
      );
    }
  });

});

// =============================
// SERVER START
// =============================
server.listen(
  5000,
  "0.0.0.0",
  () => {

    console.log(
      "🚀 Server running on 5000"
    );
  }
);

// =============================
// SERVER TIMEOUTS
// =============================
server.timeout = 300000;

server.keepAliveTimeout = 300000;

server.headersTimeout = 300000;

// =============================
// GLOBAL ERROR HANDLERS
// =============================
process.on(
  "uncaughtException",
  (err) => {

    console.log(
      "❌ UNCAUGHT EXCEPTION:",
      err
    );
  }
);

process.on(
  "unhandledRejection",
  (err) => {

    console.log(
      "❌ UNHANDLED REJECTION:",
      err
    );
  }
);

// 👇 attach socket.io

/*const io = new Server(server, {

  pingTimeout: 60000,

  pingInterval: 25000,

  cors: {

    origin: "*"

  }

});*/

/*const io = new Server(server, {

  cors: {

    origin: "*",

    methods: ["GET", "POST"]

  },

  transports: ["websocket", "polling"],

  pingTimeout: 60000,

  pingInterval: 25000

});
// IMPORTANT
app.set("io", io);
chatSocket(io, db);
  jamRoomSocket(io);
if (!global.__socket_initialized__) {
  global.__socket_initialized__ = true;
  colorCrashSocket(io);
}
// 👇 socket connection

const users = {}; // userId -> socketId

io.on("connection", (socket) => {
console.log("🔌 Connected:", socket.id);
// ===================
// GAME SOCKET
// ===================
//colorCrashSocket(io);
 // 🔥 REMOVE OLD LISTENERS IF ANY (fix leak)
  //socket.removeAllListeners();
 // 🎁 GIFT HANDLER
  socket.on("giftSent", (data) => {
    console.log("🎁 Gift received on server:", data);

    // send to room
    io.to(data.roomId).emit("giftReceived", data);
  });
  // =========================

  // ✅ REGISTER USER

  // =========================

  socket.on("register", (userId) => {

    const id = Number(userId);

    // prevent duplicate register

    if (socket.userId === id) {

      return;

    }

    // save on socket

    socket.userId = id;

    // map user => socket

    users[id] = socket.id;

    // optional private room

    socket.join(`user-${id}`);

    // broadcast online users

    io.emit("onlineUsers", Object.keys(users));

    console.log("👤 User mapped:", id, "=>", socket.id);

  });



  // =========================

  // ✅ DISCONNECT

  // =========================

  socket.on("disconnect", () => {

    console.log("🔌 Disconnected:", socket.id);

    // remove mapped user

    if (socket.userId) {

      delete users[socket.userId];

      io.emit("onlineUsers", Object.keys(users));

    }

  });

});

// 👇 VERY IMPORTANT (use server.listen, not app.listen)

server.listen(5000, "0.0.0.0", () => {

  console.log("Server running on 5000");

});



server.timeout = 300000;

server.keepAliveTimeout = 300000;

server.headersTimeout = 300000;

// 👉 Initialize chat socket

//chatSocket(io);





// =============================

// 🚀 START SERVER

// =============================

/*server.listen(5000, () => {

  console.log("Server running on http://localhost:5000 🚀");

});*/

/*app.listen(5000, "0.0.0.0", () => {

  console.log("Server running on port 5000");

});

*/