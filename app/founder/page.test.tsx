// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requireFounderAccessMock, loadFounderBehaviourV3Mock } = vi.hoisted(() => ({
  requireFounderAccessMock: vi.fn(),
  loadFounderBehaviourV3Mock: vi.fn(),
}));

vi.mock("@/lib/clean/founder/founderAccess", () => ({
  requireFounderAccess: requireFounderAccessMock,
}));
vi.mock("@/lib/clean/founder/founderBehaviourV3Server", () => ({
  loadFounderBehaviourV3: loadFounderBehaviourV3Mock,
}));

import FounderDashboardV2 from "./FounderDashboardV2";
import FounderDashboardV21 from "./FounderDashboardV21";
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
  trends: {
    periodLabel: "Last 7 days compared with the previous 7 days",
    summary: "More families are using MyLearna than in the previous 7 days. Quick Capture is reaching more families.",
    items: [
      { label: "New families", current: 2, previous: 1, unit: "families" as const, status: "Growing" as const, detail: "1 more family joined than in the previous 7 days." },
      { label: "Active families", current: 3, previous: 2, unit: "families" as const, status: "Growing" as const, detail: "1 more family used MyLearna than in the previous 7 days." },
      { label: "Quick Capture", current: 2, previous: 1, unit: "families" as const, status: "Growing" as const, detail: "1 more family used Quick Capture than in the previous 7 days." },
    ],
  },
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
      activity30: [{ occurredAt: "2026-08-21T01:00:00.000Z", label: "Opened My Day" }],
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

const v3Data = {
  generatedAt: "2026-08-21T08:00:00.000Z",
  rangeDays: 30 as const,
  includeInternal: false,
  posthogAvailable: true,
  summary: [{ label: "Product users", value: 3, note: "Anonymous aggregate.", confidence: "high" as const }],
  signals: [],
  funnel: [],
  returning: [],
  activation: [],
  paths: [],
  capture: [],
  captureModes: [],
  captureSources: [],
  media: [],
  attachmentSources: [],
  mobile: [],
  portfolioReports: [],
  retention: [],
  cohorts: [],
  friction: [],
  dataQuality: [{ label: "Identity stitching", detail: "Directional only.", confidence: "directional" as const }],
  detailed: {
    featureUsage: [{ label: "My Day", actors: 5, events: 12 }],
    areaUsage: [],
    entryBehaviour: [],
    activityDistribution: [{ label: "5–19 actions", value: 5, note: "Anonymous product actors.", confidence: "high" as const }],
    recentActivity: [],
    deviceMix: [],
    conversionObservations: [],
    privacyNote: "Only anonymous aggregate categories are shown.",
  },
};

describe("Founder page", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    requireFounderAccessMock.mockReset();
    loadFounderBehaviourV3Mock.mockReset();
    requireFounderAccessMock.mockResolvedValue({ id: "founder-user" });
    loadFounderBehaviourV3Mock.mockResolvedValue(v3Data);
  });

  it("renders the behaviour-intelligence dashboard after the Founder server gate succeeds", async () => {
    render(await FounderPage());

    expect(requireFounderAccessMock).toHaveBeenCalledOnce();
    expect(loadFounderBehaviourV3Mock).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Understand what families do next." })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Founder summary" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Founder signals" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Data quality" })).toBeTruthy();
    expect(screen.getByText("Detailed behavioural analytics")).toBeTruthy();
    expect(document.body.textContent).not.toContain("family@example.com");
  });

  it("expands privacy-safe detailed behavioural analytics without rendering identities", async () => {
    render(await FounderPage());

    fireEvent.click(screen.getByText("Detailed behavioural analytics"));
    expect(screen.getByRole("heading", { name: "Aggregate feature usage" })).toBeTruthy();
    expect(screen.getByText("5 actors · 12 events")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/family@example\.com|customer-1|founder-user/);
  });

  it("does not catch an unauthenticated redirect or ordinary-user denial", async () => {
    requireFounderAccessMock.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));
    await expect(FounderPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(loadFounderBehaviourV3Mock).not.toHaveBeenCalled();

    requireFounderAccessMock.mockRejectedValueOnce(new Error("NEXT_NOT_FOUND"));
    await expect(FounderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(loadFounderBehaviourV3Mock).not.toHaveBeenCalled();
  });

  it("adds who-level drill-downs and behaviour synthesis without exposing PostHog jargon", () => {
    render(<FounderDashboardV21 data={data} />);

    expect(screen.getByText("How families are behaving")).toBeTruthy();
    expect(screen.getByText("Repeat-use families")).toBeTruthy();
    expect(screen.getByText("What families do next")).toBeTruthy();
    expect(screen.getAllByText(/click for who/i)).toHaveLength(8);
    expect(document.body.textContent).not.toMatch(/distinct_id|person_id|hogql|dau|cohort/i);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("opens a shared full-width KPI drill-down instead of expanding the card itself", () => {
    render(<FounderDashboardV21 data={data} />);

    fireEvent.click(screen.getByRole("button", { name: /New families/i }));
    expect(screen.getByRole("region", { name: "New families today — 2" })).toBeTruthy();
    expect(screen.getByText("Exactly who joined today.")).toBeTruthy();
  });

  it("keeps the original v2 personification contract intact", () => {
    render(<FounderDashboardV2 data={data} />);

    expect(screen.getByText("Example Family")).toBeTruthy();
    expect(screen.getByText(/1 family has planned but not captured/i)).toBeTruthy();
    expect(screen.getByText(/More families are using MyLearna/i)).toBeTruthy();
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
