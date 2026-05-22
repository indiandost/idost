import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import socket from "../socket";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export default function MeetingRoom() {

  const navigate = useNavigate();

  const { roomId } = useParams();

  const user =
    JSON.parse(localStorage.getItem("user"));

  if (!user) {

    navigate("/login");

    return null;

  }

  const myId =
    Number(user?.srno);

  const localRef =
    useRef(null);

  const clientRef =
    useRef(null);

  const joiningRef =
    useRef(false);

  const cleanupRef =
    useRef(false);

  const [joined, setJoined] =
    useState(false);

  const [roomData, setRoomData] =
    useState(null);

  const [comments, setComments] =
    useState([]);

  const [message, setMessage] =
    useState("");

  const [viewerCount, setViewerCount] =
    useState(0);

  const [approved, setApproved] =
    useState(false);

  const [requestPending, setRequestPending] =
    useState(false);

  const [localTracks, setLocalTracks] =
    useState(null);

  const [muted, setMuted] =
    useState(false);

  const [videoEnabled, setVideoEnabled] =
    useState(true);

  const [cameraFacing, setCameraFacing] =
    useState("user");

  const [loading, setLoading] =
    useState(false);

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
  // SOCKET DISCONNECT
  // =========================
  useEffect(() => {

    const handleDisconnect =
      async () => {

        console.log(
          "Socket disconnected"
        );

        await cleanupMeeting();

        alert(
          "Server disconnected"
        );

        navigate("/");

      };

    socket.on(
      "disconnect",
      handleDisconnect
    );

    return () => {

      socket.off(
        "disconnect",
        handleDisconnect
      );

    };

  }, []);

  // =========================
  // START MEETING
  // =========================
  useEffect(() => {

    if (
      roomData &&
      !clientRef.current
    ) {

      startMeeting();

    }

  }, [roomData]);

  // =========================
  // ADMIN AUTO START
  // =========================
  useEffect(() => {

    const startAdmin =
      async () => {

        try {

          if (!joined) return;

          if (!roomData) return;

          if (!clientRef.current) return;

          if (
            Number(roomData.admin) !==
            Number(myId)
          ) {
            return;
          }

          if (
            localTracks?.cam ||
            localTracks?.mic
          ) {
            return;
          }

          const mic =
            await AgoraRTC.createMicrophoneAudioTrack();

          const cam =
            await AgoraRTC.createCameraVideoTrack({
              facingMode:
                cameraFacing,
            });

          await clientRef.current.publish([
            mic,
            cam,
          ]);

          setLocalTracks({
            mic,
            cam,
          });

          setApproved(true);

          await new Promise(
            (r) =>
              setTimeout(r, 500)
          );

          if (
            localRef.current
          ) {

            cam.play(
              localRef.current
            );

          }

          console.log(
            "ADMIN PUBLISHED"
          );

        } catch (err) {

          console.log(
            "ADMIN PUBLISH ERROR:",
            err
          );

        }

      };

    startAdmin();

  }, [joined, roomData]);

  // =========================
  // USER APPROVED
  // =========================
  useEffect(() => {

    socket.on(
      `meetingApproved-${myId}`,
      async () => {

        try {

          if (!joined) {

            console.log(
              "Not joined yet"
            );

            return;

          }

          if (
            !clientRef.current
          ) {
            return;
          }

          if (
            localTracks?.mic ||
            localTracks?.cam
          ) {
            return;
          }

          setApproved(true);

          setRequestPending(
            false
          );

          const mic =
            await AgoraRTC.createMicrophoneAudioTrack();

          const cam =
            await AgoraRTC.createCameraVideoTrack({
              facingMode:
                cameraFacing,
            });

          await clientRef.current.publish([
            mic,
            cam,
          ]);

          setLocalTracks({
            mic,
            cam,
          });

          await new Promise(
            (r) =>
              setTimeout(r, 500)
          );

          if (
            localRef.current
          ) {

            cam.play(
              localRef.current
            );

          }

          console.log(
            "USER APPROVED + PUBLISHED"
          );

        } catch (err) {

          console.log(
            "APPROVAL ERROR:",
            err
          );

        }

      }
    );

    return () => {

      socket.off(
        `meetingApproved-${myId}`
      );

    };

  }, [
    joined,
    localTracks,
    cameraFacing
  ]);

  // =========================
  // START AGORA
  // =========================
  const startMeeting =
    async () => {

      try {

        if (
          joiningRef.current
        ) {
          return;
        }

        joiningRef.current =
          true;

        setLoading(true);

        const rtcClient =
          AgoraRTC.createClient({
            mode: "rtc",
            codec: "vp8",
          });

        clientRef.current =
          rtcClient;

        // =========================
        // CONNECTION
        // =========================
rtcClient.on(
  "connection-state-change",
  async (curState, prevState, reason) => {

    console.log(
      "AGORA STATE:",
      prevState,
      "->",
      curState,
      reason
    );

    // only FAILED should end meeting
    if (curState === "FAILED") {

      console.log(
        "Agora connection failed"
      );

      // wait 5 sec before closing
      setTimeout(async () => {

        // still failed?
        if (
          clientRef.current &&
          clientRef.current
            .connectionState ===
            "FAILED"
        ) {

          try {

            await cleanupMeeting();

          } catch (err) {

            console.log(err);

          }

          alert(
            "Connection lost"
          );

          navigate("/");

        }

      }, 5000);

    }

    // TEMPORARY DISCONNECT
    if (
      curState ===
      "DISCONNECTED"
    ) {

      console.log(
        "Temporary network issue..."
      );

    }

    // RECONNECTED
    if (
      curState ===
      "CONNECTED"
    ) {

      console.log(
        "Agora connected"
      );

    }

  }
);

        // =========================
        // USER PUBLISHED
        // =========================
        rtcClient.on(
          "user-published",
          async (
            remoteUser,
            mediaType
          ) => {

            try {

              console.log(
                "REMOTE USER:",
                remoteUser.uid,
                mediaType
              );

              await rtcClient.subscribe(
                remoteUser,
                mediaType
              );

              // AUDIO
              if (
                mediaType ===
                "audio"
              ) {

                remoteUser.audioTrack?.play();

                console.log(
                  "AUDIO PLAYING:",
                  remoteUser.uid
                );

              }

              // VIDEO
              if (
                mediaType ===
                "video"
              ) {

                let player =
                  document.getElementById(
                    `user-${remoteUser.uid}`
                  );

                if (!player) {

                  player =
                    document.createElement(
                      "div"
                    );

                  player.id =
                    `user-${remoteUser.uid}`;

                  player.className = `
                    relative
                    w-full
                    h-[250px]
                    bg-black
                    rounded-2xl
                    overflow-hidden
                    border
                    border-gray-700
                  `;

                  document
                    .getElementById(
                      "remote-users"
                    )
                    ?.appendChild(
                      player
                    );

                }

                remoteUser.videoTrack?.play(
                  player
                );

                // LABEL
                const oldLabel =
                  player.querySelector(
                    ".video-label"
                  );

                if (
                  oldLabel
                ) {
                  oldLabel.remove();
                }

                const label =
                  document.createElement(
                    "div"
                  );

                label.className = `
                  video-label
                  absolute
                  bottom-2
                  left-2
                  bg-black/70
                  text-white
                  text-xs
                  px-2
                  py-1
                  rounded-lg
                  z-20
                `;

                const participant =
                  roomData?.participants?.find(
                    (u) =>
                      Number(
                        u.srno
                      ) ===
                      Number(
                        remoteUser.uid
                      )
                  );

                const viewer =
                  roomData?.viewers?.find(
                    (u) =>
                      Number(
                        u.srno
                      ) ===
                      Number(
                        remoteUser.uid
                      )
                  );

                label.innerText =
                  participant?.name ||
                  viewer?.name ||
                  `User ${remoteUser.uid}`;

                player.appendChild(
                  label
                );

                console.log(
                  "VIDEO PLAYING:",
                  remoteUser.uid
                );

              }

            } catch (err) {

              console.log(
                "SUBSCRIBE ERROR:",
                err
              );

            }

          }
        );

        // =========================
        // USER LEFT
        // =========================
        rtcClient.on(
          "user-left",
          (user) => {

            document
              .getElementById(
                `user-${user.uid}`
              )
              ?.remove();

          }
        );

        // =========================
        // USER UNPUBLISHED
        // =========================
        rtcClient.on(
          "user-unpublished",
          (
            user,
            mediaType
          ) => {

            console.log(
              "USER UNPUBLISHED:",
              user.uid,
              mediaType
            );

          }
        );

        // =========================
        // JOIN
        // =========================
        await rtcClient.join(
          APP_ID,
          String(roomId),
          null,
          myId
        );

        setJoined(true);

        console.log(
          "JOINED CHANNEL"
        );

        setLoading(false);

      } catch (err) {

        console.log(
          "AGORA START ERROR:",
          err
        );

        setLoading(false);

      } finally {

        joiningRef.current =
          false;

      }

    };

  // =========================
  // REQUEST JOIN
  // =========================
  const requestJoin =
    () => {

      setRequestPending(
        true
      );

      socket.emit(
        "requestJoinMeeting",
        {
          roomId,
          user,
        }
      );

    };

  // =========================
  // SEND COMMENT
  // =========================
  const sendComment =
    () => {

      if (
        !message.trim()
      ) {
        return;
      }

      socket.emit(
        "meetingComment",
        {
          roomId,
          comment: {
            user:
              user.name,
            text:
              message,
          },
        }
      );

      setMessage("");

    };

  // =========================
  // APPROVE USER
  // =========================
  const approveUser =
    (u) => {

      socket.emit(
        "approveMeetingUser",
        {
          roomId,
          user: u,
        }
      );

    };

  // =========================
  // REJECT USER
  // =========================
  const rejectUser =
    (u) => {

      socket.emit(
        "rejectMeetingUser",
        {
          userId:
            u.srno,
        }
      );

    };

  // =========================
  // REMOVE USER
  // =========================
  const removeUser =
    (id) => {

      socket.emit(
        "removeMeetingUser",
        {
          roomId,
          userId: id,
        }
      );

    };

  // =========================
  // TOGGLE MUTE
  // =========================
  const toggleMute =
    async () => {

      try {

        if (
          !localTracks?.mic
        ) {
          return;
        }

        const nextMuted =
          !muted;

        await localTracks.mic.setMuted(
          nextMuted
        );

        setMuted(
          nextMuted
        );

      } catch (err) {

        console.log(
          err
        );

      }

    };

  // =========================
  // TOGGLE VIDEO
  // =========================
  const toggleVideo =
    async () => {

      try {

        if (
          !localTracks?.cam
        ) {
          return;
        }

        const next =
          !videoEnabled;

        await localTracks.cam.setMuted(
          !next
        );

        setVideoEnabled(
          next
        );

        console.log(
          next
            ? "VIDEO ON"
            : "VIDEO OFF"
        );

      } catch (err) {

        console.log(
          err
        );

      }

    };

  // =========================
  // FLIP CAMERA
  // =========================
  const flipCamera =
    async () => {

      try {

        const rtcClient =
          clientRef.current;

        if (
          !rtcClient
        ) {
          return;
        }

        if (
          !localTracks?.cam
        ) {
          return;
        }

        const nextFacing =
          cameraFacing ===
          "user"
            ? "environment"
            : "user";

        const newCam =
          await AgoraRTC.createCameraVideoTrack(
            {
              facingMode:
                nextFacing,
            }
          );

        await rtcClient.unpublish([
          localTracks.cam,
        ]);

        localTracks.cam.stop();

        localTracks.cam.close();

        await rtcClient.publish([
          newCam,
        ]);

        if (
          !videoEnabled
        ) {

          await newCam.setMuted(
            true
          );

        }

        if (
          localRef.current
        ) {

          newCam.play(
            localRef.current
          );

        }

        setLocalTracks(
          (prev) => ({
            ...prev,
            cam: newCam,
          })
        );

        setCameraFacing(
          nextFacing
        );

        console.log(
          "CAMERA FLIPPED"
        );

      } catch (err) {

        console.log(
          "FLIP ERROR:",
          err
        );

      }

    };

  // =========================
  // CLEANUP
  // =========================
  const cleanupMeeting =
    async () => {

      try {

        if (
          cleanupRef.current
        ) {
          return;
        }

        cleanupRef.current =
          true;

        if (
          localTracks?.mic
        ) {

          localTracks.mic.stop();

          localTracks.mic.close();

        }

        if (
          localTracks?.cam
        ) {

          localTracks.cam.stop();

          localTracks.cam.close();

        }

        if (
          clientRef.current
        ) {

          try {

            await clientRef.current.unpublish();

          } catch {}

          await clientRef.current.leave();

          clientRef.current.removeAllListeners();

        }

        clientRef.current =
          null;

        setJoined(false);

        document
          .getElementById(
            "remote-users"
          )
          ?.replaceChildren();

      } catch (err) {

        console.log(
          err
        );

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
  const endMeeting =
    () => {

      socket.emit(
        "endMeetingRoom",
        {
          roomId,
        }
      );

    };

  // =========================
  // GRID LAYOUT
  // =========================
  const totalVideos =
    (
      roomData?.participants
        ?.length || 0
    ) +
    (
      approved ? 1 : 0
    );

  let gridClass =
    "grid-cols-1";

  if (
    totalVideos === 2
  ) {

    gridClass =
      "grid-cols-2";

  } else if (
    totalVideos <= 4
  ) {

    gridClass =
      "grid-cols-2";

  } else if (
    totalVideos <= 6
  ) {

    gridClass =
      "grid-cols-2 lg:grid-cols-3";

  } else {

    gridClass =
      "grid-cols-2 md:grid-cols-3 xl:grid-cols-4";

  }

  return (

    <div className="min-h-screen bg-black text-white p-4">

      {/* LOADER */}
      {loading && (

        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">

          <div className="text-xl animate-pulse">
            Connecting...
          </div>

        </div>

      )}

      {/* TOP */}
      <div className="flex justify-between items-center mb-5">

        <div>

          <div className="text-2xl font-bold">
            Meeting Room
          </div>

          <div className="text-gray-400">
            Room: {roomId}
          </div>

          <div className="text-green-400">
            👁 {viewerCount} users
          </div>

        </div>

        <button
          onClick={() => {

            navigator.clipboard.writeText(
              window.location.href
            );

            alert(
              "Link copied"
            );

          }}
          className="bg-blue-500 px-4 py-2 rounded"
        >
          Copy Link
        </button>

      </div>

      {/* REQUEST BUTTON */}
      {!approved && (

        <button
          onClick={requestJoin}
          disabled={
            requestPending
          }
          className="bg-green-500 px-4 py-2 rounded"
        >
          {requestPending
            ? "Waiting Approval..."
            : "Request To Join"}
        </button>

      )}

      {/* CONTROLS */}
      {approved && (

        <div className="flex gap-2 mt-4 mb-4">

          <button
            onClick={toggleMute}
            className="bg-yellow-500 px-4 py-2 rounded"
          >
            {muted
              ? "Unmute"
              : "Mute"}
          </button>

          <button
            onClick={toggleVideo}
            className="bg-purple-500 px-4 py-2 rounded"
          >
            {videoEnabled
              ? "Hide Video"
              : "Show Video"}
          </button>

          <button
            onClick={flipCamera}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            Flip Camera
          </button>

        </div>

      )}

      {/* LOCAL VIDEO */}
      {approved && (

        <div className="relative w-full h-[250px] bg-gray-900 rounded overflow-hidden mb-4">

          <div
            ref={localRef}
            className="w-full h-full"
          />

          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs">
            {user?.name} (You)
          </div>

        </div>

      )}

      {/* REMOTE USERS */}
      <div
        id="remote-users"
        className={`
          mt-4
          grid
          gap-4
          auto-rows-[250px]
          ${gridClass}
        `}
      />

      {/* COMMENTS */}
      <div className="mt-6 bg-gray-900 p-4 rounded">

        <div className="font-bold mb-3">
          Live Comments
        </div>

        <div className="h-40 overflow-y-auto space-y-2">

          {comments.map(
            (c, i) => (

              <div
                key={i}
                className="bg-gray-800 p-2 rounded"
              >
                <b>
                  {c.user}:
                </b>{" "}
                {c.text}
              </div>

            )
          )}

        </div>

        <div className="flex gap-2 mt-3">

          <input
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            className="flex-1 bg-gray-800 p-2 rounded"
            placeholder="Write comment..."
          />

          <button
            onClick={sendComment}
            className="bg-blue-500 px-4 rounded"
          >
            Send
          </button>

        </div>

      </div>

      {/* ADMIN PANEL */}
      {Number(
        roomData?.admin
      ) ===
        Number(myId) && (

        <div className="mt-6 bg-gray-900 p-4 rounded">

          <div className="font-bold mb-4">
            Join Requests
          </div>

          {roomData?.requests?.map(
            (u) => (

              <div
                key={u.srno}
                className="flex justify-between items-center mb-3"
              >

                <div>
                  {u.name}
                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      approveUser(
                        u
                      )
                    }
                    className="bg-green-500 px-3 py-1 rounded"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      rejectUser(
                        u
                      )
                    }
                    className="bg-red-500 px-3 py-1 rounded"
                  >
                    Reject
                  </button>

                </div>

              </div>

            )
          )}

          <div className="font-bold mt-6 mb-3">
            Participants
          </div>

          {roomData?.participants?.map(
            (u) => (

              <div
                key={u.srno}
                className="flex justify-between items-center mb-3"
              >

                <div>
                  {u.name}
                </div>

                <button
                  onClick={() =>
                    removeUser(
                      u.srno
                    )
                  }
                  className="bg-red-600 px-3 py-1 rounded"
                >
                  Remove
                </button>

              </div>

            )
          )}

          <button
            onClick={endMeeting}
            className="bg-red-700 mt-6 px-4 py-2 rounded"
          >
            End Meeting
          </button>

        </div>

      )}

    </div>

  );

}