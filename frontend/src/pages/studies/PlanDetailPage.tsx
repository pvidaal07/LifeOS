import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowLeft, BookOpen, X, Pencil, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import type { StudyPlan, Topic } from '../../types';

interface SessionFormData {
  topicId: string;
  topicName: string;
  sessionType?: string;
  durationMinutes?: number;
  qualityRating?: number;
  notes?: string;
}

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
    return <div className="text-muted-foreground">Cargando plan...</div>;
  }

  if (!plan) {
    return <div>Plan no encontrado</div>;
  }

  const getMasteryColor = (level: number) => {
    if (level >= 7) return 'text-green-600';
    if (level >= 5) return 'text-yellow-600';
    if (level >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusLabel = (status: Topic['status']) => {
    switch (status) {
      case 'not_started': return 'Sin empezar';
      case 'in_progress': return 'En progreso';
      case 'mastered': return 'Dominado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/studies"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
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
            <input
              type="text"
              value={editingPlan.name}
              onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
            <input
              type="text"
              value={editingPlan.description}
              onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
              placeholder="Descripción (opcional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updatePlanMutation.isPending}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : deletingPlan ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-medium text-red-900">
              ¿Eliminar &quot;{plan.name}&quot;?
            </p>
            <p className="text-xs text-red-700">
              Se eliminarán todas sus asignaturas, temas, sesiones y repasos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => deletePlanMutation.mutate()}
                disabled={deletePlanMutation.isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletePlanMutation.isPending ? 'Eliminando...' : 'Eliminar plan'}
              </button>
              <button
                onClick={() => setDeletingPlan(false)}
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
                <h1 className="text-2xl font-bold">{plan.name}</h1>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingPlan({
                      name: plan.name,
                      description: plan.description || '',
                    })}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Editar plan"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingPlan(true)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Eliminar plan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowSubjectForm(!showSubjectForm)}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Nueva asignatura
              </button>
            </div>
            {plan.description && (
              <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
            )}
          </>
        )}
      </div>

      {/* Form nueva asignatura */}
      {showSubjectForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSubjectMutation.mutate({
              studyPlanId: planId!,
              name: newSubject.name,
              color: newSubject.color,
            });
          }}
          className="rounded-lg border border-border p-4 flex gap-3 items-end"
        >
          <div className="flex-1">
            <input
              type="text"
              placeholder="Nombre de la asignatura"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>
          <input
            type="color"
            value={newSubject.color}
            onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
            className="h-9 w-9 rounded border border-input cursor-pointer"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Crear
          </button>
        </form>
      )}

      {/* Asignaturas y temas */}
      {plan.subjects?.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Añade tu primera asignatura para empezar
        </div>
      ) : (
        <div className="space-y-6">
          {plan.subjects?.map((subject) => (
            <div key={subject.id} className="rounded-lg border border-border">
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
                  className="flex items-center gap-3 border-b border-border p-4"
                >
                  <input
                    type="color"
                    value={editingSubject.color}
                    onChange={(e) => setEditingSubject({ ...editingSubject, color: e.target.value })}
                    className="h-8 w-8 rounded border border-input cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={updateSubjectMutation.isPending}
                    className="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSubject(null)}
                    className="rounded-md border border-border p-1.5 hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </form>
              ) : deletingSubjectId === subject.id ? (
                <div className="border-b border-border p-4 space-y-2">
                  <p className="text-sm font-medium">
                    ¿Eliminar &quot;{subject.name}&quot;?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se eliminarán todos sus temas. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteSubjectMutation.mutate(subject.id)}
                      disabled={deleteSubjectMutation.isPending}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleteSubjectMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </button>
                    <button
                      onClick={() => setDeletingSubjectId(null)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group/subject flex items-center gap-3 border-b border-border p-4">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <h2 className="font-semibold">{subject.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    {subject.topics?.length || 0} temas
                  </span>
                  <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/subject:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingSubject({
                        id: subject.id,
                        name: subject.name,
                        color: subject.color,
                      })}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                      title="Editar asignatura"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSubjectId(subject.id)}
                      className="rounded-md p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50"
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
                    className="group/topic flex items-center justify-between p-3 px-4 hover:bg-accent/30 transition-colors"
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
                        <input
                          type="text"
                          value={editingTopic.name}
                          onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                          className="flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={updateTopicMutation.isPending}
                          className="rounded-md bg-primary p-1 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTopic(null)}
                          className="rounded-md border border-border p-1 hover:bg-accent"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    ) : deletingTopicId === topic.id ? (
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-muted-foreground">
                          ¿Eliminar &quot;{topic.name}&quot;?
                        </span>
                        <button
                          onClick={() => deleteTopicMutation.mutate(topic.id)}
                          disabled={deleteTopicMutation.isPending}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleteTopicMutation.isPending ? '...' : 'Eliminar'}
                        </button>
                        <button
                          onClick={() => setDeletingTopicId(null)}
                          className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                        >
                          Cancelar
                        </button>
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
                          <span className="text-xs text-muted-foreground">
                            {getStatusLabel(topic.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${getMasteryColor(topic.masteryLevel)}`}>
                            Dominio: {topic.masteryLevel}/10
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingTopic({ id: topic.id, name: topic.name })}
                              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                              title="Editar tema"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setDeletingTopicId(topic.id)}
                              className="rounded-md p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                              title="Eliminar tema"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() =>
                              setSessionForm({
                                topicId: topic.id,
                                topicName: topic.name,
                                sessionType: topic.status === 'not_started' ? 'first_time' : undefined,
                              })
                            }
                            disabled={createSessionMutation.isPending}
                            className="flex items-center gap-1 text-xs rounded bg-primary/10 text-primary px-2 py-1 hover:bg-primary/20 transition-colors disabled:opacity-50"
                          >
                            <BookOpen className="h-3 w-3" />
                            Estudiar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Añadir tema */}
              <div className="p-3 px-4 border-t border-border">
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
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Nombre del tema"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      Añadir
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowTopicForm(null); setNewTopic(''); }}
                      className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowTopicForm(subject.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Añadir tema
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session form dialog */}
      {sessionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Registrar sesión</h3>
              <button
                onClick={() => setSessionForm(null)}
                className="rounded-md p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
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
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setSessionForm({ ...sessionForm, sessionType: value })
                        }
                        className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          sessionForm.sessionType === value
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
                <label htmlFor="session-duration" className="block text-sm font-medium mb-1.5">
                  Duración (minutos) <span className="text-muted-foreground font-normal">— opcional</span>
                </label>
                <input
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
                        setSessionForm({
                          ...sessionForm,
                          qualityRating:
                            sessionForm.qualityRating === rating ? undefined : rating,
                        })
                      }
                      className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                        sessionForm.qualityRating === rating
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSessionForm(null)}
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
