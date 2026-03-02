const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function toUtcDayKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getWeeklyTrendUtcWindow(now: Date): {
  startUtc: Date;
  endExclusiveUtc: Date;
} {
  const todayStartUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  return {
    startUtc: new Date(todayStartUtc.getTime() - ONE_DAY_MS * 6),
    endExclusiveUtc: new Date(todayStartUtc.getTime() + ONE_DAY_MS),
  };
}
