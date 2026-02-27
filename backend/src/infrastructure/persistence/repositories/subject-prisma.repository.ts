import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubjectMapper } from '../mappers/subject.mapper';
import {
  SubjectRepositoryPort,
  SubjectWithRelations,
  SubjectWithFullDetails,
} from '../../../application/ports/subject-repository.port';
import { Subject } from '../../../domain/study';

@Injectable()
export class SubjectPrismaRepository implements SubjectRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByPlanId(
    planId: string,
    userId: string,
  ): Promise<SubjectWithRelations[]> {
    const subjects = await this.prisma.subject.findMany({
      where: {
        studyPlanId: planId,
        studyPlan: { userId },
      },
      include: {
        _count: { select: { topics: true } },
        topics: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return subjects.map((s) => ({
      subject: SubjectMapper.toDomain(s),
      _count: { topics: s._count.topics },
      topics: s.topics.map((t) => ({
        id: t.id,
        subjectId: t.subjectId,
        name: t.name,
        description: t.description,
        status: t.status,
        masteryLevel: t.masteryLevel,
        systemMasteryLevel: t.systemMasteryLevel,
        displayOrder: t.displayOrder,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    }));
  }

  async findByIdWithOwnership(
    id: string,
    userId: string,
  ): Promise<SubjectWithFullDetails | null> {
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
      studyPlan: {
        userId: subject.studyPlan.userId,
        name: subject.studyPlan.name,
      },
      topics: subject.topics.map((t) => ({
        id: t.id,
        subjectId: t.subjectId,
        name: t.name,
        description: t.description,
        status: t.status,
        masteryLevel: t.masteryLevel,
        systemMasteryLevel: t.systemMasteryLevel,
        displayOrder: t.displayOrder,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
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

  async delete(id: string): Promise<Subject> {
    const record = await this.prisma.subject.findUnique({
      where: { id },
    });
    await this.prisma.subject.delete({
      where: { id },
    });
    return record ? SubjectMapper.toDomain(record) : (undefined as unknown as Subject);
  }
}
