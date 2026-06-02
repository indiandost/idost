import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function Withdraw() {

const user =
JSON.parse(
localStorage.getItem("user")
);

const [coins, setCoins] =
useState("");

const [upi, setUpi] =
useState("");

const submit = async () => {

const res = await fetch(
  `${API}/withdraw/request`,
  {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json"
    },
    body: JSON.stringify({
      user_id: user.srno,
      coins: Number(coins),
      payment_method: "UPI",
      account_details: upi
    })
  }
);

const data =
  await res.json();

alert(data.message);


};

return ( <div className="p-4 text-white">


  <h1 className="text-2xl font-bold mb-4">
    Withdraw Coins
  </h1>

  <div className="bg-gray-900 p-4 rounded-xl">

    <p className="mb-3">
      100 Coins = ₹1
    </p>

    <input
      type="number"
      placeholder="Coins"
      value={coins}
      onChange={(e) =>
        setCoins(e.target.value)
      }
      className="w-full p-3 rounded bg-gray-800 mb-3"
    />

    <input
      type="text"
      placeholder="UPI ID"
      value={upi}
      onChange={(e) =>
        setUpi(e.target.value)
      }
      className="w-full p-3 rounded bg-gray-800 mb-3"
    />

    <button
      onClick={submit}
      className="bg-green-600 px-4 py-2 rounded"
    >
      Submit Request
    </button>

  </div>

</div>

);
}
