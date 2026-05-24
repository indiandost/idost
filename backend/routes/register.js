import express from "express";
import bcrypt from "bcrypt";
const router = express.Router();
router.post("/register", async (req, res) => {
  const db = req.app.get("db");

  const {
    user,
    pass,
    name,
    email,
    telephone,
    dob,
    city,
    latitude,
    longitude
  } = req.body;

  const sql = `
    INSERT INTO users 
    (user, pass, name, email, telephone, dob, city, latitude, longitude, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'A')
  `;
  const hashedPassword = await bcrypt.hash(pass, 10);
  db.query(
    sql,
    [user, hashedPassword, name, email, telephone, dob, city, latitude, longitude],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: "DB error" });
      }

      res.json({ success: true });
    }
  );
});

router.post("/check-username", (req, res) => {
  const db = req.app.get("db");
  const { user } = req.body;

  db.query(
    "SELECT srno FROM users WHERE user=?",
    [user],
    (err, result) => {
      if (err) return res.json({ exists: false });

      res.json({ exists: result.length > 0 });
    }
  );
});
router.post("/check-email", (req, res) => {
  const db = req.app.get("db");
  const { email } = req.body;

  db.query(
    "SELECT srno FROM users WHERE email=?",
    [email],
    (err, result) => {
      if (err) return res.json({ exists: false });

      res.json({ exists: result.length > 0 });
    }
  );
});

export default router;