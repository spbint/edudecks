import type { FounderCustomerBase } from "@/lib/clean/founder/founderCustomers";
import type {
  FounderProductEvent,
  FounderTrackedEventName,
} from "@/lib/clean/founder/founderPosthog";

const SESSION_GAP_MS = 30 * 60 * 1000;
const ACTIVE_NOW_MS = 5 * 60 * 1000;
const RECENT_WINDOW_MS = 30 * 60 * 1000;
const RECENT_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 24;
const MAX_TIMELINE_EVENTS = 150;

export type FounderLiveEventKind = "page" | "sign-in" | "action";
export type FounderLiveBottleneckKind =
  | "capture-abandoned"
  | "navigation-loop"
  | "planning-without-capture"
  | "capture-without-portfolio";

export type FounderLiveTimelineItem = {
  event: FounderTrackedEventName;
  occurredAt: string;
  label: string;
  kind: FounderLiveEventKind;
  route: string | null;
  estimatedPageSeconds: number | null;
};

export type FounderLiveBottleneck = {
  kind: FounderLiveBottleneckKind;
  title: string;
  detail: string;
};

export type FounderLiveSession = {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  startedAt: string;
  lastSeenAt: string;
  durationSeconds: number;
  activeNow: boolean;
  currentLocation: string;
  eventCount: number;
  timelineTruncated: boolean;
  events: FounderLiveTimelineItem[];
  bottlenecks: FounderLiveBottleneck[];
};

export type FounderLiveFamily = {
  userId: string;
  displayName: string;
  email: string | null;
  currentLocation: string;
  lastSeenAt: string;
};

export type FounderLiveSignal = {
  kind: FounderLiveBottleneckKind;
  title: string;
  detail: string;
  occurrences: number;
  families: string[];
};

export type FounderLiveBehaviourData = {
  generatedAt: string;
  available: boolean;
  activeNow: FounderLiveFamily[];
  last30Minutes: {
    sessions: number;
    pageMovements: number;
    meaningfulActions: number;
  };
  signals: FounderLiveSignal[];
  recentSessions: FounderLiveSession[];
};

type SessionDraft = {
  customer: FounderCustomerBase;
  events: FounderProductEvent[];
};

const CAPTURE_STARTED = new Set<FounderTrackedEventName>([
  "quick_capture_opened",
  "capture_opened",
  "capture_first_attachment_selected",
  "quick_capture_photo_selected",
]);

const CAPTURE_SAVED = new Set<FounderTrackedEventName>([
  "quick_capture_saved",
  "capture_save_succeeded",
  "evidence_created",
]);

const MEANINGFUL_ACTIONS = new Set<FounderTrackedEventName>([
  "calendar_block_created",
  "calendar_block_save_succeeded",
  "calendar_block_updated",
  "quick_capture_saved",
  "capture_save_succeeded",
  "evidence_created",
  "portfolio_viewed",
  "report_previewed",
]);

function displayName(customer: FounderCustomerBase) {
  return customer.familyDisplayName || customer.email || "Family account";
}

function routePath(route: string | null) {
  if (!route) return null;
  try {
    const path = new URL(route, "https://mylearna.local").pathname || "/";
    const safePrefixes = [
      "/my-day", "/my-calendar", "/calendar", "/my-capture", "/capture",
      "/my-portfolio", "/portfolio", "/my-reports", "/reports", "/my-pathways",
      "/pathways", "/my-coach", "/coach", "/my-settings", "/settings",
      "/my-profile", "/profile", "/marketplace",
    ];
    return safePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) ? path : null;
  } catch {
    return null;
  }
}

