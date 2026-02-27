import { UserModule } from '../../../domain/user';
import { UserModuleRepositoryPort } from '../../ports/user-repository.port';

export interface ModuleInput {
  moduleKey: string;
  isActive: boolean;
  displayOrder: number;
}

export class UpdateModulesUseCase {
  constructor(private readonly moduleRepo: UserModuleRepositoryPort) {}

  async execute(userId: string, modules: ModuleInput[]): Promise<void> {
    const userModules = modules.map((mod) =>
      UserModule.create({
        id: crypto.randomUUID(),
        userId,
        moduleKey: mod.moduleKey,
        isActive: mod.isActive,
        displayOrder: mod.displayOrder,
      }),
    );

    await this.moduleRepo.upsertMany(userId, userModules);
  }
}
