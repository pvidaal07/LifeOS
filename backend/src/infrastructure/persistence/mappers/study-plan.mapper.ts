import { StudyPlan as PrismaStudyPlan } from '@prisma/client';
import { StudyPlan } from '../../../domain/study/entities/study-plan.entity';
import { PlanStatus } from '../../../domain/study/value-objects/plan-status.vo';

export class StudyPlanMapper {
  static toDomain(prisma: PrismaStudyPlan): StudyPlan {
    return StudyPlan.fromPersistence({
      id: prisma.id,
      userId: prisma.userId,
      name: prisma.name,
      description: prisma.description,
      status: PlanStatus.create(prisma.status),
      displayOrder: prisma.displayOrder,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPersistence(domain: StudyPlan): {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    status: string;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: domain.id,
      userId: domain.userId,
      name: domain.name,
      description: domain.description,
      status: domain.status.value,
      displayOrder: domain.displayOrder,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
