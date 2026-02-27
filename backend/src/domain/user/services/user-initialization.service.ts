export interface DefaultModuleConfig {
  key: string;
  displayOrder: number;
}

export interface DefaultSettingsConfig {
  timezone: string;
  theme: string;
  locale: string;
}

export class UserInitializationService {
  /**
   * Returns the default modules that are created for every new user.
   */
  getDefaultModules(): DefaultModuleConfig[] {
    return [
      { key: 'dashboard', displayOrder: 0 },
      { key: 'studies', displayOrder: 1 },
      { key: 'sports', displayOrder: 2 },
      { key: 'nutrition', displayOrder: 3 },
      { key: 'habits', displayOrder: 4 },
    ];
  }

  /**
   * Returns the default settings for a new user.
   */
  getDefaultSettings(): DefaultSettingsConfig {
    return {
      timezone: 'Europe/Madrid',
      theme: 'system',
      locale: 'es',
    };
  }
}
