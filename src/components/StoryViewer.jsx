import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StoryViewer({
  stories = [],
  currentIndex = 0,
  onClose,
}) {
  const [index, setIndex] = useState(currentIndex);
  const navigate = useNavigate();

  const story = stories[index];

  // =========================
  // AUTO NEXT STORY
  // =========================
  useEffect(() => {
    if (!story) return;

    const timer = setTimeout(() => {
      if (index >= stories.length - 1) {
        onClose();
      } else {
        setIndex((prev) => prev + 1);
      }
    }, story.media_type === "video" ? 15000 : 5000);

    return () => clearTimeout(timer);
  }, [index, story]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">

      {/* =========================
          PROGRESS BAR
      ========================= */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
        {stories.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 bg-gray-600 rounded overflow-hidden"
          >
            <div
              className={`h-full ${
                i < index
                  ? "bg-white"
                  : i === index
                  ? "bg-white"
                  : "bg-gray-600"
              }`}
              style={{
                width: i === index ? "100%" : i < index ? "100%" : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* =========================
          USER HEADER
      ========================= */}
      <div className="absolute top-10 left-4 flex items-center gap-3 z-30">
        <img
          src={story.user_pic}
          alt="profile"
          onClick={() => navigate(`/profile/${story.user_id}`)}
          className="w-10 h-10 rounded-full object-cover border-2 border-white cursor-pointer"
        />

        <div
          onClick={() => navigate(`/profile/${story.user_id}`)}
          className="cursor-pointer"
        >
          <p className="text-white text-sm font-semibold">
            {story.user_name}
          </p>
        </div>
      </div>

      {/* CLOSE BUTTON */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white text-2xl z-30"
      >
        ✕
      </button>

      {/* =========================
          MEDIA (IMAGE / VIDEO)
      ========================= */}
      {story.media_type === "image" && (
        <img
          src={story.media}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      )}

      {story.media_type === "video" && (
        <video
          src={story.media}
          autoPlay
          controls={false}
          className="max-h-full max-w-full"
        />
      )}

      {/* =========================
          LEFT TAP (PREVIOUS)
      ========================= */}
      <div
        onClick={() => {
          if (index > 0) setIndex(index - 1);
        }}
        className="absolute left-0 top-0 h-full w-1/2 z-10"
      />

      {/* =========================
          RIGHT TAP (NEXT)
      ========================= */}
      <div
        onClick={() => {
          if (index < stories.length - 1) {
            setIndex(index + 1);
          } else {
            onClose();
          }
        }}
        className="absolute right-0 top-0 h-full w-1/2 z-10"
      />
    </div>
  );
}