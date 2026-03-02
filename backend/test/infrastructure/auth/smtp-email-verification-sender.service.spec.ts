import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { SmtpEmailVerificationSenderService } from '../../../src/infrastructure/auth/services/smtp-email-verification-sender.service';

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(),
}));

describe('SmtpEmailVerificationSenderService', () => {
  const configValues = {
    'emailVerification.smtp.host': 'smtp.example.com',
    'emailVerification.smtp.port': 587,
    'emailVerification.smtp.user': 'smtp-user',
    'emailVerification.smtp.pass': 'smtp-pass',
    'emailVerification.smtp.from': 'no-reply@example.com',
    'emailVerification.smtp.secure': undefined,
    'emailVerification.smtp.connectionTimeoutMs': 10_000,
    'emailVerification.smtp.sendTimeoutMs': 8_000,
    'emailVerification.template.brandName': 'LifeOS',
    'emailVerification.template.appUrl': 'https://app.lifeos.test',
    'emailVerification.template.supportEmail': 'support@lifeos.test',
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends verification email through nodemailer transporter', async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);
    vi.mocked(createTransport).mockReturnValue({
      sendMail,
    } as never);

    const configService = {
      get: vi.fn((key: keyof typeof configValues) => configValues[key]),
    } as unknown as ConfigService;

    const service = new SmtpEmailVerificationSenderService(configService);

    await service.sendVerificationCode({
      toEmail: 'user@example.com',
      name: 'User',
      code: 'A1B2C3',
      expiresInMinutes: 15,
    });

    expect(createTransport).toHaveBeenCalledOnce();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'no-reply@example.com',
        to: 'user@example.com',
        subject: 'LifeOS - Codigo de verificacion',
        text: expect.stringContaining('A1B2C3'),
        html: expect.stringContaining('<html'),
      }),
    );

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('https://app.lifeos.test'),
        html: expect.stringContaining('support@lifeos.test'),
      }),
    );
  });

  it('rethrows transport send errors', async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error('socket timeout'));
    vi.mocked(createTransport).mockReturnValue({
      sendMail,
    } as never);

    const configService = {
      get: vi.fn((key: keyof typeof configValues) => configValues[key]),
    } as unknown as ConfigService;

    const service = new SmtpEmailVerificationSenderService(configService);

    await expect(
      service.sendVerificationCode({
        toEmail: 'user@example.com',
        name: 'User',
        code: 'A1B2C3',
        expiresInMinutes: 15,
      }),
    ).rejects.toThrow('SMTP email verification delivery failed');
  });
});
