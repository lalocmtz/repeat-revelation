import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-stadium.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
                Análisis táctico de datos
              </p>
              <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Descubre qué patrones se están{" "}
                <span className="text-gradient-green">repitiendo</span> antes de apostar
              </h1>
            </div>
            <p className="max-w-md text-lg text-muted-foreground">
              Tiplives analiza partidos de fútbol y ordena las tendencias más repetidas de hoy y los próximos 3 días.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="rounded-full px-8" asChild>
                <Link to="/pricing">
                  <Zap className="mr-1 h-4 w-4" />
                  Obtener acceso Pro
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-background bg-secondary"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                +2,000 analistas tácticos ya lo usan
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border/50 shadow-2xl shadow-primary/5">
              <img
                src={heroImage}
                alt="Análisis táctico de fútbol con datos superpuestos en un estadio"
                className="w-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;