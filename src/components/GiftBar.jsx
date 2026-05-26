import { useState, useEffect } from "react";
import { Gift, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

export default function GiftBar({
  myId,
  hostId,
  roomId,
  socket,
}) {
  const token = localStorage.getItem("token"); 
  const [loading, setLoading] =
    useState(false);

  const [gifts, setGifts] =
    useState([]);

  const [open, setOpen] =
    useState(false);

  // =========================
  // SHOW SMALL NOTICE
  // =========================
  const showNotice = (
    text,
    color = "#111"
  ) => {

    const notice =
      document.createElement("div");

    notice.innerText = text;

    notice.style.position = "fixed";
    notice.style.bottom = "120px";
    notice.style.right = "20px";
    notice.style.background = color;
    notice.style.color = "#fff";
    notice.style.padding =
      "10px 16px";
    notice.style.borderRadius =
      "12px";
    notice.style.zIndex =
      "999999";
    notice.style.fontSize = "14px";
    notice.style.fontWeight = "600";

    document.body.appendChild(
      notice
    );

    setTimeout(() => {
      notice.remove();
    }, 2500);
  };

  
  // =========================
  // FETCH GIFTS
  // =========================
  useEffect(() => {

    const fetchGifts =
      async () => {

        try {

          const res =
            await fetch(
              `${API}/api/gifts/get-gift`, {
    headers: {
       "Content-Type": "application/json", Authorization:  `Bearer ${token}`,
    }
  }
            );

          const data =
            await res.json();

          if (data.success) {

            setGifts(
              data.gifts || []
            );

          }

        } catch (err) {

          console.log(
            "Gift fetch error:",
            err
          );

        }
      };

    fetchGifts();

  }, []);

  // =========================
  // SOCKET LISTENERS
  // =========================
  useEffect(() => {

    if (!socket) return;

    // receiver
    const onGiftReceived =
      (data) => {

        console.log(
          "🎁 Gift received:",
          data
        );

        showNotice(
          `🎁 You received ${data.gift.name}`,
          "#16a34a"
        );
      };

    // sender
    const onGiftSent =
      (data) => {

        console.log(
          "✅ Gift sent:",
          data
        );

        showNotice(
          `✅ Gift sent: ${data.gift.name}`,
          "#ec4899"
        );
      };

    socket.on(
      "giftReceived",
      onGiftReceived
    );

    socket.on(
      "giftSentSuccess",
      onGiftSent
    );

    return () => {

      socket.off(
        "giftReceived",
        onGiftReceived
      );

      socket.off(
        "giftSentSuccess",
        onGiftSent
      );

    };

  }, [socket]);

  // =========================
  // SEND GIFT
  // =========================
  const sendGift = async (
    gift
  ) => {

    if (loading) return;

    try {

      setLoading(true);

      const res =
        await fetch(
          `${API}/api/gifts/send-gift`,
          {
            method: "POST",
            headers: {
              Authorization:  `Bearer ${token}`,  "Content-Type": "application/json",
            },

            body: JSON.stringify({
              sender_id: myId,
              receiver_id: hostId,
              gift_id: gift.id,
              room_id: roomId,
            }),
          }
        );

      const data =
        await res.json();

      if (data.success) {

        setOpen(false);

      } else {

        alert(
          data.message ||
            "Gift failed"
        );

      }

    } catch (err) {

      console.log(
        "Gift error:",
        err
      );

      alert(
        "Gift sending failed"
      );

    } finally {

      setLoading(false);

    }
  };

  return (

    <div
      className="
        fixed
        bottom-28
        right-4
        z-[999999]
        flex
        flex-col
        items-end
      "
    >

      {/* GIFT LIST */}
      {open && (

        <div
          className="
            mb-3
            bg-black/90
            backdrop-blur-xl
            border
            border-white/10
            rounded-2xl
            p-3
            shadow-2xl
            flex
            gap-2
            animate-in
            fade-in
            slide-in-from-bottom-2
          "
        >

          {gifts.map((gift) => (

            <button
              key={gift.id}

              onClick={() =>
                sendGift(gift)
              }

              disabled={loading}

              className="
                w-16
                h-16
                rounded-2xl
                bg-white/5
                hover:bg-pink-500/20
                border
                border-white/10
                transition-all
                active:scale-95
                flex
                flex-col
                items-center
                justify-center
                disabled:opacity-50
              "
            >

              <div className="text-2xl">
                {gift.icon}
              </div>

              <div
                className="
                  text-[10px]
                  text-gray-300
                  mt-1
                "
              >
                {gift.coins}
              </div>

            </button>

          ))}

        </div>

      )}

      {/* MAIN BUTTON */}
      <button
        onClick={() =>
          setOpen(!open)
        }

        className="
          absolute
          right-0
          -top-14
          z-20
          w-10
          h-10
          rounded-full
          bg-pink-500
          flex
          items-center
          justify-center
          shadow-lg
        "
      >

        {open ? (
          <X size={24} />
        ) : (
          <Gift size={24} />
        )}

      </button>

    </div>
  );
}