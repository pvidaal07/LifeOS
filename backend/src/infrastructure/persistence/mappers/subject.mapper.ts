import { Subject as PrismaSubject } from '@prisma/client';
import { Subject } from '../../../domain/study/entities/subject.entity';

export class SubjectMapper {
  static toDomain(prisma: PrismaSubject): Subject {
    return Subject.fromPersistence({
      id: prisma.id,
      studyPlanId: prisma.studyPlanId,
      name: prisma.name,
      description: prisma.description,
      color: prisma.color,
      displayOrder: prisma.displayOrder,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPersistence(domain: Subject): {
    id: string;
    studyPlanId: string;
    name: string;
    description: string | null;
    color: string;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: domain.id,
      studyPlanId: domain.studyPlanId,
      name: domain.name,
      description: domain.description,
      color: domain.color,
      displayOrder: domain.displayOrder,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
