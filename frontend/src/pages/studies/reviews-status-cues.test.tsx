import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ReviewsPage } from './ReviewsPage';

const mockStudiesApi = vi.hoisted(() => ({
  getPendingReviews: vi.fn(),
  getUpcomingReviews: vi.fn(),
  completeReview: vi.fn(),
  skipReview: vi.fn(),
  getReviewSettings: vi.fn(),
}));

vi.mock('../../api/studies.api', () => ({
  studiesApi: mockStudiesApi,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const MOCK_REVIEW = {
  id: 'review-1',
  urgencyScore: 8.4,
  reviewNumber: 3,
  scheduledDate: '2026-03-01T08:00:00.000Z',
  topic: {
    name: 'Derivadas',
    subject: {
      name: 'Calculo',
      color: '#0ea5e9',
      studyPlan: { name: 'Matematicas' },
    },
  },
};

function renderReviewsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/studies/reviews']}>
        <Routes>
          <Route path="/studies/reviews" element={<ReviewsPage />} />
          <Route path="/account/settings" element={<h2>Cuenta y configuración</h2>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function setupMocks(reviews = [MOCK_REVIEW]) {
  mockStudiesApi.getPendingReviews.mockResolvedValue({
    data: { data: reviews },
  });
  mockStudiesApi.getUpcomingReviews.mockResolvedValue({
    data: { data: [] },
  });
  mockStudiesApi.getReviewSettings.mockResolvedValue({
    data: {
      data: {
        id: 'settings-1',
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
  });
}

describe('Reviews visual status cues', () => {
  it('shows summary card and account settings handoff for discoverability', async () => {
    setupMocks();
    renderReviewsPage();

    expect(await screen.findByText('Configuración de repasos')).toBeInTheDocument();
    expect(await screen.findByText(/Preset activo:/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar en Cuenta' }));

    expect(await screen.findByRole('heading', { name: 'Cuenta y configuración' })).toBeInTheDocument();
  });

  it('shows urgency and result labels as explicit text cues', async () => {
    setupMocks();
    renderReviewsPage();

    expect(await screen.findByText(/Urgencia Alta/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Completar/i }));

    expect(screen.getByRole('button', { name: 'Perfecto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bien' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regular' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mal' })).toBeInTheDocument();
  });
});

describe('Review completion with duration', () => {
  it('shows duration input, quality rating buttons, and notes textarea when expanding a review', async () => {
    setupMocks();
    renderReviewsPage();

    await screen.findByText(/Urgencia Alta/i);
    fireEvent.click(screen.getByRole('button', { name: /Completar/i }));

    // Duration input is visible
    expect(screen.getByLabelText('Duración en minutos')).toBeInTheDocument();

    // Quality rating buttons (1-5)
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: `Calidad ${i}` })).toBeInTheDocument();
    }

    // Notes textarea
    expect(screen.getByLabelText('Notas del repaso')).toBeInTheDocument();
  });

  it('prevents submission without valid duration and shows toast error', async () => {
    const toast = await import('react-hot-toast');
    setupMocks();
    renderReviewsPage();

    await screen.findByText(/Urgencia Alta/i);
    fireEvent.click(screen.getByRole('button', { name: /Completar/i }));

    // Click a result button without filling duration
    fireEvent.click(screen.getByRole('button', { name: 'Bien' }));

    // Should show validation error, not call API
    expect(toast.default.error).toHaveBeenCalledWith(
      expect.stringContaining('duración'),
    );
    expect(mockStudiesApi.completeReview).not.toHaveBeenCalled();
  });

  it('submits with duration, quality rating, and notes when filled', async () => {
    mockStudiesApi.completeReview.mockResolvedValue({ data: { data: {} } });
    setupMocks();
    renderReviewsPage();

    await screen.findByText(/Urgencia Alta/i);
    fireEvent.click(screen.getByRole('button', { name: /Completar/i }));

    // Fill duration
    const durationInput = screen.getByLabelText('Duración en minutos');
    fireEvent.change(durationInput, { target: { value: '20' } });

    // Select quality rating 4
    fireEvent.click(screen.getByRole('button', { name: 'Calidad 4' }));

    // Fill notes
    const notesInput = screen.getByLabelText('Notas del repaso');
    fireEvent.change(notesInput, { target: { value: 'Buen repaso' } });

    // Submit via result button
    fireEvent.click(screen.getByRole('button', { name: 'Perfecto' }));

    await waitFor(() => {
      expect(mockStudiesApi.completeReview).toHaveBeenCalledWith(
        'review-1',
        expect.objectContaining({
          result: 'perfect',
          durationMinutes: 20,
          qualityRating: 4,
          notes: 'Buen repaso',
        }),
      );
    });
  });

  it('toggles quality rating on repeated click (deselect)', async () => {
    setupMocks();
    renderReviewsPage();

    await screen.findByText(/Urgencia Alta/i);
    fireEvent.click(screen.getByRole('button', { name: /Completar/i }));

    const btn3 = screen.getByRole('button', { name: 'Calidad 3' });

    // Select
    fireEvent.click(btn3);
    expect(btn3).toHaveAttribute('aria-pressed', 'true');

    // Deselect
    fireEvent.click(btn3);
    expect(btn3).toHaveAttribute('aria-pressed', 'false');
  });
});
