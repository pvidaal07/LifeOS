import { useAuthStore } from '../../stores/auth.store';
import { getTimeOfDayGreeting, getFirstName, buildSummaryLine } from './greeting-helpers';

interface GreetingWidgetProps {
  pendingReviewCount: number;
  sessionsToday: number;
}

export function GreetingWidget({ pendingReviewCount, sessionsToday }: GreetingWidgetProps) {
  const userName = useAuthStore((state) => state.user?.name);
  const greeting = getTimeOfDayGreeting();
  const firstName = getFirstName(userName);

  const dateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {greeting}
        {firstName ? `, ${firstName}` : ''}
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        {buildSummaryLine(pendingReviewCount, sessionsToday)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{dateStr}</p>
    </div>
  );
}
