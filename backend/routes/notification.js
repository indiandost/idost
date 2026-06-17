import express from "express";
const router = express.Router();

router.post("/save-token", (req, res) => {
  const { user_id, token } = req.body;
  const db = req.app.get("db");

  db.query(
    "UPDATE users SET fcm_token=? WHERE srno=?",
    [token, user_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.json({ success: false });
      }

      console.log("Updated rows:", result.affectedRows);

      res.json({
        success: result.affectedRows > 0
      });
    }
  );
});

export default router;