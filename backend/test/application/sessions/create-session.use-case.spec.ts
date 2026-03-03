import { CreateSessionUseCase } from '../../../src/application/use-cases/sessions/create-session.use-case';
import { ReviewSettings } from '../../../src/domain/review';
import { Topic, TopicStatus } from '../../../src/domain/study';
import {
  createMockReviewRepository,
  createMockReviewSettingsRepository,
  createMockSessionRepository,
  createMockTopicRepository,
} from '../../helpers/mock-factories';

describe('CreateSessionUseCase first-session historical anchor', () => {
  const sessionRepo = createMockSessionRepository();
  const topicRepo = createMockTopicRepository();
  const reviewRepo = createMockReviewRepository();
  const reviewSettingsRepo = createMockReviewSettingsRepository();

  const useCase = new CreateSessionUseCase(
    sessionRepo,
    topicRepo,
    reviewRepo,
    reviewSettingsRepo,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('anchors first review schedule to studiedAt for backfilled first sessions', async () => {
    const topic = Topic.fromPersistence({
      id: 'topic-1',
      subjectId: 'subject-1',
      name: 'Topic',
      description: null,
      masteryLevel: 1,
      systemMasteryLevel: 0,
      status: TopicStatus.NOT_STARTED,
      displayOrder: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    topicRepo.findByIdWithOwnership.mockResolvedValue({
      topic,
      subject: {
        id: 'subject-1',
        studyPlanId: 'plan-1',
        name: 'Subject',
        description: null,
        color: '#000000',
        displayOrder: 0,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        studyPlan: { userId: 'user-1', name: 'Plan' },
      },
      studySessions: [],
      reviewSchedules: [],
    });
    topicRepo.countSessionsByTopicAndUser.mockResolvedValue(0);
    topicRepo.update.mockResolvedValue(topic);

    const backfilledStudiedAt = new Date('2025-12-20T10:00:00.000Z');
    sessionRepo.save.mockImplementation(async (session) => ({
      session,
      topicName: 'Topic',
      subjectName: 'Subject',
      subjectColor: '#000000',
    }));
    reviewSettingsRepo.findByUserId.mockResolvedValue(ReviewSettings.createDefault('settings-1', 'user-1'));
    reviewRepo.save.mockResolvedValue(undefined);

    await useCase.execute('user-1', {
      topicId: 'topic-1',
      studiedAt: backfilledStudiedAt,
    });

    expect(reviewRepo.save).toHaveBeenCalledTimes(1);
    const scheduledReview = reviewRepo.save.mock.calls[0][0];
    expect(scheduledReview.scheduledDate.toISOString()).toBe('2025-12-21T10:00:00.000Z');
  });
});
