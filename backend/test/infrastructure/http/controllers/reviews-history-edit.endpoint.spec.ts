import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'node:net';
import { DomainExceptionFilter } from '../../../../src/infrastructure/http/filters/domain-exception.filter';
import { TransformInterceptor } from '../../../../src/infrastructure/http/interceptors/transform.interceptor';
import { ReviewsController } from '../../../../src/infrastructure/http/controllers/reviews.controller';
import { USE_CASE_TOKENS } from '../../../../src/infrastructure/http/use-case-tokens';
import { JwtAuthGuard } from '../../../../src/infrastructure/auth';
import { EntityNotFoundError } from '../../../../src/domain/common';

describe('Reviews history edit endpoint', () => {
  const getPendingReviewsUseCase = { execute: vi.fn() };
  const getUpcomingReviewsUseCase = { execute: vi.fn() };
  const completeReviewUseCase = { execute: vi.fn() };
  const editHistoricalReviewUseCase = { execute: vi.fn() };
  const skipReviewUseCase = { execute: vi.fn() };
  const recalculateUrgencyUseCase = { execute: vi.fn() };
  const getReviewSettingsUseCase = { execute: vi.fn() };
  const updateReviewSettingsUseCase = { execute: vi.fn() };

  let app: INestApplication;
  let baseUrl: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        { provide: USE_CASE_TOKENS.GetPendingReviewsUseCase, useValue: getPendingReviewsUseCase },
        { provide: USE_CASE_TOKENS.GetUpcomingReviewsUseCase, useValue: getUpcomingReviewsUseCase },
        { provide: USE_CASE_TOKENS.CompleteReviewUseCase, useValue: completeReviewUseCase },
        { provide: USE_CASE_TOKENS.EditHistoricalReviewUseCase, useValue: editHistoricalReviewUseCase },
        { provide: USE_CASE_TOKENS.SkipReviewUseCase, useValue: skipReviewUseCase },
        { provide: USE_CASE_TOKENS.RecalculateUrgencyUseCase, useValue: recalculateUrgencyUseCase },
        { provide: USE_CASE_TOKENS.GetReviewSettingsUseCase, useValue: getReviewSettingsUseCase },
        { provide: USE_CASE_TOKENS.UpdateReviewSettingsUseCase, useValue: updateReviewSettingsUseCase },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp: () => { getRequest: () => { headers: Record<string, string | undefined>; user?: { sub: string } } } }) => {
          const request = context.switchToHttp().getRequest();
          const userId = request.headers['x-test-user-id'];
          if (!userId) {
            return false;
          }
          request.user = { sub: userId };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns deterministic recomputation summary for a valid owner edit', async () => {
    editHistoricalReviewUseCase.execute.mockResolvedValue({
      reviewId: 'review-1',
      topicId: 'topic-1',
      anchorReviewNumber: 2,
      recomputedReviewCount: 3,
      systemMastery: 5,
      topicStatus: 'in_progress',
    });

    const response = await fetch(`${baseUrl}/studies/reviews/review-1/history`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
      },
      body: JSON.stringify({
        completedDate: '2026-02-10T12:00:00.000Z',
        result: 'good',
        studyHours: 1.5,
        qualityRating: 4,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(editHistoricalReviewUseCase.execute).toHaveBeenCalledWith({
      reviewId: 'review-1',
      userId: 'user-1',
      completedDate: new Date('2026-02-10T12:00:00.000Z'),
      result: 'good',
      durationMinutes: 90,
      qualityRating: 4,
    });
    expect(body.data).toEqual({
      reviewId: 'review-1',
      topicId: 'topic-1',
      anchorReviewNumber: 2,
      recomputedReviewCount: 3,
      systemMastery: 5,
      topicStatus: 'in_progress',
    });
  });

  it('rejects invalid payload with validation error', async () => {
    const response = await fetch(`${baseUrl}/studies/reviews/review-1/history`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
      },
      body: JSON.stringify({
        completedDate: 'invalid-date',
        result: 'excellent',
        studyHours: -1,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toContain('completedDate must be a valid ISO 8601 date string');
    expect(body.message).toContain('studyHours must not be less than 0.01');
    expect(editHistoricalReviewUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns not-found when authenticated owner cannot access review', async () => {
    editHistoricalReviewUseCase.execute.mockRejectedValue(
      new EntityNotFoundError('Review', 'review-404'),
    );

    const response = await fetch(`${baseUrl}/studies/reviews/review-404/history`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-2',
      },
      body: JSON.stringify({
        result: 'bad',
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.code).toBe('ENTITY_NOT_FOUND');
    expect(editHistoricalReviewUseCase.execute).toHaveBeenCalledWith({
      reviewId: 'review-404',
      userId: 'user-2',
      completedDate: undefined,
      result: 'bad',
      durationMinutes: undefined,
      qualityRating: undefined,
    });
  });
});
