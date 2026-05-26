// ==========================================
// FILE: src/pages/JamRoom.jsx
// ==========================================

import { useEffect, useRef, useState } from "react";

import { useParams } from "react-router-dom";

import AgoraRTC from "agora-rtc-sdk-ng";

import socket from "../socket";

import GiftBar from "../components/GiftBar";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

const API = import.meta.env.VITE_API_URL;

export default function JamRoom() {
  const token = localStorage.getItem("token"); 
  // ==========================================
  // PARAMS
  // ==========================================
  const { roomId } = useParams();

  // ==========================================
  // USER
  // ==========================================

  const user = JSON.parse(localStorage.getItem("user"));

  // ==========================================
  // REFS
  // ==========================================
  const clientRef = useRef(null);

  const messagesEndRef = useRef(null);

  // ==========================================
  // STATES
  // ==========================================

  const [joined, setJoined] = useState(false);

  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [viewers, setViewers] = useState([]);

  const [speakers, setSpeakers] = useState([]);

  const [micRequests, setMicRequests] = useState([]);

  const [reactions, setReactions] = useState([]);

  const [micRequested, setMicRequested] = useState(false);

  const [isSpeaker, setIsSpeaker] = useState(false);

  const [micMuted, setMicMuted] = useState(false);

  const [roomData, setRoomData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [localTracks, setLocalTracks] = useState(null);
  const localTracksRef = useRef(null);
  const [activeSpeakers, setActiveSpeakers] = useState({});
  const [hostOffline, setHostOffline] = useState(false);
  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // FETCH ROOM
  // ==========================================

  const fetchRoom = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/jam-room/${roomId}`,{
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

      const data = await res.json();

      if (!res.ok) {
        setRoomData(null);

        return;
      }

      setRoomData(data.room);
    } catch (err) {
      console.log("ROOM FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };
  //host out
  useEffect(() => {
    // HOST LEFT

    socket.on("host_left_room", (data) => {
      alert(data.message || "Host left room");

      // OPTIONAL:
      // show inactive UI

      setHostOffline(true);
    });

    // ROOM ENDED

    socket.on("jam_room_ended", () => {
      alert("Room ended");

      // LEAVE AGORA

      leaveChannel();

      // REDIRECT

      navigate("/");
    });

    return () => {
      socket.off("host_left_room");

      socket.off("jam_room_ended");
    };
  }, []);
  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchRoom();
  }, [roomId]);

  // ==========================================
  // AUTO JOIN CHANNEL
  // ==========================================
  useEffect(() => {
    if (!roomData || joined) return;

    if (Number(user?.srno) === Number(roomData?.host_id)) {
      setIsSpeaker(true);

      joinVoice(roomData);
    } else {
      joinAudience();
    }
  }, [roomData, joined]);

  // ==========================================
  // SOCKET EVENTS
  // ==========================================

  useEffect(() => {
    if (!user || !roomId) return;

    // ==========================
    // CONNECT SOCKET
    // ==========================

    if (!socket.connected) {
      socket.connect();

      console.log("SOCKET CONNECTED");
    }

    // ==========================
    // JOIN ROOM
    // ==========================

    socket.emit("join_jam_room", {
      roomId,

      userId: Number(user.srno),

      name: user.name,
    });

    // ==========================
    // USER LEFT
    // ==========================

    const userLeft = ({ userId }) => {
      setViewers((prev) =>
        prev.filter((u) => Number(u.userId) !== Number(userId))
      );
    };

    // ==========================
    // VIEWERS
    // ==========================

    const viewerJoined = (data) => {
      console.log("VIEWERS:", data);

      if (Array.isArray(data.viewers)) {
        setViewers([...data.viewers]);
      }
    };

    // ==========================
    // CHAT
    // ==========================

    const receiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    // ==========================
    // REACTIONS
    // ==========================

    const receiveReaction = (data) => {
      const id = Date.now() + Math.random();

      const reactionData = {
        ...data,
        id,
      };

      setReactions((prev) => [...prev, reactionData]);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    };

    // ==========================
    // MIC ACCEPTED
    // ==========================

    const micAccepted = async (data) => {
      console.log("MIC ACCEPTED:", data);

      setMicRequested(false);

      if (Number(data.userId) === Number(user.srno)) {
        setIsSpeaker(true);

        setMicRequested(false);

        if (roomData?.agora_channel) {
          await leaveAudienceAndJoinVoice();
        }
      }

      // UPDATE SPEAKERS

      if (data.speakers) {
        setSpeakers(data.speakers);
      }
    };

    // ==========================
    // MIC REJECTED
    // ==========================

    const micRejected = (uid) => {
      if (Number(uid) === Number(user.srno)) {
        setMicRequested(false);

        alert("Mic request rejected");
      }
    };

    // ==========================
    // SPEAKER UPDATE
    // ==========================

    const speakerUpdate = (data) => {
      setSpeakers(data);
    };

    // ==========================
    // NEW MIC REQUEST
    // ==========================

    const newMicRequest = (data) => {
      setMicRequests((prev) => {
        const exists = prev.find(
          (r) => Number(r.userId) === Number(data.userId)
        );

        if (exists) return prev;

        return [...prev, data];
      });
    };

    // ==========================
    // REMOVE OLD EVENTS
    // ==========================

    socket.off("user_left");
    socket.off("viewer_joined");
    socket.off("jam:receive_message");
    socket.off("receive_reaction");
    socket.off("mic_accepted");
    socket.off("mic_rejected");
    socket.off("speaker_update");
    socket.off("new_mic_request");

    // ==========================
    // REGISTER EVENTS
    // ==========================

    socket.on("user_left", userLeft);

    socket.on("viewer_joined", viewerJoined);

    socket.on("jam:receive_message", receiveMessage);

    socket.on("receive_reaction", receiveReaction);

    socket.on("mic_accepted", micAccepted);

    socket.on("mic_rejected", micRejected);

    socket.on("speaker_update", speakerUpdate);

    socket.on("new_mic_request", newMicRequest);

    // ==========================
    // CLEANUP
    // ==========================

    return () => {
      socket.off("user_left", userLeft);

      socket.off("viewer_joined", viewerJoined);

      socket.off("jam:receive_message", receiveMessage);

      socket.off("receive_reaction", receiveReaction);

      socket.off("mic_accepted", micAccepted);

      socket.off("mic_rejected", micRejected);

      socket.off("speaker_update", speakerUpdate);

      socket.off("new_mic_request", newMicRequest);
      socket.off("speaker_mute_toggle", remoteMuteToggle);
    };
  }, [roomId, roomData]);
  // ==========================================
  // JOIN AS AUDIENCE
  // ==========================================

  const joinAudience = async () => {
    try {
      if (clientRef.current) return;

      const client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
      });

      client.enableAudioVolumeIndicator();

      client.on("volume-indicator", (volumes) => {
        const speakingUsers = {};

        volumes.forEach((v) => {
          console.log("USER:", v.uid, "VOLUME:", v.level);

          // 5 se upar means speaking
          if (v.level > 5) {
            speakingUsers[v.uid] = true;
          }
        });

        setActiveSpeakers(speakingUsers);
      });
      clientRef.current = client;

      // =========================
      // REMOTE AUDIO
      // =========================

      client.on("user-published", async (remoteUser, mediaType) => {
        try {
          console.log("REMOTE USER:", remoteUser.uid, mediaType);

          await client.subscribe(remoteUser, mediaType);

          if (mediaType === "audio" && remoteUser.audioTrack) {
            await AgoraRTC.resumeAudioContext();

            remoteUser.audioTrack.play();

            console.log("PLAY AUDIO:", remoteUser.uid);
          }
        } catch (err) {
          console.log("AUDIO PLAY ERROR:", err);
        }
      });

      // =========================
      // JOIN
      // =========================
      await client.setClientRole("audience");
      await client.join(
        APP_ID,
        roomData.agora_channel,
        null,
        Number(user.srno)
      );

      setJoined(true);
      client.on("user-unpublished", (user) => {
        console.log("USER UNPUBLISHED:", user.uid);
      });
      console.log("JOINED AUDIENCE");
    } catch (err) {
      console.log("AUDIENCE JOIN ERROR:", err);
    }
  };

  ///
  const leaveAudienceAndJoinVoice = async () => {
    try {
      console.log("SWITCHING TO SPEAKER");

      const oldClient = clientRef.current;

      // =====================
      // REMOVE OLD LISTENERS
      // =====================

      if (oldClient) {
        oldClient.removeAllListeners();

        try {
          await oldClient.leave();
        } catch (err) {
          console.log("OLD CLIENT LEAVE ERROR:", err);
        }
      }

      // =====================
      // FULL RESET
      // =====================

      clientRef.current = null;

      localTracksRef.current = null;

      setLocalTracks(null);

      setJoined(false);

      // IMPORTANT
      // AGORA NEEDS DELAY
      // BEFORE REJOIN SAME UID
      // =====================

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // =====================
      // JOIN AS SPEAKER
      // =====================

      await joinVoice(roomData);
    } catch (err) {
      console.log("REJOIN VOICE ERROR:", err);
    }
  };

  // ==========================================
  // JOIN VOICE
  // ==========================================
  const joinVoice = async (room) => {
    try {
      if (!room?.agora_channel) {
        console.log("NO CHANNEL");
        return;
      }

      // =========================
      // CLEAN OLD CLIENT
      // =========================

      if (clientRef.current) {
        try {
          await clientRef.current.leave();
        } catch (e) {}

        clientRef.current = null;
      }

      // =========================
      // CREATE CLIENT
      // =========================

      const client = AgoraRTC.createClient({
        mode: "live",
        codec: "vp8",
      });

      client.enableAudioVolumeIndicator();

      client.on("volume-indicator", (volumes) => {
        const speakingUsers = {};

        volumes.forEach((v) => {
          console.log("USER:", v.uid, "VOLUME:", v.level);

          // 5 se upar means speaking
          if (v.level > 5) {
            speakingUsers[v.uid] = true;
          }
        });

        setActiveSpeakers(speakingUsers);
      });
      clientRef.current = client;

      // =========================
      // REMOTE USERS
      // =========================

      client.on("user-published", async (remoteUser, mediaType) => {
        try {
          console.log("REMOTE PUBLISHED:", remoteUser.uid, mediaType);

          await client.subscribe(remoteUser, mediaType);

          // AUDIO
          if (mediaType === "audio" && remoteUser.audioTrack) {
            await AgoraRTC.resumeAudioContext();

            remoteUser.audioTrack.play();

            console.log("PLAYING:", remoteUser.uid);
          }
        } catch (err) {
          console.log("REMOTE SUBSCRIBE ERROR:", err);
        }
      });

      // =========================
      // USER LEFT
      // =========================

      client.on("user-left", (user) => {
        console.log("USER LEFT:", user.uid);
      });

      // =========================
      // IMPORTANT
      // HOST ROLE
      // =========================

      await client.join(APP_ID, room.agora_channel, null, Number(user.srno));

      console.log("JOINED CHANNEL");

      await client.setClientRole("host");
      await new Promise((r) => setTimeout(r, 800));

      console.log("ROLE = HOST");

      console.log("JOINED CHANNEL");
      client.on("user-unpublished", (user) => {
        console.log("USER UNPUBLISHED:", user.uid);
      });
      // =========================
      // CREATE MIC
      // =========================
      const permission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      console.log("MIC PERMISSION GRANTED", permission);

      permission.getTracks().forEach((track) => track.stop());
      const mic = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        ANS: true,
        AGC: true,

        encoderConfig: {
          sampleRate: 48000,
          stereo: true,
          bitrate: 128,
        },
      });

      console.log("MIC CREATED");

      // =========================
      // PUBLISH
      // =========================

      await client.publish([mic]);

      console.log("MIC PUBLISHED SUCCESS");

      client.on("connection-state-change", (cur, prev) => {
        console.log("CONNECTION:", prev, "->", cur);
      });
      // =========================
      // SAVE TRACK
      // =========================

      localTracksRef.current = { mic };

      setLocalTracks({ mic });

      setJoined(true);

      setMicMuted(false);
    } catch (err) {
      console.log("JOIN VOICE ERROR:", err);
    }
  };
  // ==========================================
  // LEAVE ROOM
  // ==========================================

  const leaveRoom = async () => {
    try {
      console.log("LEAVING ROOM...");

      // ==========================
      // INFORM SOCKET SERVER
      // ==========================

      socket.emit("leave_jam_room", {
        roomId,
        userId: Number(user?.srno),
      });

      // ==========================
      // REMOVE MIC TRACK
      // ==========================

      if (localTracks?.mic) {
        try {
          localTracks.mic.stop();

          localTracks.mic.close();
        } catch (err) {
          console.log("MIC CLEANUP ERROR:", err);
        }
      }

      // ==========================
      // LEAVE AGORA
      // ==========================

      if (clientRef.current) {
        try {
          await clientRef.current.leave();
        } catch (err) {
          console.log("AGORA LEAVE ERROR:", err);
        }

        clientRef.current = null;
      }

      // ==========================
      // RESET STATES
      // ==========================

      setJoined(false);

      setIsSpeaker(false);

      setMicRequested(false);

      setLocalTracks(null);

      console.log("ROOM LEFT SUCCESS");
    } catch (err) {
      console.log("LEAVE ROOM ERROR:", err);
    }
  };

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        leaveRoom();
      }

      // ==========================
      // REMOVE SOCKET LISTENERS
      // ==========================

      socket.off("viewer_joined");

      socket.off("receive_message");

      socket.off("receive_reaction");

      socket.off("mic_accepted");

      socket.off("mic_rejected");

      socket.off("speaker_muted");

      socket.off("speaker_removed");

      socket.off("mic_request_list");
    };
  }, []);
  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("jam:send_message", {
      roomId,

      userId: Number(user.srno),

      name: user.name,

      message,
    });

    setMessage("");
  };

  // ==========================================
  // SEND REACTION
  // ==========================================

  const sendReaction = (emoji) => {
    socket.emit("send_reaction", {
      roomId,
      emoji,
    });
  };

  // ==========================================
  // REQUEST MIC
  // ==========================================

  const requestMic = () => {
    socket.emit("request_mic", {
      roomId,

      userId: Number(user.srno),
    });

    setMicRequested(true);
  };

  // ==========================================
  // ACCEPT MIC
  // ==========================================

  const acceptMic = (userId) => {
    socket.emit("accept_mic", {
      roomId,

      userId,
    });

    setMicRequests((prev) =>
      prev.filter((r) => Number(r.userId) !== Number(userId))
    );
  };

  // ==========================================
  // MUTE / UNMUTE
  // ==========================================
  const toggleMute = async () => {
    try {
      const mic = localTracksRef.current?.mic;

      if (!mic) return;

      if (micMuted) {
        await mic.setMuted(false);

        setMicMuted(false);

        console.log("UNMUTED");
      } else {
        await mic.setMuted(true);

        setMicMuted(true);

        console.log("MUTED");
      }
    } catch (err) {
      console.log("MUTE ERROR:", err);
    }
  };

  // ==========================
  // REMOTE MUTE / UNMUTE
  // ==========================

  const remoteMuteToggle = async (data) => {
    const { userId, muted } = data;

    // only target user
    if (Number(userId) !== Number(user.srno)) return;

    try {
      const mic = localTracksRef.current?.mic;

      if (!mic) return;

      await mic.setMuted(muted);

      setMicMuted(muted);

      console.log(muted ? "ADMIN MUTED YOU" : "ADMIN UNMUTED YOU");
    } catch (err) {
      console.log("REMOTE MUTE ERROR:", err);
    }
  };

  socket.on("speaker_mute_toggle", remoteMuteToggle);
  const toggleUserMute = (targetUserId, muted) => {
    // UI UPDATE
    setSpeakers((prev) =>
      prev.map((s) => {
        if (Number(s.userId) === Number(targetUserId)) {
          return {
            ...s,
            muted,
          };
        }

        return s;
      })
    );

    // SOCKET EVENT
    socket.emit("toggle_speaker_mute", {
      roomId,

      userId: targetUserId,

      muted,
    });
  };

  // ==========================================
  // LEAVE MIC
  // ==========================================

  const leaveSpeaker = async () => {
    try {
      // =========================
      // UNPUBLISH MIC
      // =========================

      const micTrack = localTracksRef.current?.mic;

      if (micTrack && clientRef.current) {
        await clientRef.current.unpublish([micTrack]);

        micTrack.stop();

        micTrack.close();
      }

      localTracksRef.current = null;

      // =========================
      // REMOVE FROM SERVER SPEAKERS
      // =========================

      socket.emit("remove_speaker", {
        roomId,
        userId: Number(user.srno),
      });

      // =========================
      // RESET STATES
      // =========================

      setLocalTracks(null);

      setIsSpeaker(false);

      setMicMuted(false);

      setMicRequested(false);

      console.log("LEFT SPEAKER MODE");
    } catch (err) {
      console.log("LEAVE SPEAKER ERROR:", err);
    }
  };

  //get user name
  const getUserName = (uid) => {
    const userData = viewers.find((v) => Number(v.userId) === Number(uid));

    return userData?.name || `User ${uid}`;
  };
  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        Loading Room...
      </div>
    );
  }

  // ==========================================
  // ROOM NOT FOUND
  // ==========================================

  if (!roomData) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        Room not found
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* HEADER */}

      <div className="p-4 bg-gray-900 flex justify-between items-center border-b border-gray-800">
        <div>
          <div className="font-bold text-xl">🎤 Jam Room</div>

          <div className="text-sm text-gray-400">Room ID: {roomId}</div>

          <div className="text-sm text-pink-400">{roomData?.title}</div>
        </div>

        <div className="text-lg">👀 {viewers.length}</div>
      </div>
      {hostOffline && (
        <div
          className="
        bg-red-600
        text-white
        text-center
        py-2
        text-sm
        font-semibold
      "
        >
          Host is offline Room will end soon...
        </div>
      )}

      {/* SPEAKERS */}

      {/* SPEAKERS */}
      <div className="px-3 py-2 bg-gray-950 border-b border-gray-800">
        <div className="text-sm text-pink-400 mb-2">
          🎙️ Speakers ({speakers.length})
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.isArray(speakers) &&
            speakers.map((spk) => {
              const isMuted = spk?.muted;

              const isSpeaking = activeSpeakers?.[spk.userId];

              return (
                <div
                  key={spk.userId}
                  className={`
              px-3 py-2 rounded-full text-sm
              flex items-center gap-2
              transition-all duration-200
              ${
                isMuted
                  ? "bg-red-700"
                  : isSpeaking
                  ? "bg-green-600 scale-105"
                  : "bg-gray-800"
              }
            `}
                >
                  {/* ICON */}
                  <span>{isMuted ? "🔇" : "🎤"}</span>

                  {/* NAME */}
                  <span>{getUserName(spk.userId)}</span>

                  {/* SPEAKING */}
                  {!isMuted && isSpeaking && (
                    <span className="text-xs animate-pulse">🔊</span>
                  )}

                  {/* ADMIN MUTE BUTTON */}
                  {Number(user?.srno) === Number(roomData?.host_id) &&
                    Number(spk.userId) !== Number(roomData?.host_id) && (
                      <button
                        onClick={() => toggleUserMute(spk.userId, !spk.muted)}
                        className="
                  text-[10px]
                  bg-black/30
                  hover:bg-black/50
                  px-2 py-1
                  rounded-full
                  ml-1
                "
                      >
                        {spk.muted ? "🔊" : "🔇"}
                      </button>
                    )}
                </div>
              );
            })}
        </div>
      </div>

      {/* USERS */}

      <div className="p-3 border-b border-gray-800">
        <div className="text-sm text-gray-400 mb-2">Connected Users</div>

        <div className="space-y-2">
          {viewers.map((viewer) => (
            <div
              key={viewer.userId}
              className="bg-gray-800 p-2 rounded-xl flex justify-between"
            >
              <div>{viewer.name}</div>

              <div className="text-xs text-gray-400">
                ID: {getUserName(viewer.userId)}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* GIFT BAR */}

      {Number(user?.srno) !== Number(roomData?.host_id) && (
        <GiftBar
          myId={Number(user?.srno)}
          hostId={roomData?.host_id}
          roomId={[Number(user?.srno), roomData?.host_id].sort().join("_")}
          socket={socket}
        />
      )}

      {/* SPEAKERS */}

      {/*  <div className="p-3 border-b border-gray-800 flex flex-wrap gap-2">

        {speakers.map((s, i) => (

          <div
            key={i}
            className="bg-pink-600 px-3 py-1 rounded-full text-sm"
          >

            🎙️ User {s.userId}

          </div>

        ))}

      </div>*/}

      {/* HOST MIC REQUESTS */}

      {Number(user?.srno) === Number(roomData?.host_id) && (
        <div className="p-3 space-y-2">
          {micRequests.map((r) => (
            <div
              key={r.userId}
              className="bg-gray-800 p-3 rounded-xl flex justify-between items-center"
            >
              <div>🎤 User {getUserName(r.userId)} requested mic</div>

              <button
                onClick={() => acceptMic(r.userId)}
                className="bg-green-600 px-3 py-1 rounded-xl"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      )}

      {/* REACTIONS */}

      <div className="absolute top-24 right-5 z-50 space-y-2">
        {reactions.map((r) => (
          <div key={r.id} className="text-3xl animate-bounce">
            {r.emoji}
          </div>
        ))}
      </div>

      {/* CHAT */}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No messages yet</div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              Number(m.userId) === Number(user?.srno)
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`
                    max-w-[75%]
                    px-3 py-2
                    rounded-2xl
                    text-sm
                    shadow-sm
                    ${
                      Number(m.userId) === Number(user?.srno)
                        ? "bg-pink-600 text-white rounded-br-md"
                        : "bg-gray-800 text-white rounded-bl-md"
                    }
                    `}
            >
              <div className="text-[11px] text-gray-300 mb-1 font-semibold">
                {m.name}
              </div>

              <div className="break-words">{m.message}</div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* BOTTOM */}

      <div className="p-3 bg-gray-900 border-t border-gray-800">
        {/* ACTIONS */}

        <div className="flex gap-2 mb-3 flex-wrap">
          <button
            onClick={() => sendReaction("🔥")}
            className="bg-gray-700 px-3 py-2 rounded-xl"
          >
            🔥
          </button>

          <button
            onClick={() => sendReaction("❤️")}
            className="bg-gray-700 px-3 py-2 rounded-xl"
          >
            ❤️
          </button>

          <button
            onClick={() => sendReaction("👏")}
            className="bg-gray-700 px-3 py-2 rounded-xl"
          >
            👏
          </button>

          {!isSpeaker && !micRequested && (
            <button
              onClick={requestMic}
              className="bg-green-600 px-4 py-2 rounded-xl ml-auto"
            >
              🎤 Request Mic
            </button>
          )}

          {micRequested && !isSpeaker && (
            <div className="ml-auto bg-yellow-600 px-4 py-2 rounded-xl">
              Waiting approval...
            </div>
          )}

          {isSpeaker && (
            <>
              <button
                onClick={toggleMute}
                className="bg-yellow-600 px-4 py-2 rounded-xl ml-auto"
              >
                {micMuted ? "🔇 Unmute" : "🎤 Mute"}
              </button>
            {
              Number(user?.srno) !==
              Number(roomData?.host_id) && (
              <button
                onClick={leaveSpeaker}
                className="bg-red-600 px-4 py-2 rounded-xl"
              >
                Leave Mic
              </button>
              )}
            </>
          )}
        </div>
        {/*<button
  onClick={() => {

    AgoraRTC.resumeAudioContext();

  }}
>
  Enable Audio
</button>*/}
        {/* MESSAGE */}

        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Type message..."
            className="flex-1 bg-gray-800 rounded-xl px-4 py-3 outline-none"
          />

          <button onClick={sendMessage} className="bg-pink-600 px-5 rounded-xl">
            Send
          </button>
        </div>
      </div>
      <button
        onClick={() => {
          AgoraRTC.resumeAudioContext();
        }}
        className="bg-blue-600 px-4 py-2 rounded-xl"
      >
        Enable Audio
      </button>
    </div>
  );
}