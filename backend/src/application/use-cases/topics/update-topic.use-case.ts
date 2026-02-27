import { Topic, TopicNotFoundError } from '../../../domain/study';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';

export interface UpdateTopicInput {
  name?: string;
  description?: string | null;
  masteryLevel?: number;
  displayOrder?: number;
}

export class UpdateTopicUseCase {
  constructor(private readonly topicRepo: TopicRepositoryPort) {}

  async execute(topicId: string, userId: string, input: UpdateTopicInput): Promise<Topic> {
    const result = await this.topicRepo.findByIdWithOwnership(topicId, userId);
    if (!result) {
      throw new TopicNotFoundError(topicId);
    }

    if (result.subject.studyPlan.userId !== userId) {
      throw new TopicNotFoundError(topicId);
    }

    const topic = result.topic;
    topic.update({
      name: input.name,
      description: input.description,
      masteryLevel: input.masteryLevel,
      displayOrder: input.displayOrder,
    });

    return this.topicRepo.update(topic);
  }
}
