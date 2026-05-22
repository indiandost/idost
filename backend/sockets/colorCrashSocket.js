import { v4 as uuidv4 } from "uuid";
import db from "../db.js";

import rewardUser from "../utils/rewardUser.js";

const rooms = {};

const ENTRY_FEE = 10;

const creatingRooms = {};

const colorCrashSocket = (io) => {

  // ===================================
  // COIN UPDATE
  // ===================================
  const updateUserCoinsRealtime =
    async (userId) => {

      try {

        const [rows] =
          await db.promise().query(
            `
            SELECT coins
            FROM users
            WHERE srno=?
            `,
            [userId]
          );

        const coins =
          rows?.[0]?.coins || 0;

        io.to(
          `user-${userId}`
        ).emit(
          "coinUpdate",
          {
            coins,
          }
        );

        console.log(
          "🪙 Coin Updated:",
          userId,
          coins
        );

      } catch (err) {

        console.log(
          "❌ Coin Update Error:",
          err
        );
      }
    };


  // ===================================
  // SAVE REWARD HISTORY
  // ===================================
  const saveRewardHistory =
    async ({
      userId,
      type,
      coins,
      roomId,
      message,
      debit,
    }) => {

      try {

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
            type,
            roomId,
            coins,
            debit,
          ]
        );
         } catch (err) {

        console.log(
          "❌ SAVE HISTORY ERROR:",
          err
        );
      }
    };


  // ===================================
  // CONNECTION
  // ===================================
  io.on("connection", (socket) => {

    console.log(
      "🎮 Connected:",
      socket.id
    );
    // ===================================
    // USER ROOM
    // ===================================
    socket.on(
      "join_user_room",
      (userId) => {

        socket.join(
          `user-${userId}`
        );

        console.log(
          "👤 User Joined Room:",
          userId
        );
      }
    );


    // ===================================
    // CREATE ROOM
    // ===================================
    socket.on(
      "create_room",
      async (data) => {

        let hostUserId = null;

        try {

          hostUserId =
            data?.hostUserId;

          if (!hostUserId) {

            return socket.emit(
              "error_message",
              "Invalid user"
            );
          }

          // =========================
          // LOCK
          // =========================
          if (
            creatingRooms[
              hostUserId
            ]
          ) {

            return;
          }

          creatingRooms[
            hostUserId
          ] = true;

          console.log(
            "🎮 Create Room:",
            hostUserId
          );

          // =========================
          // CHECK USER
          // =========================
          const [users] =
            await db.promise().query(
              `
              SELECT
                srno,
                name
              FROM users
              WHERE srno=?
              `,
              [hostUserId]
            );

          if (!users.length) {

            delete creatingRooms[
              hostUserId
            ];

            return socket.emit(
              "error_message",
              "User not found"
            );
          }

          const user =
            users[0];

          // =========================
          // ACTIVE ROOM CHECK
          // =========================
          const [activeRoom] =
            await db.promise().query(
              `
              SELECT room_id
              FROM game_rooms
              WHERE host_user_id=?
              AND status != 'ended'
              LIMIT 1
              `,
              [hostUserId]
            );

          if (
            activeRoom.length > 0
          ) {

            delete creatingRooms[
              hostUserId
            ];

            return socket.emit(
              "error_message",
              "You already created a room"
            );
          }

          // =========================
          // CREATE ROOM ID
          // =========================
          const roomId =
            uuidv4()
              .replace(/-/g, "")
              .slice(0, 6);

          // =========================
          // MEMORY ROOM
          // =========================
          rooms[roomId] = {

            roomId,

            hostId:
              socket.id,

            hostUserId,

            players: [],

            viewers: [],

            currentColor:
              "gray",

            gameStarted:
              false,

            gameTime: 60,

            interval:
              null,
          };

          // =========================
          // SAVE ROOM
          // =========================
          await db.promise().query(
            `
            INSERT INTO game_rooms
            (
              room_id,
              host_user_id,
              status
            )
            VALUES (?, ?, ?)
            `,
            [
              roomId,
              hostUserId,
              "waiting",
            ]
          );

          // =========================
          // HOST PLAYER
          // =========================
          rooms[roomId]
            .players
            .push({

              socketId:
                socket.id,

              userId:
                String(
                  hostUserId
                ),

              name:
                user.name ||
                "Host",

              score: 0,
            });

          // =========================
          // SAVE HOST PLAYER
          // =========================
          await db.promise().query(
            `
            INSERT IGNORE INTO
            game_room_players
            (
              room_id,
              user_id
            )
            VALUES (?, ?)
            `,
            [
              roomId,
              hostUserId,
            ]
          );

          socket.join(roomId);

          console.log(
            "✅ Room Created:",
            roomId
          );

          socket.emit(
            "room_created",
            {
              success: true,
              roomId,
            }
          );

          io.to(roomId).emit(
            "room_update",
            rooms[roomId]
          );

          delete creatingRooms[
            hostUserId
          ];

        } catch (err) {

          console.log(
            "❌ CREATE ROOM ERROR:",
            err
          );

          if (hostUserId) {

            delete creatingRooms[
              hostUserId
            ];
          }

          socket.emit(
            "error_message",
            "Room create failed"
          );
        }
      }
    );


    // ===================================
    // JOIN ROOM
    // ===================================
   socket.on(
  "join_room",
  async (data) => {

    try {

      const {
        roomId,
        userId,
        name,
      } = data;

      let room =
        rooms[roomId];

      // =========================
      // LOAD ROOM
      // =========================
      if (!room) {

        const [roomRows] =
          await db.promise().query(
            `
            SELECT *
            FROM game_rooms
            WHERE room_id=?
            LIMIT 1
            `,
            [roomId]
          );

        if (!roomRows.length) {

          return socket.emit(
            "error_message",
            "Room not found"
          );
        }

        const dbRoom =
          roomRows[0];

        rooms[roomId] = {

          roomId,

          hostId: null,

          hostUserId:
            dbRoom.host_user_id,

          players: [],

          viewers: [],

          currentColor:
            "gray",

          gameStarted:
            dbRoom.status ===
            "running",

          gameTime: 60,

          interval:
            null,
        };

        room =
          rooms[roomId];
      }

      // =========================
      // USER EXISTS?
      // =========================
      const [users] =
        await db.promise().query(
          `
          SELECT
            srno,
            coins
          FROM users
          WHERE srno=?
          LIMIT 1
          `,
          [userId]
        );

      if (!users.length) {

        return socket.emit(
          "error_message",
          "User not found"
        );
      }

      const user =
        users[0];

      // =========================
      // ALREADY JOINED IN DB?
      // =========================
      const [existingPlayerRows] =
        await db.promise().query(
          `
          SELECT id
          FROM game_room_players
          WHERE room_id=?
          AND user_id=?
          LIMIT 1
          `,
          [
            roomId,
            userId,
          ]
        );

      const alreadyJoined =
        existingPlayerRows.length > 0;

      // =========================
      // NOT JOINED BEFORE
      // =========================
      if (!alreadyJoined) {

        // =========================
        // CHECK COINS
        // =========================
        const userCoins =
          Number(
            user.coins || 0
          );

        if (
          userCoins <
          ENTRY_FEE
        ) {

          return socket.emit(
            "error_message",
            `Need ${ENTRY_FEE} coins`
          );
        }

        // =========================
        // DEDUCT ENTRY FEE
        // =========================
        const [coinResult] =
          await db.promise().query(
            `
            UPDATE users
            SET coins = coins - ?
            WHERE srno=?
            AND coins >= ?
            `,
            [
              ENTRY_FEE,
              userId,
              ENTRY_FEE,
            ]
          );

        if (
          coinResult.affectedRows === 0
        ) {

          return socket.emit(
            "error_message",
            "Insufficient coins"
          );
        }

        // =========================
        // SAVE PLAYER
        // =========================
        await db.promise().query(
          `
          INSERT INTO
          game_room_players
          (
            room_id,
            user_id
          )
          VALUES (?, ?)
          `,
          [
            roomId,
            userId,
          ]
        );

        // =========================
        // SAVE HISTORY
        // =========================
        await saveRewardHistory({
          userId,
          type: "GAME_ENTRY",
          coins: ENTRY_FEE,
          roomId,
          message:
            "Game entry fee deducted",
          debit: "1",
        });

        // =========================
        // REALTIME COINS
        // =========================
        await updateUserCoinsRealtime(
          userId
        );
      }

      // =========================
      // MEMORY PLAYER
      // =========================
      const existingMemoryPlayer =
        room.players.find(
          (p) =>
            String(p.userId) ===
            String(userId)
        );

      // =========================
      // RECONNECT
      // =========================
      if (existingMemoryPlayer) {

        existingMemoryPlayer.socketId =
          socket.id;

      } else {

        room.players.push({

          socketId:
            socket.id,

          userId:
            String(userId),

          name:
            name || "Player",

          score: 0,
        });
      }

      // =========================
      // SOCKET JOIN
      // =========================
      socket.join(roomId);

      console.log(
        "✅ Joined Room:",
        roomId
      );

      io.to(roomId).emit(
        "room_update",
        room
      );

    } catch (err) {

      console.log(
        "❌ JOIN ROOM ERROR:",
        err
      );

      socket.emit(
        "error_message",
        "Join room failed"
      );
    }
  }
);


    // ===================================
    // START GAME
    // ===================================
    socket.on(
      "start_game",
      async ({ roomId }) => {

        try {

          const room =
            rooms[roomId];

          if (!room) {

            return socket.emit(
              "error_message",
              "Room not found"
            );
          }

          if (
            room.gameStarted
          ) {

            return;
          }

          room.gameStarted =
            true;

          room.gameTime =
            60;

          await db.promise().query(
            `
            UPDATE game_rooms
            SET status='running'
            WHERE room_id=?
            `,
            [roomId]
          );

          const colors = [
            "red",
            "green",
            "blue",
            "yellow",
          ];

          io.to(roomId).emit(
            "game_started"
          );
        if (room.interval) {
          clearInterval(room.interval);
        }
          room.interval =
            setInterval(
              async () => {

                try {

                  // =========================
                  // GAME END
                  // =========================
                  if (
                    room.gameTime <= 0
                  ) {

                    clearInterval(
                      room.interval
                    );

                    room.gameStarted =
                      false;

                    // =========================
                    // UNIQUE PLAYERS
                    // =========================
                    const uniquePlayers =
                      [
                        ...new Map(
                          room.players.map(
                            (p) => [
                              p.userId,
                              p,
                            ]
                          )
                        ).values(),
                      ];

                    // =========================
                    // LEADERBOARD
                    // =========================
                    const leaderboard =
                      [
                        ...uniquePlayers,
                      ].sort(
                        (a, b) =>
                          b.score -
                          a.score
                      );

                    const winner =
                      leaderboard?.[0];

                    // =========================
                    // POOL
                    // =========================
                    const totalPool =
                      uniquePlayers.length *
                      ENTRY_FEE;

                    const appCommission =
                      Math.floor(
                        totalPool * 0.2
                      );

                    const rewardCoins =
                      totalPool -
                      appCommission;

                    console.log(
                      "💰 Pool:",
                      totalPool
                    );

                    console.log(
                      "🏆 Reward:",
                      rewardCoins
                    );

                    // =========================
                    // WINNER REWARD
                    // =========================
                    if (winner) {

                      await rewardUser(
                        db,
                        io,
                        winner.userId,
                        rewardCoins,
                        "GAME_WIN",
                        roomId
                      );

                      await saveRewardHistory({
                        userId: winner.userId,
                        type: "GAME_WIN",
                        coins: rewardCoins,
                        roomId,
                        message:"Game winner reward",
                        debit: "0",
                      });

                      await updateUserCoinsRealtime(
                        winner.userId
                      );

                      await db.promise().query(
                        `
                        UPDATE
                        game_room_players
                        SET
                        score=?,
                        is_winner=1,
                        reward_coins=?
                        WHERE
                        room_id=?
                        AND user_id=?
                        `,
                        [
                          winner.score,
                          rewardCoins,
                          roomId,
                          winner.userId,
                        ]
                      );
                    }

                    // =========================
                    // SAVE SCORES
                    // =========================
                    for (
                      const p
                      of leaderboard
                    ) {

                      await db.promise().query(
                        `
                        UPDATE
                        game_room_players
                        SET score=?
                        WHERE
                        room_id=?
                        AND user_id=?
                        `,
                        [
                          p.score,
                          roomId,
                          p.userId,
                        ]
                      );
                    }

                    // =========================
                    // END ROOM
                    // =========================
                    await db.promise().query(
                      `
                      UPDATE game_rooms
                      SET status='ended'
                      WHERE room_id=?
                      `,
                      [roomId]
                    );

                    io.to(roomId).emit(
                      "game_ended",
                      {
                        winner,
                        leaderboard,
                        rewardCoins,
                      }
                    );

                    return;
                  }

                  // =========================
                  // TIMER
                  // =========================
                  room.gameTime--;

                  // =========================
                  // RANDOM COLOR
                  // =========================
                  const color =
                    colors[
                      Math.floor(
                        Math.random() *
                        colors.length
                      )
                    ];

                  room.currentColor =
                    color;

                  io.to(roomId).emit(
                    "new_color",
                    {
                      color,
                      gameTime:
                        room.gameTime,
                    }
                  );

                } catch (err) {

                  console.log(
                    "❌ GAME LOOP ERROR:",
                    err
                  );
                }

              },
              2000
            );

        } catch (err) {

          console.log(
            "❌ START GAME ERROR:",
            err
          );
        }
      }
    );


    // ===================================
    // TAP COLOR
    // ===================================
    socket.on(
      "tap_color",
      (data) => {

        try {

          const {
            roomId,
            userId,
            color,
          } = data;

          const room =
            rooms[roomId];

          if (!room) return;

          if (
            !room.gameStarted
          ) return;

          const player =
            room.players.find(
              (p) =>
                String(
                  p.userId
                ) ===
                String(userId)
            );

          if (!player) return;

          // =========================
          // SCORE
          // =========================
          if (
            color ===
            room.currentColor
          ) {

            player.score += 1;

          } else {

            player.score =
              Math.max(
                0,
                player.score - 1
              );
          }

          io.to(roomId).emit(
            "score_update",
            room.players
          );

        } catch (err) {

          console.log(
            "❌ TAP ERROR:",
            err
          );
        }
      }
    );


    // ===================================
    // CHAT
    // ===================================
    socket.on(
      "send_message",
      async (data) => {

        try {

          const {
            roomId,
            userId,
            name,
            message,
          } = data;

          const room =
            rooms[roomId];

          if (!room) return;

          const msg = {

            id:
              Date.now() +
              Math.random(),

            userId,

            name,

            message,

            createdAt:
              new Date(),
          };

          await db.promise().query(
            `
            INSERT INTO
            game_chat_logs
            (
              room_id,
              user_id,
              message
            )
            VALUES (?, ?, ?)
            `,
            [
              roomId,
              userId,
              message,
            ]
          );

          io.to(roomId).emit(
            "receive_message",
            msg
          );

        } catch (err) {

          console.log(
            "❌ CHAT ERROR:",
            err
          );
        }
      }
    );


    // ===================================
    // DISCONNECT
    // ===================================
    socket.on(
      "disconnect",
      () => {

        console.log(
          "❌ Disconnect:",
          socket.id
        );

        for (
          const roomId
          in rooms
        ) {

          const room =
            rooms[roomId];

          room.players =
            room.players.filter(
              (p) =>
                p.socketId !==
                socket.id
            );

          room.viewers =
            room.viewers.filter(
              (v) =>
                v.socketId !==
                socket.id
            );

          io.to(roomId).emit(
            "room_update",
            room
          );

          // =========================
          // DELETE ROOM
          // =========================
          if (
            room.players.length ===
              0 &&
            room.viewers.length ===
              0
          ) {

            if (
              room.interval
            ) {

              clearInterval(
                room.interval
              );
            }

            delete rooms[roomId];

            console.log(
              "🗑 Room Deleted:",
              roomId
            );
          }
        }
      }
    );

//LEAVE ROOM ...
socket.on("leave_room", ({ roomId, userId }) => {

  socket.leave(roomId);

  if (!gameRooms[roomId]) return;

  gameRooms[roomId].players =
    gameRooms[roomId].players.filter(
      (p) => p.userId != userId
    );

  io.to(roomId).emit(
    "room_update",
    gameRooms[roomId]
  );

});


  });
};


export default colorCrashSocket;