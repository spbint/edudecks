import { describe, expect, it } from "vitest";
import { collapseRecentActivity } from "@/lib/clean/founder/founderDashboard";

describe("Founder recent activity hygiene", () => {
  it("collapses adjacent identical actions inside the short activity window", () => {
    expect(collapseRecentActivity([
      { label: "Signed in", occurredAt: "2026-08-16T02:00:00.000Z" },
      { label: "Signed in", occurredAt: "2026-08-16T01:58:00.000Z" },
      { label: "Signed in", occurredAt: "2026-08-16T01:55:00.000Z" },
    ])).toEqual([
      { label: "Signed in", occurredAt: "2026-08-16T02:00:00.000Z" },
    ]);
  });

  it("preserves different actions and identical actions outside the window", () => {
    expect(collapseRecentActivity([
      { label: "Signed in", occurredAt: "2026-08-16T02:00:00.000Z" },
      { label: "Opened My Day", occurredAt: "2026-08-16T01:59:00.000Z" },
      { label: "Signed in", occurredAt: "2026-08-16T01:50:00.000Z" },
    ])).toHaveLength(3);
  });
});
