import { useLogout } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/auth.store';

export function Header() {
  const user = useAuthStore((state) => state.user);
  const { mutate: logout } = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.name}</span>
        <button
          onClick={() => logout()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
