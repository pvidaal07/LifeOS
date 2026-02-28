import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, ChevronRight, Pencil, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
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
    return (
      <div className="flex h-52 items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando planes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planes de Estudio</h1>
          <p className="text-sm text-muted-foreground">
            Organiza tus estudios por planes, asignaturas y temas
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-11 gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo plan
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                type="text"
                placeholder="Nombre del plan (ej: Oposiciones 2026)"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                className="h-11"
                autoFocus
              />
              <Input
                type="text"
                placeholder="Descripcion (opcional)"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                className="h-11"
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={createMutation.isPending} className="h-11">
                  Crear
                </Button>
                <Button type="button" onClick={() => setShowForm(false)} variant="secondary" className="h-11">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {plans?.length === 0 ? (
        <Card>
          <CardContent className="rounded-xl border border-dashed border-border bg-surface-muted p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Sin planes de estudio</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea tu primer plan para empezar a organizar tus estudios
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className="group relative border-border/90 transition-all duration-200 hover:border-brand-primary-500/45 hover:shadow-soft"
            >
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
                  className="space-y-2 p-5"
                >
                  <Input
                    type="text"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="h-10"
                    autoFocus
                  />
                  <Input
                    type="text"
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    placeholder="Descripcion (opcional)"
                    className="h-10"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      size="icon"
                      className="h-9 w-9"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setEditingPlan(null)}
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              ) : deletingPlanId === plan.id ? (
                <div className="space-y-3 rounded-xl border border-state-danger/25 bg-state-danger-soft p-5 text-state-danger-foreground">
                  <p className="text-sm font-semibold">
                    ¿Eliminar &quot;{plan.name}&quot;?
                  </p>
                  <p className="text-xs text-state-danger-foreground/85">
                    Se eliminarán todas sus asignaturas y temas. Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => deleteMutation.mutate(plan.id)}
                      disabled={deleteMutation.isPending}
                      variant="destructive"
                      size="sm"
                    >
                      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                    <Button
                      onClick={() => setDeletingPlanId(null)}
                      variant="secondary"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between">
                    <Link to={`/studies/${plan.id}`} className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary transition-colors group-hover:text-primary">
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
                        className="rounded-md p-1.5 text-muted-foreground transition-all hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 opacity-0 group-hover:opacity-100"
                        title="Editar plan"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeletingPlanId(plan.id);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground transition-all hover:bg-state-danger-soft hover:text-state-danger-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-danger/30 opacity-0 group-hover:opacity-100"
                        title="Eliminar plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Link to={`/studies/${plan.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="neutral">{plan.subjects?.length || 0} asignaturas</Badge>
                    <Badge variant={plan.status === 'active' ? 'success' : 'outline'} className="capitalize">
                      {plan.status === 'active' ? 'Activo' : plan.status}
                    </Badge>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
