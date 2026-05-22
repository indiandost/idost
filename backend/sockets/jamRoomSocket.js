import { v4 as uuidv4 } from "uuid";
import db from "../db.js";

const jamRooms = {};

// =========================================
// AUTO DELETE ROOM TIMER
// =========================================

const roomDeleteTimers = {};

const jamRoomSocket = (io) => {

  io.on("connection", (socket) => {

    console.log(
      "🎤 Jam Connected:",
      socket.id
    );

    // =========================================
    // CREATE ROOM
    // =========================================

    socket.on(
      "create_jam_room",
      async (data) => {

        try {

          const {
            userId,
            title,
            roomType,
          } = data;

          if (
            !userId ||
            !title
          ) {

            socket.emit(
              "error_message",
              "Invalid room data"
            );

            return;

          }

          const roomId =
            uuidv4()
              .replace(/-/g, "")
              .slice(0, 8);

          jamRooms[roomId] = {

            roomId,

            hostId:
              Number(userId),

            hostSocketId:
              socket.id,

            title,

            roomType,

            speakers: [],

            viewers: [],

            reactions: [],

            votes: {},

            micRequests: [],

            isLive: true,

            hostLeft: false,

          };

          // =====================
          // SAVE ROOM DB
          // =====================

          await db.promise().query(
            `
            INSERT INTO jam_rooms
            (
              room_id,
              host_id,
              title,
              room_type,
              is_live
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
              roomId,
              userId,
              title,
              roomType || "jam",
              1,
            ]
          );

          socket.join(roomId);

          socket.roomId =
            roomId;

          socket.userId =
            Number(userId);

          jamRooms[
            roomId
          ].viewers.push({

            userId:
              Number(userId),

            name: "Host",

            socketId:
              socket.id,

          });

          await db.promise().query(
            `
            INSERT IGNORE INTO
            jam_room_users
            (
              room_id,
              user_id,
              role
            )
            VALUES (?, ?, ?)
            `,
            [
              roomId,
              userId,
              "host",
            ]
          );

          socket.emit(
            "jam_room_created",
            {
              success: true,
              roomId,
            }
          );

          console.log(
            "✅ ROOM CREATED:",
            roomId
          );

        }

        catch (err) {

          console.log(
            "❌ CREATE JAM ERROR:",
            err
          );

        }

      }
    );

    // =========================================
    // JOIN ROOM
    // =========================================

    socket.on(
      "join_jam_room",
      async (data) => {

        try {

          const {
            roomId,
            userId,
            name,
          } = data;

          if (
            !roomId ||
            !userId
          ) {

            console.log(
              "❌ INVALID JOIN DATA"
            );

            return;

          }

          console.log(
            "👤 JOIN ROOM:",
            roomId,
            name
          );

          // =====================
          // ROOM LOAD
          // =====================

          if (
            !jamRooms[roomId]
          ) {

            const [rows] =
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
              !rows.length
            ) {

              socket.emit(
                "room_not_found"
              );

              return;

            }

            jamRooms[
              roomId
            ] = {

              roomId,

              hostId:
                Number(
                  rows[0]
                    .host_id
                ),

              hostSocketId:
                null,

              title:
                rows[0]
                  .title,

              roomType:
                rows[0]
                  .room_type,

              speakers: [],

              viewers: [],

              reactions: [],

              votes: {},

              micRequests: [],

              isLive: true,

              hostLeft: false,

            };

          }

          const room =
            jamRooms[
              roomId
            ];

          // =====================
          // CANCEL DELETE TIMER
          // =====================

          if (
            roomDeleteTimers[
              roomId
            ]
          ) {

            clearTimeout(
              roomDeleteTimers[
                roomId
              ]
            );

            delete roomDeleteTimers[
              roomId
            ];

            room.hostLeft =
              false;

            console.log(
              "⏹ ROOM DELETE TIMER CANCELLED"
            );

          }

          socket.join(roomId);

          socket.roomId =
            roomId;

          socket.userId =
            Number(userId);

          socket.userName =
            name;

          if (
            Number(userId) ===
            Number(room.hostId)
          ) {

            room.hostSocketId =
              socket.id;

          }

          // REMOVE DUPLICATE

          room.viewers =
            room.viewers.filter(
              (v) =>
                !(
                  Number(
                    v.userId
                  ) ===
                  Number(userId)
                )
            );

          // ADD VIEWER

          room.viewers.push({

            userId:
              Number(userId),

            name:
              name || "User",

            socketId:
              socket.id,

          });

          // SAVE USER DB

          await db.promise().query(
            `
            INSERT IGNORE INTO
            jam_room_users
            (
              room_id,
              user_id,
              role
            )
            VALUES (?, ?, ?)
            `,
            [
              roomId,
              userId,

              Number(userId) ===
              Number(room.hostId)
                ? "host"
                : "viewer",
            ]
          );

          io.to(roomId).emit(
            "viewer_joined",
            {

              viewers:
                room.viewers,

              totalViewers:
                room.viewers
                  .length,

            }
          );

          socket.emit(
            "room_joined",
            {

              success: true,

              roomId,

              hostId:
                room.hostId,

              totalViewers:
                room.viewers
                  .length,

            }
          );

        }

        catch (err) {

          console.log(
            "❌ JOIN JAM ERROR:",
            err
          );

        }

      }
    );

    // =========================================
    // CHAT
    // =========================================

    socket.on(
      "send_message",
      (data) => {

        try {

          const {
            roomId,
            userId,
            name,
            message,
          } = data;

          if (
            !roomId ||
            !message
          ) {

            return;

          }

          const payload = {

            roomId,

            userId,

            name,

            message,

            createdAt:
              new Date(),

          };

          io.in(roomId).emit(
            "receive_message",
            payload
          );

        }

        catch (err) {

          console.log(
            "❌ MESSAGE ERROR:",
            err
          );

        }

      }
    );

    // =========================================
    // REACTION
    // =========================================

    socket.on(
      "send_reaction",
      ({ roomId, emoji }) => {

        io.to(roomId).emit(
          "receive_reaction",
          {

            emoji,

            id:
              Date.now() +
              Math.random(),

          }
        );

      }
    );

    // =========================================
    // REQUEST MIC
    // =========================================

    socket.on(
      "request_mic",
      ({ roomId, userId, name }) => {

        const room =
          jamRooms[roomId];

        if (!room) return;

        const exists =
          room.micRequests.find(
            r =>
              Number(r.userId) ===
              Number(userId)
          );

        if (exists) return;

        room.micRequests.push({
          userId: Number(userId),
          name,
        });

        if (room.hostSocketId) {

          io.to(
            room.hostSocketId
          ).emit(
            "new_mic_request",
            {
              userId,
              name,
              roomId,
            }
          );

        }

        io.to(roomId).emit(
          "mic_request_list",
          room.micRequests
        );

      }
    );

    // =========================================
    // ACCEPT MIC
    // =========================================

    socket.on(
      "accept_mic",
      ({ roomId, userId }) => {

        const room =
          jamRooms[roomId];

        if (!room) return;

        room.micRequests =
          room.micRequests.filter(
            r =>
              Number(r.userId) !==
              Number(userId)
          );

        const exists =
          room.speakers.find(
            s =>
              Number(s.userId) ===
              Number(userId)
          );

        if (!exists) {

          room.speakers.push({
            userId:
              Number(userId),
            muted: false,
            socketId:
              socket.id,
          });

        }

        io.to(roomId).emit(
          "mic_accepted",
          {
            userId:
              Number(userId),

            speakers:
              room.speakers,
          }
        );

        io.to(roomId).emit(
          "mic_request_list",
          room.micRequests
        );

      }
    );

    // =========================================
    // REJECT MIC
    // =========================================

    socket.on(
      "reject_mic",
      ({ roomId, userId }) => {

        const room =
          jamRooms[roomId];

        if (!room) return;

        room.micRequests =
          room.micRequests.filter(
            r =>
              Number(r.userId) !==
              Number(userId)
          );

        io.to(roomId).emit(
          "mic_rejected",
          Number(userId)
        );

        io.to(roomId).emit(
          "mic_request_list",
          room.micRequests
        );

      }
    );

    // =========================================
    // TOGGLE MUTE
    // =========================================

    socket.on(
      "toggle_mute",
      ({ roomId, userId, muted }) => {

        const room =
          jamRooms[roomId];

        if (!room) return;

        room.speakers =
          room.speakers.map(
            (speaker) => {

              if (
                Number(
                  speaker.userId
                ) ===
                Number(userId)
              ) {

                return {
                  ...speaker,
                  muted,
                };

              }

              return speaker;

            }
          );

        io.to(roomId).emit(
          "speaker_muted",
          {
            userId,
            muted,
          }
        );

      }
    );

    // =========================================
    // REMOVE SPEAKER
    // =========================================

    socket.on(
      "remove_speaker",
      ({ roomId, userId }) => {

        const room =
          jamRooms[roomId];

        if (!room) return;

        room.speakers =
          room.speakers.filter(
            s =>
              Number(s.userId) !==
              Number(userId)
          );

        io.to(roomId).emit(
          "speaker_update",
          room.speakers
        );

        io.to(roomId).emit(
          "speaker_removed",
          Number(userId)
        );

      }
    );

    // =========================================
    // SEND GIFT
    // =========================================

    socket.on(
      "send_gift",
      async (data) => {

        try {

          const {
            senderId,
            receiverId,
            giftId,
            coins,
            roomId,
          } = data;

          if (
            Number(senderId) ===
            Number(receiverId)
          ) {

            return socket.emit(
              "error_message",
              "You cannot gift yourself"
            );

          }

          const [deduct] =
            await db.promise().query(
              `
              UPDATE users
              SET coins =
              coins - ?
              WHERE srno=?
              AND coins >= ?
              `,
              [
                coins,
                senderId,
                coins,
              ]
            );

          if (
            deduct.affectedRows ===
            0
          ) {

            return socket.emit(
              "error_message",
              "Insufficient coins"
            );

          }

          const reward =
            Math.floor(
              coins * 0.8
            );

          await db.promise().query(
            `
            UPDATE users
            SET coins =
            coins + ?
            WHERE srno=?
            `,
            [
              reward,
              receiverId,
            ]
          );

          await db.promise().query(
            `
            INSERT INTO gifts_live
            (
              sender_id,
              receiver_id,
              gift_id,
              coins,
              room_id
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
              senderId,
              receiverId,
              giftId,
              coins,
              roomId,
            ]
          );

          io.to(roomId).emit(
            "gift_received",
            {
              senderId,
              receiverId,
              giftId,
              coins,
            }
          );

        }

        catch (err) {

          console.log(
            "❌ GIFT ERROR:",
            err
          );

        }

      }
    );

    // =========================================
    // END ROOM
    // =========================================

    socket.on(
      "end_jam_room",
      async ({ roomId }) => {

        try {

          await db.promise().query(
            `
            UPDATE jam_rooms
            SET is_live=0
            WHERE room_id=?
            `,
            [roomId]
          );

          await db.promise().query(
            `
            DELETE FROM jam_room_users
            WHERE room_id=?
            `,
            [roomId]
          );

          io.to(roomId).emit(
            "jam_room_ended"
          );

          delete jamRooms[
            roomId
          ];

        }

        catch (err) {

          console.log(
            "❌ END ROOM ERROR:",
            err
          );

        }

      }
    );

    // =========================================
    // LEAVE ROOM
    // =========================================

    socket.on(
      "leave_jam_room",
      async ({ roomId, userId }) => {

        try {

          const room =
            jamRooms[roomId];

          if (!room) return;

          // REMOVE USER MEMORY

          room.viewers =
            room.viewers.filter(
              v =>
                Number(v.userId) !==
                Number(userId)
            );

          room.speakers =
            room.speakers.filter(
              s =>
                Number(s.userId) !==
                Number(userId)
            );

          // REMOVE USER DB

          await db.promise().query(
            `
            DELETE FROM jam_room_users
            WHERE room_id=?
            AND user_id=?
            `,
            [
              roomId,
              userId,
            ]
          );

          socket.leave(roomId);

          // =====================================
          // HOST LEFT
          // =====================================

          if (
            Number(userId) ===
            Number(room.hostId)
          ) {

            room.hostLeft =
              true;

            // ALERT USERS

            io.to(roomId).emit(
              "host_left_room",
              {
                message:
                  "Host left. Room will end in 5 minutes.",
              }
            );

            // START AUTO DELETE TIMER

            roomDeleteTimers[
              roomId
            ] = setTimeout(
              async () => {

                try {

                  console.log(
                    "🗑 AUTO DELETE ROOM:",
                    roomId
                  );

                  await db.promise().query(
                    `
                    UPDATE jam_rooms
                    SET is_live=0
                    WHERE room_id=?
                    `,
                    [roomId]
                  );

                  await db.promise().query(
                    `
                    DELETE FROM jam_room_users
                    WHERE room_id=?
                    `,
                    [roomId]
                  );

                  io.to(roomId).emit(
                    "jam_room_ended"
                  );

                  delete jamRooms[
                    roomId
                  ];

                  delete roomDeleteTimers[
                    roomId
                  ];

                }

                catch (err) {

                  console.log(
                    "AUTO DELETE ERROR:",
                    err
                  );

                }

              },
              5 * 60 * 1000
            );

          }

          // =====================================
          // UPDATE USERS
          // =====================================

          io.to(roomId).emit(
            "viewer_joined",
            {
              viewers:
                room.viewers,

              totalViewers:
                room.viewers.length,
            }
          );

          io.to(roomId).emit(
            "speaker_update",
            room.speakers
          );

          io.to(roomId).emit(
            "user_left",
            {
              userId,
            }
          );

        }

        catch (err) {

          console.log(
            "❌ LEAVE ROOM ERROR:",
            err
          );

        }

      }
    );

    // =========================================
    // DISCONNECT
    // =========================================

    socket.on(
      "disconnect",
      async () => {

        try {

          console.log(
            "❌ DISCONNECTED:",
            socket.id
          );

          for (
            const roomId
            in jamRooms
          ) {

            const room =
              jamRooms[roomId];

            const viewer =
              room.viewers.find(
                v =>
                  v.socketId ===
                  socket.id
              );

            if (!viewer) {
              continue;
            }

            // REMOVE MEMORY

            room.viewers =
              room.viewers.filter(
                v =>
                  v.socketId !==
                  socket.id
              );

            room.speakers =
              room.speakers.filter(
                v =>
                  v.socketId !==
                  socket.id
              );

            // REMOVE DB USER

            await db.promise().query(
              `
              DELETE FROM jam_room_users
              WHERE room_id=?
              AND user_id=?
              `,
              [
                roomId,
                viewer.userId,
              ]
            );

            // USER LEFT

            io.to(roomId).emit(
              "user_left",
              {
                userId:
                  viewer.userId,
                socketId:
                  socket.id,
              }
            );

            // UPDATE USERS

            io.to(roomId).emit(
              "viewer_joined",
              {

                viewers:
                  room.viewers,

                totalViewers:
                  room.viewers
                    .length,

              }
            );

            io.to(roomId).emit(
              "speaker_update",
              room.speakers
            );

            // =====================================
            // HOST DISCONNECTED
            // =====================================

            if (
              Number(
                viewer.userId
              ) ===
              Number(
                room.hostId
              )
            ) {

              io.to(roomId).emit(
                "host_left_room",
                {
                  message:
                    "Host disconnected. Room will end in 5 minutes.",
                }
              );

              roomDeleteTimers[
                roomId
              ] = setTimeout(
                async () => {

                  try {

                    await db.promise().query(
                      `
                      UPDATE jam_rooms
                      SET is_live=0
                      WHERE room_id=?
                      `,
                      [roomId]
                    );

                    await db.promise().query(
                      `
                      DELETE FROM jam_room_users
                      WHERE room_id=?
                      `,
                      [roomId]
                    );

                    io.to(roomId).emit(
                      "jam_room_ended"
                    );

                    delete jamRooms[
                      roomId
                    ];

                    delete roomDeleteTimers[
                      roomId
                    ];

                  }

                  catch (err) {

                    console.log(
                      "AUTO END ERROR:",
                      err
                    );

                  }

                },
                5 * 60 * 1000
              );

            }

            console.log(
              "👀 ROOM USERS:",
              room.viewers.length
            );

          }

        }

        catch (err) {

          console.log(
            "❌ DISCONNECT ERROR:",
            err
          );

        }

      }
    );

  });

};

export default jamRoomSocket;