import { loadFounderCustomers, type FounderCustomerBase } from "@/lib/clean/founder/founderCustomers";
import {
  loadFounderPostHogSnapshot,
  type FounderProductEvent,
  type FounderTrackedEventName,
} from "@/lib/clean/founder/founderPosthog";
import { loadFounderAccountSnapshot } from "@/lib/clean/founder/founderServer";
import {
  buildFounderTrendIntelligence,
  type FounderTrendIntelligence,
} from "@/lib/clean/founder/founderTrends";
import { deriveFounderAuthFunnel, type FounderAuthFunnel } from "@/lib/clean/founder/founderAuthFunnel";

const TIME_ZONE = "Australia/Hobart";
const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_ACTIVITY_COLLAPSE_MS = 5 * 60 * 1000;

export type FounderCustomerStatus =
  | "New"
  | "Setting up"
  | "Exploring"
  | "Active"
  | "Going quiet"
  | "Dormant";

export type FounderCustomerTimelineItem = {
  occurredAt: string;
  label: string;
};

export type FounderCustomer = FounderCustomerBase & {
  displayName: string;
  lastActiveAt: string | null;
  activeDays30: number;
  myDayViews: number;
  calendarActions: number;
  captureOpens: number;
  capturesSaved: number;
  portfolioViews: number;
  reportViews: number;
  coachUses: number;
  pathwayViews: number;
  topArea: string | null;
  status: FounderCustomerStatus;
  recentActivity: FounderCustomerTimelineItem[];
  activity30?: FounderCustomerTimelineItem[];
};

export type FounderAttentionItem = {
  tone: "attention" | "positive" | "neutral";
  title: string;
  detail: string;
};

export type FounderJourneyStage = {
  label: string;
  count: number;
  percent: number;
};

export type FounderFeatureUsage = {
  label: string;
  users: number;
  actions: number;
};

export type FounderDashboardData = {
  generatedAt: string;
  productActivityAvailable: boolean;
  today: {
    newFamilies: number;
    activeFamilies: number;
    returningFamilies: number;
    meaningfulActions: number;
  };
  whatChanged: string;
  trends: FounderTrendIntelligence;
  attention: FounderAttentionItem[];
  customers: FounderCustomer[];
  journey: FounderJourneyStage[];
  biggestDrop: string | null;
  featureUsage: FounderFeatureUsage[];
  returnHealth: {
    activeLast7Days: number;
    activeLast30Days: number;
    goingQuiet: number;
  };
  acquisitionToday: Record<string, number> | null;
  authFunnel?: FounderAuthFunnel;
  authFunnel30?: FounderAuthFunnel;
};

type Usage = {
  activeDates: Set<string>;
  myDayViews: number;
  calendarActions: number;
  captureOpens: number;
  capturesSaved: number;
  portfolioViews: number;
  reportViews: number;
  coachUses: number;
  pathwayViews: number;
  featureCounts: Map<string, number>;
  recentActivity: FounderCustomerTimelineItem[];
  activity30: FounderCustomerTimelineItem[];
  lastActiveAt: string | null;
};

function dateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function daysAgo(now: Date, value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - parsed) / DAY_MS);
}

function eventLabel(event: FounderTrackedEventName) {
  switch (event) {
    case "product_signed_in":
      return "Signed in";
    case "daily_plan_viewed":
      return "Opened My Day";
    case "calendar_block_created":
      return "Planned learning in Calendar";
    case "calendar_block_save_succeeded":
      return "Saved a Calendar plan";
    case "calendar_block_updated":
      return "Updated a Calendar plan";
    case "quick_capture_opened":
    case "capture_opened":
      return "Opened Quick Capture";
    case "quick_capture_saved":
    case "capture_save_succeeded":
    case "evidence_created":
      return "Saved a learning capture";
    case "capture_first_attachment_selected":
    case "quick_capture_photo_selected":
      return "Added evidence to a capture";
    case "portfolio_viewed":
      return "Viewed Portfolio";
    case "report_previewed":
      return "Previewed a report";
    case "daily_plan_pdf_downloaded":
    case "weekly_plan_pdf_downloaded":
      return "Downloaded a learning plan";
    case "pathway_viewed":
      return "Viewed Pathways";
    case "coach_opened":
    case "coach_primary_action_selected":
    case "coach_recommendation_completed":
      return "Used MyLearna Coach";
    case "native_share_opened":
    case "share_card_created":
    case "share_card_opened":
      return "Used sharing";
    default:
      return "Used MyLearna";
  }
}

