import { useEffect, useState } from "react";
import socket from "../socket";

const API = import.meta.env.VITE_API_URL;

export default function useChatMessages(friendId) {
  const myId = JSON.parse(localStorage.getItem("user"))?.srno;

  const [messages, setMessages] = useState([]);

  // =========================
  // LOAD OLD CHAT
  // =========================
  useEffect(() => {
    if (!friendId || !myId) return;

    const loadChat = async () => {
      try {
        const res = await fetch(`${API}/api/chat/${myId}/${friendId}`);

        const data = await res.json();

        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.log("Chat load error:", err);
      }
    };

    loadChat();
  }, [friendId, myId]);

  // =========================
  // RECEIVE MESSAGE
  // =========================
  useEffect(() => {
    const handler = (data) => {
      setMessages((prev) => {
        const exists = prev.some(
          (m) => m.from === data.from && m.createdAt === data.createdAt
        );

        if (exists) return prev;

        return [...prev, data];
      });
    };

    socket.on("receiveMessage", handler);

    return () => socket.off("receiveMessage", handler);
  }, []);

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = async (text, image = null) => {
    if (!text && !image) return;

    try {
      let imageUrl = null;

      if (image) {
        const formData = new FormData();
        formData.append("image", image);

        const res = await fetch(`${API}/api/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        imageUrl = data.url;
      }

      const msgData = {
        from: Number(myId),
        to: Number(friendId),
        message: text,
        media_url: imageUrl,
        type: imageUrl ? "image" : "text",
        createdAt: new Date().toISOString(),
      };

      socket.emit("sendMessage", msgData);

      setMessages((prev) => [...prev, msgData]);
    } catch (err) {
      console.log("Send error:", err);
    }
  };

  return {
    messages,
    sendMessage,
  };
}