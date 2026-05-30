import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import socket from "./../socket";

export default function Login() {

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  // LOADING STATE
  const [loading, setLoading] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();

  const handleLogin = () => {

    // RESET ERROR
    setError("");

    // VALIDATION
    if (!user || !pass) {

      setError("Please enter username and password");

      return;
    }

    // START LOADING
    setLoading(true);

    navigator.geolocation.getCurrentPosition(

      (pos) => {

        const lat = pos.coords.latitude;

        const lng = pos.coords.longitude;

        sendLogin(lat, lng);

      },

      () => {

        // IF LOCATION BLOCKED
        sendLogin(0, 0);

      }

    );
  };

  const sendLogin = (lat, lng) => {

    fetch(`${API}/api/login`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        user,
        pass,
        lat,
        lng
      })

    })

    .then(res => res.json())

    .then(data => {

      // STOP LOADING
      setLoading(false);
      if (data.success) {
        localStorage.setItem("token", data.token); //for token
        localStorage.setItem("user", JSON.stringify(data.user));
        socket.connect();
    // 🔥 PUSH NOTIFICATION SETUP (AFTER LOGIN ONLY)
    if (Capacitor.getPlatform() !== 'web') {
      PushNotifications.requestPermissions().then(result => {

        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      });

      PushNotifications.addListener('registration', (token) => {
        console.log("FCM Token:", token.value);
        const loggedUser = data.user;
        fetch(`${API}/notification/save-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          user_id: loggedUser.srno,
          token: token.value
        })
        });
      });
    }

        navigate("/");

      } else {

        setError("Invalid username or password");

      }

    })

    .catch(err => {

      console.log(err);

      setLoading(false);

      setError("Server error. Try again.");

    });

  };

  return (

<div className="min-h-screen overflow-hidden flex items-center justify-center bg-gray-900 text-white px-4 relative">

  {/* Background Glow */}
  <div className="absolute w-72 h-72 bg-pink-600/20 rounded-full blur-3xl top-0 left-0"></div>

  <div className="absolute w-72 h-72 bg-blue-600/20 rounded-full blur-3xl bottom-0 right-0"></div>

  <div className="relative bg-gray-800/95 backdrop-blur-md border border-gray-700 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-4">

    {/* LOGO */}
    <div className="flex flex-col items-center justify-center mb-2">

      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">

        <span className="text-3xl font-extrabold text-white">
          ID
        </span>

      </div>

      <h1 className="text-3xl font-extrabold mt-4 bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
        IndianDost
      </h1>

      <p className="text-gray-400 text-sm mt-1">
        Connect • Chat • Meet
      </p>

    </div>

    {/* TITLE */}
    <div className="text-center pb-2">

      <h2 className="text-2xl font-bold text-white">
        Login
      </h2>

      <p className="text-gray-400 text-sm mt-1">
        Welcome back 👋
      </p>

    </div>

    {/* USERNAME */}
    <input
      type="text"
      placeholder="Username"
      className="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
      value={user}
      onChange={(e) => setUser(e.target.value)}
    />

    {/* PASSWORD */}
    <input
      type="password"
      placeholder="Password"
      className="w-full p-3 bg-gray-900 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
      value={pass}
      onChange={(e) => setPass(e.target.value)}
    />

    {/* ERROR */}
    {error && (

      <p className="text-red-400 text-sm text-center">
        {error}
      </p>

    )}

    {/* LOGIN BUTTON */}
    <button
      onClick={handleLogin}

      disabled={loading}

      className={`
        w-full
        p-3
        rounded-xl
        font-semibold
        shadow-lg
        transition

        ${loading
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90"
        }
      `}
    >

      {loading ? "Logging in..." : "Login"}

    </button>

    {/* FORGOT PASSWORD */}
    <div className="text-center text-sm">

      <Link
        to="/forgot-password"
        className="text-blue-400 hover:text-blue-300 hover:underline transition"
      >
        Forgot Password?
      </Link>

    </div>

    {/* REGISTER */}
    <div className="text-center text-sm pt-2 text-gray-400">

      Don’t have an account?{" "}

      <Link
        to="/register"
        className="text-pink-400 hover:text-pink-300 hover:underline transition font-medium"
      >
        Register here
      </Link>

    </div>

  </div>

</div>

  );
}