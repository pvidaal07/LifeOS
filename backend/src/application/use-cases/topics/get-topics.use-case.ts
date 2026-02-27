import { Topic } from '../../../domain/study';
import { SubjectNotFoundError } from '../../../domain/study';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';

export class GetTopicsUseCase {
  constructor(private readonly topicRepo: TopicRepositoryPort) {}

  async execute(subjectId: string, userId: string): Promise<Topic[]> {
    // Verify subject ownership via subject → plan → user chain
    const isOwner = await this.topicRepo.verifySubjectOwnership(subjectId, userId);
    if (!isOwner) {
      throw new SubjectNotFoundError(subjectId);
    }

    return this.topicRepo.findAllBySubjectId(subjectId, userId);
  }
}
