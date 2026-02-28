// ──────────────────────────────────────────────
// Injection tokens for Application-layer Use-Cases
// Usage: @Inject(USE_CASE_TOKENS.RegisterUseCase) private readonly uc: RegisterUseCase
// ──────────────────────────────────────────────

export const USE_CASE_TOKENS = {
  // ── Auth ──────────────────────────────────────
  RegisterUseCase: 'RegisterUseCase',
  LoginUseCase: 'LoginUseCase',
  RefreshTokensUseCase: 'RefreshTokensUseCase',

  // ── Users ─────────────────────────────────────
  GetProfileUseCase: 'GetProfileUseCase',
  UpdateProfileUseCase: 'UpdateProfileUseCase',
  UpdateSettingsUseCase: 'UpdateSettingsUseCase',
  UpdateModulesUseCase: 'UpdateModulesUseCase',
  GetActiveModulesUseCase: 'GetActiveModulesUseCase',

  // ── Study Plans ───────────────────────────────
  CreatePlanUseCase: 'CreatePlanUseCase',
  GetPlansUseCase: 'GetPlansUseCase',
  GetPlanUseCase: 'GetPlanUseCase',
  UpdatePlanUseCase: 'UpdatePlanUseCase',
  DeletePlanUseCase: 'DeletePlanUseCase',

  // ── Subjects ──────────────────────────────────
  CreateSubjectUseCase: 'CreateSubjectUseCase',
  GetSubjectsUseCase: 'GetSubjectsUseCase',
  GetSubjectUseCase: 'GetSubjectUseCase',
  UpdateSubjectUseCase: 'UpdateSubjectUseCase',
  DeleteSubjectUseCase: 'DeleteSubjectUseCase',

  // ── Topics ────────────────────────────────────
  CreateTopicUseCase: 'CreateTopicUseCase',
  GetTopicsUseCase: 'GetTopicsUseCase',
  GetTopicUseCase: 'GetTopicUseCase',
  UpdateTopicUseCase: 'UpdateTopicUseCase',
  DeleteTopicUseCase: 'DeleteTopicUseCase',

  // ── Sessions ──────────────────────────────────
  CreateSessionUseCase: 'CreateSessionUseCase',
  GetTopicSessionsUseCase: 'GetTopicSessionsUseCase',
  GetRecentSessionsUseCase: 'GetRecentSessionsUseCase',

  // ── Reviews ───────────────────────────────────
  GetPendingReviewsUseCase: 'GetPendingReviewsUseCase',
  GetUpcomingReviewsUseCase: 'GetUpcomingReviewsUseCase',
  CompleteReviewUseCase: 'CompleteReviewUseCase',
  SkipReviewUseCase: 'SkipReviewUseCase',
  RecalculateUrgencyUseCase: 'RecalculateUrgencyUseCase',
  GetReviewSettingsUseCase: 'GetReviewSettingsUseCase',
  UpdateReviewSettingsUseCase: 'UpdateReviewSettingsUseCase',

  // ── Inicio ─────────────────────────────────
  GetDashboardUseCase: 'GetDashboardUseCase',
} as const;
