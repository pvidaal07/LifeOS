/**
 * Pure helper functions for the GreetingWidget.
 * Extracted to a separate file so they can be individually tested
 * and to avoid react-refresh warnings.
 */

export function getTimeOfDayGreeting(hour?: number): string {
  const h = hour ?? new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export function getFirstName(fullName: string | undefined | null): string | null {
  if (!fullName) return null;
  const trimmed = fullName.trim();
  if (!trimmed) return null;
  return trimmed.split(' ')[0];
}

export function buildSummaryLine(pendingReviewCount: number, sessionsToday: number): string {
  const reviewPart =
    pendingReviewCount === 0
      ? 'No tienes repasos pendientes'
      : pendingReviewCount === 1
        ? 'Tienes 1 repaso pendiente'
        : `Tienes ${pendingReviewCount} repasos pendientes`;

  const sessionPart =
    sessionsToday === 0
      ? 'Sin sesiones hoy'
      : sessionsToday === 1
        ? '1 sesión completada hoy'
        : `${sessionsToday} sesiones completadas hoy`;

  return `${reviewPart} \u00b7 ${sessionPart}`;
}
