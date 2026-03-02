import { apiClient } from './client';
import type {
  ApiResponse,
  User,
  UserModule,
  UserProfileResponse,
  UserSettings,
} from '../types';

type UpdateProfilePayload = {
  name?: string;
  avatarUrl?: string;
};

type UpdateProfileResponse = Pick<User, 'id' | 'email' | 'name' | 'avatarUrl'>;

type UpdateSettingsPayload = {
  timezone?: string;
  theme?: string;
  locale?: string;
};

type UpdateModulePayload = Pick<UserModule, 'moduleKey' | 'isActive' | 'displayOrder'>;

export const usersApi = {
  getMe: () => apiClient.get<ApiResponse<UserProfileResponse>>('/users/me'),

  updateMe: (data: UpdateProfilePayload) =>
    apiClient.patch<ApiResponse<UpdateProfileResponse>>('/users/me', data),

  updateMySettings: (data: UpdateSettingsPayload) =>
    apiClient.patch<ApiResponse<UserSettings>>('/users/me/settings', data),

  getMyModules: () =>
    apiClient.get<ApiResponse<UserModule[]>>('/users/me/modules'),

  updateMyModules: (modules: UpdateModulePayload[]) =>
    apiClient.put<ApiResponse<UserModule[]>>('/users/me/modules', modules),
};
