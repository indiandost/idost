import express from "express";

const router = express.Router();

// =========================
// BLOCK USER
// =========================
router.post("/block", (req, res) => {
//console.log('block-api /block');
  const db = req.app.get("db");

  const { user, user2 } = req.body;

  // already blocked?
  db.query(
    "SELECT sr FROM ignorelist WHERE user=? AND user2=?",
    [user, user2],
    (err, rows) => {

      if (rows.length > 0) {
        return res.json({
          success: false,
          message: "Already blocked",
        });
      }

      db.query(
        `
        INSERT INTO ignorelist
        (user, user2, status)
        VALUES (?, ?, 'A')
        `,
        [user, user2],
        (err2) => {

          if (err2) {
            console.log(err2);

            return res.json({
              success: false,
            });
          }

          res.json({
            success: true,
          });

        }
      );

    }
  );

});

// =========================
// BLOCK LIST
// =========================
router.get("/block-list/:userId", (req, res) => {
//console.log('block-api /block-list');
  const db = req.app.get("db");

  const userId = Number(req.params.userId);

  const sql = `
    SELECT
      u.srno,
      u.name,
      u.pic,
      u.city
    FROM ignorelist i
    JOIN users u
      ON u.srno = i.user2
    WHERE i.user = ?
    ORDER BY i.sr DESC
  `;

  db.query(sql, [userId], (err, result) => {

    if (err) {

      console.log(err);

      return res.json([]);

    }

    res.json(result);

  });

});

// =========================
// UNBLOCK
// =========================
router.post("/unblock", (req, res) => {

  const db = req.app.get("db");

  const { user, user2 } = req.body;

  db.query(
    `
    DELETE FROM ignorelist
    WHERE user=? AND user2=?
    `,
    [user, user2],
    (err) => {

      if (err) {
        return res.json({
          success: false,
        });
      }

      res.json({
        success: true,
      });

    }
  );

});

export default router;