import express from "express";
import { verifyToken } from "../middlewares/auth.js";
const router = express.Router();

/* //normal call system
router.post("/add-time", verifyToken, async (req, res) => {
  const { userId, seconds } = req.body;

  // reset if old date
  await db.query(`
    UPDATE users
    SET
      video_seconds = 0,
      video_date = CURDATE()
    WHERE srno = ?
    AND (
      video_date IS NULL
      OR video_date <> CURDATE()
    )
  `, [userId]);

  // add seconds
  await db.query(`
    UPDATE users
    SET video_seconds = video_seconds + ?
    WHERE srno = ?
  `, [seconds, userId]);

  // get updated value
  const [rows] = await db.query(`
    SELECT video_seconds
    FROM users
    WHERE srno = ?
  `, [userId]);

  res.json({
    used: rows[0].video_seconds,
    remaining: Math.max(
      0,
      30 - rows[0].video_seconds
    )
  });
});
*/
///////////////////////////////////////////////////////
/*Normal users → max 30 sec/day
Users with coins >= 5000 → max 300 sec/day
During call:
deduct 1 coin per second from very first second
If coins become 0 → stop call */
////////////////////////////////////////////////////////
router.post("/add-time", verifyToken, async (req, res) => {
  try {
    const db = req.app.get("db");

    const { userId, seconds } = req.body;

    // =========================
    // RESET DAILY IF NEW DAY
    // =========================
    await db.promise().query(
      `
      UPDATE users
      SET
        video_seconds = 0,
        video_date = CURDATE()
      WHERE srno = ?
      AND (
        video_date IS NULL
        OR video_date <> CURDATE()
      )
    `,
      [userId]
    );

    // =========================
    // GET USER
    // =========================
    const [rows] = await db.promise().query(
      `
      SELECT srno, coins, video_seconds
      FROM users
      WHERE srno = ?
    `,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = rows[0];

    let coins =
      Number(user.coins || 0);

    let usedSeconds =
      Number(user.video_seconds || 0);

    // =========================
    // DAILY LIMIT
    // =========================
    const dailyLimit =
      coins >= 5000 ? 300 : 30;

    // =========================
    // CHECK DAILY LIMIT
    // =========================
    if (
      usedSeconds + seconds >
      dailyLimit
    ) {
      return res.json({
        success: false,
        limitReached: true,
        message:
          "Daily video call limit reached",

        used: usedSeconds,

        remaining: Math.max(
          0,
          dailyLimit - usedSeconds
        ),

        coins,
      });
    }

    // =========================
    // CHECK COINS
    // =========================
    if (coins < seconds) {
      return res.json({
        success: false,
        limitReached: true,
        message: "Not enough coins",
        coins,
      });
    }

    // =========================
    // UPDATE USER
    // =========================
    await db.promise().query(
      `
      UPDATE users
      SET
        video_seconds = video_seconds + ?,
        coins   = GREATEST(coins - ?, 0)
      WHERE srno = ?
    `,
      [seconds, seconds, userId]
    );

    // =========================
    // FINAL VALUES
    // =========================
    const finalUsed =
      usedSeconds + seconds;

    const finalCoins =
      coins - seconds;

    res.json({
      success: true,

      used: finalUsed,

      remaining: Math.max(
        0,
        dailyLimit - finalUsed
      ),

      coinsLeft: finalCoins,

      dailyLimit,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

///meeting billing api
/*User Type	Need Coins	Pays/sec	Can Stay
Admin	≥30	YES	Until balance/daily limit
Guest speaker	≥30	NO	Unlimited while admin active
Viewer	0	NO	Unlimited
*/
router.post(
  "/add-meet-time",
  verifyToken,
  async (req, res) => {
    try {
      const db = req.app.get("db");

      const { userId, seconds } = req.body;

      // safety
      const sec = Math.max(
        1,
        Number(seconds || 1)
      );

      // =========================
      // GET USER
      // =========================
      const [rows] =
        await db.promise().query(
          `
          SELECT srno, coins
          FROM users
          WHERE srno = ?
        `,
          [userId]
        );

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = rows[0];

      const coins = Number(
        user.coins || 0
      );

      // =========================
      // NO COINS
      // =========================
      if (coins <= 0) {
        return res.json({
          success: false,
          limitReached: true,
          message: "No coins left",
          coinsLeft: 0,
        });
      }

      // =========================
      // DEDUCT ONLY AVAILABLE
      // =========================
      const deductSeconds = Math.min(
        sec,
        coins
      );

      // =========================
      // UPDATE USER
      // =========================
      await db.promise().query(
        `
        UPDATE users
        SET
          coins = GREATEST(
            coins - ?,
            0
          )
        WHERE srno = ?
      `,
        [deductSeconds, userId]
      );

      // =========================
      // FINAL
      // =========================
      const finalCoins =
        coins - deductSeconds;

      res.json({
        success: true,

        deducted: deductSeconds,

        coinsLeft: Math.max(
          0,
          finalCoins
        ),
      });
    } catch (err) {
      console.log(err);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);
// =============================
// 📞 START CALL
// =============================
router.post("/start", (req, res) => {
  const db = req.app.get("db");

  const { caller_id, receiver_id, type } = req.body;

  const sql = `
    INSERT INTO calls (caller_id, receiver_id, call_type, status, started_at)
    VALUES (?, ?, ?, 'missed', NOW())
  `;

  db.query(sql, [caller_id, receiver_id, type], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      success: true,
      call_id: result.insertId
    });
  });
});

// =============================
// 📞 END CALL
// =============================
router.post("/end", (req, res) => {
  const db = req.app.get("db");

  const { call_id, status } = req.body;

  const sql = `
    UPDATE calls 
    SET status = ?, ended_at = NOW()
    WHERE id = ?
  `;

  db.query(sql, [status, call_id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ success: true });
  });
});

// =============================
// 📞 CALL HISTORY
// =============================
router.get("/history/:user_id", (req, res) => {
  const db = req.app.get("db");
  const user_id = req.params.user_id;

  const sql = `
    SELECT * FROM calls 
    WHERE caller_id = ? OR receiver_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [user_id, user_id], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});

export default router;