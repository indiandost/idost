import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function HireMeDirectory() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/hireme/list`
      );

      setProfiles(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning"></div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-slate-50 py-10">

    {/* Header */}

    <div className="max-w-7xl mx-auto px-4 mb-10">

      <div className="text-center">

        <span className="inline-block px-4 py-2 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-3">
          VERIFIED PROFESSIONALS
        </span>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
          💼 Hire Me Directory
        </h1>

        <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
          Discover trusted service providers near you.
          Browse verified professionals and hire with confidence.
        </p>

      </div>

    </div>

    {/* Empty State */}

    {profiles.length === 0 ? (

      <div className="max-w-md mx-auto bg-white rounded-3xl shadow p-8 text-center">

        <div className="text-6xl mb-3">
          😔
        </div>

        <h3 className="text-xl font-bold text-slate-700">
          No Professionals Found
        </h3>

        <p className="text-slate-500 mt-2">
          No verified profiles are available right now.
        </p>

      </div>

    ) : (

      <div className="max-w-7xl mx-auto px-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {profiles.map((item) => (

            <div
              key={item.id}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
            >

              {/* Cover */}

              <div className="relative h-28 bg-gradient-to-r from-orange-500 via-amber-500 to-pink-500">

                <img
                  src={
                    item.pic ||
                    "/images/default-user.png"
                  }
                  alt={item.name}
                  className="absolute left-1/2 -bottom-10 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
                />

              </div>

              {/* Body */}

              <div className="pt-14 p-5 text-center">

                <h3 className="font-bold text-lg text-slate-800">
                  {item.name}
                </h3>

                <div className="text-sm text-slate-500 mt-1">
                  {item.city}
                  {item.state
                    ? `, ${item.state}`
                    : ""}
                </div>

                <div className="mt-3">

                  <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold">
                    {item.service_category}
                  </span>

                </div>

                <h4 className="mt-3 font-semibold text-slate-700 min-h-[48px]">
                  {item.service_title}
                </h4>

                <p className="text-sm text-slate-500 mt-2 line-clamp-3 min-h-[60px]">
                  {item.description}
                </p>

                {/* Rate */}

                <div className="mt-4 flex justify-center gap-2 flex-wrap">

                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    ₹{item.rate_amount}
                  </span>

                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                    {item.rate_type}
                  </span>

                </div>

                {/* Verified */}

                <div className="mt-4">

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
                    ✓ Verified
                  </span>

                </div>

                {/* Service Image */}

                {item.service_photo && (

                  <a
                    href={item.service_photo}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-4 text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Service Photo
                  </a>

                )}

                {/* Button */}

                <button
                  onClick={() =>
                    navigate(`/hire-me/${item.id}`)
                  }
                  className="mt-5 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-2xl transition-all duration-300"
                >
                  View Profile
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    )}

  </div>
);
}