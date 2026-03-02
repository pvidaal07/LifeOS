import { UserRepositoryPort } from '../../ports/user-repository.port';
import { PasswordHasherPort, AuthTokenPort, TokenPair } from '../../ports/auth.port';
import { EmailVerificationConfig } from '../../ports/email-verification.port';
import type { ClockPort } from '../../ports/clock.port';
import {
  VerificationCodeInvalidError,
  VerificationCodeExpiredError,
} from '../../../domain/user';

export interface VerifyEmailInput {
  email: string;
  code: string;
}

export interface VerifyEmailOutput {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly authToken: AuthTokenPort,
    private readonly verificationConfig: EmailVerificationConfig,
    private readonly clock: ClockPort,
  ) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new VerificationCodeInvalidError();
    }

    if (user.emailVerified) {
      const tokens: TokenPair = await this.authToken.generateTokenPair({
        sub: user.id,
        email: user.email,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }

    if (user.verificationAttempts >= this.verificationConfig.maxAttempts) {
      throw new VerificationCodeExpiredError();
    }

    if (user.isVerificationCodeExpired(this.clock.now())) {
      throw new VerificationCodeExpiredError();
    }

    if (!user.verificationCodeHash) {
      throw new VerificationCodeInvalidError();
    }

    const isValidCode = await this.passwordHasher.compare(
      input.code.trim().toUpperCase(),
      user.verificationCodeHash,
    );

    if (!isValidCode) {
      user.incrementVerificationAttempt();
      await this.userRepo.update(user);
      throw new VerificationCodeInvalidError();
    }

    user.verifyEmail();
    await this.userRepo.update(user);

    const tokens: TokenPair = await this.authToken.generateTokenPair({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
