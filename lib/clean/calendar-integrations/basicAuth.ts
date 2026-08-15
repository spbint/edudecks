import { Buffer } from "node:buffer";

const FEED_USERNAME = "mylearna";

export function readCalendarFeedPassword(authorization: string | null) {
  const match = authorization?.match(/^Basic\s+([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;

  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0 || decoded.slice(0, separator) !== FEED_USERNAME) {
      return null;
    }
    const password = decoded.slice(separator + 1);
    return /^[A-Za-z0-9_-]{43}$/.test(password) ? password : null;
  } catch {
    return null;
  }
}
