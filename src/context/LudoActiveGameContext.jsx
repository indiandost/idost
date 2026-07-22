import { createContext, useContext, useState } from "react";

// Lightweight global signal — NOT the full game state (that stays local
// to LudoGame.jsx). Just enough for a floating badge on other pages to
// know: is there an active game, and is it currently this user's turn.
const LudoActiveGameContext = createContext(null);

export function LudoActiveGameProvider({ children }) {
  const [activeGame, setActiveGame] = useState(null);
  // shape when set: { roomCode, myColor, isMyTurn, status }
  // null = no active game

  return (
    <LudoActiveGameContext.Provider value={{ activeGame, setActiveGame }}>
      {children}
    </LudoActiveGameContext.Provider>
  );
}

export function useLudoActiveGame() {
  const ctx = useContext(LudoActiveGameContext);
  if (!ctx) {
    throw new Error("useLudoActiveGame must be used inside LudoActiveGameProvider");
  }
  return ctx;
}
