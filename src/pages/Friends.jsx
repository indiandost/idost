import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function Friends() {
 const [friends, setFriends] = useState([]);
const [requests, setRequests] = useState([]);

const [page, setPage] = useState(1);
const [loading, setLoading] = useState(false);
const [hasMore, setHasMore] = useState(true);

  const [tab, setTab] = useState("friends"); // friends | requests

  const myId = JSON.parse(localStorage.getItem("user"))?.srno;
  const navigate = useNavigate();
const token = localStorage.getItem("token"); 
  // =============================
  // 🔄 Load Data (Friends / Requests)
  // =============================
useEffect(() => {
  if (!myId) return;

  setPage(1);
  setHasMore(true);

  if (tab === "friends") {
    loadFriends(1, true);
  }

  if (tab === "requests") {
    loadRequests(1, true);
  }
}, [myId, tab]);

const loadFriends = async (pageNum = 1, reset = false) => {
  if (loading) return;

  setLoading(true);

  try {
    const res = await fetch(
      `${API}/friends/list/${myId}?page=${pageNum}&limit=10`,{
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
    );

    const data = await res.json();

    if (data.length < 10) {
      setHasMore(false);
    }

    if (reset) {
      setFriends(data);
    } else {
      setFriends(prev => [...prev, ...data]);
    }

  } catch (err) {
    console.error(err);
  }

  setLoading(false);
};

const loadRequests = async (pageNum = 1, reset = false) => {
  if (loading) return;

  setLoading(true);

  try {
    const res = await fetch(
      `${API}/friends/received/${myId}?page=${pageNum}&limit=10`,{
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
    );

    const data = await res.json();

    if (data.length < 10) {
      setHasMore(false);
    }

    if (reset) {
      setRequests(data);
    } else {
      setRequests(prev => [...prev, ...data]);
    }

  } catch (err) {
    console.error(err);
  }

  setLoading(false);
};

  // =============================
  // ❌ Remove Friend
  // =============================
  const removeFriend = (fid) => {
    if (!window.confirm("Remove this friend?")) return;

    fetch(`${API}/friends/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        user: myId,
        user2: fid
      })
    })
    .then(() => {
      setFriends(prev =>
        prev.filter(f => {
          const otherId = f.user == myId ? f.user2 : f.user;
          return otherId != fid;
        })
      );
    });
  };

  // =============================
  // ✅ Accept Request
  // =============================
  const acceptRequest = (reqId) => {
    fetch(`${API}/friends/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ id: reqId })
    })
    .then(() => {
      setRequests(prev => prev.filter(r => r.srno !== reqId));
    });
  };

  // =============================
  // ❌ Reject Request
  // =============================
  const rejectRequest = (reqId) => {
    fetch(`${API}/friends/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ id: reqId })
    })
    .then(() => {
      setRequests(prev => prev.filter(r => r.srno !== reqId));
    });
  };

    useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;

      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.body.scrollHeight;

      if (scrollTop + windowHeight >= fullHeight - 200) {

        const nextPage = page + 1;

        setPage(nextPage);

        if (tab === "friends") {
          loadFriends(nextPage);
        }

        if (tab === "requests") {
          loadRequests(nextPage);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [page, loading, hasMore, tab]);
  // =============================
  // 🎯 UI
  // =============================
  return (
    <div className="p-4 pt-8 text-white">

      <h2 className="text-xl mb-4 text-white">👥 Friends</h2>

      {/* 🔘 Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setTab("friends")}
          className={`px-4 py-2 rounded ${
            tab === "friends" ? "bg-blue-500" : "bg-gray-700"
          }`}
        >
          Friends
        </button>

        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded ${
            tab === "requests" ? "bg-blue-500" : "bg-gray-700"
          }`}
        >
          Requests
        </button>
      </div>

      {/* =============================
          👥 FRIENDS LIST
      ============================= */}
      {tab === "friends" && (
        <>
          {friends.length === 0 && (
            <div className="text-gray-400">No friends yet</div>
          )}

          <div className="space-y-3">
            {friends.map((f) => {
              const friendId = f.user == myId ? f.user2 : f.user;

              return (
                <div
                  key={f.srno}
                  className="flex items-center justify-between bg-gray-800 p-3 rounded-xl"
                >

                  {/* 👤 Friend Info */}
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${friendId}`)}
                  >
                    <img
                      src={f.pic || "/default-user.png"}
                      alt={f.name}
                      className="w-12 h-12 rounded-full object-cover border"
                    />

                    <div>
                      <div className="font-semibold">
                        {f.name || "Unknown User"}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {friendId}
                      </div>
                    </div>
                  </div>

                  {/* 🎯 Actions */}
                  <div className="flex gap-2">
                      <button onClick={() => navigate(`/chat/${friendId}`)}
  className="bg-blue-500 px-3 py-1 rounded-lg" >
                      Chat
                    </button>

                    <button
                      onClick={() => removeFriend(friendId)}
                      className="bg-red-500 px-3 py-1 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* =============================
          📥 REQUESTS LIST
      ============================= */}
      {tab === "requests" && (
        <>
          {requests.length === 0 && (
            <div className="text-gray-400">No pending requests</div>
          )}

          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.srno}
                className="flex items-center justify-between bg-gray-800 p-3 rounded-xl"
              >

                {/* 👤 Request User */}
                <div className="flex items-center gap-3">
                  <img
                    src={r.pic || "/default-user.png"}
                    alt={r.name}
                    className="w-12 h-12 rounded-full object-cover border"
                  />

                  <div>
                    <div className="font-semibold">
                      {r.name || "Unknown User"}
                    </div>
                  </div>
                </div>

                {/* 🎯 Actions */}
                <div className="flex gap-2">

                  <button
                    onClick={() => acceptRequest(r.srno)}
                    className="bg-green-500 px-3 py-1 rounded-lg"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => rejectRequest(r.requestId)}
                    className="bg-red-500 px-3 py-1 rounded-lg"
                  >
                    Reject
                  </button>

                </div>

              </div>
            ))}
          </div>
        </>
      )}
    {loading && (
      <div className="text-center py-4 text-gray-400">
        Loading...
      </div>
    )}

    {!hasMore && (
      <div className="text-center py-4 text-gray-500">
        No more data
      </div>
    )}
    </div>
  );
}