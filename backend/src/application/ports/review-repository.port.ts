import { ReviewSchedule } from '../../domain/review';

export interface ReviewRepositoryPort {
  findPendingByUserId(userId: string, upToDate: Date): Promise<ReviewScheduleWithTopic[]>;
  findUpcomingByUserId(userId: string, afterDate: Date, limit?: number): Promise<ReviewScheduleWithTopic[]>;
  findPendingById(id: string, userId: string): Promise<ReviewSchedule | null>;
  findByIdForOwner(id: string, userId: string): Promise<ReviewSchedule | null>;
  findPendingByTopicId(topicId: string, userId: string): Promise<ReviewSchedule | null>;
  findTimelineByTopicId(topicId: string, userId: string): Promise<ReviewSchedule[]>;
  findCompletedByTopicId(topicId: string, userId: string): Promise<CompletedReviewData[]>;
  findAllPendingByUserId(userId: string): Promise<ReviewScheduleForUrgency[]>;
  replaceTopicSuffix(params: ReviewTopicSuffixWriteParams): Promise<void>;
  editReviewAndReplaceTopicSuffix(
    params: ReviewEditAndSuffixRecomputeParams,
  ): Promise<boolean>;
  save(review: ReviewSchedule): Promise<void>;
  updateMany(reviews: { id: string; urgencyScore: number }[]): Promise<void>;
}

export interface ReviewTopicSuffixWriteParams {
  userId: string;
  topicId: string;
  anchorReviewNumber: number;
  reviews: ReviewSchedule[];
}

export interface ReviewEditAndSuffixRecomputeParams {
  userId: string;
  reviewId: string;
  topicId: string;
  anchorReviewNumber: number;
  reviews: ReviewSchedule[];
  studySessionPatch?: ReviewStudySessionPatch;
}

export interface ReviewStudySessionPatch {
  matchStudiedAt: Date;
  studiedAt?: Date;
  durationMinutes?: number;
  qualityRating?: number;
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