function friendlyPage(event: FounderProductEvent) {
  const area = event.area?.trim() || "";
  const path = routePath(event.route) || "";
  const haystack = `${area} ${path}`.toLowerCase().replaceAll("_", " ").replaceAll("-", " ");

  if (haystack.includes("my day") || haystack.includes("daily plan")) return "My Day";
  if (haystack.includes("calendar")) return "Calendar";
  if (haystack.includes("capture")) return "Quick Capture";
  if (haystack.includes("portfolio")) return "Portfolio";
  if (haystack.includes("report")) return "Reports";
  if (haystack.includes("pathway")) return "Pathways";
  if (haystack.includes("coach")) return "Coach";
  if (haystack.includes("profile")) return "Profile";
  if (haystack.includes("setting")) return "Settings";
  if (haystack.includes("marketplace")) return "Marketplace";

  if (area) {
    const knownAreas = ["My Day", "Calendar", "Quick Capture", "Portfolio", "Reports", "Pathways", "Coach", "Profile", "Settings", "Marketplace"];
    const knownArea = knownAreas.find((known) => known.toLowerCase() === area.toLowerCase());
    if (knownArea) return knownArea;
  }
  if (!path || path === "/") return "MyLearna home";
  return "MyLearna";
}

function actionLabel(event: FounderTrackedEventName) {
  switch (event) {
    case "product_signed_in": return "Signed in";
    case "daily_plan_viewed": return "Viewed My Day";
    case "calendar_block_created": return "Created a Calendar plan";
    case "calendar_block_save_succeeded": return "Saved a Calendar plan";
    case "calendar_block_updated": return "Updated a Calendar plan";
    case "quick_capture_opened":
    case "capture_opened": return "Opened Quick Capture";
    case "capture_first_attachment_selected":
    case "quick_capture_photo_selected": return "Selected evidence for a capture";
    case "quick_capture_saved":
    case "capture_save_succeeded":
    case "evidence_created": return "Saved a learning capture";
    case "portfolio_viewed": return "Viewed Portfolio";
    case "report_previewed": return "Previewed a report";
    case "daily_plan_pdf_downloaded": return "Downloaded a daily plan";
    case "weekly_plan_pdf_downloaded": return "Downloaded a weekly plan";
    case "pathway_viewed": return "Viewed Pathways";
    case "coach_opened": return "Opened MyLearna Coach";
    case "coach_primary_action_selected": return "Selected a Coach action";
    case "coach_recommendation_completed": return "Completed a Coach recommendation";
    case "native_share_opened": return "Opened sharing";
    case "share_card_created": return "Created a share card";
    case "share_card_opened": return "Opened a share card";
    case "app_page_viewed": return "Viewed a page";
    default: return "Used MyLearna";
  }
}

function kindFor(event: FounderTrackedEventName): FounderLiveEventKind {
  if (event === "app_page_viewed") return "page";
  if (event === "product_signed_in") return "sign-in";
  return "action";
}

function buildDrafts(customers: FounderCustomerBase[], events: FounderProductEvent[]) {
  const customerById = new Map(customers.map((customer) => [customer.userId, customer]));
  const eventsByUser = new Map<string, FounderProductEvent[]>();

  for (const event of events) {
    if (!customerById.has(event.userId)) continue;
    const list = eventsByUser.get(event.userId) ?? [];
    list.push(event);
    eventsByUser.set(event.userId, list);
  }

  const drafts: SessionDraft[] = [];
  for (const [userId, userEvents] of eventsByUser) {
    const customer = customerById.get(userId);
    if (!customer) continue;
    const ordered = [...userEvents].sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt));
    let current: FounderProductEvent[] = [];

    for (const event of ordered) {
      const previous = current[current.length - 1];
      if (previous && Date.parse(event.occurredAt) - Date.parse(previous.occurredAt) > SESSION_GAP_MS) {
        drafts.push({ customer, events: current });
        current = [];
      }
      current.push(event);
    }
    if (current.length) drafts.push({ customer, events: current });
  }
  return drafts;
}

function pageTimelineLabel(event: FounderProductEvent) {
  return `Viewed ${friendlyPage(event)}`;
}

