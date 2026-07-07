import express from "express";
import rewardUser from "../utils/rewardUser.js";
import { verifyToken } from "../middlewares/auth.js"; // your auth middleware

const router = express.Router();

router.post("/", verifyToken, (req, res) => {

    const db = req.app.get("db");
    const io = req.app.get("io");

    // User id from JWT
    const userId = req.user.srno;

    // 20 coins per ad
    const COINS = 20;

    // Optional: daily limit
    const sql = `
        SELECT COUNT(*) AS total
        FROM rewards_history
        WHERE user_id = ?
        AND reward_type = 'Reward Ads'
        AND DATE(created_at) = CURDATE()
    `;

    db.query(sql, [userId], (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        const todayCount = result[0].total;

        // Maximum 10 rewarded ads/day
        if (todayCount >= 10) {
            return res.json({
                success: false,
                message: "Daily reward limit reached."
            });
        }

        rewardUser(
            db,
            io,
            userId,
            COINS,
            "Reward Ads",
            "Google AdMob Reward"
        );

        res.json({
            success: true,
            coins: COINS,
            message: "20 coins added successfully."
        });

    });

});

export default router;