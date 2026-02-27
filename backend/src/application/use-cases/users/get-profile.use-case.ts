import { UserNotFoundError } from '../../../domain/user';
import { UserRepositoryPort, UserProfile } from '../../ports/user-repository.port';

export class GetProfileUseCase {
  constructor(private readonly userRepo: UserRepositoryPort) {}

  async execute(userId: string): Promise<UserProfile> {
    const profile = await this.userRepo.findByIdWithProfile(userId);
    if (!profile) {
      throw new UserNotFoundError(userId);
    }

    return profile;
  }
}
