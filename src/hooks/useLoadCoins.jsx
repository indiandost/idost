import { useEffect } from "react";
import { useCoins } from "../context/CoinContext";

const API = import.meta.env.VITE_API_URL;

export default function useLoadCoins(userId) {
  const { setCoins } = useCoins();
  console.log("🔥 useLoadCoins triggered:", userId);
  useEffect(() => {
    if (!userId) return;

    const fetchCoins = async () => {
      try {
        const res = await fetch(`${API}/users/coins/${userId}`);

        const data = await res.json();

        if (data.success) {
          setCoins(data.coins);
        }
      } catch (err) {
        console.log("Coin error:", err);
      }
    };

    fetchCoins();
  }, [userId, setCoins]);
}