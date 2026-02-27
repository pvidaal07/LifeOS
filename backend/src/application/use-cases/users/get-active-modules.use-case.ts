import { UserModule } from '../../../domain/user';
import { UserModuleRepositoryPort } from '../../ports/user-repository.port';

export class GetActiveModulesUseCase {
  constructor(private readonly moduleRepo: UserModuleRepositoryPort) {}

  async execute(userId: string): Promise<UserModule[]> {
    return this.moduleRepo.findActiveByUserId(userId);
  }
}
