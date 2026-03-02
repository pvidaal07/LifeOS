import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LandingPage } from './LandingPage';

// Mock image imports to avoid asset resolution issues in test environment
vi.mock('../../public/banner.png', () => ({ default: 'banner.png' }));
vi.mock('../../public/logotipo-texto.png', () => ({ default: 'logotipo-texto.png' }));

describe('LandingPage sections', () => {
  function renderLanding() {
    return render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
  }

  it('renders all four sections', () => {
    renderLanding();

    expect(screen.getByLabelText('Hero')).toBeInTheDocument();
    expect(screen.getByLabelText('Funcionalidades')).toBeInTheDocument();
    expect(screen.getByLabelText('Cómo funciona')).toBeInTheDocument();
    expect(screen.getByLabelText('Llamada a la acción')).toBeInTheDocument();
  });

  it('displays the LifeOS logo in the hero', () => {
    renderLanding();

    expect(screen.getByAltText('LifeOS')).toBeInTheDocument();
  });

  it('displays the headline text', () => {
    renderLanding();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tu sistema operativo');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('para la vida');
  });

  it('renders CTA links to /register in hero section', () => {
    renderLanding();

    const registerLinks = screen.getAllByRole('link', { name: /comenzar gratis/i });
    expect(registerLinks.length).toBeGreaterThanOrEqual(1);
    expect(registerLinks[0]).toHaveAttribute('href', '/register');
  });

  it('renders CTA links to /login in hero section', () => {
    renderLanding();

    const loginLinks = screen.getAllByRole('link', { name: /iniciar sesión/i });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
  });

  it('renders all six feature cards', () => {
    renderLanding();

    expect(screen.getByText('Planes de estudio')).toBeInTheDocument();
    expect(screen.getByText('Repetición espaciada')).toBeInTheDocument();
    expect(screen.getByText('Seguimiento de progreso')).toBeInTheDocument();
    expect(screen.getByText('Sesiones de estudio')).toBeInTheDocument();
    expect(screen.getByText('Metas claras')).toBeInTheDocument();
    expect(screen.getByText('Aprendizaje inteligente')).toBeInTheDocument();
  });

  it('renders three "how it works" steps', () => {
    renderLanding();

    expect(screen.getByText('Crea tu plan')).toBeInTheDocument();
    expect(screen.getByText('Estudia los temas')).toBeInTheDocument();
    expect(screen.getByText('Repasa con repetición espaciada')).toBeInTheDocument();
  });

  it('renders footer CTA with register and login links', () => {
    renderLanding();

    const registerLink = screen.getByRole('link', { name: /crear cuenta gratis/i });
    expect(registerLink).toHaveAttribute('href', '/register');

    const loginLink = screen.getByRole('link', { name: /ya tengo cuenta/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('wraps content in a main element', () => {
    renderLanding();

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
