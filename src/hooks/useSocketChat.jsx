import { useEffect } from "react";
import socket from "../socket";

export default function useSocketChat({
  onReceiveMessage,
  onCallAccepted,
  onCallRejected,
  onCallEnded,
}) {
  useEffect(() => {
    if (onReceiveMessage) {
      socket.on("receiveMessage", onReceiveMessage);
    }

    if (onCallAccepted) {
      socket.on("callAccepted", onCallAccepted);
    }

    if (onCallRejected) {
      socket.on("callRejected", onCallRejected);
    }

    if (onCallEnded) {
      socket.on("callEnded", onCallEnded);
    }

    return () => {
      if (onReceiveMessage) {
        socket.off("receiveMessage", onReceiveMessage);
      }

      if (onCallAccepted) {
        socket.off("callAccepted", onCallAccepted);
      }

      if (onCallRejected) {
        socket.off("callRejected", onCallRejected);
      }

      if (onCallEnded) {
        socket.off("callEnded", onCallEnded);
      }
    };
  }, []);
}