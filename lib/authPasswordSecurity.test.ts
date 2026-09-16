import { describe, expect, it } from "vitest";
import { isWeakPasswordError } from "@/lib/authPasswordSecurity";

describe("Supabase compromised-password errors", () => {
  it("recognises the stable Supabase error code", () => {
    expect(isWeakPasswordError({ code: "weak_password" })).toBe(true);
  });

  it("recognises the Supabase error class and safe message fallbacks", () => {
    expect(isWeakPasswordError({ name: "WeakPasswordError" })).toBe(true);
    expect(
      isWeakPasswordError({
        message: "Password has appeared in a known data breach.",
      }),
    ).toBe(true);
  });

  it("does not misclassify ordinary authentication failures", () => {
    expect(
      isWeakPasswordError({
        code: "invalid_credentials",
        message: "Invalid login credentials",
      }),
    ).toBe(false);
    expect(isWeakPasswordError(null)).toBe(false);
  });
});
