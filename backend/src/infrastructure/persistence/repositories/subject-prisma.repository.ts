import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubjectMapper } from '../mappers/subject.mapper';
import {
  SubjectRepositoryPort,
  SubjectWithTopics,
  SubjectWithDetails,
} from '../../../application/ports/subject-repository.port';
import { Subject } from '../../../domain/study';

@Injectable()
export class SubjectPrismaRepository implements SubjectRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByPlanId(
    planId: string,
    userId: string,
  ): Promise<SubjectWithTopics[]> {
    const subjects = await this.prisma.subject.findMany({
      where: {
        studyPlanId: planId,
        studyPlan: { userId },
      },
      include: {
        topics: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return subjects.map((subject) => ({
      subject: SubjectMapper.toDomain(subject),
      topics: subject.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        status: topic.status,
        masteryLevel: topic.masteryLevel,
        systemMasteryLevel: topic.systemMasteryLevel,
        displayOrder: topic.displayOrder,
      })),
    }));
  }

  async findByIdWithOwnership(
    id: string,
    userId: string,
  ): Promise<SubjectWithDetails | null> {
    const subject = await this.prisma.subject.findFirst({
      where: { id },
      include: {
        studyPlan: { select: { userId: true, name: true } },
        topics: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!subject) return null;

    return {
      subject: SubjectMapper.toDomain(subject),
      planName: subject.studyPlan.name,
      planUserId: subject.studyPlan.userId,
      topics: subject.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        status: topic.status,
        masteryLevel: topic.masteryLevel,
        systemMasteryLevel: topic.systemMasteryLevel,
        displayOrder: topic.displayOrder,
      })),
    };
  }

  async verifyPlanOwnership(
    planId: string,
    userId: string,
  ): Promise<boolean> {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { id: planId, userId },
      select: { id: true },
    });
    return plan !== null;
  }

  async save(subject: Subject): Promise<Subject> {
    const data = SubjectMapper.toPersistence(subject);
    const created = await this.prisma.subject.create({ data });
    return SubjectMapper.toDomain(created);
  }

  async update(subject: Subject): Promise<Subject> {
    const data = SubjectMapper.toPersistence(subject);
    const updated = await this.prisma.subject.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        displayOrder: data.displayOrder,
        updatedAt: data.updatedAt,
      },
    });
    return SubjectMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.subject.delete({
      where: { id },
    });
  }
}
