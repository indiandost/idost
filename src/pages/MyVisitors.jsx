import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function MyVisitors() {

  const [visitors, setVisitors] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef();

  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL;

  const userId = JSON.parse(localStorage.getItem("user"))?.srno;
  const token = localStorage.getItem("token"); 
  const LIMIT = 10;

  useEffect(() => {
    loadVisitors(page);
  }, [page]);

  const loadVisitors = async (pageNo) => {

    try {

      setLoading(true);

      const res = await axios.get(
        `${API}/users/my-visitors/${userId}?page=${pageNo}&limit=${LIMIT}`,{
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
      );

      const newVisitors = res.data.visitors || [];

      setVisitors((prev) => [...prev, ...newVisitors]);

      // if returned data less than limit => no more data
      if (newVisitors.length < LIMIT) {
        setHasMore(false);
      }

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }
  };

  // Infinite Scroll Observer
  const lastVisitorRef = useCallback(
    (node) => {

      if (loading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {

        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }

      });

      if (node) observer.current.observe(node);

    },
    [loading, hasMore]
  );

  return (
    <div className="p-4">

      <h2 className="text-2xl font-bold mb-4 mt-8 text-white">
        My Visitors
      </h2>

      <div className="space-y-3">

        {visitors.map((v, index) => {

          // attach ref to last item
          if (visitors.length === index + 1) {

            return (
              <div
                ref={lastVisitorRef}
                key={`${v.srno}-${index}`}
                onClick={() => navigate(`/profile/${v.userid}`)}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <img
                  src={v.pic|| "./default-user.png"}
                  alt={v.name}
                  className="w-14 h-14 rounded-full object-cover"
                />

                <div>
                  <h3 className="font-semibold">
                    {v.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    Visited your profile {v.visited_ago}
                  </p>
                </div>

              </div>
            );
          }

          return (
            <div
              key={`${v.srno}-${index}`}
              onClick={() => navigate(`/profile/${v.userid}`)}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-100"
            >
              <img
                src={v.pic}
                alt={v.name}
                className="w-14 h-14 rounded-full object-cover"
              />

              <div>
                <h3 className="font-semibold">
                  {v.name}
                </h3>

                <p className="text-sm text-gray-500">
                  Visited your profile {v.visited_ago}
                </p>
              </div>

            </div>
          );
        })}

      </div>

      {loading && (
        <div className="text-center py-4 text-gray-500">
          Loading...
        </div>
      )}

      {!hasMore && visitors.length > 0 && (
        <div className="text-center py-4 text-gray-400">
          No more visitors
        </div>
      )}

    </div>
  );
}