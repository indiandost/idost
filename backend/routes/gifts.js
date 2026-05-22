import express from "express";

const router = express.Router();

// ============================
// GET GIFT LIST
// ============================
router.get("/get-gift", (req, res) => {
  const db = req.app.get("db");

  db.query("SELECT * FROM gifts", (err, rows) => {
    if (err) {
      console.log("Gift List Error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    return res.json({
      success: true,
      gifts: rows,
    });
  });
});

// ============================
// SEND LIVE GIFT
// ============================
router.post("/send-gift", (req, res) => {
  const db = req.app.get("db");
  const io = req.app.get("io");

  const {
    sender_id,
    receiver_id,
    gift_id,
    room_id,
  } = req.body;

  // ============================
  // VALIDATION
  // ============================
  if (!sender_id || !receiver_id || !gift_id) {
    return res.status(400).json({
      success: false,
      message: "Missing data",
    });
  }

  // ============================
  // GET GIFT
  // ============================
  db.query(
    "SELECT * FROM gifts WHERE id=? LIMIT 1",
    [gift_id],
    (err, giftRows) => {
      if (err) {
        console.log("Gift SQL Error:", err);
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      if (!giftRows || giftRows.length === 0) {
        return res.json({
          success: false,
          message: "Gift not found",
        });
      }

      const gift = giftRows[0];

      // ============================
      // GET SENDER BALANCE
      // ============================
      db.query(
        "SELECT coins FROM users WHERE srno=? LIMIT 1",
        [sender_id],
        (err, senderRows) => {

          if (err) {
            return res.status(500).json({
              success: false,
              message: "User query error",
            });
          }

          if (!senderRows || senderRows.length === 0) {
            return res.json({
              success: false,
              message: "Sender not found",
            });
          }

          const senderBalance = Number(senderRows[0].coins) || 0;

          if (senderBalance < gift.coins) {
            return res.json({
              success: false,
              message: "Not enough coins",
            });
          }

          // ============================
          // GET RECEIVER BALANCE (FIX ADDED)
          // ============================
          db.query(
            "SELECT coins FROM users WHERE srno=? LIMIT 1",
            [receiver_id],
            (err, receiverRows) => {

              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Receiver query error",
                });
              }

              if (!receiverRows || receiverRows.length === 0) {
                return res.json({
                  success: false,
                  message: "Receiver not found",
                });
              }

              const receiverBalance =
                Number(receiverRows[0].coins) || 0;

              const senderNewBalance =
                senderBalance - gift.coins;

              const receiverNewBalance =
                receiverBalance + gift.coins;

              // ============================
              // UPDATE SENDER
              // ============================
              db.query(
                "UPDATE users SET coins = ? WHERE srno=?",
                [senderNewBalance, sender_id],
                (err) => {
                  if (err) {
                    return res.status(500).json({
                      success: false,
                      message: "Failed sender update",
                    });
                  }

                  // ============================
                  // UPDATE RECEIVER
                  // ============================
                  db.query(
                    "UPDATE users SET coins = ? WHERE srno=?",
                    [receiverNewBalance, receiver_id],
                    (err) => {
                      if (err) {
                        return res.status(500).json({
                          success: false,
                          message: "Failed receiver update",
                        });
                      }

                      // ============================
                      // HISTORY
                      // ============================
                      db.query(
                        `
                        INSERT INTO live_gifts
                        (sender_id, receiver_id, gift_id, coins, room_id, created_at)
                        VALUES (?,?,?,?,?,NOW())
                        `,
                        [
                          sender_id,
                          receiver_id,
                          gift_id,
                          gift.coins,
                          room_id || "",
                        ],
                        (err) => {
                          if (err) {
                            return res.status(500).json({
                              success: false,
                              message: "History error",
                            });
                          }

                          // ============================
                          // SOCKET EVENTS
                          // ============================
                          io.to(`user-${receiver_id}`).emit("giftReceived", {
                            senderId: sender_id,
                            gift,
                          });

                          io.to(`user-${sender_id}`).emit("giftSentSuccess", {
                            gift,
                          });

                          io.to(`user-${sender_id}`).emit("coinUpdate", {
                            coins: senderNewBalance,
                          });

                          io.to(`user-${receiver_id}`).emit("coinUpdate", {
                            coins: receiverNewBalance,
                          });

                          return res.json({
                            success: true,
                            message: "Gift sent",
                            gift,
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

export default router;