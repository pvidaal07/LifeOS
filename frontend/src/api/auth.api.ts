import { apiClient } from './client';
import type { LoginCredentials, RegisterData, AuthResponse, ApiResponse } from '../types';

export const authApi = {
  login: (data: LoginCredentials) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data),

  register: (data: RegisterData) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data),

  refresh: () =>
    apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  logout: () =>
    apiClient.post('/auth/logout'),
};
