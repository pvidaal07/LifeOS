import { SubjectNotFoundError } from '../../../domain/study';
import { SubjectRepositoryPort, SubjectWithFullDetails } from '../../ports/subject-repository.port';

export class GetSubjectUseCase {
  constructor(private readonly subjectRepo: SubjectRepositoryPort) {}

  async execute(subjectId: string, userId: string): Promise<SubjectWithFullDetails> {
    const result = await this.subjectRepo.findByIdWithOwnership(subjectId, userId);
    if (!result) {
      throw new SubjectNotFoundError(subjectId);
    }

    // Verify ownership through plan → user chain
    if (result.studyPlan.userId !== userId) {
      throw new SubjectNotFoundError(subjectId);
    }

    return result;
  }
}
