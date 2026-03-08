import { useState, useMemo } from "react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import FiltersBar from "@/components/dashboard/FiltersBar";
import MarketTabs from "@/components/dashboard/MarketTabs";
import PatternTable from "@/components/dashboard/PatternTable";
import BetSlip from "@/components/dashboard/BetSlip";
import TerminalBar from "@/components/dashboard/TerminalBar";
import { mockPatterns, type Pattern } from "@/data/mockPatterns";

const Dashboard = () => {
  const [activeTime, setActiveTime] = useState("Hoy");
  const [activeTab, setActiveTab] = useState("Popular");
  const [slipSelections, setSlipSelections] = useState<Pattern[]>([]);

  const filteredPatterns = useMemo(() => {
    if (activeTab === "Popular") return mockPatterns.filter((p) => p.market.includes("Popular"));
    return mockPatterns.filter((p) => p.market.includes(activeTab));
  }, [activeTab]);

  const handleAddToSlip = (pattern: Pattern) => {
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardNavbar />
      <FiltersBar activeTime={activeTime} onTimeChange={setActiveTime} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <MarketTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <PatternTable
            patterns={filteredPatterns}
            onAddToSlip={handleAddToSlip}
            slipIds={slipIds}
          />
        </div>

        {/* Bet Slip sidebar */}
        <BetSlip selections={slipSelections} onRemove={handleRemoveFromSlip} />
      </div>

      <TerminalBar />
    </div>
  );
};

export default Dashboard;
