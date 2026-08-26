import type { FounderProductEvent } from "./founderPosthog";

const GRACE_MS = 30 * 60 * 1000;
const AUTH_EVENTS = new Set([
  "auth_email_submitted", "auth_challenge_sent", "auth_resend_selected",
  "auth_verification_succeeded", "auth_verification_failed", "auth_session_ready",
  "auth_product_entry", "auth_callback_missing_pkce", "auth_callback_reconciled",
  "auth_callback_failed",
]);

export type FounderAuthAccount = {
  userId: string;
  displayName: string;
  joinedAt: string;
  confirmedAt: string | null;
  lastSignInAt: string | null;
  profileCompleted: boolean;
  learnerCount: number;
  planningStarted?: boolean;
  evidenceSaved?: boolean;
  firstValueAt?: string | null;
};

export type FounderAuthAccountFlag = {
  id: string;
  operatingType: "CHECK";
  title: string;
  summary: string;
  userId: string;
  displayName: string;
};

export type FounderAuthAttemptOutcome = {
  attemptId: string;
  challengeSent: boolean;
  resendCount: number;
  verificationSucceeded: boolean;
  verificationFailed: boolean;
  sessionReady: boolean;
  productEntry: boolean;
  callbackRecovered: boolean;
  callbackFailed: boolean;
  browserContext: string;
  sessionHandoffUnresolved: boolean;
};

export type FounderAuthFunnel = {
  rangeDays: 7 | 30;
  accountOutcomes: { created: number; confirmed: number; signedIn: number; familySetup: number; learnerAdded: number; planningStarted: number; evidenceSaved: number } | null;
  detailed: { challengeSent: number; verificationSucceeded: number; sessionReady: number; productEntry: number; callbackRecovery: number; callbackFailures: number; resends: number } | null;
  posthogAvailable: boolean;
  supabaseAvailable: boolean;
  earliestTrackedAuthEventAt: string | null;
  coverageMessage: string;
  flags: FounderAuthAccountFlag[];
  signals: Array<{ id: string; operatingType: "CHECK" | "INVESTIGATE"; title: string; summary: string }>;
  browserContext: Record<string, number>;
};

function parsed(value: string | null | undefined) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function inWindow(value: string | null | undefined, start: number, end: number) {
  const time = parsed(value);
  return time !== null && time >= start && time <= end;
}

export function deriveAuthAttemptOutcomes(events: FounderProductEvent[]): FounderAuthAttemptOutcome[] {
  const groups = new Map<string, FounderProductEvent[]>();
  for (const event of events) {
    if (!AUTH_EVENTS.has(event.event)) continue;
    const id = event.authAttemptId || `user:${event.userId}:${event.occurredAt}`;
    const group = groups.get(id) ?? [];
    group.push(event); groups.set(id, group);
  }
  return [...groups].map(([attemptId, group]) => {
    const ordered = group.sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
    const contexts = ordered.map((event) => event.browserContextCategory).filter(Boolean) as string[];
    return {
      attemptId,
      challengeSent: ordered.some((event) => event.event === "auth_challenge_sent"),
      resendCount: ordered.filter((event) => event.event === "auth_resend_selected").length,
      verificationSucceeded: ordered.some((event) => event.event === "auth_verification_succeeded"),
      verificationFailed: ordered.some((event) => event.event === "auth_verification_failed"),
      sessionReady: ordered.some((event) => event.event === "auth_session_ready"),
      productEntry: ordered.some((event) => event.event === "auth_product_entry"),
      callbackRecovered: ordered.some((event) => event.event === "auth_callback_reconciled"),
      callbackFailed: ordered.some((event) => event.event === "auth_callback_missing_pkce" || event.event === "auth_callback_failed"),
      browserContext: contexts[0] ?? "unknown",
      sessionHandoffUnresolved: ordered.some((event) => event.event === "auth_verification_succeeded") && !ordered.some((event) => event.event === "auth_product_entry"),
    };
  });
}

