import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'node:net';
import { DomainExceptionFilter } from '../../../../src/infrastructure/http/filters/domain-exception.filter';
import { TransformInterceptor } from '../../../../src/infrastructure/http/interceptors/transform.interceptor';
import { SessionsController } from '../../../../src/infrastructure/http/controllers/sessions.controller';
import { USE_CASE_TOKENS } from '../../../../src/infrastructure/http/use-case-tokens';
import { JwtAuthGuard } from '../../../../src/infrastructure/auth';
import { EntityNotFoundError } from '../../../../src/domain/common';

describe('Sessions history edit endpoint', () => {
  const createSessionUseCase = { execute: vi.fn() };
  const editHistoricalSessionUseCase = { execute: vi.fn() };
  const getTopicSessionsUseCase = { execute: vi.fn() };
  const getRecentSessionsUseCase = { execute: vi.fn() };

  let app: INestApplication;
  let baseUrl: string;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        { provide: USE_CASE_TOKENS.CreateSessionUseCase, useValue: createSessionUseCase },
        { provide: USE_CASE_TOKENS.EditHistoricalSessionUseCase, useValue: editHistoricalSessionUseCase },
        { provide: USE_CASE_TOKENS.GetTopicSessionsUseCase, useValue: getTopicSessionsUseCase },
        { provide: USE_CASE_TOKENS.GetRecentSessionsUseCase, useValue: getRecentSessionsUseCase },
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

  it('returns deterministic recomputation summary for valid historical session edit', async () => {
    editHistoricalSessionUseCase.execute.mockResolvedValue({
      sessionId: 'session-1',
      topicId: 'topic-1',
      anchorReviewNumber: 1,
      recomputedReviewCount: 4,
      systemMastery: 7,
      topicStatus: 'mastered',
    });

    const response = await fetch(`${baseUrl}/studies/sessions/session-1/history`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
      },
      body: JSON.stringify({
        studiedAt: '2026-02-11T08:30:00.000Z',
        durationMinutes: 45,
        qualityRating: 4,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(editHistoricalSessionUseCase.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      userId: 'user-1',
      studiedAt: new Date('2026-02-11T08:30:00.000Z'),
      durationMinutes: 45,
      qualityRating: 4,
    });
    expect(body.data).toEqual({
      sessionId: 'session-1',
      topicId: 'topic-1',
      anchorReviewNumber: 1,
      recomputedReviewCount: 4,
      systemMastery: 7,
      topicStatus: 'mastered',
    });
  });

  it('rejects invalid payload with validation error', async () => {
    const response = await fetch(`${baseUrl}/studies/sessions/session-1/history`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
      },
      body: JSON.stringify({
        studiedAt: 'not-a-date',
        durationMinutes: 0,
        qualityRating: 9,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toContain('studiedAt must be a valid ISO 8601 date string');
    expect(editHistoricalSessionUseCase.execute).not.toHaveBeenCalled();
  });

  it('returns not-found when authenticated owner cannot access session', async () => {
    editHistoricalSessionUseCase.execute.mockRejectedValue(
      new EntityNotFoundError('Session', 'session-404'),
    );

    const response = await fetch(`${baseUrl}/studies/sessions/session-404/history`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-2',
      },
      body: JSON.stringify({
        qualityRating: 3,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.code).toBe('ENTITY_NOT_FOUND');
    expect(editHistoricalSessionUseCase.execute).toHaveBeenCalledWith({
      sessionId: 'session-404',
      userId: 'user-2',
      studiedAt: undefined,
      durationMinutes: undefined,
      qualityRating: 3,
    });
  });
});
