import { describe, expect, it } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { resolveEmailVerificationSender } from '../../../src/infrastructure/modules/auth.module';
import type { EmailVerificationSenderPort } from '../../../src/application/ports/email-verification.port';

function createSender(): EmailVerificationSenderPort {
  return {
    sendVerificationCode: async () => undefined,
  };
}

describe('resolveEmailVerificationSender', () => {
  it('selects smtp sender when transport is smtp', () => {
    const config = {
      get: () => 'smtp',
    } as unknown as ConfigService;
    const logSender = createSender();
    const smtpSender = createSender();

    const selected = resolveEmailVerificationSender(config, logSender, smtpSender);

    expect(selected).toBe(smtpSender);
  });

  it('selects log sender for log or missing transport', () => {
    const config = {
      get: () => 'log',
    } as unknown as ConfigService;
    const logSender = createSender();
    const smtpSender = createSender();

    const selected = resolveEmailVerificationSender(config, logSender, smtpSender);

    expect(selected).toBe(logSender);
  });
});
