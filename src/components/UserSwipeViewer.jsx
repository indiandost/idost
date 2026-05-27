import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserSwipeViewer({
  token,
  users = [],
  startIndex = 0,
  onClose,
  onOpenProfile,
}) {

  const [index, setIndex] = useState(startIndex);
  const user = users[index];
useEffect(() => {
  setIndex(startIndex);
}, [startIndex]);
  // =========================
  // SWIPE LOGIC
  // =========================
  const changeUser = (dir) => {
    setIndex((prev) => {
      if (dir === "next") return Math.min(prev + 1, users.length - 1);
      if (dir === "prev") return Math.max(prev - 1, 0);
      return prev;
    });
  };

  // =========================
  // KEYBOARD SUPPORT (LAPTOP)
  // =========================
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") changeUser("next");
      if (e.key === "ArrowLeft") changeUser("prev");
      if (e.key === "ArrowDown") changeUser("next");
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [users.length]);

  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">

      {/* BACKDROP CLICK CLOSE */}
      <div
        className="absolute inset-0 z-0"
        onClick={onClose}
      />

      {/* LEFT / RIGHT TAP ZONES */}
      <div
        onClick={() => changeUser("prev")}
        className="absolute left-0 top-0 h-full w-1/3 z-10"
      />
      <div
        onClick={() => changeUser("next")}
        className="absolute right-0 top-0 h-full w-1/3 z-10"
      />

      {/* SWIPE CARD */}
      <AnimatePresence mode="wait">

        <motion.div
          key={index}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {

            if (info.offset.x < -80) changeUser("next");
            if (info.offset.x > 80) changeUser("prev");

          }}
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -50 }}
          transition={{ duration: 0.25 }}
          className="text-center text-white z-20 pointer-events-auto"
        >

          {/* PROFILE IMAGE */}
          <img
            src={user.pic || "/default-user.png"}
            className="w-44 h-44 rounded-full object-cover mx-auto border-4 border-pink-500 shadow-lg"
          />

          {/* NAME */}
          <h2 className="text-2xl font-bold mt-4 text-white">
            {user.name}
          </h2>

          <p className="text-gray-400">
            {user.age} • {user.city}
          </p>

          <p className="mt-2 text-sm text-gray-300 max-w-xs mx-auto">
            {user.about}
          </p>

          {/* BUTTONS */}
          <div className="flex gap-3 justify-center mt-6">

             <button
   onClick={(e) => {
  e.stopPropagation();
  onOpenProfile(user.srno);
}}
    className="
      bg-blue-500
      hover:bg-blue-600
      transition
      px-4
      py-2
      rounded-xl
      text-sm
      font-medium
    "
  >
    Open Profile
  </button>

            <button
              onClick={onClose}
              className="bg-red-500 px-4 py-2 rounded"
            >
              Close
            </button>

          </div>

          {/* SWIPE HINT */}
          <p className="text-xs text-gray-500 mt-4">
            Swipe or drag left/right
          </p>

        </motion.div>

      </AnimatePresence>

    </div>
  );
}