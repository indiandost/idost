import { useRef, useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import socket from "../socket";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export default function useAgoraCall(friendId) {

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const clientRef = useRef(null);

  const tracksRef = useRef({
    mic: null,
    cam: null,
  });

  const joinedRef = useRef(false);

  const [inCall, setInCall] = useState(false);
  const [calling, setCalling] = useState(false);

  const [callStatus, setCallStatus] =
    useState("");

  const [isMuted, setIsMuted] =
    useState(false);

  const [isCameraOn, setIsCameraOn] =
    useState(true);

  const myId = JSON.parse(
    localStorage.getItem("user")
  )?.srno;

  // =========================
  // CLEANUP
  // =========================
  const cleanupAgora = async () => {

    try {

      const { mic, cam } =
        tracksRef.current;

      if (mic) {
        mic.stop();
        mic.close();
      }

      if (cam) {
        cam.stop();
        cam.close();
      }

      if (clientRef.current) {

        clientRef.current.removeAllListeners();

        await clientRef.current.leave();

        clientRef.current = null;
      }

      tracksRef.current = {
        mic: null,
        cam: null,
      };

      joinedRef.current = false;

      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = "";
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = "";
      }

    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {

    const acceptedHandler = async (
      data
    ) => {

      console.log("✅ ACCEPTED");

      setCalling(false);

     await joinAgora(
  data?.type || "video"
);
    };

    const rejectedHandler = async () => {

      console.log("❌ REJECTED");

      alert("Call Rejected");

      await endCall(false);
    };

    const endedHandler = async () => {

      console.log("📴 CALL ENDED");

      await endCall(false);
    };

    socket.off("callAccepted");
    socket.off("callRejected");
    socket.off("callEnded");

    socket.on(
      "callAccepted",
      acceptedHandler
    );

    socket.on(
      "callRejected",
      rejectedHandler
    );

    socket.on(
      "callEnded",
      endedHandler
    );

    return () => {

      socket.off(
        "callAccepted",
        acceptedHandler
      );

      socket.off(
        "callRejected",
        rejectedHandler
      );

      socket.off(
        "callEnded",
        endedHandler
      );
    };

  }, []);

  // =========================
  // JOIN AGORA
  // =========================
  const joinAgora = async (
    type = "video"
  ) => {

    try {

      if (joinedRef.current) {
        return;
      }

      joinedRef.current = true;

      setInCall(true);
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
      const client =
        AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
        });

      clientRef.current = client;

      const channel =
        [myId, friendId]
          .sort()
          .join("_");

      // =====================
      // REMOTE USER
      // =====================
      client.on(
        "user-published",
        async (user, mediaType) => {

          console.log(
            "REMOTE USER:",
            mediaType
          );

          await client.subscribe(
            user,
            mediaType
          );

          // VIDEO
          if (
            mediaType === "video"
          ) {

            const remoteDiv =
              remoteVideoRef.current;

            console.log(
              "REMOTE DIV:",
              remoteDiv
            );

            if (
              remoteDiv &&
              user.videoTrack
            ) {

              remoteDiv.innerHTML = "";

              user.videoTrack.play(
                remoteDiv
              );

              console.log(
                "REMOTE VIDEO PLAYING"
              );
            }
          }

          // AUDIO
          if (
            mediaType === "audio"
          ) {
        console.log(
            "PLAY REMOTE AUDIO"
          );
            user.audioTrack?.play();
          }

          setCalling(false);
          setCallStatus("Connected");
        }
      );

      client.on(
        "user-left",
        async () => {

          console.log(
            "REMOTE LEFT"
          );

          await endCall(false);
        }
      );

      // =====================
      // JOIN
      // =====================
      await client.join(
        APP_ID,
        channel,
        null,
        Number(myId)
      );

      // =====================
      // MIC
      // =====================
      const mic =
        await AgoraRTC.createMicrophoneAudioTrack();

      // =====================
      // CAMERA
      // =====================
      let cam = null;

      if (type === "video") {

        cam =
          await AgoraRTC.createCameraVideoTrack();
      }

      tracksRef.current = {
        mic,
        cam,
      };

      // =====================
      // PLAY LOCAL
      // =====================
      if (
        cam &&
        localVideoRef.current
      ) {

        console.log(
          "PLAY LOCAL VIDEO"
        );

        localVideoRef.current.innerHTML =
          "";

        cam.play(
          localVideoRef.current
        );
      }

      // =====================
      // PUBLISH
      // =====================
      const tracks =
        [mic, cam].filter(Boolean);

      await client.publish(
        tracks
      );

      console.log(
        "TRACKS PUBLISHED"
      );

      setInCall(true);

    } catch (err) {

      console.log(
        "JOIN ERROR",
        err
      );

      joinedRef.current = false;

      await cleanupAgora();
    }
  };

  // =========================
  // START CALL
  // =========================
  const startCall = async (
    type = "video"
  ) => {

    try {

      if (
        calling ||
        joinedRef.current
      ) {
        return;
      }

      setCalling(true);

      setCallStatus("Calling...");

      // show UI immediately
      setInCall(true);

      socket.emit("callUser", {
        from: myId,
        to: friendId,
        type,
      });

    } catch (err) {

      console.log(err);

      await endCall(false);
    }
  };

  // =========================
  // END CALL
  // =========================
  const endCall = async (
    emit = true
  ) => {

    try {

      if (emit) {

        socket.emit(
          "endCall",
          {
            from: myId,
            to: friendId,
          }
        );
      }

      await cleanupAgora();

      setInCall(false);
      setCalling(false);

      setCallStatus("");

      setIsMuted(false);
      setIsCameraOn(true);

    } catch (err) {

      console.log(err);
    }
  };

  // =========================
  // MUTE
  // =========================
  const toggleMute =
    async () => {

      const { mic } =
        tracksRef.current;

      if (!mic) return;

      const next =
        !isMuted;

      await mic.setEnabled(
        !next
      );

      setIsMuted(next);
    };

  // =========================
  // CAMERA
  // =========================
  const toggleCamera =
    async () => {

      const { cam } =
        tracksRef.current;

      if (!cam) return;

      const next =
        !isCameraOn;

      await cam.setEnabled(
        next
      );

      setIsCameraOn(next);
    };

  // =========================
  // FLIP
  // =========================
  const flipCamera =
    async () => {

      try {

        const { cam } =
          tracksRef.current;

        if (!cam) return;

        const cameras =
          await AgoraRTC.getCameras();

        if (
          cameras.length < 2
        ) return;

        const current =
          cam.getTrackLabel();

        const next =
          cameras.find(
            (c) =>
              !current.includes(
                c.label
              )
          );

        if (next) {

          await cam.setDevice(
            next.deviceId
          );
        }

      } catch (err) {

        console.log(err);
      }
    };

  return {

    localVideoRef,
    remoteVideoRef,

    startCall,
    joinAgora,
    endCall,

    toggleMute,
    toggleCamera,
    flipCamera,

    inCall,
    calling,
    callStatus,

    isMuted,
    isCameraOn,
  };
}