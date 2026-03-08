import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import FiltersBar from "@/components/dashboard/FiltersBar";
import MarketTabs from "@/components/dashboard/MarketTabs";
import PatternTable from "@/components/dashboard/PatternTable";
import BetSlip from "@/components/dashboard/BetSlip";
import TerminalBar from "@/components/dashboard/TerminalBar";
import { mockPatterns, type Pattern } from "@/data/mockPatterns";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, isPremium, loading } = useAuth();
  const [activeTime, setActiveTime] = useState("Hoy");
  const [activeTab, setActiveTab] = useState("Popular");
  const [slipSelections, setSlipSelections] = useState<Pattern[]>([]);

  const filteredPatterns = useMemo(() => {
    if (activeTab === "Popular") return mockPatterns.filter((p) => p.market.includes("Popular"));
    return mockPatterns.filter((p) => p.market.includes(activeTab));
  }, [activeTab]);

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

  // Show only first 3 patterns for free users
  const visiblePatterns = isPremium ? filteredPatterns : filteredPatterns.slice(0, 3);

  const showOverlay = !loading && (!user || !isPremium);

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardNavbar />
      <FiltersBar activeTime={activeTime} onTimeChange={setActiveTime} />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <MarketTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <PatternTable
            patterns={visiblePatterns}
            onAddToSlip={handleAddToSlip}
            slipIds={slipIds}
          />
        </div>

        {/* Bet Slip sidebar */}
        {isPremium && (
          <BetSlip selections={slipSelections} onRemove={handleRemoveFromSlip} />
        )}

        {/* Premium overlay */}
        {showOverlay && (
          <div className="absolute inset-0 top-[50%] z-30 flex items-end justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent" />
            <div className="relative z-10 mb-16 flex flex-col items-center gap-4 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Desbloquea todos los patrones
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Obtén acceso a oportunidades ilimitadas, filtros avanzados, Bet Slip y mucho más con Tiplives Pro.
              </p>
              <Button variant="hero" size="lg" className="rounded-full px-8 gap-2" asChild>
                <Link to="/pricing">
                  <Zap className="h-4 w-4" />
                  Obtener acceso Pro — $25/mes
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <TerminalBar />
    </div>
  );
};

export default Dashboard;