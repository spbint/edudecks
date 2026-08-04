type ProductAnalyticsProperties = Record<string, unknown>;

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
const POSTHOG_HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ?? "").replace(/\/+$/, "");

const SAFE_PROPERTY_KEYS = new Set([
  "mission",
  "step",
  "presentation",
  "area",
  "route",
  "featureArea",
  "learnerCount",
  "subject",
  "strand",
  "stepNumber",
  "questionCount",
  "correctCount",
  "incorrectCount",
  "notSureCount",
  "supportRecommendedCount",
  "scoreBand",
  "parentJudgementPresent",
  "hasEvidence",
  "reportPeriodDays",
  "blockType",
  "hasLearner",
  "hasLearningArea",
  "hasStartTime",
  "hasEndTime",
  "viewType",
  "source",
  "entryType",
  "dateRangeDays",
  "format",
  "hasImage",
  "hasCaption",
  "includeLearnerName",
  "includeLearningArea",
  "includeHashtag",
  "timestamp",
]);

const UNSAFE_KEY_PATTERN =
  /(name|email|text|body|note|description|answer|response|file|photo|content|title|message)/i;

function isBrowser() {
  return typeof window !== "undefined";
}

function isConfigured() {
  return Boolean(POSTHOG_KEY && POSTHOG_HOST);
}

function sanitizeProperties(properties: ProductAnalyticsProperties = {}) {
  const sanitized: ProductAnalyticsProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    if (!SAFE_PROPERTY_KEYS.has(key) || UNSAFE_KEY_PATTERN.test(key)) {
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[key] = value;
    }
  }

  sanitized.timestamp = new Date().toISOString();
  return sanitized;
}

function getAnonymousDistinctId() {
  if (!isBrowser()) return "anonymous";

  const storageKey = "mylearna.productAnalytics.distinctId";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(storageKey, generated);
  return generated;
}

function posthogCapture(eventName: string, properties: ProductAnalyticsProperties, userId?: string | null) {
  if (!isBrowser() || !isConfigured()) return;

  const payload = JSON.stringify({
    api_key: POSTHOG_KEY,
    event: eventName,
    distinct_id: userId || getAnonymousDistinctId(),
    properties: sanitizeProperties(properties),
  });

  const url = `${POSTHOG_HOST}/capture/`;

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never interrupt product use.
  });
}

export function trackProductEvent(
  eventName: string,
  properties: ProductAnalyticsProperties = {},
  userId?: string | null,
) {
  posthogCapture(eventName, properties, userId);
}

export function identifyProductUser(userId: string | null | undefined, safeProperties: ProductAnalyticsProperties = {}) {
  if (!userId) return;
  posthogCapture("$identify", safeProperties, userId);
}

export function trackPageView(route: string, area: string, userId?: string | null) {
  trackProductEvent("app_page_viewed", { route, area }, userId);
}

export function getScoreBand(correctCount: number, questionCount: number) {
  if (questionCount <= 0) return "unknown";
  const ratio = correctCount / questionCount;
  if (ratio >= 0.85) return "high";
  if (ratio >= 0.5) return "medium";
  return "low";
}
