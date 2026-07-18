/*import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL);
const socket = io("https://192.168.0.102:5000", {
  transports: ["websocket"],
  secure: false
});
export default socket;
*/

// src/socket.js
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
   transports: ["polling", "websocket"], // 🔥 websocket // force polling// try both
   reconnection: true,
   secure: true,
   reconnectionAttempts: 50,
   reconnectionDelay: 1000,
   timeout: 20000,
    auth: {
    token: localStorage.getItem("token"),
  },
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ SOCKET DISCONNECTED", reason);
});

socket.on("connect_error", (err) => {
  console.log("❌ Socket error:", err.message);
});

export default socket;