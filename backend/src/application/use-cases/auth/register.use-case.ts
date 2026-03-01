import { User } from '../../../domain/user';
import { UserSettings, UserModule, UserInitializationService } from '../../../domain/user';
import { DuplicateEmailError, VerificationDeliveryError } from '../../../domain/user';
import { UserRepositoryPort, UserSettingsRepositoryPort, UserModuleRepositoryPort } from '../../ports/user-repository.port';
import { PasswordHasherPort } from '../../ports/auth.port';
import {
  EmailVerificationSenderPort,
  EmailVerificationConfig,
} from '../../ports/email-verification.port';
import { generateVerificationCode, maskEmail } from './email-verification.utils';

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
    private readonly verificationSender: EmailVerificationSenderPort,
    private readonly verificationConfig: EmailVerificationConfig,
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

    const code = generateVerificationCode(this.verificationConfig.codeLength);
    const verificationCodeHash = await this.passwordHasher.hash(code);
    const verificationExpiresAt = new Date(
      Date.now() + this.verificationConfig.expiresInMinutes * 60 * 1000,
    );
    user.setVerificationCode({
      codeHash: verificationCodeHash,
      expiresAt: verificationExpiresAt,
      sentAt: new Date(),
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

    try {
      await this.verificationSender.sendVerificationCode({
        toEmail: user.email,
        name: user.name,
        code,
        expiresInMinutes: this.verificationConfig.expiresInMinutes,
      });
    } catch {
      throw new VerificationDeliveryError();
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      requiresVerification: true,
      emailMasked: maskEmail(user.email),
      cooldownSeconds: this.verificationConfig.resendCooldownSeconds,
      verificationExpiresAt,
    };
  }
}
