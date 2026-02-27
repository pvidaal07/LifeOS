import { StudyPlanNotFoundError } from '../../../domain/study';
import { StudyPlanRepositoryPort, StudyPlanWithFullDetails } from '../../ports/study-plan-repository.port';

export class GetPlanUseCase {
  constructor(private readonly planRepo: StudyPlanRepositoryPort) {}

  async execute(planId: string, userId: string): Promise<StudyPlanWithFullDetails> {
    const result = await this.planRepo.findByIdAndUserId(planId, userId);
    if (!result) {
      throw new StudyPlanNotFoundError(planId);
    }

    return result;
  }
}
