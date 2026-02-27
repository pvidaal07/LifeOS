import { SessionRepositoryPort, StudySessionWithDetails } from '../../ports/session-repository.port';

export class GetRecentSessionsUseCase {
  constructor(private readonly sessionRepo: SessionRepositoryPort) {}

  async execute(userId: string, limit: number = 10): Promise<StudySessionWithDetails[]> {
    return this.sessionRepo.findRecentByUserId(userId, limit);
  }
}
