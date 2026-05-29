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
      IndianDost respects your privacy and is committed to protecting your personal information.
    </p>

    {/* Information */}
    <h2 className="text-2x text-white font-semibold mt-6 mb-2">
      Information We Collect
    </h2>

    <p className="mb-4 text-gray-300">
      We may collect profile information such as name, email, gender,
      profile photos, uploaded content, chat messages, reels, karaoke
      uploads, and live room activity.
    </p>

    <p className="mb-4 text-gray-300">
      We may also collect device information including device model,
      operating system, IP address, and app usage information for
      security and performance purposes.
    </p>

    {/* Permissions */}
    <h2 className="text-2x text-white font-semibold mt-6 mb-2">
      Permissions
    </h2>

    <p className="mb-4 text-gray-300">
      Camera permission is used for video calls, reels, karaoke,
      profile uploads, and live streaming features.
    </p>

    <p className="mb-4 text-gray-300">
      Microphone permission is used for voice chat, karaoke,
      live rooms, and audio/video calling features.
    </p>

    <p className="mb-4 text-gray-300">
      Storage and photo permissions are used to upload images,
      videos, and other media content.
    </p>

    <p className="mb-4 text-gray-300">
      Location permission may be used to improve nearby user and
      content recommendations.
    </p>

    {/* Usage */}
    <h2 className="text-2x text-white font-semibold mt-6 mb-2">
      How We Use Information
    </h2>

    <p className="mb-4 text-gray-300">
      We use collected information to provide social features,
      messaging, live rooms, gifts, premium features, improve app
      performance, and maintain platform security.
    </p>

    {/* Sharing */}
    <h2 className="text-2x text-white font-semibold mt-6 mb-2">
      Information Sharing
    </h2>

    <p className="mb-4 text-gray-300">
      IndianDost does not sell personal information. Information may
      be shared only with trusted services required for app
      functionality, analytics, security, or legal compliance.
    </p>

    {/* Account Deletion */}
    <h2 className="text-2x text-white font-semibold mt-6 mb-2">
      Account Deletion
    </h2>

    <p className="mb-4 text-gray-300">
      Users may request account deletion from inside the app or by
      contacting us. Deleted accounts and related data are removed
      within a reasonable time unless required by law.
    </p>

    {/* Children */}
    <h2 className="text-2x text-white font-semibold mt-6 mb-2">
      Children's Privacy
    </h2>

    <p className="mb-4 text-gray-300">
      IndianDost is intended for users aged 16 years or older. We do
      not knowingly collect personal information from children.
    </p>

    {/* Security */}
    <h2 className="text-2x text-white font-semibold mt-6 mb-2">
      Security
    </h2>

    <p className="mb-4 text-gray-300">
      We take reasonable measures to protect user information and
      maintain the security of our platform.
    </p>

    {/* Changes */}
    <h2 className="text-2x text-white font-semibold mt-6 mb-2">
      Changes To This Policy
    </h2>

    <p className="mb-4 text-gray-300">
      We may update this Privacy Policy from time to time. Continued
      use of the app means acceptance of updated policies.
    </p>

    {/* Contact */}
    <h2 className="text-2x text-white font-semibold mt-6 mb-2">
      Contact Us
    </h2>

    <p className="mb-4 text-gray-300">
      Email: gconpindia@gmail.com
    </p>


    </div>
  );
}