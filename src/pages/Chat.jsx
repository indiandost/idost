import { useEffect, useState } from "react";

import {
  useParams,
  useLocation,
  useNavigate
} from "react-router-dom";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import VideoCall from "../components/chat/VideoCall";
import CallControls from "../components/chat/CallControls";

import useAgoraCall from "../hooks/useAgoraCall";
import useChatMessages from "../hooks/useChatMessages";

import GiftBar from "../components/GiftBar";

import AgoraRTC from "agora-rtc-sdk-ng";

import socket from "../socket";

AgoraRTC.setLogLevel(2);

export default function Chat() {
const navigate = useNavigate();
  const { id: friendId } =
    useParams();

  const location =
    useLocation();

  const myId =
    JSON.parse(
      localStorage.getItem("user")
    )?.srno;

  // =========================
  // MESSAGES
  // =========================
  const {
    messages,
    sendMessage,
  } = useChatMessages(friendId);

  // =========================
  // AGORA
  // =========================
const {
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

} = useAgoraCall(friendId);

//auto remove url query parameters
useEffect(() => {

  const params =
    new URLSearchParams(
      location.search
    );

  const autoStart =
    params.get("autoStart");

  if (autoStart === "true") {

    // remove query after join
    const timer =
      setTimeout(() => {

        navigate(
          `/chat/${friendId}`,
          { replace: true }
        );

      }, 4000);

    return () =>
      clearTimeout(timer);
  }

}, []);

// =========================
  // RECEIVER JOIN ONLY
  // =========================
  useEffect(() => {

  const params =
    new URLSearchParams(
      location.search
    );

  const autoStart =
    params.get("autoStart");

  const type =
    params.get("type");

  if (autoStart === "true") {

    console.log(
      "RECEIVER JOINING AGORA"
    );

    const timer =
      setTimeout(async () => {

        await joinAgora(
          type || "video"
        );

      }, 2500);

    return () =>
      clearTimeout(timer);
  }

}, [location.search]);
  // =========================
  // GIFT TOAST
  // =========================
  const [giftToast, setGiftToast] =
    useState(null);

  useEffect(() => {

    const handleGift =
      (data) => {

        console.log(
          "🎁 Gift received:",
          data
        );

        setGiftToast(data);

        setTimeout(() => {

          setGiftToast(null);

        }, 2500);
      };

    socket.on(
      "giftReceived",
      handleGift
    );

    return () => {

      socket.off(
        "giftReceived",
        handleGift
      );
    };

  }, []);

  // =========================
  // UI
  // =========================
  return (

    <div className="
      flex flex-col
      h-screen
      bg-black
      text-white
      overflow-hidden
    ">

      {/* HEADER    flex flex-col
      h-screen
      bg-black
      text-white
      overflow-hidden*/}
      <ChatHeader

        onAudioCall={() =>
          startCall("audio")
        }

        onVideoCall={() =>
          startCall("video")
        }

      />

      {/* VIDEO */}
      <VideoCall

        localVideoRef={
          localVideoRef
        }

        remoteVideoRef={
          remoteVideoRef
        }

        inCall={inCall}

        calling={calling}

        callStatus={
          callStatus
        }

        onEnd={endCall}

      />

      {/* MESSAGES */}
      <MessageList className="pt-[130px]"
        messages={messages}
        myId={myId}
      />

      {/* INPUT */}
      <ChatInput
        onSend={sendMessage}
      />

      {/* GIFT BAR */}
      <div className="mt-3">

        <GiftBar

          myId={myId}

          hostId={friendId}

          roomId={
            [myId, friendId]
              .sort()
              .join("_")
          }

          socket={socket}

        />

      </div>

      {/* CONTROLS */}
      {(inCall || calling) && (

        <CallControls

          isMuted={isMuted}

          isCameraOn={
            isCameraOn
          }

          onMute={toggleMute}

          onCamera={
            toggleCamera
          }

          onFlip={flipCamera}

          onEnd={endCall}

        />

      )}

    </div>
  );
}