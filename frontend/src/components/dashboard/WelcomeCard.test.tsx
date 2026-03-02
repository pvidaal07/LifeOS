import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WelcomeCard } from './WelcomeCard';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('WelcomeCard', () => {
  it('renders the welcome heading', () => {
    renderWithRouter(<WelcomeCard onDismiss={() => {}} />);

    expect(screen.getByText('Bienvenido a LifeOS')).toBeInTheDocument();
  });

  it('renders all four onboarding steps', () => {
    renderWithRouter(<WelcomeCard onDismiss={() => {}} />);

    expect(screen.getByText(/Crea un plan/)).toBeInTheDocument();
    expect(screen.getByText(/Añade asignaturas/)).toBeInTheDocument();
    expect(screen.getByText(/Estudia un tema/)).toBeInTheDocument();
    expect(screen.getByText(/Completa un repaso/)).toBeInTheDocument();
  });

  it('renders step links with correct hrefs', () => {
    renderWithRouter(<WelcomeCard onDismiss={() => {}} />);

    const links = screen.getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/studies');
    expect(hrefs).toContain('/studies/reviews');
  });

  it('calls onDismiss when the X button is clicked', () => {
    const onDismiss = vi.fn();
    renderWithRouter(<WelcomeCard onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar bienvenida' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('calls onDismiss when the "Entendido" button is clicked', () => {
    const onDismiss = vi.fn();
    renderWithRouter(<WelcomeCard onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('renders the instructional text', () => {
    renderWithRouter(<WelcomeCard onDismiss={() => {}} />);

    expect(
      screen.getByText(/Sigue estos pasos para comenzar/),
    ).toBeInTheDocument();
  });
});
