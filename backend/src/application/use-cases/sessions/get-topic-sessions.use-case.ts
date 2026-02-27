import { SessionRepositoryPort, StudySessionWithDetails } from '../../ports/session-repository.port';

export class GetTopicSessionsUseCase {
  constructor(private readonly sessionRepo: SessionRepositoryPort) {}

  async execute(topicId: string, userId: string): Promise<StudySessionWithDetails[]> {
    return this.sessionRepo.findByTopicId(topicId, userId);
  }
}
