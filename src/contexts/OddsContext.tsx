import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type OddsFormat = "decimal" | "american";

interface OddsContextType {
  oddsFormat: OddsFormat;
  setOddsFormat: (f: OddsFormat) => void;
  formatOdds: (decimal: number) => string;
}

const OddsContext = createContext<OddsContextType>({
  oddsFormat: "decimal",
  setOddsFormat: () => {},
  formatOdds: (d) => d.toFixed(2),
});

export const useOdds = () => useContext(OddsContext);

function decimalToAmerican(decimal: number): string {
  if (decimal >= 2) return `+${Math.round((decimal - 1) * 100)}`;
  return `-${Math.round(100 / (decimal - 1))}`;
}

export const OddsProvider = ({ children }: { children: ReactNode }) => {
  const [oddsFormat, setOddsFormatState] = useState<OddsFormat>(() => {
    const saved = localStorage.getItem("tiplives_odds_format");
    return saved === "american" ? "american" : "decimal";
  });

  const setOddsFormat = (f: OddsFormat) => {
    setOddsFormatState(f);
    localStorage.setItem("tiplives_odds_format", f);
  };

  const formatOdds = (decimal: number): string => {
    return oddsFormat === "american" ? decimalToAmerican(decimal) : decimal.toFixed(2);
  };

  return (
    <OddsContext.Provider value={{ oddsFormat, setOddsFormat, formatOdds }}>
      {children}
    </OddsContext.Provider>
  );
};