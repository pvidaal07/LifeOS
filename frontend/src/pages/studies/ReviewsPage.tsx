import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, SkipForward, RefreshCw, Calendar, Clock, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { HelpTooltip } from '../../components/ui/HelpTooltip';
import { Input } from '../../components/ui/Input';
import { detectReviewSettingsPreset, getReviewSettingsPresetLabel } from '../../lib/review-settings-presets';
import { cn } from '../../lib/utils';
import type { ReviewSchedule, ReviewSettings, ReviewResult } from '../../types';

// --- Review completion form state ---

interface ReviewFormState {
  durationMinutes: string;
  qualityRating: number | null;
  notes: string;
}

const defaultFormState: ReviewFormState = {
  durationMinutes: '',
  qualityRating: null,
  notes: '',
};

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

function ReviewSettingsSummaryCard() {
  const navigate = useNavigate();

  const { data: reviewSettings, isLoading } = useQuery({
    queryKey: ['review-settings'],
    queryFn: async () => {
      const response = await studiesApi.getReviewSettings();
      return response.data.data as ReviewSettings;
    },
  });

  const presetLabel = reviewSettings
    ? getReviewSettingsPresetLabel(detectReviewSettingsPreset(reviewSettings))
    : 'Normal';

  const intervalsLabel = reviewSettings?.baseIntervals.join(', ') ?? '1, 7, 30, 90';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Configuracion de repasos</CardTitle>
          </div>
          <Button
            variant="secondary"
            className="h-11"
            onClick={() => navigate('/account/settings#review-settings')}
          >
            Editar en Cuenta
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando preferencias de repaso...</p>
        ) : (
          <>
            <p className="text-sm text-text-primary">
              Preset activo: <span className="font-semibold">{presetLabel}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Intervalos base: {intervalsLabel} dias.
            </p>
            <p className="text-xs text-muted-foreground">
              Para editar multiplicadores y reglas avanzadas, usa la seccion de Cuenta.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewsPage() {
  const queryClient = useQueryClient();
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ReviewFormState>(defaultFormState);

  // Reset form when switching to a different review
  useEffect(() => {
    setFormState(defaultFormState);
  }, [expandedReviewId]);

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
    mutationFn: ({ id, result, durationMinutes, qualityRating, notes }: {
      id: string;
      result: ReviewResult;
      durationMinutes: number;
      qualityRating?: number;
      notes?: string;
    }) =>
      studiesApi.completeReview(id, {
        result,
        durationMinutes,
        ...(qualityRating != null && { qualityRating }),
        ...(notes != null && notes.trim() !== '' && { notes: notes.trim() }),
      }),
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

  const handleCompleteReview = (reviewId: string, result: ReviewResult) => {
    const parsed = parseInt(formState.durationMinutes, 10);
    if (isNaN(parsed) || parsed < 1) {
      toast.error('Ingresa la duración en minutos (mínimo 1)');
      return;
    }

    completeReviewMutation.mutate({
      id: reviewId,
      result,
      durationMinutes: parsed,
      ...(formState.qualityRating != null && { qualityRating: formState.qualityRating }),
      ...(formState.notes.trim() !== '' && { notes: formState.notes.trim() }),
    });
  };

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
    if (diffDays === 1) return 'Mañana';
    if (diffDays <= 7) return `En ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Repasos pendientes</h1>
          <HelpTooltip
            content="La repetición espaciada programa repasos a intervalos crecientes (ej. 1, 7, 30 días) para reforzar la memoria a largo plazo. Completa cada repaso e indica qué tal fue para que el sistema ajuste los próximos intervalos."
          />
          {sortedReviews.length > 0 && (
            <Badge variant="secondary" className="px-2.5 py-0.5 text-sm font-medium">
              {sortedReviews.length}
            </Badge>
          )}
        </div>
      </div>

      <ReviewSettingsSummaryCard />

      {sortedReviews.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RotateCcw className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-base font-medium">No tienes repasos pendientes</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Los repasos se generan automáticamente cuando estudias un tema por primera vez.
              El sistema usa repetición espaciada para ayudarte a memorizar a largo plazo.
            </p>
            {(upcomingReviews ?? []).length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Revisa más abajo tus próximos repasos programados.
              </p>
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
                    <p className="mb-3 text-xs text-muted-foreground">¿Cómo fue el repaso?</p>

                    {/* Duration + Quality Rating row */}
                    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Duration input (required) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-primary">
                          Duración (min) <span className="text-state-danger">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Ej: 15"
                          value={formState.durationMinutes}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, durationMinutes: e.target.value }))
                          }
                          className="h-11"
                          aria-label="Duración en minutos"
                        />
                      </div>

                      {/* Quality rating (optional, 1-5 buttons) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-primary">Calidad</label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() =>
                                setFormState((prev) => ({
                                  ...prev,
                                  qualityRating: prev.qualityRating === n ? null : n,
                                }))
                              }
                              className={cn(
                                'flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                                formState.qualityRating === n
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-input bg-surface-muted text-muted-foreground hover:bg-surface-muted/80'
                              )}
                              aria-label={`Calidad ${n}`}
                              aria-pressed={formState.qualityRating === n}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Notes textarea (optional) */}
                    <div className="mb-3 space-y-1.5">
                      <label className="text-xs font-medium text-text-primary">Notas</label>
                      <textarea
                        placeholder="Observaciones sobre el repaso..."
                        value={formState.notes}
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        rows={2}
                        className="flex w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-muted-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Notas del repaso"
                      />
                    </div>

                    {/* Result buttons */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {resultButtons.map(({ result, label, variant }) => (
                        <button
                          key={result}
                          onClick={() => handleCompleteReview(review.id, result)}
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
