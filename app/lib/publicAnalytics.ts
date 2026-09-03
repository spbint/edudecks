import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";

export type PublicTrafficSource =
  | "chatgpt"
  | "perplexity"
  | "gemini"
  | "copilot"
  | "claude"
  | "other-ai"
  | "direct"
  | "other-referral";

export type PublicAcquisitionEvent =
  | "public_session_source"
  | "public_demo_started"
  | "public_report_viewed"
  | "public_report_downloaded"
  | "public_signup_started"
  | "public_resource_viewed"
  | "public_resource_downloaded";

export type PublicResourceContext = {
  resource_id?: "homeschool-record-keeping";
  resource_asset?: "starter-kit" | "full-guide";
};

export const PUBLIC_SOURCE_STORAGE_KEY = "mylearna_public_source_v1";

const PUBLIC_TRAFFIC_SOURCES = new Set<PublicTrafficSource>([
  "chatgpt",
  "perplexity",
  "gemini",
  "copilot",
  "claude",
  "other-ai",
  "direct",
  "other-referral",
]);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const AI_SOURCE_PATTERNS: Array<[PublicTrafficSource, RegExp]> = [
  ["chatgpt", /chatgpt|openai/i],
  ["perplexity", /perplexity/i],
  ["gemini", /gemini/i],
  ["copilot", /copilot/i],
  ["claude", /claude/i],
];

export function classifyPublicTrafficSource(input: {
  referrer?: string | null;
  source?: string | null;
}): PublicTrafficSource {
  const value = `${input.source ?? ""} ${input.referrer ?? ""}`;

  for (const [category, pattern] of AI_SOURCE_PATTERNS) {
    if (pattern.test(value)) return category;
  }

  if (!input.referrer && !input.source) return "direct";
  if (/ai|assistant|llm/i.test(value)) return "other-ai";
  return "other-referral";
}

export type PublicSourceStorage = Pick<Storage, "getItem" | "setItem">;

function isPublicTrafficSource(value: string | null): value is PublicTrafficSource {
  return value !== null && PUBLIC_TRAFFIC_SOURCES.has(value as PublicTrafficSource);
}

export function getOrSetPublicTrafficSource(
  input: { referrer?: string | null; source?: string | null },
  storage?: PublicSourceStorage,
) {
  let persisted: string | null = null;
  try {
    persisted = storage?.getItem(PUBLIC_SOURCE_STORAGE_KEY) ?? null;
  } catch {
    persisted = null;
  }

  if (isPublicTrafficSource(persisted)) return persisted;

  const classified = classifyPublicTrafficSource(input);
  try {
    storage?.setItem(PUBLIC_SOURCE_STORAGE_KEY, classified);
  } catch {
    // Storage can be unavailable; the current event remains safely classifiable.
  }
  return classified;
}

export function buildPublicAcquisitionParams(
  source: PublicTrafficSource,
  pathname: string,
  context: PublicResourceContext = {},
) {
  return {
    public_source: source,
    page_path: pathname,
    ...(context.resource_id ? { resource_id: context.resource_id } : {}),
    ...(context.resource_asset ? { resource_asset: context.resource_asset } : {}),
  };
}

function isPublicRoute(pathname: string) {
  return [
    "/",
    "/demo",
    "/start-free",
    "/login",
    "/signup",
    "/get-started",
    "/about",
    "/contact",
    "/pricing",
    "/faq",
    "/homeschool-answers",
    "/compare",
    "/privacy",
    "/terms",
    "/cookies",
    "/homeschool-record-keeping",
    "/homeschool-learning-evidence",
    "/homeschool-portfolio",
    "/homeschool-reporting",
    "/homeschool-planning",
    "/homeschool-maths-worksheets",
  ].includes(pathname);
}

export function trackPublicAcquisitionEvent(
  eventName: PublicAcquisitionEvent,
  pathname: string,
  context: PublicResourceContext = {},
) {
  if (typeof window === "undefined") return;
  if (!isPublicRoute(pathname)) return;

  const params = new URLSearchParams(window.location.search);
  const source = params.get("source") || params.get("utm_source");
  const publicSource = getOrSetPublicTrafficSource({
    source,
    referrer: document.referrer || null,
  }, window.sessionStorage);
  const acquisitionParams = buildPublicAcquisitionParams(publicSource, pathname, context);

  trackProductEvent(eventName, acquisitionParams);

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, acquisitionParams);
  }
}
