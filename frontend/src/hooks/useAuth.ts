import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/auth.store';
import { authApi } from '../api/auth.api';
import type { LoginCredentials, RegisterData } from '../types';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      navigate('/dashboard');
      toast.success('¡Bienvenido!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      navigate('/dashboard');
      toast.success('¡Cuenta creada con éxito!');
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
