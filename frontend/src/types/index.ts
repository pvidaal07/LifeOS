// ============================================
// LifeOS - Tipos TypeScript compartidos
// Reflejan los modelos de la API
// ============================================

// ─── Auth ────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface VerificationPendingResponse {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
  requiresVerification: true;
  emailMasked: string;
  cooldownSeconds: number;
  verificationExpiresAt: string;
}

export interface VerifyEmailResponse {
  user: User;
  accessToken: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface PendingVerificationContext {
  email: string;
  emailMasked: string;
  cooldownSeconds: number;
  verificationExpiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// ─── Settings ────────────────────────────────

export interface UserSettings {
  id: string;
  userId: string;
  timezone: string;
  theme: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserModule {
  id: string;
  userId: string;
  moduleKey: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: string;
  settings: UserSettings | null;
  modules: UserModule[];
}

// ─── Estudios ────────────────────────────────

export interface StudyPlan {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  displayOrder: number;
  subjects?: Subject[];
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  studyPlanId: string;
  name: string;
  description?: string;
  color: string;
  displayOrder: number;
  topics?: Topic[];
  _count?: { topics: number };
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  masteryLevel: number;
  systemMasteryLevel: number;
  status: 'not_started' | 'in_progress' | 'mastered';
  displayOrder: number;
  subject?: Subject;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  topicId: string;
  sessionType: 'first_time' | 'review' | 'practice';
  durationMinutes?: number;
  qualityRating?: number;
  notes?: string;
  studiedAt: string;
  topic?: Topic & { subject?: Pick<Subject, 'name' | 'color'> };
}

export type SessionHistoryEditableField = 'studiedAt' | 'qualityRating' | 'durationMinutes';

export interface EditSessionHistoryRequest {
  studiedAt?: string;
  durationMinutes?: number;
  qualityRating?: number;
}

// ─── Repasos ─────────────────────────────────

export interface ReviewSchedule {
  id: string;
  topicId: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'pending' | 'completed' | 'skipped';
  result?: ReviewResult;
  urgencyScore: number;
  intervalDays: number;
  reviewNumber: number;
  topic?: Topic & {
    subject?: Pick<Subject, 'name' | 'color'> & {
      studyPlan?: Pick<StudyPlan, 'id' | 'name'>;
    };
  };
}

export type ReviewResult = 'perfect' | 'good' | 'regular' | 'bad';

export type ReviewHistoryEditableField = 'completedDate' | 'result' | 'durationMinutes' | 'qualityRating';

export type HistoryTopicStatus = 'not_started' | 'in_progress' | 'mastered';

export interface EditReviewHistoryRequest {
  completedDate?: string;
  result?: ReviewResult;
  durationMinutes?: number;
  qualityRating?: number;
}

export interface HistoryRecomputeSummary {
  topicId: string;
  anchorReviewNumber: number;
  recomputedReviewCount: number;
  systemMastery: number;
  topicStatus: HistoryTopicStatus;
  sessionId?: string;
  reviewId?: string;
}

export interface CompleteReviewResponse {
  completedReview: ReviewSchedule;
  nextReview: ReviewSchedule | null;
}

export interface ReviewSettings {
  id: string;
  userId: string;
  baseIntervals: number[];
  perfectMultiplier: number;
  goodMultiplier: number;
  regularMultiplier: number;
  badReset: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard ───────────────────────────────

export interface DashboardData {
  reviews: {
    pending: ReviewSchedule[];
    count: number;
  };
  today: {
    sessionsCompleted: number;
  };
  week: {
    sessionsCompleted: number;
    totalMinutes: number;
  };
  recentActivity: StudySession[];
  topicStats: Record<string, number>;
  upcoming: ReviewSchedule[];
  weeklyTrend: WeeklyTrendItem[];
  streak: StreakData;
  subjectProgress: SubjectProgressItem[];
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

// ─── API Response wrapper ────────────────────

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}
