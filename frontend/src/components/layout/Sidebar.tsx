import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  RotateCcw,
  Dumbbell,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import logoMark from '../../public/logotipo.png';
import logoText from '../../public/logotipo-texto.png';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleKey: string;
  disabled?: boolean;
};

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, moduleKey: 'dashboard' },
  { name: 'Estudios', href: '/studies', icon: BookOpen, moduleKey: 'studies' },
  { name: 'Repasos', href: '/reviews', icon: RotateCcw, moduleKey: 'studies' },
  { name: 'Deporte', href: '/sports', icon: Dumbbell, moduleKey: 'sports', disabled: true },
  { name: 'Nutricion', href: '/nutrition', icon: UtensilsCrossed, moduleKey: 'nutrition', disabled: true },
];

export function Sidebar() {
  // TODO: Filter modules by user_modules.
  const visibleModules = navigation;

  return (
    <aside className="hidden w-72 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="flex h-20 items-center border-b border-border px-6">
        <div className="flex items-center gap-3">
          <img src={logoMark} alt="LifeOS mark" className="h-9 w-9 rounded-md border border-border bg-canvas p-1" />
          <img src={logoText} alt="LifeOS" className="h-6 w-auto" />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-5" aria-label="Primary">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
          Workspace
        </p>
        {visibleModules.map((item) => (
          item.disabled ? (
            <div
              key={item.href}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-lg border border-dashed border-border/80 bg-canvas-muted px-3 py-2.5 text-sm font-medium text-text-muted opacity-75"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
              <span className="ml-auto rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] uppercase tracking-wide">
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
                    ? 'bg-brand-secondary-100 text-brand-secondary-900 shadow-subtle'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          )
        ))}
      </nav>

      <div className="border-t border-border px-6 py-4">
        <p className="text-xs text-text-muted">
          Study first release shell
        </p>
      </div>
    </aside>
  );
}
