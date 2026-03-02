import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/auth.store';
import { authApi } from '../api/auth.api';
import type {
  LoginCredentials,
  RegisterData,
  PendingVerificationContext,
  VerifyEmailPayload,
  ResendVerificationPayload,
} from '../types';

interface VerificationErrorPayload {
  details?: {
    requiresVerification?: boolean;
    emailMasked?: string;
    cooldownSeconds?: number;
  };
  message?: string;
}

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setPendingVerification = useAuthStore((state) => state.setPendingVerification);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      navigate('/dashboard');
      toast.success('¡Bienvenido!');
    },
    onError: (error: any) => {
      const payload = error.response?.data as VerificationErrorPayload;
      if (payload?.details?.requiresVerification) {
        const email = error.config?.data
          ? JSON.parse(error.config.data).email
          : '';
        const context: PendingVerificationContext = {
          email,
          emailMasked: payload.details.emailMasked ?? email,
          cooldownSeconds: payload.details.cooldownSeconds ?? 0,
          verificationExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        };
        setPendingVerification(context);
        navigate('/verify-email');
        toast.error(payload.message || 'Debes verificar tu correo antes de iniciar sesión');
        return;
      }
      toast.error(payload?.message || 'Error al iniciar sesión');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const setPendingVerification = useAuthStore((state) => state.setPendingVerification);

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (response) => {
      const { user, emailMasked, cooldownSeconds, verificationExpiresAt } = response.data.data;
      setPendingVerification({
        email: user.email,
        emailMasked,
        cooldownSeconds,
        verificationExpiresAt,
      });
      navigate('/verify-email');
      toast.success('Cuenta creada. Revisa tu correo para verificarla.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrarse');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      navigate('/login');
    },
  });
}

export function useVerifyEmail() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) => authApi.verifyEmail(payload),
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      navigate('/dashboard');
      toast.success('Correo verificado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo verificar el codigo');
    },
  });
}

export function useResendVerification() {
  const setPendingVerification = useAuthStore((state) => state.setPendingVerification);

  return useMutation({
    mutationFn: (payload: ResendVerificationPayload) => authApi.resendVerification(payload),
    onSuccess: (response) => {
      const { emailMasked, cooldownSeconds, verificationExpiresAt } = response.data.data;
      const currentEmail = useAuthStore.getState().pendingVerification?.email;
      if (currentEmail) {
        setPendingVerification({
          email: currentEmail,
          emailMasked,
          cooldownSeconds,
          verificationExpiresAt,
        });
      }
      toast.success('Te enviamos un nuevo codigo');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo reenviar el codigo');
    },
  });
}
