import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API } from "../config";

export default function RiskTower() {
  const navigate = useNavigate();
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const [gameId, setGameId] =
    useState(null);

  const [floor, setFloor] =
    useState(0);

  const [reward, setReward] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [status, setStatus] =
    useState("idle");
  // idle | playing | lost | cashout

  const [message, setMessage] =
    useState("");

  // =====================
  // START GAME
  // =====================
  const startGame = async () => {

    try {

      setLoading(true);

      const res =
        await axios.post(
          `${API}/risk/start`,
          {
            user_id:
              user.srno
          }
        );

      if (
        !res.data.success
      ) {

        alert(
          res.data.message
        );

        return;
      }

      setGameId(
        res.data.gameId
      );

      setFloor(0);

      setReward(0);

      setStatus(
        "playing"
      );

      setMessage(
        "Game Started"
      );

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }
  };

  // =====================
  // PICK BOX
  // =====================
  const pickBox =
    async (box) => {

      if (
        !gameId ||
        status !==
          "playing"
      ) {
        return;
      }

      try {

        setLoading(true);

        const res =
          await axios.post(
            `${API}/risk/play`,
            {
              gameId,
              box
            }
          );

        if (
          res.data.result ===
          "lost"
        ) {

          setStatus(
            "lost"
          );

          setMessage(
            `💥 Trap Found! Safe Box was ${res.data.trapBox}`
          );

          return;
        }

        setFloor(
          res.data.floor
        );

        setReward(
          res.data.reward
        );

        setMessage(
          `✅ Floor ${res.data.floor} cleared`
        );

      } catch (err) {

        console.log(err);

      } finally {

        setLoading(false);

      }
    };

  // =====================
  // CASHOUT
  // =====================
  const cashOut =
    async () => {

      try {

        const res =
          await axios.post(
            `${API}/risk/cashout`,
            {
              gameId
            }
          );

        if (
          res.data.success
        ) {

          setStatus(
            "cashout"
          );

          setMessage(
            `🎉 You won ${res.data.reward} coins`
          );
        }

      } catch (err) {

        console.log(err);

      }
    };
const FLOOR_REWARDS = [
  15,
  25,
  45,
  50,
  100,
  200,
  350,
  500,
  1000,
  2000
];
  return (

    <div className="min-h-screen bg-black text-white p-4">
   {/* Back Button */}
      <button
        onClick={() => navigate("/games")}
        className="mb-4 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
      >
        ← Back to Games
      </button>
      <div className="max-w-md mx-auto">

        <h1 className="text-3xl font-bold text-center mb-5 text-white">

          🏰 Risk Tower

        </h1>

        {/* FLOOR */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4 text-white">

          <p>
            Floor:
            {" "}
            {floor}
          </p>

          <p>
            Reward:
            {" "}
            {reward}
            {" "}
            Coins
          </p>

        </div>

        {/* START */}
        {status ===
          "idle" && (

          <button
            onClick={
              startGame
            }
            disabled={
              loading
            }
            className="
              w-full
              bg-green-600
              py-3
              rounded-xl
              font-bold
            "
          >
            Start Game
            (10 Coins)
          </button>

        )}

        {/* BOXES */}
        {status ===
          "playing" && (

          <>
            <div className="grid grid-cols-2 gap-4 mt-4">

              {[1,2,3,4]
                .map(
                (
                  box
                ) => (

                <button
                  key={
                    box
                  }
                  onClick={() =>
                    pickBox(
                      box
                    )
                  }
                  className="
                    h-32
                    bg-yellow-500
                    text-black
                    rounded-2xl
                    text-4xl
                    font-bold
                  "
                >
                  ?
                </button>

              ))}

            </div>

            <button
              onClick={
                cashOut
              }
              className="
                w-full
                mt-5
                bg-blue-600
                py-3
                rounded-xl
                font-bold
              "
            >
              Cash Out
              ({reward}
              {" "}
              Coins)
            </button>
             </>

        )}

        <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-3 mt-4 text-gray">
  <div className="text-yellow-600">
    Current Floor: <b>{floor}</b>
  </div>

  <div className="text-green-600">
    Current Reward:
    <b className="ml-1">
      {reward || 0} Coins
    </b>
  </div>
</div>
<div className="bg-gray-900 rounded-xl p-4 text-white">
  <h3 className="font-bold mb-3">
    🏆 Reward Ladder
  </h3>

  {FLOOR_REWARDS.map((reward, index) => (
    <div
      key={index}
      className={`flex justify-between px-3 py-2 rounded mb-1
      ${floor === index + 1
          ? "bg-green-600"
          : "bg-gray-800"
      }`}
    >
      <span>Floor {index + 1}</span>
      <span>{reward} Coins</span>
    </div>
  ))}
</div>

<div className="bg-gray-900 text-white p-4 rounded-xl mb-4">
  <h2 className="text-lg font-bold mb-2 text-white">
    🎰 Risk Tower
  </h2>

  <p className="text-sm text-gray-300">
    Entry Fee: <b>10 Coins</b>
  </p>

  <p className="text-sm text-gray-300 mt-1">
    Choose 1 of 4 boxes each floor.
  </p>

  <p className="text-sm text-gray-300">
    One box contains a trap 💣.
  </p>

  <p className="text-sm text-gray-300">
    Three boxes are safe ✅.
  </p>

  <p className="text-sm text-yellow-400 mt-2">
    Survival chance each floor: 75%
  </p>

  <p className="text-sm text-green-400">
    Cash out anytime before hitting a trap.
  </p>
</div>
<div className="mt-4 text-xs text-red-500 text-center">
  ⚠️ If you hit the trap box, the game ends and
  your current reward is lost.
</div>
         

        {/* MESSAGE */}
        {message && (

          <div className="
            mt-5
            bg-gray-900
            p-4
            rounded-xl
            text-center
          ">
            {message}
          </div>

        )}

        {/* RESTART */}
        {(status ===
          "lost" ||
          status ===
          "cashout") && (

          <button
            onClick={() => {

              setStatus(
                "idle"
              );

              setGameId(
                null
              );

              setFloor(
                0
              );

              setReward(
                0
              );

              setMessage(
                ""
              );

            }}
            className="
              w-full
              mt-5
              bg-pink-600
              py-3
              rounded-xl
              font-bold
            "
          >
            Play Again
          </button>

        )}

      </div>

    </div>
  );
}