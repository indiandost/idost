import { useNavigate, useLocation } from "react-router-dom";
import { useLudoActiveGame } from "../context/LudoActiveGameContext";

// 👉 Apna actual Ludo game route path yahan daalo (jo App.jsx me
// <Route path="..." element={<LudoGame />} /> me registered hai)
const LUDO_ROUTE_PATH = "/games/ludo";

export default function FloatingLudoBadge() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeGame } = useLudoActiveGame();

  // koi active game nahi, ya user already ludo page pe hi hai — kuch mat dikhao
  if (!activeGame || location.pathname === LUDO_ROUTE_PATH) return null;

  const { isMyTurn, roomCode } = activeGame;

  return (
    <button
      onClick={() => navigate(LUDO_ROUTE_PATH)}
      className={`
        fixed bottom-36 right-4 z-[70]
        flex items-center gap-2
        pl-3 pr-4 py-2.5 rounded-full
        shadow-2xl border
        transition active:scale-95
        ${
          isMyTurn
            ? "bg-gradient-to-r from-emerald-500 to-emerald-400 border-emerald-300 animate-pulse"
            : "bg-zinc-900 border-zinc-700"
        }
      `}
    >
      <span className="text-xl">🎲</span>
      <div className="text-left leading-tight">
        <div className={`text-xs font-black ${isMyTurn ? "text-black" : "text-white"}`}>
          {isMyTurn ? "Your Turn!" : "Ludo Game"}
        </div>
        <div className={`text-[10px] font-mono ${isMyTurn ? "text-black/70" : "text-zinc-400"}`}>
          {roomCode}
        </div>
      </div>
    </button>
  );
}
