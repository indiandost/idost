import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function BlockedUsers() {

  const me =
    JSON.parse(localStorage.getItem("user"));

  const [users, setUsers] = useState([]);

  // =========================
  // FETCH BLOCK LIST
  // =========================
  const loadBlockedUsers = () => {

    fetch(
      `${API}/api/block-list/${me.srno}`
    )
      .then((res) => res.json())
      .then((data) => {

        setUsers(data);

      });

  };

  useEffect(() => {

    loadBlockedUsers();

  }, []);

  // =========================
  // UNBLOCK
  // =========================
  const unblockUser = async (id) => {

    const ok =
      window.confirm(
        "Unblock this user?"
      );

    if (!ok) return;

    const res = await fetch(
      `${API}/api/unblock`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          user: me.srno,
          user2: id,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {

      // reload
      loadBlockedUsers();

    }

  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">

      <h1 className="text-2xl font-bold mb-5">
        Blocked Users
      </h1>

      {users.length === 0 && (

        <div className="text-gray-400">
          No blocked users
        </div>

      )}

      <div className="space-y-3">

        {users.map((u) => (

          <div
            key={u.srno}
            className="bg-gray-800 rounded-xl p-3 flex items-center justify-between"
          >

            {/* USER */}
            <div className="flex items-center gap-3">

              <img
                src={
                  u.pic ||
                  "/default-user.png"
                }
                className="w-14 h-14 rounded-full object-cover"
              />

              <div>

                <div className="font-semibold">
                  {u.name}
                </div>

                <div className="text-sm text-gray-400">
                  {u.city}
                </div>

              </div>

            </div>

            {/* BUTTON */}
            <button
              onClick={() =>
                unblockUser(u.srno)
              }
              className="bg-red-500 px-4 py-2 rounded-lg"
            >
              Unblock
            </button>

          </div>

        ))}

      </div>

    </div>
  );

}