function featureForEvent(event: FounderTrackedEventName) {
  if (event === "daily_plan_viewed") return "My Day";
  if (
    event === "calendar_block_created" ||
    event === "calendar_block_save_succeeded" ||
    event === "calendar_block_updated"
  ) return "Calendar";
  if (
    event === "quick_capture_opened" ||
    event === "quick_capture_saved" ||
    event === "capture_opened" ||
    event === "capture_save_succeeded" ||
    event === "evidence_created" ||
    event === "capture_first_attachment_selected" ||
    event === "quick_capture_photo_selected"
  ) return "Quick Capture";
  if (event === "portfolio_viewed") return "Portfolio";
  if (
    event === "report_previewed" ||
    event === "daily_plan_pdf_downloaded" ||
    event === "weekly_plan_pdf_downloaded"
  ) return "Reports";
  if (event === "pathway_viewed") return "Pathways";
  if (
    event === "coach_opened" ||
    event === "coach_primary_action_selected" ||
    event === "coach_recommendation_completed"
  ) return "Coach";
  if (
    event === "native_share_opened" ||
    event === "share_card_created" ||
    event === "share_card_opened"
  ) return "Sharing";
  return null;
}

function emptyUsage(): Usage {
  return {
    activeDates: new Set<string>(),
    myDayViews: 0,
    calendarActions: 0,
    captureOpens: 0,
    capturesSaved: 0,
    portfolioViews: 0,
    reportViews: 0,
    coachUses: 0,
    pathwayViews: 0,
    featureCounts: new Map<string, number>(),
    recentActivity: [],
    activity30: [],
    lastActiveAt: null,
  };
}

export function collapseRecentActivity(
  items: FounderCustomerTimelineItem[],
  windowMs = RECENT_ACTIVITY_COLLAPSE_MS,
) {
  const collapsed: FounderCustomerTimelineItem[] = [];
  for (const item of items) {
    const previous = collapsed[collapsed.length - 1];
    if (
      previous &&
      previous.label === item.label &&
      Math.abs(Date.parse(previous.occurredAt) - Date.parse(item.occurredAt)) <= windowMs
    ) {
      continue;
    }
    collapsed.push(item);
  }
  return collapsed;
}

function summarizeUsage(events: FounderProductEvent[]) {
  const usageByUserId = new Map<string, Usage>();
  for (const event of events) {
    const usage = usageByUserId.get(event.userId) ?? emptyUsage();
    usage.activeDates.add(dateKey(event.occurredAt));
    if (!usage.lastActiveAt || Date.parse(event.occurredAt) > Date.parse(usage.lastActiveAt)) {
      usage.lastActiveAt = event.occurredAt;
    }

    if (event.event === "daily_plan_viewed") usage.myDayViews += 1;
    if (
      event.event === "calendar_block_created" ||
      event.event === "calendar_block_save_succeeded" ||
      event.event === "calendar_block_updated"
    ) usage.calendarActions += 1;
    if (event.event === "quick_capture_opened" || event.event === "capture_opened") usage.captureOpens += 1;
    if (
      event.event === "quick_capture_saved" ||
      event.event === "capture_save_succeeded" ||
      event.event === "evidence_created"
    ) usage.capturesSaved += 1;
    if (event.event === "portfolio_viewed") usage.portfolioViews += 1;
    if (
      event.event === "report_previewed" ||
      event.event === "daily_plan_pdf_downloaded" ||
      event.event === "weekly_plan_pdf_downloaded"
    ) usage.reportViews += 1;
    if (
      event.event === "coach_opened" ||
      event.event === "coach_primary_action_selected" ||
      event.event === "coach_recommendation_completed"
    ) usage.coachUses += 1;
    if (event.event === "pathway_viewed") usage.pathwayViews += 1;

    const feature = featureForEvent(event.event);
    if (feature) usage.featureCounts.set(feature, (usage.featureCounts.get(feature) ?? 0) + 1);
    if (event.event !== "app_page_viewed") {
      const activity = { occurredAt: event.occurredAt, label: eventLabel(event.event) };
      usage.activity30.push(activity);
      usage.recentActivity.push(activity);
    }
    usageByUserId.set(event.userId, usage);
  }
  for (const usage of usageByUserId.values()) {
    usage.recentActivity = collapseRecentActivity(usage.recentActivity).slice(0, 8);
  }
  return usageByUserId;
}

