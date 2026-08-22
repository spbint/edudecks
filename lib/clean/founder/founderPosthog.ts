const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID?.trim() || "469807";
const POSTHOG_HOST = (process.env.POSTHOG_HOST?.trim() || "https://us.posthog.com").replace(/\/+$/, "");

const FOUNDER_EVENT_NAMES = [
  "app_page_viewed",
  "product_signed_in",
  "daily_plan_viewed",
  "calendar_block_created",
  "calendar_block_save_succeeded",
  "calendar_block_updated",
  "quick_capture_opened",
  "quick_capture_saved",
  "capture_opened",
  "capture_save_succeeded",
  "evidence_created",
  "capture_first_attachment_selected",
  "quick_capture_photo_selected",
  "portfolio_viewed",
  "report_previewed",
  "daily_plan_pdf_downloaded",
  "weekly_plan_pdf_downloaded",
  "pathway_viewed",
  "coach_opened",
  "coach_primary_action_selected",
  "coach_recommendation_completed",
  "native_share_opened",
  "share_card_created",
  "share_card_opened",
] as const;

export type FounderTrackedEventName = (typeof FOUNDER_EVENT_NAMES)[number];

export type FounderProductEvent = {
  userId: string;
  event: FounderTrackedEventName;
  occurredAt: string;
  route: string | null;
  area: string | null;
};

export type FounderPostHogSnapshot = {
  available: boolean;
  events: FounderProductEvent[];
};

type PostHogQueryResponse = {
  columns?: unknown;
  results?: unknown;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isTrackedEvent(value: string): value is FounderTrackedEventName {
  return (FOUNDER_EVENT_NAMES as readonly string[]).includes(value);
}

function queryApiKey() {
  return clean(process.env.POSTHOG_PERSONAL_API_KEY || process.env.POSTHOG_QUERY_API_KEY);
}

function escapeSqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function parseQueryRows(payload: PostHogQueryResponse): FounderProductEvent[] {
  if (!Array.isArray(payload.columns) || !Array.isArray(payload.results)) return [];
  const columns = payload.columns.map((column) => clean(column));
  const indexes = {
    userId: columns.indexOf("distinct_id"),
    event: columns.indexOf("event"),
    occurredAt: columns.indexOf("timestamp"),
    route: columns.indexOf("route"),
    area: columns.indexOf("area"),
  };
  if (indexes.userId < 0 || indexes.event < 0 || indexes.occurredAt < 0) return [];

  return payload.results
    .map((row): FounderProductEvent | null => {
      if (!Array.isArray(row)) return null;
      const userId = clean(row[indexes.userId]);
      const event = clean(row[indexes.event]);
      const occurredAt = clean(row[indexes.occurredAt]);
      if (!userId || !isTrackedEvent(event) || !Number.isFinite(Date.parse(occurredAt))) return null;
      return {
        userId,
        event,
        occurredAt: new Date(occurredAt).toISOString(),
        route: indexes.route >= 0 ? clean(row[indexes.route]) || null : null,
        area: indexes.area >= 0 ? clean(row[indexes.area]) || null : null,
      };
    })
    .filter((event): event is FounderProductEvent => event !== null);
}

export async function loadFounderPostHogSnapshot(lookbackDays = 30): Promise<FounderPostHogSnapshot> {
  const apiKey = queryApiKey();
  if (!apiKey) return { available: false, events: [] };

  const days = Number.isFinite(lookbackDays)
    ? Math.max(1, Math.min(30, Math.floor(lookbackDays)))
    : 30;
  const eventList = FOUNDER_EVENT_NAMES.map(escapeSqlString).join(",");
  const query = `SELECT distinct_id, event, timestamp, properties.route AS route, properties.area AS area\nFROM events\nWHERE timestamp >= now() - INTERVAL ${days} DAY\n  AND event IN (${eventList})\nORDER BY timestamp DESC\nLIMIT 10000`;

  try {
    const response = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: { kind: "HogQLQuery", query },
        name: "MyLearna Founder plain-language activity",
      }),
    });

    if (!response.ok) return { available: false, events: [] };
    const payload = (await response.json()) as PostHogQueryResponse;
    return { available: true, events: parseQueryRows(payload) };
  } catch {
    return { available: false, events: [] };
  }
}

export const founderPostHogInternals = {
  parseQueryRows,
};
