import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useResendVerification, useVerifyEmail } from '../hooks/useAuth';
import { useAuthStore } from '../stores/auth.store';
import bannerImage from '../public/banner.png';
import logoIcon from '../public/logotipo.png';

export function VerifyEmailPage() {
  const pendingVerification = useAuthStore((state) => state.pendingVerification);
  const [code, setCode] = useState('');
  const [lastSentAt, setLastSentAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!pendingVerification) {
      return 0;
    }
    const elapsed = Math.floor((now - lastSentAt) / 1000);
    return Math.max(0, pendingVerification.cooldownSeconds - elapsed);
  }, [lastSentAt, now, pendingVerification]);

  if (!pendingVerification) {
    return <Navigate to="/login" replace />;
  }

  const handleVerify = (event: React.FormEvent) => {
    event.preventDefault();
    verifyMutation.mutate({
      email: pendingVerification.email,
      code,
    });
  };

  const handleResend = () => {
    resendMutation.mutate(
      { email: pendingVerification.email },
      {
        onSuccess: () => {
          setLastSentAt(Date.now());
        },
      },
    );
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
        <div className="flex items-center justify-center gap-2.5">
          <img src={logoIcon} alt="LifeOS mark" className="h-14 w-14 sm:h-16 sm:w-16" />
          <span className="text-xl font-semibold text-slate-800">LifeOS</span>
        </div>

        <div className="mt-5 text-center">
          <h1 className="text-[28px] font-bold leading-tight text-slate-800 sm:text-[32px]">
            Verifica tu correo
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enviamos un codigo a <strong>{pendingVerification.emailMasked}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="code" className="text-sm font-medium text-slate-700">
              Codigo de verificacion
            </label>
            <Input
              id="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="AB12CD"
              disabled={verifyMutation.isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? 'Verificando...' : 'Verificar y continuar'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            ¿No recibiste el codigo?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendMutation.isPending || remainingSeconds > 0}
              className="font-medium text-[hsl(221,83%,53%)] transition-colors hover:text-[hsl(224,64%,33%)] hover:underline disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Reenviar
            </button>
          </p>
          {remainingSeconds > 0 ? <p className="mt-1">Disponible en {remainingSeconds}s</p> : null}
        </div>
      </div>
    </div>
  );
}
