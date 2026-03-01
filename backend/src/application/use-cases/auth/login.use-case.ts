import { InvalidCredentialsError, AccountDisabledError } from '../../../domain/common';
import { EmailNotVerifiedError } from '../../../domain/user';
import { UserRepositoryPort } from '../../ports/user-repository.port';
import { PasswordHasherPort, AuthTokenPort, TokenPair } from '../../ports/auth.port';
import { EmailVerificationConfig } from '../../ports/email-verification.port';
import { maskEmail } from './email-verification.utils';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly authToken: AuthTokenPort,
    private readonly verificationConfig: EmailVerificationConfig,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // Find user by email
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Compare password
    const isValid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AccountDisabledError();
    }

    if (!user.emailVerified) {
      const resendStatus = user.canResendVerificationCode(
        this.verificationConfig.resendCooldownSeconds,
      );
      throw new EmailNotVerifiedError({
        emailMasked: maskEmail(user.email),
        cooldownSeconds: resendStatus.remainingSeconds,
      });
    }

    // Generate tokens
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
