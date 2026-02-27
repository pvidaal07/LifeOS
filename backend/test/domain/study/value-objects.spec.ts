import { PlanStatus } from '../../../src/domain/study/value-objects/plan-status.vo';
import { TopicStatus } from '../../../src/domain/study/value-objects/topic-status.vo';
import { SessionType } from '../../../src/domain/study/value-objects/session-type.vo';

describe('Study Value Objects', () => {
  // --- PlanStatus ---

  describe('PlanStatus', () => {
    describe('creation with valid values', () => {
      it.each(['active', 'archived', 'completed'] as const)(
        'should create PlanStatus with value "%s"',
        (value) => {
          const status = PlanStatus.create(value);
          expect(status.value).toBe(value);
        },
      );
    });

    describe('creation with invalid values', () => {
      it('should throw for invalid status value', () => {
        expect(() => PlanStatus.create('deleted')).toThrow();
      });

      it('should throw for empty string', () => {
        expect(() => PlanStatus.create('')).toThrow();
      });
    });

    describe('static constants', () => {
      it('should have correct static instances', () => {
        expect(PlanStatus.ACTIVE.value).toBe('active');
        expect(PlanStatus.ARCHIVED.value).toBe('archived');
        expect(PlanStatus.COMPLETED.value).toBe('completed');
      });
    });

    describe('boolean helpers', () => {
      it('should identify active', () => {
        expect(PlanStatus.ACTIVE.isActive).toBe(true);
        expect(PlanStatus.ACTIVE.isArchived).toBe(false);
        expect(PlanStatus.ACTIVE.isCompleted).toBe(false);
      });

      it('should identify archived', () => {
        expect(PlanStatus.ARCHIVED.isArchived).toBe(true);
        expect(PlanStatus.ARCHIVED.isActive).toBe(false);
      });

      it('should identify completed', () => {
        expect(PlanStatus.COMPLETED.isCompleted).toBe(true);
        expect(PlanStatus.COMPLETED.isActive).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('should return the raw string value', () => {
        expect(PlanStatus.ACTIVE.toJSON()).toBe('active');
        expect(typeof PlanStatus.ACTIVE.toJSON()).toBe('string');
      });

      it('should serialize correctly via JSON.stringify', () => {
        const stringified = JSON.stringify({ status: PlanStatus.ARCHIVED });
        const parsed = JSON.parse(stringified);
        expect(parsed.status).toBe('archived');
      });
    });

    describe('equals', () => {
      it('should consider same values equal', () => {
        const a = PlanStatus.create('active');
        const b = PlanStatus.create('active');
        expect(a.equals(b)).toBe(true);
      });

      it('should consider different values not equal', () => {
        expect(PlanStatus.ACTIVE.equals(PlanStatus.ARCHIVED)).toBe(false);
      });
    });
  });

  // --- TopicStatus ---

  describe('TopicStatus', () => {
    describe('creation with valid values', () => {
      it.each(['not_started', 'in_progress', 'mastered'] as const)(
        'should create TopicStatus with value "%s"',
        (value) => {
          const status = TopicStatus.create(value);
          expect(status.value).toBe(value);
        },
      );
    });

    describe('creation with invalid values', () => {
      it('should throw for invalid status value', () => {
        expect(() => TopicStatus.create('completed')).toThrow();
      });
    });

    describe('static constants', () => {
      it('should have correct static instances', () => {
        expect(TopicStatus.NOT_STARTED.value).toBe('not_started');
        expect(TopicStatus.IN_PROGRESS.value).toBe('in_progress');
        expect(TopicStatus.MASTERED.value).toBe('mastered');
      });
    });

    describe('boolean helpers', () => {
      it('should identify not_started', () => {
        expect(TopicStatus.NOT_STARTED.isNotStarted).toBe(true);
        expect(TopicStatus.NOT_STARTED.isInProgress).toBe(false);
        expect(TopicStatus.NOT_STARTED.isMastered).toBe(false);
      });

      it('should identify in_progress', () => {
        expect(TopicStatus.IN_PROGRESS.isInProgress).toBe(true);
        expect(TopicStatus.IN_PROGRESS.isNotStarted).toBe(false);
      });

      it('should identify mastered', () => {
        expect(TopicStatus.MASTERED.isMastered).toBe(true);
        expect(TopicStatus.MASTERED.isInProgress).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('should return the raw string value', () => {
        expect(TopicStatus.NOT_STARTED.toJSON()).toBe('not_started');
        expect(typeof TopicStatus.IN_PROGRESS.toJSON()).toBe('string');
      });
    });
  });

  // --- SessionType ---

  describe('SessionType', () => {
    describe('creation with valid values', () => {
      it.each(['first_time', 'review', 'practice'] as const)(
        'should create SessionType with value "%s"',
        (value) => {
          const type = SessionType.create(value);
          expect(type.value).toBe(value);
        },
      );
    });

    describe('creation with invalid values', () => {
      it('should throw for invalid session type', () => {
        expect(() => SessionType.create('exam')).toThrow();
      });
    });

    describe('static constants', () => {
      it('should have correct static instances', () => {
        expect(SessionType.FIRST_TIME.value).toBe('first_time');
        expect(SessionType.REVIEW.value).toBe('review');
        expect(SessionType.PRACTICE.value).toBe('practice');
      });
    });

    describe('boolean helpers', () => {
      it('should identify first_time', () => {
        expect(SessionType.FIRST_TIME.isFirstTime).toBe(true);
        expect(SessionType.FIRST_TIME.isReview).toBe(false);
        expect(SessionType.FIRST_TIME.isPractice).toBe(false);
      });

      it('should identify review', () => {
        expect(SessionType.REVIEW.isReview).toBe(true);
        expect(SessionType.REVIEW.isFirstTime).toBe(false);
      });

      it('should identify practice', () => {
        expect(SessionType.PRACTICE.isPractice).toBe(true);
        expect(SessionType.PRACTICE.isReview).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('should return the raw string value', () => {
        expect(SessionType.FIRST_TIME.toJSON()).toBe('first_time');
        expect(typeof SessionType.REVIEW.toJSON()).toBe('string');
      });

      it('should serialize correctly via JSON.stringify', () => {
        const stringified = JSON.stringify({ type: SessionType.PRACTICE });
        const parsed = JSON.parse(stringified);
        expect(parsed.type).toBe('practice');
      });
    });
  });
});
