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
    <div className="container py-4">

      <div
        className="card border-0"
        style={{
          borderRadius: "22px",
          background:
            "#0f172a",
          color: "#fff"
        }}
      >

        <div className="card-body p-4">

          <h3
            className="fw-bold mb-4"
            style={{
              color: "#f97316"
            }}
          >
            ✏️ Edit Hire Me Profile
          </h3>

          {profile.profile_status ===
            "Rejected" && (
            <div className="alert alert-danger">

              <strong>
                Verification Rejected
              </strong>

              <br />

              {
                profile.rejection_reason
              }

            </div>
          )}

          {approved && (
            <div className="alert alert-success">

              Your profile is approved.

            </div>
          )}

          <div className="section-card mb-4">

  <h5
    className="fw-bold mb-4"
    style={{ color:"#f97316" }}
  >
    Service Information
  </h5>

  <div className="mb-3">

    <label className="form-label text-light fw-semibold">
      Service Category
    </label>

    <select
      disabled={approved}
      name="service_category"
      value={profile.service_category}
      onChange={handleChange}
      className="form-select dark-input"
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

  <div className="mb-3">

    <label className="form-label text-light fw-semibold">
      Service Title
    </label>

    <input
      disabled={approved}
      name="service_title"
      value={profile.service_title}
      onChange={handleChange}
      className="form-control dark-input"
      placeholder="Enter service title"
    />

  </div>

  <div className="row">

    <div className="col-md-6 mb-3">

      <label className="form-label text-light fw-semibold">
        Rate Type
      </label>

      <select
        disabled={approved}
        name="rate_type"
        value={profile.rate_type}
        onChange={handleChange}
        className="form-select dark-input"
      >
        <option>Per Hour</option>
        <option>Per Day</option>
        <option>Fixed Price</option>
      </select>

    </div>

    <div className="col-md-6 mb-3">

      <label className="form-label text-light fw-semibold">
        Price (₹)
      </label>

      <input
        disabled={approved}
        type="number"
        name="rate_amount"
        value={profile.rate_amount}
        onChange={handleChange}
        className="form-control dark-input"
        placeholder="Enter amount"
      />

    </div>

  </div>

  <div>

    <label className="form-label text-light fw-semibold">
      Description
    </label>

    <textarea
      rows="5"
      disabled={approved}
      name="description"
      value={profile.description}
      onChange={handleChange}
      className="form-control dark-input"
      placeholder="Describe your service..."
    />

  </div>

</div>

         {!approved && (

<div className="section-card">

  <h5
    className="fw-bold mb-4"
    style={{ color:"#22c55e" }}
  >
    📄 Update Documents
  </h5>

  <div className="upload-box mb-3">

    <label className="form-label fw-semibold text-light">
      Service Photo
    </label>

    <input
      type="file"
      className="form-control dark-input"
      onChange={(e)=>
        setServicePhoto(
          e.target.files[0]
        )
      }
    />

  </div>

  <div className="upload-box mb-3">

    <label className="form-label fw-semibold text-light">
      Govt ID Front
    </label>

    <input
      type="file"
      className="form-control dark-input"
      onChange={(e)=>
        setFront(
          e.target.files[0]
        )
      }
    />

  </div>

  <div className="upload-box">

    <label className="form-label fw-semibold text-light">
      Govt ID Back
    </label>

    <input
      type="file"
      className="form-control dark-input"
      onChange={(e)=>
        setBack(
          e.target.files[0]
        )
      }
    />

  </div>

</div>

)}
 <div className="d-flex flex-wrap gap-3 mt-4">

  {!approved && (
    <button
      className="btn btn-warning px-4 py-2 fw-bold"
      disabled={loading}
      onClick={handleUpdate}
      style={{
                    background:
                    "linear-gradient(35deg,#ff9800,#ff5722)",
                    color: "#fff",
                    borderRadius: "16px",
                    padding: "14px",
                    fontSize: "16px",
                    letterSpacing: ".3px",
                    boxShadow:
                    "0 8px 20px rgba(255,152,0,.35)"
                }}
    >
      💾 Save Changes
    </button>
  )}

  {profile.profile_status === "Rejected" && (
    <button
      className="btn btn-success px-4 py-2 fw-bold"
      onClick={handleResubmit}
      style={{
                    background:
                    "linear-gradient(35deg,#ff9800,#ff5722)",
                    color: "#fff",
                    borderRadius: "16px",
                    padding: "14px",
                    fontSize: "16px",
                    letterSpacing: ".3px",
                    boxShadow:
                    "0 8px 20px rgba(255,152,0,.35)"
                }}
    >
      🔄 Resubmit
    </button>
  )}

  <button
    className="btn btn-outline-light px-4 py-2"
   style={{
                    background:
                    "linear-gradient(35deg,#cccccc,#ffffff)",
                    color: "#fa0e0e",
                    borderRadius: "16px",
                    padding: "14px",
                    fontSize: "16px",
                    letterSpacing: ".3px",
                    boxShadow:
                    "0 8px 20px rgba(255,152,0,.35)"
                }}
    onClick={() =>
      navigate("/me")
    }
  >
    ← Back
  </button>

</div></div></div></div>
</>
  );

}