export const SET_UTC_TIMEZONE_SQL = "SET TIME ZONE 'UTC'";

const UTC_TIMEZONE_OPTION = '-c timezone=UTC';

export function withUtcSessionTimezone(connectionString: string): string {
  const parsed = new URL(connectionString);
  const currentOptions = parsed.searchParams.get('options');

  if (currentOptions && /(?:^|\s)-c\s*timezone\s*=\s*UTC(?:\s|$)/i.test(currentOptions)) {
    return parsed.toString();
  }

  const nextOptions = currentOptions
    ? `${currentOptions.trim()} ${UTC_TIMEZONE_OPTION}`
    : UTC_TIMEZONE_OPTION;

  parsed.searchParams.set('options', nextOptions);
  return parsed.toString();
}
