import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function HireMeProfile() {

  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);
  const loadProfile = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/hireme/profile/${id}`
      );
      setProfile(res.data.profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendHireRequest = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/hireme/hire-request`,
        {
          candidate_id: profile.user_id,
          message
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Hire request sent.");

      setMessage("");

    } catch (err) {

      console.error(err);

      alert(
        err?.response?.data?.message ||
        "Unable to send request"
      );

    } finally {

      setSending(false);

    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Profile not found.
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-slate-50 py-10">

    <div className="max-w-5xl mx-auto px-4">

      <div className="bg-white rounded-[30px] shadow-lg overflow-hidden">

        {/* Cover */}

        <div className="h-56 bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500 relative">

          <img
            src={
              profile.pic ||
              "/images/default-user.png"
            }
            alt={profile.name}
            className="
              absolute
              left-1/2
              bottom-0
              translate-y-1/2
              -translate-x-1/2
              w-40
              h-40
              rounded-full
              border-[6px]
              border-white
              object-cover
              shadow-xl
            "
          />

        </div>

        {/* Content */}

        <div className="pt-24 p-8">

          <div className="text-center">

            <h1 className="text-4xl font-bold text-slate-800">
              {profile.name}
            </h1>

            <p className="text-slate-500 mt-2">
              {profile.city}
              {profile.state
                ? `, ${profile.state}`
                : ""}
            </p>

            <div className="flex justify-center gap-3 mt-4 flex-wrap">

              <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium">
                ✓ Verified Professional
              </span>

              <span className="px-4 py-2 rounded-full bg-orange-100 text-orange-600 font-medium">
                {profile.service_category}
              </span>

            </div>

          </div>

          {/* Service */}

          <div className="mt-10 grid md:grid-cols-2 gap-8">

            <div>

              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Service Details
              </h2>

              <div className="space-y-4">

                <div>
                  <div className="text-sm text-slate-500">
                    Service
                  </div>

                  <div className="font-semibold text-lg">
                    {profile.service_title}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-500">
                    Rate
                  </div>

                  <div className="font-semibold text-lg text-green-600">
                    ₹{profile.rate_amount}
                  </div>

                  <div className="text-slate-500">
                    {profile.rate_type}
                  </div>
                </div>

              </div>

            </div>

            {/* Service Image */}

            <div>

              {profile.service_photo ? (

                <img
                  src={profile.service_photo}
                  alt=""
                  className="
                    w-full
                    h-72
                    rounded-3xl
                    object-cover
                    shadow-md
                  "
                />

              ) : (

                <div
                  className="
                    h-72
                    rounded-3xl
                    bg-slate-100
                    flex
                    items-center
                    justify-center
                    text-slate-400
                  "
                >
                  No Service Photo
                </div>

              )}

            </div>

          </div>

          {/* Description */}

          <div className="mt-10">

            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              About Service
            </h2>

            <div className="bg-slate-50 rounded-3xl p-6 text-slate-600 leading-8">
              {profile.description}
            </div>

          </div>

          {/* Contact */}

          <div className="mt-10">

            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Contact Professional
            </h2>

            <div className="bg-white border rounded-3xl p-6">

              <textarea
                rows={5}
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                placeholder="Describe your work requirement..."
                className="
                  w-full
                  border
                  rounded-2xl
                  p-4
                  outline-none
                  focus:ring-2
                  focus:ring-orange-400
                "
              />

              <button
                disabled={sending}
                onClick={sendHireRequest}
                className="
                  w-full
                  mt-4
                  bg-orange-500
                  hover:bg-orange-600
                  text-white
                  font-semibold
                  py-4
                  rounded-2xl
                  transition
                "
              >
                {sending
                  ? "Sending..."
                  : "Send Hire Request"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
);
}