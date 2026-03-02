import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

vi.mock('../hooks/useAuth', () => ({
  useLogin: () => ({ mutate: vi.fn(), isPending: false }),
  useRegister: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('Auth branding', () => {
  it('renders icon mark, brand text, and decorative banner on login page', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    // Single icon mark logo
    expect(screen.getByAltText('LifeOS mark')).toBeInTheDocument();
    // Brand name text next to icon
    expect(screen.getByText('LifeOS')).toBeInTheDocument();
    // H1 title
    expect(screen.getByRole('heading', { level: 1, name: 'Bienvenido a LifeOS' })).toBeInTheDocument();

    const banner = container.querySelector('img[aria-hidden="true"]');
    expect(banner).toHaveAttribute('alt', '');
  });

  it('renders icon mark, brand text, and decorative banner on register page', () => {
    const { container } = render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    // Single icon mark logo
    expect(screen.getByAltText('LifeOS mark')).toBeInTheDocument();
    // Brand name text next to icon
    expect(screen.getByText('LifeOS')).toBeInTheDocument();
    // H1 title
    expect(screen.getByRole('heading', { level: 1, name: 'Crear cuenta' })).toBeInTheDocument();

    const banner = container.querySelector('img[aria-hidden="true"]');
    expect(banner).toHaveAttribute('alt', '');
  });
});
