import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopicDetailPage } from './TopicDetailPage';

const mockStudiesApi = vi.hoisted(() => ({
  getTopic: vi.fn(),
  createSession: vi.fn(),
  updateTopic: vi.fn(),
  deleteTopic: vi.fn(),
  editSessionHistory: vi.fn(),
  editReviewHistory: vi.fn(),
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

const topicResponse = {
  data: {
    data: {
      id: 'topic-1',
      subjectId: 'subject-1',
      name: 'Derivadas',
      masteryLevel: 6,
      systemMasteryLevel: 5.5,
      status: 'in_progress',
      displayOrder: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      subject: {
        id: 'subject-1',
        studyPlanId: 'plan-1',
        name: 'Calculo',
        color: '#0ea5e9',
        displayOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        studyPlan: {
          id: 'plan-1',
          name: 'Matematicas',
        },
      },
      studySessions: [
        {
          id: 'session-1',
          topicId: 'topic-1',
          sessionType: 'review',
          durationMinutes: 20,
          qualityRating: 4,
          studiedAt: '2026-03-01T08:00:00.000Z',
        },
      ],
      reviewSchedules: [
        {
          id: 'review-1',
          topicId: 'topic-1',
          scheduledDate: '2026-03-02T08:00:00.000Z',
          completedDate: '2026-03-02T09:00:00.000Z',
          status: 'completed',
          result: 'good',
          urgencyScore: 1,
          intervalDays: 7,
          reviewNumber: 1,
        },
      ],
    },
  },
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/studies/topics/topic-1']}>
        <Routes>
          <Route path="/studies/topics/:topicId" element={<TopicDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TopicDetailPage history editing scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStudiesApi.getTopic.mockResolvedValue(topicResponse);
  });

  it('keeps session history edit entry point and dialog date-only input', async () => {
    renderPage();

    const sessionEditButton = await screen.findByRole('button', { name: /Editar sesion/i });
    fireEvent.click(sessionEditButton);

    expect(screen.getByRole('heading', { name: 'Editar sesión histórica' })).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha')).toHaveAttribute('type', 'date');
  });

  it('does not show review history edit entry points in topic detail', async () => {
    renderPage();

    await screen.findByText('Historial de repasos');

    expect(screen.queryByRole('button', { name: /Editar repaso/i })).not.toBeInTheDocument();
  });

  it('keeps edited date as 13-02 in session and completed review history', async () => {
    mockStudiesApi.getTopic.mockResolvedValueOnce({
      data: {
        data: {
          ...topicResponse.data.data,
          studySessions: [
            {
              id: 'session-1',
              topicId: 'topic-1',
              sessionType: 'review',
              durationMinutes: 20,
              qualityRating: 4,
              studiedAt: '2026-02-13T00:00:00.000Z',
            },
          ],
          reviewSchedules: [
            {
              id: 'review-1',
              topicId: 'topic-1',
              scheduledDate: '2026-02-15T00:00:00.000Z',
              completedDate: '2026-02-13T00:00:00.000Z',
              status: 'completed',
              result: 'good',
              urgencyScore: 1,
              intervalDays: 1,
              reviewNumber: 1,
            },
          ],
        },
      },
    });

    renderPage();

    await screen.findByText('Repaso #1');

    expect(screen.getAllByText('13/2/2026')).toHaveLength(2);
    expect(screen.queryByText('15/2/2026')).not.toBeInTheDocument();
  });
});
