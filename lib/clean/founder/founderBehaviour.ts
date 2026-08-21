import type {
  FounderCustomer,
  FounderDashboardData,
} from "@/lib/clean/founder/founderDashboard";

const TIME_ZONE = "Australia/Hobart";
const DAY_MS = 24 * 60 * 60 * 1000;

export type FounderBehaviourFamily = Pick<
  FounderCustomer,
  "userId" | "displayName" | "email" | "joinedAt" | "lastActiveAt" | "status" | "activeDays30" | "topArea"
>;

export type FounderBehaviourAction = {
  userId: string;
  displayName: string;
  email: string | null;
  label: string;
  occurredAt: string;
};

export type FounderJourneyDrop = {
  from: string;
  to: string;
  count: number;
  families: FounderBehaviourFamily[];
};

export type FounderObservedPath = {
  from: string;
  to: string;
  count: number;
  families: FounderBehaviourFamily[];
};

export type FounderBehaviourIntelligence = {
  founderRead: string;
  todayDetails: {
    newFamilies: FounderBehaviourFamily[];
    activeFamilies: FounderBehaviourFamily[];
    returningFamilies: FounderBehaviourFamily[];
    learningActions: FounderBehaviourAction[];
  };
  engagement: {
    activeLast7Days: number;
    activeLast30Days: number;
    repeatFamilies: number;
    regularFamilies: number;
    repeatRate: number;
    averageActiveDays: number;
  };
  groups: {
    activeLast7Days: FounderBehaviourFamily[];
    activeLast30Days: FounderBehaviourFamily[];
    repeatFamilies: FounderBehaviourFamily[];
    regularFamilies: FounderBehaviourFamily[];
    goingQuiet: FounderBehaviourFamily[];
    dormant: FounderBehaviourFamily[];
  };
  journeyDrops: FounderJourneyDrop[];
  observedPaths: FounderObservedPath[];
};

function dateKey(value: string | Date | null) {
  if (!value) return "";
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

function ageInDays(now: Date, value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - parsed) / DAY_MS);
}

function compactFamily(customer: FounderCustomer): FounderBehaviourFamily {
  return {
    userId: customer.userId,
    displayName: customer.displayName,
    email: customer.email,
    joinedAt: customer.joinedAt,
    lastActiveAt: customer.lastActiveAt,
    status: customer.status,
    activeDays30: customer.activeDays30,
    topArea: customer.topArea,
  };
}

function fullActivity(customer: FounderCustomer) {
  return customer.activity30 ?? customer.recentActivity;
}

const MEANINGFUL_ACTIVITY_LABELS = new Set([
  "Planned learning in Calendar",
  "Saved a Calendar plan",
  "Updated a Calendar plan",
  "Saved a learning capture",
  "Viewed Portfolio",
  "Previewed a report",
]);

type FounderArea = "My Day" | "Calendar" | "Quick Capture" | "Portfolio" | "Reports" | "Pathways" | "Coach" | "Sharing";

function areaForActivityLabel(label: string): FounderArea | null {
  if (label === "Opened My Day") return "My Day";
  if (label.includes("Calendar")) return "Calendar";
  if (label.includes("Capture") || label.includes("capture") || label.includes("evidence")) return "Quick Capture";
  if (label.includes("Portfolio")) return "Portfolio";
  if (label.includes("report") || label.includes("learning plan")) return "Reports";
  if (label.includes("Pathways")) return "Pathways";
  if (label.includes("Coach")) return "Coach";
  if (label.includes("sharing")) return "Sharing";
  return null;
}

function journeyMembership(customer: FounderCustomer) {
  return [
    true,
    customer.profileCompleted && customer.learnerCount > 0,
    customer.myDayViews > 0 || customer.calendarActions > 0,
    customer.capturesSaved > 0,
    customer.portfolioViews > 0,
    customer.reportViews > 0,
  ];
}

const JOURNEY_LABELS = [
  "Joined",
  "Set up family",
  "Planned learning",
  "Saved first capture",
  "Viewed Portfolio",
  "Reached Reports",
] as const;

function buildJourneyDrops(customers: FounderCustomer[]) {
  return JOURNEY_LABELS.slice(0, -1).map((from, index): FounderJourneyDrop => {
    const families = customers
      .filter((customer) => {
        const membership = journeyMembership(customer);
        return membership[index] && !membership[index + 1];
      })
      .map(compactFamily);
    return {
      from,
      to: JOURNEY_LABELS[index + 1],
      count: families.length,
      families,
    };
  });
}

