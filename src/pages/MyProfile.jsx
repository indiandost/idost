import React, { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import axios from "axios";

export default function MyProfile() {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);

  const [imageSrc, setImageSrc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const token = localStorage.getItem("token"); 
const params = new URLSearchParams(window.location.search);
const ref = params.get("ref");
const [hireProfile, setHireProfile] = useState(null);
const [loadingHire, setLoadingHire] = useState(true);
const API = import.meta.env.VITE_API_URL;
const navigate = useNavigate();

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (ref) {
    setForm(prev => ({
      ...prev,
      refcode: ref
    }));
  }
}, []);

useEffect(() => {
  loadHireProfile();
}, []);

const loadHireProfile = async () => {
  try {
    const res = await axios.get(
      `${API}/hireme/my-profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log("HIRE PROFILE =>", res.data);
    setHireProfile(res.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingHire(false);
  }
};

const [form, setForm] = useState({
  name: "",
  dob: "",
  city: "",
  state: "",
  country: "",
  about: "",
  telephone: "",
  email: "",
  height:"",
  weight:"",
  body_type:"",
  online: "",
  doingnow: "",
  sex: "",
  relationship_goal: "",
  language: "",
  insta: ""
});

const startLiveMeeting = () => {

 const roomId =  Math.random().toString(36).substring(2, 8);
  //  `live_${user.srno}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  navigate(`/meeting/${roomId}`);
};


  useEffect(() => {
    fetchProfile();
    fetchPhotos();
  }, []);

  const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });

  
const createCroppedImage = (imageSrc, croppedAreaPixels) => {
  return new Promise(async (resolve) => {

    const image = await createImage(imageSrc);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg", 0.9);

  });
};
  // =============================
  // FETCH
  // =============================
  const fetchProfile = () => {
    fetch(`${API}/api/profile/me/${storedUser.srno}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then((data) => {
         setUser(data);
         console.log(data);
          setForm({
            name: data.name || "",
            dob: data.dob ? new Date(data.dob).toISOString().split("T")[0]  : "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "",
            height: data.height || "",
            weight: data.weight || "",
            body_type: data.body_type || "",
            about: data.about || "",
            telephone: data.telephone || "",
            email: data.email || "",
            online: data.online || "",
            doingnow: data.doingnow || "",
            sex: data.sex || "",
            relationship_goal: data.relationship_goal || "",
            language: data.language || "",
            insta:data.insta || "",
            });
        });
  };

const handleChange = (e) => {
  setForm({
    ...form,
    [e.target.name]: e.target.value
  });
};


const saveProfile = async () => {

  const cleanAbout = form.about.trim();

  if (cleanAbout.length < 5) {
    alert("About must be at least 5 characters");
    return;
  }

  if (cleanAbout.length > 500) {
    alert("About too long");
    return;
  }
  try {
    //setLoading(true);
  const res = await fetch(`${API}/api/profile/update/${storedUser.srno}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(form)
  });

  const data = await res.json();

  if (data.success) {
    fetchProfile();
    alert("Profile updated");
  }
    } catch (err) {
    console.log(err);
  } finally {
   // setLoading(false);
  }
};

  const fetchPhotos = () => {
    fetch(`${API}/api/profile/photos/${storedUser.srno}`)
      .then(res => res.json())
      .then(setPhotos);
  };

  // =============================
  // DELETE PHOTO
  // =============================
  const deletePhoto = (id) => {
    fetch(`${API}/api/profile/delete-photo/${id}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(() => {
        setPhotos(prev => prev.filter(p => p.id !== id));
      });
  };

  // =============================
  // SET PROFILE
  // =============================
  const setAsProfile = (url) => {
    fetch(`${API}/api/profile/set-main/${storedUser.srno}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url })
    })
      .then(res => res.json())
      .then(() => setUser({ ...user, pic: url }));
  };

  // =============================
  // SELECT IMAGE
  // =============================
  const handleSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImageSrc(URL.createObjectURL(file));
    }
  };

  // =============================
  // UPLOAD PROFILE IMAGE
  // =============================
