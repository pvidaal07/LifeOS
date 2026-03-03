import type {
  EditReviewHistoryRequest,
  EditSessionHistoryRequest,
  ReviewResult,
  ReviewHistoryEditableField,
  SessionHistoryEditableField,
} from '../../types';

export const HISTORY_DURATION_MIN = 1;
export const HISTORY_DURATION_MAX = 480;
export const HISTORY_QUALITY_MIN = 1;
export const HISTORY_QUALITY_MAX = 5;

const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const LOCAL_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export interface SessionHistoryEditFormValues {
  studiedAt: string;
  durationMinutes: string;
  qualityRating: number | null;
}

export interface ReviewHistoryEditFormValues {
  completedDate: string;
  result: ReviewResult | null;
  durationMinutes: string;
  qualityRating: number | null;
}

export interface NormalizedHistoryEditApiError {
  code?: string;
  messages: string[];
}

type SessionFieldErrors = Partial<Record<SessionHistoryEditableField, string>>;
type ReviewFieldErrors = Partial<Record<ReviewHistoryEditableField, string>>;

export function getSessionHistoryEditDefaults(input: {
  studiedAt?: string | null;
  durationMinutes?: number | null;
  qualityRating?: number | null;
}): SessionHistoryEditFormValues {
  return {
    studiedAt: toLocalDateTimeInputValue(input.studiedAt),
    durationMinutes: input.durationMinutes != null ? String(input.durationMinutes) : '',
    qualityRating: input.qualityRating ?? null,
  };
}

export function getReviewHistoryEditDefaults(input: {
  completedDate?: string | null;
  result?: ReviewResult | null;
  durationMinutes?: number | null;
  qualityRating?: number | null;
}): ReviewHistoryEditFormValues {
  return {
    completedDate: toLocalDateTimeInputValue(input.completedDate),
    result: input.result ?? null,
    durationMinutes: input.durationMinutes != null ? String(input.durationMinutes) : '',
    qualityRating: input.qualityRating ?? null,
  };
}

export function toSessionHistoryPayload(form: SessionHistoryEditFormValues): EditSessionHistoryRequest {
  return {
    studiedAt: toApiDateTime(form.studiedAt),
    durationMinutes: toOptionalInteger(form.durationMinutes),
    qualityRating: form.qualityRating ?? undefined,
  };
}

export function toReviewHistoryPayload(form: ReviewHistoryEditFormValues): EditReviewHistoryRequest {
  return {
    completedDate: toApiDateTime(form.completedDate),
    result: form.result ?? undefined,
    durationMinutes: toOptionalInteger(form.durationMinutes),
    qualityRating: form.qualityRating ?? undefined,
  };
}

export function validateSessionHistoryPayload(payload: EditSessionHistoryRequest): SessionFieldErrors {
  const errors: SessionFieldErrors = {};

  if (payload.studiedAt !== undefined && !isIsoDateTime(payload.studiedAt)) {
    errors.studiedAt = 'Ingresa una fecha y hora valida.';
  }

  const durationError = validateDurationMinutes(payload.durationMinutes);
  if (durationError) {
    errors.durationMinutes = durationError;
  }

  const qualityError = validateQualityRating(payload.qualityRating);
  if (qualityError) {
    errors.qualityRating = qualityError;
  }

  return errors;
}

export function validateReviewHistoryPayload(payload: EditReviewHistoryRequest): ReviewFieldErrors {
  const errors: ReviewFieldErrors = {};

  if (payload.completedDate !== undefined && !isIsoDateTime(payload.completedDate)) {
    errors.completedDate = 'Ingresa una fecha y hora valida.';
  }

  const durationError = validateDurationMinutes(payload.durationMinutes);
  if (durationError) {
    errors.durationMinutes = durationError;
  }

  const qualityError = validateQualityRating(payload.qualityRating);
  if (qualityError) {
    errors.qualityRating = qualityError;
  }

  if (payload.result !== undefined && !isReviewResult(payload.result)) {
    errors.result = 'Selecciona un resultado valido.';
  }

  return errors;
}

export function normalizeHistoryEditApiError(error: unknown): NormalizedHistoryEditApiError {
  const fallback = 'No se pudo actualizar el historial.';
  const responseData = getResponseData(error);

  if (!responseData) {
    if (error instanceof Error && error.message.trim() !== '') {
      return { messages: [error.message.trim()] };
    }
    return { messages: [fallback] };
  }

  const code = typeof responseData.code === 'string' ? responseData.code : undefined;
  const messages = normalizeMessages(responseData.message);

  if (messages.length > 0) {
    return { code, messages };
  }

  return { code, messages: [fallback] };
}

export function isIsoDateTime(value: string): boolean {
  if (!ISO_DATETIME_REGEX.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

export function validateDurationMinutes(value: number | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value)) {
    return 'La duracion debe ser un entero.';
  }

  if (value < HISTORY_DURATION_MIN || value > HISTORY_DURATION_MAX) {
    return `La duracion debe estar entre ${HISTORY_DURATION_MIN} y ${HISTORY_DURATION_MAX} minutos.`;
  }

  return undefined;
}

export function validateQualityRating(value: number | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Number.isInteger(value) || value < HISTORY_QUALITY_MIN || value > HISTORY_QUALITY_MAX) {
    return `La calidad debe estar entre ${HISTORY_QUALITY_MIN} y ${HISTORY_QUALITY_MAX}.`;
  }

  return undefined;
}

function normalizeOptionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function toLocalDateTimeInputValue(value?: string | null): string {
  const normalized = normalizeOptionalString(value ?? '');
  if (!normalized) {
    return '';
  }

  if (LOCAL_DATETIME_REGEX.test(normalized)) {
    return normalized;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toApiDateTime(value: string): string | undefined {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return undefined;
  }

  if (LOCAL_DATETIME_REGEX.test(normalized)) {
    const localDate = new Date(normalized);
    if (Number.isNaN(localDate.getTime())) {
      return normalized;
    }
    return localDate.toISOString();
  }

  return normalized;
}

function toOptionalInteger(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === '') {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function isReviewResult(value: string): value is ReviewResult {
  return value === 'perfect' || value === 'good' || value === 'regular' || value === 'bad';
}

function normalizeMessages(message: unknown): string[] {
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  }

  if (typeof message === 'string' && message.trim() !== '') {
    return [message.trim()];
  }

  return [];
}

function getResponseData(error: unknown): { message?: unknown; code?: unknown } | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  if (!('response' in error)) {
    return null;
  }

  const response = (error as { response?: unknown }).response;
  if (!response || typeof response !== 'object' || !('data' in response)) {
    return null;
  }

  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== 'object') {
    return null;
  }

  return data as { message?: unknown; code?: unknown };
}
