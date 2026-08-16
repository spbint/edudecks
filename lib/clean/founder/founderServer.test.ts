import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  classifyFounderAcquisition,
  summarizeFounderAuthUsers,
} from "@/lib/clean/founder/founderServer";

function authUser(
  id: string,
  createdAt: string,
  lastSignInAt: string | null,
): User {
  return {
    id,
    created_at: createdAt,
    last_sign_in_at: lastSignInAt,
  } as User;
}

describe("Founder account metrics", () => {
  it("classifies acquisition into fixed buckets without returning raw attribution", () => {
    expect(classifyFounderAcquisition("pinterest_campaign", "https://example.test")).toBe(
      "Pinterest",
    );
    expect(classifyFounderAcquisition(null, "https://www.google.com/search")).toBe("Google");
    expect(classifyFounderAcquisition(null, null)).toBe("Direct");
    expect(classifyFounderAcquisition("instagram", "https://private.example/path")).toBe(
      "Social",
    );
    expect(classifyFounderAcquisition("newsletter-free-text", "https://private.example/path")).toBe(
      "Other",
    );
  });

  it("uses the Hobart day and current calendar week without treating new users as returning", () => {
    const users = [
      authUser("new-today", "2026-08-16T01:00:00.000Z", "2026-08-16T01:30:00.000Z"),
      authUser("returning-today", "2026-07-01T00:00:00.000Z", "2026-08-16T02:00:00.000Z"),
      authUser("active-this-week", "2026-07-01T00:00:00.000Z", "2026-08-11T02:00:00.000Z"),
      authUser("before-this-week", "2026-07-01T00:00:00.000Z", "2026-08-09T02:00:00.000Z"),
    ];

    const summary = summarizeFounderAuthUsers(users, new Date("2026-08-16T03:00:00.000Z"));

    expect(summary.signupsToday).toBe(1);
    expect(summary.returningToday).toBe(1);
    expect(summary.activeThisWeek).toBe(3);
    expect(summary.returningUserIds).toEqual(["returning-today", "active-this-week"]);
    expect(summary.recentActivity[0]).toEqual({
      kind: "signup",
      occurredAt: "2026-08-16T01:00:00.000Z",
    });
  });
});
