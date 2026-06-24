import React, {
  useEffect,
  useState
} from "react";

import axios from "axios";

const API =
  import.meta.env.VITE_API_URL;

export default function HireRequests() {

  const token = localStorage.getItem("token");
  const [tab, setTab] =  useState("received");
  const [received,  setReceived] =  useState([]);
  const [sent,   setSent] =  useState([]);
  const [loading, setLoading] =  useState(true);    
    const [reviews, setReviews] = useState([]);
    const [showReviews, setShowReviews] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);
const [rating, setRating] = useState({});
const [comment, setComment] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData =
    async () => {

      try {

        setLoading(true);

        const headers = {
          Authorization:
            `Bearer ${token}`
        };

        const [
          rec,
          sentRes
        ] = await Promise.all([

          axios.get(
            `${API}/hireme/hire-requests/my`,
            { headers }
          ),

          axios.get(
            `${API}/hireme/hire-requests/sent`,
            { headers }
          )

        ]);

        setReceived(
          rec.data.requests || []
        );

        setSent(
          sentRes.data.requests || []
        );
console.log(rec.data.requests);
console.log(sentRes.data.requests);
      } catch (err) {

        console.log(err);

      } finally {

        setLoading(false);

      }

    };

  const loadReviews = async (userId) => {
  try {
    setLoadingReviews(true);
    const res = await fetch(
      `${API}/hireme/hire-reviews/${userId}`
    );
    const data = await res.json();
    setReviews(data.reviews);
    setShowReviews(true);

  } catch (err) {
    console.error(err);
  } finally {
    setLoadingReviews(false);
  }
};

