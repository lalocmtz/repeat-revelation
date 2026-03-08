import { useState } from "react";

const TerminalBar = () => {
  const [text] = useState("SCANNING LIGA MX: SAN 2.5 AVG ...   SCANNING PREMIER LEAGUE: LIV BTTS TRENDING ...   ALGO-ALERT: VALENCIA VS SEVILLA CORNERS (12/12) ...");

  return (
    <div className="flex items-center justify-between border-t border-border bg-card px-6 py-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse-glow rounded-full bg-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Terminal Live</span>
      </div>
      <div className="flex-1 mx-4 overflow-hidden">
        <p className="animate-marquee whitespace-nowrap text-xs font-mono text-muted-foreground">
          {text}
        </p>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
        <span>LATENCY: 14MS</span>
        <span>ENGINE: V3.4.2</span>
      </div>
    </div>
  );
};

export default TerminalBar;
