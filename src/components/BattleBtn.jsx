import { useState } from "react";
import { useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL;

export default function BattleBtn({ opponentId }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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
        navigate("/quiz-battles");
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
     <div className="relative group w-full">
  <button
    onClick={createBattle}
    disabled={loading}
    className="bg-pink-500 py-2 px-4 rounded-xl text-white w-full"
  >
    {loading ? "Sending..." : "⚔️ Battle"}
  </button>

  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-50">
    🏆 Win: +50 Coins<br/>
    😔 Lose: -30 Coins<br/>
    🤝 Draw: +25 Coins
  </div>
</div>
  
  );
}