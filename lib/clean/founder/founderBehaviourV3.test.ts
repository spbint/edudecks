import { describe, expect, it } from "vitest";
import { buildFounderBehaviourV3 } from "./founderBehaviourV3";
import type { FounderProductEvent, FounderTrackedEventName } from "./founderPosthog";

function event(userId: string, name: FounderTrackedEventName, day: number, extra: Partial<FounderProductEvent> = {}): FounderProductEvent {
  return {
    userId,
    event: name,
    occurredAt: `2026-09-${String(day).padStart(2, "0")}T01:00:00.000Z`,
    route: null,
    area: null,
    ...extra,
  };
}

function build(events: FounderProductEvent[], internalUserIds = new Set<string>()) {
  return buildFounderBehaviourV3({
    events,
    rangeDays: 30,
    includeInternal: false,
    internalUserIds,
    posthogAvailable: true,
    now: new Date("2026-09-30T12:00:00.000Z"),
  });
}

describe("Founder Behaviour Intelligence v3", () => {
  it("excludes internal actors by default", () => {
    const result = build([
      event("family", "daily_plan_viewed", 1),
      event("internal", "daily_plan_viewed", 1),
      event("internal", "capture_opened", 1),
    ], new Set(["internal"]));
    expect(result.summary.find((item) => item.label === "Product users")?.value).toBe(1);
  });

  it("includes internal actors only when explicitly requested", () => {
    const events = [event("family", "daily_plan_viewed", 1), event("internal", "daily_plan_viewed", 1)];
    const result = buildFounderBehaviourV3({
      events,
      rangeDays: 30,
      includeInternal: true,
      internalUserIds: new Set(["internal"]),
      posthogAvailable: true,
      now: new Date("2026-09-30T12:00:00.000Z"),
    });
    expect(result.summary.find((item) => item.label === "Product users")?.value).toBe(2);
    expect(result.dataQuality.find((item) => item.label === "Internal/test traffic")?.detail).toContain("included");
  });

  it("aggregates journey, Capture and ordered product paths", () => {
    const result = build([
      event("family", "daily_plan_viewed", 1),
      event("family", "pathway_viewed", 1, { occurredAt: "2026-09-01T01:05:00.000Z" }),
      event("family", "capture_opened", 1, { occurredAt: "2026-09-01T01:10:00.000Z", sourceSurface: "pathways" }),
      event("family", "capture_save_succeeded", 1, { occurredAt: "2026-09-01T01:15:00.000Z", hasAttachment: true }),
      event("family", "portfolio_viewed_after_capture", 1, { occurredAt: "2026-09-01T01:20:00.000Z" }),
    ]);
    expect(result.funnel.find((step) => step.label === "Evidence saved")?.actors).toBe(1);
    expect(result.capture.find((item) => item.label === "Evidence saved")?.value).toBe(1);
    expect(result.paths.map((item) => item.label)).toContain("My Day → Pathways");
    expect(result.paths.map((item) => item.label)).toContain("Capture → Portfolio");
  });

  it("calculates returning actors and first-value milestones", () => {
    const result = build([
      event("prospect", "public_page_viewed", 1),
      event("prospect", "public_page_viewed", 4),
      event("family", "auth_verification_succeeded", 2),
      event("family", "daily_plan_viewed", 2),
      event("family", "capture_save_succeeded", 9),
    ]);
    expect(result.returning.find((item) => item.label === "Returning public visitors")?.value).toBe(1);
    expect(result.activation.find((item) => item.label === "Account verified")?.value).toBe(1);
    expect(result.summary.find((item) => item.label === "7-day retained")?.value).toBe(1);
  });

  it("withholds cohort percentages below the minimum sample", () => {
    const result = build([event("family", "capture_opened", 1), event("family", "capture_save_succeeded", 1)]);
    const cohort = result.cohorts.find((item) => item.label === "Capture → Portfolio");
    expect(cohort).toMatchObject({ sample: 1, value: null, confidence: "insufficient" });
  });

  it("surfaces data-quality warnings without raw identities", () => {
    const result = build([event("private-auth-id", "capture_attachment_upload_failed", 1, { failureStage: "upload" })]);
    expect(result.dataQuality.map((item) => item.label)).toContain("Standard pageviews missing");
    expect(JSON.stringify(result)).not.toContain("private-auth-id");
    expect(JSON.stringify(result)).not.toMatch(/private@example\.com|127\.0\.0\.1/);
  });
});
