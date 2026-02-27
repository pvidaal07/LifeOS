import { ReviewScheduleWithTopic } from './review-repository.port';
import { StudySessionWithDetails, WeekStats } from './session-repository.port';

export interface DashboardRepositoryPort {
  getDashboardData(userId: string): Promise<DashboardData>;
}

export interface DashboardData {
  pendingReviews: ReviewScheduleWithTopic[];
  pendingReviewCount: number;
  todaySessionsCompleted: number;
  weekStats: WeekStats;
  recentActivity: StudySessionWithDetails[];
  topicStats: TopicStats;
  upcomingReviews: UpcomingReview[];
}

export interface TopicStats {
  not_started: number;
  in_progress: number;
  mastered: number;
}

export interface UpcomingReview {
  id: string;
  scheduledDate: Date;
  topicName: string;
  subjectName: string;
  subjectColor: string;
}
