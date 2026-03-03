import { describe, expect, it } from 'vitest';
import {
  getReviewHistoryEditDefaults,
  getSessionHistoryEditDefaults,
  normalizeHistoryEditApiError,
  toReviewHistoryPayload,
  toSessionHistoryPayload,
  validateReviewHistoryPayload,
  validateSessionHistoryPayload,
} from './topic-history-editing.validation';

describe('topic-history-editing.validation', () => {
  it('builds deterministic dialog defaults from source records', () => {
    const studiedAtIso = '2026-02-11T08:30:00.000Z';

    expect(
      getSessionHistoryEditDefaults({
        studiedAt: studiedAtIso,
        durationMinutes: 45,
        qualityRating: 4,
      }),
    ).toEqual({
      studiedAt: toDateOnlyLocal(studiedAtIso),
      durationMinutes: '45',
      qualityRating: 4,
    });

    expect(
      getReviewHistoryEditDefaults({
        completedDate: null,
        result: null,
        durationMinutes: null,
        qualityRating: null,
      }),
    ).toEqual({
      completedDate: '',
      result: null,
      durationMinutes: '',
      qualityRating: null,
    });
  });

  it('passes through valid form values as API payloads without adding unsupported fields', () => {
    const sessionPayload = toSessionHistoryPayload({
      studiedAt: '2026-02-11',
      durationMinutes: '45',
      qualityRating: 4,
    });

    const reviewPayload = toReviewHistoryPayload({
      completedDate: '2026-02-12T11:00',
      result: 'good',
      durationMinutes: '30',
      qualityRating: 3,
    });

    expect(sessionPayload).toEqual({
      studiedAt: '2026-02-11T00:00:00.000Z',
      durationMinutes: 45,
      qualityRating: 4,
    });

    expect(reviewPayload).toEqual({
      completedDate: new Date('2026-02-12T11:00').toISOString(),
      result: 'good',
      durationMinutes: 30,
      qualityRating: 3,
    });

    expect('studyHours' in reviewPayload).toBe(false);
  });

  it('returns field-level validation errors for invalid payloads', () => {
    expect(
      validateSessionHistoryPayload({
        studiedAt: 'not-a-date',
        durationMinutes: 0,
        qualityRating: 9,
      }),
    ).toEqual({
      studiedAt: 'Ingresa una fecha valida.',
      durationMinutes: 'La duracion debe estar entre 1 y 480 minutos.',
      qualityRating: 'La calidad debe estar entre 1 y 5.',
    });

    expect(
      validateReviewHistoryPayload({
        completedDate: '2026-01-01',
        result: 'excellent' as never,
        durationMinutes: 600,
        qualityRating: 0,
      }),
    ).toEqual({
      completedDate: 'Ingresa una fecha y hora valida.',
      result: 'Selecciona un resultado valido.',
      durationMinutes: 'La duracion debe estar entre 1 y 480 minutos.',
      qualityRating: 'La calidad debe estar entre 1 y 5.',
    });
  });

  it('keeps backward compatibility for ISO-like inputs in payload shaping', () => {
    expect(
      toSessionHistoryPayload({
        studiedAt: '2026-02-11T08:30:00.000Z',
        durationMinutes: '',
        qualityRating: null,
      }),
    ).toEqual({
      studiedAt: '2026-02-11T08:30:00.000Z',
      durationMinutes: undefined,
      qualityRating: undefined,
    });
  });

  it('keeps date-only roundtrip stable for 13-02 without timezone drift', () => {
    expect(
      getSessionHistoryEditDefaults({
        studiedAt: '2026-02-13T23:30:00.000Z',
      }),
    ).toEqual({
      studiedAt: '2026-02-13',
      durationMinutes: '',
      qualityRating: null,
    });

    expect(
      toSessionHistoryPayload({
        studiedAt: '2026-02-13',
        durationMinutes: '',
        qualityRating: null,
      }),
    ).toEqual({
      studiedAt: '2026-02-13T00:00:00.000Z',
      durationMinutes: undefined,
      qualityRating: undefined,
    });
  });

  it('normalizes 400/404/409 backend error shapes deterministically', () => {
    const badRequest = normalizeHistoryEditApiError({
      response: {
        status: 400,
        data: {
          message: ['completedDate must be a valid ISO 8601 date string', 'qualityRating must not be greater than 5'],
          code: 'VALIDATION_ERROR',
        },
      },
    });

    const notFound = normalizeHistoryEditApiError({
      response: {
        status: 404,
        data: {
          message: 'Review not found',
          code: 'ENTITY_NOT_FOUND',
        },
      },
    });

    const conflict = normalizeHistoryEditApiError({
      response: {
        status: 409,
        data: {
          message: 'Cannot edit review chain because anchor review is not completed',
          code: 'REVIEW_CHAIN_CONFLICT',
        },
      },
    });

    expect(badRequest).toEqual({
      code: 'VALIDATION_ERROR',
      messages: [
        'completedDate must be a valid ISO 8601 date string',
        'qualityRating must not be greater than 5',
      ],
    });

    expect(notFound).toEqual({
      code: 'ENTITY_NOT_FOUND',
      messages: ['Review not found'],
    });

    expect(conflict).toEqual({
      code: 'REVIEW_CHAIN_CONFLICT',
      messages: ['Cannot edit review chain because anchor review is not completed'],
    });
  });
});

function toDateOnlyLocal(value: string): string {
  const date = new Date(value);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
