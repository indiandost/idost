import React, { useState, useCallback, useEffect  } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
export default function Register() {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [checkingRef, setCheckingRef] = useState(false);
const [refValid, setRefValid] = useState(null);
const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [form, setForm] = useState({
    user: "",
    pass: "",
    name: "",
    dob: "",
    city: "",
    email: "",
    refcode:""
  });
const indiaCities = [
  "Adilabad",
  "Agartala",
  "Agra",
  "Ahmedabad",
  "Ahmednagar",
  "Aizawl",
  "Ajmer",
  "Akola",
  "Alappuzha",
  "Aligarh",
  "Alipurduar",
  "Allahabad",
  "Almora",
  "Alwar",
  "Ambala",
  "Ambikapur",
  "Amravati",
  "Amreli",
  "Amritsar",
  "Anand",
  "Anantapur",
  "Angul",
  "Arrah",
  "Asansol",
  "Aurangabad",
  "Azamgarh",

  "Badlapur",
  "Bagalkot",
  "Bahadurgarh",
  "Bahraich",
  "Balasore",
  "Ballia",
  "Balrampur",
  "Banda",
  "Bangalore",
  "Bankura",
  "Barabanki",
  "Baramati",
  "Baran",
  "Barasat",
  "Bareilly",
  "Bargarh",
  "Barmer",
  "Barnala",
  "Baroda",
  "Barpeta",
  "Barwani",
  "Basti",
  "Batala",
  "Bathinda",
  "Beawar",
  "Begusarai",
  "Belgaum",
  "Bellary",
  "Berhampore",
  "Berhampur",
  "Betul",
  "Bhadrak",
  "Bhagalpur",
  "Bharatpur",
  "Bharuch",
  "Bhatinda",
  "Bhavnagar",
  "Bhilai",
  "Bhilwara",
  "Bhimavaram",
  "Bhind",
  "Bhiwadi",
  "Bhiwani",
  "Bhopal",
  "Bhubaneswar",
  "Bhuj",
  "Bidar",
  "Bijapur",
  "Bijnor",
  "Bikaner",
  "Bilaspur",
  "Bokaro",
  "Botad",
  "Budaun",
  "Bulandshahr",
  "Buldhana",
  "Bundi",
  "Burhanpur",

  "Calicut",
  "Chandigarh",
  "Chandrapur",
  "Chennai",
  "Chhapra",
  "Chhindwara",
  "Chikmagalur",
  "Chitradurga",
  "Chittoor",
  "Coimbatore",
  "Cooch Behar",
  "Cuddalore",
  "Cuttack",

  "Dahod",
  "Damoh",
  "Darbhanga",
  "Darjeeling",
  "Datia",
  "Dausa",
  "Davangere",
  "Dehradun",
  "Deoghar",
  "Deoria",
  "Dewas",
  "Dhanbad",
  "Dhar",
  "Dharmapuri",
  "Dharwad",
  "Dhenkanal",
  "Dholpur",
  "Dhule",
  "Dibrugarh",
  "Dimapur",
  "Dindigul",
  "Dispur",
  "Diu",
  "Durg",
  "Durgapur",

  "Eluru",
  "Ernakulam",
  "Erode",
  "Etah",
  "Etawah",

  "Faizabad",
  "Faridabad",
  "Farrukhabad",
  "Fatehabad",
  "Fatehpur",
  "Fazilka",
  "Firozabad",
  "Firozpur",

  "Gadag",
  "Gandhidham",
  "Gandhinagar",
  "Gangtok",
  "Gaya",
  "Ghaziabad",
  "Ghazipur",
  "Giridih",
  "Goa",
  "Godhra",
  "Gonda",
  "Gondia",
  "Gopalganj",
  "Gorakhpur",
  "Greater Noida",
  "Gulbarga",
  "Guna",
  "Guntur",
  "Gurgaon",
  "Guwahati",
  "Gwalior",

  "Hajipur",
  "Haldwani",
  "Hamirpur",
  "Hanumangarh",
  "Hapur",
  "Hardoi",
  "Haridwar",
  "Hassan",
  "Hathras",
  "Hazaribagh",
  "Himatnagar",
  "Hisar",
  "Hoshiarpur",
  "Hospet",
  "Howrah",
  "Hubli",
  "Hyderabad",

  "Ichalkaranji",
  "Imphal",
  "Indore",
  "Itanagar",

  "Jabalpur",
  "Jagdalpur",
  "Jaipur",
  "Jaisalmer",
  "Jalandhar",
  "Jalgaon",
  "Jalna",
  "Jalpaiguri",
  "Jammu",
  "Jamnagar",
  "Jamshedpur",
  "Jaunpur",
  "Jehanabad",
  "Jhansi",
  "Jhunjhunu",
  "Jind",
  "Jodhpur",
  "Jorhat",
  "Junagadh",

  "Kaithal",
  "Kakinada",
  "Kalimpong",
  "Kalyan",
  "Kanchipuram",
  "Kannur",
  "Kanpur",
  "Kanyakumari",
  "Kapurthala",
  "Karaikudi",
  "Karimnagar",
  "Karnal",
  "Karur",
  "Kasaragod",
  "Katihar",
  "Katni",
  "Kharagpur",
  "Khargone",
  "Kochi",
  "Kohima",
  "Kolhapur",
  "Kolkata",
  "Kollam",
  "Korba",
  "Kota",
  "Kottayam",
  "Kozhikode",
  "Krishnanagar",
  "Kurnool",
  "Kurukshetra",

  "Lakhimpur",
  "Lalitpur",
  "Latur",
  "Leh",
  "Lucknow",
  "Ludhiana",

  "Madurai",
  "Mahbubnagar",
  "Malappuram",
  "Malegaon",
  "Mandi",
  "Mandya",
  "Mangalore",
  "Mathura",
  "Meerut",
  "Mehsana",
  "Mirzapur",
  "Modinagar",
  "Moga",
  "Mohali",
  "Moradabad",
  "Morbi",
  "Motihari",
  "Mumbai",
  "Munger",
  "Murshidabad",
  "Muzaffarnagar",
  "Muzaffarpur",
  "Mysore",

  "Nadiad",
  "Nagaon",
  "Nagapattinam",
  "Nagaur",
  "Nagercoil",
  "Nagpur",
  "Nainital",
  "Nalanda",
  "Nalgonda",
  "Namakkal",
  "Nanded",
  "Nandurbar",
  "Narasaraopet",
  "Nashik",
  "Navsari",
  "Neemuch",
  "Nellore",
  "New Delhi",
  "Nizamabad",
  "Noida",

  "Ongole",

  "Palakkad",
  "Palanpur",
  "Pali",
  "Panaji",
  "Panchkula",
  "Panipat",
  "Parbhani",
  "Pathanamthitta",
  "Pathankot",
  "Patiala",
  "Patna",
  "Perambalur",
  "Phagwara",
  "Pilibhit",
  "Pondicherry",
  "Porbandar",
  "Port Blair",
  "Pratapgarh",
  "Prayagraj",
  "Pudukkottai",
  "Pune",
  "Puri",

  "Raebareli",
  "Raichur",
  "Raigarh",
  "Raipur",
  "Rajahmundry",
  "Rajkot",
  "Rajnandgaon",
  "Rajsamand",
  "Ramagundam",
  "Rameswaram",
  "Rampur",
  "Ranchi",
  "Ratlam",
  "Ratnagiri",
  "Rewa",
  "Rohtak",
  "Roorkee",
  "Rourkela",
  "Rudrapur",

  "Sagar",
  "Saharanpur",
  "Salem",
  "Sambalpur",
  "Sambhal",
  "Sangli",
  "Satara",
  "Satna",
  "Secunderabad",
  "Shahjahanpur",
  "Shillong",
  "Shimla",
  "Shivpuri",
  "Sikar",
  "Silchar",
  "Siliguri",
  "Silvassa",
  "Sindhudurg",
  "Sirohi",
  "Sirsa",
  "Sitamarhi",
  "Sitapur",
  "Solapur",
  "Sonipat",
  "Sri Ganganagar",
  "Srinagar",
  "Surat",
  "Surendranagar",

  "Tadepalligudem",
  "Tamluk",
  "Tenkasi",
  "Tezpur",
  "Thane",
  "Thanjavur",
  "Thiruvananthapuram",
  "Thoothukudi",
  "Thrissur",
  "Tinsukia",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupati",
  "Tiruppur",
  "Tonk",
  "Tumkur",

  "Udaipur",
  "Udhampur",
  "Udupi",
  "Ujjain",
  "Ulhasnagar",
  "Unnao",

  "Vadodara",
  "Valsad",
  "Varanasi",
  "Vasco da Gama",
  "Vellore",
  "Veraval",
  "Vidisha",
  "Vijayawada",
  "Viluppuram",
  "Virar",
  "Visakhapatnam",
  "Vizianagaram",

  "Warangal",
  "Wardha",

  "Yamunanagar",

  "Zirakpur"
];

  const [errors, setErrors] = useState({});

  const [userExists, setUserExists] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);

  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [loading, setLoading] = useState(false);
