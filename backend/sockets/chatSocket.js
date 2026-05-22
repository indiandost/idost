import giveReward from "../utils/giveReward.js";
export default function chatSocket(io, db) {



  const users = {}; // userId → socketId

  const meetingRooms = {};

  const activeCalls = {};

  io.on("connection", (socket) => {

  console.log("🔌 User connected:", socket.id);


   // =========================
    // ✅ REGISTER USER
    // =========================
      socket.on("register", (userId) => {
      const id = Number(userId);
      // prevent duplicate register for same socket
      if (socket.userId === id) {
        return;
      }

      socket.userId = id;
      // store socket
      users[id] = socket.id;
      // personal room

      socket.join(`user-${id}`);
      // send online users
      io.emit("onlineUsers", Object.keys(users));
      console.log("👤 User mapped:", id, "=>", socket.id);

    });

  // =====================
  // GIFT
  // =====================
   /*   socket.on("giftSent", (data) => {
      // Receiver gets alert
      io.to(data.receiverId).emit(
        "giftReceived",
        {
          gift: data.gift,
          senderName: data.senderId,
        }
      );

      // Sender gets success notice
      io.to(data.senderId).emit(
        "giftSentSuccess",
        {
          gift: data.gift,
        }
      );
    });*/
  /*socket.on("giftSent", (data) => {

    io.to(data.roomId)

      .emit("giftReceived", data);

  });
*/


    // =========================

    // 💬 CHAT

    // =========================

  
socket.on("sendMessage", (data) => {

const toId = Number(data.to);

const fromId = Number(data.from);

const message = data.message || null;

const mediaUrl = data.media_url || null;

const type = data.type || "text";



console.log("📩 Message:", data);



// 1️⃣ SAVE TO DATABASE

const sql = `

  INSERT INTO chat_messages 

  (sender_id, receiver_id, message, media_url, message_type)

  VALUES (?, ?, ?, ?, ?)

`;



db.query(sql, [fromId, toId, message, mediaUrl, type], (err, result) => {
  if (err) {
    console.log("❌ DB insert error:", err);
    return;
  }

  console.log("💾 Saved message ID:", result.insertId);

    // 2️⃣ SEND TO RECEIVER IF ONLINE

    const toSocket = users[toId];
    console.log("👉 Target socket:", toSocket);

  const payload = {
  id: result.insertId,
  from: fromId,
  to: toId,
  message,
  media_url: mediaUrl,
  type,
  createdAt: new Date()
};



// send ONLY to receiver
if (toSocket) {
  io.to(toSocket).emit("receiveMessage", payload);
}

// optional: send ACK to sender (different event)
io.to(socket.id).emit("messageSent", {
  tempId: payload.tempId,
  status: "sent",
});

  });
});

    // =========================

    // 📞 CALL SIGNALING

    // =========================



    // 🔔 Call user

socket.on("callUser", ({ from, to, type }) => {
  const toId = Number(to);
  const fromId = Number(from);

  console.log("📞 Call request:", {
    fromId,
    toId,
    type
  });



  // 🚫 busy check

  if (activeCalls[toId]) {



    io.to(socket.id).emit("callRejected", {

      reason: "busy"

    });



    return;

  }



  if (users[toId]) {



    io.to(users[toId]).emit("incomingCall", {

      from: fromId,

      to: toId,

      type

    });



  } else {



    console.log("❌ User offline");



    io.to(socket.id).emit("userOffline");

  }

});



    // ✅ Accept call

socket.on("acceptCall", ({ from, to, type }) => {



  const fromId = Number(from);

  const toId = Number(to);



  // ✅ mark both busy

  activeCalls[fromId] = true;

  activeCalls[toId] = true;



  console.log("✅ Call accepted:", {

    fromId,

    toId,

    type

  });



  if (users[fromId]) {



    io.to(users[fromId]).emit("callAccepted", {

      from: toId,

      type

    });



  }

});



    // ❌ Reject call

    socket.on("rejectCall", ({ from, to }) => {

      const fromId = Number(from);



      console.log("❌ Call rejected by:", from);



      if (users[fromId]) {

        io.to(users[fromId]).emit("callRejected", {

          reason: "rejected"

        });

      }

    });



    // 🔚 End call

socket.on("endCall", ({ from, to }) => {



  const fromId = Number(from);

  const toId = Number(to);



  console.log("📴 Call ended");



  // ✅ free users

  delete activeCalls[fromId];

  delete activeCalls[toId];



  if (users[toId]) {

    io.to(users[toId]).emit("callEnded");

  }

});



///////////////////////////////////

/// Group Meeting things ///

/////////////////////////////////////

///////////////////////////////////

/// Group Meeting things ///

/////////////////////////////////////



// =============================

// JOIN MEETING ROOM

// =============================

socket.on("joinMeetingRoom", ({ roomId, user }) => {



  if (!meetingRooms[roomId]) {



    meetingRooms[roomId] = {

      admin: Number(user.srno),

      participants: [],

      viewers: [],

      comments: [],

      requests: [],

    };

    db.query(`UPDATE users

    SET live_room = ?, live_status = 1

    WHERE srno = ?

    `,

    [roomId, user.srno]

    );

  }



  socket.join(roomId);



  // 👁 VIEWER ADD

  const alreadyViewer =

    meetingRooms[roomId].viewers.find(

      (v) => Number(v.srno) === Number(user.srno)

    );



  if (!alreadyViewer) {



    meetingRooms[roomId].viewers.push({

      ...user,

      socketId: socket.id,

    });



  } else {



    // refresh/new socket update

    alreadyViewer.socketId = socket.id;

  }



  // 📡 SEND ROOM DATA

  io.to(roomId).emit(

    "meetingRoomData",

    meetingRooms[roomId]

  );



  // 👁 VIEWER COUNT

  // =========================
// VIEWER COUNT
// =========================
io.to(roomId).emit("viewerCount", {
  count:
    meetingRooms[roomId]
      .viewers.length,

});
          // =========================
          // VIEWER REWARD SYSTEM
          // =========================
          const viewerCount =
            meetingRooms[roomId]
              .viewers.length;

          const adminId =
            meetingRooms[roomId]
              .admin;

          // prevent duplicate rewards
          if (
            !meetingRooms[roomId]
              .viewerRewards
          ) {

            meetingRooms[roomId]
              .viewerRewards = {};

          }

          // =========================
          // 10 VIEWERS REWARD
          // =========================
          if (
            viewerCount >= 3 &&
            !meetingRooms[roomId]
              .viewerRewards["10"]
          ) {

            meetingRooms[roomId]
              .viewerRewards["10"] = true;

            giveReward({

              db,
              io,

              userId:
                adminId,

              coins: 50,

              type:
                "viewers",

              title:
                "🎉 10 Live Viewers",

            });

          }

          // =========================
          // 25 VIEWERS REWARD
          // =========================
          if (
            viewerCount >= 25 &&
            !meetingRooms[roomId]
              .viewerRewards["25"]
          ) {

            meetingRooms[roomId]
              .viewerRewards["25"] = true;

            giveReward({

              db,
              io,

              userId:
                adminId,

              coins: 150,

              type:
                "viewers",

              title:
                "🔥 25 Live Viewers",

            });

          }

          // =========================
          // 50 VIEWERS REWARD
          // =========================
          if (
            viewerCount >= 50 &&
            !meetingRooms[roomId]
              .viewerRewards["50"]
          ) {

            meetingRooms[roomId]
              .viewerRewards["50"] = true;

            giveReward({

              db,
              io,

              userId:
                adminId,

              coins: 500,

              type:
                "viewers",

              title:
                "🚀 50 Live Viewers",

            });

          }


  console.log("👁 viewer joined", roomId);

});



// =============================

// LEAVE MEETING

// =============================

socket.on("leaveMeeting", ({ roomId, userId }) => {



  if (!meetingRooms[roomId]) return;



  const room =

    meetingRooms[roomId];



  // remove viewer

  room.viewers =

    room.viewers.filter(

      (u) =>

        Number(u.srno) !==

        Number(userId)

    );



  // remove participant

  room.participants =

    room.participants.filter(

      (u) =>

        Number(u.srno) !==

        Number(userId)

    );



  // remove request

  room.requests =

    room.requests.filter(

      (u) =>

        Number(u.srno) !==

        Number(userId)

    );



  io.to(roomId).emit(

    "meetingRoomData",

    room

  );



  io.to(roomId).emit(

    "viewerCount",

    {

      count:

        room.viewers.length,

    }

  );



  console.log(

    "🚪 user left meeting:",

    userId

  );



});





// =============================

// REQUEST JOIN VIDEO

// =============================

socket.on("requestJoinMeeting", ({ roomId, user }) => {



  if (!meetingRooms[roomId]) return;



  // 🚫 already participant

  const alreadyParticipant =

    meetingRooms[roomId].participants.find(

      (u) => Number(u.srno) === Number(user.srno)

    );



  if (alreadyParticipant) return;



  // 🚫 already requested

  const exists =

    meetingRooms[roomId].requests.find(

      (u) => Number(u.srno) === Number(user.srno)

    );



  if (exists) return;



  meetingRooms[roomId].requests.push({

    ...user,

    socketId: socket.id,

  });



  io.to(roomId).emit(

    "meetingRoomData",

    meetingRooms[roomId]

  );



  console.log("📩 join request:", user.name);

});





// =============================

// APPROVE JOIN

// =============================

socket.on("approveMeetingUser", ({ roomId, user }) => {



  if (!meetingRooms[roomId]) return;



  // 🚫 MAX 6 USERS

  if (

    meetingRooms[roomId].participants.length >= 6

  ) {



    io.to(socket.id).emit("meetingFull");



    return;

  }



  // 🚫 already participant

  const exists =

    meetingRooms[roomId].participants.find(

      (u) => Number(u.srno) === Number(user.srno)

    );



  if (!exists) {



    // ✅ ADD PARTICIPANT

    meetingRooms[roomId].participants.push({

      uid: Number(user.srno),

      srno: Number(user.srno),

      name: user.name,

      pic: user.pic || "",

      socketId: socket.id,

    });



  }



  // ❌ REMOVE REQUEST

  meetingRooms[roomId].requests =

    meetingRooms[roomId].requests.filter(

      (u) => Number(u.srno) !== Number(user.srno)

    );



  // 📡 UPDATE ROOM

  io.to(roomId).emit(

    "meetingRoomData",

    meetingRooms[roomId]

  );



  // 👁 UPDATE VIEWER COUNT

  io.to(roomId).emit("viewerCount", {

    count: meetingRooms[roomId].viewers.length,

  });



  // ✅ APPROVED USER ONLY

  io.to(`user-${user.srno}`).emit(

    `meetingApproved-${user.srno}`,

    {

      roomId,

    }

  );



  console.log("✅ approved:", user.name);

});





// =============================

// REJECT REQUEST

// =============================

socket.on("rejectMeetingUser", ({ roomId, userId }) => {



  if (!meetingRooms[roomId]) return;



  // ❌ remove request

  meetingRooms[roomId].requests =

    meetingRooms[roomId].requests.filter(

      (u) => Number(u.srno) !== Number(userId)

    );



  io.to(roomId).emit(

    "meetingRoomData",

    meetingRooms[roomId]

  );



  io.to(`user-${userId}`).emit(

    "meetingRejected"

  );



  console.log("❌ rejected:", userId);

});





// =============================

// LIVE COMMENTS

// =============================

socket.on("meetingComment", ({ roomId, comment }) => {



  if (!meetingRooms[roomId]) return;



  meetingRooms[roomId].comments.push(comment);



  io.to(roomId).emit(

    "meetingComments",

    meetingRooms[roomId].comments

  );



});





// =============================

// REMOVE USER

// =============================

socket.on("removeMeetingUser", ({ roomId, userId }) => {



  if (!meetingRooms[roomId]) return;



  // 👥 remove participant

  meetingRooms[roomId].participants =

    meetingRooms[roomId].participants.filter(

      (u) => Number(u.srno) !== Number(userId)

    );



  // 📡 update room

  io.to(roomId).emit(

    "meetingRoomData",

    meetingRooms[roomId]

  );



  // 👁 update count

  io.to(roomId).emit("viewerCount", {

    count: meetingRooms[roomId].viewers.length,

  });



  // 🚫 remove target user

  io.to(`user-${userId}`).emit(

    "removedFromMeeting"

  );



  console.log("❌ removed:", userId);



});





// =============================

// MUTE USER

// =============================

/*socket.on("muteMeetingUser", ({ userId }) => {



  io.to(`user-${userId}`).emit(

    "forceMute"

  );



  console.log("🔇 muted:", userId);



});*/

socket.on(

  "muteMeetingUser",

  ({ userId, mute }) => {



    io.to(

      `user-${userId}`

    ).emit(

      "forceMute",

      {

        mute,

      }

    );



    console.log(

      mute

        ? "🔇 muted:"

        : "🔊 unmuted:",

      userId

    );



  }

);





// =============================

// END MEETING

// =============================

socket.on("endMeetingRoom", ({ roomId }) => {



  if (!meetingRooms[roomId]) return;



  // 🔔 notify all

  io.to(roomId).emit("meetingEnded");



  // 🚪 leave all sockets

  const room =

    io.sockets.adapter.rooms.get(roomId);



  if (room) {



    room.forEach((socketId) => {



      const s =

        io.sockets.sockets.get(socketId);



      if (s) {

        s.leave(roomId);

      }



    });



  }

   const adminId = meetingRooms[roomId].admin;

    db.query(

      `

      UPDATE users

      SET live_room = NULL,

          live_status = 0

      WHERE srno = ?

      `,

      [adminId]

    );

  // 🗑 delete room

  delete meetingRooms[roomId];



  console.log("❌ meeting ended");



});



// =========================

// 🔌 DISCONNECT

// =========================

socket.on("disconnect", () => {



  console.log("🔌 Disconnected:", socket.id);



  let disconnectedUserId = null;



  // =============================

  // REMOVE ONLINE USER

  // =============================

  for (let id in users) {



    if (users[id] === socket.id) {



      disconnectedUserId = Number(id);



      console.log(

        "❌ Removing user:",

        disconnectedUserId

      );



      delete users[id];



      // remove call busy state

      delete activeCalls[id];



      io.emit(

        "onlineUsers",

        Object.keys(users)

      );



      break;



    }



  }



  // =============================

  // CLEANUP MEETING ROOMS

  // =============================

  for (const roomId in meetingRooms) {



    const room =

      meetingRooms[roomId];



    if (!room) continue;



    // =============================

    // ADMIN DISCONNECTED

    // =============================

    if (

      Number(room.admin) ===

      Number(disconnectedUserId)

    ) {



      console.log(

        "❌ Admin disconnected. Ending room:",

        roomId

      );



      // notify all

      io.to(roomId).emit(

        "meetingEnded"

      );



      // update db

      db.query(

        `

        UPDATE users

        SET live_room = NULL,

            live_status = 0

        WHERE srno = ?

        `,

        [disconnectedUserId]

      );



      // delete room

      delete meetingRooms[roomId];



      continue;



    }



    // =============================

    // REMOVE VIEWER

    // =============================

    room.viewers =

      (room.viewers || []).filter(

        (u) =>

          Number(u.srno) !==

          Number(disconnectedUserId)

      );



    // =============================

    // REMOVE PARTICIPANT

    // =============================

    room.participants =

      (room.participants || []).filter(

        (u) =>

          Number(u.srno) !==

          Number(disconnectedUserId)

      );



    // =============================

    // REMOVE REQUEST

    // =============================

    room.requests =

      (room.requests || []).filter(

        (u) =>

          Number(u.srno) !==

          Number(disconnectedUserId)

      );



    // =============================

    // UPDATE ROOM

    // =============================

    io.to(roomId).emit(

      "meetingRoomData",

      room

    );



    io.to(roomId).emit(

      "viewerCount",

      {

        count:

          room.viewers.length,

      }

    );



    console.log(

      "🧹 cleaned user from room:",

      roomId

    );



  }



});



  });

}