import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function HireMeAdmin() {

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {

      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_URL}/api/admin/hireme`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setProfiles(res.data || []);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }
  };

  const approveProfile = async (id) => {

    if (!window.confirm("Approve this profile?"))
      return;

    try {

      const token = localStorage.getItem("token");

      await axios.put(
        `${API_URL}/api/admin/hireme/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      loadProfiles();

    } catch (err) {

      console.error(err);
      alert("Unable to approve profile");

    }

  };

  const rejectProfile = async (id) => {

    if (!window.confirm("Reject this profile?"))
      return;

    try {

      const token = localStorage.getItem("token");

      await axios.put(
        `${API_URL}/api/admin/hireme/reject/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      loadProfiles();

    } catch (err) {

      console.error(err);
      alert("Unable to reject profile");

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
    <div className="container-fluid py-4">

      <div className="d-flex justify-content-between align-items-center mb-4">

        <h2 className="fw-bold text-warning">
          💼 Hire Me Applications
        </h2>

        <button
          className="btn btn-warning"
          onClick={loadProfiles}
        >
          Refresh
        </button>

      </div>

      {profiles.length === 0 ? (

        <div className="alert alert-info">
          No applications found.
        </div>

      ) : (

        <div className="table-responsive">

          <table className="table table-bordered table-hover align-middle">

            <thead className="table-light">

              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Profession</th>
                <th>Experience</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Resume</th>
                <th>Govt ID</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {profiles.map((item) => (

                <tr key={item.id}>

                  <td>{item.id}</td>

                  <td>

                    <div className="d-flex align-items-center gap-2">

                      <img
                        src={
                          item.pic ||
                          "/images/default-user.png"
                        }
                        alt=""
                        width="40"
                        height="40"
                        className="rounded-circle"
                        style={{
                          objectFit: "cover"
                        }}
                      />

                      <div>

                        <div className="fw-bold">
                          {item.name}
                        </div>

                        <small>
                          {item.email}
                        </small>

                        <br />

                        <small>
                          {item.mobile}
                        </small>

                      </div>

                    </div>

                  </td>

                  <td>{item.profession}</td>

                  <td>
                    {item.experience_years} Years
                  </td>

                  <td>

                    {item.payment_status ===
                    "Paid" ? (

                      <span className="badge bg-success">
                        Paid
                      </span>

                    ) : (

                      <span className="badge bg-danger">
                        Unpaid
                      </span>

                    )}

                  </td>

                  <td>

                    {item.profile_status ===
                    "Approved" && (

                      <span className="badge bg-success">
                        Approved
                      </span>

                    )}

                    {item.profile_status ===
                    "Pending" && (

                      <span className="badge bg-warning text-dark">
                        Pending
                      </span>

                    )}

                    {item.profile_status ===
                    "Rejected" && (

                      <span className="badge bg-danger">
                        Rejected
                      </span>

                    )}

                  </td>

                  <td>

                    {item.resume_file ? (

                      <a
                        href={item.resume_file}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        Resume
                      </a>

                    ) : (
                      "-"
                    )}

                  </td>

                  <td>

                    <div className="d-flex gap-2">

                      {item.govt_id_front && (
                        <a
                          href={item.govt_id_front}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-secondary"
                        >
                          Front
                        </a>
                      )}

                      {item.govt_id_back && (
                        <a
                          href={item.govt_id_back}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-secondary"
                        >
                          Back
                        </a>
                      )}

                    </div>

                  </td>

                  <td>

                    <div className="d-flex gap-2">

                      <button
                        className="btn btn-success btn-sm"
                        onClick={() =>
                          approveProfile(item.id)
                        }
                      >
                        Approve
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          rejectProfile(item.id)
                        }
                      >
                        Reject
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}