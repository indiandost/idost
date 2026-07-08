import { useState } from "react";
import { AdMob, RewardAdPluginEvents } from "@capacitor-community/admob";

const API = import.meta.env.VITE_API_URL;

export default function RewardAd() {
  const token = localStorage.getItem("token");
  const [loading,setLoading]=useState(false);
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
  const showRewardAd = async () => {
  if (loading) return;

  setLoading(true);

  try {
    // Remove previous listeners
    await AdMob.removeAllListeners();

    // Reward earned
    AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      async () => {
        console.log("🎉 Reward Earned");

        try {
          await rewardUser();
        } catch (err) {
          console.log(err);
        }
      }
    );

    // Ad closed
    AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      async () => {
        console.log("❌ Ad Closed");

        setLoading(false);

        await AdMob.removeAllListeners();
      }
    );

    // Prepare ad
    await AdMob.prepareRewardVideoAd({
       adId: "ca-app-pub-2089056578441092/7368531738", // Production
    });
      //adId: "ca-app-pub-3940256099942544/5224354917", // Test Reward Ad
    // Show ad
    await AdMob.showRewardVideoAd();

  } catch (err) {
    console.log("Reward Ad Error:", err);

    setLoading(false);

    await AdMob.removeAllListeners();

    alert("Unable to load advertisement.");
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