import { StudySession } from '../../domain/study';

export interface SessionRepositoryPort {
  save(session: StudySession): Promise<StudySessionWithDetails>;
  findByTopicId(topicId: string, userId: string): Promise<StudySessionWithDetails[]>;
  findRecentByUserId(userId: string, limit: number): Promise<StudySessionWithDetails[]>;
  countTodayByUserId(userId: string): Promise<number>;
  getWeekStats(userId: string): Promise<WeekStats>;
  findRecentWithDetails(userId: string, limit: number): Promise<StudySessionWithDetails[]>;
}

export interface StudySessionWithDetails {
  session: StudySession;
  topicName: string;
  subjectName: string;
  subjectColor: string;
}

export interface WeekStats {
  sessionsCompleted: number;
  totalMinutes: number;
}
