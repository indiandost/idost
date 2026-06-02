import express from "express";
import rewardUser from "../utils/rewardUser.js";
const router = express.Router();

// Risk Tower rewards
const FLOOR_REWARDS = [
  15,
  25,
  45,
  50,
  100,
  200,
  350,
  500,
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
        const gameId = result.insertId;
        const debit=1; const entryfee = 10;
          const io = req.app.get("io");
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
  const { gameId, box } = req.body;

  db.query(
    `
    SELECT *
    FROM risk_games
    WHERE id=? AND status='playing'
    `,
    [gameId],
    (err, rows) => {

      if (err) {
        console.log(err);
        return res.json({ success: false });
      }

      if (!rows.length) {
        return res.json({
          success: false,
          message: "Game not found"
        });
      }

      const game = rows[0];

      const nextFloor = Number(game.current_floor || 0) + 1;

      // Max floor check
      if (nextFloor > FLOOR_REWARDS.length) {
        return res.json({
          success: false,
          message: "Game completed"
        });
      }

      // 1 trap box out of 4
      //const trapBox = Math.floor(Math.random() * 4) + 1; //win chance 75%
      //const chosenBox = Number(box);
      //const success = chosenBox !== trapBox;

      const trapBoxes = [1, 2, 3, 4].sort(() => Math.random() - 0.5) .slice(0, 2); //win chance 50%
      const chosenBox = Number(box);
      const success = !trapBoxes.includes(Number(box));

      console.log({
        gameId,
        floor: nextFloor,
        chosenBox,
        trapBoxes,
        success
      });

      // Save move history
      db.query(
        `
        INSERT INTO risk_moves
        (
          game_id,
          floor_no,
          chosen_box,
          safe_box,
          result
        )
        VALUES (?,?,?,?,?)
        `,
        [
          gameId,
          nextFloor,
          chosenBox,
          trapBoxes,
          success ? "safe" : "lost"
        ]
      );

      // LOST
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
          trapBoxes
        });
      }

      // SAFE
      const reward = FLOOR_REWARDS[nextFloor - 1];

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
        ],
        (err2) => {

          if (err2) {
            console.log(err2);

            return res.json({
              success: false,
              message: "Update failed"
            });
          }

          return res.json({
            success: true,
            result: "safe",
            floor: nextFloor,
            reward
          });
        }
      );
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
    
    ` SELECT * FROM risk_games WHERE id=? AND status='playing'`,
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