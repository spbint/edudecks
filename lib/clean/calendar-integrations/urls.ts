export function buildCalendarFeedUrl(origin: string, rawToken: string) {
  const base = new URL(origin);
  if (base.protocol !== "https:" && base.hostname !== "localhost") {
    throw new Error("Calendar feed URLs require HTTPS.");
  }

  return new URL(
    `/api/calendar-feeds/${encodeURIComponent(rawToken)}.ics`,
    base,
  ).toString();
}

export function toWebcalUrl(httpsUrl: string) {
  const url = new URL(httpsUrl);
  if (url.protocol !== "https:") {
    throw new Error("Apple Calendar subscriptions require an HTTPS feed URL.");
  }
  return `webcal://${url.host}${url.pathname}${url.search}${url.hash}`;
}

export function parseCalendarFeedPathSegment(segment: string) {
  const value = String(segment ?? "").trim();
  if (!value.endsWith(".ics")) return null;
  const rawToken = value.slice(0, -4);
  return /^[A-Za-z0-9_-]{43}$/.test(rawToken) ? rawToken : null;
}
