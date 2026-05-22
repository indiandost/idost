import db from "../db.js";

const rewardJamWinner =
  async ({
    userId,
    roomId,
    votes,
  }) => {

    try {

      // ==========================
      // CALCULATE REWARD
      // ==========================
      const rewardCoins =
        Number(votes || 0) * 5;

      if (
        rewardCoins <= 0
      ) {

        return 0;
      }

      // ==========================
      // ADD COINS
      // ==========================
      await db.promise().query(
        `
        UPDATE users
        SET coins =
        coins + ?
        WHERE srno=?
        `,
        [
          rewardCoins,
          userId,
        ]
      );

      // ==========================
      // UPDATE ROOM USER
      // ==========================
      await db.promise().query(
        `
        UPDATE jam_room_users
        SET reward_coins=?
        WHERE room_id=?
        AND user_id=?
        `,
        [
          rewardCoins,
          roomId,
          userId,
        ]
      );

      // ==========================
      // SAVE HISTORY
      // ==========================
      await db.promise().query(
        `
        INSERT INTO rewards_history
        (
          user_id,
          reward_type,
          reward_value,
          coins,
          debit
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          userId,
          "JAM_WINNER",
          roomId,
          rewardCoins,
          0,
        ]
      );

      console.log(
        "🏆 JAM REWARD:",
        userId,
        rewardCoins
      );

      return rewardCoins;

    } catch (err) {

      console.log(
        "❌ REWARD WINNER ERROR:",
        err
      );

      return 0;
    }
  };

export default rewardJamWinner;