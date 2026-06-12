import { useEffect, useState, useRef  } from "react";

import { useParams, useLocation, useNavigate } from "react-router-dom";
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
  const { id: friendId } = useParams();
const isConnectedRef = useRef(false);
  const location = useLocation();
const { callStartRef } = useAgoraCall(friendId);
  const myId = JSON.parse(localStorage.getItem("user"))?.srno;
  const token = localStorage.getItem("token"); 
    const callTypeRef = useRef("audio");
  const billingIntervalRef = useRef(null);
  const isCallerRef = useRef(false);  //for only caller's coins reduce
  // =========================
  // MESSAGES
  // =========================
  const { messages, sendMessage } = useChatMessages(friendId);

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
    const params = new URLSearchParams(location.search);

    const autoStart = params.get("autoStart");

    if (autoStart === "true") {
      // remove query after join
      const timer = setTimeout(() => {
        navigate(`/chat/${friendId}`, { replace: true });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, []);
  // =========================
  // RECEIVER JOIN ONLY
  // =========================
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const autoStart = params.get("autoStart");

    const type = params.get("type");

    if (autoStart === "true") {
      console.log("RECEIVER JOINING AGORA");

      const timer = setTimeout(async () => {
        await joinAgora(type || "video");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [location.search]);
  // =========================
  // GIFT TOAST
  // =========================
  const [giftToast, setGiftToast] = useState(null);

  useEffect(() => {
    const handleGift = (data) => {
      console.log("🎁 Gift received:", data);

      setGiftToast(data);

      setTimeout(() => {
        setGiftToast(null);
      }, 2500);
    };

    socket.on("giftReceived", handleGift);

    return () => {
      socket.off("giftReceived", handleGift);
    };
  }, []);

//billing effect
useEffect(() => {
  if (inCall && isCallerRef.current) {
    console.log("📞 Call active → start billing");

    startCallBilling();
  } else {
    console.log("⛔ Stop billing");

    if (billingIntervalRef.current) {
      clearInterval(billingIntervalRef.current);
      billingIntervalRef.current = null;
    }
  }

  return () => {
    if (billingIntervalRef.current) {
      clearInterval(billingIntervalRef.current);
      billingIntervalRef.current = null;
    }
  };
}, [inCall]);

//reset start time
useEffect(() => {
  if (!inCall && !calling) {
    callStartRef.current = null;
  }
}, [inCall, calling]);

//endcall new function
const handleEndCall = async () => {
    const duration = callStartRef.current
      ? Math.floor((Date.now() - callStartRef.current) / 1000)
      : 0;
  console.log(`call ending save duration ${duration}s`);
  callStartRef.current = null; // IMPORTANT RESET
  // save call message
  socket.emit("sendMessage", {
    from: Number(myId),
    to: Number(friendId),
    message: `${callTypeRef.current} call duration ${duration}s`,
    type: "call_accepted",
    createdAt: new Date().toISOString(),
  });
  //for call billing stop
  if (billingIntervalRef.current) {
    clearInterval(billingIntervalRef.current);
    billingIntervalRef.current = null;
  }
  // original agora cleanup
  await endCall();
};

//call limitation 
const startCallBilling = () => {
  // prevent duplicate interval
   callStartRef.current = Date.now();
  if (billingIntervalRef.current) {
    clearInterval(billingIntervalRef.current);
  }
  billingIntervalRef.current = setInterval(async () => {
    try {
      console.log("💰 deducting call coins...");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/call/add-time`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: myId,
            seconds: 8,
          }),
        }
      );
      const data = await res.json();
      console.log("CALL BILLING:", data);
      // ❌ LIMIT REACHED
      if (!data.success) {
        alert(data.message);
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
        socket.emit("endCall", {
          from: myId,
          to: friendId,
        });
        await endCall();
        navigate("/chats");
        return;
      }
      // optional live coin update
     /* socket.emit("coinUpdateRequest", {
        userId: myId,
      });*/
    } catch (err) {
      console.log("Billing error:", err);
    }
  }, 8000);
};

  // =========================
  // UI
  // =========================
  return (
    <> <Helmet>
        <title>IndianDost Chat - Chat With Friend</title>
        <meta
          name="description"
          content="Connect and chat with nearby members, chat online friends, chat in real time at IndianDost, Idost."
        />
        </Helmet>
    <div
      className="
      flex flex-col
      h-screen
      bg-black
      text-white
      overflow-hidden
    "
    >
      {/* HEADER    flex flex-col
      h-screen
      bg-black
      text-white
      overflow-hidden*/}
      <ChatHeader
        token={token}
         onAudioCall={() => {
          callStartRef.current = Date.now();
          callTypeRef.current = "audio";
          isCallerRef.current = true;
          startCall("audio");
        }}
        onVideoCall={() => {
          callTypeRef.current = "video";
          isCallerRef.current = true;
          startCall("video");
        }}
      />

      {/* VIDEO */}
      <VideoCall
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        inCall={inCall}
        calling={calling}
        callStatus={callStatus}
       onEnd={handleEndCall}
      />

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto pt-[130px]">
      <MessageList  messages={messages} myId={myId} />
    </div>
      {/* INPUT */}
      <ChatInput onSend={sendMessage} />

      {/* GIFT BAR */}
      <div className="mt-3">
        <GiftBar
          myId={myId}
          hostId={friendId}
          roomId={[myId, friendId].sort().join("_")}
          socket={socket}
        />
      </div>

      {/* CONTROLS */}
      {(inCall || calling) && (
        <CallControls
          isMuted={isMuted}
          isCameraOn={isCameraOn}
          onMute={toggleMute}
          onCamera={toggleCamera}
          onFlip={flipCamera}
          onEnd={handleEndCall}
        />
      )}
    </div>
    </>
  );
}