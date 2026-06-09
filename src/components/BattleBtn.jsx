import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function BattleBtn({ opponentId }) {
  const [loading, setLoading] = useState(false);

  const createBattle = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/api/quiz/create-battle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            opponentId,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("⚔️ Quiz challenge sent!");
      } else {
        alert(data.message || "Failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
      <button
    onClick={createBattle}
    disabled={loading}
    className="bg-pink-500 py-2 px-4 rounded-xl text-white w-full"
  >
    {loading ? "Sending..." : "⚔️ Battle"}
  </button>
  
  );
}