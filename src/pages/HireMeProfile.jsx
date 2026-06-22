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
        `${API_URL}/api/hireme/profile/${id}`
      );

      setProfile(res.data);

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

      const token =
        localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/hire-request`,
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
    <div className="container py-4">

      <div className="row justify-content-center">

        <div className="col-lg-8">

          <div className="card border-0 shadow rounded-4">

            <div className="card-body p-4">

              <div className="text-center">

                <img
                  src={
                    profile.pic ||
                    "/images/default-user.png"
                  }
                  alt={profile.name}
                  className="rounded-circle border"
                  style={{
                    width: "130px",
                    height: "130px",
                    objectFit: "cover"
                  }}
                />

                <h2 className="mt-3 fw-bold">
                  {profile.name}
                </h2>

                <div className="text-muted">
                  {profile.city}
                  {profile.state
                    ? `, ${profile.state}`
                    : ""}
                </div>

                {profile.govt_verified === 1 && (
                  <span className="badge bg-success mt-2">
                    ✓ Verified Professional
                  </span>
                )}

              </div>

              <hr />

              <div className="row">

                <div className="col-md-6 mb-3">
                  <strong>Profession</strong>
                  <div>{profile.profession}</div>
                </div>

                <div className="col-md-6 mb-3">
                  <strong>Experience</strong>
                  <div>
                    {profile.experience_years} Years
                  </div>
                </div>

              </div>

              {profile.current_company && (
                <div className="mb-3">
                  <strong>
                    Current Company
                  </strong>

                  <div>
                    {profile.current_company}
                  </div>
                </div>
              )}

              <div className="mb-3">

                <strong>Skills</strong>

                <div className="mt-2">
                  {profile.skills}
                </div>

              </div>

              <div className="mb-4">

                <strong>About</strong>

                <div className="mt-2">
                  {profile.bio}
                </div>

              </div>

              {profile.resume_file && (

                <div className="mb-4">

                  <a
                    href={profile.resume_file}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-primary"
                  >
                    View Resume
                  </a>

                </div>

              )}

              <hr />

              <h5 className="fw-bold mb-3">
                Hire This Professional
              </h5>

              <textarea
                className="form-control mb-3"
                rows="5"
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                placeholder="Describe your project, job offer or requirement..."
              />

              <button
                className="btn btn-warning w-100 fw-bold"
                disabled={sending}
                onClick={sendHireRequest}
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
  );
}