const submitReview = async (requestId) => {

  try {

    const token =
      localStorage.getItem("token");

    await axios.post(
      `${API}/hireme/hire-review`,
      {
        request_id: requestId,
        rating: rating[requestId],
        comment:
          comment[requestId] || ""
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    alert(
      "Review submitted successfully"
    );

    loadData();

  } catch (err) {

    console.log(err);

    alert(
      err?.response?.data?.message ||
      "Unable to submit review"
    );

  }

};

  const updateStatus =
    async (
      id,
      action
    ) => {

      try {

        await axios.put(
          `${API}/hireme/hire-request/${id}/${action}`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

        loadData();

      } catch (err) {

        alert(
          err?.response?.data?.message ||
          "Failed"
        );

      }

    };

  const statusBadge =
    (status) => {

      if (
        status === "Accepted"
      ) {
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            Accepted
          </span>
        );
      }

      if (
        status === "Rejected"
      ) {
        return (
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
            Rejected
          </span>
        );
      }

      return (
        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
          Pending
        </span>
      );

    };

  return (

    <div className="min-h-screen bg-slate-950 text-white p-4">

      <div className="max-w-6xl mx-auto">

        <div className="mb-6">

          <h1 className="text-3xl font-bold">
            Hire Requests
          </h1>

          <p className="text-slate-400 mt-1">
            Manage received and sent requests
          </p>

        </div>

        {/* Tabs */}

        <div className="flex gap-3 mb-6">

          <button
            onClick={() =>
              setTab(
                "received"
              )
            }
            className={`px-5 py-3 rounded-xl font-medium transition ${
              tab ===
              "received"
                ? "bg-orange-500 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            📥 Received
          </button>

          <button
            onClick={() =>
              setTab("sent")
            }
            className={`px-5 py-3 rounded-xl font-medium transition ${
              tab === "sent"
                ? "bg-orange-500 text-white"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            📤 Sent
          </button>

        </div>

        {loading ? (

          <div className="text-center py-20">
            Loading...
          </div>

        ) : (

          <div className="grid gap-4">

            {tab === "received" &&
              received.map(
                (item) => (

                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5"
                  >

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                      <div className="flex gap-4">

                        <img
                          src={
                            item.pic ||
                            "/images/default-user.png"
                          }
                          alt=""
                          className="w-16 h-16 rounded-full object-cover"
                        />

                        <div>

                          <h3 className="font-bold text-lg">
                            {item.name}
                          </h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                                <span className="text-yellow-500">⭐</span>

                                <span className="font-semibold text-slate-700">
                                  {Number(item.avg_rating || 0).toFixed(1)}
                                </span>
                              </div>

                              <span className="text-sm text-slate-500">
                                ({item.total_reviews || 0} Reviews)
                              </span>

                         </div>
                          {item?.total_reviews > 0 && (
                          <button
                            onClick={() => loadReviews(item.srno)}
                            className="text-blue-600 text-sm font-medium mt-2"
                          >
                            View Reviews ({item.total_reviews})
                          </button>
                        )}
{showReviews && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-5">

      <div className="flex justify-between items-center mb-4">

        <h3 className="font-bold text-lg"  style={{ color: "#222" }}>
          Customer Reviews
        </h3>

        <button
          onClick={() => setShowReviews(false)}
          className="text-red-500 text-xl"  style={{ color: "#222" }}
        >
          ✕
        </button>

      </div>

      {!reviews || reviews.length === 0 ? (

        <p className="text-gray-500">
          No reviews found.
        </p>

      ) : (

        reviews.map((review, index) => (

          <div
            key={review?.id || index}
            className="border-b py-3"
          >

            <div className="flex justify-between">

              <h4 className="font-semibold"  style={{ color: "#222" }}>
                {review?.reviewer_name || "Anonymous"}
              </h4>

              <span className="text-yellow-500">
                ⭐ {review?.rating || 0}
              </span>

            </div>

            <p className="text-sm text-gray-600 mt-1">
              {review?.comment || ""}
            </p>

            <p className="text-xs text-gray-400 mt-2">
              {review?.created_at
                ? new Date(review.created_at).toLocaleDateString()
                : ""}
            </p>

          </div>

        ))

      )}

    </div>

  </div>
)}

                          <p className="text-slate-400 text-sm">
                            {item.city}
                            {item.state
                              ? `, ${item.state}`
                              : ""}
                          </p>

                          <p className="mt-2 text-slate-300">
                            {item.message}
                          </p>

                          <div className="mt-3">
                            {statusBadge(
                              item.status
                            )}
                          </div>
                          {item.status === "Accepted" && (<>
                            <div className="mt-3">
                                <div className="bg-green-900/30 border border-green-700 rounded-xl p-3">
                                <p className="text-green-400 font-medium">
                                    Contact Number
                                </p>
                                <a
                                    href={`tel:${item.mobile}`}
                                    className="text-white"
                                >
                                    {item.mobile}
                                </a>
                                </div>
                            </div>
                             {item.reviewed > 0 ? (
  <div className="text-green-500">
    ✅ Review Submitted
  </div>
): (
<div className="mt-4 border border-slate-700 rounded-2xl p-4 bg-slate-900">
                                    <h4 className="text-white font-semibold mb-3">
                                    ⭐ Leave Review
                                    </h4>

                                    <select
                                    value={
                                        rating[item.id] || ""
                                    }
                                    onChange={(e) =>
                                        setRating({
                                        ...rating,
                                        [item.id]:
                                            e.target.value
                                        })
                                    }
                                    className="
                                    w-full
                                    bg-slate-800
                                    border
                                    border-slate-700
                                    rounded-xl
                                    px-4
                                    py-3
                                    text-white
                                    mb-3
                                    "
                                    >

                                    <option value="">
                                        Select Rating
                                    </option>

                                    <option value="5">
                                        ⭐⭐⭐⭐⭐ Excellent
                                    </option>

                                    <option value="4">
                                        ⭐⭐⭐⭐ Good
                                    </option>

                                    <option value="3">
                                        ⭐⭐⭐ Average
                                    </option>

                                    <option value="2">
                                        ⭐⭐ Poor
                                    </option>

                                    <option value="1">
                                        ⭐ Very Bad
                                    </option>

                                    </select>

                                    <textarea
                                    rows="4"
                                    value={
                                        comment[item.id] || ""
                                    }
                                    onChange={(e) =>
                                        setComment({
                                        ...comment,
                                        [item.id]:
                                            e.target.value
                                        })
                                    }
                                    placeholder="Write your review..."
                                    className="
                                    w-full
                                    bg-slate-800
                                    border
                                    border-slate-700
                                    rounded-xl
                                    px-4
                                    py-3
                                    text-white
                                    mb-3
                                    "
                                    />

                                    <button
                                    onClick={() =>
                                        submitReview(item.id)
                                    }
                                    disabled={
                                        !rating[item.id]
                                    }
                                    className="
                                    px-5
                                    py-3
                                    rounded-xl
                                    bg-amber-500
                                    hover:bg-amber-600
                                    text-black
                                    font-semibold
                                    "
                                    >
                                    Submit Review
                                    </button>

                                </div>
)}                              
                            </>
                            )}
                        <p className="text-xs text-slate-400 mt-2">
                            Requested:
                            {" "}
                            {new Date(
                                item.created_at
                            ).toLocaleString()}
                            </p>
                            {item.action_at && (
                            <p className="text-xs text-green-400 mt-1">
                                Updated:
                                {" "}
                                {new Date(
                                item.action_at
                                ).toLocaleString()}
                            </p>
                            )}

                        </div>

                      </div>

                      {item.status ===
                        "Pending" && (

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              updateStatus(
                                item.id,
                                "accept"
                              )
                            }
                            className="px-4 py-2 bg-green-600 rounded-xl hover:bg-green-700"
                          >
                            Accept
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                item.id,
                                "reject"
                              )
                            }
                            className="px-4 py-2 bg-red-600 rounded-xl hover:bg-red-700"
                          >
                            Reject
                          </button>

                        </div>

                      )}

                    </div>

                  </div>

                )
              )}

            {tab === "sent" &&
              sent.map(
                (item) => (

                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5"
                  >

                    <div className="flex gap-4">

                      <img
                        src={
                          item.pic ||
                          "/images/default-user.png"
                        }
                        alt=""
                        className="w-16 h-16 rounded-full object-cover"
                      />

                      <div className="flex-1">

                        <div className="flex flex-wrap items-center justify-between gap-3">

                          <div>

                            <h3 className="font-bold text-lg">
                              {item.name}
                            </h3>

                            <p className="text-slate-400 text-sm">
                              {
                                item.service_title
                              }
                            </p>

                          </div>

                          {statusBadge(
                            item.status
                          )}

                        </div>
                             {item.status === "Accepted" && (<>
                            <div className="mt-3">
                                <div className="bg-green-900/30 border border-green-700 rounded-xl p-3">
                                <p className="text-green-400 font-medium">
                                    Contact Number
                                </p>
                                <a
                                    href={`tel:${item.mobile}`}
                                    className="text-white"
                                >
                                    {item.mobile}
                                </a>
                                </div>
                            </div>
                              {item.reviewed > 0 ? (
  <div className="text-green-500">
    ✅ Review Submitted
  </div>
):(
   <div className="mt-4 border border-slate-700 rounded-2xl p-4 bg-slate-900">
                                <h4 className="text-white font-semibold mb-3">
                                ⭐ Leave Review
                                </h4>

                                <select
                                value={
                                    rating[item.id] || ""
                                }
                                onChange={(e) =>
                                    setRating({
                                    ...rating,
                                    [item.id]:
                                        e.target.value
                                    })
                                }
                                className="
                                w-full
                                bg-slate-800
                                border
                                border-slate-700
                                rounded-xl
                                px-4
                                py-3
                                text-white
                                mb-3
                                "
                                >

                                <option value="">
                                    Select Rating
                                </option>

                                <option value="5">
                                    ⭐⭐⭐⭐⭐ Excellent
                                </option>

                                <option value="4">
                                    ⭐⭐⭐⭐ Good
                                </option>

                                <option value="3">
                                    ⭐⭐⭐ Average
                                </option>

                                <option value="2">
                                    ⭐⭐ Poor
                                </option>

                                <option value="1">
                                    ⭐ Very Bad
                                </option>

                                </select>

                                <textarea
                                rows="4"
                                value={
                                    comment[item.id] || ""
                                }
                                onChange={(e) =>
                                    setComment({
                                    ...comment,
                                    [item.id]:
                                        e.target.value
                                    })
                                }
                                placeholder="Write your review..."
                                className="
                                w-full
                                bg-slate-800
                                border
                                border-slate-700
                                rounded-xl
                                px-4
                                py-3
                                text-white
                                mb-3
                                "
                                />

                                <button
                                onClick={() =>
                                    submitReview(item.id)
                                }
                                disabled={
                                    !rating[item.id]
                                }
                                className="
                                px-5
                                py-3
                                rounded-xl
                                bg-amber-500
                                hover:bg-amber-600
                                text-black
                                font-semibold
                                "
                                >
                                Submit Review
                                </button>

                            </div>
)}
                             
                            </>
                            )}
                        <div className="mt-3 text-slate-300">
                          {item.message}
                        </div>
                             <p className="text-xs text-slate-400 mt-2">
                            Requested:
                            {" "}
                            {new Date(
                                item.created_at
                            ).toLocaleString()}
                            </p>
                            {item.action_at && (
                            <p className="text-xs text-green-400 mt-1">
                                Updated:
                                {" "}
                                {new Date(
                                item.action_at
                                ).toLocaleString()}
                            </p>
                            )}

                      </div>

                    </div>

                  </div>

                )
              )}

            {tab ===
              "received" &&
              received.length ===
                0 && (

                <div className="text-center py-10 text-slate-400">
                  No requests received
                </div>

              )}

            {tab === "sent" &&
              sent.length ===
                0 && (

                <div className="text-center py-10 text-slate-400">
                  No requests sent
                </div>

              )}

          </div>

        )}

      </div>

    </div>

  );

}