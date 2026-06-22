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
        `${API_URL}/api/hireme/list`
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
    <div className="container py-4">

      <div className="text-center mb-4">
        <h2 className="fw-bold text-warning">
          💼 Hire Me Directory
        </h2>

        <p className="text-muted">
          Verified professionals available for work
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="alert alert-info text-center">
          No verified profiles found.
        </div>
      ) : (
        <div className="row g-4">

          {profiles.map((item) => (

            <div
              className="col-md-4 col-lg-3"
              key={item.id}
            >
              <div className="card border-0 shadow-sm rounded-4 h-100">

                <div className="card-body text-center">

                  <img
                    src={
                      item.pic ||
                      "/images/default-user.png"
                    }
                    alt={item.name}
                    className="rounded-circle border"
                    style={{
                      width: "90px",
                      height: "90px",
                      objectFit: "cover"
                    }}
                  />

                  <h5 className="mt-3 fw-bold">
                    {item.name}
                  </h5>

                  <div className="small text-muted mb-2">
                    {item.city}
                    {item.state
                      ? `, ${item.state}`
                      : ""}
                  </div>

                  <p className="text-muted mb-2">
                    {item.profession}
                  </p>

                  {item.govt_verified === 1 && (
                    <span className="badge bg-success mb-3">
                      ✓ Verified
                    </span>
                  )}

                  <div className="small text-muted mb-3">
                    {item.experience_years} Years Experience
                  </div>

                  <button
                    className="btn btn-warning w-100"
                    onClick={() =>
                      navigate(
                        `/hire-me/${item.id}`
                      )
                    }
                  >
                    View Profile
                  </button>

                </div>

              </div>
            </div>

          ))}

        </div>
      )}

    </div>
  );
}