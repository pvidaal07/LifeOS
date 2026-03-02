import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AccountSettingsPage } from './AccountSettingsPage';
import type { User } from '../../types';

const mockUsersApi = vi.hoisted(() => ({
  getMe: vi.fn(),
  updateMe: vi.fn(),
  updateMySettings: vi.fn(),
  getMyModules: vi.fn(),
  updateMyModules: vi.fn(),
}));

const mockStudiesApi = vi.hoisted(() => ({
  getReviewSettings: vi.fn(),
  updateReviewSettings: vi.fn(),
}));

const setUserMock = vi.hoisted(() => vi.fn());
const logoutMock = vi.hoisted(() => vi.fn());

vi.mock('../../api/users.api', () => ({
  usersApi: mockUsersApi,
}));

vi.mock('../../api/studies.api', () => ({
  studiesApi: mockStudiesApi,
}));

vi.mock('../../stores/auth.store', () => ({
  useAuthStore: (selector: (state: { user: User; setUser: (user: User) => void }) => unknown) =>
    selector({
      user: {
        id: 'user-1',
        email: 'ada@lifeos.dev',
        name: 'Ada Lovelace',
        createdAt: '2026-01-01T00:00:00.000Z',
        avatarUrl: null,
      },
      setUser: setUserMock,
    }),
}));

