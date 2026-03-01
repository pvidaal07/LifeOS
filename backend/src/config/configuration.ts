export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
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
    codeLength: parseInt(process.env.EMAIL_VERIFICATION_CODE_LENGTH ?? '6', 10),
    expiresInMinutes: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES ?? '15', 10),
    resendCooldownSeconds: parseInt(process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS ?? '60', 10),
    maxAttempts: parseInt(process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS ?? '5', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
});
