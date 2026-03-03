import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerifyEmailPage } from './VerifyEmailPage';

const authState = vi.hoisted(() => ({
  pendingVerification: {
    email: 'user@example.com',
    emailMasked: 'us***@example.com',
    cooldownSeconds: 2,
    verificationExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  },
}));

const verifyMutationState = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

const resendMutationState = vi.hoisted(() => ({
  mutate: vi.fn(),
  isPending: false,
}));

vi.mock('../stores/auth.store', () => ({
  useAuthStore: (selector: (state: { pendingVerification: typeof authState.pendingVerification }) => unknown) =>
    selector({
      pendingVerification: authState.pendingVerification,
    }),
}));

vi.mock('../hooks/useAuth', () => ({
  useVerifyEmail: () => verifyMutationState,
  useResendVerification: () => resendMutationState,
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    authState.pendingVerification = {
      email: 'user@example.com',
      emailMasked: 'us***@example.com',
      cooldownSeconds: 2,
      verificationExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    };
    verifyMutationState.isPending = false;
    resendMutationState.isPending = false;
  });

  it('submits uppercase code with the pending verification email', () => {
    render(<VerifyEmailPage />);

    const input = screen.getByLabelText('Código de verificación');
    fireEvent.change(input, { target: { value: 'ab12cd' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verificar y continuar' }));

    expect(input).toHaveValue('AB12CD');
    expect(verifyMutationState.mutate).toHaveBeenCalledWith({
      email: 'user@example.com',
      code: 'AB12CD',
    });
  });

  it('enforces resend cooldown and restarts it after a successful resend', async () => {
    vi.useFakeTimers();
    resendMutationState.mutate.mockImplementation((_, options?: { onSuccess?: () => void }) => {
      options?.onSuccess?.();
    });

    render(<VerifyEmailPage />);

    const resendButton = screen.getByRole('button', { name: 'Reenviar' });
    expect(resendButton).toBeDisabled();
    expect(screen.getByText('Disponible en 2s')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText(/Disponible en/)).not.toBeInTheDocument();
    expect(resendButton).toBeEnabled();

    fireEvent.click(resendButton);

    expect(resendMutationState.mutate).toHaveBeenCalledWith(
      { email: 'user@example.com' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(screen.getByText('Disponible en 2s')).toBeInTheDocument();
    expect(resendButton).toBeDisabled();
  });
});
