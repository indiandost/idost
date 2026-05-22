import db from "../db.js";


// ===================================
// GET ROOMS
// ===================================
export const getRooms = async (req, res) => {

  try {

    const [rows] =  await db.promise().query(`
      SELECT *
      FROM game_rooms
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      rooms: rows,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
};


// ===================================
// ROOM DETAILS
// ===================================
export const getRoomDetails = async (
  req,
  res
) => {

  try {

    const { roomId } = req.params;

    const [room] =  await db.promise().query(
      `
      SELECT *
      FROM game_rooms
      WHERE room_id=?
      `,
      [roomId]
    );

    const [players] =  await db.promise().query(
      `
      SELECT *
      FROM game_room_players
      WHERE room_id=?
      `,
      [roomId]
    );

    res.json({
      success: true,
      room: room[0],
      players,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
};


// ===================================
// LEADERBOARD
// ===================================
export const getLeaderboard = async (
  req,
  res
) => {

  try {

    const [rows] =  await db.promise().query(`
      SELECT *
      FROM game_room_players
      ORDER BY reward_coins DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      leaderboard: rows,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
};


// ===================================
// USER HISTORY
// ===================================
export const getUserGameHistory =
async (req, res) => {

  try {

    const { userId } = req.params;

    const [rows] = await db.promise().query(
      `
      SELECT *
      FROM game_room_players
      WHERE user_id=?
      ORDER BY id DESC
      `,
      [userId]
    );

    res.json({
      success: true,
      history: rows,
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
    });
  }
};
