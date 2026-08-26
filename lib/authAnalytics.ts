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

export function trackAuthEvent(event: string, properties: { journey?: AuthJourney; challengeType?: string; route?: string; resultReason?: string; attemptNumber?: number } = {}) {
  trackProductEvent(event, { ...properties, attemptId: attemptId() });
}
