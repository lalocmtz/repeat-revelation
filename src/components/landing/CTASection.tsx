import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 px-8 py-16 text-center md:px-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.15)_0%,_transparent_70%)]" />
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Empieza a analizar como un profesional hoy mismo
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
              Únete a la plataforma líder en detección de tendencias tácticas y patrones de fútbol.
            </p>
            <Button variant="hero" size="lg" className="rounded-full px-8" asChild>
              <Link to="/pricing">
                <Zap className="mr-1 h-4 w-4" />
                Obtener acceso Pro
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;