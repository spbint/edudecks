// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requireFounderAccessMock, loadFounderCockpitDataMock } = vi.hoisted(() => ({
  requireFounderAccessMock: vi.fn(),
  loadFounderCockpitDataMock: vi.fn(),
}));

vi.mock("@/lib/clean/founder/founderAccess", () => ({
  requireFounderAccess: requireFounderAccessMock,
}));
vi.mock("@/lib/clean/founder/founderServer", () => ({
  loadFounderCockpitData: loadFounderCockpitDataMock,
}));

import FounderCockpit from "./FounderCockpit";
import FounderPage from "./page";

const unavailable = (
  source: "Supabase Auth" | "Supabase signup attribution" | "PostHog" | "Shopify",
) => ({
  value: null,
  format: "number" as const,
  source,
  availability: "unavailable" as const,
});

const data = {
  generatedAt: "2026-08-16T02:00:00.000Z",
  today: {
    visitors: unavailable("PostHog"),
    signups: { value: 2, format: "number" as const, source: "Supabase Auth" as const, availability: "live" as const },
    returning: { value: 4, format: "number" as const, source: "Supabase Auth" as const, availability: "live" as const },
    orders: unavailable("Shopify"),
    revenue: { ...unavailable("Shopify"), format: "currency" as const },
  },
  liveNow: { activeUsers: unavailable("PostHog") },
  acquisition: {
    Pinterest: unavailable("PostHog"),
    Google: unavailable("PostHog"),
    Direct: unavailable("PostHog"),
    Social: unavailable("PostHog"),
    Other: unavailable("PostHog"),
  },
  marketplace: {
    productViews: unavailable("PostHog"),
    addToCarts: unavailable("PostHog"),
    checkoutStarts: unavailable("PostHog"),
    orders: unavailable("Shopify"),
    revenue: { ...unavailable("Shopify"), format: "currency" as const },
  },
  productUsage: {
    "My Day": unavailable("PostHog"),
    "My Capture": unavailable("PostHog"),
    "My Pathways": unavailable("PostHog"),
    "My Reports": unavailable("PostHog"),
    Marketplace: unavailable("PostHog"),
  },
  retention: {
    activeThisWeek: { value: 8, format: "number" as const, source: "Supabase Auth" as const, availability: "live" as const },
    returningFamilies: unavailable("Supabase Auth"),
    sevenDayReturnRate: { ...unavailable("PostHog"), format: "percent" as const },
  },
  recentActivity: [{ kind: "signup" as const, occurredAt: "2026-08-16T01:30:00.000Z" }],
};

describe("Founder page", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    requireFounderAccessMock.mockReset();
    loadFounderCockpitDataMock.mockReset();
    requireFounderAccessMock.mockResolvedValue({ id: "founder-user" });
    loadFounderCockpitDataMock.mockResolvedValue(data);
  });

  it("renders for an authorized founder after the server gate succeeds", async () => {
    render(await FounderPage());

    expect(requireFounderAccessMock).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "MyLearna Founder" })).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("does not catch an unauthenticated redirect or an ordinary-user denial", async () => {
    requireFounderAccessMock.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));
    await expect(FounderPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(loadFounderCockpitDataMock).not.toHaveBeenCalled();

    requireFounderAccessMock.mockRejectedValueOnce(new Error("NEXT_NOT_FOUND"));
    await expect(FounderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadFounderCockpitDataMock).not.toHaveBeenCalled();
  });

  it("renders unavailable providers without leaking sensitive learning data", () => {
    render(<FounderCockpit data={data} />);

    expect(screen.getAllByText("Not available yet").length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/learner name|evidence text|parent note|private@example/i);
    expect(screen.getByText("New signup")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("has narrow-screen layout safeguards and no demo dashboard fixture", () => {
    const css = readFileSync(join(process.cwd(), "app/founder/FounderCockpit.module.css"), "utf8");
    const source = readFileSync(join(process.cwd(), "app/founder/page.tsx"), "utf8");

    expect(css).toContain("@media (max-width: 430px)");
    expect(css).toContain("minmax(0, 1fr)");
    expect(css).toContain("min(100%, 1320px)");
    expect(source).not.toMatch(/demo analytics|sample revenue|fake visitors/i);
  });
});
