import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";

// ✅ ADD THIS
import { CoinProvider } from "./context/CoinContext";

// 0 = NONE
// 1 = ERROR
// 2 = WARNING
// 3 = INFO
// 4 = DEBUG

AgoraRTC.setLogLevel(1);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>

    {/* ✅ PROVIDER WRAP ADDED HERE */}
    <CoinProvider>

      <BrowserRouter >
        <App />
      </BrowserRouter>

    </CoinProvider>

  </React.StrictMode>
);