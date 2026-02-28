import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReviewsPage } from './ReviewsPage';

const mockStudiesApi = vi.hoisted(() => ({
  getPendingReviews: vi.fn(),
  getUpcomingReviews: vi.fn(),
  completeReview: vi.fn(),
  skipReview: vi.fn(),
  getReviewSettings: vi.fn(),
  updateReviewSettings: vi.fn(),
}));

vi.mock('../../api/studies.api', () => ({
  studiesApi: mockStudiesApi,
}));

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
      <ReviewsPage />
    </QueryClientProvider>,
  );
}

describe('Reviews visual status cues', () => {
  it('shows urgency and result labels as explicit text cues', async () => {
    mockStudiesApi.getPendingReviews.mockResolvedValue({
      data: {
        data: [
          {
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
          },
        ],
      },
    });

    mockStudiesApi.getUpcomingReviews.mockResolvedValue({
      data: {
        data: [],
      },
    });

    renderReviewsPage();

    expect(await screen.findByText(/Urgencia Alta/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Completar/i }));

    expect(screen.getByRole('button', { name: 'Perfecto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bien' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regular' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mal' })).toBeInTheDocument();
  });
});
