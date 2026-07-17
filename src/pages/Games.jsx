import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import RewardAd from "../components/RewardAd";
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
    name: "Infinity Merge",
    icon: "🔲♾️",
    desc: "Every merge increases your Score",
    path: "/game-infinity",
    btnColor: "bg-gray-600",
  },
];
  return (
        <>
    <Helmet>
        <title>Play Games & Win Coins | IndianDost Games Zone</title>
        <meta
        name="description"
        content="Test your skills and luck in IndianDost Games Zone. Play Color Crash, Risk Tower, win coins, unlock rewards, and become a leaderboard champion."
      />
        </Helmet>
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
{/*earn rewards */}
<div className="relative overflow-hidden rounded-3xl border border-green-400/30 bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 p-6 mt-6 shadow-2xl">

  {/* Glow Effect */}
  <div className="absolute -top-16 -right-16 w-40 h-40 bg-green-500 opacity-20 rounded-full blur-3xl"></div>

  <div className="relative z-10">

    <div className="flex items-center justify-between mb-4">

      <div className="flex items-center gap-3">

        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-3xl shadow-lg">
          💰
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            Earn Free Coins
          </h2>

          <p className="text-gray-300 text-sm">
            Watch a short sponsored video and instantly receive rewards.
          </p>
        </div>

      </div>

      <span className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
        +20 Coins
      </span>

    </div>

    <div className="grid grid-cols-3 gap-3 my-5">

      <div className="rounded-xl bg-white/10 p-3 text-center">
        <div className="text-yellow-400 text-2xl">🎁</div>
        <div className="text-white font-semibold mt-2">
          Reward
        </div>
        <small className="text-gray-400">
          +20 Coins
        </small>
      </div>

      <div className="rounded-xl bg-white/10 p-3 text-center">
        <div className="text-blue-400 text-2xl">🎬</div>
        <div className="text-white font-semibold mt-2">
          30 Sec
        </div>
        <small className="text-gray-400">
          Video
        </small>
      </div>

      <div className="rounded-xl bg-white/10 p-3 text-center">
        <div className="text-green-400 text-2xl">⚡</div>
        <div className="text-white font-semibold mt-2">
          Instant
        </div>
        <small className="text-gray-400">
          Credit
        </small>
      </div>

    </div>

    <div className="rounded-xl bg-black/20 border border-white/10 p-4 mb-5">

      <p className="text-gray-200 text-center leading-7">
        🎉 Complete the video advertisement and receive
        <span className="text-yellow-300 font-bold">
          {" "}20 Coins{" "}
        </span>
        instantly in your IndianDost wallet.
      </p>

    </div>

    <div className="flex justify-center">
      <RewardAd />
    </div>

    <p className="text-center text-xs text-gray-400 mt-4">
      Maximum 10 rewarded ads per day.
    </p>

  </div>

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
    </>
  );
}