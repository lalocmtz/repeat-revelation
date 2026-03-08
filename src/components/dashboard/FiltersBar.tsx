import { ChevronDown, Globe, Target, LayoutGrid } from "lucide-react";

interface FiltersBarProps {
  activeTime: string;
  onTimeChange: (t: string) => void;
}

const timeOptions = ["Hoy", "Mañana", "3 Días"];

const FiltersBar = ({ activeTime, onTimeChange }: FiltersBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-3">
      {/* Time pills */}
      <div className="flex items-center rounded-full border border-border bg-card p-0.5">
        {timeOptions.map((t) => (
          <button
            key={t}
            onClick={() => onTimeChange(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              activeTime === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dropdowns */}
      <button className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground">
        <Globe className="h-3.5 w-3.5" />
        Leagues
        <ChevronDown className="h-3 w-3" />
      </button>

      <button className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground">
        <Target className="h-3.5 w-3.5" />
        Context
        <ChevronDown className="h-3 w-3" />
      </button>

      <button className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground">
        <LayoutGrid className="h-3.5 w-3.5" />
        Sample (15)
        <ChevronDown className="h-3 w-3" />
      </button>

      {/* Odds range */}
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
        <span>ODDS</span>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-24 rounded-full bg-secondary">
            <div className="h-full w-3/4 rounded-full bg-primary" />
          </div>
        </div>
        <span className="font-mono">1.5 - 3.2</span>
      </div>
    </div>
  );
};

export default FiltersBar;
