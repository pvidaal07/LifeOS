import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from './index';

const authState = vi.hoisted(() => ({
  isAuthenticated: true,
  pendingVerification: null as null | {
    email: string;
    emailMasked: string;
    cooldownSeconds: number;
    verificationExpiresAt: string;
  },
}));

vi.mock('../stores/auth.store', () => ({
  useAuthStore: (
    selector: (state: { isAuthenticated: boolean; pendingVerification: typeof authState.pendingVerification }) => unknown,
  ) =>
    selector({
      isAuthenticated: authState.isAuthenticated,
      pendingVerification: authState.pendingVerification,
    }),
}));

vi.mock('../components/layout/MainLayout', async () => {
  const router = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    MainLayout: () => (
      <div>
        <h1>Main Layout</h1>
        <router.Outlet />
      </div>
    ),
  };
});

vi.mock('../pages/account/AccountSettingsPage', () => ({
  AccountSettingsPage: () => <h2>Cuenta y configuracion</h2>,
}));

vi.mock('../pages/LoginPage', () => ({
  LoginPage: () => <h2>Pantalla de login</h2>,
}));

vi.mock('../pages/landing/LandingPage', () => ({
  LandingPage: () => <h2>Landing Page</h2>,
}));

vi.mock('../pages/RegisterPage', () => ({
  RegisterPage: () => <h2>Pantalla de registro</h2>,
}));

vi.mock('../pages/DashboardPage', () => ({
  DashboardPage: () => <h2>Dashboard</h2>,
}));

vi.mock('../pages/studies/PlansPage', () => ({
  PlansPage: () => <h2>Planes</h2>,
}));

vi.mock('../pages/studies/PlanDetailPage', () => ({
  PlanDetailPage: () => <h2>Detalle de plan</h2>,
}));

vi.mock('../pages/studies/TopicDetailPage', () => ({
  TopicDetailPage: () => <h2>Detalle de tema</h2>,
}));

vi.mock('../pages/studies/ReviewsPage', () => ({
  ReviewsPage: () => <h2>Repasos</h2>,
}));

function renderRoutes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('Account settings route protection', () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    authState.pendingVerification = null;
  });

  it('lets authenticated users open account settings from protected route', () => {
    renderRoutes('/account/settings');

    expect(screen.getByRole('heading', { name: 'Cuenta y configuracion' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Main Layout' })).toBeInTheDocument();
  });

  it('redirects unauthenticated direct access to login', () => {
    authState.isAuthenticated = false;
    renderRoutes('/account/settings');

    expect(screen.getByRole('heading', { name: 'Pantalla de login' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cuenta y configuracion' })).not.toBeInTheDocument();
  });
});
