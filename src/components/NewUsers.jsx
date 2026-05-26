import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NewUsers() {

  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL;

  const [users2, setUsers2] = useState([]);

  useEffect(() => {

    let mounted = true;

    const loadNewUsers = async () => {

      try {
        const myId = JSON.parse(localStorage.getItem("user"))?.srno;
        const res = await fetch(
          `${API}/users/new-users?myId=${myId}`
        );

        const data = await res.json();

        if (mounted) {
          setUsers2(Array.isArray(data) ? data : []);
        }

      } catch (err) {

        console.log("New users error:", err);

      }

    };

    loadNewUsers();

    return () => {
      mounted = false;
    };

  }, [API]);

  if (!users2.length) return null;

  return (

    <div className="mt-5">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">

        <h2 className="text-base font-bold text-white flex items-center gap-2">
          🆕 New Members
        </h2>

        <span className="text-xs text-blue-300">
          {users2.length} joined
        </span>

      </div>

      {/* USERS */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">

        {users2.map((u) => (

          <div
            key={u.srno}
            onClick={() => navigate(`/profile/${u.srno}`)}
            className="
              min-w-[82px]
              max-w-[82px]
              bg-gradient-to-b
              from-gray-800
              to-gray-900
              border
              border-blue-500/30
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
                src={u.pic || "/default-user.png"}
                alt={u.name}
                className="
                  w-14
                  h-14
                  rounded-full
                  object-cover
                  border-2
                  border-blue-500
                  bg-gray-700
                "
              />

              {/* NEW BADGE */}
              <div
                className="
                  absolute
                  -bottom-1
                  -right-1
                  bg-blue-500
                  text-[9px]
                  font-bold
                  rounded-full
                  px-1.5
                  py-[1px]
                  border
                  border-gray-900
                  text-white
                "
              >
                NEW
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
            <div className="text-blue-300 text-[11px] mt-0.5">
              {u.age} yrs
            </div>

          </div>

        ))}

      </div>

    </div>

  );
}