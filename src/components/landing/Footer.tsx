import { BarChart3 } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
            <BarChart3 className="h-3 w-3 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Betmatch</span>
        </div>

        <div className="flex gap-6 text-xs text-muted-foreground">
          <a href="#" className="transition-colors hover:text-foreground">Privacidad</a>
          <a href="#" className="transition-colors hover:text-foreground">Términos</a>
          <a href="#" className="transition-colors hover:text-foreground">Cookies</a>
          <a href="#" className="transition-colors hover:text-foreground">Soporte</a>
        </div>

        <p className="text-xs text-muted-foreground">
          © 2024 Betmatch. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
