import express from "express";
import { verifyToken } from "../middlewares/auth.js";
import {
  startGame,
  submitScore,
  leaderboard,
  myStats,
} from "../controllers/mergeGameController.js";

const router = express.Router();

router.post("/start", verifyToken, startGame);
router.post("/submit", verifyToken, submitScore);
router.get("/leaderboard", leaderboard);
router.get("/me", verifyToken, myStats);

export default router;