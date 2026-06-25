import React, {
  useEffect,
  useState
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import qrImage from "../assets/qr.png";

const API =
  import.meta.env.VITE_API_URL;

export default function HireMePayment() {

  const navigate = useNavigate();

  const token =  localStorage.getItem("token");

  const [loading, setLoading] =  useState(false);

  const [profile, setProfile] =  useState(null);

  const [transactionId,   setTransactionId] =  useState("");

  const [screenshot,   setScreenshot] =    useState(null);

  useEffect(() => { loadProfile();  }, []);

  const loadProfile = async () => {
    try {
      const res =
        await axios.get(
          `${API}/hireme/my-profile`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setProfile(res.data);
      setTransactionId(
        res.data?.transaction_id || ""
      );

    } catch (err) {

      console.log(err);

    }

  };

  const handleSubmit =
    async () => {

      if (!transactionId.trim() ) {
        alert(
          "Enter transaction ID"
        );
        return;
      }

      if (!screenshot) {  alert( "Upload payment screenshot" );
        return;
      }

      try {
        setLoading(true);

        const formData =
          new FormData();

        formData.append(
          "transaction_id",
          transactionId
        );

        formData.append(
          "payment_screenshot",
          screenshot
        );

        await axios.post(
          `${API}/hireme/submit-payment`,
          formData,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "multipart/form-data"
            }
          }
        );

        alert(
          "Payment submitted successfully"
        );

        loadProfile();

      } catch (err) {

        console.log(err);

        alert(
          err?.response?.data
            ?.message ||
          "Failed to submit payment"
        );

      } finally {

        setLoading(false);

      }

    };

  if (!profile) {
    return (
      <div className="container py-5 text-center">
        Loading...
      </div>
    );
  }

  const paymentApproved =
    profile.payment_status ===
    "Approved";

  const paymentPending =
    profile.payment_status ===
    "Pending";

  return (
  <div className="container py-5">
    <div
      className="card border-0 shadow-lg overflow-hidden"
      style={{
        borderRadius: "24px",
        background:
          "linear-gradient(135deg,#0f172a,#1e293b)",
        color: "#fff"
      }}
    >
      <div className="card-body p-lg-5 p-4">

        <div className="text-center mb-4">
          <h2
            className="fw-bold mb-2"
            style={{
              color: "#f97316"
            }}
          >
            💳 Hire Me Verification
          </h2>

          <p
            className="mb-0"
            style={{
              color: "#cbd5e1"
            }}
          >
            Pay ₹49 verification fee to activate your
            Hire Me profile.
          </p>
        </div>

        {/* Status */}

        {paymentApproved && (
          <div className="alert alert-success text-center">
            ✅ Payment Verified Successfully
          </div>
        )}

        {paymentPending && (
          <div className="alert alert-info text-center">
            ⏳ Payment Under Review
          </div>
        )}

        {!paymentApproved && (
          <div className="row g-4 align-items-center">

            {/* Left QR Section */}

            <div className="col-lg-5">
              <div
                className="text-center p-4"
                style={{
                  background:
                    "rgba(255,255,255,0.05)",
                  borderRadius: "20px"
                }}
              >
                   <img
                    src={qrImage}
                    alt="QR Code"
                   className="w-64 mx-auto rounded-xl mb-4"
                    style={{
                           maxWidth: "220px"
                         }}
                   />
                    <p className="text-white">indiandost2-1@okicici</p>
                <div className="mt-4">
                  <h4
                    className="fw-bold"
                    style={{
                      color: "#facc15"
                    }}
                  >
                    ₹49 Only
                  </h4>

                  <p
                    className="mb-0"
                    style={{
                      color: "#cbd5e1"
                    }}
                  >
                    Scan using PhonePe, GPay,
                    Paytm or any UPI App
                  </p>
                </div>
              </div>
            </div>

            {/* Right Form Section */}

            <div className="col-lg-7">

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  UPI Transaction ID
                </label>

                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) =>
                    setTransactionId(
                      e.target.value
                    )
                  }
                 className="form-control form-control-lg text-white"
                    placeholder="Enter UPI Reference Number"
                    style={{
                        borderRadius: "14px",
                        background: "#1e293b",
                        border: "1px solid #475569",
                        color: "#fff"
                    }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Payment Screenshot
                </label>

                <input
                  type="file"
                  accept="image/*"
                  className="form-control form-control-lg"
                  style={{
                    borderRadius: "14px"
                  }}
                  onChange={(e) =>
                    setScreenshot(
                      e.target.files[0]
                    )
                  }
                />
              </div>

              <div className="d-grid gap-3">

                <button
                  className="btn btn-warning btn-lg fw-bold"
                  onClick={handleSubmit}
                  disabled={loading}
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
                  {loading
                    ? "Submitting..."
                    : "🚀 Submit Payment"}
                </button>

                <button
                  className="btn btn-outline-light btn-lg"
                  onClick={() =>
                    navigate("/me")
                  }
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
                >
                  ← Back To Profile
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  </div>
);

}