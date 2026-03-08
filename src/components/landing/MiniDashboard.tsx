import { Lock, ChevronRight } from "lucide-react";

const patterns = [
  {
    match: "Real Madrid vs Barcelona",
    competition: "La Liga",
    pattern: "Goles > 2.5 (90%)",
    confidence: 88,
    visible: true,
  },
  {
    match: "Manchester City vs Arsenal",
    competition: "Premier League",
    pattern: "BTTS (85%)",
    confidence: 82,
    visible: false,
  },
  {
    match: "Bayern vs Dortmund",
    competition: "Bundesliga",
    pattern: "Corners > 9.5",
    confidence: 79,
    visible: false,
  },
];

const MiniDashboard = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Mini dashboard preview</h2>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-primary" />
              <span className="text-sm text-primary">Datos en vivo</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-4 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Partido</span>
              <span>Competición</span>
              <span>Patrón detectado</span>
              <span className="text-right">Confianza</span>
            </div>

            {patterns.map((p, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 items-center gap-4 border-b border-border px-6 py-4 transition-colors last:border-0 ${
                  p.visible ? "hover:bg-secondary/50" : ""
                } ${!p.visible ? "select-none" : ""}`}
              >
                <div className={!p.visible ? "blur-sm" : ""}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm font-medium text-foreground">{p.match}</span>
                  </div>
                </div>
                <span className={`text-sm text-muted-foreground ${!p.visible ? "blur-sm" : ""}`}>
                  {p.competition}
                </span>
                <div className={!p.visible ? "blur-sm" : ""}>
                  <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                    {p.pattern}
                  </span>
                </div>
                <div className={`flex items-center justify-end gap-3 ${!p.visible ? "blur-sm" : ""}`}>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${p.confidence}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">{p.confidence}%</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <button className="flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80">
              <Lock className="h-3.5 w-3.5" />
              Desbloquear todos los partidos de hoy
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MiniDashboard;
