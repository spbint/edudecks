import { describe, expect, it } from "vitest";
import { getFounderAccessDecision } from "@/lib/clean/founder/founderAccess";

describe("Founder access", () => {
  it("allows the exact Founder email with the trusted admin profile flag", () => {
    expect(getFounderAccessDecision({ id: "founder-user", email: "sean@mylearna.com" }, { is_admin: true })).toBe("allowed");
  });

  it("denies ordinary users and wrong-email admins", () => {
    expect(getFounderAccessDecision({ id: "ordinary-user", email: "other@example.com" }, { is_admin: false })).toBe("forbidden");
    expect(getFounderAccessDecision({ id: "wrong-email", email: "other@example.com" }, { is_admin: true })).toBe("forbidden");
    expect(getFounderAccessDecision({ id: "ordinary-user", email: "other@example.com" }, null)).toBe("forbidden");
  });

  it("fails closed when the trusted profile lookup fails", () => {
    expect(getFounderAccessDecision({ id: "founder-user", email: "sean@mylearna.com" }, { is_admin: true }, true)).toBe("forbidden");
  });

  it("requires authentication before considering profile access", () => {
    expect(getFounderAccessDecision(null, { is_admin: true })).toBe("unauthenticated");
  });
});
