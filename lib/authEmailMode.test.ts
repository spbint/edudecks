import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailAuthDelivery } from "@/lib/authEmailMode";

describe("email auth delivery mode", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults to the six-digit email OTP flow", () => {
    vi.stubEnv("NEXT_PUBLIC_MYLEARNA_EMAIL_AUTH_MODE", "");
    expect(getEmailAuthDelivery()).toBe("otp-code");
  });

  it("preserves an explicit magic-link configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_MYLEARNA_EMAIL_AUTH_MODE", "magic-link");
    expect(getEmailAuthDelivery()).toBe("magic-link");
  });
});
