import { describe, expect, it } from "vitest";
import { getFounderAccessDecision } from "@/lib/clean/founder/founderAccess";

describe("Founder access", () => {
  it("allows an authenticated user with the trusted admin profile flag", () => {
    expect(getFounderAccessDecision({ id: "founder-user" }, { is_admin: true })).toBe("allowed");
  });

  it("denies an ordinary authenticated user", () => {
    expect(getFounderAccessDecision({ id: "ordinary-user" }, { is_admin: false })).toBe(
      "forbidden",
    );
    expect(getFounderAccessDecision({ id: "ordinary-user" }, null)).toBe("forbidden");
  });

  it("fails closed when the trusted profile lookup fails", () => {
    expect(getFounderAccessDecision({ id: "founder-user" }, { is_admin: true }, true)).toBe(
      "forbidden",
    );
  });

  it("requires authentication before considering profile access", () => {
    expect(getFounderAccessDecision(null, { is_admin: true })).toBe("unauthenticated");
  });
});

