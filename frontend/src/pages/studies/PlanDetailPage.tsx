import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowLeft, BookOpen, X, Pencil, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import type { StudyPlan, Topic } from '../../types';

interface SessionFormData {
  topicId: string;
  topicName: string;
  sessionType?: string;
  durationMinutes?: number;
  qualityRating?: number;
  notes?: string;
}

const MODAL_BACKDROP_CLASS = 'fixed inset-0 z-50 grid place-items-center bg-canvas/70 p-4 backdrop-blur-sm';
const MODAL_PANEL_CLASS = 'w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-float';

export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', color: '#6366f1' });
  const [showTopicForm, setShowTopicForm] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState('');
  const [sessionForm, setSessionForm] = useState<SessionFormData | null>(null);
  // Edit/delete state for plan
  const [editingPlan, setEditingPlan] = useState<{ name: string; description: string } | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);
  // Edit/delete state for subjects
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string; color: string } | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);
  // Edit/delete state for topics
  const [editingTopic, setEditingTopic] = useState<{ id: string; name: string } | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['study-plan', planId],
    queryFn: async () => {
      const res = await studiesApi.getPlan(planId!);
      return res.data.data as StudyPlan;
    },
    enabled: !!planId,
  });

  const createSubjectMutation = useMutation({
    mutationFn: (data: { studyPlanId: string; name: string; color?: string }) =>
      studiesApi.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan', planId] });
      setShowSubjectForm(false);
      setNewSubject({ name: '', color: '#6366f1' });
      toast.success('Asignatura creada');
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: (data: { subjectId: string; name: string }) =>
      studiesApi.createTopic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan', planId] });
      setShowTopicForm(null);
      setNewTopic('');
      toast.success('Tema creado');
    },
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
      queryClient.invalidateQueries({ queryKey: ['study-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-reviews'] });
      setSessionForm(null);
      toast.success('¡Sesión registrada!');
    },
    onError: () => {
      toast.error('Error al registrar la sesión');
    },
  });

  // ─── Plan update/delete ───────────────────────────────
  const updatePlanMutation = useMutation({
    mutationFn: (data: Partial<StudyPlan>) =>
      studiesApi.updatePlan(planId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      setEditingPlan(null);
      toast.success('Plan actualizado');
    },
    onError: () => toast.error('Error al actualizar el plan'),
  });

  const deletePlanMutation = useMutation({
    mutationFn: () => studiesApi.deletePlan(planId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      toast.success('Plan eliminado');
      navigate('/studies');
    },
    onError: () => toast.error('Error al eliminar el plan'),
  });

  // ─── Subject update/delete ────────────────────────────
  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      studiesApi.updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan', planId] });
      setEditingSubject(null);
      toast.success('Asignatura actualizada');
    },
    onError: () => toast.error('Error al actualizar la asignatura'),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => studiesApi.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan', planId] });
      setDeletingSubjectId(null);
      toast.success('Asignatura eliminada');
    },
    onError: () => toast.error('Error al eliminar la asignatura'),
  });

  // ─── Topic update/delete ──────────────────────────────
  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string } }) =>
      studiesApi.updateTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan', planId] });
      setEditingTopic(null);
      toast.success('Tema actualizado');
    },
    onError: () => toast.error('Error al actualizar el tema'),
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: string) => studiesApi.deleteTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeletingTopicId(null);
      toast.success('Tema eliminado');
    },
    onError: () => toast.error('Error al eliminar el tema'),
  });

  if (isLoading) {
    return (
      <div className="flex h-52 items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Plan no encontrado</CardContent>
      </Card>
    );
  }

  const getMasteryColor = (level: number) => {
    if (level >= 7) return 'text-state-success';
    if (level >= 5) return 'text-brand-secondary-700';
    if (level >= 3) return 'text-state-warning';
    return 'text-state-danger';
  };

  const getStatusLabel = (status: Topic['status']) => {
    switch (status) {
      case 'not_started': return 'Sin empezar';
      case 'in_progress': return 'En progreso';
      case 'mastered': return 'Dominado';
    }
  };

  const getStatusVariant = (status: Topic['status']) => {
    if (status === 'mastered') return 'success';
    if (status === 'in_progress') return 'secondary';
    return 'neutral';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/studies"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Planes de estudio
        </Link>

        {editingPlan ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingPlan.name.trim()) return;
              updatePlanMutation.mutate({
                name: editingPlan.name,
                description: editingPlan.description || undefined,
              });
            }}
            className="space-y-3"
          >
              <Input
                type="text"
                value={editingPlan.name}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                className="h-12 text-lg font-bold"
                autoFocus
              />
              <Input
                type="text"
                value={editingPlan.description}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                placeholder="Descripcion (opcional)"
                className="h-11"
              />
              <div className="flex gap-2">
              <Button
                type="submit"
                disabled={updatePlanMutation.isPending}
                size="sm"
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                Guardar
              </Button>
              <Button
                type="button"
                onClick={() => setEditingPlan(null)}
                variant="secondary"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : deletingPlan ? (
          <div className="space-y-3 rounded-xl border border-state-danger/25 bg-state-danger-soft p-4 text-state-danger-foreground">
            <p className="text-sm font-semibold">
              ¿Eliminar &quot;{plan.name}&quot;?
            </p>
            <p className="text-xs text-state-danger-foreground/85">
              Se eliminarán todas sus asignaturas, temas, sesiones y repasos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => deletePlanMutation.mutate()}
                disabled={deletePlanMutation.isPending}
                variant="destructive"
                size="sm"
              >
                {deletePlanMutation.isPending ? 'Eliminando...' : 'Eliminar plan'}
              </Button>
              <Button
                onClick={() => setDeletingPlan(false)}
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
                <h1 className="text-2xl font-bold">{plan.name}</h1>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setEditingPlan({
                      name: plan.name,
                      description: plan.description || '',
                    })}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground"
                    title="Editar plan"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setDeletingPlan(true)}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:bg-state-danger-soft hover:text-state-danger-foreground"
                    title="Eliminar plan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => setShowSubjectForm(!showSubjectForm)}
                className="h-11 gap-2"
              >
                <Plus className="h-4 w-4" />
                Nueva asignatura
              </Button>
            </div>
            {plan.description && (
              <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
            )}
          </>
        )}
      </div>

      {/* Form nueva asignatura */}
      {showSubjectForm && (
        <Card>
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSubjectMutation.mutate({
                  studyPlanId: planId!,
                  name: newSubject.name,
                  color: newSubject.color,
                });
              }}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="min-w-[220px] flex-1">
                <Input
                  type="text"
                  placeholder="Nombre de la asignatura"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="h-11"
                  autoFocus
                />
              </div>
              <input
                type="color"
                value={newSubject.color}
                onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                className="h-11 w-11 cursor-pointer rounded-lg border border-input bg-surface"
              />
              <Button type="submit" className="h-11">Crear</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Asignaturas y temas */}
      {plan.subjects?.length === 0 ? (
        <Card>
          <CardContent className="rounded-xl border border-dashed border-border bg-surface-muted p-8 text-center text-muted-foreground">
            Añade tu primera asignatura para empezar
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {plan.subjects?.map((subject) => (
            <Card key={subject.id} className="overflow-hidden border-border/90">
              {/* Header asignatura */}
              {editingSubject?.id === subject.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editingSubject.name.trim()) return;
                    updateSubjectMutation.mutate({
                      id: subject.id,
                      data: { name: editingSubject.name, color: editingSubject.color },
                    });
                  }}
                  className="flex items-center gap-3 border-b border-border bg-surface-muted p-4"
                >
                  <input
                    type="color"
                    value={editingSubject.color}
                    onChange={(e) => setEditingSubject({ ...editingSubject, color: e.target.value })}
                    className="h-8 w-8 rounded border border-input cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    className="h-10 flex-1 font-semibold"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    disabled={updateSubjectMutation.isPending}
                    size="icon"
                    className="h-9 w-9"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEditingSubject(null)}
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : deletingSubjectId === subject.id ? (
                <div className="space-y-2 border-b border-state-danger/25 bg-state-danger-soft p-4 text-state-danger-foreground">
                  <p className="text-sm font-semibold">
                    ¿Eliminar &quot;{subject.name}&quot;?
                  </p>
                  <p className="text-xs text-state-danger-foreground/85">
                    Se eliminarán todos sus temas. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => deleteSubjectMutation.mutate(subject.id)}
                      disabled={deleteSubjectMutation.isPending}
                      variant="destructive"
                      size="sm"
                    >
                      {deleteSubjectMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                    <Button
                      onClick={() => setDeletingSubjectId(null)}
                      variant="secondary"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group/subject flex items-center gap-3 border-b border-border p-4">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <h2 className="font-semibold">{subject.name}</h2>
                  <Badge variant="neutral" className="text-[11px]">
                    {subject.topics?.length || 0} temas
                  </Badge>
                  <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/subject:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingSubject({
                        id: subject.id,
                        name: subject.name,
                        color: subject.color,
                      })}
                      className="rounded-md p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                      title="Editar asignatura"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSubjectId(subject.id)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-state-danger-soft hover:text-state-danger-foreground"
                      title="Eliminar asignatura"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de temas */}
              <div className="divide-y divide-border">
                {subject.topics?.map((topic) => (
                  <div
                    key={topic.id}
                    className="group/topic flex items-center justify-between p-3 px-4 transition-colors hover:bg-surface-muted/80"
                  >
                    {editingTopic?.id === topic.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!editingTopic.name.trim()) return;
                          updateTopicMutation.mutate({
                            id: topic.id,
                            data: { name: editingTopic.name },
                          });
                        }}
                        className="flex items-center gap-2 flex-1"
                      >
                        <Input
                          type="text"
                          value={editingTopic.name}
                          onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                          className="h-9 flex-1"
                          autoFocus
                        />
                        <Button
                          type="submit"
                          disabled={updateTopicMutation.isPending}
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setEditingTopic(null)}
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    ) : deletingTopicId === topic.id ? (
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-state-danger-foreground">
                          ¿Eliminar &quot;{topic.name}&quot;?
                        </span>
                        <Button
                          onClick={() => deleteTopicMutation.mutate(topic.id)}
                          disabled={deleteTopicMutation.isPending}
                          variant="destructive"
                          size="sm"
                        >
                          {deleteTopicMutation.isPending ? '...' : 'Eliminar'}
                        </Button>
                        <Button
                          onClick={() => setDeletingTopicId(null)}
                          variant="secondary"
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/studies/topics/${topic.id}`}
                            className="text-sm font-medium hover:text-primary transition-colors"
                          >
                            {topic.name}
                          </Link>
                          <Badge variant={getStatusVariant(topic.status)} className="text-[11px]">
                            {getStatusLabel(topic.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${getMasteryColor(topic.masteryLevel)}`}>
                            Dominio: {topic.masteryLevel}/10
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingTopic({ id: topic.id, name: topic.name })}
                              className="rounded-md p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                              title="Editar tema"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setDeletingTopicId(topic.id)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-state-danger-soft hover:text-state-danger-foreground"
                              title="Eliminar tema"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <Button
                            onClick={() =>
                              setSessionForm({
                                topicId: topic.id,
                                topicName: topic.name,
                                sessionType: topic.status === 'not_started' ? 'first_time' : undefined,
                              })
                            }
                            disabled={createSessionMutation.isPending}
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1 border-brand-primary-100 bg-brand-primary-100 text-brand-primary-700 hover:bg-brand-primary-100/80"
                          >
                            <BookOpen className="h-3 w-3" />
                            Estudiar
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Añadir tema */}
              <div className="border-t border-border p-3 px-4">
                {showTopicForm === subject.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newTopic.trim()) {
                        createTopicMutation.mutate({
                          subjectId: subject.id,
                          name: newTopic,
                        });
                      }
                    }}
                    className="flex flex-wrap gap-2"
                  >
                    <Input
                      type="text"
                      placeholder="Nombre del tema"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="h-9 flex-1 min-w-[180px]"
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-9">
                      Añadir
                    </Button>
                    <Button
                      type="button"
                      onClick={() => { setShowTopicForm(null); setNewTopic(''); }}
                      variant="secondary"
                      size="sm"
                      className="h-9"
                    >
                      Cancelar
                    </Button>
                  </form>
                ) : (
                  <Button
                    onClick={() => setShowTopicForm(subject.id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    Añadir tema
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Session form dialog */}
      {sessionForm && (
        <div className={MODAL_BACKDROP_CLASS}>
          <div className={MODAL_PANEL_CLASS}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Registrar sesión</h3>
              <Button
                onClick={() => setSessionForm(null)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Tema: <span className="font-medium text-foreground">{sessionForm.topicName}</span>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSessionMutation.mutate({
                  topicId: sessionForm.topicId,
                  sessionType: sessionForm.sessionType,
                  durationMinutes: sessionForm.durationMinutes,
                  qualityRating: sessionForm.qualityRating,
                  notes: sessionForm.notes,
                });
              }}
              className="space-y-4"
            >
              {/* Session type - only if not first_time (first_time is auto-detected) */}
              {sessionForm.sessionType !== 'first_time' && (
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
                          setSessionForm({ ...sessionForm, sessionType: value })
                        }
                        variant="secondary"
                        className={`h-11 flex-1 border text-sm font-medium transition-colors ${
                          sessionForm.sessionType === value
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
                <label htmlFor="session-duration" className="block text-sm font-medium mb-1.5">
                  Duración (minutos) <span className="text-muted-foreground font-normal">— opcional</span>
                </label>
                <Input
                  id="session-duration"
                  type="number"
                  min={1}
                  max={480}
                  placeholder="ej. 30"
                  value={sessionForm.durationMinutes ?? ''}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
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
                        setSessionForm({
                          ...sessionForm,
                          qualityRating:
                            sessionForm.qualityRating === rating ? undefined : rating,
                        })
                      }
                      variant="secondary"
                      className={`h-11 flex-1 border text-sm font-medium transition-colors ${
                        sessionForm.qualityRating === rating
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
                <label htmlFor="session-notes" className="block text-sm font-medium mb-1.5">
                  Notas <span className="text-muted-foreground font-normal">— opcional</span>
                </label>
                <textarea
                  id="session-notes"
                  placeholder="¿Qué estudiaste? ¿Algún detalle importante?"
                  value={sessionForm.notes ?? ''}
                  onChange={(e) =>
                    setSessionForm({
                      ...sessionForm,
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
                  onClick={() => setSessionForm(null)}
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
