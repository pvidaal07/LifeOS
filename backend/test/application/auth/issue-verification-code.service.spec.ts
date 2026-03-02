import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IssueVerificationCodeService,
} from '../../../src/application/use-cases/auth/issue-verification-code.service';
import { User, VerificationCodeCooldownError, VerificationDeliveryError } from '../../../src/domain/user';

describe('IssueVerificationCodeService', () => {
  const verificationConfig = {
    codeLength: 6,
    expiresInMinutes: 15,
    resendCooldownSeconds: 60,
    maxAttempts: 5,
  };

  const passwordHasher = {
    hash: vi.fn(),
    compare: vi.fn(),
  };

  const sender = {
    sendVerificationCode: vi.fn(),
  };

  const createUser = () =>
    User.create({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      name: 'User',
    });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('issues and dispatches verification in strict mode', async () => {
    const service = new IssueVerificationCodeService(passwordHasher, sender, verificationConfig);
    const user = createUser();
    const persistVerificationState = vi.fn().mockResolvedValue(undefined);

    passwordHasher.hash.mockResolvedValue('verification-hash');
    sender.sendVerificationCode.mockResolvedValue(undefined);

    const result = await service.execute({
      user,
      mode: 'strict',
      persistVerificationState,
    });

    expect(result.cooldownSeconds).toBe(verificationConfig.resendCooldownSeconds);
    expect(result.deliveryAttempted).toBe(true);
    expect(result.deliverySucceeded).toBe(true);
    expect(result.verificationExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(persistVerificationState).toHaveBeenCalledWith(user);
    expect(sender.sendVerificationCode).toHaveBeenCalledOnce();
  });

  it('keeps flow alive in best-effort mode when sender fails', async () => {
    const service = new IssueVerificationCodeService(passwordHasher, sender, verificationConfig);
    const user = createUser();
    const persistVerificationState = vi.fn().mockResolvedValue(undefined);

    passwordHasher.hash.mockResolvedValue('verification-hash');
    sender.sendVerificationCode.mockRejectedValue(new Error('smtp timeout'));

    const result = await service.execute({
      user,
      mode: 'best-effort',
      persistVerificationState,
      incrementResendCount: true,
    });

    expect(result.deliveryAttempted).toBe(true);
    expect(result.deliverySucceeded).toBe(false);
    expect(user.verificationResendCount).toBe(1);
    expect(persistVerificationState).toHaveBeenCalledWith(user);
  });

  it('throws delivery error in strict mode when sender fails', async () => {
    const service = new IssueVerificationCodeService(passwordHasher, sender, verificationConfig);
    const user = createUser();
    const persistVerificationState = vi.fn().mockResolvedValue(undefined);

    passwordHasher.hash.mockResolvedValue('verification-hash');
    sender.sendVerificationCode.mockRejectedValue(new Error('smtp timeout'));

    await expect(
      service.execute({
        user,
        mode: 'strict',
        persistVerificationState,
      }),
    ).rejects.toBeInstanceOf(VerificationDeliveryError);

    expect(persistVerificationState).toHaveBeenCalledWith(user);
  });

  it('enforces cooldown when requested', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-02-01T10:00:00.000Z');
    vi.setSystemTime(now);

    const service = new IssueVerificationCodeService(passwordHasher, sender, verificationConfig);
    const user = createUser();
    user.setVerificationCode({
      codeHash: 'old-hash',
      expiresAt: new Date(now.getTime() + 5 * 60_000),
      sentAt: now,
    });

    await expect(
      service.execute({
        user,
        mode: 'strict',
        enforceCooldown: true,
        persistVerificationState: vi.fn(),
        now,
      }),
    ).rejects.toBeInstanceOf(VerificationCodeCooldownError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(sender.sendVerificationCode).not.toHaveBeenCalled();
  });
});
