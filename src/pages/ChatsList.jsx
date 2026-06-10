import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function ChatsList() {

  const [chats, setChats] = useState([]);

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const myId = user?.srno;

  const token = localStorage.getItem("token");

  // =============================
  // LOAD CONVERSATIONS
  // =============================
  useEffect(() => {

    if (!myId || !token) return;

    const loadChats = async () => {

      try {

        const res = await fetch(
          `${API}/api/conversations/${myId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        setChats(Array.isArray(data) ? data : []);

      } catch (err) {

        console.log("Chats error:", err);

        setChats([]);

      }

    };

    loadChats();

  }, [myId, token]);

  // =============================
  // DELETE CHAT
  // =============================
  const deleteChat = async (friendId) => {

    if (!window.confirm("Delete this chat?")) return;

    try {

      await fetch(`${API}/api/chat/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user1: myId,
          user2: friendId,
        }),
      });

      setChats((prev) =>
        prev.filter((c) => c.userId !== friendId)
      );

    } catch (err) {

      console.log("Delete error:", err);

    }

  };

  return (

    <div className="p-4 text-white mt-5">

      <h2 className="text-xl mb-4">
        💬 Chats
      </h2>

      {chats.length === 0 && (
        <div className="text-gray-400">
          No chats yet
        </div>
      )}

      <div className="space-y-3">

        {chats.map((c) => (

          <div
            key={c.userId}
            className="
              flex items-center justify-between
              bg-gray-800 p-3 rounded-xl
            "
          >

            {/* USER */}
            <div
              className="
                flex items-center gap-3
                cursor-pointer flex-1
              "
              onClick={() =>
                  navigate(`/profile/${c.userId}`)
                }
            >

              <img
                src={c.pic || "/default-user.png"}
                alt=""
                className="
                  w-12 h-12 rounded-full
                  object-cover
                "
              />

              <div className="overflow-hidden"  onClick={() =>
                  navigate(`/profile/${c.userId}`)
                }>

                <div className="font-semibold">
                  {c.name}
                    {c.unreadCount > 0 && (
                  <span
                    className="
                      bg-green-500
                      text-white
                      text-xs
                      min-w-[20px]
                      h-5
                      px-1
                      rounded-full
                      flex
                      items-center
                      justify-center
                    "
                  >
                    {c.unreadCount}
                  </span>
                )}
                </div>

                <div
                  className="
                    text-sm text-gray-400
                    truncate w-40
                  "
                >
                  {c.message
                    ? c.message
                    : c.media_url
                    ? "📷 Image"
                    : ""}
                </div>

              </div>

            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 ml-2">

              <button
                onClick={() =>
                  navigate(`/chat/${c.userId}`)
                }
                className="
                  bg-blue-500 px-3 py-1 rounded
                "
              >
                Open
              </button>

              <button
                onClick={() =>
                  deleteChat(c.userId)
                }
                className="
                  bg-red-500 px-3 py-1 rounded
                "
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