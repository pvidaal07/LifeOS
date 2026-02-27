import { ReviewSchedule } from '../../../src/domain/review/entities/review-schedule.entity';
import { ReviewResult } from '../../../src/domain/review/value-objects/review-result.vo';
import { ReviewStatus } from '../../../src/domain/review/value-objects/review-status.vo';
import { InvalidOperationError } from '../../../src/domain/common';

describe('ReviewSchedule', () => {
  const baseDate = new Date('2025-06-01T10:00:00Z');

  // --- scheduleFirst ---

  describe('scheduleFirst', () => {
    it('should create a first review with pending status', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      expect(schedule.id).toBe('rs-1');
      expect(schedule.userId).toBe('user-1');
      expect(schedule.topicId).toBe('topic-1');
      expect(schedule.scheduledDate).toEqual(baseDate);
      expect(schedule.status.value).toBe('pending');
      expect(schedule.result).toBeNull();
      expect(schedule.completedDate).toBeNull();
      expect(schedule.urgencyScore).toBe(0);
      expect(schedule.intervalDays).toBe(1);
      expect(schedule.reviewNumber).toBe(1);
    });

    it('should set createdAt and updatedAt to now', () => {
      const before = new Date();
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });
      const after = new Date();

      expect(schedule.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(schedule.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  // --- scheduleNext ---

  describe('scheduleNext', () => {
    it('should create a subsequent review with correct reviewNumber', () => {
      const schedule = ReviewSchedule.scheduleNext({
        id: 'rs-2',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: new Date('2025-06-08'),
        intervalDays: 7,
        reviewNumber: 2,
      });

      expect(schedule.id).toBe('rs-2');
      expect(schedule.reviewNumber).toBe(2);
      expect(schedule.intervalDays).toBe(7);
      expect(schedule.status.value).toBe('pending');
      expect(schedule.result).toBeNull();
      expect(schedule.completedDate).toBeNull();
    });

    it('should accept any reviewNumber for later reviews', () => {
      const schedule = ReviewSchedule.scheduleNext({
        id: 'rs-10',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: new Date('2025-09-01'),
        intervalDays: 90,
        reviewNumber: 10,
      });

      expect(schedule.reviewNumber).toBe(10);
    });
  });

  // --- complete ---

  describe('complete', () => {
    it('should transition a pending review to completed with a result', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });
      const completedDate = new Date('2025-06-01T15:00:00Z');

      schedule.complete(ReviewResult.GOOD, completedDate);

      expect(schedule.status.value).toBe('completed');
      expect(schedule.result!.value).toBe('good');
      expect(schedule.completedDate).toEqual(completedDate);
    });

    it('should update the updatedAt timestamp on completion', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });
      const beforeUpdate = schedule.updatedAt;

      // Small delay to ensure timestamp difference
      schedule.complete(ReviewResult.PERFECT, new Date());

      expect(schedule.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
    });

    it('should throw InvalidOperationError when completing an already completed review', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      schedule.complete(ReviewResult.GOOD, new Date());

      expect(() => {
        schedule.complete(ReviewResult.PERFECT, new Date());
      }).toThrow(InvalidOperationError);
    });

    it('should throw InvalidOperationError when completing a skipped review', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      schedule.skip();

      expect(() => {
        schedule.complete(ReviewResult.GOOD, new Date());
      }).toThrow(InvalidOperationError);
    });
  });

  // --- skip ---

  describe('skip', () => {
    it('should transition a pending review to skipped', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      schedule.skip();

      expect(schedule.status.value).toBe('skipped');
    });

    it('should throw InvalidOperationError when skipping an already completed review', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      schedule.complete(ReviewResult.BAD, new Date());

      expect(() => {
        schedule.skip();
      }).toThrow(InvalidOperationError);
    });

    it('should throw InvalidOperationError when skipping an already skipped review', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      schedule.skip();

      expect(() => {
        schedule.skip();
      }).toThrow(InvalidOperationError);
    });
  });

  // --- updateUrgencyScore ---

  describe('updateUrgencyScore', () => {
    it('should update the urgency score', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      schedule.updateUrgencyScore(8.5);

      expect(schedule.urgencyScore).toBe(8.5);
    });
  });

  // --- fromPersistence ---

  describe('fromPersistence', () => {
    it('should reconstitute a review schedule from persistence data', () => {
      const completedDate = new Date('2025-06-01T15:00:00Z');
      const schedule = ReviewSchedule.fromPersistence({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        completedDate,
        status: ReviewStatus.COMPLETED,
        result: ReviewResult.GOOD,
        urgencyScore: 5.2,
        intervalDays: 7,
        reviewNumber: 3,
        createdAt: new Date('2025-05-25'),
        updatedAt: completedDate,
      });

      expect(schedule.id).toBe('rs-1');
      expect(schedule.status.value).toBe('completed');
      expect(schedule.result!.value).toBe('good');
      expect(schedule.completedDate).toEqual(completedDate);
      expect(schedule.reviewNumber).toBe(3);
    });
  });

  // --- toJSON ---

  describe('toJSON', () => {
    it('should serialize all fields with primitive values', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      const json = schedule.toJSON();

      expect(json.id).toBe('rs-1');
      expect(json.userId).toBe('user-1');
      expect(json.topicId).toBe('topic-1');
      expect(json.scheduledDate).toEqual(baseDate);
      expect(json.status).toBe('pending'); // string, not ReviewStatus
      expect(json.result).toBeNull();
      expect(json.completedDate).toBeNull();
      expect(json.urgencyScore).toBe(0);
      expect(json.intervalDays).toBe(1);
      expect(json.reviewNumber).toBe(1);
      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });

    it('should serialize status and result as raw strings after completion', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      schedule.complete(ReviewResult.PERFECT, new Date('2025-06-01T14:00:00Z'));

      const json = schedule.toJSON();
      expect(json.status).toBe('completed');
      expect(typeof json.status).toBe('string');
      expect(json.result).toBe('perfect');
      expect(typeof json.result).toBe('string');
    });

    it('should not include any Value Object wrappers in JSON output', () => {
      const schedule = ReviewSchedule.scheduleFirst({
        id: 'rs-1',
        userId: 'user-1',
        topicId: 'topic-1',
        scheduledDate: baseDate,
        intervalDays: 1,
      });

      const json = schedule.toJSON();
      const stringified = JSON.stringify(json);
      const parsed = JSON.parse(stringified);

      // status should be a string, not { _value: 'pending' }
      expect(parsed.status).toBe('pending');
      expect(typeof parsed.status).toBe('string');
    });
  });
});
