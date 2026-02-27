import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TopicMapper } from '../mappers/topic.mapper';
import {
  TopicRepositoryPort,
  TopicWithDetails,
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
  ): Promise<TopicWithDetails | null> {
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
      subjectName: topic.subject.name,
      subjectColor: topic.subject.color,
      planName: topic.subject.studyPlan.name,
      planUserId: topic.subject.studyPlan.userId,
      recentSessions: topic.studySessions.map((session) => ({
        id: session.id,
        sessionType: session.sessionType,
        durationMinutes: session.durationMinutes,
        qualityRating: session.qualityRating,
        studiedAt: session.studiedAt,
      })),
      recentReviews: topic.reviewSchedules.map((review) => ({
        id: review.id,
        scheduledDate: review.scheduledDate,
        completedDate: review.completedDate,
        status: review.status,
        result: review.result,
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

  async delete(id: string): Promise<void> {
    await this.prisma.topic.delete({
      where: { id },
    });
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
