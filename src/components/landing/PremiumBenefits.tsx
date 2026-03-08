import { Check } from "lucide-react";

const benefits = [
  {
    title: "Acceso ilimitado",
    description: "Todos los partidos de las ligas principales y secundarias sin restricciones.",
  },
  {
    title: "Filtros Avanzados",
    description: "Busca patrones por cuotas, ligas o franjas horarias específicas.",
  },
  {
    title: "Alertas en Tiempo Real",
    description: "Recibe notificaciones inmediatas cuando se detecta un patrón de alta confianza.",
  },
  {
    title: "Backtesting de Estrategias",
    description: "Comprueba la rentabilidad histórica de cualquier patrón antes de usarlo.",
  },
];

const stats = [
  { value: "+800", label: "Ligas Analizadas" },
  { value: "24/7", label: "Monitorización" },
  { value: "95%", label: "Precisión Datos" },
  { value: "10k+", label: "Eventos/Mes" },
];

const PremiumBenefits = () => {
  return (
    <section id="benefits" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-8 text-3xl font-bold text-foreground">Beneficios Premium</h2>
            <div className="space-y-6">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/30"
              >
                <div className="mb-1 text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumBenefits;
