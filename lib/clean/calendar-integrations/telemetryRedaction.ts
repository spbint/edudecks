const CALENDAR_FEED_TOKEN_PATH =
  /\/api\/calendar-feeds\/[A-Za-z0-9_-]{43}\.ics/gi;
const URL_CREDENTIALS = /\b(https?|webcal):\/\/[^\s/@:]+:[^\s/@]+@/gi;
const BASIC_CREDENTIALS = /\bBasic\s+[A-Za-z0-9+/=]+/gi;
const GOOGLE_OAUTH_CALLBACK =
  /\/api\/calendar-connections\/google\/callback\?[^\s"'<>]*/gi;
const GOOGLE_AUTHORIZATION_URL =
  /https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?[^\s"'<>]*/gi;
const MICROSOFT_OAUTH_CALLBACK =
  /\/api\/calendar-connections\/microsoft\/callback\?[^\s"'<>]*/gi;
const MICROSOFT_AUTHORIZATION_URL =
  /https:\/\/login\.microsoftonline\.com\/common\/oauth2\/v2\.0\/authorize\?[^\s"'<>]*/gi;
const SENSITIVE_CALENDAR_TELEMETRY_KEYS = new Set([
  "access_token",
  "authorization",
  "authorizationurl",
  "code",
  "code_challenge",
  "code_verifier",
  "feedurl",
  "password",
  "refresh_token",
  "state",
  "token",
  "token_hash",
]);

function redactValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (typeof value === "string") {
    return value
      .replace(CALENDAR_FEED_TOKEN_PATH, "/api/calendar-feeds/[redacted].ics")
      .replace(URL_CREDENTIALS, "$1://[redacted]@")
      .replace(BASIC_CREDENTIALS, "Basic [redacted]")
      .replace(
        GOOGLE_OAUTH_CALLBACK,
        "/api/calendar-connections/google/callback?[redacted]",
      )
      .replace(
        GOOGLE_AUTHORIZATION_URL,
        "https://accounts.google.com/o/oauth2/v2/auth?[redacted]",
      )
      .replace(
        MICROSOFT_OAUTH_CALLBACK,
        "/api/calendar-connections/microsoft/callback?[redacted]",
      )
      .replace(
        MICROSOFT_AUTHORIZATION_URL,
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?[redacted]",
      );
  }
  if (!value || typeof value !== "object") return value;
  const existing = seen.get(value);
  if (existing) return existing;

  if (Array.isArray(value)) {
    const redacted: unknown[] = [];
    seen.set(value, redacted);
    for (const entry of value) redacted.push(redactValue(entry, seen));
    return redacted;
  }

  const redacted: Record<string, unknown> = {};
  seen.set(value, redacted);
  for (const [key, entry] of Object.entries(value)) {
    redacted[key] = SENSITIVE_CALENDAR_TELEMETRY_KEYS.has(key.toLowerCase())
      ? "[redacted]"
      : redactValue(entry, seen);
  }
  return redacted;
}

export function redactCalendarFeedTelemetry<T>(event: T): T {
  return redactValue(event, new WeakMap()) as T;
}
