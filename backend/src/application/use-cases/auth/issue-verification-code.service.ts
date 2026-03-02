import { User, VerificationCodeCooldownError, VerificationDeliveryError } from '../../../domain/user';
import { PasswordHasherPort } from '../../ports/auth.port';
import {
  EmailVerificationConfig,
  EmailVerificationSenderPort,
} from '../../ports/email-verification.port';
import type { ClockPort } from '../../ports/clock.port';
import { generateVerificationCode } from './email-verification.utils';

export type VerificationDeliveryMode = 'strict' | 'best-effort';

export interface IssueVerificationCodeInput {
  user: User;
  mode: VerificationDeliveryMode;
  persistVerificationState: (user: User) => Promise<void>;
  incrementResendCount?: boolean;
  enforceCooldown?: boolean;
}

export interface IssueVerificationCodeOutput {
  cooldownSeconds: number;
  verificationExpiresAt: Date;
  deliveryAttempted: boolean;
  deliverySucceeded: boolean;
}

export class IssueVerificationCodeService {
  constructor(
    private readonly passwordHasher: PasswordHasherPort,
    private readonly verificationSender: EmailVerificationSenderPort,
    private readonly verificationConfig: EmailVerificationConfig,
    private readonly clock: ClockPort,
  ) {}

  async execute(input: IssueVerificationCodeInput): Promise<IssueVerificationCodeOutput> {
    const issuedAt = this.clock.now();

    if (input.enforceCooldown) {
      const resendStatus = input.user.canResendVerificationCode(
        this.verificationConfig.resendCooldownSeconds,
        issuedAt,
      );

      if (!resendStatus.allowed) {
        throw new VerificationCodeCooldownError(resendStatus.remainingSeconds);
      }
    }

    const code = generateVerificationCode(this.verificationConfig.codeLength);
    const verificationCodeHash = await this.passwordHasher.hash(code);
    const verificationExpiresAt = new Date(
      issuedAt.getTime() + this.verificationConfig.expiresInMinutes * 60 * 1000,
    );

    input.user.setVerificationCode({
      codeHash: verificationCodeHash,
      expiresAt: verificationExpiresAt,
      sentAt: issuedAt,
      incrementResendCount: input.incrementResendCount,
    });

    await input.persistVerificationState(input.user);

    let deliverySucceeded = true;
    try {
      await this.verificationSender.sendVerificationCode({
        toEmail: input.user.email,
        name: input.user.name,
        code,
        expiresInMinutes: this.verificationConfig.expiresInMinutes,
      });
    } catch {
      deliverySucceeded = false;
      if (input.mode === 'strict') {
        throw new VerificationDeliveryError();
      }
    }

    return {
      cooldownSeconds: this.verificationConfig.resendCooldownSeconds,
      verificationExpiresAt,
      deliveryAttempted: true,
      deliverySucceeded,
    };
  }
}
