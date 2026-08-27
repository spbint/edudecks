import { describe, expect, it } from "vitest";
import { normalizeAuthNextPath } from "./authRedirect";

describe("authenticated return paths", () => {
  it("uses the safe fallback when the candidate is absent or blank", () => {
    expect(normalizeAuthNextPath(undefined, "/my-day")).toBe("/my-day");
    expect(normalizeAuthNextPath(null, "/my-day")).toBe("/my-day");
    expect(normalizeAuthNextPath("", "/my-day")).toBe("/my-day");
    expect(normalizeAuthNextPath("   ", "/my-day")).toBe("/my-day");
    expect(normalizeAuthNextPath(undefined, "/my-profile")).toBe("/my-profile");
  });
  it("rejects external and protocol-relative destinations", () => {
    expect(normalizeAuthNextPath("https://example.com/elsewhere", "/my-profile")).toBe("/my-profile");
    expect(normalizeAuthNextPath("//example.com/elsewhere", "/my-profile")).toBe("/my-profile");
    expect(normalizeAuthNextPath("javascript:alert(1)", "/my-profile")).toBe("/my-profile");
  });
});
