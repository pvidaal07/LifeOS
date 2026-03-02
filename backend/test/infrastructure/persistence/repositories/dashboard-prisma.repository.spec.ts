import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPrismaRepository } from '../../../../src/infrastructure/persistence/repositories/dashboard-prisma.repository';

function createPrismaMock() {
  return {
    reviewSchedule: { findMany: vi.fn() },
    studySession: { count: vi.fn(), aggregate: vi.fn(), findMany: vi.fn() },
    topic: { groupBy: vi.fn() },
    subject: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  };
}

describe('DashboardPrismaRepository weekly trend', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-02T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps weekly trend aligned with non-zero weekly total', async () => {
    const prismaMock = createPrismaMock();
    const repository = new DashboardPrismaRepository(prismaMock as never);

    prismaMock.reviewSchedule.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prismaMock.studySession.count.mockResolvedValue(0);
    prismaMock.studySession.aggregate.mockResolvedValue({
      _count: 3,
      _sum: { durationMinutes: 90 },
    });
    prismaMock.studySession.findMany.mockResolvedValue([]);
    prismaMock.topic.groupBy.mockResolvedValue([]);
    prismaMock.$queryRaw
      .mockResolvedValueOnce([
        {
          day_key: '2026-02-24',
          total_minutes: BigInt(30),
          session_count: BigInt(1),
        },
        {
          day_key: '2026-03-01',
          total_minutes: BigInt(45),
          session_count: BigInt(1),
        },
        {
          day_key: '2026-03-02',
          total_minutes: BigInt(15),
          session_count: BigInt(1),
        },
      ])
      .mockResolvedValueOnce([]);
    prismaMock.subject.findMany.mockResolvedValue([]);

    const result = await repository.getDashboardData('user-123');

    expect(result.weekStats.totalMinutes).toBeGreaterThan(0);
    expect(result.weeklyTrend).toHaveLength(7);
    expect(result.weeklyTrend[0].date).toBe('2026-02-24');
    expect(result.weeklyTrend[6].date).toBe('2026-03-02');

    const trendTotal = result.weeklyTrend.reduce(
      (sum, item) => sum + item.totalMinutes,
      0,
    );

    expect(result.weeklyTrend.some((item) => item.totalMinutes > 0)).toBe(true);
    expect(trendTotal).toBe(result.weekStats.totalMinutes);
  });

  it('queries weekly trend with UTC day-key and closed-open bounds', async () => {
    const prismaMock = createPrismaMock();
    const repository = new DashboardPrismaRepository(prismaMock as never);

    prismaMock.reviewSchedule.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prismaMock.studySession.count.mockResolvedValue(0);
    prismaMock.studySession.aggregate.mockResolvedValue({
      _count: 0,
      _sum: { durationMinutes: 0 },
    });
    prismaMock.studySession.findMany.mockResolvedValue([]);
    prismaMock.topic.groupBy.mockResolvedValue([]);
    prismaMock.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prismaMock.subject.findMany.mockResolvedValue([]);

    await repository.getDashboardData('user-456');

    const queryCall = prismaMock.$queryRaw.mock.calls[0];
    const sqlChunks = queryCall[0] as string[];
    const sql = sqlChunks.join(' ');
    const startUtc = queryCall[2] as Date;
    const endExclusiveUtc = queryCall[3] as Date;

    expect(sql).toContain("to_char(studied_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')");
    expect(sql).toContain('studied_at >=');
    expect(sql).toContain('studied_at <');
    expect(startUtc.toISOString()).toBe('2026-02-24T00:00:00.000Z');
    expect(endExclusiveUtc.toISOString()).toBe('2026-03-03T00:00:00.000Z');
    expect(endExclusiveUtc.getTime() - startUtc.getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
  });
});
