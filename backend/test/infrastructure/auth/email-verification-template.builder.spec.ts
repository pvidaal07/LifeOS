import { describe, expect, it } from 'vitest';
import { buildEmailVerificationTemplate } from '../../../src/infrastructure/auth/services/email-verification-template.builder';

describe('buildEmailVerificationTemplate', () => {
  it('builds multipart content with branding and support metadata', () => {
    const result = buildEmailVerificationTemplate({
      recipientName: 'Ada',
      code: 'A1B2C3',
      expiresInMinutes: 15,
      brandName: 'LifeOS',
      appUrl: 'https://app.lifeos.test',
      supportEmail: 'help@lifeos.test',
    });

    expect(result.subject).toBe('LifeOS - Codigo de verificacion');
    expect(result.text).toContain('A1B2C3');
    expect(result.text).toContain('https://app.lifeos.test');
    expect(result.html).toContain('<html lang="es">');
    expect(result.html).toContain('mailto:help@lifeos.test');
  });

  it('escapes potentially unsafe html characters', () => {
    const result = buildEmailVerificationTemplate({
      recipientName: '<script>alert(1)</script>',
      code: '"A1B2"',
      expiresInMinutes: 15,
      brandName: 'LifeOS',
    });

    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(result.html).toContain('&quot;A1B2&quot;');
  });
});
