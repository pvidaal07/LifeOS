import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudyPlanMapper } from '../mappers/study-plan.mapper';
import {
  StudyPlanRepositoryPort,
  StudyPlanWithCounts,
  StudyPlanWithDetails,
} from '../../../application/ports/study-plan-repository.port';
import { StudyPlan } from '../../../domain/study';

@Injectable()
export class StudyPlanPrismaRepository implements StudyPlanRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: string): Promise<StudyPlanWithCounts[]> {
    const plans = await this.prisma.studyPlan.findMany({
      where: { userId },
      include: {
        subjects: {
          include: {
            _count: { select: { topics: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return plans.map((plan) => ({
      plan: StudyPlanMapper.toDomain(plan),
      subjectCount: plan.subjects.length,
      topicCount: plan.subjects.reduce(
        (sum, subject) => sum + subject._count.topics,
        0,
      ),
    }));
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<StudyPlanWithDetails | null> {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { id, userId },
      include: {
        subjects: {
          include: {
            _count: { select: { topics: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!plan) return null;

    return {
      plan: StudyPlanMapper.toDomain(plan),
      subjects: plan.subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        color: subject.color,
        displayOrder: subject.displayOrder,
        topicCount: subject._count.topics,
      })),
    };
  }

  async save(plan: StudyPlan): Promise<StudyPlan> {
    const data = StudyPlanMapper.toPersistence(plan);
    const created = await this.prisma.studyPlan.create({ data });
    return StudyPlanMapper.toDomain(created);
  }

  async update(plan: StudyPlan): Promise<StudyPlan> {
    const data = StudyPlanMapper.toPersistence(plan);
    const updated = await this.prisma.studyPlan.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        displayOrder: data.displayOrder,
        updatedAt: data.updatedAt,
      },
    });
    return StudyPlanMapper.toDomain(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.studyPlan.deleteMany({
      where: { id, userId },
    });
  }
}
