import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import rewardJamWinner from "../utils/rewardJamWinner.js";

// =======================================
// CREATE ROOM
// =======================================
export const createJamRoom = async (req, res) => {
    try {
      console.log('creating room......');
        const {
            hostId,
            title,
            description,
            roomType,
        } = req.body;

        if (!hostId || !title) {
            return res.status(400).json({
                success: false,
                message: "Missing fields",
            });
        }
// =========================
// MAX 2 LIVE ROOMS CHECK
// =========================

const [liveRooms] = await db.promise().query(
  `
  SELECT COUNT(*) total
  FROM jam_rooms
  WHERE is_live = 1
  `
);

if (Number(liveRooms[0].total) >= 3) {
  return res.status(400).json({
    success: false,
    message:
      "Maximum 3 live rooms are already running"
  });
}

// =========================
// HOST ALREADY HAS ROOM?
// =========================

const [hostRooms] = await db.promise().query(
  `
  SELECT room_id
  FROM jam_rooms
  WHERE host_id = ?
  AND is_live = 1
  LIMIT 1
  `,
  [hostId]
);

if (hostRooms.length) {
  return res.status(400).json({
    success: false,
    message:
      "You already have an active room"
  });
}

        // =========================
        // ROOM ID
        // =========================

        const roomId = uuidv4()
            .replace(/-/g, "")
            .slice(0, 8);

        // =========================
        // AGORA CHANNEL
        // =========================

        const agoraChannel = `jam_${roomId}`;

        // =========================
        // INSERT ROOM
        // =========================

        await db.promise().query(

            `
            INSERT INTO jam_rooms
            (
                room_id,
                host_id,
                title,
                description,
                room_type,
                agora_channel,
                is_live
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,

            [
                roomId,
                hostId,
                title,
                description || "",
                roomType || "jam",
                agoraChannel,
                1,
            ]

        );

        // =========================
        // HOST ENTRY
        // =========================

        await db.promise().query(

            `
            INSERT INTO jam_room_users
            (
                room_id,
                user_id,
                role
            )
            VALUES (?, ?, ?)
            `,

            [
                roomId,
                hostId,
                "host",
            ]

        );

        return res.json({
            success: true,
            roomId,
            agoraChannel,
            message: "Jam room created",
        });

    }

    catch (err) {

        console.log("❌ CREATE ROOM ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =======================================

// GET LIVE ROOMS

// =======================================

export const getLiveJamRooms =

  async (req, res) => {



    try {



      const [rooms] =

        await db.promise().query(

          `

          SELECT
            jr.*,
            u.name AS host_name,
           (
  SELECT COUNT(DISTINCT jru.user_id)
  FROM jam_room_users jru
  WHERE jru.room_id = jr.room_id
) AS total_users 
          FROM jam_rooms jr
          LEFT JOIN users u
          ON u.srno =
          jr.host_id
          WHERE jr.is_live=1
          ORDER BY jr.id DESC

          `

        );



      return res.json({



        success: true,



        rooms,

      });



    } catch (err) {



      console.log(

        "❌ LIVE ROOM ERROR:",

        err

      );



      return res.status(500)

        .json({

          success: false,

          message:

            "Server error",

        });

    }

  };





// =======================================

// ROOM DETAILS

// =======================================

export const getJamRoomDetails = async (req, res) => {

  try {

    // =========================
    // PARAMS
    // =========================

    const { roomId } = req.params;

    console.log("ROOM ID:", roomId);

    // =========================
    // VALIDATION
    // =========================

    if (!roomId) {

      return res.status(400).json({
        success: false,
        message: "Room ID missing",
      });

    }

    // =========================
    // GET ROOM
    // =========================

    const [rooms] = await db.promise().query(
      `
      SELECT *
      FROM jam_rooms
      WHERE room_id = ?
      LIMIT 1
      `,
      [roomId]
    );

    console.log("ROOM RESULT:", rooms);

    // =========================
    // ROOM NOT FOUND
    // =========================

    if (!rooms.length) {

      return res.status(404).json({
        success: false,
        message: "Room not found",
      });

    }

    // =========================
    // GET PARTICIPANTS
    // =========================

    let participants = [];

    try {

      const [participantRows] =
        await db.promise().query(
          `
          SELECT

            jru.*,
            u.name,
            u.pic

          FROM jam_room_users jru

          LEFT JOIN users u
          ON u.srno = jru.user_id

          WHERE jru.room_id = ?
          `,
          [roomId]
        );

      participants = participantRows;

    }

    catch (participantError) {

      console.log(
        "PARTICIPANTS QUERY ERROR:",
        participantError
      );

    }

    // =========================
    // GET GIFTS
    // =========================

    let totalGifts = 0;

    try {

      const [giftRows] =
        await db.promise().query(
          `
          SELECT
            COALESCE(SUM(coins), 0)
            AS total_gifts
          FROM gifts_live
          WHERE room_id = ?
          `,
          [roomId]
        );

      totalGifts =
        giftRows?.[0]?.total_gifts || 0;

    }

    catch (giftError) {

      console.log(
        "GIFTS QUERY ERROR:",
        giftError
      );

    }

    // =========================
    // SUCCESS RESPONSE
    // =========================

    return res.status(200).json({

      success: true,

      room: rooms[0],

      participants,

      totalGifts,

    });

  }

  catch (err) {

    console.log(
      "❌ ROOM DETAILS ERROR:",
      err
    );

    return res.status(500).json({

      success: false,

      message: "Server error",

      error: err.message,

    });

  }

};



// =======================================

// END ROOM

// =======================================

export const endJamRoom =

  async (req, res) => {



    try {



      const {

        roomId,

      } = req.params;



      const [roomRows] =

        await db.promise().query(

          `

          SELECT *

          FROM jam_rooms

          WHERE room_id=?

          LIMIT 1

          `,

          [roomId]

        );



      if (

        !roomRows.length

      ) {



        return res.status(404)

          .json({

            success: false,

            message:

              "Room not found",

          });

      }



      // ==========================

      // TOP USER

      // ==========================

      const [topUsers] =

        await db.promise().query(

          `

          SELECT *

          FROM jam_room_users

          WHERE room_id=?

          ORDER BY total_votes DESC

          LIMIT 1

          `,

          [roomId]

        );



      const winner =

        topUsers?.[0];



      let rewardCoins = 0;



      if (winner) {



        rewardCoins =

          await rewardJamWinner({

            userId:

              winner.user_id,



            roomId,



            votes:

              winner.total_votes,

          });

      }



      // ==========================

      // END ROOM

      // ==========================

      await db.promise().query(

        `

        UPDATE jam_rooms

        SET

        is_live=0,

        ended_at=NOW()

        WHERE room_id=?

        `,

        [roomId]

      );



      return res.json({



        success: true,



        winner,



        rewardCoins,



        message:

          "Room ended successfully",

      });



    } catch (err) {



      console.log(

        "❌ END ROOM ERROR:",

        err

      );



      return res.status(500)

        .json({

          success: false,

          message:

            "Server error",

        });

    }

  };





// =======================================

// TOP PERFORMERS

// =======================================

export const getTopPerformers =

  async (req, res) => {



    try {



      const {

        roomId,

      } = req.params;



      const [users] =

        await db.promise().query(

          `

          SELECT

            jru.user_id,

            jru.total_votes,

            jru.reward_coins,



            u.name,

            u.pic



          FROM jam_room_users jru



          LEFT JOIN users u

          ON u.srno =

          jru.user_id



          WHERE jru.room_id=?



          ORDER BY

          jru.total_votes DESC



          LIMIT 10

          `,

          [roomId]

        );



      return res.json({



        success: true,



        users,

      });



    } catch (err) {



      console.log(

        "❌ TOP USERS ERROR:",

        err

      );



      return res.status(500)

        .json({

          success: false,

          message:

            "Server error",

        });

    }

  };