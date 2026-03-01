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
  weeklyTrend: WeeklyTrendItem[];
  streak: StreakData;
  subjectProgress: SubjectProgressItem[];
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

export interface WeeklyTrendItem {
  date: string;
  totalMinutes: number;
  sessionCount: number;
}

export interface StreakData {
  currentStreak: number;
  studiedToday: boolean;
}

export interface SubjectProgressItem {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  mastered: number;
  inProgress: number;
  notStarted: number;
  total: number;
}
