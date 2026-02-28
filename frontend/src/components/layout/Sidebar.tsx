import { useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  RotateCcw,
  Dumbbell,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../stores/ui.store';
import logoMark from '../../public/logotipo.png';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleKey: string;
  disabled?: boolean;
};

const navigation: NavigationItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard, moduleKey: 'dashboard' },
  { name: 'Estudios', href: '/studies', icon: BookOpen, moduleKey: 'studies' },
  { name: 'Repasos', href: '/reviews', icon: RotateCcw, moduleKey: 'studies' },
  { name: 'Deporte', href: '/sports', icon: Dumbbell, moduleKey: 'sports', disabled: true },
  { name: 'Nutricion', href: '/nutrition', icon: UtensilsCrossed, moduleKey: 'nutrition', disabled: true },
];

/** Shared sidebar content used in both desktop and mobile drawer. */
function SidebarContent({ onClose }: { onClose?: () => void }) {
  // TODO: Filter modules by user_modules.
  const visibleModules = navigation;

  return (
    <>
      {/* Brand */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <img src={logoMark} alt="LifeOS" className="h-9 w-9 rounded-lg" />
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            LifeOS
          </span>
        </div>
        {/* Close button — visible only in mobile drawer */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-white/10 hover:text-sidebar-foreground lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-4 py-5" aria-label="Primary">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
          Workspace
        </p>
        {visibleModules.map((item) => (
          item.disabled ? (
            <div
              key={item.href}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-lg border border-dashed border-white/10 px-3 py-2.5 text-sm font-medium text-sidebar-muted/50"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
              <span className="ml-auto rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-sidebar-muted/60">
                Soon
              </span>
            </div>
          ) : (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-sidebar-active text-sidebar-foreground'
                    : 'text-sidebar-muted hover:bg-white/[0.06] hover:text-sidebar-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          )
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-sidebar-muted/60">
          Study first release shell
        </p>
      </div>
    </>
  );
}

export function Sidebar() {
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);
  const closeDrawer = useUiStore((state) => state.closeDrawer);
  const { pathname } = useLocation();

  // Close drawer on navigation
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // Close drawer on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    },
    [closeDrawer],
  );

  useEffect(() => {
    if (isDrawerOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDrawerOpen, handleKeyDown]);

  return (
    <>
      {/* ── Desktop sidebar (lg+) — unchanged ── */}
      <aside className="hidden w-72 flex-col bg-gradient-to-b from-sidebar to-sidebar-to lg:flex">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer (<lg) ── */}
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 lg:hidden',
          isDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-gradient-to-b from-sidebar to-sidebar-to transition-transform duration-300 ease-in-out lg:hidden',
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent onClose={closeDrawer} />
      </aside>
    </>
  );
}
