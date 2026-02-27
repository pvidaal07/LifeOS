import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopicMapper } from '../mappers/topic.mapper';
import {
  TopicRepositoryPort,
  TopicWithFullDetails,
} from '../../../application/ports/topic-repository.port';
import { Topic } from '../../../domain/study';

@Injectable()
export class TopicPrismaRepository implements TopicRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAllBySubjectId(
    subjectId: string,
    userId: string,
  ): Promise<Topic[]> {
    const topics = await this.prisma.topic.findMany({
      where: {
        subjectId,
        subject: {
          studyPlan: { userId },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return topics.map(TopicMapper.toDomain);
  }

  async findByIdWithOwnership(
    id: string,
    userId: string,
  ): Promise<TopicWithFullDetails | null> {
    const topic = await this.prisma.topic.findFirst({
      where: { id },
      include: {
        subject: {
          include: {
            studyPlan: { select: { userId: true, name: true } },
          },
        },
        studySessions: {
          where: { userId },
          orderBy: { studiedAt: 'desc' },
          take: 10,
        },
        reviewSchedules: {
          where: { userId },
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!topic) return null;

    return {
      topic: TopicMapper.toDomain(topic),
      subject: {
        id: topic.subject.id,
        studyPlanId: topic.subject.studyPlanId,
        name: topic.subject.name,
        description: topic.subject.description,
        color: topic.subject.color,
        displayOrder: topic.subject.displayOrder,
        createdAt: topic.subject.createdAt,
        updatedAt: topic.subject.updatedAt,
        studyPlan: {
          userId: topic.subject.studyPlan.userId,
          name: topic.subject.studyPlan.name,
        },
      },
      studySessions: topic.studySessions.map((s) => ({
        id: s.id,
        topicId: s.topicId,
        userId: s.userId,
        sessionType: s.sessionType,
        durationMinutes: s.durationMinutes,
        qualityRating: s.qualityRating,
        notes: s.notes,
        studiedAt: s.studiedAt,
        createdAt: s.createdAt,
      })),
      reviewSchedules: topic.reviewSchedules.map((r) => ({
        id: r.id,
        topicId: r.topicId,
        userId: r.userId,
        scheduledDate: r.scheduledDate,
        completedDate: r.completedDate,
        status: r.status,
        result: r.result,
        urgencyScore: r.urgencyScore,
        intervalDays: r.intervalDays,
        reviewNumber: r.reviewNumber,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  async verifySubjectOwnership(
    subjectId: string,
    userId: string,
  ): Promise<boolean> {
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        studyPlan: { userId },
      },
      select: { id: true },
    });
    return subject !== null;
  }

  async save(topic: Topic): Promise<Topic> {
    const data = TopicMapper.toPersistence(topic);
    const created = await this.prisma.topic.create({ data });
    return TopicMapper.toDomain(created);
  }

  async update(topic: Topic): Promise<Topic> {
    const data = TopicMapper.toPersistence(topic);
    const updated = await this.prisma.topic.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        masteryLevel: data.masteryLevel,
        systemMasteryLevel: data.systemMasteryLevel,
        status: data.status,
        displayOrder: data.displayOrder,
        updatedAt: data.updatedAt,
      },
    });
    return TopicMapper.toDomain(updated);
  }

  async updateMastery(
    topicId: string,
    systemMasteryLevel: number,
    status: string,
  ): Promise<void> {
    await this.prisma.topic.update({
      where: { id: topicId },
      data: { systemMasteryLevel, status },
    });
  }

  async delete(id: string): Promise<Topic> {
    const record = await this.prisma.topic.findUnique({
      where: { id },
    });
    await this.prisma.topic.delete({
      where: { id },
    });
    return record ? TopicMapper.toDomain(record) : (undefined as unknown as Topic);
  }

  async countSessionsByTopicAndUser(
    topicId: string,
    userId: string,
  ): Promise<number> {
    return this.prisma.studySession.count({
      where: { topicId, userId },
    });
  }
}
