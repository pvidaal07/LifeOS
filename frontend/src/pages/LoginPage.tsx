import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import bannerImage from '../public/banner.png';
import logoIcon from '../public/logotipo.png';

export function LoginPage() {
  const { mutate: login, isPending } = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <img
        src={bannerImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="auth-banner-scrim absolute inset-0" />

      <div className="auth-card relative mx-4 w-full max-w-[460px] sm:mx-6">
        {/* Brand mark */}
        <div className="flex items-center justify-center gap-2.5">
          <img src={logoIcon} alt="LifeOS mark" className="h-12 w-12 sm:h-14 sm:w-14" />
          <span className="text-xl font-semibold text-slate-800">LifeOS</span>
        </div>

        {/* Title + subtitle */}
        <div className="mt-5 text-center">
          <h1 className="text-[28px] font-bold leading-tight text-slate-800 sm:text-[32px]">
            Bienvenido a LifeOS
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Inicia sesión en tu sistema de productividad personal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@email.com"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="********"
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes una cuenta?{' '}
          <Link
            to="/register"
            className="font-medium text-[hsl(221,83%,53%)] transition-colors hover:text-[hsl(224,64%,33%)] hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
