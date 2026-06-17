import { useEffect, useState } from "react";

export default function ActivityTicker() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setItems([
      `🎮 ${Math.floor(Math.random() * 15) + 35} Quiz Battles Today`,
      `🎵 ${Math.floor(Math.random() * 8) + 6} Audio Jams Active`,
      `👥 ${Math.floor(Math.random() * 40) + 20} Members Joined This Week`,
      `💬 ${Math.floor(Math.random() * 2000) + 3000} Messages Shared`,
      `💰 ${Math.floor(Math.random() * 8) + 2} Members Withdrew Rewards Today`,
      `🏦 ₹${Math.floor(Math.random() * 2000) + 1000} Rewards Paid This Week`
    ]);
  }, []);

  useEffect(() => {
    if (!items.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [items]);

  if (!items.length) return null;

  return (
    <div className="bg-gray-800 rounded-xl px-4 py-2 overflow-hidden">
      <div
        key={index}
        className="text-sm text-white text-center animate-fade"
      >
        {items[index]}
      </div>
    </div>
  );
}