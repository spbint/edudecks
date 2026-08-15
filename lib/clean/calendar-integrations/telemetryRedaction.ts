const CALENDAR_FEED_TOKEN_PATH =
  /\/api\/calendar-feeds\/[A-Za-z0-9_-]{43}\.ics/gi;

function redactValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (typeof value === "string") {
    return value.replace(
      CALENDAR_FEED_TOKEN_PATH,
      "/api/calendar-feeds/[redacted].ics",
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
    redacted[key] = redactValue(entry, seen);
  }
  return redacted;
}

export function redactCalendarFeedTelemetry<T>(event: T): T {
  return redactValue(event, new WeakMap()) as T;
}
