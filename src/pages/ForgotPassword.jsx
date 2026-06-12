import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function ForgotPassword() {
  const API = import.meta.env.VITE_API_URL;
  const [user, setUser] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {

    try {

      setMessage("");

      if (!user) {

        setMessage("Please enter your email");

        return;
      }

      setLoading(true);

      const response = await fetch(
       `${API}/api/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user,
          }),
        }
      );

      const data = await response.json();

      if (data.status) {

        setMessage(data.message);

      } else {

        setMessage(data.message || "Something went wrong");
      }

    } catch (err) {

      console.log(err);

      setMessage("Server error");

    } finally {

      setLoading(false);
    }
  };

  return (
     <>
      <Helmet>
       <title>Forgot Password | IndianDost Account Recovery</title>
      <meta
        name="description"
        content="Reset your IndianDost account password securely. Recover access to your account and get back to chatting, connecting with friends, and enjoying the IndianDost community."
      />
      </Helmet>
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

          <p className="text-gray-400 text-sm mt-1 text-center">
            Recover your account password
          </p>

        </div>

        {/* Title */}
        <div className="text-center mb-5">

          <h2 className="text-2xl font-bold">
            Forgot Password
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Enter your registered email
          </p>

        </div>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Enter Email Address"
          className="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />

        {/* Message */}
        {message && (
          <p className="text-center text-sm mt-4 text-green-400">
            {message}
          </p>
        )}

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-xl font-semibold hover:opacity-90 transition shadow-lg disabled:opacity-50"
        >

          {loading ? "Sending..." : "Continue"}

        </button>

        {/* Back to Login */}
        <div className="text-center text-sm mt-5 text-gray-400">

          Remember password?{" "}

          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300 hover:underline transition"
          >
            Back to Login
          </Link>

        </div>

      </div>

    </div>
    </>
  );
}