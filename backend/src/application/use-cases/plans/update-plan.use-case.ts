import { StudyPlan, StudyPlanNotFoundError, PlanStatus } from '../../../domain/study';
import { StudyPlanRepositoryPort } from '../../ports/study-plan-repository.port';

export interface UpdatePlanInput {
  name?: string;
  description?: string | null;
  status?: string;
  displayOrder?: number;
}

export class UpdatePlanUseCase {
  constructor(private readonly planRepo: StudyPlanRepositoryPort) {}

  async execute(planId: string, userId: string, input: UpdatePlanInput): Promise<StudyPlan> {
    const result = await this.planRepo.findByIdAndUserId(planId, userId);
    if (!result) {
      throw new StudyPlanNotFoundError(planId);
    }

    const plan = result.plan;
    plan.update({
      name: input.name,
      description: input.description,
      status: input.status ? PlanStatus.create(input.status) : undefined,
      displayOrder: input.displayOrder,
    });

    return this.planRepo.update(plan);
  }
}