vi.mock('../../hooks/useAuth', () => ({
  useLogout: () => ({ mutate: logoutMock, isPending: false }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const profileResponse = {
  data: {
    data: {
      id: 'user-1',
      email: 'ada@lifeos.dev',
      name: 'Ada Lovelace',
      createdAt: '2026-01-01T00:00:00.000Z',
      avatarUrl: null,
      settings: {
        id: 'settings-1',
        userId: 'user-1',
        timezone: 'Europe/Madrid',
        theme: 'system',
        locale: 'es',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      modules: [],
    },
  },
};

const modulesResponse = {
  data: {
    data: [
      {
        id: 'module-1',
        userId: 'user-1',
        moduleKey: 'studies',
        isActive: true,
        displayOrder: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'module-2',
        userId: 'user-1',
        moduleKey: 'sport',
        isActive: false,
        displayOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
};

const reviewSettingsResponse = {
  data: {
    data: {
      id: 'review-settings-1',
      userId: 'user-1',
      baseIntervals: [1, 7, 30, 90],
      perfectMultiplier: 2.5,
      goodMultiplier: 2,
      regularMultiplier: 1.2,
      badReset: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AccountSettingsPage />
    </QueryClientProvider>,
  );
}

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsersApi.getMe.mockResolvedValue(profileResponse);
    mockUsersApi.getMyModules.mockResolvedValue(modulesResponse);
    mockStudiesApi.getReviewSettings.mockResolvedValue(reviewSettingsResponse);
  });

  it('renders sections and shows explicit password unsupported state', async () => {
    renderPage();

    expect(await screen.findByText('Cuenta y configuracion')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    // expect(screen.getByText('Preferencias')).toBeInTheDocument();
    expect(screen.getByText('Configuracion de repasos')).toBeInTheDocument();
    // expect(screen.getByText('Modulos activos')).toBeInTheDocument();
    expect(screen.getByText('Contraseña')).toBeInTheDocument();
    expect(screen.getByText(/no está disponible desde la app web/i)).toBeInTheDocument();
  });

  it('updates profile and syncs auth store identity', async () => {
    mockUsersApi.updateMe.mockResolvedValue({
      data: {
        data: {
          id: 'user-1',
          email: 'ada@lifeos.dev',
          name: 'Ada Byron',
          avatarUrl: 'https://example.com/ada.png',
        },
      },
    });

    renderPage();

    const nameInput = await screen.findByLabelText('Nombre');
    fireEvent.change(nameInput, { target: { value: 'Ada Byron' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    await waitFor(() => {
      expect(mockUsersApi.updateMe).toHaveBeenCalledWith({
        name: 'Ada Byron',
        avatarUrl: undefined,
      });
    });

    expect(setUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ada Byron',
        avatarUrl: 'https://example.com/ada.png',
      }),
    );
  });

  // it('updates modules through users endpoint', async () => {
  //   mockUsersApi.updateMyModules.mockResolvedValue(modulesResponse);

  //   renderPage();

  //   const sportCheckbox = await screen.findByRole('checkbox', { name: 'Deporte' });
  //   fireEvent.click(sportCheckbox);
  //   fireEvent.click(screen.getByRole('button', { name: 'Guardar modulos' }));

  //   await waitFor(() => {
  //     expect(mockUsersApi.updateMyModules).toHaveBeenCalledWith([
  //       {
  //         moduleKey: 'studies',
  //         isActive: true,
  //         displayOrder: 0,
  //       },
  //       {
  //         moduleKey: 'sport',
  //         isActive: true,
  //         displayOrder: 1,
  //       },
  //     ]);
  //   });
  // });

  // it('saves preferences with expected payload', async () => {
  //   mockUsersApi.updateMySettings.mockResolvedValue(profileResponse);

  //   renderPage();

  //   fireEvent.change(await screen.findByLabelText('Zona horaria'), {
  //     target: { value: 'America/Bogota' },
  //   });
  //   fireEvent.change(screen.getByLabelText('Idioma'), {
  //     target: { value: 'en' },
  //   });
  //   fireEvent.change(screen.getByLabelText('Tema'), {
  //     target: { value: 'dark' },
  //   });
  //   fireEvent.click(screen.getByRole('button', { name: 'Guardar preferencias' }));

  //   await waitFor(() => {
  //     expect(mockUsersApi.updateMySettings).toHaveBeenCalledWith({
  //       timezone: 'America/Bogota',
  //       locale: 'en',
  //       theme: 'dark',
  //     });
  //   });
  // });

  it('runs logout mutation when user clicks sign out action', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('saves selected preset using unchanged backend payload fields', async () => {
    mockStudiesApi.updateReviewSettings.mockResolvedValue(reviewSettingsResponse);

    renderPage();

    await screen.findByText(/Modo actual: Normal/i);
    fireEvent.click(screen.getByRole('button', { name: /Intensivo/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración de repasos' }));

    await waitFor(() => {
      expect(mockStudiesApi.updateReviewSettings).toHaveBeenCalledWith({
        baseIntervals: [1, 3, 7, 21],
        perfectMultiplier: 2.1,
        goodMultiplier: 1.7,
        regularMultiplier: 1.1,
        badReset: true,
      });
    });
  });

  it('saves manual advanced settings as raw payload and marks mode as custom', async () => {
    const customPayload = {
      baseIntervals: [2, 8, 20, 60],
      perfectMultiplier: 2.7,
      goodMultiplier: 1.9,
      regularMultiplier: 1.15,
      badReset: false,
    };

    mockStudiesApi.getReviewSettings
      .mockResolvedValueOnce(reviewSettingsResponse)
      .mockResolvedValue({
        data: {
          data: {
            ...reviewSettingsResponse.data.data,
            ...customPayload,
          },
        },
      });

    mockStudiesApi.updateReviewSettings.mockImplementation(async (payload) => ({
      data: {
        data: {
          ...reviewSettingsResponse.data.data,
          ...payload,
        },
      },
    }));

    renderPage();

    expect(await screen.findByText('Configuracion de repasos')).toBeInTheDocument();
    expect(screen.getByText(/Modo actual: Normal/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Modo avanzado desactivado' }));

    fireEvent.change(screen.getByDisplayValue('1, 7, 30, 90'), {
      target: { value: '2, 8, 20, 60' },
    });
    fireEvent.change(screen.getByDisplayValue('2.5'), {
      target: { value: '2.7' },
    });
    fireEvent.change(screen.getByDisplayValue('2'), {
      target: { value: '1.9' },
    });
    fireEvent.change(screen.getByDisplayValue('1.2'), {
      target: { value: '1.15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reinicio activado' }));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración de repasos' }));

    await waitFor(() => {
      expect(mockStudiesApi.updateReviewSettings).toHaveBeenCalledWith(customPayload);
    });

    expect(
      screen.getByText(
        'Detectamos una configuracion personalizada. Puedes mantenerla o cambiar a un preset.',
      ),
    ).toBeInTheDocument();
  });

  it('shows custom fallback when backend values do not match presets', async () => {
    mockStudiesApi.getReviewSettings.mockResolvedValue({
      data: {
        data: {
          ...reviewSettingsResponse.data.data,
          baseIntervals: [1, 5, 15, 45],
        },
      },
    });

    renderPage();

    expect(await screen.findByText(/Modo actual: Personalizado/i)).toBeInTheDocument();
  });
});
