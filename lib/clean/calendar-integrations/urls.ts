const FEED_USERNAME = "mylearna";

export function buildCalendarFeedAddress(origin: string, tokenPrefix: string) {
  const base = new URL(origin);
  if (base.protocol !== "https:" && base.hostname !== "localhost") {
    throw new Error("Calendar feed URLs require HTTPS.");
  }
  if (!/^[A-Za-z0-9_-]{8}$/.test(tokenPrefix)) {
    throw new Error("Calendar feed identifier is invalid.");
  }

  return new URL(
    `/api/calendar-feeds/${encodeURIComponent(tokenPrefix)}.ics`,
    base,
  ).toString();
}

export function buildAuthenticatedCalendarFeedUrl(
  feedAddress: string,
  subscriptionPassword: string,
) {
  const url = new URL(feedAddress);
  if (url.protocol !== "https:") {
    throw new Error("Apple Calendar subscriptions require an HTTPS feed URL.");
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(subscriptionPassword)) {
    throw new Error("Calendar subscription credential is invalid.");
  }
  url.username = FEED_USERNAME;
  url.password = subscriptionPassword;
  return url.toString();
}

export function toWebcalUrl(authenticatedHttpsUrl: string) {
  const url = new URL(authenticatedHttpsUrl);
  if (url.protocol !== "https:") {
    throw new Error("Apple Calendar subscriptions require an HTTPS feed URL.");
  }
  return url.toString().replace(/^https:/, "webcal:");
}

export function parseCalendarFeedPathSegment(segment: string) {
  const value = String(segment ?? "").trim();
  if (!value.endsWith(".ics")) return null;
  const tokenPrefix = value.slice(0, -4);
  return /^[A-Za-z0-9_-]{8}$/.test(tokenPrefix) ? tokenPrefix : null;
}
