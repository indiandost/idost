// ==========================================
// FILE: src/pages/JamRoom.jsx
// ==========================================

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import AgoraRTC from "agora-rtc-sdk-ng";

import socket from "../socket";

import GiftBar from "../components/GiftBar";

const APP_ID =
  import.meta.env.VITE_AGORA_APP_ID;

const API =
  import.meta.env.VITE_API_URL;

export default function JamRoom() {

  // ==========================================
  // PARAMS
  // ==========================================
  const { roomId } = useParams();

  // ==========================================
  // USER
  // ==========================================

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  // ==========================================
  // REFS
  // ==========================================
    const clientRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  // ==========================================
  // STATES
  // ==========================================

  const [joined, setJoined] =
    useState(false);

  const [messages, setMessages] =
    useState([]);

  const [message, setMessage] =
    useState("");

  const [viewers, setViewers] =
    useState([]);

  const [speakers, setSpeakers] =
    useState([]);

  const [micRequests, setMicRequests] =
    useState([]);

  const [reactions, setReactions] =
    useState([]);

  const [micRequested, setMicRequested] =
    useState(false);

  const [isSpeaker, setIsSpeaker] =
    useState(false);

  const [micMuted, setMicMuted] =
    useState(false);

  const [roomData, setRoomData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [localTracks, setLocalTracks] =
    useState(null);

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {

    messagesEndRef.current
      ?.scrollIntoView({
        behavior: "smooth",
      });

  }, [messages]);

  // ==========================================
  // FETCH ROOM
  // ==========================================

  const fetchRoom = async () => {

    try {

      setLoading(true);

      const res = await fetch(
        `${API}/api/jam-room/${roomId}`
      );

      const data =
        await res.json();

      if (!res.ok) {

        setRoomData(null);

        return;

      }

      setRoomData(data.room);

    }

    catch (err) {

      console.log(
        "ROOM FETCH ERROR:",
        err
      );

    }

    finally {

      setLoading(false);

    }

  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {

    fetchRoom();

  }, [roomId]);

  // ==========================================
  // AUTO HOST JOIN VOICE
  // ==========================================

  /*useEffect(() => {

    if (
      roomData &&
      Number(user?.srno) ===
      Number(roomData?.host_id)
    ) {

      setIsSpeaker(true);

      joinVoice();

    }

  }, [roomData]);*/
  // ==========================================
// AUTO JOIN CHANNEL
// ==========================================
useEffect(() => {

  if (!roomData || joined) return;

  if (
    Number(user?.srno) ===
    Number(roomData?.host_id)
  ) {

    setIsSpeaker(true);

    joinVoice();

  }

  else {

    joinAudience();

  }

}, [roomData, joined]);

  // ==========================================
  // SOCKET EVENTS
  // ==========================================

  useEffect(() => {

    if (
      !user ||
      !roomId
    ) return;

    if (!socket.connected) {
    //socket.removeAllListeners();
      socket.connect();

    }

    // ==========================
    // JOIN ROOM
    // ==========================

    socket.emit(
      "join_jam_room",
      {

        roomId,

        userId:
          Number(user.srno),

        name:
          user.name,

      }
    );

///user leave///
const userLeft = ({ userId }) => {

  setViewers(prev =>
    prev.filter(
      u =>
        Number(u.userId) !==
        Number(userId)
    )
  );

};

socket.on(
  "user_left",
  userLeft
);



    // ==========================
    // VIEWERS
    // ==========================

    const viewerJoined =
  (data) => {

    console.log(
      "VIEWERS:",
      data
    );

    if (
      Array.isArray(
        data.viewers
      )
    ) {

      setViewers(
        [...data.viewers]
      );

    }

  };

    socket.on(
      "viewer_joined",
      viewerJoined
    );

    // ==========================
    // CHAT
    // ==========================

    const receiveMessage =
      (msg) => {

        setMessages(prev => [
          ...prev,
          msg,
        ]);

      };

    socket.on(
      "receive_message",
      receiveMessage
    );

    // ==========================
    // REACTIONS
    // ==========================

    const receiveReaction =
      (data) => {

        const id =
          Date.now() +
          Math.random();

        const reactionData = {
          ...data,
          id,
        };

        setReactions(prev => [
          ...prev,
          reactionData,
        ]);

        setTimeout(() => {

          setReactions(prev =>
            prev.filter(
              r => r.id !== id
            )
          );

        }, 3000);

      };

    socket.on(
      "receive_reaction",
      receiveReaction
    );

    // ==========================
    // MIC ACCEPTED
    // ==========================

   const micAccepted =
  async (data) => {

    console.log(
      "MIC ACCEPTED:",
      data
    );
    setMicRequested(false);
    if (
      Number(data.userId) ===
      Number(user.srno)
    ) {

      setIsSpeaker(true);

      setMicRequested(false);

      await joinVoice();

    }

    // update speakers list

    if (data.speakers) {

      setSpeakers(
        data.speakers
      );

    }

  };

    socket.on(
      "mic_accepted",
      micAccepted
    );

//Mic rejected 
const micRejected =
  (uid) => {

    if (
      Number(uid) ===
      Number(user.srno)
    ) {

      setMicRequested(false);

      alert(
        "Mic request rejected"
      );

    }

  };

socket.on(
  "mic_rejected",
  micRejected
);

    // ==========================
    // SPEAKERS UPDATE
    // ==========================

    const speakerUpdate =
      (data) => {

        setSpeakers(data);

      };

    socket.on(
      "speaker_update",
      speakerUpdate
    );

    // ==========================
    // HOST MIC REQUEST
    // ==========================

    const newMicRequest =
      (data) => {

        setMicRequests(prev => {

          const exists =
            prev.find(
              r =>
                Number(
                  r.userId
                ) ===
                Number(
                  data.userId
                )
            );

          if (exists)
            return prev;

          return [
            ...prev,
            data,
          ];

        });

      };

    socket.on(
      "new_mic_request",
      newMicRequest
    );

    // ==========================
    // CLEANUP
    // ==========================

    return () => {

      socket.off(
        "viewer_joined",
        viewerJoined
      );

      socket.off(
        "receive_message",
        receiveMessage
      );

      socket.off(
        "receive_reaction",
        receiveReaction
      );
      socket.off(
        "user_left",
        userLeft
        );
      socket.off(
        "mic_accepted",
        micAccepted
      );
      socket.off(
        "mic_rejected",
        micRejected
      );
      socket.off(
        "speaker_update",
        speakerUpdate
      );

      socket.off(
        "new_mic_request",
        newMicRequest
      );

    };

  }, [roomId]);

// ==========================================
// JOIN AS AUDIENCE
// ==========================================

const joinAudience = async () => {

  try {

    if (clientRef.current) return;

    if (!roomData?.agora_channel) {
      return;
    }

    const client =
      AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

    clientRef.current = client;

    // =========================
    // REMOTE AUDIO
    // =========================

    client.on(
      "user-published",
      async (remoteUser, mediaType) => {

        console.log(
          "REMOTE USER:",
          remoteUser.uid,
          mediaType
        );

        await client.subscribe(
          remoteUser,
          mediaType
        );

        if (mediaType === "audio") {

          remoteUser.audioTrack?.play();
          await AgoraRTC.resumeAudioContext();

          console.log(
            "PLAYING:",
            remoteUser.uid
          );

        }

      }
    );
                client.on(
            "user-unpublished",
            (user, type) => {

                console.log(
                "USER UNPUBLISHED",
                user.uid,
                type
                );

            }
            );

    // =========================
    // JOIN CHANNEL
    // =========================

    await client.join(
      APP_ID,
      roomData.agora_channel,
      null,
      Number(user.srno)
    );

    setJoined(true);

    console.log(
      "JOINED AS AUDIENCE"
    );

  }

  catch (err) {

    console.log(
      "AUDIENCE JOIN ERROR:",
      err
    );

  }

};

  // ==========================================
  // JOIN VOICE
  // ==========================================
const joinVoice = async () => {

  try {

    let client = clientRef.current;

    // =========================
    // CREATE CLIENT IF NOT EXISTS
    // =========================

    if (!client) {

      client = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      clientRef.current = client;

      // =========================
      // REMOTE AUDIO LISTENER
      // =========================

      client.on(
        "user-published",
        async (remoteUser, mediaType) => {

          console.log(
            "REMOTE PUBLISHED:",
            remoteUser.uid,
            mediaType
          );

          await client.subscribe(
            remoteUser,
            mediaType
          );

          if (mediaType === "audio") {

            remoteUser.audioTrack?.play();
            await AgoraRTC.resumeAudioContext();

            console.log(
              "PLAY AUDIO:",
              remoteUser.uid
            );

          }

        }
      );
      client.on(
            "user-unpublished",
            (user, type) => {

                console.log(
                "USER UNPUBLISHED",
                user.uid,
                type
                );

            }
            );
      // =========================
      // USER LEFT
      // =========================
      client.on(
        "user-left",
        (user) => {
          console.log(
            "USER LEFT:",
            user.uid
          );
        }
      );

      await client.join(
        APP_ID,
        roomData.agora_channel,
        null,
        Number(user.srno)
      );

    }

    // =========================
    // ALREADY HAS MIC
    // =========================

    if (localTracks?.mic) {
      return;
    }

    // =========================
    // CREATE MIC
    // =========================

    const mic =
      await AgoraRTC
        .createMicrophoneAudioTrack({
          encoderConfig:
            "music_standard",
      });

    // =========================
    // PUBLISH MIC
    // =========================

    await client.publish([mic]);

    setLocalTracks({ mic });

    setJoined(true);

    console.log(
      "MIC PUBLISHED"
    );

  }

  catch (err) {

    console.log(
      "JOIN VOICE ERROR:",
      err
    );

  }

};
  // ==========================================
  // LEAVE VOICE
  // ==========================================

  // ==========================================
// LEAVE ROOM
// ==========================================

const leaveRoom = async () => {

  try {

    console.log(
      "LEAVING ROOM..."
    );

    // ==========================
    // INFORM SOCKET SERVER
    // ==========================

    socket.emit(
      "leave_jam_room",
      {
        roomId,
        userId:
          Number(user?.srno),
      }
    );

    // ==========================
    // REMOVE MIC TRACK
    // ==========================

    if (
      localTracks?.mic
    ) {

      try {

        localTracks.mic.stop();

        localTracks.mic.close();

      }

      catch (err) {

        console.log(
          "MIC CLEANUP ERROR:",
          err
        );

      }

    }

    // ==========================
    // LEAVE AGORA
    // ==========================

    if (
      clientRef.current
    ) {

      try {

        await clientRef.current.leave();

      }

      catch (err) {

        console.log(
          "AGORA LEAVE ERROR:",
          err
        );

      }

      clientRef.current =
        null;

    }

    // ==========================
    // RESET STATES
    // ==========================

    setJoined(false);

    setIsSpeaker(false);

    setMicRequested(false);

    setLocalTracks(null);

    console.log(
      "ROOM LEFT SUCCESS"
    );

  }

  catch (err) {

    console.log(
      "LEAVE ROOM ERROR:",
      err
    );

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

    socket.off(
      "viewer_joined"
    );

    socket.off(
      "receive_message"
    );

    socket.off(
      "receive_reaction"
    );

    socket.off(
      "mic_accepted"
    );

    socket.off(
      "mic_rejected"
    );

    socket.off(
      "speaker_muted"
    );

    socket.off(
      "speaker_removed"
    );

    socket.off(
      "mic_request_list"
    );

  };

}, []);
  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = () => {

    if (
      !message.trim()
    ) return;

    socket.emit(
      "send_message",
      {

        roomId,

        userId:
          Number(user.srno),

        name:
          user.name,

        message,

      }
    );

    setMessage("");

  };

  // ==========================================
  // SEND REACTION
  // ==========================================

  const sendReaction =
    (emoji) => {

      socket.emit(
        "send_reaction",
        {
          roomId,
          emoji,
        }
      );

    };

  // ==========================================
  // REQUEST MIC
  // ==========================================

  const requestMic =
    () => {

      socket.emit(
        "request_mic",
        {

          roomId,

          userId:
            Number(
              user.srno
            ),

        }
      );

      setMicRequested(
        true
      );

    };

  // ==========================================
  // ACCEPT MIC
  // ==========================================

  const acceptMic =
    (userId) => {

      socket.emit(
        "accept_mic",
        {

          roomId,

          userId,

        }
      );

      setMicRequests(prev =>
        prev.filter(
          r =>
            Number(
              r.userId
            ) !==
            Number(userId)
        )
      );

    };

  // ==========================================
  // MUTE / UNMUTE
  // ==========================================

  const toggleMute =
    async () => {

      try {

        if (
          !localTracks?.mic
        ) return;

        await localTracks.mic.setMuted(
          !micMuted
        );

        setMicMuted(
          !micMuted
        );

      }

      catch (err) {

        console.log(
          "MUTE ERROR:",
          err
        );

      }

    };

  // ==========================================
  // LEAVE MIC
  // ==========================================

 const leaveSpeaker = async () => {

  try {

    // =========================
    // UNPUBLISH MIC
    // =========================

    if (
      localTracks?.mic &&
      clientRef.current
    ) {

      await clientRef.current.unpublish(
        [localTracks.mic]
      );

      localTracks.mic.stop();

      localTracks.mic.close();

    }

    // =========================
    // REMOVE FROM SERVER SPEAKERS
    // =========================

    socket.emit(
      "remove_speaker",
      {
        roomId,
        userId:
          Number(user.srno),
      }
    );

    // =========================
    // RESET STATES
    // =========================

    setLocalTracks(null);

    setIsSpeaker(false);

    setMicMuted(false);

    setMicRequested(false);

    console.log(
      "LEFT SPEAKER MODE"
    );

  }

  catch (err) {

    console.log(
      "LEAVE SPEAKER ERROR:",
      err
    );

  }

};

