import React, {
  useEffect,
  useState
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

const API =
  import.meta.env.VITE_API_URL;

export default function HireMeEdit() {

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [profile, setProfile] =
    useState(null);

  const [servicePhoto, setServicePhoto] =
    useState(null);

  const [front, setFront] =
    useState(null);

  const [back, setBack] =
    useState(null);

  const token =
    localStorage.getItem("token");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {

    try {

      const res = await axios.get(
        `${API}/hireme/my-profile`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      setProfile(res.data);

    } catch (err) {

      console.log(err);

    }

  };

  const handleChange = (e) => {

    setProfile({
      ...profile,
      [e.target.name]:
        e.target.value
    });

  };

  const handleUpdate = async () => {

    try {

      setLoading(true);

      await axios.put(
        `${API}/hireme/update-profile`,
        {
          service_category:
            profile.service_category,

          service_title:
            profile.service_title,

          rate_type:
            profile.rate_type,

          rate_amount:
            profile.rate_amount,

          description:
            profile.description
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      if (
        servicePhoto ||
        front ||
        back
      ) {

        const fd =
          new FormData();

        if (servicePhoto) {
          fd.append(
            "service_photo",
            servicePhoto
          );
        }

        if (front) {
          fd.append(
            "govt_front",
            front
          );
        }

        if (back) {
          fd.append(
            "govt_back",
            back
          );
        }

        await axios.post(
          `${API}/hireme/upload-documents`,
          fd,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "multipart/form-data"
            }
          }
        );

      }

      alert(
        "Profile updated successfully"
      );

      loadProfile();

    } catch (err) {

      console.log(err);

      alert(
        err?.response?.data
          ?.message ||
        "Update failed"
      );

    } finally {

      setLoading(false);

    }

  };

  const handleResubmit =
    async () => {

      try {

        await axios.post(
          `${API}/hireme/resubmit`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

        alert(
          "Resubmitted successfully"
        );

        loadProfile();

      } catch (err) {

        console.log(err);

      }

    };

  if (!profile)
    return (
      <div className="container py-5 text-center">
        Loading...
      </div>
    );

  const approved =
    profile.profile_status ===
    "Approved";

  return (
    <>
   <div className="max-w-5xl mx-auto px-4 py-8">

  <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">

    <div className="p-6 md:p-8">

      <h3 className="text-3xl font-bold text-orange-500 mb-6">
        ✏️ Edit Hire Me Profile
      </h3>

      {profile.profile_status === "Rejected" && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <h4 className="font-bold text-red-400">
            Verification Rejected
          </h4>

          <p className="text-red-200 mt-2">
            {profile.rejection_reason}
          </p>
        </div>
      )}

      {approved && (
        <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
          <p className="font-semibold text-green-400">
            ✅ Your profile is approved
          </p>
        </div>
      )}

      {/* Service Information */}

      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">

        <h4 className="text-xl font-bold text-orange-500 mb-6">
          Service Information
        </h4>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Service Category
          </label>

          <select
            disabled={approved}
            name="service_category"
            value={profile.service_category}
            onChange={handleChange}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none disabled:opacity-50"
          >
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
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Service Title
          </label>

          <input
            disabled={approved}
            name="service_title"
            value={profile.service_title}
            onChange={handleChange}
            placeholder="Enter service title"
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-5">

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Rate Type
            </label>

            <select
              disabled={approved}
              name="rate_type"
              value={profile.rate_type}
              onChange={handleChange}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none disabled:opacity-50"
            >
              <option>Per Hour</option>
              <option>Per Day</option>
              <option>Fixed Price</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Price (₹)
            </label>

            <input
              type="number"
              disabled={approved}
              name="rate_amount"
              value={profile.rate_amount}
              onChange={handleChange}
              placeholder="Enter amount"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none disabled:opacity-50"
            />
          </div>

        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Description
          </label>

          <textarea
            rows="5"
            disabled={approved}
            name="description"
            value={profile.description}
            onChange={handleChange}
            placeholder="Describe your service..."
            className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none disabled:opacity-50"
          />
        </div>

      </div>

      {/* Documents */}

      {!approved && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">

          <h4 className="text-xl font-bold text-green-500 mb-6">
            📄 Update Documents
          </h4>

          <div className="space-y-5">

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Service Photo
              </label>

              <input
                type="file"
                onChange={(e) =>
                  setServicePhoto(e.target.files[0])
                }
                className="w-full rounded-xl border border-dashed border-slate-600 bg-slate-900 p-3 text-gray-300 file:bg-orange-500 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-lg file:mr-4 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Govt ID Front
              </label>

              <input
                type="file"
                onChange={(e) =>
                  setFront(e.target.files[0])
                }
                className="w-full rounded-xl border border-dashed border-slate-600 bg-slate-900 p-3 text-gray-300 file:bg-orange-500 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-lg file:mr-4 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Govt ID Back
              </label>

              <input
                type="file"
                onChange={(e) =>
                  setBack(e.target.files[0])
                }
                className="w-full rounded-xl border border-dashed border-slate-600 bg-slate-900 p-3 text-gray-300 file:bg-orange-500 file:text-white file:border-0 file:px-4 file:py-2 file:rounded-lg file:mr-4 cursor-pointer"
              />
            </div>

          </div>

        </div>
      )}

      {/* Buttons */}

      <div className="flex flex-wrap gap-4 mt-8">

        {!approved && (
          <button
            disabled={loading}
            onClick={handleUpdate}
            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/30 hover:scale-105 transition-all duration-300 disabled:opacity-50"
          >
            💾 Save Changes
          </button>
        )}

        {profile.profile_status === "Rejected" && (
          <button
            onClick={handleResubmit}
            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 hover:scale-105 transition-all duration-300"
          >
            🔄 Resubmit
          </button>
        )}

        <button
          onClick={() => navigate("/me")}
          className="px-6 py-3 rounded-xl font-bold bg-white text-red-500 hover:scale-105 transition-all duration-300 shadow-lg"
        >
          ← Back
        </button>

      </div>

    </div>

  </div>

</div>
</>
  );

}