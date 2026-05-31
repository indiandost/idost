
import { useEffect, useRef, useState } from "react";

import socket from "../socket";

export default function ChatBox({
  roomId,
  messages,
}) {

  const [message, setMessage] =
    useState("");

  const chatEndRef =
    useRef(null);

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


  return (

    <div className="
      bg-zinc-900
      border
      border-zinc-800
      rounded-3xl
      overflow-hidden
      shadow-2xl
    ">

      {/* HEADER */}
      <div className="
        px-5
        py-4
        border-b
        border-zinc-800
        flex
        items-center
        justify-between
      ">

        <h2 className="
          text-2xl
          text-white
        ">

          💬 Live Chat

        </h2>

        <div className="
          text-sm
          text-zinc-400
        ">

          {messages.length}
          {" "}
          msgs

        </div>

      </div>


      {/* CHAT AREA */}
      <div className="
        h-[350px]
        overflow-y-auto
        bg-black
        px-4
        py-4
        space-y-3
      ">

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
                  max-w-[80%]
                  px-4
                  py-3
                  rounded-2xl
                  break-words
                  shadow-lg
                  ${
                    isMe
                      ? `
                        bg-blue-500
                        text-white
                        rounded-br-md
                      `
                      : `
                        bg-zinc-800
                        text-white
                        rounded-bl-md
                      `
                  }
                `}
              >

                {/* NAME */}
                <div className={`
                  text-xs
                  font-bold
                  mb-1
                  ${
                    isMe
                      ? "text-blue-100"
                      : "text-green-400"
                  }
                `}>

                  {isMe
                    ? "You"
                    : msg.name
                  }

                </div>


                {/* MESSAGE */}
                <div className="
                  text-sm
                  leading-relaxed
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
        border-zinc-800
        bg-zinc-950
        p-4
      ">

        <div className="
          flex
          items-center
          gap-3
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
            placeholder="Type your message..."
            className="
              flex-1
              bg-black
              border
              border-zinc-700
              focus:border-blue-500
              outline-none
              rounded-2xl
              px-5
              py-3
              text-white
              placeholder:text-zinc-500
            "
          />


          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="
              bg-blue-500
              hover:bg-blue-600
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition-all
              px-6
              py-3
              rounded-2xl
              font-bold
              shadow-lg
            "
          >

            Send

          </button>

        </div>

      </div>

    </div>
  );
}