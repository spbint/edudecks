import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptCalendarSecret,
  encryptCalendarSecret,
  hashCalendarOAuthState,
} from "@/lib/clean/calendar-integrations/secretProtection";

const original = process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY;

beforeEach(() => {
  process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});

afterEach(() => {
  if (original === undefined) delete process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY;
  else process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY = original;
});

describe("calendar secret protection", () => {
  it("uses randomized authenticated encryption and round trips server secrets", () => {
    const first = encryptCalendarSecret("refresh-token-value");
    const second = encryptCalendarSecret("refresh-token-value");
    expect(first).not.toBe(second);
    expect(first).not.toContain("refresh-token-value");
    expect(decryptCalendarSecret(first)).toBe("refresh-token-value");
  });

  it("rejects tampering and invalid keys", () => {
    const encrypted = encryptCalendarSecret("secret");
    expect(() => decryptCalendarSecret(`${encrypted}x`)).toThrow("unreadable");
    process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY = "too-short";
    expect(() => encryptCalendarSecret("secret")).toThrow("not configured");
  });

  it("stores only a stable one-way OAuth state hash", () => {
    const state = "s".repeat(43);
    expect(hashCalendarOAuthState(state)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashCalendarOAuthState(state)).not.toContain(state);
  });
});