const handleUpload = async () => {

  if (!imageSrc || !croppedAreaPixels) return;

  const blob = await createCroppedImage(imageSrc, croppedAreaPixels);

  const formData = new FormData();
  formData.append("photo", blob, "profile.jpg");

  fetch(`${API}/api/profile/upload/${storedUser.srno}`, {
    method: "POST",
    headers: {
    Authorization: `Bearer ${token}`
  },
    body: formData,
  })
    .then(res => res.json())
    .then(data => {

      console.log("UPLOAD RESPONSE:", data);

      if (data.success) {
        setUser(prev => ({
          ...prev,
          pic: data.pic,
        }));

        setImageSrc(null);
        setSelectedFile(null);
      }
    });
};

///multi photo upload
const handleMultiUpload = async (e) => {

  const files = e.target.files;

  if (!files || files.length === 0) return;

  const formData = new FormData();

  for (let f of files) {

    if (!f.type.startsWith("image/")) {
      alert("Only images allowed");
      continue;
    }

    if (f.size > 5 * 1024 * 1024) {
      alert("File too large (max 5MB)");
      continue;
    }

    formData.append("photos", f);
  }

  try {

    setUploading(true);
    setUploadProgress(0);

    const res = await axios.post(
      `${API}/api/profile/upload-multiple/${storedUser.srno}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
           Authorization: `Bearer ${token}`
        },

        // 🔥 THIS IS THE MAGIC PART
        onUploadProgress: (progressEvent) => {

          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );

          setUploadProgress(percent);
        },
      }
    );

    if (res.data.success) {
      fetchPhotos();
    } else {
      alert(res.data.message || "Upload failed");
    }

  } catch (err) {
    console.log("MULTI UPLOAD ERROR:", err);
    alert("Something went wrong");
  } finally {
    setUploading(false);
    setUploadProgress(0);
    e.target.value = "";
  }
};
const deleteProfile = async () => {

  const confirmDelete =
    window.confirm(
      "Are you sure you want to permanently delete your profile?"
    );

  if (!confirmDelete) return;

  try {

    const res = await fetch(
      `${API}/api/profile/delete-profile`,
      {
        method: "DELETE",
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    const data =
      await res.json();

    if (data.success) {

      alert(
        "Profile deleted successfully"
      );

      localStorage.clear();

      window.location.href =
        "/";

    } else {

      alert(
        data.message ||
        "Delete failed"
      );

    }

  } catch (err) {

    console.log(err);

    alert(
      "Server error"
    );

  }

};
  const paymentPending =
    !hireProfile?.payment_status ||
    hireProfile?.payment_status === "" ||
    hireProfile?.payment_status === "Not Submitted";

  const paymentRejected = hireProfile?.payment_status === "Rejected";

  const paymentUnderReview =
    hireProfile?.payment_status === "Pending";

  const paymentApproved =
    hireProfile?.payment_status === "Approved";

  const profileApproved =
    hireProfile?.profile_status === "Approved";

  const profileRejected =
    hireProfile?.profile_status === "Rejected";

  if (!user) return <div className="text-white p-4">Loading...</div>;

  return (
    <>
     <Helmet>
     <title>My Profile | IndianDost - Profile, Live Rooms & Battles</title>
      <meta
        name="description"
        content="Manage your IndianDost profile, update your information, create live Jamming Rooms, view your battles, track achievements, and stay connected with friends."
      />
      </Helmet>
    <div className="text-white max-w-md mx-auto p-4 space-y-5">

      {/* PROFILE CARD */}
      <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
        {uploading && (
          <div className="mt-3 bg-gray-700 rounded-xl overflow-hidden">
            
            <div className="text-xs text-white p-2">
              Uploading... {uploadProgress}%
            </div>

            <div className="h-2 bg-gray-900">
              <div
                className="h-full bg-pink-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

          </div>
        )}
        <div className="relative">
          <img
            src={
              user.pic
                ? user.pic.startsWith("http://") ||
                  user.pic.startsWith("https://")
                  ? user.pic
                  : `https://indiandost.com/${user.pic}`
                : "/default-user.png"
            }
            className="w-full h-72 object-cover"
            alt=""
          />

          {/* EDIT BUTTON */}
          <label className="absolute bottom-3 right-3 bg-black/70 p-2 rounded-full cursor-pointer">
            ✏️
            <input type="file" hidden onChange={handleSelect} />
          </label>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-bold text-white">
            {user.name}, {user.age}
          </h2>
          <p className="text-gray-400 text-white">{user.city}</p>
          <p className="mt-2 text-sm text-white">
            {user.online || "Add something about yourself..."}
          </p>
        </div>
      </div>
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-4 mt-4 shadow-lg">
          <h3 className="text-white font-bold text-lg">
            🎁 Refer Friends & Earn 1000 Coins
          </h3>

          <p className="text-white/90 text-sm mt-1">
            Invite your friends to IndianDost. When they join using your referral code,
            you get <b>1000 bonus coins</b>.
          </p>

          <div className="mt-3 bg-white/20 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-white/80">Your Referral Code</div>
              <div className="text-xl font-bold text-white">
                {user.user}
              </div>
            </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(user.user);
              alert("Referral code copied!");
            }}
            className="bg-white text-purple-700 px-3 py-2 rounded-lg font-semibold"
          >
            Copy
          </button>
      </div>
        <button
          onClick={async () => {
            const referralLink =
              `https://indiandost.com/idost/register?ref=${user.user}`;
            const shareData = {
              title: "IndianDost",
              text: `🎁 Join IndianDost using my referral code ${user.user}`,
              url: referralLink,
            };
            try {
              if (navigator.share) {
                await navigator.share(
                  shareData
                );
              } else {
                // WhatsApp fallback
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(
                    `${shareData.text}\n${referralLink}`
                  )}`,
                  "_blank"
                    );
              }

            } catch (err) {
              console.log(
                "SHARE ERROR:",
                err
              );
            }

          }}
          className="w-full mt-3 bg-white text-purple-700 font-bold py-3 rounded-xl"
        >   📤 Share & Earn 1000 Coins
        </button>
</div>

{/* =========================
   HIRE ME ENROLL CARD
========================= */}
{/* ================= HIRE ME ================= */}

{/*!loadingHire && !hireProfile && (
  <div
    className="card border-0 mt-3"
    style={{
      borderRadius: "22px",
      background:
        "linear-gradient(35deg,#ec4899,#7c3aed)",
      boxShadow:
        "0 10px 25px rgba(124,58,237,.35)",
    }}
  >
    <div className="card-body p-3 text-white">

      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="fw-bold mb-1">
            💼 Hire Me Service
          </h5>

          <small
            style={{
              color: "rgba(255,255,255,.85)",
            }}
          >
            Get verified & receive job offers
          </small>
        </div>

        <div style={{ fontSize: 38 }}>
          🚀
        </div>
      </div>

  <button
  onClick={() =>
    navigate("/hire-me-enroll")
  }
  className="w-100 mt-3 fw-bold border-0"
  style={{
    borderRadius: "16px",
    background:
      "linear-gradient(135deg,#f59e0b,#f97316)",
    color: "#fff",
    padding: "12px"
  }}
>
  🚀 Enroll Now • ₹49
</button>
    </div>
  </div>
)*/}


{hireProfile && (
  <div
    className="card border-0 mt-3"
    style={{
      borderRadius: "22px",
      background:
        "linear-gradient(135deg,#1e293b,#0f172a)",
      boxShadow:
        "0 8px 20px rgba(0,0,0,.25)",
    }}
  >
    <div className="card-body p-3 text-white">

      <div className="d-flex justify-content-between align-items-center">

        <div>

          <h5 className="fw-bold mb-1">
            💼 Hire Me Profile
          </h5>

          <small
            style={{
              color: "#94a3b8"
            }}
          >
            {hireProfile.service_title}
          </small>

        </div>

        <div style={{ fontSize: 38 }}>
          👨‍💼
        </div>

      </div>

      <div className="mt-3">

        <div className="mb-2">
          <strong>Category:</strong>{" "}
          {hireProfile.service_category}
        </div>

{/*profile.profile_status === "Rejected" && (
  <div className="alert alert-danger">
    <strong>Verification Rejected</strong>
    <br />
    {profile.rejection_reason ||
      "Please update details and resubmit."}
  </div>
)*/}
        {/* Profile Status */}

        {hireProfile.profile_status === "Pending" && (
          <div className="mb-2">
            <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">
              ⏳ Verification Pending
            </span>
          </div>
        )}

        {hireProfile.profile_status === "Approved" && (
          <div className="mb-2">
            <span className="badge bg-success px-3 py-2 rounded-pill">
              ✅ Verified Profile
            </span>
          </div>
        )}

        {hireProfile.profile_status === "Rejected" && (
          <div className="mb-2">
            <span className="badge bg-danger px-3 py-2 rounded-pill">
              ❌ Verification Rejected
            </span>
          </div>
        )}

      {paymentRejected && (
          <div className="alert alert-warning py-2 mt-2 mb-2">
            ❌ Payment Rejected
          </div>
        )}
      {/* Payment Status */}
        {paymentPending && (
          <div className="alert alert-warning py-2 mt-2 mb-2">
            💳 Verification fee not submitted
          </div>
        )}

        {paymentUnderReview && (
          <div className="alert alert-info py-2 mt-2 mb-2">
            💳 Payment verification pending
          </div>
        )}

        {paymentApproved && (
          <div className="alert alert-success py-2 mt-2 mb-2">
            ✅ Payment verified
          </div>
        )}

      </div>

      {/* Actions */}

      <div className="d-flex gap-2 mt-3">
<div className="d-flex flex-column gap-3 mt-3">

  {/* Payment */}

  {paymentPending || (paymentRejected && (
    <button
      onClick={() =>
        navigate("/hireme-payment")
      }
    className="btn w-100 fw-bold d-flex align-items-center justify-content-center gap-3"
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
      💳 Complete Payment
    </button>
  ))}

  {/* Edit */}

  {!profileApproved && (
    <button
      onClick={() =>
        navigate("/hireme-edit")
      }
      className="w-100 border-0 fw-bold"
  style={{
    background:
      "linear-gradient(135deg,#ff9800,#ff5722)",
    color: "#fff",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "16px",
    letterSpacing: ".3px",
    boxShadow:
      "0 8px 20px rgba(255,152,0,.35)"
  }}
>
      ✏️ Edit Profile
    </button>
  )}

</div>

  {/* Edit */}
{profileApproved && (
  <div className="alert alert-success mt-2 mb-2">
    🎉 Your Hire Me profile is live and visible in directory.
  </div>
)}
{profileRejected && (
  <div className="alert alert-danger mt-2 mb-2">
    ❌ Verification rejected. Please update details and resubmit.
  </div>
)}

      </div>

    </div>
  </div>
)}


      {/* UPLOAD BOX */}
      <label className="block border-2 border-dashed border-gray-600 p-5 text-center rounded-xl cursor-pointer hover:border-pink-400 transition">
        📸 Add more photos
        <input type="file" multiple hidden onChange={handleMultiUpload} />
      </label>

   {/* PHOTO GRID */}
<div className="grid grid-cols-3 gap-2">
  {Array.isArray(photos) &&
    photos.map((p) => (
      <div key={p.id} className="relative">

        <img
          src={p.url}
          className="h-32 w-full object-cover rounded"
          alt=""
        />

        {/* PROFILE TAG */}
        {user?.pic === p.url && (
          <span className="absolute top-1 left-1 bg-pink-500 text-xs px-2 rounded">
            Profile
          </span>
        )}

        {/* ACTION BUTTONS */}
        <div className="absolute bottom-1 left-1 right-1 flex justify-between gap-1">

          <button
            onClick={() => setAsProfile(p.url)}
            className="bg-green-500 text-xs px-2 py-1 rounded"
          >
            Set
          </button>

          <button
            onClick={() => deletePhoto(p.id)}
            className="bg-red-500 text-xs px-2 py-1 rounded"
          >
            Del
          </button>

        </div>

      </div>
    ))}
</div>

      {/* CROP MODAL */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">

          <div className="relative w-80 h-96 bg-gray-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={4 / 5}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(croppedArea, croppedAreaPixels) => {
                setCroppedAreaPixels(croppedAreaPixels);
              }}
            />
          </div>

          {/* ZOOM SLIDER */}
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
            className="w-60 mt-4"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setImageSrc(null)}
              className="bg-gray-600 px-4 py-2 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleUpload}
              className="bg-pink-500 px-4 py-2 rounded"
            >
              Save Photo
            </button>
          </div>
        </div>
      )}
     {user?.coins > 1000 && (
    <button
        onClick={startLiveMeeting}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white font-bold"
      >
        🔴 Start Live
      </button>
     )}

      <button
        onClick={() => navigate("/quiz-battles")}
        className="bg-green-500 hover:bg-green-400 px-4 py-2 rounded-lg text-white font-bold ml-4"
      >
        ⚔️ My Battles
      </button>

      <div className="bg-gray-800 p-4 rounded-2xl space-y-3">

  <h3 className="text-lg font-bold">👤 Basic Info</h3>

  <input
    name="name"
    value={form.name}
    onChange={handleChange}
    placeholder="Name"
    className="w-full p-3 rounded bg-gray-700"
  />

<input
  type="date"
  name="dob"
  value={form.dob}
  onChange={handleChange}
  max={
    new Date(
      new Date().setFullYear(
        new Date().getFullYear() - 16
      )
    ).toISOString().split("T")[0]
  }
  className="w-full p-3 rounded bg-gray-700 text-white"
/>
<select
  name="sex"
  value={form.sex}
  onChange={handleChange}
  className="w-full p-3 rounded bg-gray-700 text-white"
>
  <option value="">Select Gender</option>
  <option value="Male">Male</option>
  <option value="Female">Female</option>
  <option value="Trans">Transgender</option>
  <option value="Other">Other</option>
</select>
<select
  name="relationship_goal"
  value={form.relationship_goal}
  onChange={handleChange}
  className="w-full p-3 rounded bg-gray-700 text-white"
>
  <option value="">Looking For</option>

  <option value="Friendship">
    Friendship
  </option>

  <option value="Dating">
    Dating
  </option>

  <option value="Long Term Relationship">
    Long Term Relationship
  </option>

  <option value="Marriage">
    Marriage
  </option>

  <option value="Casual Chat">
    Casual Chat
  </option>

  <option value="Networking">
    Networking
  </option>

</select>
<select
  name="language"
  value={form.language}
  onChange={handleChange}
  className="w-full p-3 rounded bg-gray-700 text-white"
>
  <option value="">Preferred Language</option>

  <option value="Hindi">Hindi</option>
  <option value="English">English</option>
  <option value="Bengali">Bengali</option>
  <option value="Punjabi">Punjabi</option>
  <option value="Marathi">Marathi</option>
  <option value="Gujarati">Gujarati</option>
  <option value="Tamil">Tamil</option>
  <option value="Telugu">Telugu</option>
  <option value="Kannada">Kannada</option>
  <option value="Malayalam">Malayalam</option>
  <option value="Urdu">Urdu</option>
  <option value="Other">Other</option>

</select>
 <input
    name="city"
    value={form.city}
    onChange={handleChange}
    placeholder="City"
    className="w-full p-3 rounded bg-gray-700"
  />

 <input
    name="state"
    value={form.state}
    onChange={handleChange}
    placeholder="State"
    className="w-full p-3 rounded bg-gray-700"
  />

 <input
    name="country"
    value={form.country}
    onChange={handleChange}
    placeholder="Country"
    className="w-full p-3 rounded bg-gray-700"
  />

  <input
    name="doingnow"
    value={form.doingnow}
    onChange={handleChange}
    placeholder="Profession / Study / Work"
    className="w-full p-3 rounded bg-gray-700"
  />

  <input
    name="online"
    value={form.online}
    onChange={handleChange}
    placeholder="Status message"
    className="w-full p-3 rounded bg-gray-700"
  />

  <input
    name="telephone"
    value={form.telephone}
    onChange={handleChange}
    placeholder="Phone"
    className="w-full p-3 rounded bg-gray-700"
  />

  <input
  type="email"
  name="email"
  value={form.email}
  disabled
  className="w-full p-3 rounded bg-gray-700 text-gray-400 cursor-not-allowed opacity-70"
/>

  <textarea
  name="about"
  value={form.about}
  onChange={handleChange}
  placeholder="About yourself"
  rows={4}
  maxLength={500}
  className="w-full p-3 rounded bg-gray-700"
/>

<p className="text-xs text-gray-400 mt-1">
  {form.about.length}/500
</p>
{/* Physical Details */}

<h3 className="text-lg font-bold mt-6 mb-3">
  📏 Physical Apparance
</h3>
<div className="grid grid-cols-2 gap-3">

  {/* Height */}
  <div>
    <label className="block text-sm mb-1">Height</label>
    <select
      name="height"
      value={form.height || ""}
      onChange={handleChange}
      className="w-full p-3 rounded-lg bg-gray-700 text-white"
    >
      <option value="">Height</option>
      {Array.from({ length: 101 }, (_, i) => {
        const cm = i + 120;
        return (
          <option key={cm} value={`${cm}`}>
            {cm} cm
          </option>
        );
      })}
    </select>
  </div>

  {/* Weight */}
  <div>
    <label className="block text-sm mb-1">Weight</label>
    <select
      name="weight"
      value={form.weight || ""}
      onChange={handleChange}
      className="w-full p-3 rounded-lg bg-gray-700 text-white"
    >
      <option value="">Weight</option>
      {Array.from({ length: 171 }, (_, i) => {
        const kg = i + 30;
        return (
          <option key={kg} value={`${kg}`}>
            {kg} kg
          </option>
        );
      })}
    </select>
  </div>
  </div>

<div className="mt-4">
  <label className="block text-sm mb-1">Body Type</label>
  <select
    name="body_type"
    value={form.body_type || ""}
    onChange={handleChange}
    className="w-full p-3 rounded-lg bg-gray-700 text-white"
  >
    <option value="">Select Body Type</option>
    <option value="Slim">Slim</option>
    <option value="Average">Average</option>
    <option value="Athletic">Athletic</option>
    <option value="Muscular">Muscular</option>
    <option value="Heavy">Heavy</option>
  </select>
</div>

{/* Social Links */}

<h3 className="text-lg font-bold mt-6 mb-3">
  🌐 Social Profiles
</h3>

<input
  type="text"
  name="insta"
  value={form.insta || ""}
  onChange={handleChange}
  placeholder="Instagram Username"
  className="w-full p-3 rounded-lg bg-gray-700 text-white mb-3"
/>

  <button
    onClick={saveProfile}
    className="w-full bg-pink-500 py-3 rounded-xl font-bold"
  >
    Save Profile
  </button>

</div>

{/* DELETE PROFILE */}

<button
  onClick={deleteProfile}
  className="
    w-full
    mt-4
    border
    border-red-500
    text-red-400
    py-3
    rounded-xl
    font-bold
    hover:bg-red-500
    hover:text-white
    transition
  "
>
  Delete Profile
</button>

    </div>
    </>
  );
}