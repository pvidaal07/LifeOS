import { Topic } from '../../../domain/study';
import { SubjectNotFoundError } from '../../../domain/study';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';

export interface CreateTopicInput {
  subjectId: string;
  name: string;
  description?: string | null;
}

export class CreateTopicUseCase {
  constructor(private readonly topicRepo: TopicRepositoryPort) {}

  async execute(userId: string, input: CreateTopicInput): Promise<Topic> {
    // Verify subject ownership via subject → plan → user chain
    const isOwner = await this.topicRepo.verifySubjectOwnership(input.subjectId, userId);
    if (!isOwner) {
      throw new SubjectNotFoundError(input.subjectId);
    }

    const topic = Topic.create({
      id: crypto.randomUUID(),
      subjectId: input.subjectId,
      name: input.name,
      description: input.description,
    });

    const saved = await this.topicRepo.save(topic);
    return saved;
  }
}
