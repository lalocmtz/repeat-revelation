import { X, Copy, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Pattern } from "@/data/mockPatterns";

interface BetSlipProps {
  selections: Pattern[];
  onRemove: (id: string) => void;
}

const BetSlip = ({ selections, onRemove }: BetSlipProps) => {
  const [stake, setStake] = useState(100);
  const [mobileOpen, setMobileOpen] = useState(false);

  const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1);
  const probability = (1 / totalOdds) * 100;
  const payout = stake * totalOdds;

  const hasSelections = selections.length > 0;

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full w-72 flex-shrink-0 flex-col border-l border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">🎫 Bet Slip</span>
          {hasSelections && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {selections.length}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {!hasSelections ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground text-center px-4">
                Añade patrones con <span className="text-primary">+</span> para crear tu slip
              </p>
            </div>
          ) : (
            selections.map((s) => (
              <div key={s.id} className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {s.nextMatch.home} VS {s.nextMatch.away}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground truncate">
                      {s.team} — {s.type}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.hits}/{s.sample}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 shrink-0">
                    <span className="text-lg font-bold text-primary">{s.odds.toFixed(2)}</span>
                    <button onClick={() => onRemove(s.id)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {hasSelections && (
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cuota Total</span>
              <span className="font-bold text-primary">{totalOdds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Probabilidad</span>
              <span className="font-medium text-foreground">{probability.toFixed(1)}%</span>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Monto
              </label>
              <div className="flex items-center rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="ml-1 w-full bg-transparent text-sm text-foreground outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ganancia</span>
              <span className="text-xl font-bold text-primary">${payout.toFixed(2)}</span>
            </div>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
              Copiar slip
              <Copy className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet - only shows when there are selections */}
      {hasSelections && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
          {/* Expanded sheet */}
          {mobileOpen && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
          )}
          <div className={`relative z-50 rounded-t-2xl border-t border-border bg-background shadow-2xl transition-all ${mobileOpen ? 'max-h-[80vh]' : ''}`}>
            {/* Handle bar */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">🎫 Bet Slip</span>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {selections.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">{totalOdds.toFixed(2)}x</span>
                {mobileOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>

            {mobileOpen && (
              <div className="overflow-auto max-h-[60vh] px-4 pb-4 space-y-3">
                {/* Selections */}
                {selections.map((s) => (
                  <div key={s.id} className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase text-primary">
                          {s.nextMatch.home} VS {s.nextMatch.away}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground truncate">
                          {s.team} — {s.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-base font-bold text-primary">{s.odds.toFixed(2)}</span>
                        <button onClick={() => onRemove(s.id)} className="text-muted-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Calculator */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cuota Total</span>
                    <span className="font-bold text-primary">{totalOdds.toFixed(2)}</span>
                  </div>
                  <div>
                    <div className="flex items-center rounded-lg border border-border bg-card px-3 py-2">
                      <span className="text-sm text-muted-foreground">$</span>
                      <input
                        type="number"
                        value={stake}
                        onChange={(e) => setStake(Number(e.target.value))}
                        className="ml-1 w-full bg-transparent text-sm text-foreground outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ganancia</span>
                    <span className="text-xl font-bold text-primary">${payout.toFixed(2)}</span>
                  </div>
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">
                    Copiar slip
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BetSlip;