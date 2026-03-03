import { describe, expect, it, vi } from 'vitest';
import { SessionPrismaRepository } from '../../../../src/infrastructure/persistence/repositories/session-prisma.repository';
import {
  ReviewResult,
  ReviewSchedule,
  ReviewStatus,
} from '../../../../src/domain/review';

function buildReview(reviewNumber: number): ReviewSchedule {
  const now = new Date('2026-03-03T00:00:00.000Z');

  return ReviewSchedule.fromPersistence({
    id: `review-${reviewNumber}`,
    userId: 'user-1',
    topicId: 'topic-1',
    scheduledDate: now,
    completedDate: now,
    status: ReviewStatus.COMPLETED,
    result: ReviewResult.create('good'),
    urgencyScore: 0,
    intervalDays: 7,
    reviewNumber,
    createdAt: now,
    updatedAt: now,
  });
}

describe('SessionPrismaRepository edit + recompute transaction', () => {
  it('returns false when session ownership check fails', async () => {
    const tx = {
      studySession: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      reviewSchedule: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    };

    const prisma = {
      studySession: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<boolean>) => callback(tx)),
    };

    const repository = new SessionPrismaRepository(prisma as never);
    const result = await repository.editSessionAndReplaceTopicSuffix({
      userId: 'user-1',
      sessionId: 'session-1',
      topicId: 'topic-1',
      anchorReviewNumber: 1,
      session: {
        studiedAt: new Date('2026-01-01T00:00:00.000Z'),
        durationMinutes: 45,
        qualityRating: 4,
      },
      reviews: [buildReview(1)],
    });

    expect(result).toBe(false);
    expect(tx.studySession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 'user-1', topicId: 'topic-1' },
      data: {
        studiedAt: new Date('2026-01-01T00:00:00.000Z'),
        durationMinutes: 45,
        qualityRating: 4,
      },
    });
    expect(tx.reviewSchedule.deleteMany).not.toHaveBeenCalled();
    expect(tx.reviewSchedule.createMany).not.toHaveBeenCalled();
  });

  it('updates session and suffix in one transaction', async () => {
    const tx = {
      studySession: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      reviewSchedule: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };

    const prisma = {
      studySession: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        count: vi.fn(),
        aggregate: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<boolean>) => callback(tx)),
    };

    const repository = new SessionPrismaRepository(prisma as never);
    const reviews = [buildReview(1), buildReview(2)];

    const result = await repository.editSessionAndReplaceTopicSuffix({
      userId: 'user-1',
      sessionId: 'session-1',
      topicId: 'topic-1',
      anchorReviewNumber: 1,
      session: {
        studiedAt: new Date('2026-01-01T00:00:00.000Z'),
        durationMinutes: 60,
        qualityRating: 5,
      },
      reviews,
    });

    expect(result).toBe(true);
    expect(tx.reviewSchedule.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        topicId: 'topic-1',
        reviewNumber: { gte: 1 },
      },
    });
    expect(tx.reviewSchedule.createMany).toHaveBeenCalledTimes(1);
    expect(tx.reviewSchedule.createMany.mock.calls[0][0].data).toHaveLength(2);
  });
});
