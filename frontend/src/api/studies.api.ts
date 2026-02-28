import { apiClient } from './client';
import type {
  StudyPlan,
  Subject,
  Topic,
  StudySession,
  ReviewSchedule,
  ReviewSettings,
  CompleteReviewResponse,
  DashboardData,
  ApiResponse,
  ReviewResult,
} from '../types';

export const studiesApi = {
  // ─── Planes de estudio ─────────────────────
  getPlans: () =>
    apiClient.get<ApiResponse<StudyPlan[]>>('/studies/plans'),

  getPlan: (id: string) =>
    apiClient.get<ApiResponse<StudyPlan>>(`/studies/plans/${id}`),

  createPlan: (data: { name: string; description?: string }) =>
    apiClient.post<ApiResponse<StudyPlan>>('/studies/plans', data),

  updatePlan: (id: string, data: Partial<StudyPlan>) =>
    apiClient.patch<ApiResponse<StudyPlan>>(`/studies/plans/${id}`, data),

  deletePlan: (id: string) =>
    apiClient.delete(`/studies/plans/${id}`),

  // ─── Asignaturas ───────────────────────────
  getSubjects: (planId: string) =>
    apiClient.get<ApiResponse<Subject[]>>(`/studies/subjects?planId=${planId}`),

  createSubject: (data: { studyPlanId: string; name: string; description?: string; color?: string }) =>
    apiClient.post<ApiResponse<Subject>>('/studies/subjects', data),

  updateSubject: (id: string, data: Partial<Subject>) =>
    apiClient.patch<ApiResponse<Subject>>(`/studies/subjects/${id}`, data),

  deleteSubject: (id: string) =>
    apiClient.delete(`/studies/subjects/${id}`),

  // ─── Temas ─────────────────────────────────
  getTopics: (subjectId: string) =>
    apiClient.get<ApiResponse<Topic[]>>(`/studies/topics?subjectId=${subjectId}`),

  getTopic: (id: string) =>
    apiClient.get<ApiResponse<Topic>>(`/studies/topics/${id}`),

  createTopic: (data: { subjectId: string; name: string; description?: string }) =>
    apiClient.post<ApiResponse<Topic>>('/studies/topics', data),

  updateTopic: (id: string, data: Partial<Topic>) =>
    apiClient.patch<ApiResponse<Topic>>(`/studies/topics/${id}`, data),

  deleteTopic: (id: string) =>
    apiClient.delete(`/studies/topics/${id}`),

  // ─── Sesiones de estudio ───────────────────
  createSession: (data: {
    topicId: string;
    sessionType?: string;
    durationMinutes?: number;
    qualityRating?: number;
    notes?: string;
  }) =>
    apiClient.post<ApiResponse<StudySession>>('/studies/sessions', data),

  getSessionsByTopic: (topicId: string) =>
    apiClient.get<ApiResponse<StudySession[]>>(`/studies/sessions?topicId=${topicId}`),

  getRecentSessions: (limit: number = 10) =>
    apiClient.get<ApiResponse<StudySession[]>>(`/studies/sessions/recent?limit=${limit}`),

  // ─── Repasos ───────────────────────────────
  getPendingReviews: () =>
    apiClient.get<ApiResponse<ReviewSchedule[]>>('/studies/reviews/pending'),

  getUpcomingReviews: () =>
    apiClient.get<ApiResponse<ReviewSchedule[]>>('/studies/reviews/upcoming'),

  completeReview: (id: string, data: {
    result: ReviewResult;
    durationMinutes?: number;
    qualityRating?: number;
    notes?: string;
  }) =>
    apiClient.post<ApiResponse<CompleteReviewResponse>>(`/studies/reviews/${id}/complete`, data),

  skipReview: (id: string) =>
    apiClient.post<ApiResponse<ReviewSchedule>>(`/studies/reviews/${id}/skip`),

  getReviewSettings: () =>
    apiClient.get<ApiResponse<ReviewSettings>>('/studies/reviews/settings'),

  updateReviewSettings: (data: {
    baseIntervals?: number[];
    perfectMultiplier?: number;
    goodMultiplier?: number;
    regularMultiplier?: number;
    badReset?: boolean;
  }) =>
    apiClient.patch<ApiResponse<ReviewSettings>>('/studies/reviews/settings', data),

  // ─── Dashboard ─────────────────────────────
  getDashboard: () =>
    apiClient.get<ApiResponse<DashboardData>>('/dashboard'),
};
