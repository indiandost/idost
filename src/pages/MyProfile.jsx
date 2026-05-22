import React, { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { useNavigate } from "react-router-dom";
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
  const [form, setForm] = useState({
  name: "",
  dob: "",
  city: "",
  about: "",
  telephone: "",
  email: "",
  online: "",
  doingnow: "",
  sex: "",
  relationship_goal: "",
  language: ""
});
const API = import.meta.env.VITE_API_URL;
const navigate = useNavigate();

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
    fetch(`${API}/api/profile/me/${storedUser.srno}`)
      .then(res => res.json())
      .then((data) => {
         setUser(data);
         console.log(data);
          setForm({
            name: data.name || "",
            dob: data.dob ? new Date(data.dob).toISOString().split("T")[0]  : "",
            city: data.city || "",
            about: data.about || "",
            telephone: data.telephone || "",
            email: data.email || "",
            online: data.online || "",
            doingnow: data.doingnow || "",
            sex: data.sex || "",
            relationship_goal: data.relationship_goal || "",
            language: data.language || ""
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
      "Content-Type": "application/json"
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
      headers: { "Content-Type": "application/json" },
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

  if (!user) return <div className="text-white p-4">Loading...</div>;

  return (
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
            src={user.pic || "./default-user.png"}
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
          <h2 className="text-xl font-bold">
            {user.name}, {user.age}
          </h2>
          <p className="text-gray-400">{user.city}</p>
          <p className="mt-2 text-sm">
            {user.online || "Add something about yourself..."}
          </p>
        </div>
      </div>

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

      <button
        onClick={startLiveMeeting}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white font-bold"
      >
        🔴 Start Live
      </button>


      <div className="bg-gray-800 p-4 rounded-2xl space-y-3">

  <h3 className="text-lg font-bold">Edit Profile</h3>

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
  <option value="Transgender">Transgender</option>
  <option value="Non-Binary">Non-Binary</option>
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
    name="email"
    value={form.email}
    onChange={handleChange}
    placeholder="Email"
    className="w-full p-3 rounded bg-gray-700"
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

  <button
    onClick={saveProfile}
    className="w-full bg-pink-500 py-3 rounded-xl font-bold"
  >
    Save Profile
  </button>

</div>

    </div>
  );
}