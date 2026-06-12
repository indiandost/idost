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
          {result.review?.length > 0 && (
            <div className="mt-4 bg-white rounded-xl shadow p-4">
              <h3 className="font-bold text-lg mb-3">
                Answer Review
              </h3>

              {result.review.map((q, index) => (
                <div
                  key={q.id}
                  className={`mb-4 p-3 rounded-lg border ${
                    q.is_correct
                      ? "bg-green-50 border-green-300"
                      : "bg-red-50 border-red-300"
                  }`}
                >
                  <div className="font-semibold">
                    Q{index + 1}. {q.question}
                  </div>

                  <div>
                    Your Answer: <b>{q.selected_option}</b>
                  </div>

                  {!q.is_correct && (
                    <div className="text-green-700">
                      Correct Answer: <b>{q.correct_answer}</b>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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