import { StudyPlan } from '../../../domain/study';
import { StudyPlanRepositoryPort } from '../../ports/study-plan-repository.port';

export interface CreatePlanInput {
  name: string;
  description?: string | null;
}

export class CreatePlanUseCase {
  constructor(private readonly planRepo: StudyPlanRepositoryPort) {}

  async execute(userId: string, input: CreatePlanInput): Promise<StudyPlan> {
    const plan = StudyPlan.create({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      description: input.description,
    });

    return this.planRepo.save(plan);
  }
}
