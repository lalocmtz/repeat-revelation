import { BarChart3, Zap, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const DashboardNavbar = () => {
  const { user, isPremium, signOut } = useAuth();

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
            <Link to="/dashboard" className="text-sm font-medium text-primary">Dashboard</Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Precios</Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPremium && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Zap className="mr-1 h-3 w-3" /> Pro
            </Badge>
          )}
          {!isPremium && user && (
            <Button variant="outline" size="sm" className="gap-2 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
              <Link to="/pricing">
                <Zap className="h-3.5 w-3.5" />
                Upgrade
              </Link>
            </Button>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} title="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="hero" size="sm" className="rounded-full" asChild>
              <Link to="/auth">Iniciar sesión</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
