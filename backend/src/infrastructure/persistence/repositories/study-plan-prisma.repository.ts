import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudyPlanMapper } from '../mappers/study-plan.mapper';
import {
  StudyPlanRepositoryPort,
  StudyPlanWithSubjects,
  StudyPlanWithFullDetails,
} from '../../../application/ports/study-plan-repository.port';
import { StudyPlan } from '../../../domain/study';

@Injectable()
export class StudyPlanPrismaRepository implements StudyPlanRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: string): Promise<StudyPlanWithSubjects[]> {
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
      subjects: plan.subjects.map((s) => ({
        id: s.id,
        studyPlanId: s.studyPlanId,
        name: s.name,
        description: s.description,
        color: s.color,
        displayOrder: s.displayOrder,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        _count: { topics: s._count.topics },
      })),
    }));
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<StudyPlanWithFullDetails | null> {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { id, userId },
      include: {
        subjects: {
          include: {
            topics: {
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!plan) return null;

    return {
      plan: StudyPlanMapper.toDomain(plan),
      subjects: plan.subjects.map((s) => ({
        id: s.id,
        studyPlanId: s.studyPlanId,
        name: s.name,
        description: s.description,
        color: s.color,
        displayOrder: s.displayOrder,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        topics: s.topics.map((t) => ({
          id: t.id,
          subjectId: t.subjectId,
          name: t.name,
          description: t.description,
          masteryLevel: t.masteryLevel,
          systemMasteryLevel: t.systemMasteryLevel,
          status: t.status,
          displayOrder: t.displayOrder,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
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

  async delete(id: string, userId: string): Promise<StudyPlan> {
    const record = await this.prisma.studyPlan.findFirst({
      where: { id, userId },
    });
    if (record) {
      await this.prisma.studyPlan.deleteMany({
        where: { id, userId },
      });
      return StudyPlanMapper.toDomain(record);
    }
    // If not found, use deleteMany which won't throw
    await this.prisma.studyPlan.deleteMany({
      where: { id, userId },
    });
    // Return a dummy — the use-case checks existence before calling delete
    return undefined as unknown as StudyPlan;
  }
}
