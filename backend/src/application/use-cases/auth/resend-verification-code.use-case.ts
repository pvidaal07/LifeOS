import { UserRepositoryPort } from '../../ports/user-repository.port';
import {
  EmailVerificationSenderPort,
  EmailVerificationConfig,
} from '../../ports/email-verification.port';
import {
  VerificationCodeCooldownError,
  VerificationCodeInvalidError,
  VerificationDeliveryError,
} from '../../../domain/user';
import { generateVerificationCode, maskEmail } from './email-verification.utils';
import { PasswordHasherPort } from '../../ports/auth.port';

export interface ResendVerificationCodeInput {
  email: string;
}

export interface ResendVerificationCodeOutput {
  requiresVerification: true;
  emailMasked: string;
  cooldownSeconds: number;
  verificationExpiresAt: Date;
}

export class ResendVerificationCodeUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly verificationSender: EmailVerificationSenderPort,
    private readonly verificationConfig: EmailVerificationConfig,
  ) {}

  async execute(
    input: ResendVerificationCodeInput,
  ): Promise<ResendVerificationCodeOutput> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user || user.emailVerified) {
      throw new VerificationCodeInvalidError();
    }

    const resendStatus = user.canResendVerificationCode(
      this.verificationConfig.resendCooldownSeconds,
    );
    if (!resendStatus.allowed) {
      throw new VerificationCodeCooldownError(resendStatus.remainingSeconds);
    }

    const code = generateVerificationCode(this.verificationConfig.codeLength);
    const verificationCodeHash = await this.passwordHasher.hash(code);
    const verificationExpiresAt = new Date(
      Date.now() + this.verificationConfig.expiresInMinutes * 60 * 1000,
    );

    user.setVerificationCode({
      codeHash: verificationCodeHash,
      expiresAt: verificationExpiresAt,
      sentAt: new Date(),
      incrementResendCount: true,
    });
    await this.userRepo.update(user);

    try {
      await this.verificationSender.sendVerificationCode({
        toEmail: user.email,
        name: user.name,
        code,
        expiresInMinutes: this.verificationConfig.expiresInMinutes,
      });
    } catch {
      throw new VerificationDeliveryError();
    }

    return {
      requiresVerification: true,
      emailMasked: maskEmail(user.email),
      cooldownSeconds: this.verificationConfig.resendCooldownSeconds,
      verificationExpiresAt,
    };
  }
}
