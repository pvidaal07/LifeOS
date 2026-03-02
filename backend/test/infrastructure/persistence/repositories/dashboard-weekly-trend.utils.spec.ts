import { describe, expect, it } from 'vitest';
import {
  getWeeklyTrendUtcWindow,
  toUtcDayKey,
} from '../../../../src/infrastructure/persistence/repositories/dashboard-weekly-trend.utils';

describe('dashboard weekly trend UTC utilities', () => {
  it('normalizes day keys in UTC regardless of input offset', () => {
    const boundaryDate = new Date('2026-03-01T23:30:00-05:00');

    expect(toUtcDayKey(boundaryDate)).toBe('2026-03-02');
  });

  it('returns a closed-open seven-day UTC window', () => {
    const now = new Date('2026-03-02T15:45:00-03:00');

    const { startUtc, endExclusiveUtc } = getWeeklyTrendUtcWindow(now);

    expect(startUtc.toISOString()).toBe('2026-02-24T00:00:00.000Z');
    expect(endExclusiveUtc.toISOString()).toBe('2026-03-03T00:00:00.000Z');
    expect(endExclusiveUtc.getTime() - startUtc.getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
  });
});
