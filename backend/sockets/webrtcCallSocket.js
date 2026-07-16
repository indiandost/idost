// =========================================
// WEBRTC CALL SIGNALING (Agora se independent)
// =========================================

const pendingWebrtcCalls = {};   // callId -> {from, to, type, accepted, createdAt}
const busyWebrtcUsers = {};      // userId -> partnerUserId

export default function webrtcCallSocket(io, socket, users) {

  // =========================
  // CALL USER
  // =========================
  socket.on("webrtc_call_user", ({ callId, from, to, type, callerName }) => {
    const fromId = Number(from);
    const toId = Number(to);
    
    if (busyWebrtcUsers[fromId] || busyWebrtcUsers[toId]) {
      io.to(socket.id).emit("webrtc_call_rejected", {
        callId,
        reason: "busy",
      });
      return;
    }

    const toSocketId = users[toId];

    if (!toSocketId) {
      io.to(socket.id).emit("webrtc_user_offline", { callId });
      return;
    }

    pendingWebrtcCalls[callId] = {
      from: fromId,
      to: toId,
      type,
      accepted: false,
      createdAt: Date.now(),
    };

    io.to(toSocketId).emit("webrtc_incoming_call", {
      callId,
      from: fromId,
      to: toId,
      type,
      callerName,
    });

    console.log(`📞 WebRTC Call: ${fromId} -> ${toId} (${type})`);
  });

  // =========================
  // ACCEPT CALL
  // =========================
  socket.on("webrtc_accept_call", ({ callId, from, to, type }) => {
    const call = pendingWebrtcCalls[callId];

    if (!call) {
      console.log("❌ WebRTC call not found:", callId);
      return;
    }

    if (call.accepted) return; // duplicate accept guard

    const fromId = Number(from); // caller
    const toId = Number(to);     // callee (accepting now)

    if (
      (busyWebrtcUsers[fromId] && busyWebrtcUsers[fromId] !== toId) ||
      (busyWebrtcUsers[toId] && busyWebrtcUsers[toId] !== fromId)
    ) {
      io.to(socket.id).emit("webrtc_call_rejected", {
        callId,
        reason: "busy",
      });
      return;
    }

    call.accepted = true;

    busyWebrtcUsers[fromId] = toId;
    busyWebrtcUsers[toId] = fromId;

    const callerSocket = users[fromId];

    if (callerSocket) {
      io.to(callerSocket).emit("webrtc_call_accepted", {
        callId,
        from: toId,
        to: fromId,
        type,
      });
    }

    console.log(`✅ WebRTC Call Accepted: ${callId}`);
  });

  // =========================
  // REJECT CALL
  // =========================
  socket.on("webrtc_reject_call", ({ callId, from, to }) => {
    const fromId = Number(from); // caller
    const toId = Number(to);     // rejecter

    if (busyWebrtcUsers[fromId] === toId) delete busyWebrtcUsers[fromId];
    if (busyWebrtcUsers[toId] === fromId) delete busyWebrtcUsers[toId];

    delete pendingWebrtcCalls[callId];

    const callerSocket = users[fromId];

    if (callerSocket) {
      io.to(callerSocket).emit("webrtc_call_rejected", {
        callId,
        reason: "rejected",
      });
    }

    // rejecter ke apne UI ko bhi confirm bhej do
    io.to(socket.id).emit("webrtc_call_rejected", {
      callId,
      reason: "rejected",
    });
  });

  // =========================
  // END CALL
  // =========================
  socket.on("webrtc_end_call", ({ callId, from, to }) => {
    const fromId = Number(from);
    const toId = Number(to);

    delete busyWebrtcUsers[fromId];
    delete busyWebrtcUsers[toId];

    if (callId) delete pendingWebrtcCalls[callId];

    [users[fromId], users[toId]].forEach((sId) => {
      if (sId) {
        io.to(sId).emit("webrtc_call_ended", {
          callId,
          from: fromId,
          to: toId,
        });
      }
    });

    console.log(`📴 WebRTC Call Ended: ${callId}`);
  });

  // =========================
  // SDP OFFER / ANSWER RELAY
  // =========================
  socket.on("webrtc_offer", ({ callId, to, offer }) => {
    const toSocketId = users[Number(to)];

    if (toSocketId) {
      io.to(toSocketId).emit("webrtc_offer", {
        callId,
        from: Number(socket.userId),
        offer,
      });
    }
  });

  socket.on("webrtc_answer", ({ callId, to, answer }) => {
    const toSocketId = users[Number(to)];

    if (toSocketId) {
      io.to(toSocketId).emit("webrtc_answer", {
        callId,
        from: Number(socket.userId),
        answer,
      });
    }
  });

  // =========================
  // ICE CANDIDATE RELAY
  // =========================
  socket.on("webrtc_ice_candidate", ({ callId, to, candidate }) => {
    const toSocketId = users[Number(to)];

    if (toSocketId) {
      io.to(toSocketId).emit("webrtc_ice_candidate", {
        callId,
        from: Number(socket.userId),
        candidate,
      });
    }
  });

  // =========================
  // TOGGLE MUTE / CAMERA NOTICE (UI sync ke liye, optional)
  // =========================
  socket.on("webrtc_media_state", ({ callId, to, muted, cameraOff }) => {
    const toSocketId = users[Number(to)];

    if (toSocketId) {
      io.to(toSocketId).emit("webrtc_media_state", {
        callId,
        from: Number(socket.userId),
        muted,
        cameraOff,
      });
    }
  });

  // =========================
  // DISCONNECT CLEANUP
  // =========================
  socket.on("disconnect", () => {
    const uid = Number(socket.userId);
    if (!uid) return;

    const partnerId = busyWebrtcUsers[uid];

    if (partnerId) {
      delete busyWebrtcUsers[partnerId];
      delete busyWebrtcUsers[uid];

      const partnerSocket = users[partnerId];

      if (partnerSocket) {
        io.to(partnerSocket).emit("webrtc_call_ended", {
          from: uid,
          to: partnerId,
          reason: "disconnect",
        });
      }
    }

    for (const callId in pendingWebrtcCalls) {
      const call = pendingWebrtcCalls[callId];

      if (call.from === uid || call.to === uid) {
        delete pendingWebrtcCalls[callId];
      }
    }
  });
}

// =========================
// TTL SWEEP — unanswered calls 60s baad clear (module load pe ek hi baar chalega jab server.js se call hoga)
// =========================
export function startWebrtcCallSweep() {
  setInterval(() => {
    const now = Date.now();

    for (const callId in pendingWebrtcCalls) {
      if (
        !pendingWebrtcCalls[callId].accepted &&
        now - pendingWebrtcCalls[callId].createdAt > 60000
      ) {
        delete pendingWebrtcCalls[callId];
      }
    }
  }, 30000);
}