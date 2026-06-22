import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function HireMeEnroll() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

const [form, setForm] = useState({
  service_category: "",
  service_title: "",
  rate_type: "Per Hour",
  rate_amount: "",
  description: "",
  govt_id_type: "Aadhaar"
});

const [servicePhoto, setServicePhoto] = useState(null);
const [front, setFront] = useState(null);
const [back, setBack] = useState(null);

const [errors, setErrors] = useState({});
//const [agree, setAgree] = useState(false);
const [agreeTerms, setAgreeTerms] = useState(false);
const [showAgreement, setShowAgreement] = useState(false);
const [paymentOption, setPaymentOption] = useState("later"); // now / later
const [paymentScreenshot, setPaymentScreenshot] =  useState(null);
const [message, setMessage] = useState("");
const [transactionId, setTransactionId] = useState("");
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {

  // Validation
 console.log("SUBMIT CLICK");
  console.log("agreeTerms =", agreeTerms);
  if (!form.service_category) {
    alert("Please select service category");
    return;
  }

  if (
    !form.service_title ||
    form.service_title.trim().length < 3
  ) {
    alert("Please enter service title");
    return;
  }

  if (
    !form.description ||
    form.description.trim().length < 30
  ) {
    alert(
      "Please describe your service in at least 30 characters"
    );
    return;
  }

  if (
    !form.rate_amount ||
    Number(form.rate_amount) <= 0
  ) {
    alert("Please enter valid pricing");
    return;
  }

  if (!servicePhoto) {
    alert("Please upload service photo");
    return;
  }

  if (!front) {
    alert("Please upload Govt ID Front");
    return;
  }

  if (!back) {
    alert("Please upload Govt ID Back");
    return;
  }

if (!agreeTerms) {
 alert("Please accept agreement");
    return;
 }
if (paymentOption === "now") {
  if (!transactionId.trim()) {

  alert(
    "Please enter transaction ID"
  );

  return;

}

if (!paymentScreenshot) {

  alert(
    "Please upload payment screenshot"
  );

  return;

} }
  try {

    setLoading(true);

    const token =
      localStorage.getItem("token");

    // STEP 1
await axios.post(
  `${API_URL}/hireme/enroll`,
  {
    service_category: form.service_category,
    service_title: form.service_title,
    rate_type: form.rate_type,
    rate_amount: form.rate_amount,
    description: form.description,

    transaction_id:
      paymentOption === "now"
        ? transactionId
        : "",

    payment_verify_option:
      paymentOption,

    agreement_accepted:
      agreeTerms
  },
  {
    headers: {
      Authorization:
        `Bearer ${token}`
    }
  }
);

    // STEP 2 Upload Files

    const formData = new FormData();

    formData.append(
      "service_photo",
      servicePhoto
    );

    formData.append(
      "govt_front",
      front
    );

    formData.append(
      "govt_back",
      back
    );

    formData.append(
      "govt_id_type",
      form.govt_id_type
    );
formData.append(
  "payment_screenshot",
  paymentScreenshot
);

formData.append(
  "transaction_id",
  transactionId
);
    await axios.post(
      `${API_URL}/hireme/upload-documents`,
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
      "Enrollment submitted successfully."
    );

    navigate("/hireme-payment");

  } catch (err) {

    console.error(err);

    alert(
      err?.response?.data?.message ||
      "Something went wrong"
    );

  } finally {

    setLoading(false);

  }

};

  return (
  <div className="max-w-4xl mx-auto px-4 py-6">

    {/* Header */}

    <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center shadow-lg">

      <h1 className="text-3xl font-bold text-orange-400 mb-2">
        💼 Offer Your Services
      </h1>

      <p className="text-gray-300">
        Get verified and receive service requests from IndianDost members.
      </p>

    </div>

    {/* Benefits */}

    <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 mb-6">

      <h3 className="text-green-300 font-bold mb-3">
        Verification Benefits
      </h3>

      <div className="grid md:grid-cols-2 gap-2 text-gray-300">

        <div>✅ Verified Badge</div>
        <div>✅ Listed In Service Directory</div>
        <div>✅ Direct Hire Requests</div>
        <div>✅ Trusted By Members</div>
        <div>✅ Priority Visibility</div>
        <div>✅ One Time Verification</div>

      </div>

    </div>

    {/* Form */}

    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">

      <div className="grid md:grid-cols-2 gap-4">

        {/* Service Category */}

        <div>

          <select
            name="service_category"
            value={form.service_category}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
          >

            <option value="">
              Select Service *
            </option>

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

        {/* Service Title */}

        <div>

          <input
            type="text"
            name="service_title"
            placeholder="Service Title *"
            value={form.service_title}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
          />

        </div>

      </div>

      {/* Pricing */}

      <div className="grid md:grid-cols-2 gap-4 mt-4">

        <select
          name="rate_type"
          value={form.rate_type}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        >
          <option>Per Hour</option>
          <option>Per Day</option>
          <option>Per Visit</option>
          <option>Fixed Price</option>
        </select>

        <input
          type="number"
          name="rate_amount"
          placeholder="Price (₹)"
          value={form.rate_amount}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        />

      </div>

      {/* Description */}

      <div className="mt-4">

        <textarea
          rows="5"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your service, experience and availability..."
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        />

      </div>

      {/* Service Photo */}

      <div className="mt-5">

        <label className="block text-gray-300 mb-2">
          Service Photo
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setServicePhoto(
              e.target.files[0]
            )
          }
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
        />

        {servicePhoto && (
          <p className="text-green-400 text-sm mt-2">
            ✓ {servicePhoto.name}
          </p>
        )}

      </div>

      {/* Verification */}

      <div className="bg-gray-900 rounded-xl p-4 mt-6">

        <h3 className="text-orange-400 font-bold mb-4">
          Identity Verification
        </h3>

        <select
          name="govt_id_type"
          value={form.govt_id_type}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white mb-4"
        >

          <option>Aadhaar</option>
          <option>PAN</option>
          <option>Driving Licence</option>
          <option>Passport</option>
          <option>Voter ID</option>

        </select>

        <div className="grid md:grid-cols-2 gap-4">

          <div>

            <label className="block text-gray-300 mb-2">
              Govt ID Front
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFront(
                  e.target.files[0]
                )
              }
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
            />

          </div>

          <div>

            <label className="block text-gray-300 mb-2">
              Govt ID Back
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setBack(
                  e.target.files[0]
                )
              }
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white"
            />

          </div>

        </div>

      </div>

      {/* Fee */}

 <div className="bg-orange-900/20 border border-orange-500 rounded-xl p-4 mt-6">

  <div className="text-center">

    <div className="text-gray-300">
      Verification Fee
    </div>

    <div className="text-4xl font-bold text-orange-400">
      ₹49
    </div>

    <div className="text-gray-400 text-sm">
      One Time Verification Fee
    </div>

  </div>

