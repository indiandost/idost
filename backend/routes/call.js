import express from "express";

const router = express.Router();

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