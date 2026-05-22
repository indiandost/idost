import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {

  const { token } = useParams();

  const navigate = useNavigate();

  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const handleReset = async () => {
    const API = import.meta.env.VITE_API_URL;
    try {

      const response = await fetch(
        `${API}/api/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      setMessage(data.message);

      if (data.status) {

        setTimeout(() => {

          navigate("/login");

        }, 2000);
      }

    } catch (err) {

      console.log(err);

      setMessage("Server error");
    }
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute w-72 h-72 bg-pink-600/20 rounded-full blur-3xl top-0 left-0"></div>
      <div className="absolute w-72 h-72 bg-blue-600/20 rounded-full blur-3xl bottom-0 right-0"></div>

      {/* Card */}
      <div className="relative bg-gray-800/95 backdrop-blur-md border border-gray-700 p-8 rounded-3xl w-full max-w-sm shadow-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">

          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">

            <span className="text-3xl font-extrabold">
              ID
            </span>

          </div>

          <h1 className="text-3xl font-extrabold mt-4 bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
            IndianDost
          </h1>
        <h2 className="text-3xl font-bold mb-5">
          Reset Password
        </h2>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded bg-gray-800 border border-gray-700"
        />

        <button
          onClick={handleReset}
          className="w-full mt-5 bg-pink-600 p-3 rounded"
        >
          Update Password
        </button>

        {message && (

          <p className="mt-4 text-center">
            {message}
          </p>
        )}

      </div>

    </div>
      </div>

  
  );
}