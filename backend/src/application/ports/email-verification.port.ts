export interface EmailVerificationSenderPort {
  sendVerificationCode(input: {
    toEmail: string;
    name: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<void>;
}

export interface EmailVerificationConfig {
  codeLength: number;
  expiresInMinutes: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
}
