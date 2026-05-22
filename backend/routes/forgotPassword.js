import express from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = express.Router();

// SMTP
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "94a83b001@smtp-brevo.com",
    pass: "7shq6fbFOQG24NaI",
  },
});

// FORGOT PASSWORD
router.post("/forgot-password", (req, res) => {

  const db = req.app.get("db");

  const { email } = req.body;

  if (!email) {

    return res.status(400).json({
      status: false,
      message: "Email required",
    });
  }

  db.execute(
    "SELECT srno,name,email FROM users WHERE email=? LIMIT 1",
    [email],
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
          message: "Email not found",
        });
      }

      const user = rows[0];

      // TOKEN
      const token = crypto.randomBytes(32).toString("hex");

      // EXPIRE 1 HOUR
      const expire = new Date(
        Date.now() + 60 * 60 * 1000
      );

      // SAVE TOKEN
      db.execute(
        "UPDATE users SET reset_token=?, reset_token_expire=? WHERE srno=?",
        [token, expire, user.srno],

        async (updateErr) => {

          if (updateErr) {

            console.log(updateErr);

            return res.status(500).json({
              status: false,
              message: "Update error",
            });
          }

          // RESET LINK
          const resetLink =
            `https://indiandost.com/idost/reset-password/${token}`;

          const mailOptions = {
            from: '"IndianDost Support" <no-reply@indiandost.com>',
             to: user.email,
            subject: "Reset Password",

            html: `
              <h2>Hello ${user.name}</h2>

              <p>Click below to reset password:</p>

              <a href="${resetLink}">
                Reset Password
              </a>

              <p>Link valid for 1 hour.</p>
            `,
          };

          try {

            await transporter.sendMail(mailOptions);

            return res.json({
              status: true,
              message: "Reset link sent to email",
            });

          } catch (mailErr) {

            console.log(mailErr);

            return res.status(500).json({
              status: false,
              message: "Mail failed",
            });
          }
        }
      );
    }
  );
});

export default router;