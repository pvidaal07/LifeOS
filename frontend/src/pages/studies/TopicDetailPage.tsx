import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, BarChart3, History, BookOpen, X, Pencil, Trash2, Check, CalendarClock, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import type { Topic } from '../../types';

const MODAL_BACKDROP_CLASS = 'fixed inset-0 z-50 grid place-items-center bg-canvas/70 p-4 backdrop-blur-sm';
const MODAL_PANEL_CLASS = 'w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-float';

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
      queryClient.invalidateQueries({ queryKey: ['upcoming-reviews'] });
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
    return (
      <div className="flex h-52 items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando tema...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Tema no encontrado</CardContent>
      </Card>
    );
  }

  const getMasteryColor = (level: number) => {
    if (level >= 7) return 'bg-state-success';
    if (level >= 5) return 'bg-brand-secondary-500';
    if (level >= 3) return 'bg-state-warning';
    return 'bg-state-danger';
  };

  const getStatusBadgeVariant = (status: Topic['status']) => {
    if (status === 'mastered') return 'success';
    if (status === 'in_progress') return 'secondary';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/studies/${topic.subject?.studyPlan?.id || ''}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
            <Input
              type="text"
              value={editingTopic.name}
              onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
              className="h-12 text-lg font-bold"
              autoFocus
            />
            <Input
              type="text"
              value={editingTopic.description}
              onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
              placeholder="Descripcion (opcional)"
              className="h-11"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={updateTopicMutation.isPending}
                size="sm"
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                Guardar
              </Button>
              <Button
                type="button"
                onClick={() => setEditingTopic(null)}
                variant="secondary"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : deletingTopic ? (
          <div className="space-y-3 rounded-xl border border-state-danger/25 bg-state-danger-soft p-4 text-state-danger-foreground">
            <p className="text-sm font-semibold">
              ¿Eliminar &quot;{topic.name}&quot;?
            </p>
            <p className="text-xs text-state-danger-foreground/85">
              Se eliminarán todas sus sesiones y repasos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => deleteTopicMutation.mutate()}
                disabled={deleteTopicMutation.isPending}
                variant="destructive"
                size="sm"
              >
                {deleteTopicMutation.isPending ? 'Eliminando...' : 'Eliminar tema'}
              </Button>
              <Button
                onClick={() => setDeletingTopic(false)}
                variant="secondary"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{topic.name}</h1>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setEditingTopic({
                      name: topic.name,
                      description: topic.description || '',
                    })}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground"
                    title="Editar tema"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setDeletingTopic(true)}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:bg-state-danger-soft hover:text-state-danger-foreground"
                    title="Eliminar tema"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSessionFormData({
                    sessionType: topic.status === 'not_started' ? 'first_time' : undefined,
                  });
                  setShowSessionForm(true);
                }}
                className="h-11 gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Estudiar
              </Button>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Dominio manual</span>
            </div>
            {editingMastery === null ? (
              <Button
                onClick={() => setEditingMastery(topic.masteryLevel)}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                title="Ajustar dominio"
              >
                <Pencil className="h-3 w-3" />
              </Button>
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
                <Button
                  onClick={() => updateTopicMutation.mutate({ masteryLevel: editingMastery })}
                  disabled={updateTopicMutation.isPending}
                  size="sm"
                  className="h-8 gap-1"
                >
                  <Check className="h-3 w-3" />
                  Guardar
                </Button>
                <Button
                  onClick={() => setEditingMastery(null)}
                  variant="secondary"
                  size="sm"
                  className="h-8"
                >
                  Cancelar
                </Button>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
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
          {topic.systemMasteryLevel === 0 && topic.status !== 'not_started' && (
            <p className="text-xs text-muted-foreground mt-2">
              Completa repasos desde la página de Repasos para subir tu dominio
            </p>
          )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Estado</span>
          </div>
          <Badge variant={getStatusBadgeVariant(topic.status)} className="w-fit px-3 py-1 text-sm font-semibold">
            {topic.status === 'not_started' ? 'Sin empezar' :
              topic.status === 'in_progress' ? 'En progreso' : 'Dominado'}
          </Badge>
          {topic.status === 'in_progress' && topic.systemMasteryLevel > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Dominio ≥ 7 para marcar como dominado
            </p>
          )}
          </CardContent>
        </Card>

        {/* Next review card */}
        {(() => {
          const pendingReviews = ((topic as any).reviewSchedules ?? [])
            .filter((r: any) => r.status === 'pending')
            .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
          const nextReview = pendingReviews[0];
          const now = new Date();

          if (nextReview) {
            const reviewDate = new Date(nextReview.scheduledDate);
            const isToday = reviewDate.toDateString() === now.toDateString();
            const isPast = reviewDate <= now;

            return (
              <Card className={isPast ? 'border-state-warning/35 bg-state-warning-soft' : ''}>
                <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CalendarClock className="h-4 w-4" />
                  <span className="text-xs">Próximo repaso</span>
                </div>
                <p className={`text-lg font-semibold ${isPast ? 'text-state-warning-foreground' : ''}`}>
                  {isToday ? 'Hoy' :
                   isPast ? 'Atrasado' :
                   reviewDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Repaso #{nextReview.reviewNumber} · {nextReview.intervalDays}d intervalo
                </p>
                {isPast && (
                  <Link
                    to="/reviews"
                    className="mt-2 inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-brand-primary-700"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Ir a repasos
                  </Link>
                )}
                </CardContent>
              </Card>
            );
          }

          if (topic.status === 'not_started') {
            return (
              <Card>
                <CardContent className="rounded-xl border border-dashed border-border bg-surface-muted p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CalendarClock className="h-4 w-4" />
                  <span className="text-xs">Próximo repaso</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Registra tu primera sesión para activar los repasos automáticos
                </p>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card>
              <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CalendarClock className="h-4 w-4" />
                <span className="text-xs">Próximo repaso</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sin repasos pendientes
              </p>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Historial de sesiones */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de sesiones
        </h2>
        {(topic as any).studySessions?.length === 0 ? (
          <Card>
            <CardContent className="rounded-xl border border-dashed border-border bg-surface-muted p-6 text-center text-muted-foreground">
              Aún no hay sesiones registradas para este tema
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {(topic as any).studySessions?.map((session: any) => (
              <Card key={session.id}>
                <CardContent className="flex items-center justify-between p-3">
                <div>
                  <span className="text-sm font-medium text-text-primary">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Historial de repasos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Historial de repasos</h2>
          {((topic as any).reviewSchedules ?? []).some((r: any) => r.status === 'pending') && (
            <Link
              to="/reviews"
              className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-brand-primary-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Ir a repasos
            </Link>
          )}
        </div>
        {(topic as any).reviewSchedules?.length === 0 ? (
          <Card>
            <CardContent className="rounded-xl border border-dashed border-border bg-surface-muted p-6 text-center text-muted-foreground">
              {topic.status === 'not_started'
                ? 'Estudia este tema para activar el sistema de repasos automáticos'
                : 'No hay repasos programados aún'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {(topic as any).reviewSchedules?.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm">Repaso #{review.reviewNumber}</span>
                  {review.result && (
                    <Badge
                      variant={
                        review.result === 'perfect'
                          ? 'success'
                          : review.result === 'good'
                            ? 'secondary'
                            : review.result === 'regular'
                              ? 'warning'
                              : 'danger'
                      }
                    >
                      {review.result === 'perfect' ? 'Perfecto' :
                       review.result === 'good' ? 'Bien' :
                       review.result === 'regular' ? 'Regular' : 'Mal'}
                    </Badge>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{new Date(review.scheduledDate).toLocaleDateString('es-ES')}</p>
                  <p className="capitalize">{review.status === 'pending' ? '⏳ Pendiente' : review.status === 'completed' ? '✅ Completado' : '⏭️ Saltado'}</p>
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      {/* Session form dialog */}
      {showSessionForm && (
        <div className={MODAL_BACKDROP_CLASS}>
          <div className={MODAL_PANEL_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Registrar sesión</h3>
              <Button
                onClick={() => { setShowSessionForm(false); setSessionFormData({}); }}
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
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
                      <Button
                        key={value}
                        type="button"
                        onClick={() =>
                          setSessionFormData({ ...sessionFormData, sessionType: value })
                        }
                        variant="secondary"
                        className={`h-11 flex-1 border text-sm font-medium transition-colors ${
                          sessionFormData.sessionType === value
                            ? 'border-brand-primary-500/40 bg-brand-primary-100 text-brand-primary-700'
                            : 'border-border'
                        }`}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <label htmlFor="topic-session-duration" className="block text-sm font-medium mb-1.5">
                  Duración (minutos) <span className="text-muted-foreground font-normal">— opcional</span>
                </label>
                <Input
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
                  className="h-11"
                />
              </div>

              {/* Quality rating */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Calidad percibida <span className="text-muted-foreground font-normal">— opcional</span>
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setSessionFormData({
                          ...sessionFormData,
                          qualityRating:
                            sessionFormData.qualityRating === rating ? undefined : rating,
                        })
                      }
                      variant="secondary"
                      className={`h-11 flex-1 border text-sm font-medium transition-colors ${
                        sessionFormData.qualityRating === rating
                          ? 'border-brand-primary-500/40 bg-brand-primary-100 text-brand-primary-700'
                          : 'border-border'
                      }`}
                    >
                      {rating}
                    </Button>
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
                  className="w-full resize-none rounded-lg border border-input bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-muted-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => { setShowSessionForm(false); setSessionFormData({}); }}
                  variant="secondary"
                  className="h-11"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createSessionMutation.isPending}
                  className="h-11"
                >
                  {createSessionMutation.isPending ? 'Registrando...' : 'Registrar sesión'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
