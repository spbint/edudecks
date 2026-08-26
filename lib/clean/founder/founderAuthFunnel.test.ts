import { describe, expect, it } from "vitest";
import { deriveAuthAttemptOutcomes, deriveFounderAuthFunnel, type FounderAuthAccount } from "./founderAuthFunnel";
import type { FounderProductEvent } from "./founderPosthog";

const now = new Date("2026-08-26T00:00:00.000Z");
const account = (overrides: Partial<FounderAuthAccount> = {}): FounderAuthAccount => ({
  userId: "u1", displayName: "Jamie", joinedAt: "2026-08-25T00:00:00.000Z", confirmedAt: "2026-08-25T00:10:00.000Z", lastSignInAt: null, profileCompleted: false, learnerCount: 0, ...overrides,
});
const event = (eventName: FounderProductEvent["event"], occurredAt: string, extra: Partial<FounderProductEvent> = {}): FounderProductEvent => ({ userId: "anon", event: eventName, occurredAt, route: "/login", area: null, ...extra });

describe("founder auth funnel", () => {
  it("derives account outcomes and grace-period flags", () => {
    const result = deriveFounderAuthFunnel({ accounts: [account(), account({ userId: "u2", joinedAt: "2026-08-26T00:00:00.000Z", confirmedAt: null })], events: [], posthogAvailable: false, supabaseAvailable: true, rangeDays: 7, now });
    expect(result.accountOutcomes).toMatchObject({ created: 2, confirmed: 1, signedIn: 0 });
    expect(result.flags.map((flag) => flag.id)).toContain("auth-no-signin:u1");
    expect(result.flags.map((flag) => flag.id)).not.toContain("auth-unconfirmed:u2");
  });

  it("treats recovered attempts as successful", () => {
    const events = [
      event("auth_challenge_sent", "2026-08-25T01:00:00Z", { authAttemptId: "a1" }),
      event("auth_verification_failed", "2026-08-25T01:01:00Z", { authAttemptId: "a1" }),
      event("auth_verification_succeeded", "2026-08-25T01:02:00Z", { authAttemptId: "a1" }),
      event("auth_session_ready", "2026-08-25T01:03:00Z", { authAttemptId: "a1" }),
      event("auth_product_entry", "2026-08-25T01:04:00Z", { authAttemptId: "a1", browserContextCategory: "standard_browser" }),
    ];
    const result = deriveFounderAuthFunnel({ accounts: [], events, posthogAvailable: true, supabaseAvailable: true, rangeDays: 7, now });
    expect(result.detailed).toMatchObject({ challengeSent: 1, verificationSucceeded: 1, productEntry: 1, callbackFailures: 0 });
    expect(result.signals).toHaveLength(0);
    expect(deriveAuthAttemptOutcomes(events)[0].verificationSucceeded).toBe(true);
  });

  it("only emits aggregate friction after two unresolved attempts", () => {
    const events = ["a1", "a2"].flatMap((id, i) => [event("auth_callback_missing_pkce", `2026-08-25T0${i + 1}:00:00Z`, { authAttemptId: id })]);
    const result = deriveFounderAuthFunnel({ accounts: [], events, posthogAvailable: true, supabaseAvailable: false, rangeDays: 7, now });
    expect(result.signals[0]?.operatingType).toBe("INVESTIGATE");
  });

  it("emits session handoff investigation only for two unresolved verified attempts", () => {
    const events = ["a1", "a2"].flatMap((id, i) => [event("auth_verification_succeeded", `2026-08-25T0${i + 1}:00:00Z`, { authAttemptId: id })]);
    const result = deriveFounderAuthFunnel({ accounts: [], events, posthogAvailable: true, supabaseAvailable: false, rangeDays: 7, now });
    expect(result.signals.map((signal) => signal.id)).toContain("auth-session-handoff");
    const recovered = deriveFounderAuthFunnel({ accounts: [], events: [...events, event("auth_session_ready", "2026-08-25T03:00:00Z", { authAttemptId: "a1" }), event("auth_product_entry", "2026-08-25T04:00:00Z", { authAttemptId: "a1" })], posthogAvailable: true, supabaseAvailable: false, rangeDays: 7, now });
    expect(recovered.signals.map((signal) => signal.id)).not.toContain("auth-session-handoff");
  });
});
