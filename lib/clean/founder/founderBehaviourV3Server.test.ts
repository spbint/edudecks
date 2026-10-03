import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadFounderCustomers: vi.fn(),
  loadFounderPostHogSnapshot: vi.fn(),
}));

vi.mock("./founderCustomers", () => ({
  isFounderExcludedAccount: (email: unknown) => email === "founder-internal@example.invalid",
  loadFounderCustomers: mocks.loadFounderCustomers,
}));

vi.mock("./founderPosthog", () => ({
  loadFounderPostHogSnapshot: mocks.loadFounderPostHogSnapshot,
}));

import { loadFounderBehaviourV3 } from "./founderBehaviourV3Server";

describe("Founder Behaviour Intelligence v3 production data wiring", () => {
  beforeEach(() => {
    mocks.loadFounderCustomers.mockReset().mockResolvedValue({
      generatedAt: "2026-10-03T00:00:00.000Z",
      customers: [
        { userId: "family", email: "family@example.invalid" },
        { userId: "internal", email: "founder-internal@example.invalid" },
      ],
    });
    mocks.loadFounderPostHogSnapshot.mockReset().mockResolvedValue({
      available: true,
      events: [
        { userId: "family", event: "daily_plan_viewed", occurredAt: "2026-10-02T01:00:00.000Z", route: "/my-day", area: "my-day" },
        { userId: "internal", event: "daily_plan_viewed", occurredAt: "2026-10-02T02:00:00.000Z", route: "/my-day", area: "my-day" },
      ],
    });
  });

  it("uses the established PostHog and customer loaders and excludes internal activity by default", async () => {
    const now = new Date("2026-10-03T00:00:00.000Z");
    const result = await loadFounderBehaviourV3({ rangeDays: 30 }, now);

    expect(mocks.loadFounderPostHogSnapshot).toHaveBeenCalledWith(30);
    expect(mocks.loadFounderCustomers).toHaveBeenCalledWith(now, { includeInternal: true });
    expect(result.posthogAvailable).toBe(true);
    expect(result.summary.find((item) => item.label === "Product users")?.value).toBe(1);
  });

  it("preserves the established unavailable-source fallback", async () => {
    mocks.loadFounderPostHogSnapshot.mockResolvedValueOnce({ available: false, events: [] });

    const result = await loadFounderBehaviourV3(
      { rangeDays: 7 },
      new Date("2026-10-03T00:00:00.000Z"),
    );

    expect(result.posthogAvailable).toBe(false);
    expect(result.summary.find((item) => item.label === "Product users")?.value).toBe(0);
  });
});
