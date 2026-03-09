import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import FiltersBar from "@/components/dashboard/FiltersBar";
import MarketTabs from "@/components/dashboard/MarketTabs";
import PatternTable from "@/components/dashboard/PatternTable";
import BetSlip from "@/components/dashboard/BetSlip";
import type { Pattern } from "@/data/mockPatterns";
import { useAuth } from "@/contexts/AuthContext";
import { useFootballData } from "@/hooks/useFootballData";
import { Zap, Lock, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Returns YYYY-MM-DD string for a date offset from today
function getDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

const Dashboard = () => {
  const { user, isPremium, loading: authLoading } = useAuth();
  const { patterns: apiPatterns, loading: dataLoading, error, status, refetch } = useFootballData();
  const [activeTime, setActiveTime] = useState("3 Días");
  const [activeTab, setActiveTab] = useState("Popular");
  const [activeLeague, setActiveLeague] = useState("Todas");
  const [slipSelections, setSlipSelections] = useState<Pattern[]>([]);

  // Determine the effective state for UI rendering
  const isInitialLoading = status === "idle" || status === "loading";
  const hasError = status === "error";
  const isEmpty = status === "empty";
  const hasData = status === "success" && apiPatterns.length > 0;

  // Derive available leagues from loaded data
  const availableLeagues = useMemo(() => {
    const leagues = Array.from(new Set(apiPatterns.map((p) => p.league))).sort();
    return ["Todas", ...leagues];
  }, [apiPatterns]);

  const filteredPatterns = useMemo(() => {
    let result = apiPatterns;

    // ── Time filter ───────────────────────────────────────────
    if (activeTime === "Hoy") {
      // Include yesterday + today so recently-computed data isn't lost
      const yesterday = getDateStr(-1);
      const today = getDateStr(0);
      result = result.filter((p) => {
        if (p.matchDateStr === null) return true;
        return p.matchDateStr >= yesterday && p.matchDateStr <= today;
      });
    } else if (activeTime === "Mañana") {
      const tomorrow = getDateStr(1);
      result = result.filter((p) => {
        return p.matchDateStr === null || p.matchDateStr === tomorrow;
      });
    } else if (activeTime === "3 Días") {
      // From yesterday up to 3 days ahead to catch all computed data
      const from = getDateStr(-1);
      const to = getDateStr(3);
      result = result.filter((p) => {
        if (p.matchDateStr === null) return true;
        return p.matchDateStr >= from && p.matchDateStr <= to;
      });
    }

    // ── Market tab filter ─────────────────────────────────────
    if (activeTab !== "Popular") {
      result = result.filter((p) => p.market.includes(activeTab));
    }

    // ── League filter ─────────────────────────────────────────
    if (activeLeague !== "Todas") {
      result = result.filter((p) => p.league === activeLeague);
    }

    return result;
  }, [apiPatterns, activeTime, activeTab, activeLeague]);

  const handleAddToSlip = (pattern: Pattern) => {
    if (!isPremium) return;
    setSlipSelections((prev) => {
      if (prev.find((s) => s.id === pattern.id)) {
        return prev.filter((s) => s.id !== pattern.id);
      }
      return [...prev, pattern];
    });
  };

  const handleRemoveFromSlip = (id: string) => {
    setSlipSelections((prev) => prev.filter((s) => s.id !== id));
  };

  const slipIds = slipSelections.map((s) => s.id);
  const visiblePatterns = isPremium ? filteredPatterns : filteredPatterns.slice(0, 3);
  const lockedCount = Math.max(0, filteredPatterns.length - 3);
  const showOverlay = !authLoading && (!user || !isPremium);

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardNavbar />
      <FiltersBar
        activeTime={activeTime}
        onTimeChange={setActiveTime}
        activeLeague={activeLeague}
        onLeagueChange={setActiveLeague}
        leagues={availableLeagues}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <MarketTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Loading state */}
          {dataLoading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando patrones...</p>
            </div>
          )}

          {/* Error state */}
          {!dataLoading && error && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{error}</p>
                <p className="mt-1 text-xs text-muted-foreground">Intenta de nuevo en unos momentos</p>
              </div>
              <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
            </div>
          )}

          {/* Data loaded — even if empty, render the table (it handles empty state) */}
          {!dataLoading && !error && (
            <PatternTable
              patterns={visiblePatterns}
              onAddToSlip={handleAddToSlip}
              slipIds={slipIds}
              totalCount={filteredPatterns.length}
              isEmpty={apiPatterns.length === 0}
            />
          )}
        </div>

        {/* Desktop BetSlip sidebar */}
        {isPremium && (
          <div className="hidden md:block">
            <BetSlip selections={slipSelections} onRemove={handleRemoveFromSlip} />
          </div>
        )}

        {/* Premium overlay */}
        {showOverlay && !dataLoading && (
          <div className="absolute inset-0 top-[50%] z-30 flex items-end justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent" />
            <div className="relative z-10 mb-12 md:mb-16 flex flex-col items-center gap-3 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-foreground">
                Desbloquea todos los patrones
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {lockedCount > 0
                  ? `Desbloquea ${lockedCount} patrones premium detectados hoy.`
                  : "Acceso a oportunidades ilimitadas, filtros avanzados, Bet Slip y más."}
              </p>
              <Button variant="hero" size="lg" className="rounded-full px-6 gap-2" asChild>
                <Link to="/pricing">
                  <Zap className="h-4 w-4" />
                  Obtener Pro — $25/mes
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile BetSlip bottom sheet - only for premium users */}
      {isPremium && (
        <div className="md:hidden">
          <BetSlip selections={slipSelections} onRemove={handleRemoveFromSlip} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
