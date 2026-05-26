import { useNavigate } from "react-router-dom";
export default function PrivacyPolicy() {
   const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white p-5">
       <br/>
       <button
        onClick={() => navigate(-1)}
        className="mb-6 bg-gray-700 px-4 py-2 rounded"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-4 text-white">
        Privacy Policy
      </h1>

      <p className="mb-4 text-gray-300">
        IndianDost respects your privacy.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Information We Collect
      </h2>

      <p className="text-gray-400">
        We may collect profile information, chat data,
        uploaded content, and device permissions such
        as camera, microphone, and location for app features.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Permissions
      </h2>

      <p className="text-gray-400">
        Camera and microphone are used for video/audio
        calling, karaoke, and reels.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        Contact
      </h2>

      <p className="text-gray-400">
        Email: gconpindia@gmail.com
      </p>

    </div>
  );
}