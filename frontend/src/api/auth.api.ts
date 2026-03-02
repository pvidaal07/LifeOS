import { apiClient } from './client';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
  VerificationPendingResponse,
  VerifyEmailPayload,
  VerifyEmailResponse,
  ResendVerificationPayload,
  ChangePasswordPayload,
  ChangePasswordResponse,
} from '../types';

export const authApi = {
  login: (data: LoginCredentials) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data),

  register: (data: RegisterData) =>
    apiClient.post<ApiResponse<VerificationPendingResponse>>('/auth/register', data),

  verifyEmail: (data: VerifyEmailPayload) =>
    apiClient.post<ApiResponse<VerifyEmailResponse>>('/auth/verify-email', data),

  resendVerification: (data: ResendVerificationPayload) =>
    apiClient.post<ApiResponse<VerificationPendingResponse>>('/auth/resend-verification', data),

  refresh: () =>
    apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  logout: () =>
    apiClient.post('/auth/logout'),

  changePassword: (data: ChangePasswordPayload) =>
    apiClient.post<ApiResponse<ChangePasswordResponse>>('/auth/change-password', data),
};
