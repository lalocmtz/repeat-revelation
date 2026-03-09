import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface FiltersBarProps {
  activeTime: string;
  onTimeChange: (t: string) => void;
  activeLeague: string;
  onLeagueChange: (l: string) => void;
  leagues: string[];
}

const timeOptions = ["Hoy", "Mañana", "3 Días"];

const FiltersBar = ({ activeTime, onTimeChange, activeLeague, onLeagueChange, leagues }: FiltersBarProps) => {
  const [leagueOpen, setLeagueOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLeagueOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 overflow-x-auto scrollbar-hide">
      {/* Time pills */}
      <div className="flex items-center rounded-full border border-border bg-card p-0.5 shrink-0">
        {timeOptions.map((t) => (
          <button
            key={t}
            onClick={() => onTimeChange(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTime === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* League dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setLeagueOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            activeLeague !== "Todas"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="max-w-[100px] truncate">
            {activeLeague === "Todas" ? "Todas las ligas" : activeLeague}
          </span>
          <ChevronDown className={`h-3 w-3 transition-transform ${leagueOpen ? "rotate-180" : ""}`} />
        </button>

        {leagueOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-border bg-card shadow-xl">
            <div className="max-h-56 overflow-y-auto py-1">
              {leagues.map((league) => (
                <button
                  key={league}
                  onClick={() => {
                    onLeagueChange(league);
                    setLeagueOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-secondary ${
                    activeLeague === league
                      ? "text-primary font-semibold"
                      : "text-foreground"
                  }`}
                >
                  {league}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active filter badge */}
      {activeLeague !== "Todas" && (
        <button
          onClick={() => onLeagueChange("Todas")}
          className="shrink-0 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          ✕ Limpiar
        </button>
      )}
    </div>
  );
};

export default FiltersBar;
