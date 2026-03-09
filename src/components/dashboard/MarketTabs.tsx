interface MarketTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ["Popular", "Over 1.5", "Over 2.5", "BTTS", "Rachas", "Clean Sheet"];

const MarketTabs = ({ activeTab, onTabChange }: MarketTabsProps) => {
  return (
    <div className="flex items-center gap-1 border-b border-border px-4 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`relative shrink-0 px-3 py-3 text-sm font-medium transition-colors ${
            activeTab === tab
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab}
          {activeTab === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
};

export default MarketTabs;
