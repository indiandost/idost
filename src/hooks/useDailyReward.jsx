import { useEffect } from "react";

const API =
  import.meta.env.VITE_API_URL;

export default function useDailyReward(
  userId
) {

  useEffect(() => {

    if (!userId) return;

    fetch(
      `${API}/api/rewards/daily-login`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({  userId,   }),
      }
    )
      .then((res) =>
        res.json()
      )
      .then((data) => {

        console.log(
          "Daily Reward:",
          data
        );

      })
      .catch((err) => {

        console.log(
          "Daily Reward Error:",
          err
        );

      });

  }, [userId]);

}