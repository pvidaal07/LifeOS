import { Link } from 'react-router-dom';
import { ListPlus, BookOpen, GraduationCap, RotateCcw, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import type { LucideIcon } from 'lucide-react';

interface WelcomeCardProps {
  onDismiss: () => void;
}

interface OnboardingStep {
  icon: LucideIcon;
  label: string;
  href: string;
}

const steps: OnboardingStep[] = [
  { icon: ListPlus, label: 'Crea un plan', href: '/studies' },
  { icon: BookOpen, label: 'Añade asignaturas', href: '/studies' },
  { icon: GraduationCap, label: 'Estudia un tema', href: '/studies' },
  { icon: RotateCcw, label: 'Completa un repaso', href: '/studies/reviews' },
];

export function WelcomeCard({ onDismiss }: WelcomeCardProps) {
  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Bienvenido a LifeOS</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label="Cerrar bienvenida"
          className="h-8 w-8 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Sigue estos pasos para comenzar a organizar tu estudio:
        </p>

        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step.label}>
              <Link
                to={step.href}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-muted"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-text-primary">
                  {index + 1}. {step.label}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onDismiss}>
            Entendido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
