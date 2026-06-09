import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const myId =  JSON.parse(localStorage.getItem("user"))?.srno;
export default function QuizBattles() {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBattles();
  }, []);


/*  useEffect(() => {
  fetch(`${API}/api/quiz/result/${battleId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}, []);
*/

  const loadBattles = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/api/quiz/my-battles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setBattles(data.battles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const acceptBattle = async (battleId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API}/api/quiz/accept/${battleId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        loadBattles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rejectBattle = async (
  battleId
) => {

  try {

    const token =
      localStorage.getItem("token");

    const res = await fetch(
      `${API}/api/quiz/reject/${battleId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (data.success) {
      loadBattles();
    }

  } catch (err) {
    console.error(err);
  }
};

  if (loading) {
    return (
      <div className="p-4 text-center">
        Loading battles...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">
        ⚔️ Quiz Battles
      </h2>

      {!battles.length && (
        <p>No battles found.</p>
      )}

      {battles.map((battle) => (
        <div
          key={battle.id}
          className="border rounded-xl p-4 mb-3 shadow"
        >
            <div className="font-semibold">
            {battle.challenger_name}
            {" vs "}
            {battle.opponent_name}
            </div>
          <div>
            Battle ID: #{battle.id}
          </div>

          <div className="mt-1">
            Status:
            <span className="font-semibold ml-2">
              {battle.status}
            </span>
          </div>

       <div className="mt-3 flex gap-2">

  {battle.status === "pending" &&
    Number(battle.opponent_id) === Number(myId) && (
      <>
        <button
          onClick={() =>
            acceptBattle(battle.id)
          }
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Accept
        </button>

        <button
          onClick={() =>
            rejectBattle(battle.id)
          }
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Reject
        </button>
      </>
  )}

  {battle.status === "pending" &&
    Number(battle.challenger_id) === Number(myId) && (
      <p className="text-yellow-600">
        Waiting for opponent...
      </p>
  )}
  {battle.status === "rejected" && (
  <span className="text-red-500 font-semibold">
    Rejected
  </span>
)}

  {battle.status === "accepted" && (
    <button
      onClick={() =>
        navigate(`/quiz/${battle.id}`)
      }
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Play Quiz
    </button>
  )}

  {battle.status === "completed" && (
    <button
      onClick={() =>
        navigate(`/quiz-result/${battle.id}`)
      }
      className="bg-purple-500 text-white px-4 py-2 rounded"
    >
      View Result
    </button>
  )}


{battle.status === "completed" && (
  <div className="mt-2 text-sm">
    <div>
      Score: {battle.challenger_score} - {battle.opponent_score}
    </div>

    <div className="font-semibold">
      {battle.winner_id
        ? Number(battle.winner_id) === Number(battle.challenger_id)
          ? `${battle.challenger_name} Won`
          : `${battle.opponent_name} Won`
        : "Match Draw"}
    </div>
  </div>
)}


</div>
        </div>
      ))}
    </div>
  );
}