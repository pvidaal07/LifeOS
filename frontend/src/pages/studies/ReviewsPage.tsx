import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, SkipForward, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { studiesApi } from '../../api/studies.api';
import type { ReviewSchedule, ReviewResult } from '../../types';

export function ReviewsPage() {
  const queryClient = useQueryClient();
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const { data: reviews, isLoading, isError, refetch } = useQuery({
    queryKey: ['pending-reviews'],
    queryFn: async () => {
      const res = await studiesApi.getPendingReviews();
      return res.data.data as ReviewSchedule[];
    },
  });

  const completeReviewMutation = useMutation({
    mutationFn: ({ id, result }: { id: string; result: ReviewResult }) =>
      studiesApi.completeReview(id, { result }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-reviews'] });
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
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando repasos...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Error al cargar los repasos</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    );
  }

  const sortedReviews = [...(reviews ?? [])].sort(
    (a, b) => b.urgencyScore - a.urgencyScore,
  );

  const getUrgencyColor = (score: number) => {
    if (score >= 7) return 'text-red-600 bg-red-100';
    if (score >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getUrgencyLabel = (score: number) => {
    if (score >= 7) return 'Alta';
    if (score >= 4) return 'Media';
    return 'Baja';
  };

  const resultButtons: { result: ReviewResult; label: string; classes: string }[] = [
    { result: 'perfect', label: 'Perfecto', classes: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { result: 'good', label: 'Bien', classes: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { result: 'regular', label: 'Regular', classes: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    { result: 'bad', label: 'Mal', classes: 'bg-red-100 text-red-700 hover:bg-red-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Repasos Pendientes</h1>
        {sortedReviews.length > 0 && (
          <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-sm font-medium">
            {sortedReviews.length}
          </span>
        )}
      </div>

      {/* Empty state */}
      {sortedReviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No tienes repasos pendientes!
        </div>
      ) : (
        <div className="space-y-3">
          {sortedReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-border bg-card p-4 transition-colors"
            >
              {/* Card content */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: review.topic?.subject?.color || '#6366f1' }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{review.topic?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {review.topic?.subject?.name}
                      {review.topic?.subject?.studyPlan?.name && (
                        <> · {review.topic.subject.studyPlan.name}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {/* Urgency badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getUrgencyColor(review.urgencyScore)}`}>
                    {getUrgencyLabel(review.urgencyScore)} ({review.urgencyScore.toFixed(1)})
                  </span>

                  {/* Review number and date */}
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">
                      Repaso #{review.reviewNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.scheduledDate).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setExpandedReviewId(
                          expandedReviewId === review.id ? null : review.id,
                        )
                      }
                      disabled={isMutating}
                      className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Completar
                    </button>
                    <button
                      onClick={() => skipReviewMutation.mutate(review.id)}
                      disabled={isMutating}
                      className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                    >
                      <SkipForward className="h-3 w-3" />
                      Saltar
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile: review number and date */}
              <div className="flex items-center gap-2 mt-2 sm:hidden text-xs text-muted-foreground">
                <span>Repaso #{review.reviewNumber}</span>
                <span>·</span>
                <span>
                  {new Date(review.scheduledDate).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>

              {/* Expanded result selector */}
              {expandedReviewId === review.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    ¿Cómo fue el repaso?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {resultButtons.map(({ result, label, classes }) => (
                      <button
                        key={result}
                        onClick={() =>
                          completeReviewMutation.mutate({
                            id: review.id,
                            result,
                          })
                        }
                        disabled={isMutating}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${classes}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
