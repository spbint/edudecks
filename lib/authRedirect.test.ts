import { describe, expect, it } from "vitest";
import { normalizeAuthNextPath } from "./authRedirect";

describe("authenticated return paths", () => {
  it("rejects external and protocol-relative destinations", () => {
    expect(normalizeAuthNextPath("https://example.com/elsewhere", "/my-profile")).toBe("/my-profile");
    expect(normalizeAuthNextPath("//example.com/elsewhere", "/my-profile")).toBe("/my-profile");
    expect(normalizeAuthNextPath("javascript:alert(1)", "/my-profile")).toBe("/my-profile");
  });
});
