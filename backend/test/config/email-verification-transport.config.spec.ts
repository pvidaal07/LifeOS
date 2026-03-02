import { afterEach, describe, expect, it } from 'vitest';
import configuration from '../../src/config/configuration';

const ORIGINAL_ENV = process.env;

describe('email verification transport configuration', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('defaults to smtp in production-like environments', () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'production',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
      SMTP_FROM: 'no-reply@example.com',
    };

    const config = configuration();

    expect(config.emailVerification.transport).toBe('smtp');
  });

  it('defaults to log in development environments', () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'development',
      EMAIL_VERIFICATION_TRANSPORT: '',
    };

    const config = configuration();

    expect(config.emailVerification.transport).toBe('log');
  });

  it('fails fast on invalid explicit transport value', () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'development',
      EMAIL_VERIFICATION_TRANSPORT: 'mailhog',
    };

    expect(() => configuration()).toThrow(
      'Invalid EMAIL_VERIFICATION_TRANSPORT value. Expected "smtp" or "log".',
    );
  });

  it('fails fast when smtp mode is missing required credentials', () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'development',
      EMAIL_VERIFICATION_TRANSPORT: 'smtp',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user',
      SMTP_PASS: '',
      SMTP_FROM: '',
    };

    expect(() => configuration()).toThrow(
      'Missing required SMTP environment variables: SMTP_PASS, SMTP_FROM',
    );
  });

  it('parses smtp numeric and optional boolean values', () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'development',
      EMAIL_VERIFICATION_TRANSPORT: 'smtp',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '2525',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
      SMTP_FROM: 'no-reply@example.com',
      SMTP_SECURE: 'true',
      SMTP_CONNECTION_TIMEOUT_MS: '12000',
      SMTP_SEND_TIMEOUT_MS: '9000',
    };

    const config = configuration();

    expect(config.emailVerification.smtp.port).toBe(2525);
    expect(config.emailVerification.smtp.secure).toBe(true);
    expect(config.emailVerification.smtp.connectionTimeoutMs).toBe(12_000);
    expect(config.emailVerification.smtp.sendTimeoutMs).toBe(9_000);
  });

  it('provides default template branding values', () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'development',
      CORS_ORIGIN: 'https://frontend.lifeos.test',
    };

    const config = configuration();

    expect(config.emailVerification.template.brandName).toBe('LifeOS');
    expect(config.emailVerification.template.appUrl).toBe('https://frontend.lifeos.test');
    expect(config.emailVerification.template.supportEmail).toBeUndefined();
  });

  it('uses explicit template branding environment values', () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'development',
      EMAIL_BRAND_NAME: 'LifeOS Cloud',
      EMAIL_APP_URL: 'https://cloud.lifeos.test',
      EMAIL_SUPPORT_EMAIL: 'help@lifeos.test',
    };

    const config = configuration();

    expect(config.emailVerification.template.brandName).toBe('LifeOS Cloud');
    expect(config.emailVerification.template.appUrl).toBe('https://cloud.lifeos.test');
    expect(config.emailVerification.template.supportEmail).toBe('help@lifeos.test');
  });
});
