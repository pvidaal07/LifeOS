import { Entity } from '../../common';

export interface UserSettingsProps {
  id: string;
  userId: string;
  timezone: string;
  theme: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserSettings extends Entity {
  private _userId: string;
  private _timezone: string;
  private _theme: string;
  private _locale: string;

  private constructor(props: UserSettingsProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._userId = props.userId;
    this._timezone = props.timezone;
    this._theme = props.theme;
    this._locale = props.locale;
  }

  get userId(): string {
    return this._userId;
  }

  get timezone(): string {
    return this._timezone;
  }

  get theme(): string {
    return this._theme;
  }

  get locale(): string {
    return this._locale;
  }

  static createDefault(id: string, userId: string): UserSettings {
    const now = new Date();
    return new UserSettings({
      id,
      userId,
      timezone: 'Europe/Madrid',
      theme: 'system',
      locale: 'es',
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserSettingsProps): UserSettings {
    return new UserSettings(props);
  }

  update(params: { timezone?: string; theme?: string; locale?: string }): void {
    if (params.timezone !== undefined) this._timezone = params.timezone;
    if (params.theme !== undefined) this._theme = params.theme;
    if (params.locale !== undefined) this._locale = params.locale;
    this._updatedAt = new Date();
  }
}
