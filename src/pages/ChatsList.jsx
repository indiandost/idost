import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function ChatsList() {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const myId = user?.srno;

  // =============================
  // LOAD CONVERSATIONS
  // =============================
  useEffect(() => {
    fetch(`${API}/api/conversations/${myId}`)
      .then(res => res.json())
      .then(data => setChats(data));
  }, [myId]);

  // =============================
  // DELETE CHAT
  // =============================
  const deleteChat = (friendId) => {
    if (!window.confirm("Delete this chat?")) return;

    fetch(`${API}/api/chat/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user1: myId,
        user2: friendId
      })
    })
    .then(() => {
      setChats(prev => prev.filter(c => c.userId != friendId));
    });
  };

  return (
    <div className="p-4 text-white  mt-5">

      <h2 className="text-xl mb-4">💬 Chats</h2>

      {chats.length === 0 && (
        <div className="text-gray-400">No chats yet</div>
      )}

      <div className="space-y-3">
        {chats.map((c) => (
          <div
            key={c.userId}
            className="flex items-center justify-between bg-gray-800 p-3 rounded-xl"
          >

            {/* 👤 USER */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/chat/${c.userId}`)}
            >
              <img
                src={c.pic || "/default-user.png"}
                className="w-12 h-12 rounded-full object-cover"
              />

              <div>
                <div className="font-semibold">{c.name}</div>

                <div className="text-sm text-gray-400 truncate w-40">
                  {c.message
                    ? c.message
                    : c.media_url
                    ? "📷 Image"
                    : ""}
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/chat/${c.userId}`)}
                className="bg-blue-500 px-3 py-1 rounded"
              >
                Open
              </button>

              <button
                onClick={() => deleteChat(c.userId)}
                className="bg-red-500 px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}