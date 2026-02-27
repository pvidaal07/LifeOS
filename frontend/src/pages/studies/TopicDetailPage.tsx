import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, BarChart3, History } from 'lucide-react';
import { studiesApi } from '../../api/studies.api';
import type { Topic } from '../../types';

export function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const res = await studiesApi.getTopic(topicId!);
      return res.data.data as Topic & {
        studySessions: any[];
        reviewSchedules: any[];
        subject: any;
      };
    },
    enabled: !!topicId,
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando tema...</div>;
  }

  if (!topic) {
    return <div>Tema no encontrado</div>;
  }

  const getMasteryColor = (level: number) => {
    if (level >= 8) return 'bg-green-500';
    if (level >= 5) return 'bg-yellow-500';
    if (level >= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/studies/${topic.subject?.studyPlan?.id || ''}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {topic.subject?.studyPlan?.name || 'Volver'}
        </Link>
        <h1 className="text-2xl font-bold">{topic.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: topic.subject?.color }}
          />
          <span className="text-sm text-muted-foreground">
            {topic.subject?.name}
          </span>
        </div>
      </div>

      {/* Dominio */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Dominio manual</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">{topic.masteryLevel}</p>
            <span className="text-muted-foreground">/10</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${getMasteryColor(topic.masteryLevel)}`}
              style={{ width: `${topic.masteryLevel * 10}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Dominio del sistema</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-bold">{topic.systemMasteryLevel.toFixed(1)}</p>
            <span className="text-muted-foreground">/10</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${getMasteryColor(topic.systemMasteryLevel)}`}
              style={{ width: `${topic.systemMasteryLevel * 10}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Estado</span>
          </div>
          <p className="text-lg font-semibold capitalize">
            {topic.status === 'not_started' ? 'Sin empezar' :
             topic.status === 'in_progress' ? 'En progreso' : 'Dominado'}
          </p>
        </div>
      </div>

      {/* Historial de sesiones */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de sesiones
        </h2>
        {(topic as any).studySessions?.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
            Aún no hay sesiones registradas para este tema
          </div>
        ) : (
          <div className="space-y-2">
            {(topic as any).studySessions?.map((session: any) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <span className="text-sm font-medium">
                    {session.sessionType === 'first_time' ? '📘 Primera vez' :
                     session.sessionType === 'review' ? '🔄 Repaso' : '✏️ Práctica'}
                  </span>
                  {session.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{session.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.studiedAt).toLocaleDateString('es-ES')}
                  </p>
                  {session.durationMinutes && (
                    <p className="text-xs text-muted-foreground">{session.durationMinutes} min</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Historial de repasos */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Historial de repasos</h2>
        {(topic as any).reviewSchedules?.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
            No hay repasos programados aún
          </div>
        ) : (
          <div className="space-y-2">
            {(topic as any).reviewSchedules?.map((review: any) => (
              <div
                key={review.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">Repaso #{review.reviewNumber}</span>
                  {review.result && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      review.result === 'perfect' ? 'bg-green-100 text-green-700' :
                      review.result === 'good' ? 'bg-blue-100 text-blue-700' :
                      review.result === 'regular' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {review.result === 'perfect' ? 'Perfecto' :
                       review.result === 'good' ? 'Bien' :
                       review.result === 'regular' ? 'Regular' : 'Mal'}
                    </span>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{new Date(review.scheduledDate).toLocaleDateString('es-ES')}</p>
                  <p className="capitalize">{review.status === 'pending' ? '⏳ Pendiente' : review.status === 'completed' ? '✅ Completado' : '⏭️ Saltado'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
