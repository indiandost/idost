import { useState, useRef } from "react";
import { AdMob, RewardAdPluginEvents } from "@capacitor-community/admob";

const API = import.meta.env.VITE_API_URL;

export default function RewardAd() {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const safetyTimeoutRef = useRef(null);

  const rewardUser = async () => {
    try {
      const res = await fetch(`${API}/reward-ad`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (data.success) {
        alert("🎉 20 Coins Added Successfully!");
      } else {
        alert(data.message || "Reward failed.");
      }
    } catch (err) {
      console.log(err);
      alert("Server error.");
    }
  };

  // ✅ har situation me loading reset + listeners clean karne ka single common function
  const resetAdState = async () => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    setLoading(false);
    try {
      await AdMob.removeAllListeners();
    } catch (e) {
      console.log("removeAllListeners error:", e);
    }
  };

  const showRewardAd = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Remove previous listeners before attaching new ones
      await AdMob.removeAllListeners();

      // ✅ Ad successfully loaded — ab hi show karo
      AdMob.addListener(RewardAdPluginEvents.Loaded, async () => {
        console.log("✅ Ad Loaded");
        try {
          await AdMob.showRewardVideoAd();
        } catch (err) {
          console.log("Show Ad Error:", err);
          alert("Unable to show advertisement.");
          await resetAdState();
        }
      });

      // ❌ Ad load hi nahi hua (No Fill / network issue) — production me ye common hai
      AdMob.addListener(RewardAdPluginEvents.FailedToLoad, async (err) => {
        console.log("❌ Ad Failed To Load:", err);
        alert(
          err?.message
            ? `Ad not available: ${err.message}`
            : "No ad available right now. Please try again later."
        );
        await resetAdState();
      });

      // ❌ Ad show karte waqt fail hua
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, async (err) => {
        console.log("❌ Ad Failed To Show:", err);
        alert("Unable to show advertisement.");
        await resetAdState();
      });

      // Reward earned
      AdMob.addListener(RewardAdPluginEvents.Rewarded, async () => {
        console.log("🎉 Reward Earned");
        try {
          await rewardUser();
        } catch (err) {
          console.log(err);
        }
      });

      // Ad closed (user ne close button dabaya, ya ad khatam hui)
      AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
        console.log("❌ Ad Closed");
        await resetAdState();
      });

      // ✅ Safety net: agar 20 second me koi bhi event fire na ho, UI ko force unstick karo
      safetyTimeoutRef.current = setTimeout(async () => {
        console.log("⚠️ Ad timeout — forcing reset");
        await resetAdState();
      }, 20000);

      // Prepare ad — sirf prepare karo, show 'Loaded' listener ke andar hoga
      await AdMob.prepareRewardVideoAd({
        adId: "ca-app-pub-2089056578441092/7368531738", // Production
      });

    } catch (err) {
     // console.log("Reward Ad Error:", err);
      //console.error("message:", err?.message);
     // console.error("code:", err?.code);

      alert(`Message: ${err?.message}\nCode: ${err?.code}`);

      await resetAdState();
    }
  };

  return (
    <button
      onClick={showRewardAd}
      disabled={loading}
      className={`
        w-full
        rounded-2xl
        py-4
        text-lg
        font-bold
        text-black
        shadow-lg
        transition-all
        ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:scale-105"
        }
      `}
    >
      {loading ? "Loading Ad..." : "🪙 Watch Ad & Earn 20 Coins"}
    </button>
  );
}