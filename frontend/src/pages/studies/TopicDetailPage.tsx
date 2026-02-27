import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, BarChart3, History, BookOpen, X, Pencil, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import type { Topic } from '../../types';

export function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionFormData, setSessionFormData] = useState<{
    sessionType?: string;
    durationMinutes?: number;
    qualityRating?: number;
    notes?: string;
  }>({});
  // Edit/delete state
  const [editingTopic, setEditingTopic] = useState<{ name: string; description: string } | null>(null);
  const [deletingTopic, setDeletingTopic] = useState(false);
  // Mastery adjustment state
  const [editingMastery, setEditingMastery] = useState<number | null>(null);

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

  const createSessionMutation = useMutation({
    mutationFn: (data: {
      topicId: string;
      sessionType?: string;
      durationMinutes?: number;
      qualityRating?: number;
      notes?: string;
    }) => studiesApi.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      setShowSessionForm(false);
      setSessionFormData({});
      toast.success('¡Sesión registrada!');
    },
    onError: () => {
      toast.error('Error al registrar la sesión');
    },
  });

  // ─── Topic update/delete/mastery ──────────────────────
  const updateTopicMutation = useMutation({
    mutationFn: (data: Partial<Topic>) =>
      studiesApi.updateTopic(topicId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      setEditingTopic(null);
      setEditingMastery(null);
      toast.success('Tema actualizado');
    },
    onError: () => toast.error('Error al actualizar el tema'),
  });

  const deleteTopicMutation = useMutation({
    mutationFn: () => studiesApi.deleteTopic(topicId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Tema eliminado');
      navigate(topic?.subject?.studyPlan?.id ? `/studies/${topic.subject.studyPlan.id}` : '/studies');
    },
    onError: () => toast.error('Error al eliminar el tema'),
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

        {editingTopic ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingTopic.name.trim()) return;
              updateTopicMutation.mutate({
                name: editingTopic.name,
                description: editingTopic.description || undefined,
              });
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={editingTopic.name}
              onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <input
              type="text"
              value={editingTopic.description}
              onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
              placeholder="Descripción (opcional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateTopicMutation.isPending}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditingTopic(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : deletingTopic ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-medium text-red-900">
              ¿Eliminar &quot;{topic.name}&quot;?
            </p>
            <p className="text-xs text-red-700">
              Se eliminarán todas sus sesiones y repasos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteTopicMutation.mutate()}
                disabled={deleteTopicMutation.isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTopicMutation.isPending ? 'Eliminando...' : 'Eliminar tema'}
              </button>
              <button
                onClick={() => setDeletingTopic(false)}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{topic.name}</h1>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingTopic({
                      name: topic.name,
                      description: topic.description || '',
                    })}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Editar tema"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingTopic(true)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Eliminar tema"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setSessionFormData({
                    sessionType: topic.status === 'not_started' ? 'first_time' : undefined,
                  });
                  setShowSessionForm(true);
                }}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <BookOpen className="h-4 w-4" />
                Estudiar
              </button>
            </div>
            {topic.description && (
              <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: topic.subject?.color }}
              />
              <span className="text-sm text-muted-foreground">
                {topic.subject?.name}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Dominio */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Dominio manual</span>
            </div>
            {editingMastery === null ? (
              <button
                onClick={() => setEditingMastery(topic.masteryLevel)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Ajustar dominio"
              >
                <Pencil className="h-3 w-3" />
              </button>
            ) : null}
          </div>
          {editingMastery !== null ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">{editingMastery}</p>
                <span className="text-muted-foreground">/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={editingMastery}
                onChange={(e) => setEditingMastery(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>10</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateTopicMutation.mutate({ masteryLevel: editingMastery })}
                  disabled={updateTopicMutation.isPending}
                  className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Check className="h-3 w-3" />
                  Guardar
                </button>
                <button
                  onClick={() => setEditingMastery(null)}
                  className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
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
      {/* Session form dialog */}
      {showSessionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Registrar sesión</h3>
              <button
                onClick={() => { setShowSessionForm(false); setSessionFormData({}); }}
                className="rounded-md p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Tema: <span className="font-medium text-foreground">{topic.name}</span>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSessionMutation.mutate({
                  topicId: topicId!,
                  sessionType: sessionFormData.sessionType,
                  durationMinutes: sessionFormData.durationMinutes,
                  qualityRating: sessionFormData.qualityRating,
                  notes: sessionFormData.notes,
                });
              }}
              className="space-y-4"
            >
              {/* Session type selector - only if not first_time */}
              {sessionFormData.sessionType !== 'first_time' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Tipo de sesión
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'review', label: 'Repaso' },
                      { value: 'practice', label: 'Práctica' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setSessionFormData({ ...sessionFormData, sessionType: value })
                        }
                        className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          sessionFormData.sessionType === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <label htmlFor="topic-session-duration" className="block text-sm font-medium mb-1.5">
                  Duración (minutos) <span className="text-muted-foreground font-normal">— opcional</span>
                </label>
                <input
                  id="topic-session-duration"
                  type="number"
                  min={1}
                  max={480}
                  placeholder="ej. 30"
                  value={sessionFormData.durationMinutes ?? ''}
                  onChange={(e) =>
                    setSessionFormData({
                      ...sessionFormData,
                      durationMinutes: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Quality rating */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Calidad percibida <span className="text-muted-foreground font-normal">— opcional</span>
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setSessionFormData({
                          ...sessionFormData,
                          qualityRating:
                            sessionFormData.qualityRating === rating ? undefined : rating,
                        })
                      }
                      className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                        sessionFormData.qualityRating === rating
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Mala</span>
                  <span>Excelente</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="topic-session-notes" className="block text-sm font-medium mb-1.5">
                  Notas <span className="text-muted-foreground font-normal">— opcional</span>
                </label>
                <textarea
                  id="topic-session-notes"
                  placeholder="¿Qué estudiaste? ¿Algún detalle importante?"
                  value={sessionFormData.notes ?? ''}
                  onChange={(e) =>
                    setSessionFormData({
                      ...sessionFormData,
                      notes: e.target.value || undefined,
                    })
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowSessionForm(false); setSessionFormData({}); }}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSessionMutation.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createSessionMutation.isPending ? 'Registrando...' : 'Registrar sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
