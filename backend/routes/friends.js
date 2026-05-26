import express from "express";
import { verifyToken } from "../middlewares/auth.js";
const router = express.Router();


// =============================
// ➕ SEND FRIEND REQUEST
// =============================
router.post("/send",  verifyToken,(req, res) => {
  const db = req.app.get("db");
//console.log('block-api /send   friend req');
  const { user, user2 } = req.body;

  // check already exists
  const checkSql = `
    SELECT * FROM myfriends 
    WHERE (user=? AND user2=?) OR (user=? AND user2=?)
  `;

  db.query(checkSql, [user, user2, user2, user], (err, rows) => {
    if (err) return res.status(500).json(err);

    if (rows.length > 0) {
      return res.json({ success: false, msg: "Already requested or friends" });
    }

    const sql = `
      INSERT INTO myfriends (user, user2, invite, allow, date)
      VALUES (?, ?, 'i', 'p', NOW())
    `;

    db.query(sql, [user, user2], (err) => {
      if (err) return res.status(500).json(err);

      res.json({ success: true, msg: "Request sent" });
    });
  });
});


// =============================
// 📥 GET RECEIVED REQUESTS
// =============================
router.get("/received/:user_id",  verifyToken, (req, res) => {
  const db = req.app.get("db");
  const user_id = req.params.user_id;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;

  const sql = `
  SELECT f.srno as requestId, f.*, u.name, u.pic
  FROM myfriends f
  JOIN users u ON u.srno = f.user
  WHERE f.user2 = ? AND f.allow = 'p'
  ORDER BY f.srno DESC LIMIT ? OFFSET ?
`;

  db.query(sql, [user_id, limit, offset], (err, result) => {
    if (err) return res.status(500).json(err);
  console.log(result);
    res.json(result);
  
  });
});


// =============================
// 📤 GET SENT REQUESTS
// =============================
router.get("/sent/:user_id", verifyToken, (req, res) => {
  const db = req.app.get("db");
  const user_id = req.params.user_id;

  const sql = `
    SELECT * FROM myfriends
    WHERE user = ? AND allow = 'p'
    ORDER BY srno DESC
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});


// =============================
// ✅ ACCEPT REQUEST
// =============================
router.post("/accept", verifyToken, (req, res) => {
  const db = req.app.get("db");

  const { id } = req.body;

  const sql = `
    UPDATE myfriends
    SET allow = 'a'
    WHERE srno = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ success: true, msg: "Friend request accepted" });
  });
});


// =============================
// ❌ DELETE / REJECT REQUEST
// =============================
router.post("/delete",  verifyToken, (req, res) => {
  const db = req.app.get("db");

  const { id } = req.body;

  const sql = `
    DELETE FROM myfriends
    WHERE srno = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ success: true, msg: "Request deleted" });
  });
});

// =============================
// ❌ REMOVE FRIEND (by users)
// =============================
router.post("/remove", verifyToken,  (req, res) => {
  const db = req.app.get("db");

  const { user, user2 } = req.body;

  const sql = `
    DELETE FROM myfriends 
    WHERE (user=? AND user2=?) OR (user=? AND user2=?)
  `;

  db.query(sql, [user, user2, user2, user], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ success: true, msg: "Friend removed" });
  });
});


// =============================
// 👥 GET FRIEND LIST
// =============================
router.get("/list/:user_id", verifyToken, (req, res) => {
  const db = req.app.get("db");
  const user_id = req.params.user_id;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const offset = (page - 1) * limit;

  const sql = `
    SELECT f.*, u.name, u.pic
    FROM myfriends f
    JOIN users u 
    ON u.srno = IF(f.\`user\` = ?, f.user2, f.\`user\`)
    WHERE (f.\`user\` = ? OR f.user2 = ?) AND f.allow = 'a' 
    ORDER BY f.srno DESC LIMIT ? OFFSET ?
  `;

  db.query(sql, [user_id, user_id, user_id, limit, offset], (err, result) => {
    if (err) {
      console.log("SQL ERROR:", err);
      return res.status(500).json(err);
    }

    res.json(result);
  });
});

router.get("/status/:me/:other", verifyToken, (req, res) => {
  const db = req.app.get("db");
  const { me, other } = req.params;
 // console.log(me +'-status of me n other-'+other);
  const sql = `
    SELECT * FROM myfriends
    WHERE (user = ? AND user2 = ?)
       OR (user = ? AND user2 = ?)
    LIMIT 1
  `;

  db.query(sql, [me, other, other, me], (err, result) => {
    if (err) return res.json({ status: "error" });

    if (result.length === 0) {
      return res.json({ status: "none" });
    }

    const row = result[0];

    // ✅ FRIEND
    if (row.allow === "a") {
      return res.json({ status: "friends", id: row.srno });
    }

    // ✅ PENDING CASE
    if (row.allow === "p") {
      if (Number(row.user) === Number(me)) {
        return res.json({ status: "sent", id: row.srno });
      } else {
        return res.json({ status: "received", id: row.srno });
      }
    }

    return res.json({ status: "none" });
  });
});

export default router;