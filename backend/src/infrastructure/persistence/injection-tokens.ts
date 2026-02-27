// ──────────────────────────────────────────────
// Injection tokens for NestJS DI
// Maps application-layer port interfaces to concrete implementations.
// Usage: @Inject(STUDY_PLAN_REPOSITORY) private readonly repo: StudyPlanRepositoryPort
// ──────────────────────────────────────────────

// ── Study repositories ──────────────────────────
export const STUDY_PLAN_REPOSITORY = 'StudyPlanRepositoryPort';
export const SUBJECT_REPOSITORY = 'SubjectRepositoryPort';
export const TOPIC_REPOSITORY = 'TopicRepositoryPort';
export const SESSION_REPOSITORY = 'SessionRepositoryPort';

// ── Review repositories ─────────────────────────
export const REVIEW_REPOSITORY = 'ReviewRepositoryPort';
export const REVIEW_SETTINGS_REPOSITORY = 'ReviewSettingsRepositoryPort';

// ── User repositories ───────────────────────────
export const USER_REPOSITORY = 'UserRepositoryPort';
export const USER_SETTINGS_REPOSITORY = 'UserSettingsRepositoryPort';
export const USER_MODULE_REPOSITORY = 'UserModuleRepositoryPort';

// ── Auth adapters ───────────────────────────────
export const PASSWORD_HASHER = 'PasswordHasherPort';
export const AUTH_TOKEN = 'AuthTokenPort';

// ── Dashboard ───────────────────────────────────
export const DASHBOARD_REPOSITORY = 'DashboardRepositoryPort';
