import { StudyPlanRepositoryPort, StudyPlanWithCounts } from '../../ports/study-plan-repository.port';

export class GetPlansUseCase {
  constructor(private readonly planRepo: StudyPlanRepositoryPort) {}

  async execute(userId: string): Promise<StudyPlanWithCounts[]> {
    return this.planRepo.findAllByUserId(userId);
  }
}
