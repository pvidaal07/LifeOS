import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { SubjectProgressItem } from '../../types';

interface SubjectProgressWidgetProps {
  data: SubjectProgressItem[];
}

function ProgressBar({ item }: { item: SubjectProgressItem }) {
  const masteredPct = item.total > 0 ? (item.mastered / item.total) * 100 : 0;
  const inProgressPct = item.total > 0 ? (item.inProgress / item.total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.subjectColor }}
          />
          <span className="truncate text-sm font-medium">{item.subjectName}</span>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {item.mastered}/{item.total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        {/* Mastered portion */}
        <div className="flex h-full">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${masteredPct}%`,
              backgroundColor: item.subjectColor,
            }}
          />
          {/* In-progress portion (lighter) */}
          <div
            className="h-full transition-all duration-300 opacity-40"
            style={{
              width: `${inProgressPct}%`,
              backgroundColor: item.subjectColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function SubjectProgressWidget({ data }: SubjectProgressWidgetProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Progreso por asignatura</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted text-sm text-muted-foreground">
            Sin asignaturas con temas
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <ProgressBar key={item.subjectId} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
