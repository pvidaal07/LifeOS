import { AggregateRoot } from '../../common';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  verificationCodeHash: string | null;
  verificationCodeExpiresAt: Date | null;
  verificationAttempts: number;
  verificationLastSentAt: Date | null;
  verificationResendCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  private _email: string;
  private _passwordHash: string;
  private _name: string;
  private _avatarUrl: string | null;
  private _isActive: boolean;
  private _emailVerified: boolean;
  private _verificationCodeHash: string | null;
  private _verificationCodeExpiresAt: Date | null;
  private _verificationAttempts: number;
  private _verificationLastSentAt: Date | null;
  private _verificationResendCount: number;

  private constructor(props: UserProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._name = props.name;
    this._avatarUrl = props.avatarUrl;
    this._isActive = props.isActive;
    this._emailVerified = props.emailVerified;
    this._verificationCodeHash = props.verificationCodeHash;
    this._verificationCodeExpiresAt = props.verificationCodeExpiresAt;
    this._verificationAttempts = props.verificationAttempts;
    this._verificationLastSentAt = props.verificationLastSentAt;
    this._verificationResendCount = props.verificationResendCount;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get name(): string {
    return this._name;
  }

  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get verificationCodeHash(): string | null {
    return this._verificationCodeHash;
  }

  get verificationCodeExpiresAt(): Date | null {
    return this._verificationCodeExpiresAt;
  }

  get verificationAttempts(): number {
    return this._verificationAttempts;
  }

  get verificationLastSentAt(): Date | null {
    return this._verificationLastSentAt;
  }

  get verificationResendCount(): number {
    return this._verificationResendCount;
  }

  isOwnedBy(userId: string): boolean {
    return this._id === userId;
  }

  static create(params: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
  }): User {
    const now = new Date();
    return new User({
      id: params.id,
      email: params.email,
      passwordHash: params.passwordHash,
      name: params.name,
      avatarUrl: null,
      isActive: true,
      emailVerified: false,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
      verificationAttempts: 0,
      verificationLastSentAt: null,
      verificationResendCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  updateProfile(params: { name?: string; avatarUrl?: string | null }): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.avatarUrl !== undefined) this._avatarUrl = params.avatarUrl;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  setVerificationCode(params: {
    codeHash: string;
    expiresAt: Date;
    sentAt?: Date;
    incrementResendCount?: boolean;
  }): void {
    const sentAt = params.sentAt ?? new Date();
    if (params.expiresAt.getTime() <= sentAt.getTime()) {
      throw new Error('verification code expiration must be in the future');
    }

    this._verificationCodeHash = params.codeHash;
    this._verificationCodeExpiresAt = params.expiresAt;
    this._verificationLastSentAt = sentAt;
    this._verificationAttempts = 0;
    if (params.incrementResendCount) {
      this._verificationResendCount += 1;
    }
    this._updatedAt = new Date();
  }

  verifyEmail(): void {
    this._emailVerified = true;
    this._verificationCodeHash = null;
    this._verificationCodeExpiresAt = null;
    this._verificationAttempts = 0;
    this._updatedAt = new Date();
  }

  changePassword(passwordHash: string): void {
    this._passwordHash = passwordHash;
    this._updatedAt = new Date();
  }

  canResendVerificationCode(cooldownSeconds: number, now = new Date()): {
    allowed: boolean;
    remainingSeconds: number;
  } {
    if (!this._verificationLastSentAt) {
      return { allowed: true, remainingSeconds: 0 };
    }

    const nextAllowedAt = this._verificationLastSentAt.getTime() + cooldownSeconds * 1000;
    const diffMs = nextAllowedAt - now.getTime();
    if (diffMs <= 0) {
      return { allowed: true, remainingSeconds: 0 };
    }

    return {
      allowed: false,
      remainingSeconds: Math.ceil(diffMs / 1000),
    };
  }

  incrementVerificationAttempt(): void {
    this._verificationAttempts += 1;
    this._updatedAt = new Date();
  }

  isVerificationCodeExpired(now = new Date()): boolean {
    if (!this._verificationCodeExpiresAt) {
      return true;
    }
    return this._verificationCodeExpiresAt.getTime() <= now.getTime();
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      avatarUrl: this.avatarUrl,
      isActive: this.isActive,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
