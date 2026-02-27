import { Topic } from '../../domain/study';

export interface TopicRepositoryPort {
  findAllBySubjectId(subjectId: string, userId: string): Promise<Topic[]>;
  findByIdWithOwnership(id: string, userId: string): Promise<TopicWithDetails | null>;
  verifySubjectOwnership(subjectId: string, userId: string): Promise<boolean>;
  save(topic: Topic): Promise<Topic>;
  update(topic: Topic): Promise<Topic>;
  updateMastery(topicId: string, systemMasteryLevel: number, status: string): Promise<void>;
  delete(id: string): Promise<void>;
  countSessionsByTopicAndUser(topicId: string, userId: string): Promise<number>;
}

export interface TopicWithDetails {
  topic: Topic;
  subjectName: string;
  subjectColor: string;
  planName: string;
  planUserId: string;
  recentSessions: SessionSummary[];
  recentReviews: ReviewSummary[];
}

export interface SessionSummary {
  id: string;
  sessionType: string;
  durationMinutes: number | null;
  qualityRating: number | null;
  studiedAt: Date;
}

export interface ReviewSummary {
  id: string;
  scheduledDate: Date;
  completedDate: Date | null;
  status: string;
  result: string | null;
}
