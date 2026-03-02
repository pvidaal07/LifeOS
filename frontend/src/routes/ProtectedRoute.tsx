import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pendingVerification = useAuthStore((state) => state.pendingVerification);

  if (!isAuthenticated && pendingVerification) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
