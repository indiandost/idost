import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function QuizResult() {
  const { battleId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadResult();
  }, []);

  const loadResult = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/api/quiz/result/${battleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        Loading Result...
      </div>
    );
  }

  if (!result?.success) {
    return (
      <div className="p-4 text-center">
        Failed to load result
      </div>
    );
  }

  if (result.waiting) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 rounded-xl p-4 text-center">
          ⏳ Waiting for opponent to finish quiz
        </div>

        <button
          onClick={() => navigate("/quiz-battles")}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
        >
          Back to Battles
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">

      <div className="bg-white rounded-xl shadow p-5">

        <h2 className="text-2xl font-bold text-center mb-4">
          🏆 Battle Result
        </h2>

        <div className="space-y-2">

          <div>
            Challenger Score:
            <span className="font-bold ml-2">
              {result.challengerScore}
            </span>
          </div>

          <div>
            Opponent Score:
            <span className="font-bold ml-2">
              {result.opponentScore}
            </span>
          </div>

          <hr />

          <div className="text-lg font-bold text-center">

            <div className="text-center text-xl font-bold text-green-600">
                {result.draw
                    ? "🤝 Match Draw"
                    : `🏆 ${result.winnerName} Won`}
                </div>

          </div>

        </div>

      </div>

      <button
        onClick={() => navigate("/quiz-battles")}
        className="mt-4 w-full bg-blue-500 text-white py-2 rounded"
      >
        Back to Battles
      </button>

    </div>
  );
}