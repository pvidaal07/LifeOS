import { describe, expect, it } from 'vitest';
import {
  SET_UTC_TIMEZONE_SQL,
  withUtcSessionTimezone,
} from '../../../../src/infrastructure/persistence/prisma/prisma-timezone';

describe('prisma timezone helpers', () => {
  it('appends UTC session option when missing', () => {
    const input =
      'postgresql://lifeos:secret@localhost:5432/lifeos?schema=public';

    const output = withUtcSessionTimezone(input);
    const parsed = new URL(output);

    expect(parsed.searchParams.get('schema')).toBe('public');
    expect(parsed.searchParams.get('options')).toContain('-c timezone=UTC');
  });

  it('preserves existing options and appends UTC once', () => {
    const input =
      'postgresql://lifeos:secret@localhost:5432/lifeos?schema=public&options=-c%20statement_timeout%3D5000';

    const output = withUtcSessionTimezone(input);
    const parsed = new URL(output);
    const options = parsed.searchParams.get('options') ?? '';

    expect(options).toContain('-c statement_timeout=5000');
    expect(options).toContain('-c timezone=UTC');
  });

  it('does not duplicate UTC timezone option', () => {
    const input =
      'postgresql://lifeos:secret@localhost:5432/lifeos?schema=public&options=-c%20timezone%3DUTC';

    const output = withUtcSessionTimezone(input);
    const parsed = new URL(output);

    expect(parsed.searchParams.get('options')).toBe('-c timezone=UTC');
  });

  it('uses canonical SQL to enforce UTC session timezone', () => {
    expect(SET_UTC_TIMEZONE_SQL).toBe("SET TIME ZONE 'UTC'");
  });
});
