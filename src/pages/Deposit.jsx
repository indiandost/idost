import { useState } from "react";
import { Helmet } from "react-helmet-async";
import qrImage from "../assets/qr.png";
const API = import.meta.env.VITE_API_URL;

export default function Deposit() {
  const user =   JSON.parse(localStorage.getItem("user"));
  const [amount,setAmount] =  useState("");
  const [ref,setRef] = useState("");

  const submit = async ()=>{
    const res = await fetch(
      `${API}/deposit/request`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          user_id:user.srno,
          amount,
          upi_ref:ref,
          screenshot:""
        })
      }
    );

    const data = await res.json();
    alert(data.message);
  };

  return (
     <>
       <Helmet>
        <title>Add Coins & Rewards | IndianDost Wallet</title>
        <meta
          name="description"
          content="Top up your IndianDost coin balance securely. Use coins for games, rewards, challenges, and exclusive platform features."
        />
      </Helmet>
<div className="max-w-xl mx-auto p-4 text-white">
<h1 className="text-2xl font-bold mb-4 text-white">
💰 Add Coins
</h1>

<div className="bg-gray-900 rounded-xl p-5">

<div className="mb-4">
 ₹1 = 100 Coins 
</div>

<div className="mb-4">
₹50 = 5000 Coins 
</div>

<div className="mb-4">
 ₹100 = 10000 Coins 
</div>

<div className="mb-4">
 ₹500 = 50000 Coins 
</div>

<img
 src={qrImage}
 alt="QR Code"
className="w-64 mx-auto rounded-xl mb-4"
 style={{
        maxWidth: "220px"
      }}
/>

<div className="text-center mb-4">

UPI ID:

<b>
indiandost2-1@okicici
</b>

</div>

<input
type="number"
placeholder="Amount Paid (₹)"
value={amount}
onChange={(e)=>setAmount(e.target.value)}
className="w-full p-3 rounded bg-gray-800 mb-3"
/>

<input
type="text"
placeholder="UPI Reference Number"
value={ref}
onChange={(e)=>setRef(e.target.value)}
className="w-full p-3 rounded bg-gray-800 mb-3"
/>

<button
onClick={submit}
className="w-full bg-green-600 p-3 rounded"
>
Submit Deposit Request
</button>

</div>
<div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-2xl p-5 mb-5 shadow-lg border border-green-400">

  <div className="flex items-center gap-2 mb-2">
    <span className="text-2xl">🎁</span>
    <h2 className="text-xl font-bold">
      Deposit Bonus Offer
    </h2>
  </div>

  <p className="text-sm opacity-90 mb-3">
    Get extra coins instantly on verified deposits.
  </p>

  <div className="bg-white/10 rounded-xl p-3">
    <div className="flex justify-between py-1">
      <span>₹100 Deposit</span>
      <span className="font-bold">
        11000 Coins
      </span>
    </div>

    <div className="text-xs opacity-80 mb-2">
      Includes 1000 Bonus Coins
    </div>

    <hr className="border-white/20 my-2" />

    <div className="text-center font-semibold">
      ₹100 or More Deposits Get
      <span className="text-yellow-300">
        {" "}5% Extra Bonus Coins
      </span>
    </div>
  </div>

</div>
<div className="mt-5 bg-yellow-900/30 p-4 rounded">

<h3 className="font-bold mb-2 text-white">
Important
</h3>

<ul className="list-disc ml-5 space-y-1 text-sm text-left">
<li>Pay using the QR code or UPI ID above.</li>
<li>Enter the correct UPI reference number.</li>
<li>Coins are added only after manual verification.</li>
<li>Verification usually takes up to 24 hours.</li>
<li>Providing false payment details may result in account restrictions.</li>
</ul>

</div>

</div>
</>
  );
}