import React, { useEffect, useState } from "react";
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from "react-native-google-mobile-ads";

const AD_UNIT_ID = __DEV__
  ? "ca-app-pub-3940256099942544/5224354917" // Google Test Rewarded
  : "YOUR_REWARDED_AD_UNIT_ID";

const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: false,
});

export default function useRewardAd(token) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadListener = rewarded.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log("✅ Reward Ad Loaded");
        setLoaded(true);
      }
    );

    const closeListener = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log("❌ Ad Closed");
        setLoaded(false);
        rewarded.load(); // preload next ad
      }
    );

    const rewardListener = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        console.log("🎉 Reward Earned");

        try {
          const res = await fetch(
            "https://indiandost.com/api/reward-ad",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                type: "admob",
              }),
            }
          );

          const json = await res.json();

          console.log(json);

          if (json.success) {
            alert(`🎉 +${json.coins} Coins Added`);
          } else {
            alert(json.message);
          }
        } catch (e) {
          console.log(e);
          alert("Reward API Error");
        }
      }
    );

    rewarded.load();

    return () => {
      loadListener();
      closeListener();
      rewardListener();
    };
  }, []);

  const showRewardAd = async () => {
    if (loading) return;

    if (!loaded) {
      alert("Ad is loading...");
      rewarded.load();
      return;
    }

    setLoading(true);

    try {
      await rewarded.show();
    } catch (e) {
      console.log(e);
      rewarded.load();
    }

    setLoading(false);
  };

  return {
    showRewardAd,
    loaded,
    loading,
  };
}