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
  it('renders logo and decorative banner on login page', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByAltText('LifeOS').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('LifeOS mark').length).toBeGreaterThan(0);

    const banner = container.querySelector('img[aria-hidden="true"]');
    expect(banner).toHaveAttribute('alt', '');
  });

  it('renders logo and decorative banner on register page', () => {
    const { container } = render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByAltText('LifeOS').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('LifeOS mark').length).toBeGreaterThan(0);

    const banner = container.querySelector('img[aria-hidden="true"]');
    expect(banner).toHaveAttribute('alt', '');
  });
});
