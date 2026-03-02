import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../stores/auth.store';
import { MainLayout } from '../components/layout/MainLayout';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LandingPage } from '../pages/landing/LandingPage';
import { PlansPage } from '../pages/studies/PlansPage';
import { PlanDetailPage } from '../pages/studies/PlanDetailPage';
import { TopicDetailPage } from '../pages/studies/TopicDetailPage';
import { ReviewsPage } from '../pages/studies/ReviewsPage';
import { AccountSettingsPage } from '../pages/account/AccountSettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<PublicLandingRoute element={<LandingPage />} />} />
      <Route path="/login" element={<PublicAuthRoute element={<LoginPage />} />} />
      <Route path="/register" element={<PublicAuthRoute element={<RegisterPage />} />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/studies" element={<PlansPage />} />
          <Route path="/studies/:planId" element={<PlanDetailPage />} />
          <Route path="/studies/topics/:topicId" element={<TopicDetailPage />} />
          <Route path="/studies/reviews" element={<ReviewsPage />} />
          <Route path="/account/settings" element={<AccountSettingsPage />} />
          {/* Redirect old /reviews URL to new location */}
          <Route path="/reviews" element={<Navigate to="/studies/reviews" replace />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function PublicAuthRoute({ element }: { element: JSX.Element }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pendingVerification = useAuthStore((state) => state.pendingVerification);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (pendingVerification) {
    return <Navigate to="/verify-email" replace />;
  }

  return element;
}

function PublicLandingRoute({ element }: { element: JSX.Element }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const pendingVerification = useAuthStore((state) => state.pendingVerification);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (pendingVerification) {
    return <Navigate to="/verify-email" replace />;
  }

  return element;
}
