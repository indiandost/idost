import express from "express";
import rewardUser from "../utils/rewardUser.js";

const router = express.Router();

router.post("/daily-login", (req, res) => {

  const db = req.app.get("db");
  const io = req.app.get("io");

  const { userId } = req.body;

  if (!userId) {
    return res.json({
      success: false
    });
  }

  // already claimed today?
  db.query(
    `
    SELECT *
    FROM rewards_history
    WHERE user_id=?
    AND reward_type='daily_login'
    AND DATE(created_at)=CURDATE()
    `,
    [userId],
    (err, rows) => {

      if (rows.length > 0) {

        return res.json({
          success: false,
          message:
            "Already claimed today"
        });

      }

      // reward
      rewardUser(
        db,
        io,
        userId,
        20,
        "daily_login",
        "Daily Login"
      );

      return res.json({
        success: true,
        coins: 20
      });

    }
  );

});

// ==========================================
// 🎁 REWARD HISTORY WITH PAGINATION
// API:
// /api/rewards/history/:userId?page=1
// ==========================================

router.get("/history/:userId", (req, res) => {

  const db = req.app.get("db");

  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Invalid user",
    });
  }

  // pagination
  const page = Number(req.query.page) || 1;

  const limit = 20;

  const offset = (page - 1) * limit;

  // =========================
  // TOTAL COUNT
  // =========================
  db.query(
    `
    SELECT COUNT(*) as total
    FROM rewards_history
    WHERE user_id = ?
    `,
    [userId],

    (err, countRows) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          success: false,
          message: "Count query error",
        });
      }

      const total = countRows[0].total;

      // =========================
      // FETCH HISTORY
      // =========================
      db.query(
        `
        SELECT
          id,
          user_id,
          reward_type,
          reward_value,
          coins,
          created_at,
          debit
        FROM rewards_history
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
        OFFSET ?
        `,
        [userId, limit, offset],

        (err2, rows) => {

          if (err2) {

            console.log(err2);

            return res.status(500).json({
              success: false,
              message: "Reward query error",
            });
          }

          return res.json({
            success: true,
            rewards: rows,
            page,
            totalPages: Math.ceil(total / limit),
            hasMore:
              offset + rows.length < total,
          });
        }
      );
    }
  );
});
export default router;