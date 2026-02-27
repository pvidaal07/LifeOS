import { User, UserSettings, UserModule } from '../../domain/user';

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByIdWithProfile(id: string): Promise<UserProfile | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
}

export interface UserSettingsRepositoryPort {
  findByUserId(userId: string): Promise<UserSettings | null>;
  upsert(settings: UserSettings): Promise<UserSettings>;
}

export interface UserModuleRepositoryPort {
  findActiveByUserId(userId: string): Promise<UserModule[]>;
  upsertMany(userId: string, modules: UserModule[]): Promise<UserModule[]>;
}

export interface UserProfile {
  user: User;
  settings: UserSettings | null;
  modules: UserModule[];
}