export function deriveFounderAuthFunnel(input: {
  accounts: FounderAuthAccount[] | null;
  events: FounderProductEvent[];
  posthogAvailable: boolean;
  supabaseAvailable: boolean;
  rangeDays: 7 | 30;
  now?: Date;
}): FounderAuthFunnel {
  const now = input.now ?? new Date();
  const end = now.getTime();
  const start = end - input.rangeDays * 24 * 60 * 60 * 1000;
  const accounts = input.accounts?.filter((account) => inWindow(account.joinedAt, start, end)) ?? [];
  const accountOutcomes = input.supabaseAvailable && input.accounts ? {
    created: accounts.length,
    confirmed: accounts.filter((a) => inWindow(a.confirmedAt, start, end) || (parsed(a.confirmedAt) !== null && parsed(a.confirmedAt)! >= parsed(a.joinedAt)!)).length,
    signedIn: accounts.filter((a) => inWindow(a.lastSignInAt, start, end) || (parsed(a.lastSignInAt) !== null && parsed(a.lastSignInAt)! >= parsed(a.joinedAt)!)).length,
    familySetup: accounts.filter((a) => a.profileCompleted).length,
    learnerAdded: accounts.filter((a) => a.learnerCount > 0).length,
    planningStarted: accounts.filter((a) => a.planningStarted || a.evidenceSaved || a.firstValueAt).length,
    evidenceSaved: accounts.filter((a) => a.evidenceSaved || a.firstValueAt).length,
  } : null;
  const authEvents = input.events.filter((event) => inWindow(event.occurredAt, start, end));
  const outcomes = deriveAuthAttemptOutcomes(authEvents);
  const earliest = input.posthogAvailable ? input.events.filter((e) => AUTH_EVENTS.has(e.event)).map((e) => e.occurredAt).sort()[0] ?? null : null;
  const detailed = input.posthogAvailable ? {
    challengeSent: outcomes.filter((o) => o.challengeSent).length,
    verificationSucceeded: outcomes.filter((o) => o.verificationSucceeded).length,
    sessionReady: outcomes.filter((o) => o.sessionReady).length,
    productEntry: outcomes.filter((o) => o.productEntry).length,
    callbackRecovery: outcomes.filter((o) => o.callbackRecovered).length,
    callbackFailures: outcomes.filter((o) => o.callbackFailed && !o.callbackRecovered).length,
    resends: outcomes.reduce((sum, o) => sum + o.resendCount, 0),
  } : null;
  const flags: FounderAuthAccountFlag[] = [];
  for (const account of input.accounts ?? []) {
    const age = end - (parsed(account.joinedAt) ?? end);
    const confirmed = parsed(account.confirmedAt) !== null;
    if (age < GRACE_MS) continue;
    if (!confirmed) flags.push({ id: `auth-unconfirmed:${account.userId}`, operatingType: "CHECK", title: "CHECK — EMAIL NOT CONFIRMED", summary: `${account.displayName} has not confirmed their email yet.`, userId: account.userId, displayName: account.displayName });
    else if (!account.lastSignInAt) flags.push({ id: `auth-no-signin:${account.userId}`, operatingType: "CHECK", title: "CHECK — CONFIRMED BUT NOT SIGNED IN", summary: `${account.displayName} confirmed email but has not entered MyLearna.`, userId: account.userId, displayName: account.displayName });
    else if (!account.profileCompleted) flags.push({ id: `auth-no-family:${account.userId}`, operatingType: "CHECK", title: "CHECK — SIGNED IN BUT SETUP NOT STARTED", summary: `${account.displayName} signed in but has not created a family profile.`, userId: account.userId, displayName: account.displayName });
  }
  const unresolved = (predicate: (o: FounderAuthAttemptOutcome) => boolean) => outcomes.filter(predicate).length;
  const signals: FounderAuthFunnel["signals"] = [];
  if (unresolved((o) => o.callbackFailed && !o.callbackRecovered) >= 2) signals.push({ id: "auth-callback-friction", operatingType: "INVESTIGATE", title: "INVESTIGATE — CALLBACK BROWSER HANDOFF", summary: "Multiple auth attempts did not recover from callback handoff friction." });
  if (unresolved((o) => o.verificationFailed && !o.verificationSucceeded) >= 2) signals.push({ id: "auth-verification-friction", operatingType: "INVESTIGATE", title: "INVESTIGATE — VERIFICATION FRICTION", summary: "Multiple auth attempts failed verification without later success." });
  if (unresolved((o) => o.resendCount > 1 && !o.verificationSucceeded) >= 2) signals.push({ id: "auth-repeat-resend", operatingType: "CHECK", title: "CHECK — REPEATED RESEND", summary: "Multiple auth attempts resent challenges without verification." });
  if (unresolved((o) => o.sessionHandoffUnresolved) >= 2) signals.push({ id: "auth-session-handoff", operatingType: "INVESTIGATE", title: "INVESTIGATE — SESSION HANDOFF", summary: "Multiple verified attempts did not later enter MyLearna." });
  const browserContext: Record<string, number> = {};
  for (const outcome of outcomes) browserContext[outcome.browserContext] = (browserContext[outcome.browserContext] ?? 0) + 1;
  return { rangeDays: input.rangeDays, accountOutcomes, detailed, posthogAvailable: input.posthogAvailable, supabaseAvailable: input.supabaseAvailable, earliestTrackedAuthEventAt: earliest, coverageMessage: !input.posthogAvailable ? "Detailed auth behaviour unavailable" : earliest ? `Detailed tracking available since ${earliest}` : "Detailed auth-step tracking begins after this release is deployed.", flags, signals, browserContext };
}

export const founderAuthFunnelInternals = { parsed, inWindow, GRACE_MS };
