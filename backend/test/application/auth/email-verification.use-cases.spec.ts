import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  RegisterUseCase,
  LoginUseCase,
  VerifyEmailUseCase,
  ResendVerificationCodeUseCase,
  IssueVerificationCodeService,
} from '../../../src/application/use-cases/auth';
import { User } from '../../../src/domain/user';
import { InvalidCredentialsError } from '../../../src/domain/common';
import {
  EmailNotVerifiedError,
  VerificationCodeInvalidError,
  VerificationCodeExpiredError,
  VerificationCodeCooldownError,
} from '../../../src/domain/user';
import { UserInitializationService } from '../../../src/domain/user';
import {
  createMockUserRepository,
  createMockUserSettingsRepository,
  createMockUserModuleRepository,
  createMockPasswordHasher,
  createMockAuthToken,
} from '../../helpers/mock-factories';

describe('Email verification auth use-cases', () => {
  const verificationConfig = {
    codeLength: 6,
    expiresInMinutes: 15,
    resendCooldownSeconds: 60,
    maxAttempts: 5,
  };

  const mockSender = {
    sendVerificationCode: vi.fn(),
  };

  const clock = {
    now: vi.fn(() => new Date()),
  };

  const createUnverifiedUser = (params?: {
    sentAt?: Date;
    expiresAt?: Date;
  }) => {
    const sentAt = params?.sentAt ?? new Date();
    const expiresAt = params?.expiresAt ?? new Date(sentAt.getTime() + 5 * 60_000);
    const user = User.create({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      name: 'User',
    });
    user.setVerificationCode({
      codeHash: 'verification-hash',
      expiresAt,
      sentAt,
    });
    return user;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    clock.now.mockImplementation(() => new Date());
  });

  it('registers with pending verification metadata and no token pair', async () => {
    const userRepo = createMockUserRepository();
    const userSettingsRepo = createMockUserSettingsRepository();
    const userModuleRepo = createMockUserModuleRepository();
    const passwordHasher = createMockPasswordHasher();
    const userInit = new UserInitializationService();
    const issueVerificationCode = new IssueVerificationCodeService(
      passwordHasher,
      mockSender,
      verificationConfig,
      clock,
    );
    const useCase = new RegisterUseCase(
      userRepo,
      userSettingsRepo,
      userModuleRepo,
      passwordHasher,
      userInit,
      issueVerificationCode,
    );

    userRepo.existsByEmail.mockResolvedValue(false);
    userRepo.save.mockResolvedValue(undefined);
    userSettingsRepo.upsert.mockResolvedValue(undefined);
    userModuleRepo.upsertMany.mockResolvedValue(undefined);
    passwordHasher.hash
      .mockResolvedValueOnce('password-hash')
      .mockResolvedValueOnce('verification-code-hash');
    mockSender.sendVerificationCode.mockResolvedValue(undefined);

    const result = await useCase.execute({
      email: 'user@example.com',
      password: 'secret',
      name: 'User',
    });

    expect(result.requiresVerification).toBe(true);
    expect(result.emailMasked).toBe('us**@example.com');
    expect(result.cooldownSeconds).toBe(60);
    expect(result).toHaveProperty('verificationExpiresAt');
    expect(result).not.toHaveProperty('accessToken');
    expect(result).not.toHaveProperty('refreshToken');
    expect(mockSender.sendVerificationCode).toHaveBeenCalledOnce();
    expect(mockSender.sendVerificationCode).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: 'user@example.com',
        name: 'User',
      }),
    );
  });

  it('surfaces retriable registration delivery failures after persistence', async () => {
    const userRepo = createMockUserRepository();
    const userSettingsRepo = createMockUserSettingsRepository();
    const userModuleRepo = createMockUserModuleRepository();
    const passwordHasher = createMockPasswordHasher();
    const userInit = new UserInitializationService();
    const issueVerificationCode = new IssueVerificationCodeService(
      passwordHasher,
      mockSender,
      verificationConfig,
      clock,
    );
    const useCase = new RegisterUseCase(
      userRepo,
      userSettingsRepo,
      userModuleRepo,
      passwordHasher,
      userInit,
      issueVerificationCode,
    );

    userRepo.existsByEmail.mockResolvedValue(false);
    userRepo.save.mockResolvedValue(undefined);
    userSettingsRepo.upsert.mockResolvedValue(undefined);
    userModuleRepo.upsertMany.mockResolvedValue(undefined);
    passwordHasher.hash
      .mockResolvedValueOnce('password-hash')
      .mockResolvedValueOnce('verification-code-hash');
    mockSender.sendVerificationCode.mockRejectedValue(new Error('smtp timeout'));

    await expect(
      useCase.execute({
        email: 'user@example.com',
        password: 'secret',
        name: 'User',
      }),
    ).rejects.toMatchObject({
      code: 'VERIFICATION_DELIVERY_FAILED',
      details: { retriable: true },
    });

    expect(userRepo.save).toHaveBeenCalledOnce();
    expect(userSettingsRepo.upsert).toHaveBeenCalledOnce();
    expect(userModuleRepo.upsertMany).toHaveBeenCalledOnce();
  });

  it('blocks login when email is not verified', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const issueVerificationCode = new IssueVerificationCodeService(
      passwordHasher,
      mockSender,
      verificationConfig,
      clock,
    );
    const useCase = new LoginUseCase(
      userRepo,
      passwordHasher,
      authToken,
      issueVerificationCode,
      verificationConfig,
      clock,
    );
    const user = createUnverifiedUser({ sentAt: new Date(Date.now() - 90_000) });

    userRepo.findByEmail.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue('rotated-verification-hash');

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
      details: {
        requiresVerification: true,
        cooldownSeconds: verificationConfig.resendCooldownSeconds,
      },
    });

    expect(userRepo.update).toHaveBeenCalledOnce();
    expect(mockSender.sendVerificationCode).toHaveBeenCalledOnce();
    expect(authToken.generateTokenPair).not.toHaveBeenCalled();
  });

  it('keeps EMAIL_NOT_VERIFIED contract when login auto-send fails', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const issueVerificationCode = new IssueVerificationCodeService(
      passwordHasher,
      mockSender,
      verificationConfig,
      clock,
    );
    const useCase = new LoginUseCase(
      userRepo,
      passwordHasher,
      authToken,
      issueVerificationCode,
      verificationConfig,
      clock,
    );
    const user = createUnverifiedUser({ sentAt: new Date(Date.now() - 90_000) });

    userRepo.findByEmail.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);
    passwordHasher.hash.mockResolvedValue('rotated-verification-hash');
    mockSender.sendVerificationCode.mockRejectedValue(new Error('smtp timeout'));

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
      details: {
        requiresVerification: true,
        cooldownSeconds: verificationConfig.resendCooldownSeconds,
      },
    });

    expect(userRepo.update).toHaveBeenCalledOnce();
    expect(mockSender.sendVerificationCode).toHaveBeenCalledOnce();
    expect(authToken.generateTokenPair).not.toHaveBeenCalled();
  });

  it('does not auto-send on login while cooldown is active', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const issueVerificationCode = new IssueVerificationCodeService(
      passwordHasher,
      mockSender,
      verificationConfig,
      clock,
    );
    const useCase = new LoginUseCase(
      userRepo,
      passwordHasher,
      authToken,
      issueVerificationCode,
      verificationConfig,
      clock,
    );
    const now = new Date();
    const user = createUnverifiedUser({ sentAt: now });

    userRepo.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
      details: {
        requiresVerification: true,
      },
    });

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
    expect(mockSender.sendVerificationCode).not.toHaveBeenCalled();
    expect(authToken.generateTokenPair).not.toHaveBeenCalled();
  });

  it('keeps cooldown countdown monotonic across repeated unverified login attempts', async () => {
    vi.useFakeTimers();

    const now = new Date('2026-02-01T10:00:00.000Z');
    vi.setSystemTime(now);

    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const issueVerificationCode = new IssueVerificationCodeService(
      passwordHasher,
      mockSender,
      verificationConfig,
      clock,
    );
    const useCase = new LoginUseCase(
      userRepo,
      passwordHasher,
      authToken,
      issueVerificationCode,
      verificationConfig,
      clock,
    );
    const user = createUnverifiedUser({ sentAt: new Date(now.getTime() - 10_000) });

    userRepo.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);

    const firstError = await useCase
      .execute({ email: 'user@example.com', password: 'secret' })
      .catch((error) => error as EmailNotVerifiedError);

    vi.setSystemTime(new Date(now.getTime() + 5_000));

    const secondError = await useCase
      .execute({ email: 'user@example.com', password: 'secret' })
      .catch((error) => error as EmailNotVerifiedError);

    expect(firstError).toBeInstanceOf(EmailNotVerifiedError);
    expect(secondError).toBeInstanceOf(EmailNotVerifiedError);
    expect(secondError.details.cooldownSeconds).toBeLessThan(firstError.details.cooldownSeconds);
    expect(mockSender.sendVerificationCode).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
    expect(authToken.generateTokenPair).not.toHaveBeenCalled();
  });

  it('does not auto-send on login when credentials are invalid', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const issueVerificationCode = new IssueVerificationCodeService(
      passwordHasher,
      mockSender,
      verificationConfig,
      clock,
    );
    const useCase = new LoginUseCase(
      userRepo,
      passwordHasher,
      authToken,
      issueVerificationCode,
      verificationConfig,
      clock,
    );

    userRepo.findByEmail.mockResolvedValue(undefined);

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
    expect(mockSender.sendVerificationCode).not.toHaveBeenCalled();
    expect(authToken.generateTokenPair).not.toHaveBeenCalled();
  });

  it('verifies code and returns tokens', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const useCase = new VerifyEmailUseCase(userRepo, passwordHasher, authToken, verificationConfig, clock);
    const user = createUnverifiedUser();

    userRepo.findByEmail.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);
    authToken.generateTokenPair.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await useCase.execute({
      email: 'user@example.com',
      code: 'AB12CD',
    });

    expect(result.accessToken).toBe('access-token');
    expect(userRepo.update).toHaveBeenCalledOnce();
    expect(user.emailVerified).toBe(true);
  });

  it('increments attempts on invalid verification code', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const useCase = new VerifyEmailUseCase(userRepo, passwordHasher, authToken, verificationConfig, clock);
    const user = createUnverifiedUser();

    userRepo.findByEmail.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({ email: 'user@example.com', code: 'AB12CD' }),
    ).rejects.toBeInstanceOf(VerificationCodeInvalidError);

    expect(user.verificationAttempts).toBe(1);
    expect(userRepo.update).toHaveBeenCalledOnce();
  });

  it('fails verification when max attempts were reached', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const useCase = new VerifyEmailUseCase(userRepo, passwordHasher, authToken, verificationConfig, clock);
    const user = createUnverifiedUser();
    for (let i = 0; i < verificationConfig.maxAttempts; i += 1) {
      user.incrementVerificationAttempt();
    }

    userRepo.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({ email: 'user@example.com', code: 'AB12CD' }),
    ).rejects.toBeInstanceOf(VerificationCodeExpiredError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('fails verification when code is expired', async () => {
    const now = new Date('2026-02-01T10:00:00.000Z');
    const sentAt = new Date(now.getTime() - 30_000);
    const expiresAt = new Date(now.getTime() + 30_000);
    clock.now.mockReturnValue(expiresAt);

    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const useCase = new VerifyEmailUseCase(userRepo, passwordHasher, authToken, verificationConfig, clock);
    const user = createUnverifiedUser({ sentAt, expiresAt });

    userRepo.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({ email: 'user@example.com', code: 'AB12CD' }),
    ).rejects.toBeInstanceOf(VerificationCodeExpiredError);

    expect(passwordHasher.compare).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('treats timezone-offset expiry instants deterministically', async () => {
    const expiresAtWithOffset = new Date('2026-02-01T12:00:00.000+02:00');
    const sentAt = new Date('2026-02-01T11:55:00.000+02:00');
    const beforeExpiryUtc = new Date('2026-02-01T09:59:59.999Z');
    clock.now.mockReturnValue(beforeExpiryUtc);

    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const authToken = createMockAuthToken();
    const useCase = new VerifyEmailUseCase(userRepo, passwordHasher, authToken, verificationConfig, clock);
    const user = createUnverifiedUser({ sentAt, expiresAt: expiresAtWithOffset });

    userRepo.findByEmail.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);
    authToken.generateTokenPair.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await useCase.execute({
      email: 'user@example.com',
      code: 'AB12CD',
    });

    expect(result.accessToken).toBe('access-token');
    expect(userRepo.update).toHaveBeenCalledOnce();
  });

  it('prevents resend while cooldown is active', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const issueVerificationCode = new IssueVerificationCodeService(
      passwordHasher,
      mockSender,
      verificationConfig,
      clock,
    );
    const useCase = new ResendVerificationCodeUseCase(userRepo, issueVerificationCode);
    const user = createUnverifiedUser();

    userRepo.findByEmail.mockResolvedValue(user);

    await expect(
      useCase.execute({ email: 'user@example.com' }),
    ).rejects.toBeInstanceOf(VerificationCodeCooldownError);

    expect(mockSender.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('resends after cooldown and rotates verification metadata', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const issueVerificationCode = new IssueVerificationCodeService(
      passwordHasher,
      mockSender,
      verificationConfig,
      clock,
    );
    const useCase = new ResendVerificationCodeUseCase(userRepo, issueVerificationCode);

    const sentAt = new Date(Date.now() - 2 * 60_000);
    const originalExpiresAt = new Date(Date.now() + 60_000);
    const user = createUnverifiedUser({ sentAt, expiresAt: originalExpiresAt });
    const previousHash = user.verificationCodeHash;

    userRepo.findByEmail.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);
    passwordHasher.hash.mockResolvedValue('rotated-verification-hash');
    mockSender.sendVerificationCode.mockResolvedValue(undefined);

    const result = await useCase.execute({ email: 'user@example.com' });

    expect(result.requiresVerification).toBe(true);
    expect(result.cooldownSeconds).toBe(verificationConfig.resendCooldownSeconds);
    expect(result.verificationExpiresAt.getTime()).toBeGreaterThan(originalExpiresAt.getTime());
    expect(user.verificationCodeHash).toBe('rotated-verification-hash');
    expect(user.verificationCodeHash).not.toBe(previousHash);
    expect(user.verificationAttempts).toBe(0);
    expect(user.verificationResendCount).toBe(1);
    expect(mockSender.sendVerificationCode).toHaveBeenCalledWith(
      expect.objectContaining({ toEmail: 'user@example.com', name: 'User' }),
    );
  });
});
