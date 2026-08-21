import type { FounderCustomerBase } from "@/lib/clean/founder/founderCustomers";
import type { FounderProductEvent, FounderTrackedEventName } from "@/lib/clean/founder/founderPosthog";

const DAY_MS = 24 * 60 * 60 * 1000;
const CURRENT_WINDOW_MS = 7 * DAY_MS;
const PREVIOUS_WINDOW_MS = 14 * DAY_MS;

export type FounderTrendStatus = "Growing" | "Softer" | "Steady" | "New" | "Quiet" | "Waiting";

export type FounderTrendItem = {
  label: string;
  current: number | null;
  previous: number | null;
  unit: "families" | "actions";
  status: FounderTrendStatus;
  detail: string;
};

export type FounderTrendIntelligence = {
  periodLabel: string;
  summary: string;
  items: FounderTrendItem[];
};

type Window = "current" | "previous" | null;

function windowForTimestamp(value: string, now: Date): Window {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  const age = now.getTime() - timestamp;
  if (age < 0) return null;
  if (age < CURRENT_WINDOW_MS) return "current";
  if (age < PREVIOUS_WINDOW_MS) return "previous";
  return null;
}

function isMeaningfulLearningAction(event: FounderTrackedEventName) {
  return [
    "calendar_block_created",
    "calendar_block_save_succeeded",
    "calendar_block_updated",
    "quick_capture_saved",
    "capture_save_succeeded",
    "evidence_created",
    "portfolio_viewed",
    "report_previewed",
    "daily_plan_pdf_downloaded",
    "weekly_plan_pdf_downloaded",
  ].includes(event);
}

function isQuickCapture(event: FounderTrackedEventName) {
  return [
    "quick_capture_opened",
    "quick_capture_saved",
    "capture_opened",
    "capture_save_succeeded",
    "evidence_created",
    "capture_first_attachment_selected",
    "quick_capture_photo_selected",
  ].includes(event);
}

function isPortfolio(event: FounderTrackedEventName) {
  return event === "portfolio_viewed";
}

function isReports(event: FounderTrackedEventName) {
  return ["report_previewed", "daily_plan_pdf_downloaded", "weekly_plan_pdf_downloaded"].includes(event);
}

