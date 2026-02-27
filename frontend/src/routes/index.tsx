import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PlansPage } from '../pages/studies/PlansPage';
import { PlanDetailPage } from '../pages/studies/PlanDetailPage';
import { TopicDetailPage } from '../pages/studies/TopicDetailPage';
import { ReviewsPage } from '../pages/studies/ReviewsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/studies" element={<PlansPage />} />
          <Route path="/studies/:planId" element={<PlanDetailPage />} />
          <Route path="/studies/topics/:topicId" element={<TopicDetailPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
