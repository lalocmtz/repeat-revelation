import { Search, Target, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Analizamos",
    description:
      "Procesamos estadísticas históricas y en tiempo real de más de 800 ligas alrededor del mundo.",
  },
  {
    icon: Target,
    title: "Detectamos",
    description:
      "Identificamos patrones tácticos y tendencias de mercado que se repiten con alta frecuencia estadística.",
  },
  {
    icon: BarChart3,
    title: "Mostramos",
    description:
      "Ordenamos las oportunidades por probabilidad y valor esperado para que tomes decisiones informadas.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">Cómo funciona</h2>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Nuestra tecnología de Big Data procesa miles de puntos de datos para darte una ventaja analítica real.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
