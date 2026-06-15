import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function MyReferrals() {
  const [data, setData] = useState([]);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API}/users/my-referrals`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const json = await res.json();

    if (json.success) {
      setData(json.referrals);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">

      <div className="bg-purple-600 text-white p-4 rounded-xl mb-4">
        <h2 className="text-xl font-bold">
          🎁 My Referrals
        </h2>

        <p className="mt-2">
          Total Referrals: {data.length}
        </p>

        <p>
          Total Coins Earned: {data.length * 500}
        </p>
      </div>

      {data.map((user) => (
        <div
          key={user.srno}
          className="bg-gray-800 rounded-xl p-3 mb-3 flex items-center gap-3"
        >
          <img
            src={
              user.pic
                ? user.pic.startsWith("http://") ||
                  user.pic.startsWith("https://")
                  ? user.pic
                  : `https://indiandost.com/${user.pic}`
                : "/default-user.png"
            }
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
      ))}
    </div>
  );
}