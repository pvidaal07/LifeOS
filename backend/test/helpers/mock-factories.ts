/**
 * Mock factories for application-layer port interfaces.
 * Every repository/port used by use-cases gets a factory here
 * so individual test files stay DRY.
 */
import type { StudyPlanRepositoryPort } from '../../src/application/ports/study-plan-repository.port';
import type { ReviewRepositoryPort } from '../../src/application/ports/review-repository.port';
import type { ReviewSettingsRepositoryPort } from '../../src/application/ports/review-settings-repository.port';
import type { SessionRepositoryPort } from '../../src/application/ports/session-repository.port';
import type { TopicRepositoryPort } from '../../src/application/ports/topic-repository.port';
import type {
  UserRepositoryPort,
  UserSettingsRepositoryPort,
  UserModuleRepositoryPort,
} from '../../src/application/ports/user-repository.port';
import type { PasswordHasherPort, AuthTokenPort } from '../../src/application/ports/auth.port';

// ---------------------------------------------------------------------------
// Study Plan
// ---------------------------------------------------------------------------
export function createMockStudyPlanRepository(): {
  [K in keyof StudyPlanRepositoryPort]: ReturnType<typeof vi.fn>;
} {
  return {
    findAllByUserId: vi.fn(),
    findByIdAndUserId: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------
export function createMockReviewRepository(): {
  [K in keyof ReviewRepositoryPort]: ReturnType<typeof vi.fn>;
} {
  return {
    findPendingByUserId: vi.fn(),
    findUpcomingByUserId: vi.fn(),
    findPendingById: vi.fn(),
    findPendingByTopicId: vi.fn(),
    findCompletedByTopicId: vi.fn(),
    findAllPendingByUserId: vi.fn(),
    save: vi.fn(),
    updateMany: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Review Settings
// ---------------------------------------------------------------------------
export function createMockReviewSettingsRepository(): {
  [K in keyof ReviewSettingsRepositoryPort]: ReturnType<typeof vi.fn>;
} {
  return {
    findByUserId: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export function createMockSessionRepository(): {
  [K in keyof SessionRepositoryPort]: ReturnType<typeof vi.fn>;
} {
  return {
    save: vi.fn(),
    findByTopicId: vi.fn(),
    findRecentByUserId: vi.fn(),
    countTodayByUserId: vi.fn(),
    getWeekStats: vi.fn(),
    findRecentWithDetails: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Topic
// ---------------------------------------------------------------------------
export function createMockTopicRepository(): {
  [K in keyof TopicRepositoryPort]: ReturnType<typeof vi.fn>;
} {
  return {
    findAllBySubjectId: vi.fn(),
    findByIdWithOwnership: vi.fn(),
    verifySubjectOwnership: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    updateMastery: vi.fn(),
    delete: vi.fn(),
    countSessionsByTopicAndUser: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
export function createMockUserRepository(): {
  [K in keyof UserRepositoryPort]: ReturnType<typeof vi.fn>;
} {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByIdWithProfile: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    existsByEmail: vi.fn(),
  };
}

export function createMockUserSettingsRepository(): {
  [K in keyof UserSettingsRepositoryPort]: ReturnType<typeof vi.fn>;
} {
  return {
    findByUserId: vi.fn(),
    upsert: vi.fn(),
  };
}

export function createMockUserModuleRepository(): {
  [K in keyof UserModuleRepositoryPort]: ReturnType<typeof vi.fn>;
} {
  return {
    findActiveByUserId: vi.fn(),
    upsertMany: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Auth ports
// ---------------------------------------------------------------------------
export function createMockPasswordHasher(): {
  [K in keyof PasswordHasherPort]: ReturnType<typeof vi.fn>;
} {
  return {
    hash: vi.fn(),
    compare: vi.fn(),
  };
}

export function createMockAuthToken(): {
  [K in keyof AuthTokenPort]: ReturnType<typeof vi.fn>;
} {
  return {
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    generateTokenPair: vi.fn(),
  };
}
