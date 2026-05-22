export default function VideoCall({

  localVideoRef,
  remoteVideoRef,

  inCall,
  calling,

  callStatus,

  onEnd,

}) {

  // hide only when fully inactive
  if (!inCall && !calling && !callStatus) {
    return null;
  }

  return (

    <div className="fixed inset-0 bg-black z-[99999] overflow-hidden">

      {/* ========================= */}
      {/* REMOTE VIDEO FULL SCREEN */}
      {/* ========================= */}
      <div className="absolute inset-0 bg-black">

        <div
          ref={remoteVideoRef}
          className="
            w-full
            h-full
            overflow-hidden
            [&>video]:w-full
            [&>video]:h-full
            [&>video]:object-cover
          "
        />

        {/* fallback */}
        <div className="
          absolute inset-0
          flex items-center justify-center
          text-white/40 text-lg
          pointer-events-none
        ">
          {calling
            ? "Calling..."
            : "Waiting for video..."}
        </div>

      </div>

      {/* ========================= */}
      {/* DARK OVERLAY */}
      {/* ========================= */}
      <div className="
        absolute inset-0
        bg-gradient-to-b
        from-black/40
        via-transparent
        to-black/70
        pointer-events-none
        z-10
      " />

      {/* ========================= */}
      {/* TOP STATUS */}
      {/* ========================= */}
      <div className="
        absolute top-5 left-1/2
        -translate-x-1/2
        z-50
      ">

        <div className="
          bg-black/70
          backdrop-blur-md
          border border-white/10
          text-white
          px-5 py-2
          rounded-full
          text-sm
          shadow-lg
        ">

          {calling
            ? "📞 Calling..."
            : "🎥 Connected"}

          {callStatus && (
            <span className="ml-2 text-white/70">
              {callStatus}
            </span>
          )}

        </div>

      </div>

      {/* ========================= */}
      {/* LOCAL VIDEO */}
      {/* ========================= */}
      <div className="
        absolute
        top-5
        right-4
        z-50

        w-32
        h-44

        sm:w-40
        sm:h-56

        rounded-2xl
        overflow-hidden

        border border-white/20
        bg-gray-900
        shadow-2xl
      ">

        <div
          ref={localVideoRef}
          className="
            w-full
            h-full
            overflow-hidden
            [&>video]:w-full
            [&>video]:h-full
            [&>video]:object-cover
            [&>video]:scale-x-[-1]
          "
        />

        {/* label */}
        <div className="
          absolute bottom-2 left-2
          bg-black/60
          text-white
          text-xs
          px-2 py-1
          rounded-full
          z-50
        ">
          You
        </div>

      </div>

      {/* ========================= */}
      {/* END CALL BUTTON */}
      {/* ========================= 
      <button
        onClick={onEnd}
        className="
          absolute
          bottom-8
          left-1/2
          -translate-x-1/2

          z-[60]

          w-20
          h-20

          rounded-full
          bg-red-600
          hover:bg-red-700

          flex
          items-center
          justify-center

          text-white
          text-3xl

          shadow-2xl
          active:scale-95
          transition
        "
      >
        📞
      </button>*/}

    </div>
  );
}