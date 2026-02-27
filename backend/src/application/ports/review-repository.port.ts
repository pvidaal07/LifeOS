import { ReviewSchedule } from '../../domain/review';

export interface ReviewRepositoryPort {
  findPendingByUserId(userId: string, upToDate: Date): Promise<ReviewScheduleWithTopic[]>;
  findUpcomingByUserId(userId: string, afterDate: Date, limit?: number): Promise<ReviewScheduleWithTopic[]>;
  findPendingById(id: string, userId: string): Promise<ReviewSchedule | null>;
  findCompletedByTopicId(topicId: string): Promise<CompletedReviewData[]>;
  findAllPendingByUserId(userId: string): Promise<ReviewScheduleForUrgency[]>;
  save(review: ReviewSchedule): Promise<void>;
  updateMany(reviews: { id: string; urgencyScore: number }[]): Promise<void>;
}

/** Read-model types for queries that need JOINed data */

export interface ReviewScheduleWithTopic {
  review: ReviewSchedule;
  topicName: string;
  subjectName: string;
  subjectColor: string;
  planName: string;
}

export interface CompletedReviewData {
  result: string;
  intervalDays: number;
  completedDate: Date;
}

export interface ReviewScheduleForUrgency {
  id: string;
  scheduledDate: Date;
  intervalDays: number;
  topicMasteryLevel: number;
}
