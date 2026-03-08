import { Globe, ChevronDown } from "lucide-react";

interface FiltersBarProps {
  activeTime: string;
  onTimeChange: (t: string) => void;
}

const timeOptions = ["Hoy", "Mañana", "3 Días"];

const FiltersBar = ({ activeTime, onTimeChange }: FiltersBarProps) => {
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

      {/* Leagues dropdown */}
      <button className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0">
        <Globe className="h-3.5 w-3.5" />
        Ligas
        <ChevronDown className="h-3 w-3" />
      </button>
    </div>
  );
};

export default FiltersBar;