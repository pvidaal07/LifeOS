import { CompleteReviewUseCase } from '../../../src/application/use-cases/reviews/complete-review.use-case';
import { ReviewSchedule, ReviewResult, ReviewSettings, ReviewStatus } from '../../../src/domain/review';
import {
  createMockReviewRepository,
  createMockReviewSettingsRepository,
  createMockTopicRepository,
  createMockSessionRepository,
} from '../../helpers/mock-factories';

describe('CompleteReviewUseCase', () => {
  const userId = 'user-123';
  const topicId = 'topic-456';

  const reviewRepo = createMockReviewRepository();
  const reviewSettingsRepo = createMockReviewSettingsRepository();
  const topicRepo = createMockTopicRepository();
  const sessionRepo = createMockSessionRepository();
  const useCase = new CompleteReviewUseCase(
    reviewRepo,
    reviewSettingsRepo,
    topicRepo,
    sessionRepo,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function buildPendingReview(overrides: {
    scheduledDate: Date;
    intervalDays: number;
    reviewNumber?: number;
  }): ReviewSchedule {
    return ReviewSchedule.fromPersistence({
      id: 'review-1',
      userId,
      topicId,
      scheduledDate: overrides.scheduledDate,
      completedDate: null,
      status: ReviewStatus.PENDING,
      result: null,
      urgencyScore: 0,
      intervalDays: overrides.intervalDays,
      reviewNumber: overrides.reviewNumber ?? 1,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });
  }

  function setupDefaultMocks(): void {
    const defaultSettings = ReviewSettings.createDefault('settings-1', userId);
    reviewSettingsRepo.findByUserId.mockResolvedValue(defaultSettings);
    reviewRepo.findCompletedByTopicId.mockResolvedValue([]);
    reviewRepo.save.mockResolvedValue(undefined);
    sessionRepo.save.mockResolvedValue(undefined);
    topicRepo.updateMastery.mockResolvedValue(undefined);
  }

  describe('early review completion — next date uses scheduledDate as base', () => {
    it('should calculate next review from scheduledDate when completed early', async () => {
      // Arrange: review scheduled for March 1, completed early on Feb 15
      const scheduledDate = new Date('2025-03-01T00:00:00Z');
      vi.useFakeTimers({ now: new Date('2025-02-15T10:00:00Z') });

      const review = buildPendingReview({ scheduledDate, intervalDays: 28 });
      reviewRepo.findPendingById.mockResolvedValue(review);
      setupDefaultMocks();

      // Act
      const result = await useCase.execute({
        reviewId: 'review-1',
        userId,
        result: 'good',
      });

      // Assert: with goodMultiplier 2.0x, next interval = 28 * 2 = 56 days
      // Base date should be scheduledDate (March 1), NOT today (Feb 15)
      // Expected next: March 1 + 56 days = April 26
      const expectedNextDate = new Date('2025-03-01T00:00:00Z');
      expectedNextDate.setDate(expectedNextDate.getDate() + 56);

      expect(result.nextReview.scheduledDate.getTime()).toBe(expectedNextDate.getTime());
      expect(result.nextReview.intervalDays).toBe(56);
    });

    it('should NOT base next review on today when review is completed 2 weeks early', async () => {
      // Arrange
      const scheduledDate = new Date('2025-03-01T00:00:00Z');
      vi.useFakeTimers({ now: new Date('2025-02-15T10:00:00Z') });

      const review = buildPendingReview({ scheduledDate, intervalDays: 28 });
      reviewRepo.findPendingById.mockResolvedValue(review);
      setupDefaultMocks();

      // Act
      const result = await useCase.execute({
        reviewId: 'review-1',
        userId,
        result: 'perfect',
      });

      // Assert: next interval = 28 * 2.5 = 70 days
      // If bug existed: Feb 15 + 70 = April 26 (wrong)
      // Correct:        March 1 + 70 = May 10
      const wrongDate = new Date('2025-02-15T10:00:00Z');
      wrongDate.setDate(wrongDate.getDate() + 70);

      const correctDate = new Date('2025-03-01T00:00:00Z');
      correctDate.setDate(correctDate.getDate() + 70);

      expect(result.nextReview.scheduledDate.getTime()).not.toBe(wrongDate.getTime());
      expect(result.nextReview.scheduledDate.getTime()).toBe(correctDate.getTime());
    });
  });

  describe('late review completion — next date uses today as base', () => {
    it('should calculate next review from today when completed after scheduled date', async () => {
      // Arrange: review scheduled for Jan 1, completed late on Jan 10
      const scheduledDate = new Date('2025-01-01T00:00:00Z');
      const now = new Date('2025-01-10T10:00:00Z');
      vi.useFakeTimers({ now });

      const review = buildPendingReview({ scheduledDate, intervalDays: 7 });
      reviewRepo.findPendingById.mockResolvedValue(review);
      setupDefaultMocks();

      // Act
      const result = await useCase.execute({
        reviewId: 'review-1',
        userId,
        result: 'good',
      });

      // Assert: next interval = 7 * 2.0 = 14 days
      // Base date should be today (Jan 10), NOT scheduledDate (Jan 1)
      // Expected next: Jan 10 + 14 = Jan 24
      const expectedNextDate = new Date(now);
      expectedNextDate.setDate(expectedNextDate.getDate() + 14);

      expect(result.nextReview.scheduledDate.getTime()).toBe(expectedNextDate.getTime());
    });
  });

  describe('on-time review completion', () => {
    it('should calculate next review from today when completed on scheduled date', async () => {
      // Arrange: review scheduled and completed on the same day
      const scheduledDate = new Date('2025-02-01T00:00:00Z');
      vi.useFakeTimers({ now: new Date('2025-02-01T12:00:00Z') });

      const review = buildPendingReview({ scheduledDate, intervalDays: 7 });
      reviewRepo.findPendingById.mockResolvedValue(review);
      setupDefaultMocks();

      // Act
      const result = await useCase.execute({
        reviewId: 'review-1',
        userId,
        result: 'good',
      });

      // Assert: next interval = 7 * 2.0 = 14 days
      // scheduledDate <= now, so base = now
      const expectedNextDate = new Date('2025-02-01T12:00:00Z');
      expectedNextDate.setDate(expectedNextDate.getDate() + 14);

      expect(result.nextReview.scheduledDate.getTime()).toBe(expectedNextDate.getTime());
    });
  });
});
