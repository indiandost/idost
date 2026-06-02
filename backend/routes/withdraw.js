import express from "express";

const router = express.Router();

// ============================
// CREATE WITHDRAW REQUEST
// ============================
router.post("/request", (req, res) => {
const db = req.app.get("db");

const {
user_id,
coins,
payment_method,
account_details
} = req.body;

// 100 Coins = ₹1
const amount = coins / 100;

if (coins < 10000) {
return res.json({
success: false,
message: "Minimum withdrawal is 10000 coins"
});
}

db.query(
"SELECT coins FROM users WHERE srno=?",
[user_id],
(err, rows) => {

  if (err || !rows.length) {
    return res.json({
      success: false,
      message: "User not found"
    });
  }

  const balance = Number(rows[0].coins);

  if (balance < coins) {
    return res.json({
      success: false,
      message: "Insufficient coins"
    });
  }

  db.query(
    `
    INSERT INTO withdrawal_requests
    (
      user_id,
      coins,
      amount,
      payment_method,
      account_details
    )
    VALUES (?,?,?,?,?)
    `,
    [
      user_id,
      coins,
      amount,
      payment_method,
      account_details
    ],
    (err2) => {

      if (err2) {
        console.log(err2);

        return res.json({
          success: false
        });
      }

      res.json({
        success: true,
        message: "Withdrawal request submitted"
      });

    }
  );

}

);
});

router.get("/history/:userId", (req, res) => {

const db = req.app.get("db");

db.query(
`     SELECT *
    FROM withdrawal_requests
    WHERE user_id=?
    ORDER BY id DESC
    `,
[req.params.userId],
(err, rows) => {

  if (err) {
    return res.json([]);
  }

  res.json(rows);
}


);
});


export default router;
