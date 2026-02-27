import { StudyPlanNotFoundError } from '../../../domain/study';
import { StudyPlanRepositoryPort } from '../../ports/study-plan-repository.port';

export class DeletePlanUseCase {
  constructor(private readonly planRepo: StudyPlanRepositoryPort) {}

  async execute(planId: string, userId: string): Promise<void> {
    const result = await this.planRepo.findByIdAndUserId(planId, userId);
    if (!result) {
      throw new StudyPlanNotFoundError(planId);
    }

    await this.planRepo.delete(planId, userId);
  }
}
