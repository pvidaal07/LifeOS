import { type FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { EditSessionHistoryRequest, StudySession } from '../../../types';
import {
  HISTORY_DURATION_MAX,
  HISTORY_DURATION_MIN,
  HISTORY_QUALITY_MAX,
  HISTORY_QUALITY_MIN,
  getSessionHistoryEditDefaults,
  normalizeHistoryEditApiError,
  toSessionHistoryPayload,
  type SessionHistoryEditFormValues,
  validateSessionHistoryPayload,
} from '../topic-history-editing.validation';

const MODAL_BACKDROP_CLASS = 'fixed inset-0 z-50 grid place-items-center bg-canvas/70 p-4 backdrop-blur-sm';
const MODAL_PANEL_CLASS = 'w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-float';

interface SessionHistoryEditDialogProps {
  session: StudySession;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: EditSessionHistoryRequest) => Promise<unknown>;
}

export function SessionHistoryEditDialog({ session, pending, onClose, onSubmit }: SessionHistoryEditDialogProps) {
  const [form, setForm] = useState<SessionHistoryEditFormValues>(() =>
    getSessionHistoryEditDefaults(session),
  );
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'studiedAt' | 'durationMinutes' | 'qualityRating', string>>>({});
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const dialogTitleId = useId();
  const errorId = useId();

  const qualityRatings = useMemo(
    () => Array.from({ length: HISTORY_QUALITY_MAX }, (_, index) => index + 1),
    [],
  );

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

    const payload = toSessionHistoryPayload(form);
    const nextErrors = validateSessionHistoryPayload(payload);

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
      <div
        className={MODAL_PANEL_CLASS}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 id={dialogTitleId} className="text-lg font-semibold">Editar sesión histórica</h3>
            <p className="text-xs text-muted-foreground">{session.sessionType === 'first_time' ? 'Primera vez' : session.sessionType === 'review' ? 'Repaso' : 'Práctica'}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar editor de sesión"
            onClick={onClose}
            disabled={pending}
            className="h-9 w-9 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="session-history-studied-at" className="mb-1.5 block text-sm font-medium">
              Fecha y hora
            </label>
            <Input
              id="session-history-studied-at"
              autoFocus
              type="datetime-local"
              step={60}
              value={form.studiedAt}
              onChange={(event) => setForm((prev) => ({ ...prev, studiedAt: event.target.value }))}
              hasError={Boolean(fieldErrors.studiedAt)}
              aria-invalid={Boolean(fieldErrors.studiedAt)}
            />
            {fieldErrors.studiedAt && <p className="mt-1 text-xs text-state-danger">{fieldErrors.studiedAt}</p>}
          </div>

          <div>
            <label htmlFor="session-history-duration" className="mb-1.5 block text-sm font-medium">
              Duración (minutos)
            </label>
            <Input
              id="session-history-duration"
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
              {qualityRatings.map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant="secondary"
                  className={`h-11 flex-1 border text-sm font-medium transition-colors ${
                    form.qualityRating === rating
                      ? 'border-brand-primary-500/40 bg-brand-primary-100 text-brand-primary-700'
                      : 'border-border'
                  }`}
                  aria-pressed={form.qualityRating === rating}
                  aria-label={`Calidad ${rating}`}
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
