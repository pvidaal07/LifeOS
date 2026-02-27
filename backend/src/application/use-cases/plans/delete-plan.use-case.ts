import { StudyPlan, StudyPlanNotFoundError } from '../../../domain/study';
import { StudyPlanRepositoryPort } from '../../ports/study-plan-repository.port';

export class DeletePlanUseCase {
  constructor(private readonly planRepo: StudyPlanRepositoryPort) {}

  async execute(planId: string, userId: string): Promise<StudyPlan> {
    const result = await this.planRepo.findByIdAndUserId(planId, userId);
    if (!result) {
      throw new StudyPlanNotFoundError(planId);
    }

    // Return the deleted plan so controller can send it in the response
    return this.planRepo.delete(planId, userId);
  }
}