function displayName(customer: FounderCustomerBase) {
  if (customer.familyDisplayName) return customer.familyDisplayName;
  if (customer.email) return customer.email;
  return "Family account";
}

function customerStatus(customer: FounderCustomerBase, usage: Usage, now: Date): FounderCustomerStatus {
  const joinedAge = daysAgo(now, customer.joinedAt);
  const lastActiveAt = usage.lastActiveAt ?? customer.lastSignInAt;
  const inactiveDays = daysAgo(now, lastActiveAt);

  if (joinedAge <= 2) return "New";
  if (!customer.profileCompleted || customer.learnerCount === 0) return "Setting up";
  if (inactiveDays > 30) return "Dormant";
  if (inactiveDays > 7) return "Going quiet";
  if (usage.calendarActions === 0 && usage.capturesSaved === 0 && usage.portfolioViews === 0) return "Exploring";
  return "Active";
}

function topArea(usage: Usage) {
  let winner: string | null = null;
  let winnerCount = 0;
  for (const [feature, count] of usage.featureCounts) {
    if (count > winnerCount) {
      winner = feature;
      winnerCount = count;
    }
  }
  return winner;
}

function buildJourney(customers: FounderCustomer[]) {
  const total = customers.length;
  const stages = [
    { label: "Joined", count: total },
    { label: "Set up family", count: customers.filter((c) => c.profileCompleted && c.learnerCount > 0).length },
    { label: "Planned learning", count: customers.filter((c) => c.myDayViews > 0 || c.calendarActions > 0).length },
    { label: "Saved first capture", count: customers.filter((c) => c.capturesSaved > 0).length },
    { label: "Viewed Portfolio", count: customers.filter((c) => c.portfolioViews > 0).length },
    { label: "Reached Reports", count: customers.filter((c) => c.reportViews > 0).length },
  ];
  return stages.map((stage) => ({
    ...stage,
    percent: total > 0 ? stage.count / total : 0,
  }));
}

function biggestJourneyDrop(stages: FounderJourneyStage[]) {
  let label: string | null = null;
  let drop = 0;
  for (let index = 1; index < stages.length; index += 1) {
    const currentDrop = stages[index - 1].count - stages[index].count;
    if (currentDrop > drop) {
      drop = currentDrop;
      label = `${stages[index - 1].label} → ${stages[index].label}`;
    }
  }
  return label;
}

function buildFeatureUsage(events: FounderProductEvent[], customerIds: Set<string>) {
  const features = new Map<string, { users: Set<string>; actions: number }>();
  for (const event of events) {
    if (!customerIds.has(event.userId)) continue;
    const feature = featureForEvent(event.event);
    if (!feature) continue;
    const current = features.get(feature) ?? { users: new Set<string>(), actions: 0 };
    current.users.add(event.userId);
    current.actions += 1;
    features.set(feature, current);
  }
  return [...features.entries()]
    .map(([label, value]) => ({ label, users: value.users.size, actions: value.actions }))
    .sort((left, right) => right.users - left.users || right.actions - left.actions);
}

