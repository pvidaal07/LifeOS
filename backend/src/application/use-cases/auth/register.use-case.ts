import { User } from '../../../domain/user';
import { UserSettings, UserModule, UserInitializationService } from '../../../domain/user';
import { ReviewSettings } from '../../../domain/review';
import { DuplicateEmailError } from '../../../domain/user';
import { UserRepositoryPort, UserSettingsRepositoryPort, UserModuleRepositoryPort } from '../../ports/user-repository.port';
import { PasswordHasherPort, AuthTokenPort, TokenPair } from '../../ports/auth.port';
import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface RegisterOutput {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export class RegisterUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly userSettingsRepo: UserSettingsRepositoryPort,
    private readonly userModuleRepo: UserModuleRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly authToken: AuthTokenPort,
    private readonly userInit: UserInitializationService,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    // Check for duplicate email
    const exists = await this.userRepo.existsByEmail(input.email);
    if (exists) {
      throw new DuplicateEmailError(input.email);
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(input.password);

    // Create user entity
    const user = User.create({
      id: crypto.randomUUID(),
      email: input.email,
      passwordHash,
      name: input.name,
    });

    // Persist user
    await this.userRepo.save(user);

    // Create default settings
    const defaultSettingsConfig = this.userInit.getDefaultSettings();
    const settings = UserSettings.createDefault(crypto.randomUUID(), user.id);
    await this.userSettingsRepo.upsert(settings);

    // Create default modules
    const defaultModules = this.userInit.getDefaultModules();
    const modules = defaultModules.map((mod) =>
      UserModule.create({
        id: crypto.randomUUID(),
        userId: user.id,
        moduleKey: mod.key,
        isActive: true,
        displayOrder: mod.displayOrder,
      }),
    );
    await this.userModuleRepo.upsertMany(user.id, modules);

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
        createdAt: user.createdAt,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
