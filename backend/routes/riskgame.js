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

      const nextFloor =  game.current_floor + 1;
/*Floor 1	25%
Floor 2	25% × 25% = 6.25%
Floor 3	25%³ = 1.56%
Floor 4	25%⁴ = 0.39%
Floor 5	25%⁵ = 0.098%
Floor 6	0.024%
Floor 7	0.006%
Floor 8	0.0015%
Floor 9	0.00038%
Floor 10	0.000095%
*///only one safe box 
      //const safeBox = Math.floor(Math.random() * 4) + 1;
      //const success = box === safeBox;
/*Floor 1	75%
Floor 2	56.25%
Floor 3	42.19%
Floor 4	31.64%
Floor 5	23.73%
Floor 6	17.80%
Floor 7	13.35%
Floor 8	10.01%
Floor 9	7.51%
Floor 10	5.63%
*/// only one trap box
const safeBox = Math.floor(Math.random() * 4) + 1;
const trapBox = Math.floor(Math.random() * 4) + 1;
const success = Number(box) !== trapBox;
// Save move
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
    box,
    safeBox,
    success ? "safe" : "lost"
  ]
);
      if (!success) {

        db.query(
          `
          UPDATE risk_games
          SET status='lost'
          WHERE id=?
          `,
          [gameId]
        );
console.log({
  chosen: Number(box),
  trapBox,
  success: Number(box) !== trapBox
});
        return res.json({
          success: true,
          result: "lost",
          trapBox
        });

      }

      const reward =  FLOOR_REWARDS[
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