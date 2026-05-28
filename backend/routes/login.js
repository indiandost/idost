import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middlewares/auth.js";

const JWT_SECRET = "my_super_secret_key";

const router = express.Router();

router.post("/login", (req, res) => {

  const db = req.app.get("db");

  const { user, pass, lat, lng } = req.body;
//console.log(user + '--in login-' +pass);
  // FIND USER BY USERNAME OR EMAIL
  const loginSql = `
    SELECT * 
    FROM users 
    WHERE user=? OR email=?
    LIMIT 1
  `;

  db.query(loginSql, [user, user], async (err, result) => {

    if (err) {

      console.log(err);

      return res.json({
        success: false,
        message: "Database error"
      });
    }

    // USER NOT FOUND
    if (result.length === 0) {

      return res.json({
        success: false,
        message: "Invalid login"
      });
    }

    const userData = result[0];

    let passwordMatched = false;

    // =========================
    // CHECK BCRYPT PASSWORD
    // =========================
    if (userData.pass && ( userData.pass.startsWith("$2a$") ||  userData.pass.startsWith("$2b$") || userData.pass.startsWith("$2y$"))) 
      {
      try {
        passwordMatched = await bcrypt.compare(
          pass,
          userData.pass
        );

      } catch (bcryptErr) {
        console.log(bcryptErr);
        return res.json({
          success: false,
          message: "Password verification failed"
        });
      }

    } else {

      // =========================
      // OLD NORMAL PASSWORD
      // =========================
      passwordMatched = (pass === userData.pass);

      // AUTO CONVERT OLD PASSWORD TO BCRYPT
      if (passwordMatched) {
        try {
          const hashedPassword = await bcrypt.hash(pass, 10);
          db.query(
            "UPDATE users SET pass=? WHERE srno=?",
            [hashedPassword, userData.srno]
          );

        } catch (hashErr) {

          console.log(hashErr);
        }
      }
    }

    // PASSWORD WRONG
    if (!passwordMatched) {

      return res.json({
        success: false,
        message: "Invalid login"
      });
    }

    // =========================
    // UPDATE LOGIN INFO
    // =========================
    const updateSql = `
      UPDATE users 
      SET 
        latitude = ?, 
        longitude = ?, 
        l_dt = CURDATE(),
        onst = '1'
      WHERE srno = ?
    `;

    db.query(
      updateSql,
      [
        lat || 0,
        lng || 0,
        userData.srno
      ]
    );

      // CREATE JWT TOKEN
      const token = jwt.sign(
        {
          id: userData.srno,
          email: userData.email,
          name: userData.name
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
    // =========================
    // LOGIN SUCCESS
    // =========================
    return res.json({
      success: true,
      token,
      user: {
        srno: userData.srno,
        name: userData.name,
        mood: userData.mood,
        email: userData.email
      }
    });
  });
});

// LOGOUT
 router.post("/logout", verifyToken, (req, res) => {
  console.log('logout with token');
  const db = req.app.get("db");

  //const { userId } = req.body;
const userId = req.user.id;
  db.query(
    "UPDATE users SET onst='0' WHERE srno=?",
    [userId],

    () => {

      return res.json({
        success: true
      });
    }
  );
});

export default router;