export default function CallControls({

  isMuted,
  isCameraOn,
  onMute,
  onCamera,
  onEnd,
  onFlip, 

}) {

  return (

    <div
      className="
fixed
bottom-6
left-1/2
-translate-x-1/2
z-[100000]
flex
gap-4
      "
    >

      <div
        className="
          flex items-center gap-4
          bg-black/70
          backdrop-blur-xl
          px-5 py-4
          rounded-full
          border border-white/10
        "
      >

        {/* MUTE */}
        <button
          onClick={onMute}
          className="
            w-14 h-14
            rounded-full
            bg-gray-800
            text-white
            text-xl
          "
        >
          {isMuted ? "🔇" : "🎤"}
        </button>

        {/* CAMERA */}
        <button
          onClick={onCamera}
          className="
            w-14 h-14
            rounded-full
            bg-gray-800
            text-white
            text-xl
          "
        >
          {isCameraOn ? "📷" : "🚫"}
        </button>

        {/* END */}
        <button
          onClick={onEnd}
          className="
            w-16 h-16
            rounded-full
            bg-red-600
            text-white
            text-2xl
          "
        >
          📞
        </button>
        <button
          onClick={onFlip}
          className="
            w-14 h-14
            rounded-full
            bg-gray-800
            text-white
            text-xl
          "
        >
          🔄
        </button>
      </div>

    </div>
  );
}