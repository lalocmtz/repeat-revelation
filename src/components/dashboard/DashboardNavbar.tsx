import { useState } from "react";
import { BarChart3, Zap, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DashboardNavbar = () => {
  return (
    <nav className="border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Betmatch</span>
            <span className="text-sm text-primary">Terminal</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#" className="text-sm font-medium text-primary">Dashboard</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Live Scores</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Strategies</a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Zap className="h-3.5 w-3.5" />
            Upgrade
          </Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
