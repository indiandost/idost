import express from "express";
import db from "../db.js";

const router = express.Router();

// ✅ Send Message
router.post("/send", (req, res) => {
  const { conversation_id, sender_id, message, type } = req.body;

  const sql = `
    INSERT INTO messages (conversation_id, sender_id, message, message_type)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [conversation_id, sender_id, message, type], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// ✅ Get Messages
router.get("/:cid", (req, res) => {
  const cid = req.params.cid;

  db.query(
    "SELECT * FROM messages WHERE conversation_id=? ORDER BY id ASC",
    [cid],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

export default router;