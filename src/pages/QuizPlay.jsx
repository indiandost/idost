import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function QuizPlay() {
  const { battleId } = useParams();

  const navigate = useNavigate();

  const [questions, setQuestions] =
    useState([]);

  const [current, setCurrent] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const res = await fetch(
        `${API}/api/quiz/questions/${battleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      setQuestions(
        data.questions || []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (
    optionNumber
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      const currentQuestion =
        questions[current];

      const res = await fetch(
        `${API}/api/quiz/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            battleId,
            questionId:
              currentQuestion.id,
            answer: optionNumber,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        return;
      }

      if (
        current + 1 <
        questions.length
      ) {
        setCurrent(
          (prev) => prev + 1
        );
      } else {
        alert(
          "Quiz completed!"
        );

        navigate(
          `/quiz-result/${battleId}`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        Loading...
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="p-4 text-center">
        No questions found.
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="max-w-xl mx-auto p-4">

      <div className="mb-4 text-center">
        Question {current + 1} of{" "}
        {questions.length}
      </div>

      <div className="border rounded-xl p-4 shadow">

        <h2 className="text-lg font-bold mb-4">
          {q.question}
        </h2>

        <div className="grid gap-3">

          <button
            onClick={() =>
              submitAnswer(1)
            }
            className="border p-3 rounded-lg"
          >
            {q.option1}
          </button>

          <button
            onClick={() =>
              submitAnswer(2)
            }
            className="border p-3 rounded-lg"
          >
            {q.option2}
          </button>

          <button
            onClick={() =>
              submitAnswer(3)
            }
            className="border p-3 rounded-lg"
          >
            {q.option3}
          </button>

          <button
            onClick={() =>
              submitAnswer(4)
            }
            className="border p-3 rounded-lg"
          >
            {q.option4}
          </button>

        </div>
      </div>
    </div>
  );
}