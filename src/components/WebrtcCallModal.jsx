import { useEffect, useRef, useState } from "react";

export default function WebrtcCallModal({
  callState,
  callInfo,
  localStream,
  remoteStream,
  muted,
  cameraOff,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);

  const isVideo = callInfo?.type === "video";

  // local preview
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // remote stream
  useEffect(() => {
    if (!remoteStream) return;

    if (isVideo && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (!isVideo && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideo]);

  // call timer
  useEffect(() => {
    if (callState !== "connected") return;

    const interval = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (!callInfo) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      {/* hidden audio element for audio-only calls */}
      {!isVideo && <audio ref={remoteAudioRef} autoPlay />}
        {localStream && localStream.getTracks().length === 0 && (
        <p className="text-yellow-400 text-xs text-center mt-2">
            ⚠️ Mic/Camera not detected — listen-only mode
        </p>
        )}
      {/* ================= RINGING (INCOMING) ================= */}
      {callState === "ringing" && (
        <div className="flex-1 flex flex-col items-center justify-center text-white gap-4">
          <div className="w-24 h-24 rounded-full bg-purple-500/30 flex items-center justify-center text-4xl animate-pulse">
            {isVideo ? "🎥" : "📞"}
          </div>
          <h2 className="text-xl font-bold">
            {callInfo.remoteName || "Unknown"}
          </h2>
          <p className="text-zinc-400">
            Incoming {callInfo.type} call...
          </p>

          <div className="flex gap-6 mt-8">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-2xl"
            >
              ❌
            </button>
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-2xl"
            >
              ✅
            </button>
          </div>
        </div>
      )}

      {/* ================= CALLING (OUTGOING, WAITING) ================= */}
      {callState === "calling" && (
        <div className="flex-1 flex flex-col items-center justify-center text-white gap-4">
          <div className="w-24 h-24 rounded-full bg-purple-500/30 flex items-center justify-center text-4xl animate-pulse">
            {isVideo ? "🎥" : "📞"}
          </div>
          <h2 className="text-xl font-bold">
            {callInfo.remoteName || "Calling..."}
          </h2>
          <p className="text-zinc-400">Ringing...</p>

          <button
            onClick={() => onEnd("cancelled")}
            className="mt-8 w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-2xl"
          >
            ❌
          </button>
        </div>
      )}

      {/* ================= CONNECTED ================= */}
      {callState === "connected" && (
        <>
          {isVideo ? (
            <div className="relative flex-1 bg-zinc-900">
              {/* remote fullscreen */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* local small overlay */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-4 right-4 w-28 h-40 rounded-xl object-cover border-2 border-white/50"
              />

              <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                {formatDuration(callDuration)}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white gap-3">
              <div className="w-28 h-28 rounded-full bg-purple-500/30 flex items-center justify-center text-5xl">
                📞
              </div>
              <h2 className="text-xl font-bold">
                {callInfo.remoteName}
              </h2>
              <p className="text-zinc-400">
                {formatDuration(callDuration)}
              </p>
            </div>
          )}

          {/* CONTROLS */}
          <div className="p-6 flex justify-center gap-6 bg-black/80">
            <button
              onClick={onToggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${
                muted ? "bg-red-500" : "bg-zinc-700"
              }`}
            >
              {muted ? "🔇" : "🎙️"}
            </button>

            {isVideo && (
              <button
                onClick={onToggleCamera}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${
                  cameraOff ? "bg-red-500" : "bg-zinc-700"
                }`}
              >
                {cameraOff ? "📷" : "🎥"}
              </button>
            )}

            <button
              onClick={() => onEnd("ended")}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-xl"
            >
              📴
            </button>
          </div>
        </>
      )}
    </div>
  );
}