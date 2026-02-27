import { UserSettings, UserNotFoundError } from '../../../domain/user';
import { UserSettingsRepositoryPort } from '../../ports/user-repository.port';

export interface UpdateSettingsInput {
  timezone?: string;
  theme?: string;
  locale?: string;
}

export class UpdateSettingsUseCase {
  constructor(private readonly settingsRepo: UserSettingsRepositoryPort) {}

  async execute(userId: string, input: UpdateSettingsInput): Promise<UserSettings> {
    let settings = await this.settingsRepo.findByUserId(userId);

    if (!settings) {
      // Create default settings if none exist, then apply updates
      settings = UserSettings.createDefault(crypto.randomUUID(), userId);
    }

    settings.update({
      timezone: input.timezone,
      theme: input.theme,
      locale: input.locale,
    });

    return this.settingsRepo.upsert(settings);
  }
}
