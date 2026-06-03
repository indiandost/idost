import { useEffect, useRef } from "react";

export default function MessageList({ messages, myId }) {
  const bottomRef = useRef(null);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (d) =>
    new Date(d).toDateString();

  // =========================
  // GROUP BY DATE
  // =========================
  const grouped = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);

    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);

    return acc;
  }, {});

  return (
    <div
      className="
        flex-1
        overflow-y-auto
        px-3
        py-4
        space-y-6
        bg-[#0f1720]

        /* ✅ IMPORTANT FIX: prevents footer overlap */
        pb-28

        scrollbar-thin scrollbar-thumb-gray-700
      "
    >

      {Object.entries(grouped).map(([date, msgs]) => (
        <div key={date} className="space-y-3">

          {/* =========================
              DATE DIVIDER
          ========================= */}
          <div className="flex justify-center my-3">
            <span className="bg-gray-700 text-xs text-white px-3 py-1 rounded-full shadow">
              {date}
            </span>
          </div>

          {/* =========================
              MESSAGES
          ========================= */}
          {msgs.map((m, i) => {
            const isMe = Number(m.from) === Number(myId);

            const time = new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={i}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[78%]
                    flex flex-col min-h-full
                    ${isMe ? "items-end" : "items-start"}
                  `}
                >

                  {/* IMAGE */}
                  {m.media_url && (
                    <img
                      src={m.media_url}
                      alt="media"
                      className="
                        max-w-[240px]
                        rounded-2xl
                        border border-gray-700
                        shadow-md
                        mb-1
                      "
                    />
                  )}

                  {/* TEXT */}
                  {m.message && (
                    <div
                      className={`
                        px-4 py-2.5
                        text-[15px]
                        break-words
                        shadow-md
                        rounded-2xl
                        leading-relaxed

                        ${
                          isMe
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-gray-800 text-white rounded-bl-md"
                        }
                      `}
                    >
                      {m.message}
                    </div>
                  )}

                  {/* TIME */}
                  <div className="text-[11px] text-gray-400 mt-1 px-1">
                    {time}
                  </div>

                </div>
              </div>
            );
          })}

        </div>
      ))}

      {/* AUTO SCROLL TARGET */}
      <div ref={bottomRef} />

    </div>
  );
}