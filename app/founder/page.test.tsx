// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requireFounderAccessMock, loadFounderDashboardMock } = vi.hoisted(() => ({
  requireFounderAccessMock: vi.fn(),
  loadFounderDashboardMock: vi.fn(),
}));

vi.mock("@/lib/clean/founder/founderAccess", () => ({
  requireFounderAccess: requireFounderAccessMock,
}));
vi.mock("@/lib/clean/founder/founderDashboard", () => ({
  loadFounderDashboard: loadFounderDashboardMock,
}));

import FounderDashboardV2 from "./FounderDashboardV2";
import FounderPage from "./page";

const data = {
  generatedAt: "2026-08-21T08:00:00.000Z",
  productActivityAvailable: true,
  today: {
    newFamilies: 2,
    activeFamilies: 3,
    returningFamilies: 1,
    meaningfulActions: 4,
  },
  whatChanged: "2 new families joined today. 3 families used MyLearna and 4 meaningful learning actions were recorded.",
  attention: [
    {
      tone: "attention" as const,
      title: "1 family has planned but not captured",
      detail: "This is the clearest current point to watch.",
    },
  ],
  customers: [
    {
      userId: "customer-1",
      familyId: "family-1",
      email: "family@example.com",
      joinedAt: "2026-08-20T01:00:00.000Z",
      lastSignInAt: "2026-08-21T01:00:00.000Z",
      familyDisplayName: "Example Family",
      countryCode: "AU",
      jurisdictionCode: "TAS",
      learnerCount: 2,
      profileCompleted: true,
      displayName: "Example Family",
      lastActiveAt: "2026-08-21T01:00:00.000Z",
      activeDays30: 2,
      myDayViews: 3,
      calendarActions: 2,
      captureOpens: 1,
      capturesSaved: 0,
      portfolioViews: 0,
      reportViews: 0,
      coachUses: 0,
      pathwayViews: 0,
      topArea: "My Day",
      status: "New" as const,
      recentActivity: [{ occurredAt: "2026-08-21T01:00:00.000Z", label: "Opened My Day" }],
    },
  ],
  journey: [
    { label: "Joined", count: 1, percent: 1 },
    { label: "Set up family", count: 1, percent: 1 },
    { label: "Planned learning", count: 1, percent: 1 },
    { label: "Saved first capture", count: 0, percent: 0 },
    { label: "Viewed Portfolio", count: 0, percent: 0 },
    { label: "Reached Reports", count: 0, percent: 0 },
  ],
  biggestDrop: "Planned learning → Saved first capture",
  featureUsage: [{ label: "My Day", users: 1, actions: 3 }],
  returnHealth: { activeLast7Days: 1, activeLast30Days: 1, goingQuiet: 0 },
  acquisitionToday: { Direct: 2, Google: 0, Pinterest: 0, Social: 0, Other: 0 },
};

describe("Founder page", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    requireFounderAccessMock.mockReset();
    loadFounderDashboardMock.mockReset();
    requireFounderAccessMock.mockResolvedValue({ id: "founder-user" });
    loadFounderDashboardMock.mockResolvedValue(data);
  });

  it("renders the plain-language dashboard after the Founder server gate succeeds", async () => {
    render(await FounderPage());

    expect(requireFounderAccessMock).toHaveBeenCalledOnce();
    expect(loadFounderDashboardMock).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "MyLearna Founder" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Today at MyLearna" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "People" })).toBeTruthy();
    expect(screen.getByText("Example Family")).toBeTruthy();
  });

  it("does not catch an unauthenticated redirect or ordinary-user denial", async () => {
    requireFounderAccessMock.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));
    await expect(FounderPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(loadFounderDashboardMock).not.toHaveBeenCalled();

    requireFounderAccessMock.mockRejectedValueOnce(new Error("NEXT_NOT_FOUND"));
    await expect(FounderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadFounderDashboardMock).not.toHaveBeenCalled();
  });

  it("personifies analytics without exposing PostHog jargon", () => {
    render(<FounderDashboardV2 data={data} />);

    expect(screen.getByText("Example Family")).toBeTruthy();
    expect(screen.getByText(/1 family has planned but not captured/i)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/distinct_id|person_id|hogql|dau|cohort/i);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("keeps narrow-screen safeguards and avoids fake business metrics", () => {
    const css = readFileSync(join(process.cwd(), "app/founder/FounderDashboardV2.module.css"), "utf8");
    const source = readFileSync(join(process.cwd(), "app/founder/page.tsx"), "utf8");

    expect(css).toContain("@media (max-width: 430px)");
    expect(css).toContain("minmax(0, 1fr)");
    expect(css).toContain("min(100%, 1380px)");
    expect(source).not.toMatch(/demo analytics|sample revenue|fake visitors/i);
  });
});
