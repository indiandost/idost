import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

const moods = [
  "🔥 Flirty",
  "😔 Lonely",
  "🎧 Music",
  "☕ Chat",
  "🎮 Gaming",
  "🌙 Night Owl",
  "😂 Fun",
  "💔 Heartbroken",
];

export default function MoodBar({
  myId,
  token,
  currentMood,
  onMoodChange,
}) {

  const [activeMood, setActiveMood] = useState("");

  // ✅ sync from props/localStorage
  useEffect(() => {
    if (currentMood) {
      setActiveMood(currentMood);
    }
  }, [currentMood]);

  const updateMood = async (mood, e) => {

    // ✅ STOP FORM SUBMIT
    if (e) e.preventDefault();

    setActiveMood(mood);

    if (onMoodChange) {
      onMoodChange(mood);
    }

    try {

      const res = await fetch(
        `${API}/users/update-mood`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            userId: myId,
            mood,
          }),
        }
      );

      const data = await res.json();

      // ✅ update localStorage only on success
      if (data.success) {

        const user = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        user.mood = mood;

        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );
      }

    } catch (err) {

      console.log(err);

    }
  };

  return (

    <div className="overflow-x-auto no-scrollbar mb-4">

      <div className="flex gap-2 w-max">

        {moods.map((mood) => (

          <button
            key={mood}
            type="button"

            onClick={(e) => updateMood(mood, e)}

            className={`
              px-4 py-2 rounded-full text-sm
              whitespace-nowrap transition-all
              ${
                activeMood === mood
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-300"
              }
            `}
          >
            {mood}
          </button>

        ))}

      </div>

    </div>
  );
}