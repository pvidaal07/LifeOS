import { User } from '../../../domain/user';
import { UserSettings, UserModule, UserInitializationService } from '../../../domain/user';
import { DuplicateEmailError } from '../../../domain/user';
import { UserRepositoryPort, UserSettingsRepositoryPort, UserModuleRepositoryPort } from '../../ports/user-repository.port';
import { PasswordHasherPort } from '../../ports/auth.port';
import { maskEmail } from './email-verification.utils';
import { IssueVerificationCodeService } from './issue-verification-code.service';

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
  requiresVerification: true;
  emailMasked: string;
  cooldownSeconds: number;
  verificationExpiresAt: Date;
}

export class RegisterUseCase {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly userSettingsRepo: UserSettingsRepositoryPort,
    private readonly userModuleRepo: UserModuleRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly userInit: UserInitializationService,
    private readonly issueVerificationCode: IssueVerificationCodeService,
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

    const settings = UserSettings.createDefault(crypto.randomUUID(), user.id);

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

    const issuance = await this.issueVerificationCode.execute({
      user,
      mode: 'strict',
      persistVerificationState: async () => {
        await this.userRepo.save(user);
        await this.userSettingsRepo.upsert(settings);
        await this.userModuleRepo.upsertMany(user.id, modules);
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      requiresVerification: true,
      emailMasked: maskEmail(user.email),
      cooldownSeconds: issuance.cooldownSeconds,
      verificationExpiresAt: issuance.verificationExpiresAt,
    };
  }
}
