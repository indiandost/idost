import express from "express";
const router = express.Router();

router.post("/save-token", (req, res) => {
  const { user_id, token } = req.body;
  const db = req.app.get("db");
  db.query(
    "UPDATE users SET fcm_token=? WHERE id=?",
    [token, user_id]
  );

  res.json({ success: true });
});

export default router;