import { EditHistoricalSessionUseCase } from '../../../src/application/use-cases/sessions/edit-historical-session.use-case';
import {
  ReviewResult,
  ReviewSchedule,
  ReviewSettings,
  ReviewStatus,
} from '../../../src/domain/review';
import { SessionType, StudySession } from '../../../src/domain/study';
import {
  createMockReviewRepository,
  createMockReviewSettingsRepository,
  createMockSessionRepository,
  createMockTopicRepository,
} from '../../helpers/mock-factories';

function buildSession(params: {
  id: string;
  type: 'first_time' | 'review' | 'practice';
  studiedAt: string;
  qualityRating?: number | null;
}): StudySession {
  return StudySession.fromPersistence({
    id: params.id,
    userId: 'user-1',
    topicId: 'topic-1',
    sessionType: SessionType.create(params.type),
    durationMinutes: 30,
    qualityRating: params.qualityRating ?? null,
    notes: null,
    studiedAt: new Date(params.studiedAt),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildReview(params: {
  id: string;
  reviewNumber: number;
  status: ReviewStatus;
  intervalDays: number;
  scheduledDate: string;
  completedDate?: string;
  result?: 'perfect' | 'good' | 'regular' | 'bad';
}): ReviewSchedule {
  return ReviewSchedule.fromPersistence({
    id: params.id,
    userId: 'user-1',
    topicId: 'topic-1',
    scheduledDate: new Date(params.scheduledDate),
    completedDate: params.completedDate ? new Date(params.completedDate) : null,
    status: params.status,
    result: params.result ? ReviewResult.create(params.result) : null,
    urgencyScore: 0,
    intervalDays: params.intervalDays,
    reviewNumber: params.reviewNumber,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('EditHistoricalSessionUseCase', () => {
  const sessionRepo = createMockSessionRepository();
  const reviewRepo = createMockReviewRepository();
  const reviewSettingsRepo = createMockReviewSettingsRepository();
  const topicRepo = createMockTopicRepository();

  const useCase = new EditHistoricalSessionUseCase(
    sessionRepo,
    reviewRepo,
    reviewSettingsRepo,
    topicRepo,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recomputes from anchor #1 when editing first historical session', async () => {
    const firstSession = buildSession({
      id: 'session-1',
      type: 'first_time',
      studiedAt: '2026-01-10T00:00:00.000Z',
    });

    const reviews = [
      buildReview({
        id: 'review-1',
        reviewNumber: 1,
        status: ReviewStatus.PENDING,
        intervalDays: 1,
        scheduledDate: '2026-01-11T00:00:00.000Z',
      }),
    ];

    sessionRepo.findByIdForOwner.mockResolvedValue(firstSession);
    sessionRepo.findTimelineByTopicId.mockResolvedValue([firstSession]);
    reviewRepo.findTimelineByTopicId.mockResolvedValue(reviews);
    reviewSettingsRepo.findByUserId.mockResolvedValue(ReviewSettings.createDefault('settings-1', 'user-1'));
    sessionRepo.editSessionAndReplaceTopicSuffix.mockResolvedValue(true);
    topicRepo.updateMastery.mockResolvedValue(undefined);

    await useCase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      studiedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(sessionRepo.editSessionAndReplaceTopicSuffix).toHaveBeenCalledWith(
      expect.objectContaining({
        anchorReviewNumber: 1,
      }),
    );

    const persistedReviews = sessionRepo.editSessionAndReplaceTopicSuffix.mock.calls[0][0].reviews;
    expect(persistedReviews).toHaveLength(1);
    expect(persistedReviews[0].scheduledDate.toISOString()).toBe('2026-01-02T00:00:00.000Z');
  });

  it('rejects edits when session is not owned by the user', async () => {
    sessionRepo.findByIdForOwner.mockResolvedValue(null);

    await expect(
      useCase.execute({ sessionId: 'session-404', userId: 'user-1' }),
    ).rejects.toThrow("Sesión de estudio con id 'session-404' no encontrado");
  });
});
