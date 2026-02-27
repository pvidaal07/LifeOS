import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, moduleKey: 'dashboard' },
  { name: 'Estudios', href: '/studies', icon: BookOpen, moduleKey: 'studies' },
  { name: 'Deporte', href: '/sports', icon: Dumbbell, moduleKey: 'sports', disabled: true },
  { name: 'Nutrición', href: '/nutrition', icon: UtensilsCrossed, moduleKey: 'nutrition', disabled: true },
];

export function Sidebar() {
  // TODO: Filtrar módulos según user_modules del usuario
  const visibleModules = navigation;

  return (
    <aside className="hidden w-64 border-r border-border bg-card lg:block">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          L
        </div>
        <span className="text-lg font-semibold">LifeOS</span>
      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-1 p-4">
        {visibleModules.map((item) => (
          <NavLink
            key={item.href}
            to={item.disabled ? '#' : item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive && !item.disabled
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                item.disabled && 'opacity-40 cursor-not-allowed',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.name}
            {item.disabled && (
              <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
                Próx.
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
