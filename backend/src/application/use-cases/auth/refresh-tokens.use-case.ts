import { AccountDisabledError } from '../../../domain/common';
import { UserNotFoundError } from '../../../domain/user';
import { UserRepositoryPort } from '../../ports/user-repository.port';
import { AuthTokenPort, TokenPair } from '../../ports/auth.port';

export interface RefreshTokensOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokensUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly authToken: AuthTokenPort,
  ) {}

  async execute(userId: string, email: string): Promise<RefreshTokensOutput> {
    // Find user to verify still exists and is active
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (!user.isActive) {
      throw new AccountDisabledError();
    }

    // Generate new token pair
    const tokens: TokenPair = await this.authToken.generateTokenPair({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
