import { SpacedRepetitionService, CompletedReviewData } from '../../../src/domain/review/services/spaced-repetition.service';
import { ReviewResult } from '../../../src/domain/review/value-objects/review-result.vo';
import { ReviewSettings } from '../../../src/domain/review/entities/review-settings.entity';

describe('SpacedRepetitionService', () => {
  let service: SpacedRepetitionService;
  let defaultSettings: ReviewSettings;

  beforeEach(() => {
    service = new SpacedRepetitionService();
    defaultSettings = ReviewSettings.createDefault('settings-1', 'user-1');
  });

  // --- calculateNextInterval ---

  describe('calculateNextInterval', () => {
    describe('with perfect result', () => {
      it('should multiply interval by perfectMultiplier (2.5x)', () => {
        const result = service.calculateNextInterval(
          7,
          ReviewResult.PERFECT,
          defaultSettings,
        );

        expect(result).toBe(Math.round(7 * 2.5)); // 18
      });

      it('should use custom perfectMultiplier when provided', () => {
        const customSettings = ReviewSettings.fromPersistence({
          id: 's-1',
          userId: 'u-1',
          baseIntervals: [1, 7, 30],
          perfectMultiplier: 3.0,
          goodMultiplier: 2.0,
          regularMultiplier: 1.2,
          badReset: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = service.calculateNextInterval(
          10,
          ReviewResult.PERFECT,
          customSettings,
        );

        expect(result).toBe(30); // 10 * 3.0
      });
    });

    describe('with good result', () => {
      it('should multiply interval by goodMultiplier (2.0x)', () => {
        const result = service.calculateNextInterval(
          7,
          ReviewResult.GOOD,
          defaultSettings,
        );

        expect(result).toBe(14); // 7 * 2.0
      });
    });

    describe('with regular result', () => {
      it('should multiply interval by regularMultiplier (1.2x)', () => {
        const result = service.calculateNextInterval(
          10,
          ReviewResult.REGULAR,
          defaultSettings,
        );

        expect(result).toBe(12); // round(10 * 1.2)
      });

      it('should round the result to nearest integer', () => {
        const result = service.calculateNextInterval(
          7,
          ReviewResult.REGULAR,
          defaultSettings,
        );

        expect(result).toBe(Math.round(7 * 1.2)); // 8
      });
    });

    describe('with bad result', () => {
      it('should reset to first interval when badReset is true', () => {
        const result = service.calculateNextInterval(
          30,
          ReviewResult.BAD,
          defaultSettings,
        );

        expect(result).toBe(1); // first base interval
      });

      it('should halve the interval when badReset is false', () => {
        const noBadResetSettings = ReviewSettings.fromPersistence({
          id: 's-1',
          userId: 'u-1',
          baseIntervals: [1, 7, 30],
          perfectMultiplier: 2.5,
          goodMultiplier: 2.0,
          regularMultiplier: 1.2,
          badReset: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = service.calculateNextInterval(
          30,
          ReviewResult.BAD,
          noBadResetSettings,
        );

        expect(result).toBe(15); // round(30 / 2)
      });

      it('should never go below 1 day when halving', () => {
        const noBadResetSettings = ReviewSettings.fromPersistence({
          id: 's-1',
          userId: 'u-1',
          baseIntervals: [1],
          perfectMultiplier: 2.5,
          goodMultiplier: 2.0,
          regularMultiplier: 1.2,
          badReset: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const result = service.calculateNextInterval(
          1,
          ReviewResult.BAD,
          noBadResetSettings,
        );

        expect(result).toBe(1); // max(1, round(1/2)) = max(1, 1) = 1
      });
    });

    describe('cap at 365 days', () => {
      it('should cap interval at 365 days even with large multiplier', () => {
        const result = service.calculateNextInterval(
          200,
          ReviewResult.PERFECT,
          defaultSettings,
        );

        // 200 * 2.5 = 500, capped at 365
        expect(result).toBe(365);
      });

      it('should not cap when interval is below 365', () => {
        const result = service.calculateNextInterval(
          100,
          ReviewResult.GOOD,
          defaultSettings,
        );

        // 100 * 2.0 = 200, below cap
        expect(result).toBe(200);
      });
    });
  });

  // --- calculateNextReviewDate ---

  describe('calculateNextReviewDate', () => {
    it('should add intervalDays to the completed date', () => {
      const completedAt = new Date('2025-01-15T10:00:00Z');
      const intervalDays = 7;

      const nextDate = service.calculateNextReviewDate(completedAt, intervalDays);

      expect(nextDate.getTime()).toBe(
        new Date('2025-01-22T10:00:00Z').getTime(),
      );
    });

    it('should handle month boundaries correctly', () => {
      const completedAt = new Date('2025-01-28T10:00:00Z');
      const intervalDays = 7;

      const nextDate = service.calculateNextReviewDate(completedAt, intervalDays);

      expect(nextDate.getDate()).toBe(4); // Feb 4
      expect(nextDate.getMonth()).toBe(1); // February
    });

    it('should handle large intervals (90 days)', () => {
      const completedAt = new Date('2025-01-01T12:00:00Z');

      const nextDate = service.calculateNextReviewDate(completedAt, 90);

      // Verify 90 days were added by checking the date difference
      const diffMs = nextDate.getTime() - completedAt.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
      expect(diffDays).toBe(90);
    });

    it('should not mutate the original date', () => {
      const completedAt = new Date('2025-06-01T00:00:00Z');
      const originalTime = completedAt.getTime();

      service.calculateNextReviewDate(completedAt, 30);

      expect(completedAt.getTime()).toBe(originalTime);
    });
  });

  // --- calculateUrgencyScore ---

  describe('calculateUrgencyScore', () => {
    it('should calculate higher urgency for overdue reviews', () => {
      const scheduledDate = new Date('2025-01-01');
      const now = new Date('2025-01-11'); // 10 days overdue

      const score = service.calculateUrgencyScore(scheduledDate, 7, 5, now);

      // ((10 + 1) / max(1, 7)) * (11 - 5) = (11/7) * 6 = ~9.43
      expect(score).toBeCloseTo((11 / 7) * 6, 5);
    });

    it('should return a base score for reviews due today (0 days overdue)', () => {
      const now = new Date('2025-01-01');

      const score = service.calculateUrgencyScore(now, 7, 5, now);

      // ((0 + 1) / 7) * (11 - 5) = (1/7) * 6 = ~0.857
      expect(score).toBeCloseTo((1 / 7) * 6, 5);
    });

    it('should not give negative overdue days for future reviews', () => {
      const scheduledDate = new Date('2025-01-20');
      const now = new Date('2025-01-10'); // not yet due

      const score = service.calculateUrgencyScore(scheduledDate, 7, 5, now);

      // daysOverdue = max(0, -10) = 0
      // ((0 + 1) / 7) * (11 - 5) = (1/7) * 6
      expect(score).toBeCloseTo((1 / 7) * 6, 5);
    });

    it('should assign higher urgency to topics with lower mastery', () => {
      const scheduledDate = new Date('2025-01-01');
      const now = new Date('2025-01-08'); // 7 days overdue

      const scoreHighMastery = service.calculateUrgencyScore(
        scheduledDate, 7, 9, now,
      );
      const scoreLowMastery = service.calculateUrgencyScore(
        scheduledDate, 7, 2, now,
      );

      expect(scoreLowMastery).toBeGreaterThan(scoreHighMastery);
    });

    it('should treat zero mastery as 1 for calculation', () => {
      const scheduledDate = new Date('2025-01-01');
      const now = new Date('2025-01-08');

      const score = service.calculateUrgencyScore(scheduledDate, 7, 0, now);

      // effectiveMastery = 1 (not 0)
      // ((7 + 1) / 7) * (11 - 1) = (8/7) * 10
      expect(score).toBeCloseTo((8 / 7) * 10, 5);
    });

    it('should account for intervalDays — smaller intervals = more urgent', () => {
      const scheduledDate = new Date('2025-01-01');
      const now = new Date('2025-01-04'); // 3 days overdue

      const shortInterval = service.calculateUrgencyScore(
        scheduledDate, 1, 5, now,
      );
      const longInterval = service.calculateUrgencyScore(
        scheduledDate, 30, 5, now,
      );

      expect(shortInterval).toBeGreaterThan(longInterval);
    });
  });

  // --- calculateSystemMastery ---

  describe('calculateSystemMastery', () => {
    it('should return 0 for zero completed reviews', () => {
      const mastery = service.calculateSystemMastery([]);
      expect(mastery).toBe(0);
    });

    it('should calculate mastery based on weighted formula with 4 factors', () => {
      const reviews: CompletedReviewData[] = [
        {
          result: ReviewResult.PERFECT,
          intervalDays: 1,
          completedDate: new Date('2025-01-01'),
        },
        {
          result: ReviewResult.GOOD,
          intervalDays: 7,
          completedDate: new Date('2025-01-08'),
        },
        {
          result: ReviewResult.GOOD,
          intervalDays: 30,
          completedDate: new Date('2025-02-07'),
        },
      ];

      const mastery = service.calculateSystemMastery(reviews);

      // reviewCountFactor = min(1, 3/5) = 0.6
      // successRatio = 3/3 = 1.0
      // intervalFactor = min(1, log2(31)/log2(31)) = 1.0
      // recentBonus = all 3 successful → 1
      // mastery = min(10, 0.6*3 + 1.0*3 + 1.0*3 + 1) = 8.8
      expect(mastery).toBe(8.8);
    });

    it('should factor in unsuccessful reviews to lower mastery', () => {
      const reviews: CompletedReviewData[] = [
        {
          result: ReviewResult.BAD,
          intervalDays: 1,
          completedDate: new Date('2025-01-01'),
        },
        {
          result: ReviewResult.BAD,
          intervalDays: 1,
          completedDate: new Date('2025-01-02'),
        },
        {
          result: ReviewResult.GOOD,
          intervalDays: 7,
          completedDate: new Date('2025-01-09'),
        },
      ];

      const mastery = service.calculateSystemMastery(reviews);

      // reviewCountFactor = min(1, 3/5) = 0.6
      // successRatio = 1/3 ≈ 0.333
      // intervalFactor = min(1, log2(8)/log2(31)) ≈ 0.605
      // recentBonus = not all successful → 0
      // mastery = 0.6*3 + 0.333*3 + 0.605*3 + 0 ≈ 4.6
      expect(mastery).toBeCloseTo(4.6, 1);
    });

    it('should give moderate mastery for first review with small interval', () => {
      const reviews: CompletedReviewData[] = [
        {
          result: ReviewResult.PERFECT,
          intervalDays: 1,
          completedDate: new Date('2025-01-01'),
        },
      ];

      const mastery = service.calculateSystemMastery(reviews);

      // reviewCountFactor = min(1, 1/5) = 0.2
      // successRatio = 1/1 = 1.0
      // intervalFactor = min(1, log2(2)/log2(31)) ≈ 0.202
      // recentBonus = all 1 successful → 1
      // mastery = 0.2*3 + 1.0*3 + 0.202*3 + 1 ≈ 5.2
      expect(mastery).toBeCloseTo(5.2, 1);
    });

    it('should cap mastery at 10', () => {
      const reviews: CompletedReviewData[] = [
        { result: ReviewResult.PERFECT, intervalDays: 1, completedDate: new Date() },
        { result: ReviewResult.PERFECT, intervalDays: 7, completedDate: new Date() },
        { result: ReviewResult.PERFECT, intervalDays: 30, completedDate: new Date() },
        { result: ReviewResult.PERFECT, intervalDays: 90, completedDate: new Date() },
        { result: ReviewResult.PERFECT, intervalDays: 200, completedDate: new Date() },
      ];

      const mastery = service.calculateSystemMastery(reviews);

      expect(mastery).toBeLessThanOrEqual(10);
    });

    it('should round to 1 decimal place', () => {
      const reviews: CompletedReviewData[] = [
        { result: ReviewResult.GOOD, intervalDays: 3, completedDate: new Date() },
      ];

      const mastery = service.calculateSystemMastery(reviews);

      // Verify it's rounded to 1 decimal
      const decimalParts = mastery.toString().split('.');
      if (decimalParts.length > 1) {
        expect(decimalParts[1].length).toBeLessThanOrEqual(1);
      }
    });

    it('should consider regular results as unsuccessful', () => {
      const allRegular: CompletedReviewData[] = [
        { result: ReviewResult.REGULAR, intervalDays: 7, completedDate: new Date() },
        { result: ReviewResult.REGULAR, intervalDays: 7, completedDate: new Date() },
      ];

      const mastery = service.calculateSystemMastery(allRegular);

      // reviewCountFactor = min(1, 2/5) = 0.4
      // successRatio = 0/2 = 0 (regular is not successful)
      // intervalFactor = min(1, log2(8)/log2(31)) ≈ 0.605
      // recentBonus = 0 successful → 0
      // mastery = 0.4*3 + 0*3 + 0.605*3 + 0 ≈ 3.0
      expect(mastery).toBeCloseTo(3.0, 1);
    });
  });

  // --- determineTopicStatus ---

  describe('determineTopicStatus', () => {
    it('should return mastered when mastery >= 7', () => {
      expect(service.determineTopicStatus(7)).toBe('mastered');
      expect(service.determineTopicStatus(8)).toBe('mastered');
      expect(service.determineTopicStatus(9)).toBe('mastered');
      expect(service.determineTopicStatus(10)).toBe('mastered');
    });

    it('should return in_progress when mastery < 7', () => {
      expect(service.determineTopicStatus(0)).toBe('in_progress');
      expect(service.determineTopicStatus(5)).toBe('in_progress');
      expect(service.determineTopicStatus(6.9)).toBe('in_progress');
    });

    it('should treat exactly 7 as mastered', () => {
      expect(service.determineTopicStatus(7)).toBe('mastered');
    });
  });

  // --- getDefaultIntervals ---

  describe('getDefaultIntervals', () => {
    it('should return the standard spaced repetition intervals', () => {
      const intervals = service.getDefaultIntervals();
      expect(intervals).toEqual([1, 7, 30, 90]);
    });
  });
});
