import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import bannerImage from '../public/banner.png';
import logoText from '../public/logotipo-texto.png';

export function RegisterPage() {
  const { mutate: register, isPending } = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(form);
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
        <div className="flex flex-col items-center space-y-1 text-center">
          <img src={logoText} alt="LifeOS" className="h-12 w-auto sm:h-14" />
          <p className="text-sm text-white/70">
            Organiza tu progreso personal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-white/90">
              Nombre
            </label>
            <Input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-white/90">
              Email
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
            <label htmlFor="password" className="text-sm font-medium text-white/90">
              Contrasena
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimo 8 caracteres"
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-white/90 transition-colors hover:text-white hover:underline">
            Inicia sesion
          </Link>
        </p>
      </div>
    </div>
  );
}
