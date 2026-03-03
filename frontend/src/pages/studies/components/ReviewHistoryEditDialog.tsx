import { type FormEvent, useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { EditReviewHistoryRequest, ReviewResult, ReviewSchedule } from '../../../types';
import {
  HISTORY_DURATION_MAX,
  HISTORY_DURATION_MIN,
  HISTORY_QUALITY_MAX,
  HISTORY_QUALITY_MIN,
  getReviewHistoryEditDefaults,
  normalizeHistoryEditApiError,
  toReviewHistoryPayload,
  type ReviewHistoryEditFormValues,
  validateReviewHistoryPayload,
} from '../topic-history-editing.validation';

const MODAL_BACKDROP_CLASS = 'fixed inset-0 z-50 grid place-items-center bg-canvas/70 p-4 backdrop-blur-sm';
const MODAL_PANEL_CLASS = 'w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-float';

const RESULT_OPTIONS: Array<{ value: ReviewResult; label: string }> = [
  { value: 'perfect', label: 'Perfecto' },
  { value: 'good', label: 'Bien' },
  { value: 'regular', label: 'Regular' },
  { value: 'bad', label: 'Mal' },
];

interface ReviewHistoryEditDialogProps {
  review: ReviewSchedule;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: EditReviewHistoryRequest) => Promise<unknown>;
}

export function ReviewHistoryEditDialog({ review, pending, onClose, onSubmit }: ReviewHistoryEditDialogProps) {
  const [form, setForm] = useState<ReviewHistoryEditFormValues>(() =>
    getReviewHistoryEditDefaults({
      completedDate: review.completedDate,
      result: review.result,
      durationMinutes: (review as ReviewSchedule & { durationMinutes?: number }).durationMinutes,
      qualityRating: (review as ReviewSchedule & { qualityRating?: number }).qualityRating,
    }),
  );
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'completedDate' | 'result' | 'durationMinutes' | 'qualityRating', string>>>({});
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const dialogTitleId = useId();
  const errorId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, pending]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiErrors([]);

    const payload = toReviewHistoryPayload(form);
    const nextErrors = validateReviewHistoryPayload(payload);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    try {
      await onSubmit(payload);
    } catch (error) {
      setApiErrors(normalizeHistoryEditApiError(error).messages);
    }
  };

  return (
    <div
      className={MODAL_BACKDROP_CLASS}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div className={MODAL_PANEL_CLASS} role="dialog" aria-modal="true" aria-labelledby={dialogTitleId}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 id={dialogTitleId} className="text-lg font-semibold">Editar repaso histórico</h3>
            <p className="text-xs text-muted-foreground">Repaso #{review.reviewNumber}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Cerrar editor de repaso ${review.reviewNumber}`}
            onClick={onClose}
            disabled={pending}
            className="h-9 w-9 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="review-history-completed-date" className="mb-1.5 block text-sm font-medium">
              Fecha y hora de completado
            </label>
            <Input
              id="review-history-completed-date"
              autoFocus
              type="datetime-local"
              step={60}
              value={form.completedDate}
              onChange={(event) => setForm((prev) => ({ ...prev, completedDate: event.target.value }))}
              hasError={Boolean(fieldErrors.completedDate)}
              aria-invalid={Boolean(fieldErrors.completedDate)}
            />
            {fieldErrors.completedDate && (
              <p className="mt-1 text-xs text-state-danger">{fieldErrors.completedDate}</p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Resultado</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RESULT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="secondary"
                  className={`h-11 border text-sm font-medium transition-colors ${
                    form.result === option.value
                      ? 'border-brand-primary-500/40 bg-brand-primary-100 text-brand-primary-700'
                      : 'border-border'
                  }`}
                  aria-label={`Resultado ${option.label}`}
                  aria-pressed={form.result === option.value}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      result: prev.result === option.value ? null : option.value,
                    }));
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {fieldErrors.result && <p className="mt-1 text-xs text-state-danger">{fieldErrors.result}</p>}
          </div>

          <div>
            <label htmlFor="review-history-duration" className="mb-1.5 block text-sm font-medium">
              Duración (minutos)
            </label>
            <Input
              id="review-history-duration"
              type="number"
              min={HISTORY_DURATION_MIN}
              max={HISTORY_DURATION_MAX}
              value={form.durationMinutes}
              onChange={(event) => setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))}
              hasError={Boolean(fieldErrors.durationMinutes)}
              aria-invalid={Boolean(fieldErrors.durationMinutes)}
            />
            {fieldErrors.durationMinutes && (
              <p className="mt-1 text-xs text-state-danger">{fieldErrors.durationMinutes}</p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">Calidad percibida</span>
            <div className="flex gap-1.5">
              {Array.from({ length: HISTORY_QUALITY_MAX }, (_, index) => index + 1).map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant="secondary"
                  className={`h-11 flex-1 border text-sm font-medium transition-colors ${
                    form.qualityRating === rating
                      ? 'border-brand-primary-500/40 bg-brand-primary-100 text-brand-primary-700'
                      : 'border-border'
                  }`}
                  aria-label={`Calidad ${rating}`}
                  aria-pressed={form.qualityRating === rating}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      qualityRating: prev.qualityRating === rating ? null : rating,
                    }));
                  }}
                >
                  {rating}
                </Button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{HISTORY_QUALITY_MIN}</span>
              <span>{HISTORY_QUALITY_MAX}</span>
            </div>
            {fieldErrors.qualityRating && (
              <p className="mt-1 text-xs text-state-danger">{fieldErrors.qualityRating}</p>
            )}
          </div>

          {apiErrors.length > 0 && (
            <div id={errorId} className="rounded-lg border border-state-danger/30 bg-state-danger-soft p-2 text-xs text-state-danger-foreground">
              {apiErrors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" className="h-11" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" className="h-11" disabled={pending} aria-describedby={apiErrors.length > 0 ? errorId : undefined}>
              {pending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
