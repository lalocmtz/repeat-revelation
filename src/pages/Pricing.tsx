import { Check, X, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const features = [
  { name: "Patrones del día", free: true, pro: true },
  { name: "Mercados disponibles", free: "2", pro: "Todos" },
  { name: "Oportunidades visibles", free: "3", pro: "Ilimitadas" },
  { name: "Filtros avanzados", free: false, pro: true },
  { name: "Próximos 3 días", free: false, pro: true },
  { name: "Detalle de oportunidad", free: false, pro: true },
  { name: "Bet Slip / Parlay Builder", free: false, pro: true },
  { name: "Favoritos", free: false, pro: true },
  { name: "Formato de cuotas", free: "Decimal", pro: "Decimal / Americano" },
  { name: "Alertas futuras", free: false, pro: true },
];

const FeatureValue = ({ value }: { value: boolean | string }) => {
  if (typeof value === "string") {
    return <span className="text-sm text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="h-4 w-4 text-primary" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/40" />
  );
};

const Pricing = () => {
  useEffect(() => {
    // Load Hotmart checkout widget
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
          <Link to="/dashboard">
            <Button variant="outline" size="sm">Ir al Dashboard</Button>
          </Link>
        </div>
      </nav>

      <section className="py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              Precios simples
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Elige tu plan
            </h1>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Empieza gratis y desbloquea todo el radar de patrones cuando estés listo.
            </p>
          </div>

          {/* Plan Cards */}
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Free Plan */}
            <Card className="relative border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-foreground">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground"> / mes</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Explora patrones básicos sin compromiso.
                </p>
              </CardHeader>
              <CardContent>
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full">
                    Empezar gratis
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-primary/40 bg-card shadow-lg shadow-primary/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Zap className="mr-1 h-3 w-3" /> Más popular
                </Badge>
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-foreground">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">$19</span>
                  <span className="text-muted-foreground"> / mes</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Acceso completo al radar de patrones tácticos.
                </p>
              </CardHeader>
              <CardContent>
                <a
                  onClick={() => false}
                  href="https://pay.hotmart.com/U101118131Q?checkoutMode=2"
                  className="hotmart-fb hotmart__button-checkout inline-block w-full"
                >
                  <Button variant="hero" className="w-full gap-2">
                    <Zap className="h-4 w-4" />
                    Obtener Pro
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
              Comparación de planes
            </h2>
            <div className="overflow-hidden rounded-xl border border-border">
              {/* Table Header */}
              <div className="grid grid-cols-3 border-b border-border bg-secondary/50 px-6 py-4">
                <span className="text-sm font-semibold text-foreground">Característica</span>
                <span className="text-center text-sm font-semibold text-foreground">Free</span>
                <span className="text-center text-sm font-semibold text-primary">Pro</span>
              </div>
              {/* Table Rows */}
              {features.map((f, i) => (
                <div
                  key={i}
                  className="grid grid-cols-3 items-center border-b border-border/50 px-6 py-3.5 last:border-0 hover:bg-secondary/20"
                >
                  <span className="text-sm text-foreground">{f.name}</span>
                  <div className="flex justify-center">
                    <FeatureValue value={f.free} />
                  </div>
                  <div className="flex justify-center">
                    <FeatureValue value={f.pro} />
                  </div>
                </div>
              ))}
            </div>
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
