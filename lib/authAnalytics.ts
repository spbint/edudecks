import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";

export type AuthJourney = "login" | "signup";

function attemptId() {
  if (typeof window === "undefined") return "anonymous";
  const key = "mylearna.auth.attemptId";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `auth-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

export function resetAuthAttempt() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem("mylearna.auth.attemptId");
}

const PENDING_ENTRY_KEY = "mylearna.auth.pendingEntry";
export function markPendingProductEntry(input: { journey: AuthJourney; challengeType: string; destination: string }) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_ENTRY_KEY, JSON.stringify({ attemptId: attemptId(), journey: input.journey, challengeType: input.challengeType, destination: input.destination }));
  } catch { /* storage may be unavailable in private webviews */ }
}
export function consumePendingProductEntry() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_ENTRY_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_ENTRY_KEY);
    const value = JSON.parse(raw) as { attemptId?: string; journey?: AuthJourney; challengeType?: string; destination?: string };
    if (!value.attemptId || !value.journey || !value.challengeType || !value.destination || !value.destination.startsWith("/")) return null;
    return value;
  } catch { return null; }
}

export function trackAuthEvent(event: string, properties: { journey?: AuthJourney; challengeType?: string; route?: string; resultReason?: string; attemptNumber?: number } = {}) {
  trackProductEvent(event, { ...properties, attemptId: attemptId() });
}
