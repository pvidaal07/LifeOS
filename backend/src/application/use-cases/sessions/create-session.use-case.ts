import { StudySession, SessionType } from '../../../domain/study';
import { ReviewSchedule } from '../../../domain/review';
import { SessionRepositoryPort, StudySessionWithDetails } from '../../ports/session-repository.port';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';
import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';

export interface CreateSessionInput {
  topicId: string;
  sessionType?: string;
  durationMinutes?: number | null;
  qualityRating?: number | null;
  notes?: string | null;
  studiedAt?: Date;
}

export class CreateSessionUseCase {
  constructor(
    private readonly sessionRepo: SessionRepositoryPort,
    private readonly topicRepo: TopicRepositoryPort,
    private readonly reviewRepo: ReviewRepositoryPort,
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
  ) {}

  async execute(userId: string, input: CreateSessionInput): Promise<StudySessionWithDetails> {
    // Count existing sessions for this topic to determine if first time
    const sessionCount = await this.topicRepo.countSessionsByTopicAndUser(
      input.topicId,
      userId,
    );

    const isFirstTime = sessionCount === 0;
    const sessionType = isFirstTime
      ? SessionType.FIRST_TIME
      : input.sessionType
        ? SessionType.create(input.sessionType)
        : SessionType.PRACTICE;

    const session = StudySession.create({
      id: crypto.randomUUID(),
      userId,
      topicId: input.topicId,
      sessionType,
      durationMinutes: input.durationMinutes,
      qualityRating: input.qualityRating,
      notes: input.notes,
      studiedAt: input.studiedAt,
    });

    const saved = await this.sessionRepo.save(session);

    // On first session: schedule first review and mark topic in_progress
    if (isFirstTime) {
      const topicDetails = await this.topicRepo.findByIdWithOwnership(input.topicId, userId);
      if (topicDetails) {
        const topic = topicDetails.topic;
        topic.markInProgress();
        await this.topicRepo.update(topic);
      }

      // Schedule first review
      const settings = await this.reviewSettingsRepo.findByUserId(userId);
      const firstInterval = settings?.getFirstInterval() ?? 1;
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + firstInterval);

      const review = ReviewSchedule.scheduleFirst({
        id: crypto.randomUUID(),
        userId,
        topicId: input.topicId,
        scheduledDate,
        intervalDays: firstInterval,
      });

      await this.reviewRepo.save(review);
    }

    return saved;
  }
}
