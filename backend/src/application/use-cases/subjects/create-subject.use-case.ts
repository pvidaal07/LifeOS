import { Subject, StudyPlanNotFoundError } from '../../../domain/study';
import { SubjectRepositoryPort } from '../../ports/subject-repository.port';

export interface CreateSubjectInput {
  planId: string;
  name: string;
  description?: string | null;
  color?: string;
}

export class CreateSubjectUseCase {
  constructor(private readonly subjectRepo: SubjectRepositoryPort) {}

  async execute(userId: string, input: CreateSubjectInput): Promise<Subject> {
    // Verify plan ownership via plan → user chain
    const isOwner = await this.subjectRepo.verifyPlanOwnership(input.planId, userId);
    if (!isOwner) {
      throw new StudyPlanNotFoundError(input.planId);
    }

    const subject = Subject.create({
      id: crypto.randomUUID(),
      studyPlanId: input.planId,
      name: input.name,
      description: input.description,
      color: input.color,
    });

    return this.subjectRepo.save(subject);
  }
}
