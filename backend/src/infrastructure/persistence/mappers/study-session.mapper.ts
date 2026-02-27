import { StudySession as PrismaStudySession } from '@prisma/client';
import { StudySession } from '../../../domain/study/entities/study-session.entity';
import { SessionType } from '../../../domain/study/value-objects/session-type.vo';

export class StudySessionMapper {
  static toDomain(prisma: PrismaStudySession): StudySession {
    return StudySession.fromPersistence({
      id: prisma.id,
      userId: prisma.userId,
      topicId: prisma.topicId,
      sessionType: SessionType.create(prisma.sessionType),
      durationMinutes: prisma.durationMinutes,
      qualityRating: prisma.qualityRating,
      notes: prisma.notes,
      studiedAt: prisma.studiedAt,
      createdAt: prisma.createdAt,
    });
  }

  static toPersistence(domain: StudySession): {
    id: string;
    userId: string;
    topicId: string;
    sessionType: string;
    durationMinutes: number | null;
    qualityRating: number | null;
    notes: string | null;
    studiedAt: Date;
    createdAt: Date;
  } {
    return {
      id: domain.id,
      userId: domain.userId,
      topicId: domain.topicId,
      sessionType: domain.sessionType.value,
      durationMinutes: domain.durationMinutes,
      qualityRating: domain.qualityRating,
      notes: domain.notes,
      studiedAt: domain.studiedAt,
      createdAt: domain.createdAt,
    };
  }
}
