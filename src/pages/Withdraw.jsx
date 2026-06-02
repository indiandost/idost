import { Link } from "react-router-dom";

export default function WithdrawInfo() {
return ( <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">

  {/* Header */}
  <div className="mb-6">
    <Link
      to="/"
      className="inline-block bg-gray-800 px-4 py-2 rounded-lg mb-4"
    >
      ← Back
    </Link>

    <h1 className="text-3xl font-bold text-white">
      💰 Coins & Withdrawal
    </h1>

    <p className="text-gray-400 mt-2">
      Earn coins by participating in activities, games and community engagement.
    </p>
  </div>

  {/* Coin Value */}
  <div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
    <h2 className="text-xl font-bold mb-3 text-white">
      🪙 Coin Value
    </h2>

    <div className="space-y-2 text-gray-300">
      <p>100 Coins = ₹1 INR</p>
      <p>1,000 Coins = ₹10 INR</p>
      <p>10,000 Coins = ₹100 INR</p>
    </div>
  </div>

  {/* Ways to Earn */}
  <div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
    <h2 className="text-xl font-bold mb-3 text-white">
      🎯 Ways to Earn Coins
    </h2>

    <ul className="list-disc ml-5 space-y-2 text-gray-300 text-left">
      <li>Play Color Crash and win rounds.</li>
      <li>Play Risk Tower and cash out rewards.</li>
      <li>Daily login rewards.</li>
      <li>Invite friends and referrals.</li>
      <li>Create or join Jamming Rooms.</li>
      <li>Participate in platform events.</li>
      <li>Community engagement and future promotions.</li>
      
    </ul>
  </div>

  {/* Eligibility */}
  <div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
    <h2 className="text-xl font-bold mb-3 text-white">
      ✅ Withdrawal Eligibility
    </h2>

    <ul className="list-disc ml-5 space-y-2 text-gray-300 text-left">
      <li>Minimum withdrawal: 10,000 Coins (₹100).</li>
      <li>User must have at least one approved friend.</li>
      <li>User must have shared at least one timeline post.</li>
      <li>User must have participated in a game activity.</li>
      <li>User must have joined or hosted a Jamming Room.</li>
      <li>Account must not violate platform rules.</li>
    </ul>
  </div>

  {/* Process */}
  <div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
    <h2 className="text-xl font-bold mb-3 text-white">
      📤 Withdrawal Process
    </h2>

    <ul className="list-disc ml-5 space-y-2 text-gray-300 text-left">
      <li>Submit a withdrawal request.</li>
      <li>Our team reviews account activity.</li>
      <li>Verification may take up to 7 days.</li>
      <li>Approved payments are sent through UPI or supported payment methods.</li>
      <li>You will receive a status update after review.</li>
    </ul>
  </div>

  {/* Terms */}
  <div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
    <h2 className="text-xl font-bold mb-3 text-white">
      📜 Important Terms
    </h2>

    <ul className="list-disc ml-5 space-y-2 text-gray-300 text-left">
      <li>Coins are promotional platform rewards.</li>
      <li>Fraud, automation, fake accounts or abuse may result in cancellation of rewards.</li>
      <li>Multiple accounts created to earn rewards may be suspended.</li>
      <li>Withdrawal requests may be rejected if verification fails.</li>
      <li>The platform reserves the right to review unusual activity before payment.</li>
      <li>Coin values and reward policies may change in future updates.</li>
      {/* Platform Requirements */}

<div className="bg-gray-900 rounded-2xl p-5 mb-5 border border-gray-800">
  <h2 className="text-xl font-bold mb-3 text-white">
    📋 Withdrawal Requirements
  </h2>

  <ul className="list-disc ml-5 space-y-2 text-gray-300 text-left">
    <li>
      Minimum withdrawal amount is 10,000 Coins (₹100).
    </li>

<li>
  Account must be at least 7 days old.
</li>

<li>
  User must have at least 1 friend added on the platform.
</li>

<li>
  User must have shared at least 1 timeline post.
</li>

<li>
  User must have participated in at least 1 game.
</li>

<li>
  User must have joined or hosted at least 1 Jamming Room.
</li>

<li>
  Withdrawal requests are manually reviewed before approval.
</li>

<li>
  Verification and payment processing may take up to 7 days.
</li>

<li>
  Accounts involved in spam, fraud, fake referrals, automation,
  multiple accounts, or suspicious activity may have rewards
  cancelled and withdrawal requests rejected.
</li>

<li>
  Coins are promotional rewards and may expire after
  90 days of account inactivity.
</li>

<li>
  The platform reserves the right to review, approve,
  reject, or delay any withdrawal request for security
  and verification purposes.
</li>


  </ul>
</div>

    </ul>
  </div>

  {/* Motivation */}
  <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-center">
    <h2 className="text-2xl font-bold mb-2">
      🚀 Start Earning Today
    </h2>

    <p className="text-white/90">
      Play games, make friends, join rooms, engage with the community and
      convert your earned coins into real rewards.
    </p>
  </div>

</div>

);
}
