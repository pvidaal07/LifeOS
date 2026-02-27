import { TopicNotFoundError } from '../../../domain/study';
import { TopicRepositoryPort, TopicWithFullDetails } from '../../ports/topic-repository.port';

export class GetTopicUseCase {
  constructor(private readonly topicRepo: TopicRepositoryPort) {}

  async execute(topicId: string, userId: string): Promise<TopicWithFullDetails> {
    const result = await this.topicRepo.findByIdWithOwnership(topicId, userId);
    if (!result) {
      throw new TopicNotFoundError(topicId);
    }

    // Ownership is verified by the repository checking through subject → plan → user
    if (result.subject.studyPlan.userId !== userId) {
      throw new TopicNotFoundError(topicId);
    }

    return result;
  }
}
