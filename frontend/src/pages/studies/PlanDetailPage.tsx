import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import type { StudyPlan, Topic } from '../../types';

export function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const queryClient = useQueryClient();
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', color: '#6366f1' });
  const [showTopicForm, setShowTopicForm] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState('');

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
    mutationFn: (topicId: string) =>
      studiesApi.createSession({ topicId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('¡Sesión registrada! Se ha programado el repaso.');
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando plan...</div>;
  }

  if (!plan) {
    return <div>Plan no encontrado</div>;
  }

  const getMasteryColor = (level: number) => {
    if (level >= 8) return 'text-green-600';
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{plan.name}</h1>
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
              <div className="flex items-center gap-3 border-b border-border p-4">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <h2 className="font-semibold">{subject.name}</h2>
                <span className="text-xs text-muted-foreground">
                  {subject.topics?.length || 0} temas
                </span>
              </div>

              {/* Lista de temas */}
              <div className="divide-y divide-border">
                {subject.topics?.map((topic) => (
                  <div
                    key={topic.id}
                    className="flex items-center justify-between p-3 px-4 hover:bg-accent/30 transition-colors"
                  >
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
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium ${getMasteryColor(topic.masteryLevel)}`}>
                        Dominio: {topic.masteryLevel}/10
                      </span>
                      {topic.status === 'not_started' && (
                        <button
                          onClick={() => createSessionMutation.mutate(topic.id)}
                          disabled={createSessionMutation.isPending}
                          className="text-xs rounded bg-primary/10 text-primary px-2 py-1 hover:bg-primary/20 transition-colors"
                        >
                          Estudiar
                        </button>
                      )}
                    </div>
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
    </div>
  );
}