function plural(value: number, singular: string, pluralForm = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

function comparisonStatus(current: number, previous: number): FounderTrendStatus {
  if (current === 0 && previous === 0) return "Quiet";
  if (previous === 0 && current > 0) return "New";
  if (current > previous) return "Growing";
  if (current < previous) return "Softer";
  return "Steady";
}

function comparisonDetail(
  current: number,
  previous: number,
  unit: "families" | "actions",
  subject?: string,
) {
  const noun = unit === "families" ? "family" : "action";
  const pluralNoun = unit === "families" ? "families" : "actions";
  const suffix = subject ? ` ${subject}` : "";

  if (current === 0 && previous === 0) {
    return `No ${pluralNoun}${suffix} in either 7-day period.`;
  }
  if (previous === 0 && current > 0) {
    return `${plural(current, noun, pluralNoun)}${suffix} this week; none did in the previous 7 days.`;
  }
  const difference = current - previous;
  if (difference > 0) {
    return `${plural(difference, `more ${noun}`, `more ${pluralNoun}`)}${suffix} than in the previous 7 days.`;
  }
  if (difference < 0) {
    return `${plural(Math.abs(difference), `fewer ${noun}`, `fewer ${pluralNoun}`)}${suffix} than in the previous 7 days.`;
  }
  return `No change from the previous 7 days.`;
}

function familyCount(
  events: FounderProductEvent[],
  customerIds: Set<string>,
  now: Date,
  window: Exclude<Window, null>,
  predicate: (event: FounderTrackedEventName) => boolean = () => true,
) {
  return new Set(
    events
      .filter(
        (event) =>
          customerIds.has(event.userId) &&
          windowForTimestamp(event.occurredAt, now) === window &&
          predicate(event.event),
      )
      .map((event) => event.userId),
  ).size;
}

function actionCount(
  events: FounderProductEvent[],
  customerIds: Set<string>,
  now: Date,
  window: Exclude<Window, null>,
) {
  return events.filter(
    (event) =>
      customerIds.has(event.userId) &&
      windowForTimestamp(event.occurredAt, now) === window &&
      isMeaningfulLearningAction(event.event),
  ).length;
}

function joinedCount(customers: FounderCustomerBase[], now: Date, window: Exclude<Window, null>) {
  return customers.filter((customer) => windowForTimestamp(customer.joinedAt, now) === window).length;
}

function returningCount(
  customers: FounderCustomerBase[],
  events: FounderProductEvent[],
  customerIds: Set<string>,
  now: Date,
  window: Exclude<Window, null>,
) {
  const boundary = window === "current"
    ? now.getTime() - CURRENT_WINDOW_MS
    : now.getTime() - PREVIOUS_WINDOW_MS;
  const active = new Set(
    events
      .filter(
        (event) =>
          customerIds.has(event.userId) && windowForTimestamp(event.occurredAt, now) === window,
      )
      .map((event) => event.userId),
  );
  return customers.filter(
    (customer) => active.has(customer.userId) && Date.parse(customer.joinedAt) < boundary,
  ).length;
}

function item(
  label: string,
  current: number,
  previous: number,
  unit: "families" | "actions",
  subject?: string,
): FounderTrendItem {
  return {
    label,
    current,
    previous,
    unit,
    status: comparisonStatus(current, previous),
    detail: comparisonDetail(current, previous, unit, subject),
  };
}

function waitingItem(label: string, unit: "families" | "actions"): FounderTrendItem {
  return {
    label,
    current: null,
    previous: null,
    unit,
    status: "Waiting",
    detail: "This comparison will appear automatically when the private product-activity feed is connected.",
  };
}

function buildSummary(items: FounderTrendItem[], analyticsAvailable: boolean) {
  const active = items.find((entry) => entry.label === "Active families");
  const capture = items.find((entry) => entry.label === "Quick Capture");
  const reports = items.find((entry) => entry.label === "Reports");
  const newFamilies = items.find((entry) => entry.label === "New families");
  const sentences: string[] = [];

  if (analyticsAvailable && active && active.current !== null && active.previous !== null) {
    if (active.current > active.previous) sentences.push("More families are using MyLearna than in the previous 7 days.");
    else if (active.current < active.previous) sentences.push("Fewer families have used MyLearna than in the previous 7 days.");
    else sentences.push("The number of families using MyLearna is steady week to week.");
  } else {
    sentences.push("New-family trends are live now; product-use trends will join them when the private activity feed is connected.");
  }

  if (analyticsAvailable && capture && capture.current !== null && capture.previous !== null) {
    if (capture.current > capture.previous) sentences.push("Quick Capture is reaching more families.");
    else if (capture.current < capture.previous) sentences.push("Quick Capture use has softened this week.");
  }

  if (analyticsAvailable && reports && reports.current === 0 && reports.previous === 0) {
    sentences.push("Reports remain quiet, so that is still a later-stage behaviour to watch.");
  }

  if (
    newFamilies &&
    newFamilies.current !== null &&
    newFamilies.previous !== null &&
    newFamilies.current > newFamilies.previous
  ) {
    sentences.push("New-family growth is also ahead of the previous 7 days.");
  }

  return sentences.slice(0, 3).join(" ");
}

export function buildFounderTrendIntelligence(
  customers: FounderCustomerBase[],
  events: FounderProductEvent[],
  analyticsAvailable: boolean,
  now = new Date(),
): FounderTrendIntelligence {
  const customerIds = new Set(customers.map((customer) => customer.userId));
  const newFamilies = item(
    "New families",
    joinedCount(customers, now, "current"),
    joinedCount(customers, now, "previous"),
    "families",
    "joined",
  );

  const items: FounderTrendItem[] = [newFamilies];

  if (analyticsAvailable) {
    items.push(
      item(
        "Active families",
        familyCount(events, customerIds, now, "current"),
        familyCount(events, customerIds, now, "previous"),
        "families",
        "used MyLearna",
      ),
      item(
        "Returning families",
        returningCount(customers, events, customerIds, now, "current"),
        returningCount(customers, events, customerIds, now, "previous"),
        "families",
        "returned",
      ),
      item(
        "Learning actions",
        actionCount(events, customerIds, now, "current"),
        actionCount(events, customerIds, now, "previous"),
        "actions",
        "were recorded",
      ),
      item(
        "Quick Capture",
        familyCount(events, customerIds, now, "current", isQuickCapture),
        familyCount(events, customerIds, now, "previous", isQuickCapture),
        "families",
        "used Quick Capture",
      ),
      item(
        "Portfolio",
        familyCount(events, customerIds, now, "current", isPortfolio),
        familyCount(events, customerIds, now, "previous", isPortfolio),
        "families",
        "viewed Portfolio",
      ),
      item(
        "Reports",
        familyCount(events, customerIds, now, "current", isReports),
        familyCount(events, customerIds, now, "previous", isReports),
        "families",
        "reached Reports",
      ),
    );
  } else {
    items.push(
      waitingItem("Active families", "families"),
      waitingItem("Returning families", "families"),
      waitingItem("Learning actions", "actions"),
      waitingItem("Quick Capture", "families"),
      waitingItem("Portfolio", "families"),
      waitingItem("Reports", "families"),
    );
  }

  return {
    periodLabel: "Last 7 days compared with the previous 7 days",
    summary: buildSummary(items, analyticsAvailable),
    items,
  };
}

export const founderTrendInternals = {
  windowForTimestamp,
  comparisonStatus,
  comparisonDetail,
  isMeaningfulLearningAction,
};
