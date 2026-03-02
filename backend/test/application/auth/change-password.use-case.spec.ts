import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangePasswordUseCase } from '../../../src/application/use-cases/auth';
import { InvalidCredentialsError } from '../../../src/domain/common';
import { PasswordReuseNotAllowedError, User } from '../../../src/domain/user';
import {
  createMockPasswordHasher,
  createMockUserRepository,
} from '../../helpers/mock-factories';

describe('ChangePasswordUseCase', () => {
  const createUser = () =>
    User.create({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      name: 'User',
    });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('changes password when current password is valid', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const useCase = new ChangePasswordUseCase(userRepo, passwordHasher);
    const user = createUser();

    userRepo.findById.mockResolvedValue(user);
    userRepo.update.mockResolvedValue(user);
    passwordHasher.compare
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    passwordHasher.hash.mockResolvedValue('new-password-hash');

    const result = await useCase.execute({
      userId: user.id,
      currentPassword: 'current-password',
      newPassword: 'new-password',
    });

    expect(result.message).toBe('Contraseña actualizada correctamente');
    expect(passwordHasher.hash).toHaveBeenCalledWith('new-password');
    expect(user.passwordHash).toBe('new-password-hash');
    expect(userRepo.update).toHaveBeenCalledWith(user);
  });

  it('throws invalid credentials when current password is wrong', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const useCase = new ChangePasswordUseCase(userRepo, passwordHasher);
    const user = createUser();

    userRepo.findById.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: user.id,
        currentPassword: 'wrong-password',
        newPassword: 'new-password',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });

  it('rejects reusing the current password', async () => {
    const userRepo = createMockUserRepository();
    const passwordHasher = createMockPasswordHasher();
    const useCase = new ChangePasswordUseCase(userRepo, passwordHasher);
    const user = createUser();

    userRepo.findById.mockResolvedValue(user);
    passwordHasher.compare
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    await expect(
      useCase.execute({
        userId: user.id,
        currentPassword: 'current-password',
        newPassword: 'current-password',
      }),
    ).rejects.toBeInstanceOf(PasswordReuseNotAllowedError);

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
