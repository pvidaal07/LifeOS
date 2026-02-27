import { Subject, SubjectNotFoundError } from '../../../domain/study';
import { SubjectRepositoryPort } from '../../ports/subject-repository.port';

export interface UpdateSubjectInput {
  name?: string;
  description?: string | null;
  color?: string;
  displayOrder?: number;
}

export class UpdateSubjectUseCase {
  constructor(private readonly subjectRepo: SubjectRepositoryPort) {}

  async execute(subjectId: string, userId: string, input: UpdateSubjectInput): Promise<Subject> {
    const result = await this.subjectRepo.findByIdWithOwnership(subjectId, userId);
    if (!result) {
      throw new SubjectNotFoundError(subjectId);
    }

    if (result.studyPlan.userId !== userId) {
      throw new SubjectNotFoundError(subjectId);
    }

    const subject = result.subject;
    subject.update({
      name: input.name,
      description: input.description,
      color: input.color,
      displayOrder: input.displayOrder,
    });

    return this.subjectRepo.update(subject);
  }
}