useEffect(() => {

  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    async (position) => {

      try {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );

        const data = await res.json();

        const city =
          data.address.city ||
          data.address.town ||
          data.address.state_district ||
          "";

        if (city) {
          setForm((prev) => ({
            ...prev,
            city,
          }));
        }

      } catch (err) {
        console.log(err);
      }

    }
  );

}, []);

  // ✅ Notice State
  const [notice, setNotice] = useState({
    type: "",
    message: ""
  });

  // -----------------------------
  // Handle Change
  // -----------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));

    // Clear notice while typing
    setNotice({
      type: "",
      message: ""
    });

    // Username Check
    if (name === "user") {
      setUserExists(false);

      if (value.trim().length >= 3) {
        setTimeout(() => {
        checkUsername(value.trim());
      }, 500);
        }
    }

    // Email Check
    if (name === "email") {
      setEmailExists(false);

      if (/\S+@\S+\.\S+/.test(value)) {
        setTimeout(() => {
        checkEmail(value.trim());
        }, 500);
      }
    }
  };

  // -----------------------------
  // Username Check
  // -----------------------------
  const checkUsername = useCallback(
    async (username) => {
      try {
        setCheckingUser(true);

        const res = await fetch(`${API}/api/check-username`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ user: username })
        });

        const data = await res.json();

        const exists = Boolean(data?.exists);

        setUserExists(exists);

        // ✅ Notice
        setNotice({
          type: exists ? "error" : "success",
          message: exists
            ? "Username already exists ❌"
            : "Username available ✅"
        });
      } catch (error) {
        console.error("Username check failed:", error);

        setNotice({
          type: "error",
          message: "Unable to check username"
        });
      } finally {
        setCheckingUser(false);
      }
    },
    [API]
  );
