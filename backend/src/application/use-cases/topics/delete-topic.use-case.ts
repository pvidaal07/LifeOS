import { Topic, TopicNotFoundError } from '../../../domain/study';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';

export class DeleteTopicUseCase {
  constructor(private readonly topicRepo: TopicRepositoryPort) {}

  async execute(topicId: string, userId: string): Promise<Topic> {
    const result = await this.topicRepo.findByIdWithOwnership(topicId, userId);
    if (!result) {
      throw new TopicNotFoundError(topicId);
    }

    if (result.subject.studyPlan.userId !== userId) {
      throw new TopicNotFoundError(topicId);
    }

    return this.topicRepo.delete(topicId);
  }
}
