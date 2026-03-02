import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from './index';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
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

vi.mock('../pages/landing/LandingPage', () => ({
  LandingPage: () => <h2>Landing Page</h2>,
}));

vi.mock('../pages/LoginPage', () => ({
  LoginPage: () => <h2>Pantalla de login</h2>,
}));

vi.mock('../pages/RegisterPage', () => ({
  RegisterPage: () => <h2>Pantalla de registro</h2>,
}));

vi.mock('../pages/VerifyEmailPage', () => ({
  VerifyEmailPage: () => <h2>Verifica tu correo</h2>,
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

vi.mock('../pages/account/AccountSettingsPage', () => ({
  AccountSettingsPage: () => <h2>Cuenta y configuración</h2>,
}));

function renderRoutes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('PublicLandingRoute behavior', () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.pendingVerification = null;
  });

  it('renders landing page for unauthenticated users at /', () => {
    renderRoutes('/');

    expect(screen.getByRole('heading', { name: 'Landing Page' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pantalla de login' })).not.toBeInTheDocument();
  });

  it('redirects authenticated users from / to /dashboard', () => {
    authState.isAuthenticated = true;

    renderRoutes('/');

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Landing Page' })).not.toBeInTheDocument();
  });

  it('redirects users with pending verification from / to /verify-email', () => {
    authState.pendingVerification = {
      email: 'user@example.com',
      emailMasked: 'us***@example.com',
      cooldownSeconds: 60,
      verificationExpiresAt: new Date().toISOString(),
    };

    renderRoutes('/');

    expect(screen.getByRole('heading', { name: 'Verifica tu correo' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Landing Page' })).not.toBeInTheDocument();
  });

  it('does not show landing page at /login', () => {
    renderRoutes('/login');

    expect(screen.getByRole('heading', { name: 'Pantalla de login' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Landing Page' })).not.toBeInTheDocument();
  });

  it('does not show landing page at /register', () => {
    renderRoutes('/register');

    expect(screen.getByRole('heading', { name: 'Pantalla de registro' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Landing Page' })).not.toBeInTheDocument();
  });

  it('redirects unknown routes to / and shows landing page for unauthenticated users', () => {
    renderRoutes('/nonexistent-route');

    expect(screen.getByRole('heading', { name: 'Landing Page' })).toBeInTheDocument();
  });
});
