import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function HireMeAdmin() {

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {   loadProfiles(); }, []);

  const loadProfiles = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/hireme/admin/hireme`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log(res.data.data);
      setProfiles(res.data.data || []);
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
        `${API_URL}/hireme/admin/hireme/approve/${id}`,
        {}, {
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

  const rejection_reason =
    prompt(
      "Enter rejection reason"
    );
  if (!rejection_reason || !rejection_reason.trim()) {
    return;
  }
  try {
    const token = localStorage.getItem("token");
    await axios.put(
      `${API_URL}/hireme/admin/hireme/reject/${id}`,
      {
        rejection_reason
      },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );
    loadProfiles();
  } catch (err) {
    console.error(err);
    alert(
      err?.response?.data?.message ||
      "Unable to reject profile"
    );
  }
};

  const updatePayment = async (
  id,
  status
) => {

  try {

    const token =
      localStorage.getItem("token");

    await axios.put(
      `${API_URL}/hireme/admin/hireme/payment/${id}`,
      { status },
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    loadProfiles();

  } catch (err) {

    console.error(err);

    alert(
      "Failed to update payment"
    );

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
 <div className="grid gap-5">

  {profiles.map((item) => (

    <div
      key={item.id}
      className="bg-white rounded-4 shadow-sm border p-4"
    >

      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">

        {/* User Info */}

        <div className="flex gap-3">

          <img
            src={
              item.pic ||
              "/images/default-user.png"
            }
            alt=""
            className="w-14 h-14 rounded-full object-cover border"
          />

          <div>

            <h5 className="font-bold mb-1">
              {item.name}
            </h5>

            <p className="text-gray-500 text-sm mb-0">
              {item.email}
            </p>

            <p className="text-gray-500 text-sm">
              {item.mobile}
            </p>

          </div>

        </div>

        {/* Profile Status */}

        <div>

          {item.profile_status ===
          "Approved" ? (

            <span className="px-3 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              Approved
            </span>

          ) : item.profile_status ===
            "Rejected" ? (

            <span className="px-3 py-2 rounded-full bg-red-100 text-red-700 text-sm font-medium">
              Rejected
            </span>

          ) : (

            <span className="px-3 py-2 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
              Pending
            </span>

          )}

        </div>

      </div>

      {/* Service */}

      <div className="mt-4">

        <h6 className="font-semibold">
          {item.service_title}
        </h6>

        <p className="text-sm text-gray-500">
          {item.service_category}
        </p>

        <p className="text-sm mt-2">
          {item.description}
        </p>

      </div>

      {/* Price */}

      <div className="mt-4 flex gap-3 flex-wrap">

        <span className="bg-slate-100 px-3 py-2 rounded-lg">
          ₹{item.rate_amount}
        </span>

        <span className="bg-slate-100 px-3 py-2 rounded-lg">
          {item.rate_type}
        </span>

      </div>

      {/* Payment */}

      <div className="mt-5 border-t pt-4">

        <h6 className="font-semibold mb-3">
          Payment Verification
        </h6>

        <div className="flex flex-wrap items-center gap-3">

          {item.payment_status ===
          "Approved" ? (

            <span className="bg-green-100 text-green-700 px-3 py-2 rounded-full text-sm">
              Verified
            </span>

          ) : item.payment_status ===
            "Rejected" ? (

            <span className="bg-red-100 text-red-700 px-3 py-2 rounded-full text-sm">
              Rejected
            </span>

          ) : (

            <span className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-full text-sm">
              Pending
            </span>

          )}

          {item.payment_screenshot && (

            <a
              href={item.payment_screenshot}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg border text-decoration-none"
            >
              View Payment Proof
            </a>

          )}

          <button
            onClick={() =>
              updatePayment(
                item.id,
                "Approved"
              )
            }
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Verify
          </button>

          <button
            onClick={() =>
              updatePayment(
                item.id,
                "Rejected"
              )
            }
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Reject
          </button>

        </div>

      </div>

      {/* Documents */}

      <div className="mt-5 border-t pt-4">

        <h6 className="font-semibold mb-3">
          Documents
        </h6>

        <div className="flex flex-wrap gap-2">

          {item.service_photo && (
            <a
              href={item.service_photo}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg border text-decoration-none"
            >
              Service Photo
            </a>
          )}

          {item.govt_id_front && (
            <a
              href={item.govt_id_front}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg border text-decoration-none"
            >
              Govt Front
            </a>
          )}

          {item.govt_id_back && (
            <a
              href={item.govt_id_back}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg border text-decoration-none"
            >
              Govt Back
            </a>
          )}

        </div>

      </div>

      {/* Admin Actions */}

      <div className="mt-5 border-t pt-4 flex flex-wrap gap-2">

        <button
          onClick={() =>
            approveProfile(item.id)
          }
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Approve Profile
        </button>

        <button
          onClick={() =>
            rejectProfile(item.id)
          }
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Reject Profile
        </button>

      </div>

    </div>

  ))}

</div>
  );
}