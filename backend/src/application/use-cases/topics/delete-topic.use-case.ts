import { TopicNotFoundError } from '../../../domain/study';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';

export class DeleteTopicUseCase {
  constructor(private readonly topicRepo: TopicRepositoryPort) {}

  async execute(topicId: string, userId: string): Promise<void> {
    const result = await this.topicRepo.findByIdWithOwnership(topicId, userId);
    if (!result) {
      throw new TopicNotFoundError(topicId);
    }

    if (result.planUserId !== userId) {
      throw new TopicNotFoundError(topicId);
    }

    await this.topicRepo.delete(topicId);
  }
}