//get user name
const getUserName = (uid) => {

  const userData =
    viewers.find(
      v =>
        Number(v.userId) ===
        Number(uid)
    );

  return (
    userData?.name ||
    `User ${uid}`
  );

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

          <div className="font-bold text-xl">

            🎤 Jam Room

          </div>

          <div className="text-sm text-gray-400">

            Room ID:
            {" "}
            {roomId}

          </div>

          <div className="text-sm text-pink-400">

            {roomData?.title}

          </div>

        </div>

        <div className="text-lg">

          👀 {viewers.length}

        </div>

      </div>
{/* SPEAKERS */}

<div className="px-3 py-2 bg-gray-950 border-b border-gray-800">

  <div className="text-sm text-pink-400 mb-2">

    🎙️ Speakers ({speakers.length})

  </div>

  <div className="flex flex-wrap gap-2">

    {speakers.map((speaker) => (

      <div
        key={speaker.userId}
        className="bg-gray-800 px-3 py-1 rounded-full text-sm"
      >

        🎤 {getUserName(speaker.userId)}

        {speaker.muted && " 🔇"}

      </div>

    ))}

  </div>

</div>

{/* USERS */}

<div className="p-3 border-b border-gray-800">

  <div className="text-sm text-gray-400 mb-2">

    Connected Users

  </div>

  <div className="space-y-2">

    {viewers.map((viewer) => (

      <div
        key={viewer.userId}
        className="bg-gray-800 p-2 rounded-xl flex justify-between"
      >

        <div>

          {viewer.name}

        </div>

        <div className="text-xs text-gray-400">

          ID:
          {" "}
          {getUserName(viewer.userId)}

        </div>

      </div>

    ))}

  </div>

</div>
      {/* GIFT BAR */}

      {
        Number(user?.srno) !==
        Number(
          roomData?.host_id
        ) && (

          <GiftBar

            myId={
              Number(
                user?.srno
              )
            }

            hostId={
              roomData?.host_id
            }

            roomId={
              [
                Number(
                  user?.srno
                ),

                roomData?.host_id
              ]
                .sort()
                .join("_")
            }

            socket={socket}

          />

        )
      }

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

      {
        Number(user?.srno) ===
        Number(roomData?.host_id) && (

          <div className="p-3 space-y-2">

            {micRequests.map(r => (

              <div
                key={r.userId}
                className="bg-gray-800 p-3 rounded-xl flex justify-between items-center"
              >

                <div>

                  🎤 User
                  {" "}
                  {r.userId}
                  {" "}
                  requested mic

                </div>

                <button
                  onClick={() =>
                    acceptMic(
                      r.userId
                    )
                  }
                  className="bg-green-600 px-3 py-1 rounded-xl"
                >

                  Accept

                </button>

              </div>

            ))}

          </div>

        )
      }

      {/* REACTIONS */}

      <div className="absolute top-24 right-5 z-50 space-y-2">

        {reactions.map(r => (

          <div
            key={r.id}
            className="text-3xl animate-bounce"
          >

            {r.emoji}

          </div>

        ))}

      </div>

      {/* CHAT */}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        {
          messages.length === 0 && (

            <div className="text-center text-gray-500 mt-10">

              No messages yet

            </div>

          )
        }

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

                    <div className="break-words">

                    {m.message}

                    </div>

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
            onClick={() =>
              sendReaction("🔥")
            }
            className="bg-gray-700 px-3 py-2 rounded-xl"
          >
            🔥
          </button>

          <button
            onClick={() =>
              sendReaction("❤️")
            }
            className="bg-gray-700 px-3 py-2 rounded-xl"
          >
            ❤️
          </button>

          <button
            onClick={() =>
              sendReaction("👏")
            }
            className="bg-gray-700 px-3 py-2 rounded-xl"
          >
            👏
          </button>

          {
            !isSpeaker &&
            !micRequested && (

              <button
                onClick={
                  requestMic
                }
                className="bg-green-600 px-4 py-2 rounded-xl ml-auto"
              >

                🎤 Request Mic

              </button>

            )
          }

          {
            micRequested &&
            !isSpeaker && (

              <div className="ml-auto bg-yellow-600 px-4 py-2 rounded-xl">

                Waiting approval...

              </div>

            )
          }

          {
            isSpeaker && (

              <>
                <button
                  onClick={
                    toggleMute
                  }
                  className="bg-yellow-600 px-4 py-2 rounded-xl ml-auto"
                >

                  {
                    micMuted
                      ? "🔇 Unmute"
                      : "🎤 Mute"
                  }

                </button>

                <button
                  onClick={
                    leaveSpeaker
                  }
                  className="bg-red-600 px-4 py-2 rounded-xl"
                >

                  Leave Mic

                </button>
              </>

            )
          }

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
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            onKeyDown={(e) => {

              if (
                e.key ===
                "Enter"
              ) {

                sendMessage();

              }

            }}
            placeholder="Type message..."
            className="flex-1 bg-gray-800 rounded-xl px-4 py-3 outline-none"
          />

          <button
            onClick={
              sendMessage
            }
            className="bg-pink-600 px-5 rounded-xl"
          >

            Send

          </button> 

        </div>

      </div>

    </div>

  );

}