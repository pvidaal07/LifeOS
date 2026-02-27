import { AggregateRoot } from '../../common';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  private _email: string;
  private _passwordHash: string;
  private _name: string;
  private _avatarUrl: string | null;
  private _isActive: boolean;

  private constructor(props: UserProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._name = props.name;
    this._avatarUrl = props.avatarUrl;
    this._isActive = props.isActive;
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

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      avatarUrl: this.avatarUrl,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
