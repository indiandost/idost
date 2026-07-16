// =========================================================
// MERGE GAME CONTROLLER (Nebula Merge)
// =========================================================
//
// 📌 ZAROORI: Ye do tables DB me pehle se bana lo (ek baar):
//
// CREATE TABLE merge_game_sessions (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   session_token VARCHAR(64) NOT NULL UNIQUE,
//   user_id INT NOT NULL,
//   entry_fee INT NOT NULL DEFAULT 0,
//   status ENUM('active','submitted','expired') NOT NULL DEFAULT 'active',
//   score INT DEFAULT 0,
//   reward_coins INT DEFAULT 0,
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//   submitted_at DATETIME NULL,
//   INDEX idx_user (user_id),
//   INDEX idx_token (session_token)
// );
//
// CREATE TABLE merge_game_best_scores (
//   user_id INT PRIMARY KEY,
//   best_score INT NOT NULL DEFAULT 0,
//   games_played INT NOT NULL DEFAULT 0,
//   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
// );
//
// 📌 ZAROORI: server.js me io ko app pe attach karo (agar already nahi hai):
//   app.set("io", io);
// =========================================================

import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import rewardUser from "../utils/rewardUser.js";

// =========================
// CONFIG
// =========================
const ENTRY_FEE = 5;              // har game start pe deduct hone wali coins
const NEW_BEST_BONUS = 5;         // apna personal best todne pe flat bonus
const MAX_PLAUSIBLE_SCORE = 200000; // isse upar score = obviously spoofed, reject
const MIN_MS_PER_POINT = 8;       // anti-cheat: kam se kam itne ms lagne chahiye har 1 score point ke liye

function rankReward(rank) {
  if (rank === 1) return 100;
  if (rank === 2) return 60;
  if (rank === 3) return 40;
  if (rank <= 10) return 15;
  return 0;
}

// req.user ka exact shape tumhare verifyToken middleware pe depend karta hai —
// zaroorat pade to isme field name adjust kar lena (srno / id / userId).
function getUserId(req) {
  return (
    req.user?.srno ||
    req.user?.id ||
    req.user?.userId ||
    null
  );
}

// =========================================================
// START GAME — entry fee deduct karke session banata hai
// =========================================================
export const startGame = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    // =====================
    // CHECK COINS
    // =====================
    const [userRows] = await db.promise().query(
      `SELECT coins FROM users WHERE srno=? LIMIT 1`,
      [userId]
    );

    if (!userRows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentCoins = Number(userRows[0].coins || 0);

    if (currentCoins < ENTRY_FEE) {
      return res.status(400).json({
        success: false,
        message: `Need ${ENTRY_FEE} coins to play`,
      });
    }

    // =====================
    // EXPIRE OLD ACTIVE SESSIONS (hygiene — koi purana bhula hua session
    // baad me galat submit ke liye reuse na ho paye)
    // =====================
    await db.promise().query(
      `UPDATE merge_game_sessions
       SET status='expired'
       WHERE user_id=? AND status='active'`,
      [userId]
    );

    // =====================
    // CREATE SESSION
    // =====================
    const sessionToken = uuidv4();

    await db.promise().query(
      `INSERT INTO merge_game_sessions
       (session_token, user_id, entry_fee, status)
       VALUES (?, ?, ?, 'active')`,
      [sessionToken, userId, ENTRY_FEE]
    );

    // =====================
    // DEDUCT ENTRY FEE
    // =====================
    const io = req.app.get("io");

    await rewardUser(
      db,
      io,
      userId,
      ENTRY_FEE,
      "GAME_FEES",
      sessionToken,
      1 // debit
    );

    return res.json({
      success: true,
      sessionToken,
      entryFee: ENTRY_FEE,
    });

  } catch (err) {
    console.log("❌ START MERGE GAME ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to start game",
    });
  }
};

