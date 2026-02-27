import { Subject, SubjectNotFoundError } from '../../../domain/study';
import { SubjectRepositoryPort } from '../../ports/subject-repository.port';

export class DeleteSubjectUseCase {
  constructor(private readonly subjectRepo: SubjectRepositoryPort) {}

  async execute(subjectId: string, userId: string): Promise<Subject> {
    const result = await this.subjectRepo.findByIdWithOwnership(subjectId, userId);
    if (!result) {
      throw new SubjectNotFoundError(subjectId);
    }

    if (result.studyPlan.userId !== userId) {
      throw new SubjectNotFoundError(subjectId);
    }

    return this.subjectRepo.delete(subjectId);
  }
}
