import { Buffer } from "node:buffer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadFeed: vi.fn(),
  readStore: { kind: "feed-store" },
}));

vi.mock("@/lib/clean/calendar-integrations/publicFeed", () => ({
  loadAppleCalendarFeed: mocks.loadFeed,
}));

vi.mock("@/lib/clean/calendar-integrations/serverRepositories", () => ({
  createCalendarFeedReadStore: () => mocks.readStore,
}));

vi.mock("@/lib/clean/calendar-integrations/ics", () => ({
  renderICalendar: () => "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
}));

import { GET } from "@/app/api/calendar-feeds/[feed]/route";

const token = "A".repeat(43);
const authorization = `Basic ${Buffer.from(`mylearna:${token}`, "utf8").toString("base64")}`;

function request(headers?: HeadersInit) {
  return new Request("https://calendar.example/api/calendar-feeds/AAAAAAAA.ics", {
    headers,
  });
}

function context(feed: string) {
  return { params: Promise.resolve({ feed }) };
}

beforeEach(() => {
  mocks.loadFeed.mockReset();
});

describe("Apple Calendar public feed route", () => {
  it("challenges a syntactically valid identifier without exposing whether it exists", async () => {
    const response = await GET(request(), context("AAAAAAAA.ics"));
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("Basic");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.loadFeed).not.toHaveBeenCalled();
  });

  it("returns a non-revealing 404 for invalid, revoked or mismatched credentials", async () => {
    mocks.loadFeed.mockResolvedValue(null);
    const response = await GET(
      request({ authorization }),
      context("AAAAAAAA.ics"),
    );
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not found");
    expect(mocks.loadFeed).toHaveBeenCalledWith(
      token,
      "AAAAAAAA",
      mocks.readStore,
    );
  });

  it("serves an authenticated feed with private and no-index headers", async () => {
    mocks.loadFeed.mockResolvedValue({ familyId: "family-a", events: [] });
    const response = await GET(
      request({ authorization }),
      context("AAAAAAAA.ics"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow, noarchive",
    );
    expect(await response.text()).toContain("BEGIN:VCALENDAR");
  });

  it("rejects malformed identifiers before credential lookup", async () => {
    const response = await GET(
      request({ authorization }),
      context(`${token}.ics`),
    );
    expect(response.status).toBe(404);
    expect(mocks.loadFeed).not.toHaveBeenCalled();
  });
});
