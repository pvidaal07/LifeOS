import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudySessionMapper } from '../mappers/study-session.mapper';
import {
  SessionRepositoryPort,
  StudySessionWithDetails,
  WeekStats,
} from '../../../application/ports/session-repository.port';
import { StudySession } from '../../../domain/study';

@Injectable()
export class SessionPrismaRepository implements SessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(session: StudySession): Promise<StudySessionWithDetails> {
    const data = StudySessionMapper.toPersistence(session);
    const created = await this.prisma.studySession.create({
      data,
      include: {
        topic: {
          include: {
            subject: { select: { name: true, color: true } },
          },
        },
      },
    });

    return {
      session: StudySessionMapper.toDomain(created),
      topicName: created.topic.name,
      subjectName: created.topic.subject.name,
      subjectColor: created.topic.subject.color,
    };
  }

  async findByTopicId(
    topicId: string,
    userId: string,
  ): Promise<StudySessionWithDetails[]> {
    const sessions = await this.prisma.studySession.findMany({
      where: { topicId, userId },
      include: {
        topic: {
          include: {
            subject: { select: { name: true, color: true } },
          },
        },
      },
      orderBy: { studiedAt: 'desc' },
    });

    return sessions.map((s) => ({
      session: StudySessionMapper.toDomain(s),
      topicName: s.topic.name,
      subjectName: s.topic.subject.name,
      subjectColor: s.topic.subject.color,
    }));
  }

  async findRecentByUserId(
    userId: string,
    limit: number,
  ): Promise<StudySessionWithDetails[]> {
    const sessions = await this.prisma.studySession.findMany({
      where: { userId },
      include: {
        topic: {
          include: {
            subject: { select: { name: true, color: true } },
          },
        },
      },
      orderBy: { studiedAt: 'desc' },
      take: limit,
    });

    return sessions.map((s) => ({
      session: StudySessionMapper.toDomain(s),
      topicName: s.topic.name,
      subjectName: s.topic.subject.name,
      subjectColor: s.topic.subject.color,
    }));
  }

  async countTodayByUserId(userId: string): Promise<number> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return this.prisma.studySession.count({
      where: {
        userId,
        studiedAt: { gte: startOfToday },
      },
    });
  }

  async getWeekStats(userId: string): Promise<WeekStats> {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const stats = await this.prisma.studySession.aggregate({
      where: {
        userId,
        studiedAt: { gte: startOfWeek },
      },
      _count: true,
      _sum: { durationMinutes: true },
    });

    return {
      sessionsCompleted: stats._count,
      totalMinutes: stats._sum.durationMinutes || 0,
    };
  }

  async findRecentWithDetails(
    userId: string,
    limit: number,
  ): Promise<StudySessionWithDetails[]> {
    return this.findRecentByUserId(userId, limit);
  }
}
