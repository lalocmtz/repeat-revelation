import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Betmatch</span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Cómo funciona
          </a>
          <a href="#benefits" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Beneficios
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Precios
          </a>
        </div>

        <Button variant="hero" size="sm" className="rounded-full px-6">
          Probar gratis
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
