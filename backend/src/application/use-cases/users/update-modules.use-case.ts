import { UserModule } from '../../../domain/user';
import { UserModuleRepositoryPort } from '../../ports/user-repository.port';

export interface ModuleInput {
  moduleKey: string;
  isActive: boolean;
  displayOrder: number;
}

export class UpdateModulesUseCase {
  constructor(private readonly moduleRepo: UserModuleRepositoryPort) {}

  async execute(userId: string, modules: ModuleInput[]): Promise<UserModule[]> {
    const userModules = modules.map((mod) =>
      UserModule.create({
        id: crypto.randomUUID(),
        userId,
        moduleKey: mod.moduleKey,
        isActive: mod.isActive,
        displayOrder: mod.displayOrder,
      }),
    );

    return this.moduleRepo.upsertMany(userId, userModules);
  }
}
