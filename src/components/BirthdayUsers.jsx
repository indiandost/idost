import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BirthdayUsers() {

  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL;

  const [users3, setUsers3] = useState([]);

  useEffect(() => {

    let mounted = true;
    const myId = JSON.parse(localStorage.getItem("user"))?.srno;
    const loadBirthdayUsers = async () => {

      try {

        const res = await fetch(
          `${API}/users/birthday-users?myId=${myId}`
        );

        const data = await res.json();

        if (mounted) {
          setUsers3(Array.isArray(data) ? data : []);
        }

      } catch (err) {

        console.log("Birthday users error:", err);

      }

    };

    loadBirthdayUsers();

    return () => {
      mounted = false;
    };

  }, [API]);

  if (!users3.length) return null;

  return (

    <div className="mt-4">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">

        <h2 className="text-base font-bold text-white flex items-center gap-2">
          🎂 Today's Birthday
        </h2>

        <span className="text-xs text-pink-300">
          {users3.length} online
        </span>

      </div>

      {/* USERS */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">

        {users3.map((u, index) => (

          <div
            key={`${u.srno}-${index}`}
            onClick={() => navigate(`/profile/${u.srno}`)}
            className="
              min-w-[82px]
              max-w-[82px]
              bg-gradient-to-b
              from-pink-900/50
              to-pink-800/20
              border
              border-pink-500/40
              rounded-2xl
              p-2
              cursor-pointer
              flex
              flex-col
              items-center
              transition-all
              duration-200
              hover:scale-105
              active:scale-95
              shadow-md
            "
          >

            {/* IMAGE */}
            <div className="relative">

              <img
                loading="lazy"
                src={
                  u.pic
                    ? u.pic.startsWith("http://") ||
                      u.pic.startsWith("https://")
                      ? u.pic
                      : `https://indiandost.com/${u.pic}`
                    : "/default-user.png"
                }
                className="
                  w-14
                  h-14
                  rounded-full
                  object-cover
                  border-2
                  border-pink-400
                  bg-gray-700
                "
              />

              {/* Birthday Dot */}
              <div
                className="
                  absolute
                  -bottom-1
                  -right-1
                  bg-pink-500
                  text-[10px]
                  rounded-full
                  w-5
                  h-5
                  flex
                  items-center
                  justify-center
                  border
                  border-gray-900
                "
              >
                🎉
              </div>

            </div>

            {/* NAME */}
            <div
              className="
                text-white
                text-xs
                font-semibold
                mt-2
                text-center
                truncate
                w-full
              "
            >
              {u.name}
            </div>

            {/* AGE */}
            <div className="text-pink-300 text-[11px] mt-0.5">
              {u.age} yrs
            </div>

          </div>

        ))}

      </div>

    </div>

  );
}