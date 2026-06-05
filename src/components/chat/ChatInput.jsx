import { useState } from "react";

export default function ChatInput({
  onSend,
}) {

  const [message, setMessage] =  useState("");

  const [image, setImage] =  useState(null);

  const [preview, setPreview] =  useState(null);

  const [sending, setSending] =  useState(false);

  const handleSend = async () => {
    if (!message.trim() && !image) return;
    try {
      setSending(true);
      // ✅ IMPORTANT
      // wait until upload + socket send complete
      await onSend(
        message.trim(),
        image
      );
      // ✅ clear after successful send
      setMessage("");
      setImage(null);
      setPreview(null);

      // ✅ reset input
      const fileInput =  document.getElementById("chat-image");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.log(
        "Send failed",
        err
      );
    } finally {
      setSending(false);
    }
  };
  return (

    <div
      className="
        fixed
        bottom-16
        left-0
        right-0
        z-40
        bg-gray-900/95
        backdrop-blur-md
        border-t border-gray-800
        px-3 py-3
      "
    >

      {/* IMAGE PREVIEW */}
      {preview && (

        <div className="mb-3 relative w-fit">

          <img
            src={preview}
            alt="preview"
            className="
              w-24 h-24
              object-cover
              rounded-xl
              border border-gray-700
            "
          />

          <button
            type="button"
            onClick={() => {
              setImage(null);
              setPreview(null);

              const fileInput =
                document.getElementById(
                  "chat-image"
                );

              if (fileInput) {
                fileInput.value = "";
              }
            }}
            className="
              absolute -top-2 -right-2
              w-6 h-6
              rounded-full
              bg-red-500
              text-white text-xs
            "
          >
            ✕
          </button>

        </div>
      )}

      {/* INPUT AREA */}
      <div
        className="
          flex items-center gap-2
          bg-gray-800
          rounded-2xl
          px-2 py-2
          border border-gray-700
        "
      >

        {/* FILE INPUT */}
        <input
          type="file"
          hidden
          id="chat-image"
          accept="image/*"
          onChange={(e) => {

            const file =
              e.target.files[0];

            if (!file) return;

            console.log(
              "Selected image:",
              file
            );

            setImage(file);

            setPreview(
              URL.createObjectURL(file)
            );

          }}
        />

        {/* ATTACH BUTTON */}
        <label
          htmlFor="chat-image"
          className="
            min-w-[42px]
            h-[42px]
            rounded-full
            bg-gray-700
            hover:bg-gray-600
            flex items-center justify-center
            cursor-pointer
            text-lg
            transition
          "
        >
          📎
        </label>

        {/* MESSAGE INPUT */}
        <input
          type="text"
          value={message}
          onChange={(e) =>
            setMessage(
              e.target.value
            )
          }
          onKeyDown={(e) => {

            if (
              e.key === "Enter" &&
              !sending
            ) {
              handleSend();
            }

          }}
          placeholder="Type a message..."
          className="
            flex-1
            bg-transparent
            outline-none
            text-white
            placeholder-gray-400
            px-2
            min-w-0
          "
        />

        {/* SEND BUTTON */}
        <button
          type="button"
          disabled={sending}
          onClick={handleSend}
          className="
            min-w-[46px]
            h-[46px]
            rounded-full
            bg-blue-500
            hover:bg-blue-600
            flex items-center justify-center
            text-white
            font-semibold
            transition
            shrink-0
            disabled:opacity-50
          "
        >
          {sending ? "..." : "➤"}
        </button>

      </div>

    </div>
  );
}