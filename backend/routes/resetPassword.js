import express from "express";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/reset-password", async (req, res) => {

  const db = req.app.get("db");

  const { token, password } = req.body;

  if (!token || !password) {

    return res.status(400).json({
      status: false,
      message: "Missing fields",
    });
  }

  db.execute(
    `SELECT srno 
     FROM users 
     WHERE reset_token=?
     AND reset_token_expire > NOW()
     LIMIT 1`,

    [token],

    async (err, rows) => {

      if (err) {

        console.log(err);

        return res.status(500).json({
          status: false,
          message: "DB Error",
        });
      }

      if (rows.length === 0) {

        return res.json({
          status: false,
          message: "Invalid or expired token",
        });
      }

      const user = rows[0];

      // HASH PASSWORD
      const hashedPassword =
        await bcrypt.hash(password, 10);

      db.execute(
        `UPDATE users
         SET pass=?,
         reset_token=NULL,
         reset_token_expire=NULL
         WHERE srno=?`,

        [hashedPassword, user.srno],

        (updateErr) => {

          if (updateErr) {

            console.log(updateErr);

            return res.status(500).json({
              status: false,
              message: "Update failed",
            });
          }

          return res.json({
            status: true,
            message: "Password updated successfully",
          });
        }
      );
    }
  );
});

export default router;