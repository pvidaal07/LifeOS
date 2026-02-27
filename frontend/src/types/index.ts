// ============================================
// LifeOS - Tipos TypeScript compartidos
// Reflejan los modelos de la API
// ============================================

// ─── Auth ────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
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

// ─── Settings ────────────────────────────────

export interface UserSettings {
  id: string;
  timezone: string;
  theme: string;
  locale: string;
}

export interface UserModule {
  id: string;
  moduleKey: string;
  isActive: boolean;
  displayOrder: number;
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

export interface CompleteReviewResponse {
  completedReview: ReviewSchedule;
  nextReview: ReviewSchedule | null;
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
}

// ─── API Response wrapper ────────────────────

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}
