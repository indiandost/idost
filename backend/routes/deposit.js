import express from "express";

const router = express.Router();

// =====================
// CREATE DEPOSIT REQUEST
// =====================
router.post("/request", (req, res) => {

  const db = req.app.get("db");

  const {
    user_id,
    amount,
    upi_ref,
    screenshot
  } = req.body;

  const coins = Number(amount) * 100;

  db.query(
    `
    INSERT INTO deposit_requests
    (
      user_id,
      amount,
      coins,
      upi_ref,
      screenshot
    )
    VALUES (?,?,?,?,?)
    `,
    [
      user_id,
      amount,
      coins,
      upi_ref,
      screenshot
    ],
    (err) => {

      if (err) {
        console.log(err);

        return res.json({
          success:false
        });
      }

      res.json({
        success:true,
        message:"Deposit request submitted"
      });

    }
  );
});

router.post("/approve/:id", (req,res)=>{

  const db = req.app.get("db");
  const io = req.app.get("io");

  db.query(
    "SELECT * FROM deposit_requests WHERE id=?",
    [req.params.id],
    async (err,rows)=>{

      if(!rows.length){
        return res.json({
          success:false
        });
      }

      const dep = rows[0];

      if(dep.status !== "pending"){
        return res.json({
          success:false,
          message:"Already processed"
        });
      }

      await rewardUser(
        db,
        io,
        dep.user_id,
        dep.coins,
        "DEPOSIT",
        dep.id
      );

      db.query(
        `
        UPDATE deposit_requests
        SET status='approved'
        WHERE id=?
        `,
        [dep.id]
      );

      res.json({
        success:true
      });

    }
  );

});

export default router;