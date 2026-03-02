import {
  BookOpen,
  RotateCcw,
  BarChart3,
  CalendarClock,
  Target,
  Brain,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const features: Feature[] = [
  {
    icon: BookOpen,
    title: 'Planes de estudio',
    description:
      'Crea planes estructurados con materias y temas. Organiza tu aprendizaje de forma clara y progresiva.',
    color: 'text-brand-primary-700',
    bgColor: 'bg-brand-primary-100',
  },
  {
    icon: RotateCcw,
    title: 'Repetición espaciada',
    description:
      'Repasa en el momento justo con intervalos de +1, +7 y +30 días. La ciencia al servicio de tu memoria.',
    color: 'text-brand-secondary-700',
    bgColor: 'bg-brand-secondary-100',
  },
  {
    icon: BarChart3,
    title: 'Seguimiento de progreso',
    description:
      'Visualiza tu avance con métricas de dominio por tema. Identifica fortalezas y áreas de mejora.',
    color: 'text-brand-accent-700',
    bgColor: 'bg-brand-accent-200',
  },
  {
    icon: CalendarClock,
    title: 'Sesiones de estudio',
    description:
      'Registra cada sesión con calificaciones y notas. Mantén un historial detallado de tu aprendizaje.',
    color: 'text-brand-primary-700',
    bgColor: 'bg-brand-primary-100',
  },
  {
    icon: Target,
    title: 'Metas claras',
    description:
      'Define objetivos por materia y mide tu progreso. Cada sesión te acerca a dominar el contenido.',
    color: 'text-brand-secondary-700',
    bgColor: 'bg-brand-secondary-100',
  },
  {
    icon: Brain,
    title: 'Aprendizaje inteligente',
    description:
      'El sistema calcula tu nivel de dominio automáticamente y te sugiere qué repasar primero.',
    color: 'text-brand-accent-700',
    bgColor: 'bg-brand-accent-200',
  },
];

export function FeaturesSection() {
  return (
    <section aria-label="Funcionalidades" className="bg-canvas py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary-500">
            Funcionalidades
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
            Todo lo que necesitas para aprender mejor
          </h2>
          <p className="mt-3 text-base text-text-secondary sm:mt-4 sm:text-lg">
            Herramientas diseñadas para potenciar tu estudio y garantizar la retención a largo plazo.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <div className="group rounded-xl border border-border bg-surface p-5 shadow-subtle transition-shadow duration-200 hover:shadow-soft sm:p-6">
      {/* Icon */}
      <div
        className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}
      >
        <Icon className={`h-6 w-6 ${feature.color}`} />
      </div>

      {/* Content */}
      <h3 className="mt-4 text-lg font-semibold text-text-primary">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {feature.description}
      </p>
    </div>
  );
}
