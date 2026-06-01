import { useState } from "react";
import axios from "axios";
import { API } from "../config";

export default function RiskTower() {

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
            `💥 Trap Found! Safe Box was ${res.data.safeBox}`
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

  return (

    <div className="min-h-screen bg-black text-white p-4">

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