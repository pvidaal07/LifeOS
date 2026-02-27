import { User, UserNotFoundError } from '../../../domain/user';
import { UserRepositoryPort } from '../../ports/user-repository.port';

export interface UpdateProfileInput {
  name?: string;
  avatarUrl?: string | null;
}

export class UpdateProfileUseCase {
  constructor(private readonly userRepo: UserRepositoryPort) {}

  async execute(userId: string, input: UpdateProfileInput): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    user.updateProfile({
      name: input.name,
      avatarUrl: input.avatarUrl,
    });

    return this.userRepo.update(user);
  }
}
