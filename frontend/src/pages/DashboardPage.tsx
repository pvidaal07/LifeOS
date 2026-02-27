import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { studiesApi } from '../api/studies.api';
import type { DashboardData } from '../types';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await studiesApi.getDashboard();
      return res.data.data as DashboardData;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold">Hoy</h1>
        <p className="text-muted-foreground">
          Tu resumen del día — {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* Stats rápidos */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Repasos pendientes"
          value={data?.reviews.count ?? 0}
          accent={data?.reviews.count ? 'text-orange-600' : undefined}
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Sesiones hoy"
          value={data?.today.sessionsCompleted ?? 0}
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Sesiones esta semana"
          value={data?.week.sessionsCompleted ?? 0}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Minutos esta semana"
          value={data?.week.totalMinutes ?? 0}
        />
      </div>

      {/* Repasos pendientes */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Repasos pendientes</h2>
        {data?.reviews.pending.length === 0 ? (
          <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
            🎉 ¡No tienes repasos pendientes! Buen trabajo.
          </div>
        ) : (
          <div className="space-y-2">
            {data?.reviews.pending.map((review) => (
              <div
                key={review.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: review.topic?.subject?.color || '#6366f1' }}
                  />
                  <div>
                    <p className="font-medium text-sm">{review.topic?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.topic?.subject?.name} · Repaso #{review.reviewNumber}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Urgencia: {review.urgencyScore.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actividad reciente */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Actividad reciente</h2>
        {data?.recentActivity.length === 0 ? (
          <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
            Aún no hay actividad. ¡Empieza a estudiar!
          </div>
        ) : (
          <div className="space-y-2">
            {data?.recentActivity.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: session.topic?.subject?.color || '#6366f1' }}
                  />
                  <div>
                    <p className="text-sm">{session.topic?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.sessionType === 'first_time' ? 'Primera vez' :
                       session.sessionType === 'review' ? 'Repaso' : 'Práctica'}
                      {session.durationMinutes && ` · ${session.durationMinutes} min`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(session.studiedAt).toLocaleDateString('es-ES')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent || ''}`}>{value}</p>
    </div>
  );
}
