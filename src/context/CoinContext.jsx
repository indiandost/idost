import { createContext, useContext, useState } from "react";

const CoinContext = createContext();

export function CoinProvider({ children }) {
  const [coins, setCoins] = useState(0);

  return (
    <CoinContext.Provider value={{ coins, setCoins }}>
      {children}
    </CoinContext.Provider>
  );
}

export function useCoins() {
  const ctx = useContext(CoinContext);

  if (!ctx) {
    throw new Error("useCoins must be used inside CoinProvider");
  }

  return ctx;
}