import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const API_URL = import.meta.env.VITE_API_URL;
export default function HireMeDirectory() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openReviews, setOpenReviews] = useState(null);
  const navigate = useNavigate();
const [filters, setFilters] = useState({
  keyword: "",
  category: "",
  city: "",
  minRating: "",
  sort: "",
  lat: "",
  lng: "",
  radius: ""
});

useEffect(() => {
navigator.geolocation.getCurrentPosition((pos) => {
  setFilters(prev => ({
    ...prev,
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    sort: "nearest"
   }));
  });
});
const getMyLocation = () => {
  navigator.geolocation.getCurrentPosition((pos) => {
    setFilters(prev => ({
      ...prev,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      sort: "nearest"
    }));
  });
};
 /* const fetchProfiles = async () => {
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
*/
const fetchProfiles = async () => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const res = await axios.get(
      `${API_URL}/hireme/list?${params.toString()}`
    );

    setProfiles(res.data || []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
  
useEffect(() => {
    fetchProfiles();
}, [filters]);



  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning"></div>
      </div>
    );
  }

return (
  <>
  <Helmet>
  <title>
    Hire Trusted Professionals Near You | IndianDost Hire Me Directory
  </title>

  <meta
    name="description"
    content="Browse verified service providers on IndianDost Hire Me Directory. Find cleaners, drivers, tutors, plumbers, electricians, fitness trainers, photographers, and more near you."
  />
</Helmet>
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
<div
  className="mt-2 mb-3 px-3 py-2 d-flex align-items-center justify-content-between"
  style={{
    background: "linear-gradient(135deg,#ec4899,#7c3aed)",
    borderRadius: "14px"
  }}
>
  <div
    className="text-white"
    style={{
      fontSize: "14px",
      fontWeight: 600
    }}
  >
    💼 Offer Your Services & Get Direct Hire Requests
  </div>

  <button
    onClick={() => navigate("/hire-me-enroll")}
    className="border-0"
    style={{
      background: "#fff",
      color: "#7c3aed",
      borderRadius: "10px",
      padding: "5px 12px",
      fontSize: "12px",
      fontWeight: 600
    }}
  >
    ₹49 Enroll
  </button>
</div>
      </div>

    </div>
<div className="max-w-7xl mx-auto px-4 mb-6">

  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">

    <div className="flex flex-wrap gap-3 items-center">

      {/* Near Me Button */}

      <button
        onClick={getMyLocation}
        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium whitespace-nowrap"
      >
        📍 Near Me
      </button>

      {/* Category */}

      <select
        className="px-3 py-2 rounded-xl border border-slate-300 text-sm min-w-[180px]"
        value={filters.category}
        onChange={(e) =>
          setFilters({
            ...filters,
            category: e.target.value
          })
        }
      >
        <option value="">All Categories</option>
        <option>House Cleaning</option>
        <option>Laundry Service</option>
        <option>Shopping Helper</option>
        <option>Driver</option>
        <option>Elder Care</option>
        <option>Massage Service</option>
        <option>Yoga Trainer</option>
        <option>Fitness Trainer</option>
        <option>Home Cook</option>
        <option>Babysitter</option>
        <option>Tutor</option>
        <option>Electrician</option>
        <option>Plumber</option>
        <option>Beautician</option>
        <option>Photographer</option>
        <option>Mobile Repair</option>
        <option>Computer Repair</option>
        <option>Other</option>
      </select>

      {/* Distance */}

      <select
        className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
        value={filters.radius}
        onChange={(e) =>
          setFilters({
            ...filters,
            radius: e.target.value
          })
        }
      >
        <option value="">Distance</option>
        <option value="5">5 KM</option>
        <option value="10">10 KM</option>
        <option value="25">25 KM</option>
        <option value="50">50 KM</option>
        <option value="100">100 KM</option>
      </select>

      {/* Rating */}

      <select hidden
        className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
        value={filters.minRating}
        onChange={(e) =>
          setFilters({
            ...filters,
            minRating: e.target.value
          })
        }
      >
        <option value="">Rating</option>
        <option value="4">⭐ 4+ Stars</option>
        <option value="3">⭐ 3+ Stars</option>
      </select>

      {/* Sort */}

      <select hidden
        className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
        value={filters.sort}
        onChange={(e) =>
          setFilters({
            ...filters,
            sort: e.target.value
          })
        }
      >
        <option value="">Sort By</option>
        <option value="nearest">Nearest</option>
        <option value="rating">Top Rated</option>
        <option value="price_low">Lowest Price</option>
        <option value="price_high">Highest Price</option>
      </select>

      {/* City */}

      <input
        type="text"
        placeholder="City"
        value={filters.city}
        onChange={(e) =>
          setFilters({
            ...filters,
            city: e.target.value
          })
        }
        className="px-3 py-2 rounded-xl border border-slate-300 text-sm w-[140px]"
      />

      {/* Clear */}

      <button
        onClick={() =>
          setFilters({
            keyword: "",
            category: "",
            city: "",
            minRating: "",
            sort: "",
            radius: "",
            lat: "",
            lng: ""
          })
        }
        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm"
      >
        Reset
      </button>

    </div>

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
              <span className="text-sm text-slate-500">
                📍 {Number(item.distance).toFixed(1)} KM away
              </span>

            </div>
      
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
  </>
);
}