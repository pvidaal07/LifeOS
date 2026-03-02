type EmailVerificationTransport = 'smtp' | 'log';

const PRODUCTION_LIKE_ENVS = new Set(['production', 'staging']);

function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function parseNumber(name: string, fallback: number): number {
  const raw = getEnv(name);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${name}`);
  }

  return parsed;
}

function parseBoolean(name: string): boolean | undefined {
  const raw = getEnv(name);
  if (!raw) {
    return undefined;
  }

  const normalized = raw.toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  throw new Error(`Invalid boolean environment variable: ${name}`);
}

function resolveEmailVerificationTransport(nodeEnv: string): EmailVerificationTransport {
  const explicitTransport = getEnv('EMAIL_VERIFICATION_TRANSPORT');

  if (explicitTransport) {
    if (explicitTransport === 'smtp' || explicitTransport === 'log') {
      return explicitTransport;
    }

    throw new Error(
      'Invalid EMAIL_VERIFICATION_TRANSPORT value. Expected "smtp" or "log".',
    );
  }

  return PRODUCTION_LIKE_ENVS.has(nodeEnv.toLowerCase()) ? 'smtp' : 'log';
}

function validateSmtpConfigIfNeeded(transport: EmailVerificationTransport): void {
  if (transport !== 'smtp') {
    return;
  }

  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const missingVars = requiredVars.filter((name) => !getEnv(name));

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required SMTP environment variables: ${missingVars.join(', ')}`,
    );
  }
}

export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const emailTransport = resolveEmailVerificationTransport(nodeEnv);
  validateSmtpConfigIfNeeded(emailTransport);

  return {
    port: parseNumber('PORT', 3000),
    nodeEnv,
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
      expiration: process.env.JWT_EXPIRATION || '15m',
      refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
    emailVerification: {
      codeLength: parseNumber('EMAIL_VERIFICATION_CODE_LENGTH', 6),
      expiresInMinutes: parseNumber('EMAIL_VERIFICATION_EXPIRY_MINUTES', 15),
      resendCooldownSeconds: parseNumber('EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS', 60),
      maxAttempts: parseNumber('EMAIL_VERIFICATION_MAX_ATTEMPTS', 5),
      transport: emailTransport,
      smtp: {
        host: getEnv('SMTP_HOST'),
        port: parseNumber('SMTP_PORT', 587),
        user: getEnv('SMTP_USER'),
        pass: getEnv('SMTP_PASS'),
        from: getEnv('SMTP_FROM'),
        secure: parseBoolean('SMTP_SECURE'),
        connectionTimeoutMs: parseNumber('SMTP_CONNECTION_TIMEOUT_MS', 10_000),
        sendTimeoutMs: parseNumber('SMTP_SEND_TIMEOUT_MS', 10_000),
      },
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    },
  };
};
