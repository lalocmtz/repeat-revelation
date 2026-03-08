import { Plus, Flame, TrendingUp } from "lucide-react";
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
      {/* Header */}
      <div className="grid grid-cols-[120px_1fr_90px_100px_80px_100px_60px] items-center gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>Liga</span>
        <span>Patrón táctico</span>
        <span>Tipo</span>
        <span>Próximo partido</span>
        <span className="text-center">Momio</span>
        <span className="text-center">Repetición</span>
        <span className="text-center">Acción</span>
      </div>

      {/* Rows */}
      {patterns.map((p) => (
        <div
          key={p.id}
          className="group grid grid-cols-[120px_1fr_90px_100px_80px_100px_60px] items-center gap-4 border-t border-border px-6 py-4 transition-colors hover:bg-secondary/30"
        >
          {/* League */}
          <span className="text-sm text-muted-foreground">{p.league}</span>

          {/* Pattern */}
          <div>
            <div className="text-sm font-semibold text-foreground">{p.team}</div>
            <div className="text-xs text-muted-foreground">{p.description}</div>
          </div>

          {/* Type badge */}
          <div>
            <span className={`inline-block rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${typeColorMap[p.type] || "bg-secondary text-foreground"}`}>
              {p.type}
            </span>
          </div>

          {/* Next match */}
          <div>
            <div className="text-sm font-medium text-foreground">
              {p.nextMatch.home} vs {p.nextMatch.away}
            </div>
            <div className="text-xs text-muted-foreground">{p.matchTime}</div>
          </div>

          {/* Odds */}
          <div className="text-center text-sm font-semibold text-foreground">{p.odds.toFixed(2)}</div>

          {/* Repetition */}
          <div className="flex items-center justify-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
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

          {/* Action */}
          <div className="flex justify-center">
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
      ))}

      {/* Load more */}
      <div className="flex justify-center border-t border-border py-6">
        <button className="rounded-full border border-border px-6 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          Cargar más patrones
        </button>
      </div>
    </div>
  );
};

export default PatternTable;
