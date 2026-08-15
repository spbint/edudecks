import { describe, expect, it } from "vitest";
import {
  loadAppleCalendarFeed,
  type CalendarFeedReadStore,
} from "@/lib/clean/calendar-integrations/publicFeed";
import { hashCalendarFeedToken } from "@/lib/clean/calendar-integrations/tokens";

function buildStore(options: {
  rawToken: string;
  familyId?: string;
  active?: boolean;
}) {
  const familyId = options.familyId ?? "family-a";
  let tokenPrefix = options.rawToken.slice(0, 8);
  const calls: string[] = [];
  let activeHash = options.active === false ? null : hashCalendarFeedToken(options.rawToken);
  const store: CalendarFeedReadStore = {
    async findActiveByTokenHash(tokenHash) {
      calls.push(`lookup:${tokenHash}`);
      return tokenHash === activeHash
        ? { id: "subscription-1", familyId, tokenPrefix }
        : null;
    },
    async loadCalendarItems(requestedFamilyId) {
      calls.push(`family:${requestedFamilyId}`);
      return requestedFamilyId === familyId
        ? [
            {
              id: "calendar-1",
              title: "Science",
              plannedDate: "2026-08-18",
              startsAt: null,
              endsAt: null,
              learningArea: "Science",
              updatedAt: "2026-08-15T01:00:00.000Z",
            },
          ]
        : [];
    },
    async touchLastAccessed(id, requestedFamilyId) {
      calls.push(`touch:${id}:${requestedFamilyId}`);
    },
  };

  return {
    store,
    calls,
    rotateTo(rawToken: string) {
      activeHash = hashCalendarFeedToken(rawToken);
      tokenPrefix = rawToken.slice(0, 8);
    },
    revoke() {
      activeHash = null;
    },
  };
}

describe("private Apple Calendar feed lookup", () => {
  it("returns the exact active subscription family", async () => {
    const fake = buildStore({ rawToken: "active-token", familyId: "family-a" });
    const result = await loadAppleCalendarFeed(
      "active-token",
      "active-t",
      fake.store,
    );
    expect(result?.familyId).toBe("family-a");
    expect(result?.events).toHaveLength(1);
    expect(fake.calls).toContain("family:family-a");
    expect(fake.calls.some((call) => call.includes("family-b"))).toBe(false);
  });

  it("returns null for an invalid or revoked token without loading events", async () => {
    const invalid = buildStore({ rawToken: "active-token" });
    expect(
      await loadAppleCalendarFeed("invalid-token", "invalid-", invalid.store),
    ).toBeNull();
    expect(invalid.calls.some((call) => call.startsWith("family:"))).toBe(false);

    const revoked = buildStore({ rawToken: "revoked-token", active: false });
    expect(
      await loadAppleCalendarFeed("revoked-token", "revoked-", revoked.store),
    ).toBeNull();
    expect(revoked.calls.some((call) => call.startsWith("family:"))).toBe(false);
  });

  it("invalidates the old token immediately after rotation", async () => {
    const fake = buildStore({ rawToken: "old-token" });
    fake.rotateTo("new-token");
    expect(
      await loadAppleCalendarFeed("old-token", "old-toke", fake.store),
    ).toBeNull();
    expect(
      await loadAppleCalendarFeed("new-token", "new-toke", fake.store),
    ).not.toBeNull();
    fake.revoke();
    expect(
      await loadAppleCalendarFeed("new-token", "new-toke", fake.store),
    ).toBeNull();
  });

  it("requires the public feed identifier to match the stored prefix", async () => {
    const fake = buildStore({ rawToken: "active-token" });
    expect(
      await loadAppleCalendarFeed("active-token", "other-id", fake.store),
    ).toBeNull();
    expect(fake.calls.some((call) => call.startsWith("family:"))).toBe(false);
  });
});
