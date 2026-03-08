import { Plus, Flame } from "lucide-react";
import type { Pattern } from "@/data/mockPatterns";

interface PatternTableProps {
  patterns: Pattern[];
  onAddToSlip: (pattern: Pattern) => void;
  slipIds: string[];
}

const typeColorMap: Record<string, string> = {
  GOLES: "bg-primary/20 text-primary",
  BTTS: "bg-primary/20 text-primary",
  CORNERS: "bg-warning/20 text-warning",
  RESULT: "bg-blue-500/20 text-blue-400",
  CARDS: "bg-yellow-500/20 text-yellow-400",
};

const PatternTable = ({ patterns, onAddToSlip, slipIds }: PatternTableProps) => {
  return (
    <div className="flex-1 overflow-auto">
      {/* Desktop Header - hidden on mobile */}
      <div className="hidden md:grid grid-cols-[100px_1fr_80px_100px_70px_90px_50px] items-center gap-3 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>Liga</span>
        <span>Patrón táctico</span>
        <span>Tipo</span>
        <span>Partido</span>
        <span className="text-center">Momio</span>
        <span className="text-center">Repetición</span>
        <span className="text-center">+</span>
      </div>

      {/* Rows */}
      {patterns.map((p) => (
        <div key={p.id}>
          {/* Mobile card layout */}
          <div className="md:hidden border-t border-border px-4 py-3 active:bg-secondary/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-muted-foreground">{p.league}</span>
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${typeColorMap[p.type] || "bg-secondary text-foreground"}`}>
                    {p.type}
                  </span>
                  {p.hot && <Flame className="h-3 w-3 text-primary" />}
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{p.team}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {p.nextMatch.home} vs {p.nextMatch.away} · {p.matchTime}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-base font-bold text-foreground">{p.odds.toFixed(2)}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  p.hits / p.sample >= 0.9
                    ? "bg-primary/15 text-primary"
                    : p.hits / p.sample >= 0.75
                    ? "bg-warning/15 text-warning"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {p.hits}/{p.sample}
                </span>
                <button
                  onClick={() => onAddToSlip(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                    slipIds.includes(p.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop row layout */}
          <div className="hidden md:grid grid-cols-[100px_1fr_80px_100px_70px_90px_50px] items-center gap-3 border-t border-border px-4 py-3.5 transition-colors hover:bg-secondary/30">
            <span className="text-sm text-muted-foreground">{p.league}</span>
            <div>
              <div className="text-sm font-semibold text-foreground">{p.team}</div>
              <div className="text-xs text-muted-foreground">{p.description}</div>
            </div>
            <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeColorMap[p.type] || "bg-secondary text-foreground"}`}>
              {p.type}
            </span>
            <div>
              <div className="text-sm font-medium text-foreground">{p.nextMatch.home} vs {p.nextMatch.away}</div>
              <div className="text-xs text-muted-foreground">{p.matchTime}</div>
            </div>
            <div className="text-center text-sm font-semibold text-foreground">{p.odds.toFixed(2)}</div>
            <div className="flex items-center justify-center">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                p.hits / p.sample >= 0.9
                  ? "bg-primary/15 text-primary"
                  : p.hits / p.sample >= 0.75
                  ? "bg-warning/15 text-warning"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {p.hits}/{p.sample}
                {p.hot && <Flame className="h-3 w-3" />}
              </span>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => onAddToSlip(p)}
                className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                  slipIds.includes(p.id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Load more */}
      <div className="flex justify-center border-t border-border py-5">
        <button className="rounded-full border border-border px-5 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          Cargar más patrones
        </button>
      </div>
    </div>
  );
};

export default PatternTable;