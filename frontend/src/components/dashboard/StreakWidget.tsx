import { Card, CardContent } from '../ui/Card';
import type { StreakData } from '../../types';

interface StreakWidgetProps {
  streak: StreakData;
}

export function StreakWidget({ streak }: StreakWidgetProps) {
  const { currentStreak, studiedToday } = streak;
  const isActive = currentStreak > 0;

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          <span className={`text-lg ${isActive ? '' : 'grayscale opacity-50'}`} role="img" aria-label="racha">
            🔥
          </span>
          <span className="text-xs">Racha de estudio</span>
        </div>
        <p className="text-2xl font-bold text-text-primary">
          {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {studiedToday
            ? 'Has estudiado hoy'
            : currentStreak > 0
              ? 'Estudia hoy para mantener la racha'
              : 'Empieza a estudiar para iniciar tu racha'}
        </p>
      </CardContent>
    </Card>
  );
}
