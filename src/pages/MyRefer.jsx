import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function MyReferrals() {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/users/my-referrals`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();

    if (json.success) {
      setData(json.referrals);
    }
  };

  // Only count referrals whose refcode is numeric
  const validatedReferrals = data.filter(
    (u) => !isNaN(u.refcode) && u.refcode !== null && u.refcode !== ""
  );

  const totalCoins = validatedReferrals.length * 500;

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 rounded-xl mb-4">
        <h2 className="text-xl font-bold">🎁 My Referrals</h2>

        <p className="mt-2">
          Total Referrals: <b>{data.length}</b>
        </p>

        <p>
          Validated Referrals: <b>{validatedReferrals.length}</b>
        </p>

        <p>
          Total Coins Earned: <b>{totalCoins}</b>
        </p>
      </div>

      {/* Notice */}
      <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 p-3 rounded-xl mb-4 text-sm">
        ⚠️ Referral rewards are credited only after the referred user is
        verified and validated by our team.
        <br />
        <br />
        Coin rewards may take a few days to appear in your account. Pending
        referrals will show as "Under Review" until validation is completed.
      </div>

      {/* Referral List */}
      {data.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-4 text-center text-gray-400">
          No referrals found yet.
        </div>
      ) : (
        data.map((user) => {
          const isValidated =
            !isNaN(user.refcode) &&
            user.refcode !== null &&
            user.refcode !== "";

          return (
            <div
              key={user.srno}
              className="bg-gray-800 rounded-xl p-3 mb-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    user.pic
                      ? user.pic.startsWith("http://") ||
                        user.pic.startsWith("https://")
                        ? user.pic
                        : `https://indiandost.com/${user.pic}`
                      : "/default-user.png"
                  }
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />

                <div>
                  <div className="text-white font-semibold">
                    {user.name}
                  </div>

                  <div className="text-gray-400 text-sm">
                    {user.city}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-right">
                {isValidated ? (
                  <>
                    <div className="text-green-400 font-semibold text-sm">
                      ✅ Credited
                    </div>
                    <div className="text-yellow-300 text-xs">
                      +500 Coins
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-orange-400 font-semibold text-sm">
                      ⏳ Under Review
                    </div>
                    <div className="text-gray-400 text-xs">
                      Awaiting validation
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}