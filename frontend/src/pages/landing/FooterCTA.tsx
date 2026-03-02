import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ArrowRight } from 'lucide-react';

export function FooterCTA() {
  return (
    <section aria-label="Llamada a la acción" className="bg-canvas py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        {/* Headline */}
        <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
          Empieza a organizar tu aprendizaje hoy
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-text-secondary sm:mt-4 sm:text-lg">
          Crea tu cuenta gratuita y descubre cómo LifeOS puede transformar tu forma de estudiar.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full min-w-[220px] text-base font-semibold shadow-lg sm:w-auto">
              Crear cuenta gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full min-w-[220px] text-base font-semibold sm:w-auto">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-sm text-text-muted sm:mt-8">
          Sin tarjeta de crédito. Sin compromisos. Tu progreso, siempre tuyo.
        </p>
      </div>
    </section>
  );
}
