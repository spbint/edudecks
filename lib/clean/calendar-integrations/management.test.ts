import { describe, expect, it } from "vitest";
import {
  CalendarFeedManagementError,
  createAppleCalendarFeed,
  revokeAppleCalendarFeed,
  rotateAppleCalendarFeed,
  type CalendarFeedManagementStore,
} from "@/lib/clean/calendar-integrations/management";
import type {
  CalendarFeedSubscriptionMetadata,
  CalendarIntegrationManagerContext,
} from "@/lib/clean/calendar-integrations/types";

const NOW = "2026-08-15T08:00:00.000Z";

function context(role: "owner" | "parent" | "caregiver"): CalendarIntegrationManagerContext {
  return { familyId: "family-1", userId: `user-${role}`, role };
}

function metadata(status: "active" | "revoked" = "active"): CalendarFeedSubscriptionMetadata {
  return {
    id: "subscription-1",
    familyId: "family-1",
    createdByUserId: "user-owner",
    status,
    createdAt: NOW,
    updatedAt: NOW,
    rotatedAt: null,
    revokedAt: status === "revoked" ? NOW : null,
    lastAccessedAt: null,
  };
}

function buildStore(existing: CalendarFeedSubscriptionMetadata | null = null) {
  let current = existing;
  const persisted: Array<Record<string, unknown>> = [];
  const store: CalendarFeedManagementStore = {
    async findByFamily() {
      return current;
    },
    async create(input) {
      persisted.push(input);
      current = { ...metadata(), createdByUserId: input.userId };
      return current;
    },
    async reactivate(input) {
      persisted.push(input);
      current = { ...metadata(), createdByUserId: input.userId, rotatedAt: input.now };
      return current;
    },
    async rotate(input) {
      persisted.push(input);
      current = { ...metadata(), rotatedAt: input.now };
      return current;
    },
    async revoke(input) {
      persisted.push(input);
      current = { ...metadata("revoked"), revokedAt: input.now };
      return current;
    },
  };
  return { store, persisted, current: () => current };
}

const fixedToken = () => ({
  rawToken: "raw-token-returned-once",
  tokenHash: "stored-sha256-hash",
  tokenPrefix: "raw-toke",
});

describe("Apple Calendar feed management", () => {
  it.each(["owner", "parent"] as const)("allows a family %s to create a feed", async (role) => {
    const fake = buildStore();
    const result = await createAppleCalendarFeed(context(role), fake.store, fixedToken, () => NOW);
    expect(result.rawToken).toBe("raw-token-returned-once");
    expect(result.tokenPrefix).toBe("raw-toke");
    expect(result.subscription.status).toBe("active");
    expect(fake.persisted[0]).toMatchObject({
      familyId: "family-1",
      tokenHash: "stored-sha256-hash",
      tokenPrefix: "raw-toke",
    });
    expect(JSON.stringify(fake.persisted)).not.toContain("raw-token-returned-once");
    expect(result.subscription).not.toHaveProperty("tokenHash");
  });

  it("denies caregivers", async () => {
    const fake = buildStore();
    await expect(
      createAppleCalendarFeed(context("caregiver"), fake.store, fixedToken, () => NOW),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(fake.persisted).toHaveLength(0);
  });

  it("rotates in place and revokes without deleting the subscription", async () => {
    const fake = buildStore(metadata());
    const rotated = await rotateAppleCalendarFeed(
      context("parent"),
      fake.store,
      fixedToken,
      () => NOW,
    );
    expect(rotated.rawToken).toBe("raw-token-returned-once");
    expect(rotated.tokenPrefix).toBe("raw-toke");
    expect(fake.current()?.status).toBe("active");

    const revoked = await revokeAppleCalendarFeed(context("owner"), fake.store, () => NOW);
    expect(revoked.status).toBe("revoked");
    expect(fake.current()?.id).toBe("subscription-1");
  });

  it("does not create a second active feed for the same family", async () => {
    const fake = buildStore(metadata());
    await expect(
      createAppleCalendarFeed(context("owner"), fake.store, fixedToken, () => NOW),
    ).rejects.toBeInstanceOf(CalendarFeedManagementError);
    expect(fake.persisted).toHaveLength(0);
  });
});
