import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { ReviewSchedule } from '../../types';

interface UpcomingReviewsWidgetProps {
  reviews: ReviewSchedule[];
}

const SUBJECT_COLOR_FALLBACK = 'hsl(var(--color-primary-500))';

function formatGroupLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

function groupReviewsByDate(reviews: ReviewSchedule[]): Map<string, ReviewSchedule[]> {
  const groups = new Map<string, ReviewSchedule[]>();

  for (const review of reviews) {
    const dateKey = typeof review.scheduledDate === 'string'
      ? review.scheduledDate.split('T')[0]
      : new Date(review.scheduledDate).toISOString().split('T')[0];

    const existing = groups.get(dateKey) ?? [];
    existing.push(review);
    groups.set(dateKey, existing);
  }

  return groups;
}

export function UpcomingReviewsWidget({ reviews }: UpcomingReviewsWidgetProps) {
  const grouped = groupReviewsByDate(reviews);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Repasos programados</CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted text-sm text-muted-foreground">
            Sin repasos programados esta semana
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([dateKey, dayReviews]) => (
              <div key={dateKey}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                  {formatGroupLabel(dateKey)}
                </p>
                <div className="space-y-1.5">
                  {dayReviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-surface-muted"
                    >
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: review.topic?.subject?.color ?? SUBJECT_COLOR_FALLBACK,
                        }}
                      />
                      <span className="truncate">{review.topic?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
