import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MainLayout } from './MainLayout';
import { useUiStore } from '../../stores/ui.store';

vi.mock('../../hooks/useAuth', () => ({
  useLogout: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: (selector: (state: { user: { name: string } }) => unknown) =>
    selector({ user: { name: 'Ada Lovelace' } }),
}));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<div>Page body</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Main layout shell branding', () => {
  beforeEach(() => {
    useUiStore.setState({ isDrawerOpen: false });
  });

  it('renders branded nav and header shell elements', () => {
    renderLayout();

    // Both desktop + mobile sidebar render nav with aria-label "Primary"
    expect(screen.getAllByLabelText('Primary').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Workspace').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('LifeOS').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesion' })).toBeInTheDocument();
  });

  it('renders hamburger button for mobile navigation', () => {
    renderLayout();

    const hamburger = screen.getByRole('button', { name: 'Toggle navigation menu' });
    expect(hamburger).toBeInTheDocument();
  });

  it('sidebar content renders navigation links', () => {
    renderLayout();

    expect(screen.getAllByText('Inicio').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Estudios').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Repasos').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Mobile drawer', () => {
  beforeEach(() => {
    useUiStore.setState({ isDrawerOpen: false });
  });

  it('hamburger button calls toggleDrawer and opens drawer', () => {
    renderLayout();

    expect(useUiStore.getState().isDrawerOpen).toBe(false);

    const hamburger = screen.getByRole('button', { name: 'Toggle navigation menu' });
    fireEvent.click(hamburger);

    expect(useUiStore.getState().isDrawerOpen).toBe(true);
  });

  it('drawer backdrop renders when drawer is open', () => {
    const { container } = renderLayout();

    // Backdrop starts hidden (opacity-0 + pointer-events-none)
    const backdrop = container.querySelector('[aria-hidden="true"].fixed');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('opacity-0');

    // Open the drawer via store inside act
    act(() => {
      useUiStore.setState({ isDrawerOpen: true });
    });

    // Now backdrop should show opacity-100
    expect(backdrop).toHaveClass('opacity-100');
  });

  it('ui store manages drawer state correctly', () => {
    const store = useUiStore;

    // Initial state
    expect(store.getState().isDrawerOpen).toBe(false);

    // Open
    store.getState().openDrawer();
    expect(store.getState().isDrawerOpen).toBe(true);

    // Close
    store.getState().closeDrawer();
    expect(store.getState().isDrawerOpen).toBe(false);

    // Toggle
    store.getState().toggleDrawer();
    expect(store.getState().isDrawerOpen).toBe(true);
    store.getState().toggleDrawer();
    expect(store.getState().isDrawerOpen).toBe(false);
  });
});
