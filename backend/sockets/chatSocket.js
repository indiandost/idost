import giveReward from "../utils/giveReward.js";
import admin from "../firebase.js";
//import { users } from "../server.js";
import users from "../users.js";
//const users = {}; // shared memory
const meetingRooms = {};
const activeCalls = {};

export default function chatSocket(io, socket, db) {

     // =========================
    // ✅ REGISTER USER
    // =========================
/*socket.on("register", (userId) => {
  userId = Number(userId);

  socket.userId = userId;

  users[userId] = socket.id;
  // users[userId] = new Set();

  console.log(
    "👤 User mapped2:",
    userId,
    "=>",
    socket.id
  );

  io.emit(
    "onlineUsers",
    Object.keys(users)
  );
});
*/
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


    ///firebase msg notice
async function sendPushNotification(
  token,
  title,
  body,
  data = {}
) {

  await admin.messaging().send({

    token,

    notification: {
      title,
      body,
    },

    data,

    android: {
      priority: "high",
    },

  });

}
// =========================

    // 💬 CHAT

    // =========================

  
socket.on("sendMessage",  async (data) => {

const toId = Number(data.to);

const fromId = Number(data.from);

const message = data.message || null;

const mediaUrl = data.media_url || null;

const type = data.type || "text";
const room = io.sockets.adapter.rooms.get(`user-${toId}`);

console.log("ROOM USERS:", room);


console.log("📩 Message:", data);



// 1️⃣ SAVE TO DATABASE

const sql = `

  INSERT INTO chat_messages 

  (sender_id, receiver_id, message, media_url, message_type)

  VALUES (?, ?, ?, ?, ?)

`;



  db.query(sql, [fromId, toId, message, mediaUrl, type], async (err, result) => {
  if (err) {
    console.log("❌ DB insert error:", err);
    return;
  }

  console.log("💾 Saved message ID:", result.insertId);
 // 2️⃣ SEND TO RECEIVER IF ONLINE

   const payload = {
  id: result.insertId,
  from: fromId,
  to: toId,
  message,
  media_url: mediaUrl,
  type,
  createdAt: new Date()
};
/*io.to(`user-${toId}`).emit(
   "receiveMessage",
   payload
);
*/
 const toSocket = users[toId];
    console.log("👉 Target socket:", toSocket);


// send ONLY to receiver
if (toSocket) {
  io.to(toSocket).emit("receiveMessage", payload);
}

// optional: send ACK to sender (different event)
const tempId = data.tempId || null;
io.to(socket.id).emit("messageSent", {
  tempId,
  status: "sent",
});
     //firebase notification code here
    try {
      // receiver token
      const [tokenRows] =  await db.promise().query(
          `
          SELECT
            fcm_token
          FROM users
          WHERE srno=?
          LIMIT 1
          `,
          [toId]
        );

      if (!tokenRows.length ||  !tokenRows[0].fcm_token) { return; }
      // sender info
      const [senderRows] =
        await db.promise().query(
          `
          SELECT
            name,
            pic
          FROM users
          WHERE srno=?
          LIMIT 1
          `,
          [fromId]
        );
      const senderName = senderRows[0]?.name || "New Message";  const senderPic = senderRows[0]?.pic || "";
      await sendPushNotification(tokenRows[0].fcm_token, senderName,  message || "📷 Photo", {
          senderId: String(fromId), senderName, senderPic,
        }
      );
    } catch (e) {
      console.log("FCM ERROR:", e );
    }
 

  });
});

    // =========================

    // 📞 CALL SIGNALING

    // =========================



   socket.on("callUser", ({ callId, from, to, type }) => {
  const toId = Number(to);
  const fromId = Number(from);

  console.log("📞 Call request:", {
    callId,
    fromId,
    toId,
    type,
  });

  // 🚫 caller or receiver already busy
  if (activeCalls[fromId] || activeCalls[toId]) {
    io.to(socket.id).emit("callRejected", {
      callId,
      reason: "busy",
    });
    return;
  }

  const socketId = users[toId];

  if (!socketId) {
    console.log("❌ User offline:", toId);

    io.to(socket.id).emit("userOffline", {
      callId,
    });

    return;
  }

  // create pending call only after validation
  activeCalls[callId] = {
    from: fromId,
    to: toId,
    type,
    accepted: false,
    createdAt: Date.now(),
  };

  io.to(socketId).emit("incomingCall", {
    callId,
    from: fromId,
    to: toId,
    type,
  });

  console.log(
    `📲 Incoming call sent ${fromId} -> ${toId}`
  );
});
    // ✅ Accept call
socket.on("acceptCall", ({ callId, from, to, type }) => {
  const call = activeCalls[callId];

  if (!call) {
    console.log("❌ Call not found:", callId);
    return;
  }

  if (call.accepted) {
    console.log("⚠️ Duplicate accept:", callId);
    return;
  }

  const fromId = Number(from);
  const toId = Number(to);

  // already busy with someone else
  if (
    (activeCalls[fromId] && activeCalls[fromId] !== toId) ||
    (activeCalls[toId] && activeCalls[toId] !== fromId)
  ) {
    io.to(socket.id).emit("callRejected", {
      callId,
      reason: "busy",
    });
    return;
  }

  call.accepted = true;

  // mark both users busy
  activeCalls[fromId] = toId;
  activeCalls[toId] = fromId;

  console.log("✅ Call accepted:", {
    callId,
    fromId,
    toId,
    type,
  });

  const callerSocket = users[fromId];

  if (callerSocket) {
    io.to(callerSocket).emit("callAccepted", {
      callId,
      from: toId,
      to: fromId,
      type,
    });
  }

  // receiver ko bhi notify karo
  const receiverSocket = users[toId];

  if (receiverSocket) {
    io.to(receiverSocket).emit("callStarted", {
      callId,
      from: fromId,
      to: toId,
      type,
    });
  }
});

socket.on("rejectCall", ({ callerId, receiverId, callId }) => {
  const caller = Number(callerId);
  const receiver = Number(receiverId);

  console.log("📴 RejectCall:", {
    caller,
    receiver,
    callId,
  });

  // clear busy mapping
  if (activeCalls[caller] === receiver) {
    delete activeCalls[caller];
  }

  if (activeCalls[receiver] === caller) {
    delete activeCalls[receiver];
  }

  // clear pending call object
  delete activeCalls[callId];

  console.log("ACTIVE CALLS:", activeCalls);

  const callerSocket = users[caller];

  if (callerSocket) {
    io.to(callerSocket).emit("callRejected", {
      callId,
      reason: "rejected",
    });
  }
});
/*
socket.on("endCall", ({ callId, from, to }) => {
  const fromId = Number(from);
  const toId = Number(to);

  delete activeCalls[fromId];
  delete activeCalls[toId];

  if (users[toId]) {
    io.to(users[toId]).emit("callEnded", {
      callId,
    });
  }

  if (users[fromId]) {
    io.to(users[fromId]).emit("callEnded", {
      callId,
    });
  }
});*/
socket.on("endCall", ({ callId, from, to }) => {
  const fromId = Number(from);
  const toId = Number(to);

  // clear busy status
  delete activeCalls[fromId];
  delete activeCalls[toId];

  // clear call object
  if (callId) {
    delete activeCalls[callId];
  }

  console.log("📴 Call ended:", {
    callId,
    fromId,
    toId,
  });

  console.log("ACTIVE CALLS:", activeCalls);

  const fromSocket = users[fromId];
  const toSocket = users[toId];

  if (fromSocket) {
    io.to(fromSocket).emit("callEnded", {
      callId,
      from: fromId,
      to: toId,
    });
  }

  if (toSocket) {
    io.to(toSocket).emit("callEnded", {
      callId,
      from: fromId,
      to: toId,
    });
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
/*
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
*/


socket.on("disconnect", (reason) => {

  console.log("🔌 Disconnected:", socket.id);

  const disconnectedUserId = Number(socket.userId);

  if (disconnectedUserId) {
   delete activeCalls[disconnectedUserId];
  }
  //delete activeCalls[disconnectedUserId];
/*
  if (disconnectedUserId) {
    delete users[disconnectedUserId];
    delete activeCalls[disconnectedUserId];
    io.emit(
      "onlineUsers",
      Object.keys(users)
    );
    console.log(
      "❌ Removed user:",
      disconnectedUserId
    );
  }
    */
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

}