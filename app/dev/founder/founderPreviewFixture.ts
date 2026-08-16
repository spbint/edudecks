import type { FounderCockpitData, FounderMetric } from "@/lib/clean/founder/founderData";

function metric(
  value: number,
  source: FounderMetric["source"],
  format: FounderMetric["format"] = "number",
  currencyCode?: string,
): FounderMetric {
  return {
    value,
    source,
    format,
    availability: "live",
    ...(currencyCode ? { currencyCode } : {}),
  };
}

// Local visual-review fixture only. It is never read by the production Founder route.
export const FOUNDER_PREVIEW_MOCK_DATA: FounderCockpitData = {
  generatedAt: "2026-08-16T07:30:00.000Z",
  today: {
    visitors: metric(148, "PostHog"),
    signups: metric(12, "Supabase Auth"),
    returning: metric(64, "Supabase Auth"),
    orders: metric(7, "Shopify"),
    revenue: metric(426.5, "Shopify", "currency", "AUD"),
  },
  liveNow: {
    activeUsers: metric(11, "PostHog"),
  },
  acquisition: {
    Pinterest: metric(4, "Supabase signup attribution"),
    Google: metric(3, "Supabase signup attribution"),
    Direct: metric(2, "Supabase signup attribution"),
    Social: metric(2, "Supabase signup attribution"),
    Other: metric(1, "Supabase signup attribution"),
  },
  marketplace: {
    productViews: metric(86, "PostHog"),
    addToCarts: metric(19, "PostHog"),
    checkoutStarts: metric(10, "PostHog"),
    orders: metric(7, "Shopify"),
    revenue: metric(426.5, "Shopify", "currency", "AUD"),
  },
  productUsage: {
    "My Day": metric(71, "PostHog"),
    "My Capture": metric(38, "PostHog"),
    "My Pathways": metric(25, "PostHog"),
    "My Reports": metric(17, "PostHog"),
    Marketplace: metric(49, "PostHog"),
  },
  retention: {
    activeThisWeek: metric(214, "Supabase Auth"),
    returningFamilies: metric(106, "Supabase Auth"),
    sevenDayReturnRate: metric(0.42, "PostHog", "percent"),
  },
  recentActivity: [
    { kind: "signup", occurredAt: "2026-08-16T07:22:00.000Z" },
    { kind: "signup", occurredAt: "2026-08-16T06:48:00.000Z" },
    { kind: "signup", occurredAt: "2026-08-16T05:31:00.000Z" },
  ],
};

