const DEFAULT_PROJECT_ID = "469807";
const DEFAULT_PERIOD_DAYS = 30;

export type FounderFeatureUsage = {
  feature: string;
  events: number;
  users: number;
};

export type FounderCustomerBehavior = {
  userId: string;
  signIns: number;
  activeDays: number;
  actions: number;
  lastEventAt: string | null;
  myDayViews: number;
  calendarActions: number;
  pathwayViews: number;
  captureActions: number;
  portfolioViews: number;
  reportViews: number;
  evidenceCreated: number;
};

export type FounderBehaviorData = {
  configured: boolean;
  periodDays: number;
  totals: {
    activeUsers: number;
    signIns: number;
    productActions: number;
    evidenceCreated: number;
  };
  featureUsage: FounderFeatureUsage[];
  customers: FounderCustomerBehavior[];
};

type HogQLResponse = {
  columns?: unknown;
  results?: unknown;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function apiHost() {
  const explicit = clean(process.env.POSTHOG_API_HOST).replace(/\/+$/, "");
  if (explicit) return explicit;

  const publicHost = clean(process.env.NEXT_PUBLIC_POSTHOG_HOST).replace(/\/+$/, "");
  if (!publicHost) return "https://us.posthog.com";
  return publicHost
    .replace("https://us.i.posthog.com", "https://us.posthog.com")
    .replace("https://eu.i.posthog.com", "https://eu.posthog.com");
}

function config() {
  const key = clean(process.env.POSTHOG_PERSONAL_API_KEY);
  const projectId = clean(process.env.POSTHOG_PROJECT_ID) || DEFAULT_PROJECT_ID;
  if (!key || !projectId) return null;
  return { key, projectId, host: apiHost() };
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function exclusionClause(userIds: string[]) {
  const safeIds = userIds.filter(validUuid);
  if (safeIds.length === 0) return "";
  const values = safeIds.map((id) => `'${id}'`).join(",");
  return ` AND distinct_id NOT IN (${values})`;
}

async function runHogQL(query: string, name: string): Promise<HogQLResponse | null> {
  const current = config();
  if (!current) return null;

  try {
    const response = await fetch(
      `${current.host}/api/projects/${encodeURIComponent(current.projectId)}/query/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${current.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: { kind: "HogQLQuery", query },
          name,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) return null;
    return (await response.json()) as HogQLResponse;
  } catch {
    return null;
  }
}

function resultRows(response: HogQLResponse | null) {
  if (!response || !Array.isArray(response.columns) || !Array.isArray(response.results)) return [];
  const columns = response.columns.filter((value): value is string => typeof value === "string");
  if (columns.length === 0) return [];

  return response.results
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index]])));
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return 0;
}

function isoValue(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function emptyData(): FounderBehaviorData {
  return {
    configured: false,
    periodDays: DEFAULT_PERIOD_DAYS,
    totals: { activeUsers: 0, signIns: 0, productActions: 0, evidenceCreated: 0 },
    featureUsage: [],
    customers: [],
  };
}

export async function loadFounderBehavior(
  excludedUserIds: string[] = [],
  periodDays = DEFAULT_PERIOD_DAYS,
): Promise<FounderBehaviorData> {
  if (!config()) return emptyData();

  const days = Math.max(1, Math.min(90, Math.round(periodDays)));
  const excluded = exclusionClause(excludedUserIds);
  const eventSet = [
    "product_signed_in",
    "app_page_viewed",
    "daily_plan_viewed",
    "calendar_block_created",
    "calendar_block_updated",
    "pathway_viewed",
    "capture_opened",
    "capture_save_succeeded",
    "quick_capture_opened",
    "quick_capture_saved",
    "portfolio_viewed",
    "report_previewed",
    "evidence_created",
  ];
  const eventsSql = eventSet.map((event) => `'${event}'`).join(",");
  const where = `timestamp >= now() - INTERVAL ${days} DAY AND event IN (${eventsSql})${excluded}`;

  const [customerResponse, featureResponse] = await Promise.all([
    runHogQL(
      `SELECT distinct_id AS user_id, countIf(event = 'product_signed_in') AS sign_ins, count(DISTINCT toDate(timestamp)) AS active_days, count() AS actions, max(timestamp) AS last_event_at, countIf(event = 'daily_plan_viewed') AS my_day_views, countIf(event IN ('calendar_block_created','calendar_block_updated')) AS calendar_actions, countIf(event = 'pathway_viewed') AS pathway_views, countIf(event IN ('capture_opened','capture_save_succeeded','quick_capture_opened','quick_capture_saved')) AS capture_actions, countIf(event = 'portfolio_viewed') AS portfolio_views, countIf(event = 'report_previewed') AS report_views, countIf(event = 'evidence_created') AS evidence_created FROM events WHERE ${where} GROUP BY distinct_id ORDER BY last_event_at DESC LIMIT 5000`,
      "MyLearna founder customer behaviour",
    ),
    runHogQL(
      `SELECT multiIf(event = 'daily_plan_viewed','My Day', event IN ('calendar_block_created','calendar_block_updated'),'My Calendar', event = 'pathway_viewed','My Pathways', event IN ('capture_opened','capture_save_succeeded','quick_capture_opened','quick_capture_saved','evidence_created'),'My Capture', event = 'portfolio_viewed','My Portfolio', event = 'report_previewed','My Reports', event = 'product_signed_in','Sign in', 'Other') AS feature, count() AS events, count(DISTINCT distinct_id) AS users FROM events WHERE ${where} AND event != 'app_page_viewed' GROUP BY feature ORDER BY events DESC`,
      "MyLearna founder feature usage",
    ),
  ]);

  if (!customerResponse || !featureResponse) return emptyData();

  const customers: FounderCustomerBehavior[] = resultRows(customerResponse)
    .map((row) => ({
      userId: clean(row.user_id),
      signIns: numberValue(row.sign_ins),
      activeDays: numberValue(row.active_days),
      actions: numberValue(row.actions),
      lastEventAt: isoValue(row.last_event_at),
      myDayViews: numberValue(row.my_day_views),
      calendarActions: numberValue(row.calendar_actions),
      pathwayViews: numberValue(row.pathway_views),
      captureActions: numberValue(row.capture_actions),
      portfolioViews: numberValue(row.portfolio_views),
      reportViews: numberValue(row.report_views),
      evidenceCreated: numberValue(row.evidence_created),
    }))
    .filter((row) => row.userId.length > 0);

  const featureUsage: FounderFeatureUsage[] = resultRows(featureResponse)
    .map((row) => ({
      feature: clean(row.feature),
      events: numberValue(row.events),
      users: numberValue(row.users),
    }))
    .filter((row) => row.feature.length > 0 && row.feature !== "Other");

  return {
    configured: true,
    periodDays: days,
    totals: {
      activeUsers: customers.length,
      signIns: customers.reduce((total, customer) => total + customer.signIns, 0),
      productActions: customers.reduce((total, customer) => total + customer.actions, 0),
      evidenceCreated: customers.reduce((total, customer) => total + customer.evidenceCreated, 0),
    },
    featureUsage,
    customers,
  };
}
