import { useEffect, useState } from "react";
import socket from "../socket";

const API = import.meta.env.VITE_API_URL;

export default function useChatMessages(friendId) {
  const myId = JSON.parse(localStorage.getItem("user"))?.srno;
  const token = localStorage.getItem("token");

  const [messages, setMessages] = useState([]);

  // =========================
  // LOAD OLD CHAT
  // =========================
  useEffect(() => {
    if (!friendId || !myId) return;
    const loadChat = async () => {
      try {
        const res = await fetch(`${API}/api/chat/${myId}/${friendId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
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

  //mark read 
useEffect(() => {
  const markMessagesAsRead = async () => {
    try {
      const response = await fetch(`${API}/api/chat/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          myId,
          friendId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  if (myId && friendId) {
    markMessagesAsRead();
  }
}, [friendId, myId, token]);

  // =========================
  // RECEIVE MESSAGE
  // =========================
  /*useEffect(() => {
    const handler = (data) => {
      console.log(
    "📩 RECEIVED",
    data,
    "Current Friend:",
    friendId
  );
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
  */
 useEffect(() => {
  const handler = (data) => {
      console.log(
    "📩 RECEIVED",
    data,
    "Current Friend:",
    friendId
  );
    // current chat ka hi message add karo
    const isCurrentChat =
      Number(data.from) === Number(friendId) ||
      Number(data.to) === Number(friendId);

    if (!isCurrentChat) return;

    setMessages((prev) => {

      if (
        data.id &&
        prev.some((m) => m.id === data.id)
      ) {
        return prev;
      }

      return [...prev, data];
    });
  };

  socket.on("receiveMessage", handler);

  return () => {
    socket.off("receiveMessage", handler);
  };
 }, [friendId]);

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

  try {

    console.log("UPLOAD URL =", `${API}/api/upload`);
    console.log("TOKEN =", token);

    const res = await fetch(`${API}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    console.log("STATUS =", res.status);

    const text = await res.text();

    console.log("RAW RESPONSE =", text);
/*
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status}`);
    }
*/
    const data = JSON.parse(text);

    imageUrl = data.url;

  } catch (err) {

    console.error("UPLOAD ERROR =", err);

    alert(err.message);
  }
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