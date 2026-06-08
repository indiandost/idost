import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import socket from "../socket";
import GiftBar from "../components/GiftBar";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export default function MeetingRoom() {
  const navigate = useNavigate();

  const { roomId } = useParams();

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    navigate("/login");

    return null;
  }

  const myId = Number(user?.srno);

  const localRef = useRef(null);

  const clientRef = useRef(null);

  const joiningRef = useRef(false);

  const cleanupRef = useRef(false);
const billingIntervalRef = useRef(null);

const callStartRef = useRef(null);
  const [joined, setJoined] = useState(false);

  const [roomData, setRoomData] = useState(null);

  const [comments, setComments] = useState([]);

  const [message, setMessage] = useState("");

  const [viewerCount, setViewerCount] = useState(0);

  const [approved, setApproved] = useState(false);

  const [requestPending, setRequestPending] = useState(false);

  const [localTracks, setLocalTracks] = useState(null);

  const [muted, setMuted] = useState(false);

  const [videoEnabled, setVideoEnabled] = useState(true);

  const [cameraFacing, setCameraFacing] = useState("user");

  const [loading, setLoading] = useState(false);

  const [remoteUsers, setRemoteUsers] = useState({});

  // =========================
  // SOCKET JOIN
  // =========================
  useEffect(() => {
    socket.emit("joinMeetingRoom", {
      roomId,
      user,
    });
  }, []);

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {
    socket.on("meetingRoomData", (data) => {
      setRoomData(data);
    });

    socket.on("meetingComments", (data) => {
      setComments(data);
    });

    socket.on("viewerCount", (data) => {
      setViewerCount(data.count);
    });

    socket.on("meetingRejected", () => {
      alert("Request rejected");

      setRequestPending(false);
    });

    socket.on("meetingEnded", async () => {
      alert("Meeting ended");

      await cleanupMeeting();

      navigate("/");
    });

    socket.on("removedFromMeeting", async () => {
      alert("Removed from meeting");

      await cleanupMeeting();

      navigate("/");
    });

    return () => {
      socket.off("meetingRoomData");
      socket.off("meetingComments");
      socket.off("viewerCount");
      socket.off("meetingRejected");
      socket.off("meetingEnded");
      socket.off("removedFromMeeting");
    };
  }, []);

  // =========================
  // FORCE MUTE BY ADMIN
  // =========================
  useEffect(() => {
    const handleForceMute = async ({ mute }) => {
      try {
        if (!localTracks?.mic) {
          return;
        }

        await localTracks.mic.setMuted(mute);

        setMuted(mute);

        alert(
          mute ? "Admin muted your microphone" : "Admin unmuted your microphone"
        );
      } catch (err) {
        console.log(err);
      }
    };

    socket.on("forceMute", handleForceMute);

    return () => {
      socket.off("forceMute", handleForceMute);
    };
  }, [localTracks]);

  // =========================
  // SOCKET DISCONNECT
  // =========================
  useEffect(() => {
    const handleDisconnect = async () => {
      console.log("Socket disconnected");

      await cleanupMeeting();

      alert("Server disconnected");

      navigate("/");
    };

    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // =========================
  // START MEETING
  // =========================
  useEffect(() => {
    if (roomData && !clientRef.current) {
      startMeeting();
    }
  }, [roomData]);

//fetch latest coin value
const getUserCoins = async (id) => {
  try {
    console.log(id);
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/users/coins/${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    const data = await res.json();
    if (!data.success) {
      return 0;
    }
    return Number(data.coins || 0);
  } catch (err) {
    console.log("getUserCoins error", err);
    return 0;
  }
};
  // =========================
  // ADMIN AUTO START
  // =========================
  useEffect(() => {
    const startAdmin = async () => {
      try {
        if (!joined) return;

        if (!roomData) return;

        if (!clientRef.current) return;

        if (Number(roomData.admin) !== Number(myId)) {
          return;
        }

        if (localTracks?.cam || localTracks?.mic) {
          return;
        }

        const latestCoins = await getUserCoins(myId);
        if (latestCoins < 1000) {
          alert(`Minimum 1000 coins required to host meeting. Current coins: ${latestCoins}`);
          //navigate("/");
          return;
        }
        const mic = await AgoraRTC.createMicrophoneAudioTrack();

        const cam = await AgoraRTC.createCameraVideoTrack({
          facingMode: cameraFacing,
        });

        await clientRef.current.publish([mic, cam]);

        setLocalTracks({
          mic,
          cam,
        });
///billing code
callStartRef.current = Date.now();
if (billingIntervalRef.current) {
  clearInterval(billingIntervalRef.current);
}

// charge every second
billingIntervalRef.current = setInterval(async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/call/add-meet-time`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: myId,
          seconds: 1,
        }),
      }
    );

    const data = await res.json();

    console.log("meeting billing", data);

    // limit reached
   if (!data.success || data.limitReached) {
        alert(data.message || "Meeting ended");
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
        socket.emit("endMeetingRoom", {
          roomId,
        });
        await cleanupMeeting();
        navigate("/");
      }
  } catch (err) {
    console.log(err);
  }
}, 1000);
//end billing code
        setApproved(true);

        await new Promise((r) => setTimeout(r, 500));

        if (localRef.current) {
          cam.play(localRef.current);
        }
      } catch (err) {
        console.log(err);
      }
    };

    startAdmin();
  }, [joined, roomData]);

  // =========================
  // USER APPROVED
  // =========================
  useEffect(() => {
    socket.on(`meetingApproved-${myId}`, async () => {
      try {
        if (!joined) return;

        if (!clientRef.current) return;

        if (localTracks?.mic || localTracks?.cam) {
          return;
        }

        setApproved(true);

        setRequestPending(false);

        const mic = await AgoraRTC.createMicrophoneAudioTrack();

        const cam = await AgoraRTC.createCameraVideoTrack({
          facingMode: cameraFacing,
        });

        await clientRef.current.publish([mic, cam]);

        setLocalTracks({
          mic,
          cam,
        });
/*
//billing code
callStartRef.current = Date.now();
// ✅ prevent duplicate interval
if (billingIntervalRef.current) {
  clearInterval(billingIntervalRef.current);
}
// charge every second
billingIntervalRef.current = setInterval(async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/call/add-meet-time`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: myId,
          seconds: 1,
        }),
      }
    );

    const data = await res.json();

    console.log("meeting billing", data);

    // limit reached
    if (
      data.limitReached ||
      data.remaining <= 0 ||
      data.coinsLeft <= 0
    ) {
      alert("Meeting limit reached");

      clearInterval(billingIntervalRef.current);

      billingIntervalRef.current = null;

      await cleanupMeeting();

      navigate("/");
    }
  } catch (err) {
    console.log(err);
  }
}, 1000);
///end billing ///
*/

        await new Promise((r) => setTimeout(r, 500));

        if (localRef.current) {
          cam.play(localRef.current);
        }
      } catch (err) {
        console.log(err);
      }
    });

    return () => {
      socket.off(`meetingApproved-${myId}`);
    };
  }, [joined, localTracks, cameraFacing]);

  // =========================
  // START AGORA
  // =========================
  const startMeeting = async () => {
    try {
      if (joiningRef.current) {
        return;
      }

      joiningRef.current = true;

      setLoading(true);

      const rtcClient = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      });

      clientRef.current = rtcClient;

      // =========================
      // CONNECTION
      // =========================
      rtcClient.on(
        "connection-state-change",
        async (curState, prevState, reason) => {
          console.log("AGORA:", prevState, "->", curState, reason);

          if (curState === "FAILED") {
            setTimeout(async () => {
              if (
                clientRef.current &&
                clientRef.current.connectionState === "FAILED"
              ) {
                try {
                  await cleanupMeeting();
                } catch {}

                alert("Connection lost");

                navigate("/");
              }
            }, 5000);
          }
        }
      );

      // =========================
      // USER PUBLISHED
      // =========================
      rtcClient.on("user-published", async (remoteUser, mediaType) => {
        try {
          await rtcClient.subscribe(remoteUser, mediaType);

          if (mediaType === "audio") {
            remoteUser.audioTrack?.play();
          }

          setRemoteUsers((prev) => ({
            ...prev,
            [remoteUser.uid]: remoteUser,
          }));

          if (mediaType === "video") {
            let player = document.getElementById(`user-${remoteUser.uid}`);

            if (!player) {
              player = document.createElement("div");

              player.id = `user-${remoteUser.uid}`;

              /* player.className = `
                    relative
                    bg-black
                    rounded-2xl
                    overflow-hidden
                    border
                    border-gray-700
                    h-full
                    w-full
                  `;*/
              player.className = `
                    relative
                    bg-black
                    rounded-2xl
                    overflow-hidden
                    border
                    border-gray-700
                    w-full
                    h-full
                    aspect-[9/16]
                    `;

              document.getElementById("remote-users")?.appendChild(player);
            }

            remoteUser.videoTrack?.play(player);

            const oldLabel = player.querySelector(".video-label");

            if (oldLabel) {
              oldLabel.remove();
            }

            const label = document.createElement("div");

            label.className = `
                  video-label
                  absolute
                  bottom-2
                  left-2
                  right-2
                  flex
                  justify-between
                  items-center
                  bg-black/70
                  text-white
                  text-xs
                  px-2
                  py-2
                  rounded-xl
                  z-20
                `;

            const participant = roomData?.participants?.find(
              (u) => Number(u.srno) === Number(remoteUser.uid)
            );

            const viewer = roomData?.viewers?.find(
              (u) => Number(u.srno) === Number(remoteUser.uid)
            );

            const username =
              participant?.name || viewer?.name || `User ${remoteUser.uid}`;

            const isAdmin = Number(roomData?.admin) === Number(myId);

            label.innerHTML = `
                  <div>${username}</div>

                  ${
                    isAdmin
                      ? `
                    <button
                      id="mute-${remoteUser.uid}"
                      class="bg-red-600 px-2 py-1 rounded text-white"
                    >
                      Mute
                    </button>
                  `
                      : ""
                  }
                `;

            player.appendChild(label);

            if (isAdmin) {
              setTimeout(() => {
                const btn = document.getElementById(`mute-${remoteUser.uid}`);

                if (btn) {
                  btn.onclick = () => {
                    const muted = btn.dataset.muted === "1";

                    socket.emit("muteMeetingUser", {
                      userId: remoteUser.uid,
                      mute: !muted,
                    });

                    if (muted) {
                      btn.innerText = "Mute";

                      btn.dataset.muted = "0";
                    } else {
                      btn.innerText = "Unmute";

                      btn.dataset.muted = "1";
                    }
                  };
                }
              }, 500);
            }
          }
        } catch (err) {
          console.log(err);
        }
      });

      // =========================
      // USER LEFT
      // =========================
      rtcClient.on("user-left", (user) => {
        document.getElementById(`user-${user.uid}`)?.remove();
      });

      // =========================
      // JOIN
      // =========================
      await rtcClient.join(APP_ID, String(roomId), null, myId);

      setJoined(true);

      setLoading(false);
    } catch (err) {
      console.log(err);

      setLoading(false);
    } finally {
      joiningRef.current = false;
    }
  };

  // =========================
  // REQUEST JOIN
  // =========================
  /*const requestJoin = () => {
    setRequestPending(true);

    socket.emit("requestJoinMeeting", {
      roomId,
      user,
    });
  };
*/
//not able send join requiest in less 30 coins
const requestJoin = async () => {
  try {
    // minimum 30 coins required
    if (Number(user?.coins || 0) < 30) {
      alert(
        "You need minimum 30 coins to join meeting"
      );
      return;
    }
    setRequestPending(true);
    socket.emit("requestJoinMeeting", {
      roomId,
      user,
    });
  } catch (err) {
    console.log(err);
  }
};
  // =========================
  // SEND COMMENT
  // =========================
  const sendComment = () => {
    if (!message.trim()) {
      return;
    }

    socket.emit("meetingComment", {
      roomId,
      comment: {
        user: user.name,
        text: message,
      },
    });

    setMessage("");
  };

  // =========================
  // APPROVE USER
  // =========================
  const approveUser = (u) => {
    socket.emit("approveMeetingUser", {
      roomId,
      user: u,
    });
  };

  // =========================
  // REJECT USER
  // =========================
  const rejectUser = (u) => {
    socket.emit("rejectMeetingUser", {
      userId: u.srno,
    });
  };

  // =========================
  // REMOVE USER
  // =========================
  const removeUser = (id) => {
    socket.emit("removeMeetingUser", {
      roomId,
      userId: id,
    });
  };

  // =========================
  // TOGGLE MUTE
  // =========================
  const toggleMute = async () => {
    try {
      if (!localTracks?.mic) {
        return;
      }

      const nextMuted = !muted;

      await localTracks.mic.setMuted(nextMuted);

      setMuted(nextMuted);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // TOGGLE VIDEO
  // =========================
  const toggleVideo = async () => {
    try {
      if (!localTracks?.cam) {
        return;
      }

      const next = !videoEnabled;

      await localTracks.cam.setMuted(!next);

      setVideoEnabled(next);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // FLIP CAMERA
  // =========================
  const flipCamera = async () => {
    try {
      const rtcClient = clientRef.current;

      if (!rtcClient) {
        return;
      }

      if (!localTracks?.cam) {
        return;
      }

      const nextFacing = cameraFacing === "user" ? "environment" : "user";

      const newCam = await AgoraRTC.createCameraVideoTrack({
        facingMode: nextFacing,
      });

      await rtcClient.unpublish([localTracks.cam]);

      localTracks.cam.stop();

      localTracks.cam.close();

      await rtcClient.publish([newCam]);

      if (!videoEnabled) {
        await newCam.setMuted(true);
      }

      if (localRef.current) {
        newCam.play(localRef.current);
      }

      setLocalTracks((prev) => ({
        ...prev,
        cam: newCam,
      }));

      setCameraFacing(nextFacing);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // CLEANUP
  // =========================
  const cleanupMeeting = async () => {
    try {
//billing stop
if (billingIntervalRef.current) {
  clearInterval(billingIntervalRef.current);

  billingIntervalRef.current = null;
}

      if (cleanupRef.current) {
        return;
      }

      cleanupRef.current = true;
      socket.emit("leaveMeeting", {
        roomId,
        userId: myId,
      });
      if (localTracks?.mic) {
        localTracks.mic.stop();

        localTracks.mic.close();
      }

      if (localTracks?.cam) {
        localTracks.cam.stop();

        localTracks.cam.close();
      }

      if (clientRef.current) {
        try {
          await clientRef.current.unpublish();
        } catch {}

        await clientRef.current.leave();

        clientRef.current.removeAllListeners();
      }

      clientRef.current = null;

      setJoined(false);

      document.getElementById("remote-users")?.replaceChildren();
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // UNMOUNT
  // =========================
  useEffect(() => {
    return () => {
      cleanupMeeting();
    };
  }, []);

  // =========================
  // END MEETING
  // =========================
  const endMeeting = () => {
    if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
      }
    socket.emit("endMeetingRoom", {
      roomId,
    });
  };

  // =========================
  // GRID
  // =========================
  const totalVideos =
    (roomData?.participants?.length || 0) + (approved ? 1 : 0);

  let gridClass = "grid-cols-2";

  if (totalVideos <= 2) {
    gridClass = "grid-cols-1";
  } else if (totalVideos <= 4) {
    gridClass = "grid-cols-2";
  } else if (totalVideos <= 6) {
    gridClass = "grid-cols-2 md:grid-cols-3";
  } else {
    gridClass = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  }

  return (
    <div className="min-h-screen bg-black text-white p-3 pb-24">
      {/* LOADER */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-xl animate-pulse">Connecting...</div>
        </div>
      )}

      {/* TOP */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-2xl font-bold">Meeting Room</div>

          <div className="text-gray-400">Room: {roomId}</div>

          <div className="text-green-400">👁 {viewerCount} users</div>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);

            alert("Link copied");
          }}
          className="bg-blue-500 px-4 py-2 rounded-xl"
        >
          Copy Link
        </button>
      </div>

      {/* REQUEST BUTTON */}
      {!approved && (
        <button
          onClick={requestJoin}
          disabled={requestPending}
          className="bg-green-500 px-4 py-2 rounded-xl"
        >
          {requestPending ? "Waiting Approval..." : "Request To Join"}
        </button>
      )}

      {/* CONTROLS */}
      {approved && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={toggleMute}
            className="bg-yellow-500 px-4 py-2 rounded-xl"
          >
            {muted ? "Unmute" : "Mute"}
          </button>

          <button
            onClick={toggleVideo}
            className="bg-purple-500 px-4 py-2 rounded-xl"
          >
            {videoEnabled ? "Hide Video" : "Show Video"}
          </button>

          <button
            onClick={flipCamera}
            className="bg-blue-500 px-4 py-2 rounded-xl"
          >
            Flip Camera
          </button>
        </div>
      )}

      {/* LOCAL VIDEO */}
      {approved && (
        <div className="mb-4">
          <div
            className="
              relative
              w-full
              bg-gray-900
              rounded-2xl
              overflow-hidden
              border
              border-gray-700
            "
            style={{
              height: totalVideos <= 2 ? "40vh" : "30vh",
            }}
          >
            <div ref={localRef} className="w-full h-full" />

            <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1 rounded-xl text-xs z-20">
              {user?.name} (You)
            </div>
          </div>
        </div>
      )}

      {/* REMOTE USERS */}
      {/* <div
        id="remote-users"
        className={`
          mt-4
          grid
          gap-3
          ${gridClass}
        `}
        style={{
          gridAutoRows:
            totalVideos <= 2
              ? "40vh"
              : totalVideos <= 4
              ? "30vh"
              : "22vh",
        }}
      /> */}
      <div
        id="remote-users"
        className="
    mt-4
    grid
    grid-cols-2
    md:grid-cols-3
    lg:grid-cols-4
    gap-3
  "
        style={{
          gridAutoRows: "28vh",
        }}
      />

      {/* ADMIN PANEL */}
      {Number(roomData?.admin) === Number(myId) && (
        <div className="mt-6 bg-gray-900 p-4 rounded-2xl">
          <div className="sticky top-0 z-40 bg-gray-900 py-2 flex justify-between items-center">
            <div className="font-bold text-yellow-400 text-lg">
              Join Requests
            </div>

            {roomData?.requests?.length > 0 && (
              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                {roomData.requests.length} New
              </div>
            )}
          </div>

          {roomData?.requests?.map((u) => (
            <div
              key={u.srno}
              className="flex justify-between items-center mb-3 bg-gray-800 p-3 rounded-xl"
            >
              <div>{u.name}</div>

              <div className="flex gap-2">
                <button
                  onClick={() => approveUser(u)}
                  className="bg-green-500 px-3 py-1 rounded-lg"
                >
                  Approve
                </button>

                <button
                  onClick={() => rejectUser(u)}
                  className="bg-red-500 px-3 py-1 rounded-lg"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          <div className="font-bold mt-6 mb-3">Participants</div>

          {roomData?.participants?.map((u) => (
            <div
              key={u.srno}
              className="flex justify-between items-center mb-3 bg-gray-800 p-3 rounded-xl"
            >
              <div>{u.name}</div>

              <button
                onClick={() => removeUser(u.srno)}
                className="bg-red-600 px-3 py-1 rounded-lg"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            onClick={endMeeting}
            className="bg-red-700 mt-6 px-4 py-2 rounded-xl"
          >
            End Meeting
          </button>
        </div>
      )}

      {/* COMMENTS */}
      <div className="mt-6 bg-gray-900 p-4 rounded-2xl">
        <div className="font-bold mb-3 text-center text-xl">Live Comments</div>

        <div className="h-40 overflow-y-auto space-y-2">
          {comments.map((c, i) => (
            <div key={i} className="bg-gray-800 p-2 rounded-xl">
              <b>{c.user}:</b> {c.text}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-gray-800 p-3 rounded-xl outline-none"
            placeholder="Write comment..."
          />

          <button onClick={sendComment} className="bg-blue-500 px-5 rounded-xl">
            Send
          </button>
          {roomData?.admin &&
            joined &&
            Number(myId) !== Number(roomData.admin) && (
              <GiftBar
                myId={myId}
                hostId={roomData.admin}
                roomId={roomId}
                socket={socket}
              />
            )}
        </div>
      </div>
    </div>
  );
}