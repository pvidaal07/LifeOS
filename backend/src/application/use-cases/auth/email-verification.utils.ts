const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateVerificationCode(length: number): string {
  const chars = Array.from({ length }, () => {
    const index = Math.floor(Math.random() * ALPHANUMERIC.length);
    return ALPHANUMERIC[index];
  });
  return chars.join('');
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return email;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? '*'}***@${domain}`;
  }

  const visibleStart = localPart.slice(0, 2);
  return `${visibleStart}${'*'.repeat(Math.max(2, localPart.length - 2))}@${domain}`;
}
