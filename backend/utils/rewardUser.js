export default function rewardUser(
  db,
  io,
  userId,
  coins,
  type,
  value = ""
) {

  // =========================
  // ADD COINS
  // =========================
  db.query(
    "UPDATE users SET coins = coins + ? WHERE srno=?",
    [coins, userId],
    (err) => {

      if (err) {
        console.log("Reward Error:", err);
        return;
      }

      // =========================
      // SAVE HISTORY
      // =========================
      db.query(
        `
        INSERT INTO rewards_history
        (
          user_id,
          reward_type,
          reward_value,
          coins
        )
        VALUES (?,?,?,?)
        `,
        [
          userId,
          type,
          value,
          coins
        ]
      );

      // =========================
      // GET NEW BALANCE
      // =========================
      db.query(
        "SELECT coins FROM users WHERE srno=? LIMIT 1",
        [userId],
        (err, rows) => {

          if (err || !rows?.length) {
            return;
          }

          const newBalance =
            Number(rows[0].coins) || 0;

          // =========================
          // REALTIME COIN UPDATE
          // =========================
          io.to(`user-${userId}`).emit(
            "coinUpdate",
            {
              coins: newBalance
            }
          );

          // =========================
          // REWARD POPUP
          // =========================
          io.to(`user-${userId}`).emit(
            "rewardReceived",
            {
              coins,
              type,
              value
            }
          );

        }
      );

    }
  );

}