import express from "express";

const router = express.Router();

import {
  getRooms,
  getRoomDetails,
  getLeaderboard,
  getUserGameHistory,
} from "../controllers/gameController.js";


// =========================
// ROUTES
// =========================

router.get("/rooms", getRooms);

router.get("/room/:roomId", getRoomDetails);

router.get("/leaderboard", getLeaderboard);

router.get("/history/:userId", getUserGameHistory);


export default router;