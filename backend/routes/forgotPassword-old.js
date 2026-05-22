import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// BREVO SMTP
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "94a83b001@smtp-brevo.com",
    pass: "7shq6fbFOQG24NaI",
  },
});

// FORGOT PASSWORD API
router.post("/forgot-password", async (req, res) => {

  try {

    // DATABASE
    const db = req.app.get("db");

    const { email } = req.body;

    if (!email) {

      return res.status(400).json({
        status: false,
        message: "Email is required",
      });
    }

    db.execute(
      "SELECT user, pass, name FROM users WHERE email=? LIMIT 1",
      [email],

      async (err, rows) => {

        if (err) {

          console.log(err);

          return res.status(500).json({
            status: false,
            message: "Database error",
          });
        }

        if (rows.length === 0) {

          return res.json({
            status: false,
            message: "Email not found",
          });
        }

        const user = rows[0];

        // EMAIL CONTENT
        const mailOptions = {
          from: '"Indian Dost" <indiandost2@gmail.com>',
          replyTo: "no-reply@indiandost.com",
          to: email,
          subject: "Your Password",
          html: `
            <h2>Hello ${user.name}</h2>

            <p>Your username is:</p>
            <h3>${user.user}</h3>

            <p>Your password is:</p>
            <h3>${user.pass}</h3>
          `,
        };

        try {

          await transporter.sendMail(mailOptions);

          return res.json({
            status: true,
            message: "Password sent to email",
          });

        } catch (mailErr) {

          console.log(mailErr);

          return res.status(500).json({
            status: false,
            message: "Email sending failed",
          });
        }
      }
    );

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
});

export default router;