export type FounderMetricSource =
  | "Supabase Auth"
  | "Supabase signup attribution"
  | "PostHog"
  | "Shopify";

export type FounderAcquisitionChannel = "Pinterest" | "Google" | "Direct" | "Social" | "Other";

export type FounderMetric = {
  value: number | null;
  format: "number" | "currency" | "percent";
  source: FounderMetricSource;
  availability: "live" | "unavailable";
  currencyCode?: string;
};

export type FounderActivity = {
  kind: "signup";
  occurredAt: string;
};

export type FounderAccountSnapshot = {
  signupsToday: number;
  returningToday: number;
  activeThisWeek: number;
  returningFamiliesThisWeek: number | null;
  acquisitionToday: Record<FounderAcquisitionChannel, number> | null;
  recentActivity: FounderActivity[];
};

export type FounderProductAnalyticsSnapshot = {
  visitorsToday: number;
  activeNow: number;
  acquisition: Partial<Record<FounderAcquisitionChannel, number>>;
  marketplace: Partial<Record<"productViews" | "addToCarts" | "checkoutStarts", number>>;
  productUsage: Partial<Record<"My Day" | "My Capture" | "My Pathways" | "My Reports" | "Marketplace", number>>;
  sevenDayReturnRate: number;
};

export type FounderCommerceSnapshot = {
  currencyCode: string;
  ordersToday: number;
  revenueToday: number;
  marketplaceOrders: number;
  marketplaceRevenue: number;
};

export type FounderDataProviders = {
  accounts: () => Promise<FounderAccountSnapshot | null>;
  productAnalytics: () => Promise<FounderProductAnalyticsSnapshot | null>;
  commerce: () => Promise<FounderCommerceSnapshot | null>;
};

export type FounderCockpitData = {
  generatedAt: string;
  today: {
    visitors: FounderMetric;
    signups: FounderMetric;
    returning: FounderMetric;
    orders: FounderMetric;
    revenue: FounderMetric;
  };
  liveNow: {
    activeUsers: FounderMetric;
  };
  acquisition: Record<FounderAcquisitionChannel, FounderMetric>;
  marketplace: {
    productViews: FounderMetric;
    addToCarts: FounderMetric;
    checkoutStarts: FounderMetric;
    orders: FounderMetric;
    revenue: FounderMetric;
  };
  productUsage: Record<"My Day" | "My Capture" | "My Pathways" | "My Reports" | "Marketplace", FounderMetric>;
  retention: {
    activeThisWeek: FounderMetric;
    returningFamilies: FounderMetric;
    sevenDayReturnRate: FounderMetric;
  };
  recentActivity: FounderActivity[];
};

function unavailable(source: FounderMetricSource, format: FounderMetric["format"] = "number"): FounderMetric {
  return { value: null, format, source, availability: "unavailable" };
}

function live(
  value: number,
  source: FounderMetricSource,
  format: FounderMetric["format"] = "number",
  currencyCode?: string,
): FounderMetric {
  return { value, format, source, availability: "live", ...(currencyCode ? { currencyCode } : {}) };
}

async function safelyLoad<T>(provider: () => Promise<T | null>) {
  try {
    return await provider();
  } catch {
    return null;
  }
}

export async function buildFounderCockpitData(
  providers: FounderDataProviders,
  now = new Date(),
): Promise<FounderCockpitData> {
  const [accounts, productAnalytics, commerce] = await Promise.all([
    safelyLoad(providers.accounts),
    safelyLoad(providers.productAnalytics),
    safelyLoad(providers.commerce),
  ]);

  const acquisitionChannels = ["Pinterest", "Google", "Direct", "Social", "Other"] as const;
  const productAreas = ["My Day", "My Capture", "My Pathways", "My Reports", "Marketplace"] as const;

  return {
    generatedAt: now.toISOString(),
    today: {
      visitors: productAnalytics
        ? live(productAnalytics.visitorsToday, "PostHog")
        : unavailable("PostHog"),
      signups: accounts ? live(accounts.signupsToday, "Supabase Auth") : unavailable("Supabase Auth"),
      returning: accounts
        ? live(accounts.returningToday, "Supabase Auth")
        : unavailable("Supabase Auth"),
      orders: commerce ? live(commerce.ordersToday, "Shopify") : unavailable("Shopify"),
      revenue: commerce
        ? live(commerce.revenueToday, "Shopify", "currency", commerce.currencyCode)
        : unavailable("Shopify", "currency"),
    },
    liveNow: {
      activeUsers: productAnalytics
        ? live(productAnalytics.activeNow, "PostHog")
        : unavailable("PostHog"),
    },
    acquisition: Object.fromEntries(
      acquisitionChannels.map((channel) => [
        channel,
        accounts?.acquisitionToday
          ? live(accounts.acquisitionToday[channel], "Supabase signup attribution")
          : productAnalytics && typeof productAnalytics.acquisition[channel] === "number"
            ? live(productAnalytics.acquisition[channel], "PostHog")
            : unavailable("PostHog"),
      ]),
    ) as FounderCockpitData["acquisition"],
    marketplace: {
      productViews:
        productAnalytics && typeof productAnalytics.marketplace.productViews === "number"
          ? live(productAnalytics.marketplace.productViews, "PostHog")
          : unavailable("PostHog"),
      addToCarts:
        productAnalytics && typeof productAnalytics.marketplace.addToCarts === "number"
          ? live(productAnalytics.marketplace.addToCarts, "PostHog")
          : unavailable("PostHog"),
      checkoutStarts:
        productAnalytics && typeof productAnalytics.marketplace.checkoutStarts === "number"
          ? live(productAnalytics.marketplace.checkoutStarts, "PostHog")
          : unavailable("PostHog"),
      orders: commerce ? live(commerce.marketplaceOrders, "Shopify") : unavailable("Shopify"),
      revenue: commerce
        ? live(commerce.marketplaceRevenue, "Shopify", "currency", commerce.currencyCode)
        : unavailable("Shopify", "currency"),
    },
    productUsage: Object.fromEntries(
      productAreas.map((area) => [
        area,
        productAnalytics && typeof productAnalytics.productUsage[area] === "number"
          ? live(productAnalytics.productUsage[area], "PostHog")
          : unavailable("PostHog"),
      ]),
    ) as FounderCockpitData["productUsage"],
    retention: {
      activeThisWeek: accounts
        ? live(accounts.activeThisWeek, "Supabase Auth")
        : unavailable("Supabase Auth"),
      returningFamilies:
        accounts && typeof accounts.returningFamiliesThisWeek === "number"
          ? live(accounts.returningFamiliesThisWeek, "Supabase Auth")
          : unavailable("Supabase Auth"),
      sevenDayReturnRate: productAnalytics
        ? live(productAnalytics.sevenDayReturnRate, "PostHog", "percent")
        : unavailable("PostHog", "percent"),
    },
    recentActivity: (accounts?.recentActivity ?? [])
      .filter(
        (activity) =>
          activity.kind === "signup" && Number.isFinite(Date.parse(activity.occurredAt)),
      )
      .slice(0, 8)
      .map((activity) => ({ kind: "signup", occurredAt: activity.occurredAt })),
  };
}
