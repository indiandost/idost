import { useEffect, useState, useRef } from "react";

const API = import.meta.env.VITE_API_URL;

export default function RewardsHistory() {

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  const [rewards, setRewards] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(true);

  const loaderRef = useRef(null);

  // =========================
  // LOAD REWARDS
  // =========================
  const loadRewards = async () => {

    if (loading || !hasMore)
      return;

    try {

      setLoading(true);

      const res = await fetch(
        `${API}/api/rewards/history/${user.srno}?page=${page}`
      );

      const data =
        await res.json();

      if (data.success) {

        if (
          data.rewards.length === 0
        ) {

          setHasMore(false);

        } else {

          setRewards((prev) => [
            ...prev,
            ...data.rewards,
          ]);

          setPage((prev) => prev + 1);
        }
      }

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // FIRST LOAD
  // =========================
  useEffect(() => {

    loadRewards();

  }, []);

  // =========================
  // INFINITE SCROLL
  // =========================
  useEffect(() => {

    const observer =
      new IntersectionObserver(
        (entries) => {

          if (
            entries[0].isIntersecting
          ) {

            loadRewards();
          }
        },
        {
          threshold: 1,
        }
      );

    if (loaderRef.current) {

      observer.observe(
        loaderRef.current
      );
    }

    return () => {

      if (loaderRef.current) {

        observer.unobserve(
          loaderRef.current
        );
      }
    };

  }, [loaderRef.current, loading]);

  return (

    <div className="min-h-screen bg-black text-white pt-16 pb-24 px-3">

      {/* HEADER */}
      <div className="sticky top-14 z-40 bg-black py-3">

        <h1 className="text-2xl font-bold">
          🎁 Rewards History
        </h1>

      </div>

      {/* LIST */}
      <div className="space-y-3 mt-3">

        {rewards.map((item) => (

          <div
            key={item.id}
            className="
              bg-gray-900
              rounded-2xl
              p-4
              border border-gray-800
              shadow-lg
            "
          >

            <div className="flex justify-between items-center">

              <div>

                <div className="text-lg font-semibold text-yellow-400">
                  💰 +{item.coins} Coins
                </div>

                <div className="text-sm text-gray-300 mt-1">
                  {item.reward_type}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {item.reward_value}
                </div>

              </div>

              <div className="text-xs text-gray-400 text-right">

                {new Date(
                  item.created_at
                ).toLocaleString()}

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* LOADER */}
      <div
        ref={loaderRef}
        className="h-20 flex items-center justify-center"
      >

        {loading && (
          <div className="text-gray-400">
            Loading...
          </div>
        )}

        {!hasMore && (
          <div className="text-gray-500">
            No more rewards
          </div>
        )}

      </div>

    </div>
  );
}