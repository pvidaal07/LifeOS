import { InvalidCredentialsError } from '../../../domain/common';
import { PasswordReuseNotAllowedError } from '../../../domain/user';
import { PasswordHasherPort } from '../../ports/auth.port';
import { UserRepositoryPort } from '../../ports/user-repository.port';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordOutput {
  message: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
  ) {}

  async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const currentPasswordMatches = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordMatches) {
      throw new InvalidCredentialsError();
    }

    const reusesCurrentPassword = await this.passwordHasher.compare(
      input.newPassword,
      user.passwordHash,
    );
    if (reusesCurrentPassword) {
      throw new PasswordReuseNotAllowedError();
    }

    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);
    user.changePassword(newPasswordHash);
    await this.userRepo.update(user);

    return {
      message: 'Contraseña actualizada correctamente',
    };
  }
}
