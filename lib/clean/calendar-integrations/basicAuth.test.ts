import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { readCalendarFeedPassword } from "@/lib/clean/calendar-integrations/basicAuth";

function basic(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
}

describe("Apple Calendar feed HTTP credentials", () => {
  it("accepts only the fixed username and a 256-bit URL-safe password", () => {
    const password = "A".repeat(43);
    expect(readCalendarFeedPassword(basic("mylearna", password))).toBe(password);
    expect(readCalendarFeedPassword(basic("someone-else", password))).toBeNull();
    expect(readCalendarFeedPassword(basic("mylearna", "too-short"))).toBeNull();
  });

  it("fails closed for missing or malformed authorization", () => {
    expect(readCalendarFeedPassword(null)).toBeNull();
    expect(readCalendarFeedPassword("Bearer secret")).toBeNull();
    expect(readCalendarFeedPassword("Basic !!!")).toBeNull();
  });
});
