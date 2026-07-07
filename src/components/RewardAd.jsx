import { AdMob, RewardAdPluginEvents } from "@capacitor-community/admob";

const API = import.meta.env.VITE_API_URL;

export default function RewardAd() {
  const token = localStorage.getItem("token");
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
    console.log('rewards--');
    try {
      // Remove old listeners
      AdMob.removeAllListeners();
      // Reward received
      AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        async () => {
          console.log("Reward Earned");
          await rewardUser();
        }
      );
      // Ad Closed
      AdMob.addListener(
        RewardAdPluginEvents.Dismissed,
        () => {
          console.log("Ad Closed");
        }
      );

      await AdMob.prepareRewardVideoAd({
        adId: "ca-app-pub-2089056578441092/7368531738", // Test Rewarded Ad
      });

      await AdMob.showRewardVideoAd();

    } catch (err) {
      console.log(err);
      alert("Unable to load advertisement.");
    }
  };

  return (
   <button
  onClick={showRewardAd}
  className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 py-4 text-lg font-bold text-black shadow-lg hover:scale-105 transition-all duration-300"
>
  🪙 Watch Ad & Earn 20 Coins
</button>
  );
}