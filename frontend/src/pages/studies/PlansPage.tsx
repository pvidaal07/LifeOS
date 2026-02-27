import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, ChevronRight, Pencil, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import type { StudyPlan } from '../../types';

export function PlansPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', description: '' });
  const [editingPlan, setEditingPlan] = useState<{ id: string; name: string; description: string } | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['study-plans'],
    queryFn: async () => {
      const res = await studiesApi.getPlans();
      return res.data.data as StudyPlan[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      studiesApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      setShowForm(false);
      setNewPlan({ name: '', description: '' });
      toast.success('Plan creado');
    },
    onError: () => toast.error('Error al crear el plan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudyPlan> }) =>
      studiesApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      setEditingPlan(null);
      toast.success('Plan actualizado');
    },
    onError: () => toast.error('Error al actualizar el plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studiesApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-plans'] });
      setDeletingPlanId(null);
      toast.success('Plan eliminado');
    },
    onError: () => toast.error('Error al eliminar el plan'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name.trim()) return;
    createMutation.mutate({
      name: newPlan.name,
      description: newPlan.description || undefined,
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando planes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planes de Estudio</h1>
          <p className="text-muted-foreground text-sm">
            Organiza tus estudios por planes, asignaturas y temas
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo plan
        </button>
      </div>

      {/* Formulario nuevo plan */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-border p-4 space-y-3"
        >
          <input
            type="text"
            placeholder="Nombre del plan (ej: Oposiciones 2026)"
            value={newPlan.name}
            onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={newPlan.description}
            onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de planes */}
      {plans?.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Sin planes de estudio</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primer plan para empezar a organizar tus estudios
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className="group rounded-lg border border-border p-5 hover:border-primary/50 hover:shadow-sm transition-all relative"
            >
              {/* Edit inline */}
              {editingPlan?.id === plan.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editingPlan.name.trim()) return;
                    updateMutation.mutate({
                      id: plan.id,
                      data: {
                        name: editingPlan.name,
                        description: editingPlan.description || undefined,
                      },
                    });
                  }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    placeholder="Descripción (opcional)"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPlan(null)}
                      className="rounded-md border border-border p-1.5 hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              ) : deletingPlanId === plan.id ? (
                /* Delete confirmation */
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    ¿Eliminar &quot;{plan.name}&quot;?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se eliminarán todas sus asignaturas y temas. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteMutation.mutate(plan.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </button>
                    <button
                      onClick={() => setDeletingPlanId(null)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal card */
                <>
                  <div className="flex items-start justify-between">
                    <Link to={`/studies/${plan.id}`} className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {plan.description}
                        </p>
                      )}
                    </Link>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingPlan({
                            id: plan.id,
                            name: plan.name,
                            description: plan.description || '',
                          });
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent opacity-0 group-hover:opacity-100 transition-all"
                        title="Editar plan"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeletingPlanId(plan.id);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        title="Eliminar plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Link to={`/studies/${plan.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{plan.subjects?.length || 0} asignaturas</span>
                    <span className="capitalize">{plan.status === 'active' ? 'Activo' : plan.status}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
