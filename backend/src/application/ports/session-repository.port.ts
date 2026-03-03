import { StudySession } from '../../domain/study';
import { ReviewSchedule } from '../../domain/review';

export interface SessionRepositoryPort {
  save(session: StudySession): Promise<StudySessionWithDetails>;
  findByIdForOwner(id: string, userId: string): Promise<StudySession | null>;
  findByTopicId(topicId: string, userId: string): Promise<StudySessionWithDetails[]>;
  findTimelineByTopicId(topicId: string, userId: string): Promise<StudySession[]>;
  findRecentByUserId(userId: string, limit: number): Promise<StudySessionWithDetails[]>;
  countTodayByUserId(userId: string): Promise<number>;
  getWeekStats(userId: string): Promise<WeekStats>;
  findRecentWithDetails(userId: string, limit: number): Promise<StudySessionWithDetails[]>;
  editSessionAndReplaceTopicSuffix(
    params: SessionEditAndSuffixRecomputeParams,
  ): Promise<boolean>;
}

export interface SessionEditInput {
  studiedAt: Date;
  durationMinutes: number | null;
  qualityRating: number | null;
}

export interface SessionEditAndSuffixRecomputeParams {
  userId: string;
  sessionId: string;
  topicId: string;
  anchorReviewNumber: number;
  session: SessionEditInput;
  reviews: ReviewSchedule[];
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