//---------------------------------
// ref code 
//-------------------------------
const checkRefCode = async (refcode) => {
  if (!refcode.trim()) {
    setRefValid(null);
    return;
  }
  try {
    setCheckingRef(true);
    const res = await fetch(`${API}/api/check-refcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refcode })
    });
    const data = await res.json();
    setRefValid(data.exists);
  } catch (err) {
    console.error(err);
    setRefValid(false);
  } finally {
    setCheckingRef(false);
  }
};
  // -----------------------------
  // Email Check
  // -----------------------------
  const checkEmail = useCallback(
    async (email) => {
      try {
        setCheckingEmail(true);

        const res = await fetch(`${API}/api/check-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });

        const data = await res.json();

        const exists = Boolean(data?.exists);

        setEmailExists(exists);

        // ✅ Notice
        setNotice({
          type: exists ? "error" : "success",
          message: exists
            ? "Email already exists ❌"
            : "Email available ✅"
        });
      } catch (error) {
        console.error("Email check failed:", error);

        setNotice({
          type: "error",
          message: "Unable to check email"
        });
      } finally {
        setCheckingEmail(false);
      }
    },
    [API]
  );

  // -----------------------------
  // Validation
  // -----------------------------
  const validate = () => {
    const newErrors = {};
      if (!acceptedPolicy) {
        newErrors.policy = "Please accept Privacy Policy";
      }
    if (!form.user.trim()) {
      newErrors.user = "Username required";
    } else if (form.user.trim().length < 3) {
      newErrors.user = "Minimum 3 characters";
    }

    if (!form.pass) {
      newErrors.pass = "Password required";
    } else if (form.pass.length < 4) {
      newErrors.pass = "Minimum 4 characters";
    }

    if (!form.name.trim()) {
      newErrors.name = "Name required";
    }

    if (!form.dob) {
      newErrors.dob = "DOB required";
    }

   if (!form.email.trim()) {
      newErrors.email = "Email required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email";
    }

// Phone optional
/*if (
  form.telephone.trim() &&
  !/^\d{10}$/.test(form.telephone)
) {
  newErrors.telephone =
    "Must be exactly 10 digits";
}
*/
    if (userExists) {
      newErrors.user = "Username already exists";
    }

    if (emailExists) {
      newErrors.email = "Email already exists";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // -----------------------------
  // Send Data
  // -----------------------------
  const sendData = async (lat = null, lng = null) => {
    try {
      setLoading(true);
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          latitude: lat,
          longitude: lng
        })
      });

      const data = await res.json();

      if (data?.success) {
        setNotice({
          type: "success",
          message: "Registered successfully ✅"
        });

        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setNotice({
          type: "error",
          message: data?.message || "Registration failed ❌"
        });
      }
    } catch (error) {
      console.error("Registration error:", error);

      setNotice({
        type: "error",
        message: "Server error ❌"
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Register
  // -----------------------------
  const handleRegister = async () => {
    if (!validate()) return;

    if (checkingUser || checkingEmail) {
      setNotice({
        type: "error",
        message: "Please wait for validation"
      });
      return;
    }

    if (!navigator.geolocation) {
      sendData();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendData(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      () => {
        sendData();
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };
const params = new URLSearchParams(window.location.search);
const ref = params.get("ref");
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (ref) {
    setForm((prev) => ({
      ...prev,
      refcode: ref,
    }));

    checkRefCode(ref);
  }
}, []);

  return (
     <>
    <Helmet>
   <title>Sign Up for IndianDost - Meet Friends, Chat & Earn Rewards</title>
    <meta
      name="description"
      content="Join IndianDost today to meet new friends, chat online, share photos, discover people nearby, and earn rewards through activities and engagement on the platform."
    />
    </Helmet>
<div
  className="
    flex
    items-center
    justify-center
    text-white
    px-0
    relative
  "
  style={{
    minHeight: "calc(100vh - 120px)"
  }}
>
 
  {/* Background Glow */}
  <div className="absolute w-72 h-72 bg-pink-600/20 rounded-full blur-3xl top-0 left-0"></div>
  <div className="absolute w-72 h-72 bg-blue-600/20 rounded-full blur-3xl bottom-0 right-0"></div>

   <div className="relative bg-gray-800/95 backdrop-blur-md border border-gray-400 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-2">

    {/* LOGO */}
    <div className="flex flex-col items-center justify-center mb-2">
<Link to="/">
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">

        {/* Replace with your image if needed */}
        <span className="text-3xl font-extrabold text-white">
          ID
        </span>

      </div></Link>

      <h1 className="text-3xl font-extrabold mt-4 bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
        IndianDost
      </h1>

      <p className="text-gray-400 text-sm mt-1">
        Connect • Chat • Meet
      </p>

    </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRegister();
        }}
        className="w-full max-w-sm bg-gray-800 p-4 rounded-2xl shadow-xl space-y-2"
      >
        <h2 className="text-2xl font-bold text-center text-white">
          Register
        </h2>

        {/* ✅ NOTICE BOX */}
        {notice.message && (
          <div
            className={`p-3 rounded-lg text-sm font-medium border
              ${
                notice.type === "error"
                  ? "bg-red-500/10 text-red-300 border-red-500"
                  : "bg-green-500/10 text-green-300 border-green-500"
              }
            `}
          >
            {notice.message}
          </div>
        )}

        {/* Username */}
        <div>
          <input
            type="text"
            name="user"
            placeholder="Username *"
            value={form.user}
            onChange={handleChange}
            autoComplete="username"
            className={`w-full p-3 rounded-lg bg-gray-700 border outline-none text-white
              ${
                errors.user
                  ? "border-red-500"
                  : "border-gray-600 focus:border-green-500"
              }`}
          />

          {checkingUser && (
            <p className="text-yellow-400 text-sm mt-1">
              Checking username...
            </p>
          )}

          {errors.user && (
            <p className="text-red-400 text-sm mt-1">
              {errors.user}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <input
            type="password"
            name="pass"
            placeholder="Password *"
            value={form.pass}
            onChange={handleChange}
            autoComplete="new-password"
            className={`w-full p-3 rounded-lg bg-gray-700 border outline-none text-white
              ${
                errors.pass
                  ? "border-red-500"
                  : "border-gray-600 focus:border-green-500"
              }`}
          />

          {errors.pass && (
            <p className="text-red-400 text-sm mt-1">
              {errors.pass}
            </p>
          )}
        </div>

        {/* Name */}
        <div>
          <input
            type="text"
            name="name"
            placeholder="Full Name *"
            value={form.name}
            onChange={handleChange}
            className={`w-full p-3 rounded-lg bg-gray-700 border outline-none text-white
              ${
                errors.name
                  ? "border-red-500"
                  : "border-gray-600 focus:border-green-500"
              }`}
          />

          {errors.name && (
            <p className="text-red-400 text-sm mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email *"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            className={`w-full p-3 rounded-lg bg-gray-700 border outline-none text-white
              ${
                errors.email
                  ? "border-red-500"
                  : "border-gray-600 focus:border-green-500"
              }`}
          />

          {checkingEmail && (
            <p className="text-yellow-400 text-sm mt-1">
              Checking email...
            </p>
          )}

          {errors.email && (
            <p className="text-red-400 text-sm mt-1">
              {errors.email}
            </p>
          )}
        </div>

          {/* Email */}
       {/* Gender */}
        <div>
          <select
            name="sex"
            value={form.sex || ""}
            onChange={handleChange}
            className={`w-full p-3 rounded-lg bg-gray-700 border outline-none text-white
              ${
                errors.sex
                  ? "border-red-500"
                  : "border-gray-600 focus:border-green-500"
              }`}
          >
          <option value="">Select Gender *</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Trans">Transgender</option>
          <option value="Other">Other</option>
          </select>

          {errors.sex && (
            <p className="text-red-400 text-sm mt-1">
              {errors.sex}
            </p>
          )}
        </div>

              {/* DOB */}
        <div>
<label className="text-sm text-gray-300 mb-1 block">
  Date of Birth (16+ only) *
</label>
      <input
        type="date"
        name="dob"
        value={form.dob}
        onChange={handleChange}
        onFocus={(e) => e.target.showPicker?.()}
        min="1950-01-01"
        className={`w-full p-3 rounded-lg bg-gray-700 border outline-none text-white`}
        placeholder="DOB *"
        max={
          new Date(
            new Date().setFullYear(
              new Date().getFullYear() - 18
            )
          )
            .toISOString()
            .split("T")[0]
        }
      /> 
          {errors.dob && (
            <p className="text-red-400 text-sm mt-1">
              {errors.dob}
            </p>
          )}
        </div>

        {/* City */}
        <div>
<input
  type="hidden"
  name="city"
  value={form.city || ""}
/>

</div>
  {/* Ref Code */}
<div>
  <input
    type="text"
    name="refcode"
    placeholder="Referral Code Optional"
    value={form.refcode}
    onChange={(e) => {
      handleChange(e);
      checkRefCode(e.target.value);
    }}
      className={`w-full p-3 rounded-lg bg-gray-700 border outline-none text-white
    ${
      refValid === false
        ? "border-red-500"
        : refValid === true
        ? "border-green-500"
        : "border-gray-600"
    }`}
/>

<p className="text-xs text-gray-400 mt-1">
  Have a friend's referral code? Enter it to earn bonus rewards for both of you.
</p>

  {checkingRef && (
    <p className="text-yellow-400 text-sm mt-1">
      Checking referral code...
    </p>
  )}

  {refValid === true && (
    <p className="text-green-400 text-sm mt-1">
      Valid referral code ✅
    </p>
  )}

  {refValid === false && (
    <p className="text-red-400 text-sm mt-1">
      Invalid referral code ❌
    </p>
  )}
</div>
{/* Privacy Policy */}
<div className="flex items-start gap-2 text-sm text-gray-300 mt-2">

  <input
    type="checkbox"
    id="policy"
    checked={acceptedPolicy}
    onChange={(e) =>
      setAcceptedPolicy(e.target.checked)
    }
    className="mt-1 accent-pink-500"
  />

  <label htmlFor="policy">
    I agree to the{" "}
    
    <Link
      to="/privacy-policy"
      className="text-pink-400 hover:text-pink-300 underline"
    >
      Privacy Policy *
    </Link>

  </label>

</div>

{errors.policy && (
  <p className="text-red-400 text-sm">
    {errors.policy}
  </p>
)}
        {/* Submit */}
        <button
          type="submit"
          disabled={
            loading ||
            checkingUser ||
            checkingEmail ||
            userExists ||
            emailExists
          }
          className={`w-full py-3 rounded-lg font-semibold transition mt-2
            ${
              loading ||
              checkingUser ||
              checkingEmail ||
              userExists ||
              emailExists
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {/* Login */}
        <div className="text-center text-sm">
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back to Login
          </Link>
        </div>
      </form>
    </div>
    </div>
    </>
  );
}