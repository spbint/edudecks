import { describe, expect, it } from "vitest";
import {
  buildFounderCockpitData,
  type FounderAccountSnapshot,
  type FounderDataProviders,
} from "@/lib/clean/founder/founderData";

const now = new Date("2026-08-16T02:00:00.000Z");

function providers(overrides: Partial<FounderDataProviders> = {}): FounderDataProviders {
  return {
    accounts: async () => null,
    productAnalytics: async () => null,
    commerce: async () => null,
    ...overrides,
  };
}

describe("Founder Cockpit aggregation", () => {
  it("renders unsupported metrics as unavailable without demo values", async () => {
    const data = await buildFounderCockpitData(providers(), now);

    expect(data.today.visitors).toMatchObject({ value: null, availability: "unavailable" });
    expect(data.today.orders).toMatchObject({ value: null, availability: "unavailable" });
    expect(data.marketplace.revenue.value).toBeNull();
    expect(data.liveNow.activeUsers.value).toBeNull();
    expect(data.productUsage["My Day"].value).toBeNull();
    expect(data.acquisition.Pinterest.value).toBeNull();
  });

  it("uses real account-provider values without mixing in content", async () => {
    const accountSnapshot: FounderAccountSnapshot = {
      signupsToday: 3,
      returningToday: 5,
      activeThisWeek: 12,
      returningFamiliesThisWeek: 9,
      acquisitionToday: { Pinterest: 1, Google: 2, Direct: 0, Social: 0, Other: 0 },
      recentActivity: [{ kind: "signup", occurredAt: "2026-08-16T01:30:00.000Z" }],
    };
    const data = await buildFounderCockpitData(
      providers({ accounts: async () => accountSnapshot }),
      now,
    );

    expect(data.today.signups.value).toBe(3);
    expect(data.today.returning.value).toBe(5);
    expect(data.retention.activeThisWeek.value).toBe(12);
    expect(data.retention.returningFamilies.value).toBe(9);
    expect(data.acquisition.Pinterest).toMatchObject({
      value: 1,
      source: "Supabase signup attribution",
    });
    expect(data.recentActivity).toEqual(accountSnapshot.recentActivity);
  });

  it("does not crash when analytics or Shopify providers fail", async () => {
    const data = await buildFounderCockpitData(
      providers({
        productAnalytics: async () => {
          throw new Error("PostHog unavailable");
        },
        commerce: async () => {
          throw new Error("Shopify unavailable");
        },
      }),
      now,
    );

    expect(data.today.visitors.availability).toBe("unavailable");
    expect(data.today.orders.availability).toBe("unavailable");
    expect(data.marketplace.checkoutStarts.availability).toBe("unavailable");
  });

  it("allowlists recent activity fields and drops sensitive provider additions", async () => {
    const unsafeSnapshot = {
      signupsToday: 1,
      returningToday: 0,
      activeThisWeek: 1,
      returningFamiliesThisWeek: 1,
      acquisitionToday: null,
      recentActivity: [
        {
          kind: "signup",
          occurredAt: "2026-08-16T01:30:00.000Z",
          learnerName: "Sensitive Child",
          email: "private@example.com",
          evidenceText: "Private evidence",
        },
      ],
    } as unknown as FounderAccountSnapshot;

    const data = await buildFounderCockpitData(
      providers({ accounts: async () => unsafeSnapshot }),
      now,
    );
    const serialized = JSON.stringify(data);

    expect(data.recentActivity).toEqual([
      { kind: "signup", occurredAt: "2026-08-16T01:30:00.000Z" },
    ]);
    expect(serialized).not.toContain("Sensitive Child");
    expect(serialized).not.toContain("private@example.com");
    expect(serialized).not.toContain("Private evidence");
  });
});
