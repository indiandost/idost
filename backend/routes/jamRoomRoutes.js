import express from "express";

import {
  createJamRoom,
  getLiveJamRooms,
  getJamRoomDetails,
  endJamRoom,
  getTopPerformers,
} from "../controllers/jamRoomController.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();
// ==============================
// CREATE JAM ROOM
// ==============================
router.post(
  "/create",verifyToken,
  createJamRoom
);


// ==============================
// LIVE ROOMS
// ==============================
router.get(
  "/live",
  getLiveJamRooms
);
// ==============================
// ROOM DETAILS
// ==============================
router.get(
  "/:roomId", verifyToken, 
  getJamRoomDetails
);
// ==============================
// END ROOM
// ==============================
router.post(
  "/end/:roomId",
  endJamRoom
);
// ==============================
// TOP PERFORMERS
// ==============================
router.get(
  "/top-performers/:roomId",
  getTopPerformers
);

export default router;