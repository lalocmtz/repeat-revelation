import { Plus, Flame } from "lucide-react";
import { useOdds } from "@/contexts/OddsContext";
import type { Pattern } from "@/data/mockPatterns";

interface PatternTableProps {
  patterns: Pattern[];
  onAddToSlip: (pattern: Pattern) => void;
  slipIds: string[];
  totalCount?: number;
  isEmpty?: boolean; // true when DB has no opportunities at all (pipeline not run yet)
}

const typeColorMap: Record<string, string> = {
  GOLES: "bg-primary/20 text-primary",
  BTTS: "bg-primary/20 text-primary",
  CORNERS: "bg-warning/20 text-warning",
  RESULT: "bg-blue-500/20 text-blue-400",
  CARDS: "bg-yellow-500/20 text-yellow-400",
};

const PatternTable = ({ patterns, onAddToSlip, slipIds, totalCount = 0 }: PatternTableProps) => {
  const { formatOdds } = useOdds();

  if (patterns.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 px-6">
        <div className="text-4xl opacity-20">⚽</div>
        <p className="text-sm font-medium text-foreground text-center">
          No hay patrones fuertes con estos filtros.
        </p>
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Prueba cambiar el período de tiempo, el mercado o la liga.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-[110px_1fr_80px_110px_70px_90px_50px] items-center gap-3 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border/50">
        <span>Liga</span>
        <span>Patrón</span>
        <span>Tipo</span>
        <span>Partido</span>
        <span className="text-center">Cuota</span>
        <span className="text-center">Repetición</span>
        <span className="text-center">+</span>
      </div>

      {/* Rows */}
      {patterns.map((p) => (
        <div key={p.id}>
          {/* Mobile card layout */}
          <div className="md:hidden border-t border-border px-4 py-3 active:bg-secondary/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-muted-foreground truncate">{p.league}</span>
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 ${typeColorMap[p.type] || "bg-secondary text-foreground"}`}>
                    {p.type}
                  </span>
                  {p.hot && <Flame className="h-3 w-3 text-primary shrink-0" />}
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{p.team}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {p.nextMatch.home} vs {p.nextMatch.away}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{p.matchTime}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-base font-bold text-foreground tabular-nums">{formatOdds(p.odds)}</span>
                <RepetitionBadge hits={p.hits} sample={p.sample} hot={p.hot} />
                <AddButton onClick={() => onAddToSlip(p)} active={slipIds.includes(p.id)} size="md" />
              </div>
            </div>
          </div>

          {/* Desktop row layout */}
          <div className="hidden md:grid grid-cols-[110px_1fr_80px_110px_70px_90px_50px] items-center gap-3 border-t border-border px-4 py-3.5 transition-colors duration-150 hover:bg-secondary/30 group cursor-default">
            <span className="text-xs text-muted-foreground truncate">{p.league}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{p.team}</div>
              <div className="text-xs text-muted-foreground truncate">{p.description}</div>
            </div>
            <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide w-fit ${typeColorMap[p.type] || "bg-secondary text-foreground"}`}>
              {p.type}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {p.nextMatch.home} vs {p.nextMatch.away}
              </div>
              <div className="text-xs text-muted-foreground">{p.matchTime}</div>
            </div>
            <div className="text-center text-sm font-semibold text-foreground tabular-nums">
              {formatOdds(p.odds)}
            </div>
            <div className="flex items-center justify-center">
              <RepetitionBadge hits={p.hits} sample={p.sample} hot={p.hot} />
            </div>
            <div className="flex justify-center">
              <AddButton onClick={() => onAddToSlip(p)} active={slipIds.includes(p.id)} size="sm" />
            </div>
          </div>
        </div>
      ))}

      {/* Footer count */}
      {totalCount > patterns.length && (
        <div className="border-t border-border py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Mostrando {patterns.length} de {totalCount} patrones
          </p>
        </div>
      )}
      {totalCount <= patterns.length && patterns.length > 0 && (
        <div className="border-t border-border py-4 text-center">
          <p className="text-xs text-muted-foreground">
            {patterns.length} {patterns.length === 1 ? "patrón" : "patrones"} encontrados
          </p>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

function RepetitionBadge({ hits, sample, hot }: { hits: number; sample: number; hot: boolean }) {
  const ratio = hits / sample;
  const colorClass =
    ratio >= 0.9
      ? "bg-primary/15 text-primary"
      : ratio >= 0.75
      ? "bg-warning/15 text-warning"
      : "bg-secondary text-muted-foreground";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${colorClass}`}>
      {hits}/{sample}
      {hot && <Flame className="h-3 w-3" />}
    </span>
  );
}

function AddButton({
  onClick,
  active,
  size,
}: {
  onClick: () => void;
  active: boolean;
  size: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <button
      onClick={onClick}
      aria-label={active ? "Quitar del slip" : "Agregar al slip"}
      className={`flex ${dim} items-center justify-center rounded-full border transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      <Plus className={icon} />
    </button>
  );
}

export default PatternTable;
