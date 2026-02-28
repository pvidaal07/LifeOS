import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, SkipForward, RefreshCw, Calendar, Clock, Settings, X, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import type { ReviewSchedule, ReviewSettings, ReviewResult } from '../../types';

const SUBJECT_COLOR_FALLBACK = 'hsl(var(--color-primary-500))';

const resultButtons: {
  result: ReviewResult;
  label: string;
  variant: 'success' | 'secondary' | 'warning' | 'danger';
}[] = [
  { result: 'perfect', label: 'Perfecto', variant: 'success' },
  { result: 'good', label: 'Bien', variant: 'secondary' },
  { result: 'regular', label: 'Regular', variant: 'warning' },
  { result: 'bad', label: 'Mal', variant: 'danger' },
];

function getUrgencyVariant(score: number): 'danger' | 'warning' | 'success' {
  if (score >= 7) return 'danger';
  if (score >= 4) return 'warning';
  return 'success';
}

function getUrgencyLabel(score: number): 'Alta' | 'Media' | 'Baja' {
  if (score >= 7) return 'Alta';
  if (score >= 4) return 'Media';
  return 'Baja';
}

function getResultButtonClass(variant: 'success' | 'secondary' | 'warning' | 'danger'): string {
  if (variant === 'success') {
    return 'border-state-success/30 bg-state-success-soft text-state-success-foreground hover:bg-state-success-soft/80';
  }
  if (variant === 'secondary') {
    return 'border-brand-secondary-100 bg-brand-secondary-100 text-brand-secondary-700 hover:bg-brand-secondary-100/80';
  }
  if (variant === 'warning') {
    return 'border-state-warning/30 bg-state-warning-soft text-state-warning-foreground hover:bg-state-warning-soft/80';
  }
  return 'border-state-danger/30 bg-state-danger-soft text-state-danger-foreground hover:bg-state-danger-soft/80';
}

function ReviewSettingsPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['review-settings'],
    queryFn: async () => {
      const res = await studiesApi.getReviewSettings();
      return res.data.data as ReviewSettings;
    },
  });

  const [formData, setFormData] = useState<{
    baseIntervals: string;
    perfectMultiplier: string;
    goodMultiplier: string;
    regularMultiplier: string;
    badReset: boolean;
  } | null>(null);

  const currentData = formData ?? (settings ? {
    baseIntervals: settings.baseIntervals.join(', '),
    perfectMultiplier: String(settings.perfectMultiplier),
    goodMultiplier: String(settings.goodMultiplier),
    regularMultiplier: String(settings.regularMultiplier),
    badReset: settings.badReset,
  } : null);

  const updateMutation = useMutation({
    mutationFn: (data: {
      baseIntervals?: number[];
      perfectMultiplier?: number;
      goodMultiplier?: number;
      regularMultiplier?: number;
      badReset?: boolean;
    }) => studiesApi.updateReviewSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-settings'] });
      toast.success('Configuracion guardada');
      onClose();
    },
    onError: () => {
      toast.error('Error al guardar la configuracion');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentData) return;

    const intervals = currentData.baseIntervals
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    if (intervals.length === 0) {
      toast.error('Debes indicar al menos un intervalo valido');
      return;
    }

    const perfect = parseFloat(currentData.perfectMultiplier);
    const good = parseFloat(currentData.goodMultiplier);
    const regular = parseFloat(currentData.regularMultiplier);

    if ([perfect, good, regular].some((n) => isNaN(n) || n < 1)) {
      toast.error('Los multiplicadores deben ser numeros >= 1');
      return;
    }

    updateMutation.mutate({
      baseIntervals: intervals,
      perfectMultiplier: perfect,
      goodMultiplier: good,
      regularMultiplier: regular,
      badReset: currentData.badReset,
    });
  };

  const handleReset = () => {
    setFormData({
      baseIntervals: '1, 7, 30, 90',
      perfectMultiplier: '2.5',
      goodMultiplier: '2',
      regularMultiplier: '1.2',
      badReset: true,
    });
  };

  if (isLoading || !currentData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">Cargando configuracion...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="space-y-0">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Configuracion de repasos</CardTitle>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-muted-foreground"
          aria-label="Cerrar panel de configuracion"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Intervalos base (dias)</label>
            <Input
              type="text"
              value={currentData.baseIntervals}
              onChange={(e) =>
                setFormData({ ...currentData, baseIntervals: e.target.value })
              }
              className="h-11"
              placeholder="1, 7, 30, 90"
            />
            <p className="text-xs text-muted-foreground">
              Separados por coma. El primero se usa como intervalo inicial del primer repaso.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Perfecto (x)</label>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={currentData.perfectMultiplier}
                onChange={(e) =>
                  setFormData({ ...currentData, perfectMultiplier: e.target.value })
                }
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Bien (x)</label>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={currentData.goodMultiplier}
                onChange={(e) =>
                  setFormData({ ...currentData, goodMultiplier: e.target.value })
                }
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Regular (x)</label>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={currentData.regularMultiplier}
                onChange={(e) =>
                  setFormData({ ...currentData, regularMultiplier: e.target.value })
                }
                className="h-11"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Al completar un repaso, el intervalo se multiplica por estos valores segun el resultado.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-input bg-surface-muted px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Resultado "Mal" reinicia</p>
              <p className="text-xs text-muted-foreground">
                {currentData.badReset
                  ? 'Un mal resultado vuelve al intervalo base (dia 1)'
                  : 'Un mal resultado reduce el intervalo a la mitad'}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...currentData, badReset: !currentData.badReset })
              }
              className={cn(
                'relative inline-flex h-11 w-16 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
                currentData.badReset
                  ? 'border-primary bg-primary'
                  : 'border-input bg-surface'
              )}
              aria-label={currentData.badReset ? 'Reinicio activado' : 'Reinicio desactivado'}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-surface transition-transform',
                  currentData.badReset ? 'translate-x-9' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              onClick={handleReset}
              variant="ghost"
              className="h-11 px-0 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              Restaurar valores predeterminados
            </Button>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                className="h-11"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="h-11"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ReviewsPage() {
  const queryClient = useQueryClient();
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { data: reviews, isLoading, isError, refetch } = useQuery({
    queryKey: ['pending-reviews'],
    queryFn: async () => {
      const res = await studiesApi.getPendingReviews();
      return res.data.data as ReviewSchedule[];
    },
  });

  const { data: upcomingReviews, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['upcoming-reviews'],
    queryFn: async () => {
      const res = await studiesApi.getUpcomingReviews();
      return res.data.data as ReviewSchedule[];
    },
  });

  const completeReviewMutation = useMutation({
    mutationFn: ({ id, result }: { id: string; result: ReviewResult }) =>
      studiesApi.completeReview(id, { result }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setExpandedReviewId(null);
      toast.success('Repaso completado');
    },
    onError: () => {
      toast.error('Error al procesar el repaso');
    },
  });

  const skipReviewMutation = useMutation({
    mutationFn: (id: string) => studiesApi.skipReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Repaso saltado, reprogramado');
    },
    onError: () => {
      toast.error('Error al procesar el repaso');
    },
  });

  const isMutating = completeReviewMutation.isPending || skipReviewMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Cargando repasos...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Error al cargar los repasos</p>
        <Button onClick={() => refetch()} className="h-11">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  const sortedReviews = [...(reviews ?? [])].sort(
    (a, b) => b.urgencyScore - a.urgencyScore,
  );

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Manana';
    if (diffDays <= 7) return `En ${diffDays} dias`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Repasos pendientes</h1>
          {sortedReviews.length > 0 && (
            <Badge variant="secondary" className="px-2.5 py-0.5 text-sm font-medium">
              {sortedReviews.length}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant={showSettings ? 'primary' : 'secondary'}
          className={cn('h-11 px-3 text-sm', !showSettings && 'text-muted-foreground')}
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Configuracion</span>
        </Button>
      </div>

      {showSettings && (
        <ReviewSettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {sortedReviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No tienes repasos pendientes por hoy.</p>
            {(upcomingReviews ?? []).length > 0 && (
              <p className="mt-1 text-sm">Revisa mas abajo tus proximos repasos programados.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedReviews.map((review) => (
            <Card key={review.id} className="transition-colors">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: review.topic?.subject?.color ?? SUBJECT_COLOR_FALLBACK }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{review.topic?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {review.topic?.subject?.name}
                        {review.topic?.subject?.studyPlan?.name && (
                          <> - {review.topic.subject.studyPlan.name}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Badge variant={getUrgencyVariant(review.urgencyScore)} className="text-xs">
                      Urgencia {getUrgencyLabel(review.urgencyScore)} ({review.urgencyScore.toFixed(1)})
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      <span>Repaso #{review.reviewNumber}</span>
                      <span className="mx-1">-</span>
                      <span>
                        {new Date(review.scheduledDate).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    onClick={() =>
                      setExpandedReviewId(
                        expandedReviewId === review.id ? null : review.id,
                      )
                    }
                    disabled={isMutating}
                    className="h-11 w-full"
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Completar
                  </Button>
                  <Button
                    onClick={() => skipReviewMutation.mutate(review.id)}
                    disabled={isMutating}
                    variant="secondary"
                    className="h-11 w-full"
                  >
                    <SkipForward className="mr-1 h-3.5 w-3.5" />
                    Saltar
                  </Button>
                </div>

                {expandedReviewId === review.id && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-2 text-xs text-muted-foreground">Como fue el repaso?</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {resultButtons.map(({ result, label, variant }) => (
                        <button
                          key={result}
                          onClick={() =>
                            completeReviewMutation.mutate({
                              id: review.id,
                              result,
                            })
                          }
                          disabled={isMutating}
                          className={cn(
                            'h-11 rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-50',
                            getResultButtonClass(variant)
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Proximos repasos</CardTitle>
            {(upcomingReviews ?? []).length > 0 && (
              <Badge variant="neutral" className="px-2.5 py-0.5 text-sm font-medium">
                {(upcomingReviews ?? []).length}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingUpcoming ? (
            <div className="text-sm text-muted-foreground">Cargando proximos repasos...</div>
          ) : (upcomingReviews ?? []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-muted p-6 text-center text-sm text-muted-foreground">
              No hay repasos programados proximamente.
            </div>
          ) : (
            <div className="space-y-2">
              {(upcomingReviews ?? []).map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border bg-surface p-3 sm:p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: review.topic?.subject?.color ?? SUBJECT_COLOR_FALLBACK }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{review.topic?.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {review.topic?.subject?.name}
                          {review.topic?.subject?.studyPlan?.name && (
                            <> - {review.topic.subject.studyPlan.name}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2 py-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatRelativeDate(review.scheduledDate)}
                      </span>
                      <span>Repaso #{review.reviewNumber}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
