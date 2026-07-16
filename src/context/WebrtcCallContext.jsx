import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import socket from "../socket";
import WebrtcCallModal from "../components/WebrtcCallModal";

const WebrtcCallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // 👉 agar TURN server ho to yahan add karo:
    // { urls: "turn:your-turn-server.com:3478", username: "...", credential: "..." },
  ],
};

export function WebrtcCallProvider({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [callState, setCallState] = useState("idle");
  // idle | calling | ringing | connected | ended

  const [callInfo, setCallInfo] = useState(null);
  // { callId, from, to, type, callerName, isCaller }

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const callInfoRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const ringTimeoutRef = useRef(null);

  // =========================
  // CLEANUP
  // =========================
  const cleanup = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallInfo(null);
    callInfoRef.current = null;
    setCallState("idle");
    setMuted(false);
    setCameraOff(false);
    pendingCandidatesRef.current = [];
  }, []);

  // =========================
  // CREATE PEER CONNECTION
  // =========================
  const createPeerConnection = useCallback((remoteUserId, callId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("webrtc_ice_candidate", {
          callId,
          to: remoteUserId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log("🔗 PC State:", pc.connectionState);

      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        // network drop — call ko end mark kar do
        endCall("connection_lost");
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // =========================
  // GET LOCAL MEDIA
  // =========================
const getLocalMedia = useCallback(async (type) => {
  const constraints = {
    audio: true,
    video: type === "video" ? { facingMode: "user" } : false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  } catch (err) {
    console.log("Media device not available:", err.name);

    // ✅ Agar device hi nahi mila (mic/camera missing), to empty stream se aage badho
    // taaki remote audio/video sun/dekh to saken, bas apna bhej nahi payenge
    if (
      err.name === "NotFoundError" ||
      err.name === "DevicesNotFoundError" ||
      err.name === "NotAllowedError"
    ) {
      const emptyStream = new MediaStream(); // khaali stream — kuch bhi track nahi
      localStreamRef.current = emptyStream;
      setLocalStream(emptyStream);
      return emptyStream;
    }

    throw err; // koi aur unexpected error ho to upar throw karo
  }
}, []);

  // =========================
  // START CALL (CALLER)
  // =========================
  const startWebrtcCall = useCallback(
    async (toUserId, toName, type = "video") => {
      try {
        if (callState !== "idle") {
          alert("Already in a call");
          return;
        }

        const callId = `${user.srno}_${toUserId}_${Date.now()}`;

        const info = {
          callId,
          from: user.srno,
          to: toUserId,
          type,
          callerName: user.name,
          remoteName: toName,
          isCaller: true,
        };

        callInfoRef.current = info;
        setCallInfo(info);
        setCallState("calling");

        // local media pehle le lo taaki accept hote hi turant offer bhej saken
        await getLocalMedia(type);

        socket.emit("webrtc_call_user", {
          callId,
          from: user.srno,
          to: toUserId,
          type,
          callerName: user.name,
        });

        // 30s tak koi response na aaye to auto-cancel
        ringTimeoutRef.current = setTimeout(() => {
          if (callInfoRef.current?.callId === callId) {
            socket.emit("webrtc_end_call", {
              callId,
              from: user.srno,
              to: toUserId,
            });
            cleanup();
          }
        }, 30000);
      } catch (err) {
        console.log("Start Call Error:", err);
        alert("Camera/Mic permission chahiye call karne ke liye.");
        cleanup();
      }
    },
    [callState, user, getLocalMedia, cleanup]
  );

  // =========================
  // ACCEPT CALL (CALLEE)
  // =========================
  const acceptWebrtcCall = useCallback(async () => {
    try {
      const info = callInfoRef.current;
      if (!info) return;

      await getLocalMedia(info.type);

      socket.emit("webrtc_accept_call", {
        callId: info.callId,
        from: info.from,
        to: user.srno,
        type: info.type,
      });

      setCallState("connected");
    } catch (err) {
      console.log("Accept Call Error:", err);
      alert("Camera/Mic permission chahiye.");
      rejectWebrtcCall();
    }
  }, [user]);

  // =========================
  // REJECT CALL
  // =========================
  const rejectWebrtcCall = useCallback(() => {
    const info = callInfoRef.current;
    if (!info) return;

    socket.emit("webrtc_reject_call", {
      callId: info.callId,
      from: info.from,
      to: user.srno,
    });

    cleanup();
  }, [user, cleanup]);

  // =========================
  // END CALL
  // =========================
  const endCall = useCallback(
    (reason) => {
      const info = callInfoRef.current;
      if (!info) return;

      socket.emit("webrtc_end_call", {
        callId: info.callId,
        from: info.isCaller ? info.from : info.to,
        to: info.isCaller ? info.to : info.from,
      });

      cleanup();
    },
    [cleanup]
  );

  // =========================
  // TOGGLE MUTE / CAMERA
  // =========================
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMuted(!audioTrack.enabled);

    const info = callInfoRef.current;
    if (info) {
      socket.emit("webrtc_media_state", {
        callId: info.callId,
        to: info.isCaller ? info.to : info.from,
        muted: !audioTrack.enabled,
      });
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCameraOff(!videoTrack.enabled);
  }, []);

  // =========================
  // SOCKET LISTENERS (ek hi baar mount pe lagenge)
  // =========================
  useEffect(() => {
    socket.on("webrtc_incoming_call", (data) => {
      if (callInfoRef.current) {
        socket.emit("webrtc_reject_call", {
          callId: data.callId,
          from: data.from,
          to: user?.srno,
        });
        return;
      }

      const info = {
        ...data,
        remoteName: data.callerName,
        isCaller: false,
      };

      callInfoRef.current = info;
      setCallInfo(info);
      setCallState("ringing");
    });

    socket.on("webrtc_call_accepted", async (data) => {
      const info = callInfoRef.current;
      if (!info || info.callId !== data.callId) return;

      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }

      setCallState("connected");

      const pc = createPeerConnection(info.to, info.callId);

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc_offer", {
        callId: info.callId,
        to: info.to,
        offer,
      });
    });

    socket.on("webrtc_offer", async (data) => {
      const info = callInfoRef.current;
      if (!info || info.callId !== data.callId) return;

      const pc = createPeerConnection(info.from, info.callId);

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc_answer", {
        callId: info.callId,
        to: info.from,
        answer,
      });
    });

    socket.on("webrtc_answer", async (data) => {
      const pc = pcRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];
    });

    socket.on("webrtc_ice_candidate", async (data) => {
      const pc = pcRef.current;

      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(data.candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.log("ICE Candidate Error:", err);
      }
    });

    socket.on("webrtc_call_rejected", (data) => {
      const info = callInfoRef.current;
      if (!info || info.callId !== data.callId) return;

      alert(data.reason === "busy" ? "User busy hai" : "Call declined");
      cleanup();
    });

    socket.on("webrtc_user_offline", (data) => {
      const info = callInfoRef.current;
      if (!info || info.callId !== data.callId) return;

      alert("User offline hai");
      cleanup();
    });

    socket.on("webrtc_call_ended", () => {
      cleanup();
    });

    socket.on("webrtc_media_state", (data) => {
      console.log("Remote media state:", data);
    });

    return () => {
      socket.off("webrtc_incoming_call");
      socket.off("webrtc_call_accepted");
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
      socket.off("webrtc_call_rejected");
      socket.off("webrtc_user_offline");
      socket.off("webrtc_call_ended");
      socket.off("webrtc_media_state");
    };
  }, []); // ✅ empty deps — sirf ek baar mount pe chalega, StrictMode me bhi cleanup properly hoga

  // =========================
  // ✅ MISSING THA — PROVIDER RETURN + MODAL RENDER
  // =========================
  return (
    <WebrtcCallContext.Provider value={{ startWebrtcCall, callState }}>
      {children}

      {callState !== "idle" && (
        <WebrtcCallModal
          callState={callState}
          callInfo={callInfo}
          localStream={localStream}
          remoteStream={remoteStream}
          muted={muted}
          cameraOff={cameraOff}
          onAccept={acceptWebrtcCall}
          onReject={rejectWebrtcCall}
          onEnd={endCall}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
        />
      )}
    </WebrtcCallContext.Provider>
  );
} // ✅ MISSING THA — WebrtcCallProvider function ki closing brace

export function useWebrtcCall() {
  const ctx = useContext(WebrtcCallContext);
  if (!ctx) {
    throw new Error("useWebrtcCall must be used inside WebrtcCallProvider");
  }
  return ctx;
}