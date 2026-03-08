import { BarChart3, Zap, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const DashboardNavbar = () => {
  const { user, isPremium, signOut } = useAuth();

  return (
    <nav className="border-b border-border bg-background">
      <div className="flex h-12 md:h-14 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground" />
          </div>
          <span className="text-base md:text-lg font-bold text-foreground">Tiplives</span>
        </Link>

        <div className="flex items-center gap-2">
          {isPremium && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-2 py-0.5">
              <Zap className="mr-1 h-3 w-3" /> Pro
            </Badge>
          )}
          {!isPremium && user && (
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground h-8 text-xs px-3" asChild>
              <Link to="/pricing">
                <Zap className="h-3 w-3" />
                Pro
              </Link>
            </Button>
          )}
          {user ? (
            <div className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} title="Cerrar sesión" className="h-8 w-8">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button variant="hero" size="sm" className="rounded-full h-8 text-xs px-4" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;