function buildObservedPaths(customers: FounderCustomer[]) {
  const paths = new Map<string, { from: string; to: string; count: number; userIds: Set<string> }>();

  for (const customer of customers) {
    const areas = [...fullActivity(customer)]
      .sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt))
      .map((activity) => areaForActivityLabel(activity.label))
      .filter((area): area is FounderArea => area !== null);

    const compacted = areas.filter((area, index) => index === 0 || area !== areas[index - 1]);
    for (let index = 1; index < compacted.length; index += 1) {
      const from = compacted[index - 1];
      const to = compacted[index];
      const key = `${from} → ${to}`;
      const current = paths.get(key) ?? { from, to, count: 0, userIds: new Set<string>() };
      current.count += 1;
      current.userIds.add(customer.userId);
      paths.set(key, current);
    }
  }

  const customerById = new Map(customers.map((customer) => [customer.userId, customer]));
  return [...paths.values()]
    .map((path): FounderObservedPath => ({
      from: path.from,
      to: path.to,
      count: path.count,
      families: [...path.userIds]
        .map((userId) => customerById.get(userId))
        .filter((customer): customer is FounderCustomer => Boolean(customer))
        .map(compactFamily),
    }))
    .sort((left, right) => right.families.length - left.families.length || right.count - left.count)
    .slice(0, 5);
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function buildFounderBehaviourIntelligence(
  data: FounderDashboardData,
  now = new Date(data.generatedAt),
): FounderBehaviourIntelligence {
  const customers = data.customers;
  const today = dateKey(now);
  const newFamilies = customers.filter((customer) => dateKey(customer.joinedAt) === today).map(compactFamily);
  const activeFamilies = data.productActivityAvailable
    ? customers.filter((customer) => dateKey(customer.lastActiveAt) === today).map(compactFamily)
    : [];
  const returningFamilies = activeFamilies.filter((customer) => dateKey(customer.joinedAt) !== today);
  const customerById = new Map(customers.map((customer) => [customer.userId, customer]));

  const learningActions = (data.productActivityAvailable ? customers : [])
    .flatMap((customer) => fullActivity(customer)
      .filter((activity) => dateKey(activity.occurredAt) === today && MEANINGFUL_ACTIVITY_LABELS.has(activity.label))
      .map((activity): FounderBehaviourAction => ({
        userId: customer.userId,
        displayName: customer.displayName,
        email: customer.email,
        label: activity.label,
        occurredAt: activity.occurredAt,
      })))
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt));

  const activeLast30Days = customers.filter((customer) => customer.activeDays30 > 0);
  const activeLast7Days = customers.filter((customer) => ageInDays(now, customer.lastActiveAt) <= 7);
  const repeatFamilies = customers.filter((customer) => customer.activeDays30 >= 2);
  const regularFamilies = customers.filter((customer) => customer.activeDays30 >= 3);
  const goingQuiet = customers.filter((customer) => customer.status === "Going quiet");
  const dormant = customers.filter((customer) => customer.status === "Dormant");
  const averageActiveDays = activeLast30Days.length > 0
    ? activeLast30Days.reduce((total, customer) => total + customer.activeDays30, 0) / activeLast30Days.length
    : 0;
  const repeatRate = activeLast30Days.length > 0 ? repeatFamilies.length / activeLast30Days.length : 0;

  const journeyDrops = buildJourneyDrops(customers);
  const observedPaths = buildObservedPaths(customers);
  const largestDrop = [...journeyDrops].sort((left, right) => right.count - left.count)[0];
  const topFeature = data.featureUsage[0];

  const read: string[] = [];
  if (activeLast30Days.length > 0) {
    read.push(`${plural(activeLast30Days.length, "family", "families")} used MyLearna in the last 30 days, and ${plural(repeatFamilies.length, "family has", "families have")} returned on at least two separate days.`);
  } else {
    read.push("No genuine family activity has been recorded in the current 30-day behaviour window yet.");
  }
  if (topFeature?.users) {
    read.push(`${topFeature.label} is currently the widest-used product area, reaching ${plural(topFeature.users, "family", "families")}.`);
  }
  if (largestDrop?.count) {
    read.push(`The largest observed journey gap is ${largestDrop.from} → ${largestDrop.to}, with ${plural(largestDrop.count, "family", "families")} not yet reaching the next stage.`);
  }
  if (goingQuiet.length > 0) {
    read.push(`${plural(goingQuiet.length, "family is", "families are")} currently going quiet after earlier use.`);
  }

  return {
    founderRead: read.join(" "),
    todayDetails: {
      newFamilies,
      activeFamilies,
      returningFamilies,
      learningActions,
    },
    engagement: {
      activeLast7Days: activeLast7Days.length,
      activeLast30Days: activeLast30Days.length,
      repeatFamilies: repeatFamilies.length,
      regularFamilies: regularFamilies.length,
      repeatRate,
      averageActiveDays,
    },
    groups: {
      activeLast7Days: activeLast7Days.map(compactFamily),
      activeLast30Days: activeLast30Days.map(compactFamily),
      repeatFamilies: repeatFamilies.map(compactFamily),
      regularFamilies: regularFamilies.map(compactFamily),
      goingQuiet: goingQuiet.map(compactFamily),
      dormant: dormant.map(compactFamily),
    },
    journeyDrops,
    observedPaths: observedPaths.map((path) => ({
      ...path,
      families: path.families.filter((family) => customerById.has(family.userId)),
    })),
  };
}

export const founderBehaviourInternals = {
  areaForActivityLabel,
  buildJourneyDrops,
  buildObservedPaths,
};
