import { StudyPlanRepositoryPort, StudyPlanWithSubjects } from '../../ports/study-plan-repository.port';

export class GetPlansUseCase {
  constructor(private readonly planRepo: StudyPlanRepositoryPort) {}

  async execute(userId: string): Promise<StudyPlanWithSubjects[]> {
    return this.planRepo.findAllByUserId(userId);
  }
}
