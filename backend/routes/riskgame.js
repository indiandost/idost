import express from "express";
import rewardUser from "../utils/rewardUser.js";
const router = express.Router();

// Risk Tower rewards
const FLOOR_REWARDS = [
  15,
  25,
  40,
  70,
  120,
  200,
  350,
  600,
  1000,
  2000
];

// =======================
// START GAME
// =====================
router.post("/start", async (req, res) => {

  const db = req.app.get("db");

  const { user_id } = req.body;

  db.query(
    "SELECT coins FROM users WHERE srno=?",
    [user_id], async (err, rows) => {

      if (!rows.length) {
        return res.json({
          success: false
        });
      }

      if (rows[0].coins < 10) {

        return res.json({
          success: false,
          message:
            "Not enough coins"
        });

      }

      /*db.query(
        `
        UPDATE users
        SET coins=coins-10
        WHERE srno=?
        `,
        [user_id]
      );*/
     

      db.query(
        `
        INSERT INTO risk_games
        (
          user_id,
          entry_fee
        )
        VALUES (?,10)
        `,
        [user_id], async (err2, result) => {

          res.json({
            success: true,
            gameId:
              result.insertId
          });

        const debit=1; const entryfee = 10;
        try {            
            await rewardUser(
                db,
                io,
                user_id,
                entryfee,
                "RISK_GAME_ENTRY",
                gameId,
                debit
            );

            } catch (err) {

            console.log(err);

            return res.json({
                success: false,
                message: "Entry error"
            });
        }

        }
      );

    }
  );
});
// =======================
// PLAY FLOOR
// =======================
router.post("/play", (req, res) => {

  const db = req.app.get("db");

  const {
    gameId,
    box
  } = req.body;

  db.query(
    `
    SELECT *
    FROM risk_games
    WHERE id=?
    `,
    [gameId],
    (err, rows) => {

      if (!rows.length) {

        return res.json({
          success: false
        });

      }

      const game = rows[0];

      const nextFloor =
        game.current_floor + 1;

      const safeBox =
        Math.floor(
          Math.random() * 4
        ) + 1;

      const success =
        box === safeBox;

      if (!success) {

        db.query(
          `
          UPDATE risk_games
          SET status='lost'
          WHERE id=?
          `,
          [gameId]
        );

        return res.json({
          success: true,
          result: "lost",
          safeBox
        });

      }

      const reward =
        FLOOR_REWARDS[
          nextFloor - 1
        ];

      db.query(
        `
        UPDATE risk_games
        SET
        current_floor=?,
        reward=?
        WHERE id=?
        `,
        [
          nextFloor,
          reward,
          gameId
        ]
      );

      res.json({
        success: true,
        result: "safe",
        floor: nextFloor,
        reward
      });

    }
  );
});
// =======================
// CASHOUT
// =======================

router.post("/cashout", async (req, res) => {

  const db = req.app.get("db");
  const io = req.app.get("io");
  const { gameId } = req.body;

  db.query(
    `
    SELECT *
    FROM risk_games
    WHERE id=?
    `,
    [gameId],
   async (err, rows) => {

      if (!rows.length) {

        return res.json({
          success:false
        });

      }

      const game = rows[0];

      /*db.query(
        `
        UPDATE users
        SET coins=coins+?
        WHERE srno=?
        `,
        [
          game.reward,
          game.user_id
        ]
      );*/
  try {

  await rewardUser(
    db,
    io,
    game.user_id,
    game.reward,
    "RISK_GAME_WIN",
    gameId
  );

} catch (err) {

  console.log(err);

  return res.json({
    success: false,
    message: "Reward error"
  });
}

      db.query(
        `
        UPDATE risk_games
        SET status='cashed_out'
        WHERE id=?
        `,
        [gameId]
      );



      
      res.json({
        success:true,
        reward:
          game.reward
      });

    }
  );
});

export default router;