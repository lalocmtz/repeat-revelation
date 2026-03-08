import { Check, X, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const features = [
  "Todos los patrones del día",
  "Todos los mercados disponibles",
  "Oportunidades ilimitadas",
  "Filtros avanzados",
  "Próximos 3 días",
  "Detalle de oportunidad",
  "Bet Slip / Parlay Builder",
  "Favoritos",
  "Formato Decimal / Americano",
  "Alertas futuras",
];

const Pricing = () => {
  useEffect(() => {
    if (!document.querySelector('script[src*="hotmart"]')) {
      const script = document.createElement("script");
      script.src = "https://static.hotmart.com/checkout/widget.min.js";
      script.type = "text/javascript";
      document.head.appendChild(script);

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = "https://static.hotmart.com/css/hotmart-fb.min.css";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Betmatch</span>
          </Link>
          <Link to="/auth">
            <Button variant="outline" size="sm">Iniciar sesión</Button>
          </Link>
        </div>
      </nav>

      <section className="py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Acceso Premium
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Desbloquea el radar completo
            </h1>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Un solo plan. Acceso total a todos los patrones, filtros y herramientas de Betmatch.
            </p>
          </div>

          {/* Single Pro Card */}
          <div className="mx-auto max-w-md">
            <Card className="relative border-primary/40 bg-card shadow-lg shadow-primary/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Zap className="mr-1 h-3 w-3" /> Acceso completo
                </Badge>
              </div>
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-2xl text-foreground">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-foreground">$25</span>
                  <span className="text-muted-foreground"> / mes</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Acceso completo al radar de patrones tácticos.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Features list */}
                <ul className="space-y-3">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  onClick={() => false}
                  href="https://pay.hotmart.com/U101118131Q?checkoutMode=2"
                  className="hotmart-fb hotmart__button-checkout inline-block w-full"
                >
                  <Button variant="hero" className="w-full gap-2">
                    <Zap className="h-4 w-4" />
                    Obtener acceso Pro
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* FAQ note */}
          <div className="mx-auto mt-12 max-w-lg text-center">
            <p className="text-sm text-muted-foreground">
              ¿Tienes dudas? Escríbenos a{" "}
              <a href="mailto:soporte@betmatch.com" className="text-primary hover:underline">
                soporte@betmatch.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
