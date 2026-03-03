import { EditHistoricalReviewUseCase } from '../../../src/application/use-cases/reviews/edit-historical-review.use-case';
import {
  ReviewResult,
  ReviewSchedule,
  ReviewSettings,
  ReviewStatus,
} from '../../../src/domain/review';
import {
  createMockReviewRepository,
  createMockReviewSettingsRepository,
  createMockTopicRepository,
} from '../../helpers/mock-factories';

function buildReview(params: {
  id: string;
  reviewNumber: number;
  status: ReviewStatus;
  result: ReviewResult | null;
  completedDate: Date | null;
  intervalDays: number;
  scheduledDate: Date;
}): ReviewSchedule {
  return ReviewSchedule.fromPersistence({
    id: params.id,
    userId: 'user-1',
    topicId: 'topic-1',
    scheduledDate: params.scheduledDate,
    completedDate: params.completedDate,
    status: params.status,
    result: params.result,
    urgencyScore: 0,
    intervalDays: params.intervalDays,
    reviewNumber: params.reviewNumber,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('EditHistoricalReviewUseCase', () => {
  const reviewRepo = createMockReviewRepository();
  const reviewSettingsRepo = createMockReviewSettingsRepository();
  const topicRepo = createMockTopicRepository();

  const useCase = new EditHistoricalReviewUseCase(
    reviewRepo,
    reviewSettingsRepo,
    topicRepo,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('edits owned completed review and persists recomputed suffix', async () => {
    const reviewToEdit = buildReview({
      id: 'review-1',
      reviewNumber: 1,
      status: ReviewStatus.COMPLETED,
      result: ReviewResult.GOOD,
      completedDate: new Date('2026-01-02T00:00:00.000Z'),
      intervalDays: 1,
      scheduledDate: new Date('2026-01-02T00:00:00.000Z'),
    });

    const timeline = [
      reviewToEdit,
      buildReview({
        id: 'review-2',
        reviewNumber: 2,
        status: ReviewStatus.COMPLETED,
        result: ReviewResult.GOOD,
        completedDate: new Date('2026-01-04T00:00:00.000Z'),
        intervalDays: 2,
        scheduledDate: new Date('2026-01-04T00:00:00.000Z'),
      }),
      buildReview({
        id: 'review-3',
        reviewNumber: 3,
        status: ReviewStatus.PENDING,
        result: null,
        completedDate: null,
        intervalDays: 4,
        scheduledDate: new Date('2026-01-08T00:00:00.000Z'),
      }),
    ];

    reviewRepo.findByIdForOwner.mockResolvedValue(reviewToEdit);
    reviewRepo.findTimelineByTopicId.mockResolvedValue(timeline);
    reviewSettingsRepo.findByUserId.mockResolvedValue(ReviewSettings.createDefault('settings-1', 'user-1'));
    reviewRepo.editReviewAndReplaceTopicSuffix.mockResolvedValue(true);
    topicRepo.updateMastery.mockResolvedValue(undefined);

    const output = await useCase.execute({
      reviewId: 'review-1',
      userId: 'user-1',
      result: 'bad',
      completedDate: new Date('2026-01-01T00:00:00.000Z'),
      durationMinutes: 45,
      qualityRating: 4,
    });

    expect(output.reviewId).toBe('review-1');
    expect(output.topicId).toBe('topic-1');
    expect(reviewRepo.editReviewAndReplaceTopicSuffix).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        reviewId: 'review-1',
        topicId: 'topic-1',
        anchorReviewNumber: 1,
        studySessionPatch: {
          matchStudiedAt: new Date('2026-01-02T00:00:00.000Z'),
          studiedAt: new Date('2026-01-01T00:00:00.000Z'),
          durationMinutes: 45,
          qualityRating: 4,
        },
      }),
    );
    expect(topicRepo.updateMastery).toHaveBeenCalledWith(
      'topic-1',
      output.systemMastery,
      output.topicStatus,
    );
  });

  it('rejects edits for non-owned reviews', async () => {
    reviewRepo.findByIdForOwner.mockResolvedValue(null);

    await expect(
      useCase.execute({ reviewId: 'review-unknown', userId: 'user-1' }),
    ).rejects.toThrow("Review con id 'review-unknown' no encontrado");
  });
});
