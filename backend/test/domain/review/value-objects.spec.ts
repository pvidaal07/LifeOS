import { ReviewResult } from '../../../src/domain/review/value-objects/review-result.vo';
import { ReviewStatus } from '../../../src/domain/review/value-objects/review-status.vo';
import { QualityRating } from '../../../src/domain/review/value-objects/quality-rating.vo';

describe('Review Value Objects', () => {
  // --- ReviewResult ---

  describe('ReviewResult', () => {
    describe('creation with valid values', () => {
      it.each(['perfect', 'good', 'regular', 'bad'] as const)(
        'should create ReviewResult with value "%s"',
        (value) => {
          const result = ReviewResult.create(value);
          expect(result.value).toBe(value);
        },
      );
    });

    describe('creation with invalid values', () => {
      it('should throw for invalid result value', () => {
        expect(() => ReviewResult.create('excellent')).toThrow();
      });

      it('should throw for empty string', () => {
        expect(() => ReviewResult.create('')).toThrow();
      });
    });

    describe('static constants', () => {
      it('should have correct static instances', () => {
        expect(ReviewResult.PERFECT.value).toBe('perfect');
        expect(ReviewResult.GOOD.value).toBe('good');
        expect(ReviewResult.REGULAR.value).toBe('regular');
        expect(ReviewResult.BAD.value).toBe('bad');
      });
    });

    describe('boolean helpers', () => {
      it('should identify perfect result', () => {
        expect(ReviewResult.PERFECT.isPerfect).toBe(true);
        expect(ReviewResult.PERFECT.isGood).toBe(false);
      });

      it('should identify good result', () => {
        expect(ReviewResult.GOOD.isGood).toBe(true);
        expect(ReviewResult.GOOD.isPerfect).toBe(false);
      });

      it('should identify regular result', () => {
        expect(ReviewResult.REGULAR.isRegular).toBe(true);
        expect(ReviewResult.REGULAR.isBad).toBe(false);
      });

      it('should identify bad result', () => {
        expect(ReviewResult.BAD.isBad).toBe(true);
        expect(ReviewResult.BAD.isGood).toBe(false);
      });
    });

    describe('isSuccessful', () => {
      it('should consider perfect as successful', () => {
        expect(ReviewResult.PERFECT.isSuccessful).toBe(true);
      });

      it('should consider good as successful', () => {
        expect(ReviewResult.GOOD.isSuccessful).toBe(true);
      });

      it('should consider regular as unsuccessful', () => {
        expect(ReviewResult.REGULAR.isSuccessful).toBe(false);
      });

      it('should consider bad as unsuccessful', () => {
        expect(ReviewResult.BAD.isSuccessful).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('should return the raw string value, not an object', () => {
        const json = ReviewResult.PERFECT.toJSON();
        expect(json).toBe('perfect');
        expect(typeof json).toBe('string');
      });

      it('should serialize correctly via JSON.stringify', () => {
        const stringified = JSON.stringify({ result: ReviewResult.GOOD });
        const parsed = JSON.parse(stringified);
        expect(parsed.result).toBe('good');
      });
    });

    describe('equals', () => {
      it('should consider same values equal', () => {
        const a = ReviewResult.create('perfect');
        const b = ReviewResult.create('perfect');
        expect(a.equals(b)).toBe(true);
      });

      it('should consider different values not equal', () => {
        expect(ReviewResult.PERFECT.equals(ReviewResult.BAD)).toBe(false);
      });
    });
  });

  // --- ReviewStatus ---

  describe('ReviewStatus', () => {
    describe('creation with valid values', () => {
      it.each(['pending', 'completed', 'skipped'] as const)(
        'should create ReviewStatus with value "%s"',
        (value) => {
          const status = ReviewStatus.create(value);
          expect(status.value).toBe(value);
        },
      );
    });

    describe('creation with invalid values', () => {
      it('should throw for invalid status value', () => {
        expect(() => ReviewStatus.create('in_progress')).toThrow();
      });
    });

    describe('boolean helpers', () => {
      it('should identify pending', () => {
        expect(ReviewStatus.PENDING.isPending).toBe(true);
        expect(ReviewStatus.PENDING.isCompleted).toBe(false);
        expect(ReviewStatus.PENDING.isSkipped).toBe(false);
      });

      it('should identify completed', () => {
        expect(ReviewStatus.COMPLETED.isCompleted).toBe(true);
        expect(ReviewStatus.COMPLETED.isPending).toBe(false);
      });

      it('should identify skipped', () => {
        expect(ReviewStatus.SKIPPED.isSkipped).toBe(true);
        expect(ReviewStatus.SKIPPED.isPending).toBe(false);
      });
    });

    describe('canTransitionTo', () => {
      it('should allow pending to transition to completed', () => {
        expect(
          ReviewStatus.PENDING.canTransitionTo(ReviewStatus.COMPLETED),
        ).toBe(true);
      });

      it('should allow pending to transition to skipped', () => {
        expect(
          ReviewStatus.PENDING.canTransitionTo(ReviewStatus.SKIPPED),
        ).toBe(true);
      });

      it('should not allow pending to transition to pending', () => {
        expect(
          ReviewStatus.PENDING.canTransitionTo(ReviewStatus.PENDING),
        ).toBe(false);
      });

      it('should not allow completed to transition to any state', () => {
        expect(
          ReviewStatus.COMPLETED.canTransitionTo(ReviewStatus.PENDING),
        ).toBe(false);
        expect(
          ReviewStatus.COMPLETED.canTransitionTo(ReviewStatus.SKIPPED),
        ).toBe(false);
        expect(
          ReviewStatus.COMPLETED.canTransitionTo(ReviewStatus.COMPLETED),
        ).toBe(false);
      });

      it('should not allow skipped to transition to any state', () => {
        expect(
          ReviewStatus.SKIPPED.canTransitionTo(ReviewStatus.PENDING),
        ).toBe(false);
        expect(
          ReviewStatus.SKIPPED.canTransitionTo(ReviewStatus.COMPLETED),
        ).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('should return the raw string value', () => {
        expect(ReviewStatus.PENDING.toJSON()).toBe('pending');
        expect(typeof ReviewStatus.PENDING.toJSON()).toBe('string');
      });
    });
  });

  // --- QualityRating ---

  describe('QualityRating', () => {
    describe('creation with valid values', () => {
      it.each([1, 2, 3, 4, 5])(
        'should create QualityRating with value %d',
        (value) => {
          const rating = QualityRating.create(value);
          expect(rating.value).toBe(value);
        },
      );
    });

    describe('creation with invalid values', () => {
      it('should throw for value below 1', () => {
        expect(() => QualityRating.create(0)).toThrow();
      });

      it('should throw for value above 5', () => {
        expect(() => QualityRating.create(6)).toThrow();
      });

      it('should throw for non-integer value', () => {
        expect(() => QualityRating.create(3.5)).toThrow();
      });

      it('should throw for negative value', () => {
        expect(() => QualityRating.create(-1)).toThrow();
      });
    });

    describe('toJSON', () => {
      it('should return the raw number, not an object', () => {
        const json = QualityRating.create(4).toJSON();
        expect(json).toBe(4);
        expect(typeof json).toBe('number');
      });

      it('should serialize correctly via JSON.stringify', () => {
        const stringified = JSON.stringify({ rating: QualityRating.create(3) });
        const parsed = JSON.parse(stringified);
        expect(parsed.rating).toBe(3);
      });
    });
  });
});
