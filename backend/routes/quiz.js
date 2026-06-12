import express from "express";
import db from "../db.js";
import { verifyToken } from "../middlewares/auth.js";
import rewardUser from "../utils/rewardUser.js";

const router = express.Router();


// ===========================
// CREATE BATTLE
// ===========================
router.post("/create-battle", verifyToken, (req, res) => {
  const challengerId = req.user.id;
  const { opponentId } = req.body;
if (Number(challengerId) === Number(opponentId)) {
  return res.status(400).json({
    success: false,
    message: "You cannot challenge yourself"
  });
}
  if (!opponentId) {
    return res.status(400).json({
      success: false,
      message: "Opponent required"
    });
  }
db.query(
  "SELECT coins FROM users WHERE srno=?",
  [challengerId],
  (err, rows) => {

    if (!rows.length) {
      return res.status(404).json({
        success:false,
        message:"User not found"
      });
    }

    if (Number(rows[0].coins) < 20) {
      return res.json({
        success:false,
        message:"Minimum 20 coins required"
      });
    }

db.query(
  `
SELECT id
FROM quiz_battles
WHERE (
      (challenger_id=? AND opponent_id=?)
      OR
      (challenger_id=? AND opponent_id=?)
)
AND status IN ('pending','accepted')
  `,
  [
    challengerId,
    opponentId,
    opponentId,
    challengerId
  ],
  (err, rows) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (rows.length) {
      return res.json({
        success: false,
        message: "Battle already exists"
      });
    }

  const battleSql = `
    INSERT INTO quiz_battles
    (challenger_id, opponent_id)
    VALUES (?, ?)
  `;

  db.query(
    battleSql,
    [challengerId, opponentId],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      const battleId = result.insertId;

      db.query(
        `
        SELECT id
        FROM quiz_questions
        ORDER BY RAND()
        LIMIT 5
        `,
        (err2, questions) => {
          if (err2) {
            return res.status(500).json(err2);
          }

          const values = questions.map((q) => [
            battleId,
            q.id
          ]);

          db.query(
            `
            INSERT INTO quiz_battle_questions
            (battle_id, question_id)
            VALUES ?
            `,
            [values],
            (err3) => {
              if (err3) {
                return res.status(500).json(err3);
              }
                    const io = req.app.get("io");

                    io.to(`user-${opponentId}`).emit(
                    "battleInvite",
                    {
                        battleId,
                        challengerId
                    }
                    );
              res.json({
                success: true,
                battleId
              });
            }
          );
        }
      );
    }
  );
});
  });
 }
);


// ===========================
// ACCEPT BATTLE
// ===========================
router.post("/accept/:battleId", verifyToken, (req, res) => {

  const userId = req.user.id;
  const battleId = req.params.battleId;
  const io = req.app.get("io");

  db.query(
    `
    SELECT challenger_id
    FROM quiz_battles
    WHERE id=?
    `,
    [battleId],
    (err, battleRows) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (!battleRows.length) {
        return res.status(404).json({
          success:false,
          message:"Battle not found"
        });
      }

      const challengerId = battleRows[0].challenger_id;

      db.query(
        `
        UPDATE quiz_battles
        SET status='accepted'
        WHERE id=?
        AND opponent_id=?
        AND status='pending'
        `,
        [battleId, userId],
        (err2, result) => {

          if (err2) {
            return res.status(500).json(err2);
          }

          if (!result.affectedRows) {
            return res.status(400).json({
              success:false,
              message:"Invalid battle"
            });
          }

          io.to(`user-${challengerId}`).emit(
            "battleAccepted",
            {
              battleId
            }
          );

          res.json({
            success:true
          });
        }
      );
    }
  );
});

// ===========================
// MY CHALLENGES
// ===========================
router.get("/my-battles", verifyToken, (req, res) => {

  const userId = req.user.id;

  const sql = `
SELECT
    qb.*,
    u1.name AS challenger_name,
    u2.name AS opponent_name
FROM quiz_battles qb
LEFT JOIN users u1
ON qb.challenger_id=u1.srno
LEFT JOIN users u2
ON qb.opponent_id=u2.srno
WHERE qb.challenger_id=?
   OR qb.opponent_id=?
ORDER BY qb.id DESC
`;

  db.query(
    sql,
    [userId, userId],
    (err, rows) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        battles: rows
      });
    }
  );
});


