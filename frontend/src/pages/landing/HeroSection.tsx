import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import bannerImage from '../../public/banner.png';
import logoTexto from '../../public/logotipo-texto.png';

export function HeroSection() {
  return (
    <section aria-label="Hero" className="relative min-h-[70vh] overflow-hidden sm:min-h-[80vh]">
      {/* Background banner */}
      <img
        src={bannerImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="auth-banner-scrim absolute inset-0" />

      {/* Content */}
      <div className="relative mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-4 py-20 text-center sm:min-h-[80vh] sm:px-6 sm:py-28 lg:py-36">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src={logoTexto}
            alt="LifeOS"
            className="h-12 drop-shadow-lg sm:h-14 lg:h-16"
          />
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Tu sistema operativo
          <span className="block text-brand-secondary-100">para la vida</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:mt-6 sm:text-lg lg:text-xl">
          Organiza tus planes de estudio, domina temas con repetición espaciada
          y visualiza tu progreso — todo en un solo lugar.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full min-w-[200px] text-base font-semibold shadow-lg sm:w-auto">
              Comenzar gratis
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full min-w-[200px] border-white/30 bg-white/15 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/25 sm:w-auto"
            >
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
