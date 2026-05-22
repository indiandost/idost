import express from "express";

import {
  createJamRoom,
  getLiveJamRooms,
  getJamRoomDetails,
  endJamRoom,
  getTopPerformers,
} from "../controllers/jamRoomController.js";

const router = express.Router();
// ==============================
// CREATE JAM ROOM
// ==============================
router.post(
  "/create",
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
  "/:roomId",
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