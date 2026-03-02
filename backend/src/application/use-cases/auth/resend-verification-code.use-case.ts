import { UserRepositoryPort } from '../../ports/user-repository.port';
import {
  VerificationCodeInvalidError,
} from '../../../domain/user';
import { maskEmail } from './email-verification.utils';
import { IssueVerificationCodeService } from './issue-verification-code.service';

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
    private readonly issueVerificationCode: IssueVerificationCodeService,
  ) {}

  async execute(
    input: ResendVerificationCodeInput,
  ): Promise<ResendVerificationCodeOutput> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user || user.emailVerified) {
      throw new VerificationCodeInvalidError();
    }

    const issuance = await this.issueVerificationCode.execute({
      user,
      mode: 'strict',
      incrementResendCount: true,
      enforceCooldown: true,
      persistVerificationState: async () => {
        await this.userRepo.update(user);
      },
    });

    return {
      requiresVerification: true,
      emailMasked: maskEmail(user.email),
      cooldownSeconds: issuance.cooldownSeconds,
      verificationExpiresAt: issuance.verificationExpiresAt,
    };
  }
}