function buildAttention(customers: FounderCustomer[], featureUsage: FounderFeatureUsage[], analyticsAvailable: boolean, now: Date) {
  const items: FounderAttentionItem[] = [];
  if (!analyticsAvailable) {
    items.push({
      tone: "neutral",
      title: "Customer records are live",
      detail: "Product activity will appear here as soon as the private activity connection is enabled.",
    });
  }

  const recentSetup = customers.filter(
    (customer) => daysAgo(now, customer.joinedAt) <= 7 && (!customer.profileCompleted || customer.learnerCount === 0),
  );
  if (recentSetup.length > 0) {
    items.push({
      tone: "attention",
      title: `${recentSetup.length} new ${recentSetup.length === 1 ? "family is" : "families are"} still setting up`,
      detail: "These accounts joined recently but have not yet completed the family and learner setup.",
    });
  }

  const plannedNoCapture = customers.filter(
    (customer) => (customer.myDayViews > 0 || customer.calendarActions > 0) && customer.capturesSaved === 0,
  );
  if (plannedNoCapture.length > 0) {
    items.push({
      tone: "attention",
      title: `${plannedNoCapture.length} ${plannedNoCapture.length === 1 ? "family has" : "families have"} planned but not captured`,
      detail: "This is the clearest current point to watch between planning learning and saving evidence.",
    });
  }

  const capturedNoPortfolio = customers.filter(
    (customer) => customer.capturesSaved > 0 && customer.portfolioViews === 0,
  );
  if (capturedNoPortfolio.length > 0) {
    items.push({
      tone: "neutral",
      title: `${capturedNoPortfolio.length} ${capturedNoPortfolio.length === 1 ? "family is" : "families are"} capturing but has not reached Portfolio`,
      detail: "That suggests an opportunity to make the value of Portfolio clearer after a capture is saved.",
    });
  }

  const goingQuiet = customers.filter((customer) => customer.status === "Going quiet");
  if (goingQuiet.length > 0) {
    items.push({
      tone: "attention",
      title: `${goingQuiet.length} ${goingQuiet.length === 1 ? "family is" : "families are"} going quiet`,
      detail: "They used MyLearna previously but have not been active for more than a week.",
    });
  }

  const strongest = featureUsage[0];
  if (strongest && strongest.users > 0) {
    items.push({
      tone: "positive",
      title: `${strongest.label} is the strongest-used area`,
      detail: `${strongest.users} ${strongest.users === 1 ? "family has" : "families have"} used it in the last 30 days.`,
    });
  }

  const captureUsers = customers.filter((customer) => customer.capturesSaved > 0).length;
  const reportUsers = customers.filter((customer) => customer.reportViews > 0).length;
  if (captureUsers > 0 && reportUsers === 0) {
    items.push({
      tone: "neutral",
      title: "Reports have not been reached yet",
      detail: "Families are creating learning records, but none of those active families has reached Reports in the current 30-day view.",
    });
  }

  return items.slice(0, 5);
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export async function loadFounderDashboard(now = new Date()): Promise<FounderDashboardData> {
  const [customerSnapshot, postHog, accounts] = await Promise.all([
    loadFounderCustomers(now),
    loadFounderPostHogSnapshot(),
    loadFounderAccountSnapshot(now),
  ]);

  const customerIds = new Set(customerSnapshot.customers.map((customer) => customer.userId));
  const customerEvents = postHog.events.filter((event) => customerIds.has(event.userId));
  const usageByUserId = summarizeUsage(customerEvents);

  const customers: FounderCustomer[] = customerSnapshot.customers.map((customer) => {
    const usage = usageByUserId.get(customer.userId) ?? emptyUsage();
    const lastActiveAt = usage.lastActiveAt ?? customer.lastSignInAt;
    return {
      ...customer,
      displayName: displayName(customer),
      lastActiveAt,
      activeDays30: [...usage.activeDates].filter(Boolean).length,
      myDayViews: usage.myDayViews,
      calendarActions: usage.calendarActions,
      captureOpens: usage.captureOpens,
      capturesSaved: usage.capturesSaved,
      portfolioViews: usage.portfolioViews,
      reportViews: usage.reportViews,
      coachUses: usage.coachUses,
      pathwayViews: usage.pathwayViews,
      topArea: topArea(usage),
      status: customerStatus(customer, usage, now),
      recentActivity: usage.recentActivity,
      activity30: usage.activity30,
    };
  });

  const todayKey = dateKey(now);
  const yesterdayKey = dateKey(new Date(now.getTime() - DAY_MS));
  const activeTodayIds = new Set(
    customerEvents.filter((event) => dateKey(event.occurredAt) === todayKey).map((event) => event.userId),
  );
  const activeYesterdayIds = new Set(
    customerEvents.filter((event) => dateKey(event.occurredAt) === yesterdayKey).map((event) => event.userId),
  );
  const newToday = customers.filter((customer) => dateKey(customer.joinedAt) === todayKey).length;
  const returningToday = customers.filter(
    (customer) => activeTodayIds.has(customer.userId) && dateKey(customer.joinedAt) !== todayKey,
  ).length;
  const meaningfulToday = customerEvents.filter((event) => {
    if (dateKey(event.occurredAt) !== todayKey) return false;
    return [
      "calendar_block_created",
      "calendar_block_save_succeeded",
      "calendar_block_updated",
      "quick_capture_saved",
      "capture_save_succeeded",
      "evidence_created",
      "portfolio_viewed",
      "report_previewed",
    ].includes(event.event);
  }).length;

  const movement = activeTodayIds.size - activeYesterdayIds.size;
  const movementText = movement === 0
    ? "the same number of families as yesterday"
    : movement > 0
      ? `${plural(movement, "more family", "more families")} than yesterday`
      : `${plural(Math.abs(movement), "fewer family", "fewer families")} than yesterday`;
  const actionVerb = meaningfulToday === 1 ? "was" : "were";
  const whatChanged = `${plural(newToday, "new family", "new families")} joined today. ${plural(activeTodayIds.size, "family", "families")} used MyLearna, ${movementText}, and ${plural(meaningfulToday, "meaningful learning action")} ${actionVerb} recorded.`;

  const journey = buildJourney(customers);
  const featureUsage = buildFeatureUsage(customerEvents, customerIds);
  const attention = buildAttention(customers, featureUsage, postHog.available, now);
  const trends = buildFounderTrendIntelligence(
    customerSnapshot.customers,
    customerEvents,
    postHog.available,
    now,
  );
  const authFunnel = deriveFounderAuthFunnel({
    accounts: customerSnapshot.customers.map((customer) => ({
      userId: customer.userId,
      displayName: displayName(customer),
      joinedAt: customer.joinedAt,
      confirmedAt: customer.confirmedAt ?? null,
      lastSignInAt: customer.lastSignInAt,
      profileCompleted: customer.profileCompleted,
      learnerCount: customer.learnerCount,
      firstValueAt: null,
    })),
    events: postHog.events,
    posthogAvailable: postHog.available,
    supabaseAvailable: customerSnapshot.customers.length > 0 || accounts !== null,
    rangeDays: 7,
    now,
  });
  const authFunnel30 = deriveFounderAuthFunnel({
    accounts: customerSnapshot.customers.map((customer) => ({ userId: customer.userId, displayName: displayName(customer), joinedAt: customer.joinedAt, confirmedAt: customer.confirmedAt ?? null, lastSignInAt: customer.lastSignInAt, profileCompleted: customer.profileCompleted, learnerCount: customer.learnerCount, firstValueAt: null })),
    events: postHog.events,
    posthogAvailable: postHog.available,
    supabaseAvailable: customerSnapshot.customers.length > 0 || accounts !== null,
    rangeDays: 30,
    now,
  });

  return {
    generatedAt: now.toISOString(),
    productActivityAvailable: postHog.available,
    today: {
      newFamilies: newToday,
      activeFamilies: activeTodayIds.size,
      returningFamilies: returningToday,
      meaningfulActions: meaningfulToday,
    },
    whatChanged,
    trends,
    attention,
    customers,
    journey,
    biggestDrop: biggestJourneyDrop(journey),
    featureUsage,
    returnHealth: {
      activeLast7Days: customers.filter((customer) => daysAgo(now, customer.lastActiveAt) <= 7).length,
      activeLast30Days: customers.filter((customer) => daysAgo(now, customer.lastActiveAt) <= 30).length,
      goingQuiet: customers.filter((customer) => customer.status === "Going quiet").length,
    },
    acquisitionToday: accounts?.acquisitionToday ?? null,
    authFunnel,
    authFunnel30,
  };
}

export const founderDashboardInternals = {
  eventLabel,
  featureForEvent,
  buildJourney,
  biggestJourneyDrop,
  buildAttention,
  collapseRecentActivity,
};
