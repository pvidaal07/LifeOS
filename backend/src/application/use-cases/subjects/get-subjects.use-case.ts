import { StudyPlanNotFoundError } from '../../../domain/study';
import { SubjectRepositoryPort, SubjectWithTopics } from '../../ports/subject-repository.port';

export class GetSubjectsUseCase {
  constructor(private readonly subjectRepo: SubjectRepositoryPort) {}

  async execute(planId: string, userId: string): Promise<SubjectWithTopics[]> {
    // Verify plan ownership
    const isOwner = await this.subjectRepo.verifyPlanOwnership(planId, userId);
    if (!isOwner) {
      throw new StudyPlanNotFoundError(planId);
    }

    return this.subjectRepo.findAllByPlanId(planId, userId);
  }
}
