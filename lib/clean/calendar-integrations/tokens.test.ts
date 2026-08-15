import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  generateCalendarFeedToken,
  hashCalendarFeedToken,
} from "@/lib/clean/calendar-integrations/tokens";
import {
  buildCalendarFeedUrl,
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

  it("builds HTTPS and webcal subscription URLs without changing the token", () => {
    const token = generateCalendarFeedToken().rawToken;
    const httpsUrl = buildCalendarFeedUrl("https://www.mylearna.com", token);
    expect(httpsUrl).toBe(`https://www.mylearna.com/api/calendar-feeds/${token}.ics`);
    expect(toWebcalUrl(httpsUrl)).toBe(
      `webcal://www.mylearna.com/api/calendar-feeds/${token}.ics`,
    );
    expect(parseCalendarFeedPathSegment(`${token}.ics`)).toBe(token);
    expect(parseCalendarFeedPathSegment("not-a-token.ics")).toBeNull();
  });
});