function findCurrentLocation(events: FounderProductEvent[]) {
  const latest = events[events.length - 1];
  if (latest && latest.event !== "product_signed_in") return friendlyPage(latest);
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.event === "app_page_viewed") return friendlyPage(event);
  }
  return latest ? actionLabel(latest.event) : "MyLearna";
}

function detectBottlenecks(events: FounderProductEvent[], activeNow: boolean): FounderLiveBottleneck[] {
  if (activeNow) return [];
  const bottlenecks: FounderLiveBottleneck[] = [];

  let lastCaptureStart = -1;
  for (let index = 0; index < events.length; index += 1) {
    if (CAPTURE_STARTED.has(events[index].event)) lastCaptureStart = index;
  }
  if (lastCaptureStart >= 0) {
    const savedAfter = events.slice(lastCaptureStart + 1).some((event) => CAPTURE_SAVED.has(event.event));
    if (!savedAfter) {
      bottlenecks.push({
        kind: "capture-abandoned",
        title: "Quick Capture opened without a save",
        detail: "A capture was started, but no save event followed before this tracked session ended.",
      });
    }
  }

  const planningCount = events.filter((event) =>
    event.event === "daily_plan_viewed" ||
    event.event === "calendar_block_created" ||
    event.event === "calendar_block_save_succeeded" ||
    event.event === "calendar_block_updated",
  ).length;
  const hasCapture = events.some((event) => CAPTURE_SAVED.has(event.event));
  if (planningCount >= 2 && !hasCapture) {
    bottlenecks.push({
      kind: "planning-without-capture",
      title: "Planning without a saved capture",
      detail: "Repeated My Day or Calendar activity was recorded without reaching a saved learning capture. This is worth checking as a possible journey bottleneck.",
    });
  }

  const captureSavedIndex = events.findIndex((event) => CAPTURE_SAVED.has(event.event));
  const portfolioAfterCapture = captureSavedIndex >= 0 && events.slice(captureSavedIndex + 1).some((event) => event.event === "portfolio_viewed");
  if (captureSavedIndex >= 0 && !portfolioAfterCapture) {
    bottlenecks.push({
      kind: "capture-without-portfolio",
      title: "Capture saved without Portfolio discovery",
      detail: "A learning capture was saved, but Portfolio was not reached later in this tracked session. This is a possible value-discovery bottleneck worth checking.",
    });
  }

  const pageMoves = events
    .filter((event) => event.event === "app_page_viewed")
    .map((event) => friendlyPage(event));
  for (let index = 0; index <= pageMoves.length - 3; index += 1) {
    const first = pageMoves[index];
    const middle = pageMoves[index + 1];
    const third = pageMoves[index + 2];
    if (first === third && first !== middle) {
      bottlenecks.push({
        kind: "navigation-loop",
        title: "Repeated page loop",
        detail: `${first} → ${middle} → ${third} was observed in the same session. This can be worth reviewing for navigation friction.`,
      });
      break;
    }
  }

  return bottlenecks;
}

function buildSession(draft: SessionDraft, now: Date): FounderLiveSession {
  const nowMs = now.getTime();
  const first = draft.events[0];
  const last = draft.events[draft.events.length - 1];
  const firstMs = Date.parse(first.occurredAt);
  const lastMs = Date.parse(last.occurredAt);
  const activeNow = nowMs >= lastMs && nowMs - lastMs <= ACTIVE_NOW_MS;
  const sessionEndMs = activeNow ? nowMs : lastMs;

  const completeTimeline = draft.events.map((event, index): FounderLiveTimelineItem => {
    let estimatedPageSeconds: number | null = null;
    if (event.event === "app_page_viewed") {
      const next = draft.events[index + 1];
      if (next) {
        const seconds = Math.floor((Date.parse(next.occurredAt) - Date.parse(event.occurredAt)) / 1000);
        estimatedPageSeconds = seconds > 0 ? Math.min(30 * 60, seconds) : null;
      }
    }
    return {
      event: event.event,
      occurredAt: event.occurredAt,
      label: event.event === "app_page_viewed" ? pageTimelineLabel(event) : actionLabel(event.event),
      kind: kindFor(event.event),
      route: routePath(event.route),
      estimatedPageSeconds,
    };
  });

  return {
    id: `${draft.customer.userId}:${first.occurredAt}`,
    userId: draft.customer.userId,
    displayName: displayName(draft.customer),
    email: draft.customer.email,
    startedAt: first.occurredAt,
    lastSeenAt: last.occurredAt,
    durationSeconds: Math.max(0, Math.floor((sessionEndMs - firstMs) / 1000)),
    activeNow,
    currentLocation: findCurrentLocation(draft.events),
    eventCount: draft.events.length,
    timelineTruncated: completeTimeline.length > MAX_TIMELINE_EVENTS,
    events: completeTimeline.slice(0, MAX_TIMELINE_EVENTS),
    bottlenecks: detectBottlenecks(draft.events, activeNow),
  };
}