// ===========================
// GET QUESTIONS
// ===========================
router.get("/questions/:battleId", verifyToken, (req, res) => {

  const userId = req.user.id;
  const battleId = req.params.battleId;

  db.query(
    `
    SELECT id
    FROM quiz_battles
    WHERE id=?
    AND (
      challenger_id=?
      OR opponent_id=?
    )
    `,
    [battleId, userId, userId],
    (err, battleRows) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (!battleRows.length) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      db.query(
        `
        SELECT
          q.id,
          q.question,
          q.option1,
          q.option2,
          q.option3,
          q.option4
        FROM quiz_battle_questions bq
        JOIN quiz_questions q
          ON q.id=bq.question_id
        WHERE bq.battle_id=?
        `,
        [battleId],
        (err2, rows) => {

          if (err2) {
            return res.status(500).json(err2);
          }

          res.json({
            success: true,
            questions: rows
          });
        }
      );
    }
  );
});

// ===========================
// SUBMIT ANSWER
// ===========================
router.post("/answer", verifyToken, (req, res) => {

  const userId = req.user.id;

  const {
    battleId,
    questionId,
    answer
  } = req.body;
console.log({
  battleId,
  userId,
  questionId,
  answer});
  db.query(
    `
    SELECT correct_answer
    FROM quiz_questions
    WHERE id=?
    `,
    [questionId],
    (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Question not found"
        });
      }

      const isCorrect =
        Number(result[0].correct_answer) === Number(answer)
          ? 1
          : 0;

     db.query(
          `
          INSERT INTO quiz_answers
          (
            battle_id,
            user_id,
            question_id,
            selected_answer,
            is_correct
          )
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            battleId,
            userId,
            questionId,
            answer,
            isCorrect
          ],
          (err2) => {

            if (err2) {

              if (err2.code === "ER_DUP_ENTRY") {
                return res.json({
                  success: true,
                  duplicate: true
                });
              }

              return res.status(500).json(err2);
            }

           // Check if battle completed
db.query(
  `
  SELECT
    user_id,
    COUNT(*) total_answers
  FROM quiz_answers
  WHERE battle_id=?
  GROUP BY user_id
  `,
  [battleId],
  (countErr, countRows) => {

    if (countErr) {
      return res.status(500).json(countErr);
    }

    // Dono players ne 5-5 answers nahi diye
    if (
      countRows.length < 2 ||
      !countRows.every(r => Number(r.total_answers) >= 5)
    ) {
      return res.json({
        success: true,
        correct: !!isCorrect
      });
    }

    // Battle info
    db.query(
      `
      SELECT
        challenger_id,
        opponent_id,
        rewards_distributed
      FROM quiz_battles
      WHERE id=?
      `,
      [battleId],
      (battleErr, battleRows) => {

        if (battleErr) {
          return res.status(500).json(battleErr);
        }

        if (!battleRows.length) {
          return res.json({
            success: true,
            correct: !!isCorrect
          });
        }

        const battle = battleRows[0];

        // Already rewarded
        if (Number(battle.rewards_distributed) === 1) {
          return res.json({
            success: true,
            correct: !!isCorrect
          });
        }

        const challengerId = battle.challenger_id;
        const opponentId = battle.opponent_id;

        // Calculate scores
        db.query(
          `
          SELECT
            user_id,
            SUM(is_correct) score
          FROM quiz_answers
          WHERE battle_id=?
          GROUP BY user_id
          `,
          [battleId],
          (scoreErr, scores) => {

            if (scoreErr) {
              return res.status(500).json(scoreErr);
            }

            let challengerScore = 0;
            let opponentScore = 0;

            scores.forEach((row) => {

              if (
                Number(row.user_id) ===
                Number(challengerId)
              ) {
                challengerScore =
                  Number(row.score || 0);
              }

              if (
                Number(row.user_id) ===
                Number(opponentId)
              ) {
                opponentScore =
                  Number(row.score || 0);
              }

            });

            let winnerId = null;

            if (challengerScore > opponentScore) {
              winnerId = challengerId;
            } else if (opponentScore > challengerScore) {
              winnerId = opponentId;
            }

            const io = req.app.get("io");

            // Rewards
            if (winnerId) {

              const loserId =
                Number(winnerId) === Number(challengerId)
                  ? opponentId
                  : challengerId;

              rewardUser(
                db,
                io,
                winnerId,
                50,
                "Win_Battle",
                "Quiz winner"
              );

              rewardUser(
                db,
                io,
                loserId,
                30,
                "Loss_Battle",
                "Quiz Loss",
                1
              );

            } else {

              rewardUser(
                db,
                io,
                challengerId,
                25,
                "Quiz_Draw",
                "Quiz Draw"
              );

              rewardUser(
                db,
                io,
                opponentId,
                25,
                "Quiz_Draw",
                "Quiz Draw"
              );

            }

            // Mark completed + rewarded
            db.query(
              `
              UPDATE quiz_battles
              SET
                challenger_score=?,
                opponent_score=?,
                winner_id=?,
                status='completed',
                rewards_distributed=1
              WHERE id=?
              `,
              [
                challengerScore,
                opponentScore,
                winnerId,
                battleId
              ],
              (updateErr) => {

                if (updateErr) {
                  return res.status(500).json(updateErr);
                }

                return res.json({
                  success: true,
                  correct: !!isCorrect
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

// ===========================
// RESULT
// ===========================
router.get("/result/:battleId", verifyToken, (req, res) => {
  const battleId = req.params.battleId;

  db.query(
    `
    SELECT
      qb.challenger_id,
      qb.opponent_id,
      qb.challenger_score,
      qb.opponent_score,
      qb.winner_id,
      qb.status,
      u1.name AS challenger_name,
      u2.name AS opponent_name,
      uw.name AS winner_name
    FROM quiz_battles qb
    LEFT JOIN users u1
      ON qb.challenger_id = u1.srno
    LEFT JOIN users u2
      ON qb.opponent_id = u2.srno
    LEFT JOIN users uw
      ON qb.winner_id = uw.srno
    WHERE qb.id=?
    `,
    [battleId],
    (err, rows) => {
      if (err) {
        return res.status(500).json(err);
      }

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "Battle not found"
        });
      }

      const battle = rows[0];

      if (battle.status !== "completed") {
        return res.json({
          success: true,
          waiting: true,
          message: "Waiting for opponent"
        });
      }

      const userId = req.user.id; // verify this
        db.query(
          `
          SELECT
            q.id,
            q.question,
            q.correct_answer,
            a.selected_answer,
            a.is_correct
          FROM quiz_answers a
          JOIN quiz_questions q
            ON q.id = a.question_id
          WHERE a.battle_id = ?
            AND a.user_id = ?
          `,
          [battleId, userId],
          (err, answerRows) => {

            if (err) {
              console.error(err);
              return res.status(500).json(err);
            }
          return res.json({
            success: true,
            battleId,
            challengerId: battle.challenger_id,
            opponentId: battle.opponent_id,
            challengerName: battle.challenger_name,
            opponentName: battle.opponent_name,
            challengerScore: Number(battle.challenger_score || 0),
            opponentScore: Number(battle.opponent_score || 0),
            winnerId: battle.winner_id,
            winnerName: battle.winner_name,
            draw: Number(battle.challenger_score || 0) ===  Number(battle.opponent_score || 0),
            review: answerRows
          });
        }
      );
    }
  );
});

// ===========================
// ADD QUESTION (ADMIN)
// ===========================
router.post("/add-question", verifyToken, (req, res) => {

  const {
    question,
    option1,
    option2,
    option3,
    option4,
    correct_answer,
    category
  } = req.body;

  const sql = `
    INSERT INTO quiz_questions
    (
      question,
      option1,
      option2,
      option3,
      option4,
      correct_answer,
      category
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      question,
      option1,
      option2,
      option3,
      option4,
      correct_answer,
      category || "General"
    ],
    (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        questionId: result.insertId
      });
    }
  );
});

