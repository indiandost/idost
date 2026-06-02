import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
const games = [
  {
    name: "Color Crash",
    icon: "🎨",
    desc: "Tap colors and share the reward pool with winning entries.",
    path: "/game",
    btnColor: "bg-green-600 hover:bg-green-700",
  },
  {
    name: "Risk Tower",
    icon: "🏢",
    desc: "Climb floors, avoid traps, and cash out before losing.",
    path: "/risk-tower",
    btnColor: "bg-orange-600 hover:bg-orange-700",
  },
  {
    name: "Coming Soon",
    icon: "🎲",
    desc: "More exciting games are on the way.",
    path: "#",
    btnColor: "bg-gray-600",
  },
  {
    name: "Coming Soon",
    icon: "🃏",
    desc: "New multiplayer challenges coming soon.",
    path: "#",
    btnColor: "bg-gray-600",
  },
];
  return (
    <div className="max-w-4xl mx-auto p-4">

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-700 text-white rounded-2xl p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">
          🎮 Games Zone
        </h1>

        <p className="text-gray-100">
          Play exciting games, challenge your luck, and win coins.
          Build your balance and climb the leaderboard!
        </p>
      </div>

      {/* Games */}
      <h2 className="text-xl font-bold mb-4 text-white">
        Available Games
      </h2>
<div className="grid grid-cols-2 gap-4">
  {games.map((game, index) => (
    <div
      key={index}
      className="bg-gray-900 text-white rounded-2xl p-4 border border-gray-800 flex flex-col"
    >
      <div className="text-4xl mb-2">
        {game.icon}
      </div>

      <h3 className="text-lg font-bold mb-2">
        {game.name}
      </h3>

      <p className="text-gray-300 text-sm flex-grow">
        {game.desc}
      </p>

      <button
        onClick={() =>
          game.path !== "#" && navigate(game.path)
        }
        className={`mt-4 w-full py-2 rounded-lg font-semibold ${game.btnColor}`}
      >
        {game.path === "#"
          ? "Coming Soon"
          : "Play Now"}
      </button>
    </div>
  ))}
</div>

      {/* Motivation */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 mt-6">
        <h2 className="text-green-400 text-xl font-bold mb-2 text-white">
          🚀 Build Your Coin Balance
        </h2>

        <p className="text-gray-300">
          Every game is a new opportunity to win coins.
          Play smart, take calculated risks, and grow your rewards.
          The more active you are, the more chances you have to increase your coin balance.
        </p>
      </div>

      {/* Rules */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 mt-6">
        <h2 className="text-xl font-bold mb-3 text-white">
          📜 Game Rules & Information
        </h2>

        <ul className="space-y-2 text-gray-300 text-sm text-left w-full">
          <li>✅ Each game has its own rules and reward structure.</li>
          <li>✅ Rewards are credited automatically after successful wins.</li>
          <li>✅ Coin balances are updated in real-time.</li>
          <li>✅ Some games are based on luck and probability.</li>
          <li>✅ Entry fees are non-refundable once a game begins.</li>
          <li>✅ Abuse, automation, bug exploitation, or multiple-account usage is prohibited.</li>
          <li>✅ Suspicious activity may result in reward cancellation or account restrictions.</li>
          <li>✅ Game mechanics and rewards may change in future updates.</li>
        </ul>

        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-300 font-semibold">
            ⚠️ Play Responsibly
          </p>

          <p className="text-sm text-gray-300 mt-1">
            Games involve risk. Winning is never guaranteed.
            Play for entertainment and only use coins you are willing to spend.
          </p>
        </div>
      </div>

    </div>
  );
}