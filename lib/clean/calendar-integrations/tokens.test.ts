import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  generateCalendarFeedToken,
  hashCalendarFeedToken,
} from "@/lib/clean/calendar-integrations/tokens";
import {
  buildAuthenticatedCalendarFeedUrl,
  buildCalendarFeedAddress,
  parseCalendarFeedPathSegment,
  toWebcalUrl,
} from "@/lib/clean/calendar-integrations/urls";

describe("Apple Calendar bearer tokens and URLs", () => {
  it("uses 256 bits of URL-safe randomness and stores a one-way hash", () => {
    const first = generateCalendarFeedToken();
    const second = generateCalendarFeedToken();
    expect(Buffer.from(first.rawToken, "base64url")).toHaveLength(32);
    expect(first.rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.rawToken).not.toBe(second.rawToken);
    expect(first.tokenHash).toBe(hashCalendarFeedToken(first.rawToken));
    expect(first.tokenHash).not.toContain(first.rawToken);
    expect(first.tokenPrefix).toBe(first.rawToken.slice(0, 8));
  });

  it("keeps the secret out of the request path and carries it as feed credentials", () => {
    const token = generateCalendarFeedToken();
    const feedAddress = buildCalendarFeedAddress(
      "https://www.mylearna.com",
      token.tokenPrefix,
    );
    expect(feedAddress).toBe(
      `https://www.mylearna.com/api/calendar-feeds/${token.tokenPrefix}.ics`,
    );
    expect(feedAddress).not.toContain(token.rawToken);
    const authenticatedUrl = buildAuthenticatedCalendarFeedUrl(
      feedAddress,
      token.rawToken,
    );
    expect(authenticatedUrl).toBe(
      `https://mylearna:${token.rawToken}@www.mylearna.com/api/calendar-feeds/${token.tokenPrefix}.ics`,
    );
    expect(toWebcalUrl(authenticatedUrl)).toBe(
      `webcal://mylearna:${token.rawToken}@www.mylearna.com/api/calendar-feeds/${token.tokenPrefix}.ics`,
    );
    expect(parseCalendarFeedPathSegment(`${token.tokenPrefix}.ics`)).toBe(
      token.tokenPrefix,
    );
    expect(parseCalendarFeedPathSegment("not-a-token.ics")).toBeNull();
  });
});
