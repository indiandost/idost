
import { useEffect, useRef, useState } from "react";

import socket from "../socket";

export default function ChatBox({
  roomId,
  messages,
}) {

  const [message, setMessage] =  useState("");
  const [showChat, setShowChat] = useState(true);
  const [unread, setUnread] = useState(0);

  const chatEndRef = useRef(null);

  const user = JSON.parse(
    localStorage.getItem("user")
  );
  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
  if (!showChat && messages.length > 0) {
    setUnread(prev => prev + 1);
  }
}, [messages]);
 // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit(
      "color:send_message",
      {
        roomId,
        userId: user?.srno,
        name:
          user?.name ||
          "Player",
        message:
          message.trim(),
      }
    );
    setMessage("");
  };
  // =========================
  // ENTER KEY SEND
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };
  const openChat = () => {
  setShowChat(true);
  setUnread(0);
};
  return (<>
    {!showChat && (
  <button
    onClick={openChat}
className="
fixed
bottom-24
right-4
z-[99999]
w-14
h-14
rounded-full
bg-blue-600
shadow-2xl
text-2xl
flex
items-center
justify-center
animate-bounce
"
  >
    💬

    {unread > 0 && (
      <span
        className="
          absolute
          -top-1
          -right-1
          min-w-5
          h-5
          px-1
          rounded-full
          bg-red-600
          text-[10px]
          font-bold
          flex
          items-center
          justify-center
        "
      >
        {unread > 99 ? "99+" : unread}
      </span>
    )}
  </button>
)}
   {showChat && (
    
<div
className="
fixed
top-32
right-3
z-[9999]
w-72
rounded-2xl
bg-black/10
border
border-white/10
shadow-lg
overflow-hidden
"
>
  <button
onClick={() => setShowChat(false)}
className="
absolute
top-2
right-2
z-50
w-7
h-7
rounded-full
bg-black/50
hover:bg-red-500
text-white
text-sm
"
>
✕
</button>
 <div className="
          text-sm
          text-zinc-400
        ">

          {messages.length}
          {" "}
          msgs
      </div>

      {/* CHAT AREA */}
<style>{`
.chat-scroll::-webkit-scrollbar{
  display:none;
}
`}</style>
<div
  className="
    chat-scroll
    h-[250px]
    overflow-y-auto
    px-2
    py-2
    space-y-1
    bg-transparent
  "
  style={{
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  }}
>
       {messages.length === 0 && (

          <div className="
            h-full
            flex
            items-center
            justify-center
            text-zinc-500
            text-center
          ">
            No chats yet 👀
          </div>
        )}
        {messages.map((msg, index) => {
          const isMe =
            msg.userId ===
            user?.srno;
          return (
            <div
              key={
                msg.id ||
                index
              }
              className={`
                flex
                ${isMe
                  ? "justify-end"
                  : "justify-start"
                }
              `}
            >
              <div
                className={`
                  max-w-[88%]
      px-2.5
      py-1.5
      rounded-xl
      backdrop-blur-md
      text-xs
      break-words 
                  ${
                    isMe
                      ? `
                        bg-blue-500/70
                        text-white
                      `
                      : `
                        bg-black/35
                        text-white
                      `
                  }
                `}
              >
                {/* NAME */}
                <div className={`
                    text-[10px]
                  font-semibold
                  mb-0.5
                  ${
                    isMe
                      ? "text-blue-100"
                      : "text-green-300"
                  }
                `}>
                  {isMe
                    ? "You"
                    : msg.name
                  }
                </div>
                {/* MESSAGE */}
                <div className="
                  leading-4
                ">
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      {/* INPUT */}
      <div className="
    border-t
    border-white/10
    bg-black/15
    backdrop-blur-md
    p-2
      ">
        <div className="
          flex
          items-center
          gap-2
        ">
          <input
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            maxLength={120}
            placeholder="Message..."
            className="
        flex-1
        h-9
        bg-black/25
        border
        border-white/10
        rounded-full
        px-4
        text-sm
        text-white
        placeholder:text-gray-400
        outline-none
      "
          />
             <button
      onClick={sendMessage}
      disabled={!message.trim()}
      className="
        w-9
        h-9
        rounded-full
        bg-blue-500/80
        hover:bg-blue-600
        disabled:opacity-40
        flex
        items-center
        justify-center
        transition
      "
    >
      ➤
    </button>
        </div>
      </div>
    </div>)}
    </>
  );
}