function aggregateSignals(sessions: FounderLiveSession[]): FounderLiveSignal[] {
  const groups = new Map<FounderLiveBottleneckKind, { occurrences: number; families: Map<string, string>; title: string; detail: string }>();
  for (const session of sessions) {
    for (const bottleneck of session.bottlenecks) {
      const current = groups.get(bottleneck.kind) ?? {
        occurrences: 0,
        families: new Map<string, string>(),
        title: bottleneck.title,
        detail: bottleneck.detail,
      };
      current.occurrences += 1;
      current.families.set(session.userId, session.displayName);
      groups.set(bottleneck.kind, current);
    }
  }
  return [...groups.entries()]
    .map(([kind, value]) => ({
      kind,
      title: value.title,
      detail: value.detail,
      occurrences: value.occurrences,
      families: [...value.families.values()].sort(),
    }))
    .filter((signal) => signal.families.length >= 2)
    .sort((left, right) => right.occurrences - left.occurrences || left.title.localeCompare(right.title));
}

export function buildFounderLiveBehaviour(
  customers: FounderCustomerBase[],
  events: FounderProductEvent[],
  now = new Date(),
  available = true,
): FounderLiveBehaviourData {
  const nowMs = now.getTime();
  const customerIds = new Set(customers.map((customer) => customer.userId));
  const customerEvents = events.filter((event) => customerIds.has(event.userId));
  const sessions = buildDrafts(customers, customerEvents)
    .map((draft) => buildSession(draft, now))
    .sort((left, right) => Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt));

  const recentCutoff = nowMs - RECENT_SESSION_MS;
  const recentSessions = sessions
    .filter((session) => Date.parse(session.lastSeenAt) >= recentCutoff)
    .slice(0, MAX_SESSIONS);

  const activeNow = sessions
    .filter((session) => session.activeNow)
    .map((session): FounderLiveFamily => ({
      userId: session.userId,
      displayName: session.displayName,
      email: session.email,
      currentLocation: session.currentLocation,
      lastSeenAt: session.lastSeenAt,
    }));

  const recentWindowCutoff = nowMs - RECENT_WINDOW_MS;
  const recentEvents = customerEvents.filter((event) => Date.parse(event.occurredAt) >= recentWindowCutoff && Date.parse(event.occurredAt) <= nowMs);
  const recentSessionCount = sessions.filter((session) => Date.parse(session.lastSeenAt) >= recentWindowCutoff).length;

  return {
    generatedAt: now.toISOString(),
    available,
    activeNow,
    last30Minutes: {
      sessions: recentSessionCount,
      pageMovements: recentEvents.filter((event) => event.event === "app_page_viewed").length,
      meaningfulActions: recentEvents.filter((event) => MEANINGFUL_ACTIONS.has(event.event)).length,
    },
    signals: aggregateSignals(recentSessions),
    recentSessions,
  };
}

export const founderLiveBehaviourInternals = {
  friendlyPage,
  actionLabel,
  detectBottlenecks,
};
