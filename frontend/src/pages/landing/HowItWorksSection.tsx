import { ClipboardList, BookOpen, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: ClipboardList,
    title: 'Crea tu plan',
    description:
      'Define un plan de estudio con las materias y temas que quieres dominar. Organiza tu ruta de aprendizaje.',
  },
  {
    number: 2,
    icon: BookOpen,
    title: 'Estudia los temas',
    description:
      'Registra sesiones de estudio, toma notas y califica tu comprensión. Construye conocimiento paso a paso.',
  },
  {
    number: 3,
    icon: RotateCcw,
    title: 'Repasa con repetición espaciada',
    description:
      'El sistema programa repasos automáticos en intervalos óptimos para que nunca olvides lo aprendido.',
  },
];

export function HowItWorksSection() {
  return (
    <section aria-label="Cómo funciona" className="bg-surface py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary-500">
            Cómo funciona
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
            Tres pasos para dominar cualquier tema
          </h2>
          <p className="mt-3 text-base text-text-secondary sm:mt-4 sm:text-lg">
            Un flujo simple y efectivo respaldado por la ciencia del aprendizaje.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-12 grid grid-cols-1 gap-10 sm:mt-16 lg:grid-cols-3 lg:gap-8">
          {/* Connector line (desktop only) */}
          <div
            className="absolute left-0 right-0 top-16 hidden h-0.5 lg:block"
            style={{
              background:
                'linear-gradient(90deg, hsl(var(--color-primary-100)) 0%, hsl(var(--color-secondary-100)) 50%, hsl(var(--color-accent-200)) 100%)',
            }}
            aria-hidden="true"
          />

          {steps.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step }: { step: Step }) {
  const Icon = step.icon;

  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Step number circle */}
      <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border-2 border-border bg-surface shadow-soft">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-primary-500">
          Paso
        </span>
        <span className="text-3xl font-extrabold text-text-primary">{step.number}</span>
        <Icon className="mt-1 h-5 w-5 text-text-secondary" />
      </div>

      {/* Content */}
      <h3 className="mt-6 text-xl font-semibold text-text-primary">
        {step.title}
      </h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
        {step.description}
      </p>
    </div>
  );
}