</div>

{paymentOption === "now" && (

<div className="bg-gray-900 rounded-xl p-5 mt-6">

  <h3 className="text-orange-400 font-bold mb-4">
    Payment Verification
  </h3>

  <div className="text-center">

    <img
      src="/images/hireme-qr.jpg"
      alt="UPI QR"
      className="mx-auto rounded-lg mb-4"
      style={{
        maxWidth: "220px"
      }}
    />

    <p className="text-gray-300">
      Scan and Pay ₹49
    </p>

  </div>

  <input
    type="text"
    placeholder="Transaction ID"
    value={transactionId}
    onChange={(e) =>
      setTransactionId(
        e.target.value
      )
    }
    className="
      w-full
      mt-4
      p-3
      rounded-lg
      bg-gray-700
      border
      border-gray-600
      text-white
    "
  />

  <div className="mt-4">

    <label className="block text-gray-300 mb-2">
      Payment Screenshot
    </label>

    <input
      type="file"
      accept="image/*"
      onChange={(e) =>
        setPaymentScreenshot(
          e.target.files[0]
        )
      }
      className="
        w-full
        p-3
        rounded-lg
        bg-gray-700
        border
        border-gray-600
        text-white
      "
    />

  </div>

</div>

)}

<div className="bg-gray-900 rounded-xl p-4 mt-5">

  <div className="flex items-start gap-3">

<input
  type="checkbox"
  checked={agreeTerms}
  onChange={(e) =>
    setAgreeTerms(e.target.checked)
  }
     className="mt-1"
    />

    <div>

      <div className="text-white text-sm">

        I agree to the

        <button
          type="button"
          onClick={() =>
            setShowAgreement(true)
          }
          className="
            text-orange-400
            ml-1
            underline
          "
        >
          Hire Me Terms & Verification Agreement {String(agreeTerms)}
        </button>

      </div>

    </div>

  </div>

</div>



      {/* Submit */}
<div className="bg-gray-900 rounded-xl p-5 mt-5">

  <h3 className="text-orange-400 font-bold mb-4">
    Payment Option
  </h3>

  <div className="grid grid-cols-2 gap-3">

    <button
      type="button"
      onClick={() =>
        setPaymentOption("now")
      }
      className={`
        p-3 rounded-lg border
        ${
          paymentOption === "now"
            ? "border-orange-500 bg-orange-500 text-white"
            : "border-gray-600 text-gray-300"
        }
      `}
    >
      Pay Now
    </button>

    <button
      type="button"
      onClick={() =>
        setPaymentOption("later")
      }
      className={`
        p-3 rounded-lg border
        ${
          paymentOption === "later"
            ? "border-orange-500 bg-orange-500 text-white"
            : "border-gray-600 text-gray-300"
        }
      `}
    >
      Pay Later
    </button>

  </div>

  <div className="text-xs text-gray-400 mt-3">

    You can submit payment
    details anytime later from
    your Hire Me profile.

  </div>

</div>
      <button
  disabled={loading}
  onClick={handleSubmit}
  className="
    w-full
    mt-6
    bg-orange-500
    hover:bg-orange-600
    text-white
    font-bold
    py-3
    rounded-xl
  "
>
  {loading
    ? "Please Wait..."
    : "Submit Verification Request"}
</button>
    </div>
{showAgreement && (

<div
  className="
    fixed inset-0
    bg-black/70
    flex items-center
    justify-center
    z-50
    p-4
  "
>

  <div
    className="
      bg-gray-800
      rounded-xl
      max-w-lg
      w-full
      p-5
    "
  >

    <h3 className="text-xl font-bold text-orange-400 mb-4">
      Hire Me Agreement
    </h3>

    <div
      className="
        text-sm
        text-gray-300
        max-h-72
        overflow-auto
      "
    >

      • Information provided must be genuine.

      <br /><br />

      • Fake profiles may be permanently banned.

      <br /><br />

      • Verification fee is non-refundable.

      <br /><br />

      • IndianDost only verifies identity and does not guarantee any employment.

      <br /><br />

      • User is responsible for services offered.

      <br /><br />

      • Admin may reject incomplete or suspicious applications.

    </div>

    <button
      onClick={() =>
        setShowAgreement(false)
      }
      className="
        w-full
        mt-4
        bg-orange-500
        py-2
        rounded-lg
        text-white
      "
    >
      I Understand
    </button>

  </div>

</div>

)}
  </div>
  );
}