import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLogout } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import { Button } from '../ui/Button';
import logoMark from '../../public/logotipo.png';

export function Header() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const toggleDrawer = useUiStore((state) => state.toggleDrawer);
  const { mutate: logout } = useLogout();
  const sectionTitle = useMemo(() => {
    if (location.pathname.startsWith('/studies')) {
      return 'Estudios';
    }

    if (location.pathname.startsWith('/reviews')) {
      return 'Repasos';
    }

    return 'Inicio';
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={toggleDrawer}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-canvas-muted hover:text-text-primary lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <img src={logoMark} alt="LifeOS" className="h-8 w-8 rounded-md border border-border bg-canvas p-1 lg:hidden" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.08em] text-text-muted">LifeOS</p>
            <h1 className="truncate text-sm font-semibold text-text-primary sm:text-base">{sectionTitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="max-w-32 truncate rounded-full border border-border bg-canvas-muted px-3 py-1 text-xs font-medium text-text-secondary sm:max-w-48 sm:text-sm">
            {user?.name}
          </span>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Cerrar sesion
          </Button>
        </div>
      </div>
    </header>
  );
}
