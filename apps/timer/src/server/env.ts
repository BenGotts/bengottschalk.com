/**
 * A server environment variable, or undefined when it's unset or still a
 * placeholder (`REPLACE_ME…`), so a half-configured deployment stays
 * local-only instead of showing a sign-in that can't work.
 */
export function serverEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && !value.startsWith("REPLACE_ME") ? value : undefined;
}