// =========================================================
// SUBMIT SCORE — session validate, best-score update, reward
// =========================================================
export const submitScore = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { sessionToken, score } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    if (!sessionToken || typeof score !== "number" || !Number.isFinite(score) || score < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission",
      });
    }

    if (score > MAX_PLAUSIBLE_SCORE) {
      return res.status(400).json({
        success: false,
        message: "Score rejected",
      });
    }

    const roundedScore = Math.floor(score);

    // =====================
    // LOAD + VALIDATE SESSION
    // =====================
    const [sessionRows] = await db.promise().query(
      `SELECT * FROM merge_game_sessions
       WHERE session_token=? AND user_id=?
       LIMIT 1`,
      [sessionToken, userId]
    );

    if (!sessionRows.length) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const session = sessionRows[0];

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Session already used or expired",
      });
    }

    // =====================
    // ⚠️ SOFT ANTI-CHEAT NOTE:
    // Ye score client-side game se aa raha hai, isliye 100% cheat-proof
    // nahi hai — jaisa zyada tar casual single-player score-submission
    // games me hota hai. Neeche wala elapsed-time heuristic sirf
    // "turant bahut bada score submit karna" jaisi obvious spoofing
    // ko rokta hai. Agar fully server-authoritative anti-cheat chahiye
    // (har move server pe validate ho), to poora game-state tracking
    // alag se banana padega — bata dena agar wo chahiye.
    // =====================
    const elapsedMs = Date.now() - new Date(session.created_at).getTime();
    const minRequiredMs = roundedScore * MIN_MS_PER_POINT;

    if (roundedScore > 0 && elapsedMs < minRequiredMs) {
      await db.promise().query(
        `UPDATE merge_game_sessions
         SET status='expired'
         WHERE id=?`,
        [session.id]
      );

      return res.status(400).json({
        success: false,
        message: "Score rejected",
      });
    }

    // =====================
    // MARK SESSION SUBMITTED
    // =====================
    await db.promise().query(
      `UPDATE merge_game_sessions
       SET status='submitted', score=?, submitted_at=NOW()
       WHERE id=?`,
      [roundedScore, session.id]
    );

    // =====================
    // UPSERT BEST SCORE
    // =====================
    const [bestRows] = await db.promise().query(
      `SELECT best_score FROM merge_game_best_scores WHERE user_id=? LIMIT 1`,
      [userId]
    );

    let isNewBest = false;
    let currentBest = bestRows.length ? Number(bestRows[0].best_score) : 0;

    if (!bestRows.length) {
      await db.promise().query(
        `INSERT INTO merge_game_best_scores (user_id, best_score, games_played)
         VALUES (?, ?, 1)`,
        [userId, roundedScore]
      );
      currentBest = roundedScore;
      isNewBest = roundedScore > 0;
    } else {
      await db.promise().query(
        `UPDATE merge_game_best_scores
         SET games_played = games_played + 1
         WHERE user_id=?`,
        [userId]
      );

      if (roundedScore > currentBest) {
        await db.promise().query(
          `UPDATE merge_game_best_scores
           SET best_score=?
           WHERE user_id=?`,
          [roundedScore, userId]
        );
        currentBest = roundedScore;
        isNewBest = true;
      }
    }

    // =====================
    // REWARD (sirf naya personal best banne par)
    // =====================
    let reward = 0;
    let rank = null;

    if (isNewBest) {
      const [rankRows] = await db.promise().query(
        `SELECT COUNT(*) AS higher
         FROM merge_game_best_scores
         WHERE best_score > ?`,
        [currentBest]
      );

      rank = Number(rankRows[0].higher) + 1;

      reward = NEW_BEST_BONUS + rankReward(rank);

      if (reward > 0) {
        const io = req.app.get("io");

        await rewardUser(
          db,
          io,
          userId,
          reward,
          "GAME_WIN",
          sessionToken
          // debit param diya hi nahi — default 0 (credit)
        );

        await db.promise().query(
          `UPDATE merge_game_sessions
           SET reward_coins=?
           WHERE id=?`,
          [reward, session.id]
        );
      }
    }

    return res.json({
      success: true,
      score: roundedScore,
      bestScore: currentBest,
      isNewBest,
      rank,
      reward,
    });

  } catch (err) {
    console.log("❌ SUBMIT MERGE SCORE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit score",
    });
  }
};

// =========================================================
// LEADERBOARD — public, top players
// =========================================================
export const leaderboard = async (req, res) => {
  try {
    const limit = Math.min(
      Number(req.query.limit) || 20,
      50
    );

    const [rows] = await db.promise().query(
      `SELECT
         b.user_id,
         b.best_score,
         b.games_played,
         u.name,
         u.pic
       FROM merge_game_best_scores b
       INNER JOIN users u ON u.srno = b.user_id
       ORDER BY b.best_score DESC
       LIMIT ?`,
      [limit]
    );

    const list = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      name: r.name,
      pic: r.pic,
      bestScore: r.best_score,
      gamesPlayed: r.games_played,
    }));

    return res.json({
      success: true,
      leaderboard: list,
    });

  } catch (err) {
    console.log("❌ MERGE LEADERBOARD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load leaderboard",
    });
  }
};

// =========================================================
// MY STATS — authenticated user ka apna best + rank
// =========================================================
export const myStats = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    const [rows] = await db.promise().query(
      `SELECT best_score, games_played
       FROM merge_game_best_scores
       WHERE user_id=?
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.json({
        success: true,
        bestScore: 0,
        gamesPlayed: 0,
        rank: null,
      });
    }

    const bestScore = Number(rows[0].best_score);

    const [rankRows] = await db.promise().query(
      `SELECT COUNT(*) AS higher
       FROM merge_game_best_scores
       WHERE best_score > ?`,
      [bestScore]
    );

    const rank = Number(rankRows[0].higher) + 1;

    return res.json({
      success: true,
      bestScore,
      gamesPlayed: Number(rows[0].games_played),
      rank,
    });

  } catch (err) {
    console.log("❌ MERGE MY STATS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load stats",
    });
  }
};