router.post("/reject/:battleId", verifyToken, (req, res) => {

  const userId = req.user.id;
  const battleId = req.params.battleId;
  console.log(userId +'---'+ battleId);
  

  db.query(
    `
    SELECT challenger_id
    FROM quiz_battles
    WHERE id=?
    `,
    [battleId],
    (err, rows) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (!rows.length) {
        return res.status(404).json({
          success:false,
          message:"Battle not found"
        });
      }

      const challengerId = rows[0].challenger_id;

      db.query(
        `
        UPDATE quiz_battles
        SET status='rejected'
        WHERE id=?
        AND opponent_id=?
        AND status='pending'
        `,
        [battleId, userId],
        (err2, result) => {

          if (err2) {
            return res.status(500).json(err2);
          }

          if (!result.affectedRows) {
            return res.status(400).json({
              success:false,
              message:"Invalid battle"
            });
          }

          const io = req.app.get("io");

          io.to(`user-${challengerId}`).emit(
            "battleRejected",
            {
              battleId
            }
          );

          res.json({
            success:true,
            message:"Battle rejected"
          });
        }
      );
    }
  );
});

router.get("/pending", verifyToken, (req, res) => {

  db.query(
    `
    SELECT
      qb.*,
      u.name challenger_name
    FROM quiz_battles qb
    JOIN users u
      ON qb.challenger_id=u.srno
    WHERE qb.opponent_id=?
    AND qb.status='pending'
    ORDER BY qb.id DESC
    `,
    [req.user.id],
    (err, rows) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        battles: rows
      });
    }
  );
});
export default router;