import type { FounderCustomer, FounderDashboardData } from "@/lib/clean/founder/founderDashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

export type FounderActionKind =
  | "welcome"
  | "setup-help"
  | "first-value-gap"
  | "going-quiet"
  | "feedback";

export type FounderActionConfidence = "Worth doing now" | "Worth watching" | "Opportunity";
export type FounderActionOperatingType = "ACT" | "CHECK" | "INVESTIGATE" | "MONITOR" | "ASK";

export type FounderAction = {
  id: string;
  kind: FounderActionKind;
  priority: number;
  confidence: FounderActionConfidence;
  operatingType: FounderActionOperatingType;
  title: string;
  summary: string;
  why: string;
  evidence: string[];
  family: {
    userId: string;
    displayName: string;
    email: string | null;
    joinedAt: string;
    lastActiveAt: string | null;
    activeDays30: number;
  };
  emailDraft: {
    subject: string;
    body: string;
  } | null;
};

function ageInDays(now: Date, value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - parsed) / DAY_MS);
}

function dayLabel(value: number) {
  if (!Number.isFinite(value)) return "an unknown number of days";
  if (value < 1) return "less than a day";
  const rounded = Math.max(1, Math.floor(value));
  return `${rounded} ${rounded === 1 ? "day" : "days"}`;
}

function familyRef(customer: FounderCustomer): FounderAction["family"] {
  return {
    userId: customer.userId,
    displayName: customer.displayName,
    email: customer.email,
    joinedAt: customer.joinedAt,
    lastActiveAt: customer.lastActiveAt,
    activeDays30: customer.activeDays30,
  };
}

function welcomeDraft(): FounderAction["emailDraft"] {
  return {
    subject: "Welcome to MyLearna",
    body: "Hi,\n\nI wanted to personally welcome you to MyLearna. I’m the founder, and I’m really glad you’ve joined us.\n\nIf anything feels unclear while you’re getting started, just reply to this email and I’ll be happy to help.",
  };
}

function setupDraft(): FounderAction["emailDraft"] {
  return {
    subject: "How are you getting on with MyLearna?",
    body: "Hi,\n\nI wanted to check in while you’re getting started with MyLearna. If you’ve hit anything confusing while setting up your family or learners, just reply and I’ll be happy to help.",
  };
}

function captureDraft(): FounderAction["emailDraft"] {
  return {
    subject: "A quick MyLearna check-in",
    body: "Hi,\n\nI wanted to check in as you’re getting started with planning and capturing learning in MyLearna. If anything has felt unclear or harder than it should, I’d really value hearing about it.",
  };
}

function quietDraft(): FounderAction["emailDraft"] {
  return {
    subject: "A quick MyLearna check-in",
    body: "Hi,\n\nI wanted to check in and see how you’re getting on with MyLearna. If you’ve run into anything that has made it harder to keep using, I’d be grateful to hear about it and happy to help.",
  };
}

function feedbackDraft(): FounderAction["emailDraft"] {
  return {
    subject: "Could I ask for your MyLearna feedback?",
    body: "Hi,\n\nThanks for spending some time with MyLearna. As the founder, I’d really value hearing what has been most useful so far and anything you think I could improve.",
  };
}

function actionForCustomer(customer: FounderCustomer, now: Date): FounderAction | null {
  const joinedDays = ageInDays(now, customer.joinedAt);
  const inactiveDays = ageInDays(now, customer.lastActiveAt);
  const planned = customer.myDayViews > 0 || customer.calendarActions > 0;
  const meaningfulProgress = customer.capturesSaved > 0 || customer.portfolioViews > 0 || customer.reportViews > 0;

  if (joinedDays <= 1) {
    return {
      id: `welcome:${customer.userId}`,
      kind: "welcome",
      priority: 100,
      confidence: "Worth doing now",
      operatingType: "ACT",
      title: "Send a personal welcome",
      summary: `${customer.displayName} joined ${dayLabel(joinedDays)} ago.`,
      why: "A short personal welcome is useful while the relationship is still new and gives the family an easy route to ask for help.",
      evidence: [
        `Joined ${dayLabel(joinedDays)} ago`,
        customer.profileCompleted ? "Family profile is set up" : "Family profile is not complete yet",
        `${customer.learnerCount} ${customer.learnerCount === 1 ? "learner" : "learners"} added`,
      ],
      family: familyRef(customer),
      emailDraft: customer.email ? welcomeDraft() : null,
    };
  }

  if (joinedDays <= 7 && (!customer.profileCompleted || customer.learnerCount === 0)) {
    return {
      id: `setup:${customer.userId}`,
      kind: "setup-help",
      priority: 95,
      confidence: customer.lastActiveAt ? "Worth doing now" : "Worth watching",
      operatingType: customer.lastActiveAt ? "ACT" : "CHECK",
      title: customer.lastActiveAt ? "Check whether setup is blocking this family" : "Review this family’s setup",
      summary: `${customer.displayName} joined ${dayLabel(joinedDays)} ago and setup is still incomplete.`,
      why: "This is a clear early friction signal. A personal check-in may reveal something confusing before the family disengages.",
      evidence: [
        customer.profileCompleted ? "Family profile completed" : "Family profile still incomplete",
        `${customer.learnerCount} ${customer.learnerCount === 1 ? "learner" : "learners"} added`,
        customer.lastActiveAt ? `Last active ${dayLabel(inactiveDays)} ago` : "No product activity recorded yet",
      ],
      family: familyRef(customer),
      emailDraft: customer.email && joinedDays >= 3 && customer.lastActiveAt ? setupDraft() : null,
    };
  }

  const plannedActions = customer.myDayViews + customer.calendarActions;
  const strongFirstCaptureSignal = plannedActions >= 3 && customer.activeDays30 >= 2;
  if (joinedDays <= 14 && planned && customer.capturesSaved === 0 && inactiveDays <= 7) {
    return {
      id: `first-capture:${customer.userId}`,
      kind: "first-value-gap",
      priority: 90,
      confidence: strongFirstCaptureSignal ? "Worth doing now" : "Worth watching",
      operatingType: "CHECK",
      title: "Review first-capture friction",
      summary: `${customer.displayName} has planned learning but has not saved a first capture yet.`,
      why: "Planning without a first saved learning record is the clearest current gap between setup and experiencing MyLearna’s record-keeping value.",
      evidence: [
        `${customer.myDayViews} My Day ${customer.myDayViews === 1 ? "view" : "views"}`,
        `${customer.calendarActions} Calendar ${customer.calendarActions === 1 ? "action" : "actions"}`,
        "0 learning captures saved",
      ],
      family: familyRef(customer),
      emailDraft: strongFirstCaptureSignal && customer.email ? captureDraft() : null,
    };
  }

  if (customer.status === "Going quiet") {
    return {
      id: `quiet:${customer.userId}`,
      kind: "going-quiet",
      priority: 80,
      confidence: "Worth watching",
      operatingType: "MONITOR",
      title: "Monitor this family’s return pattern",
      summary: `${customer.displayName} used MyLearna previously but has not been active for ${dayLabel(inactiveDays)}.`,
      why: "A previously active family becoming quiet can reveal a support need, a product friction point, or simply a natural pause. It is worth checking before assuming why.",
      evidence: [
        `${customer.activeDays30} active ${customer.activeDays30 === 1 ? "day" : "days"} in the last 30 days`,
        `Last active ${dayLabel(inactiveDays)} ago`,
        customer.topArea ? `Most-used area: ${customer.topArea}` : "No strongest product area yet",
      ],
      family: familyRef(customer),
      emailDraft: null,
    };
  }

  if (customer.activeDays30 >= 3 && meaningfulProgress && customer.status !== "Dormant") {
    return {
      id: `feedback:${customer.userId}:first-regular-use`,
      kind: "feedback",
      priority: 60,
      confidence: "Opportunity",
      operatingType: "ASK",
      title: "Ask an engaged family what is working",
      summary: `${customer.displayName} has returned on ${customer.activeDays30} separate days in the current 30-day window.`,
      why: "This family has enough repeat experience to give useful qualitative feedback about what is genuinely helping and what still feels awkward.",
      evidence: [
        `${customer.activeDays30} active days / 30`,
        `${customer.capturesSaved} learning ${customer.capturesSaved === 1 ? "capture" : "captures"} saved`,
        `${customer.portfolioViews} Portfolio ${customer.portfolioViews === 1 ? "view" : "views"}`,
        `${customer.reportViews} Report ${customer.reportViews === 1 ? "view" : "views"}`,
      ],
      family: familyRef(customer),
      emailDraft: customer.email ? feedbackDraft() : null,
    };
  }

  return null;
}

function aggregateAuthAction(signal: NonNullable<FounderDashboardData["authFunnel"]>["signals"][number], rangeDays: 7 | 30): FounderAction {
  return { id: `auth-aggregate:${signal.id.replace("auth-", "")}:${rangeDays}d`, kind: "feedback", priority: signal.operatingType === "INVESTIGATE" ? 75 : 65, confidence: "Worth watching", operatingType: signal.operatingType, title: signal.title, summary: signal.summary, why: "Review the authentication journey using aggregate, privacy-safe signals.", evidence: [signal.summary], family: { userId: "aggregate", displayName: "Aggregate auth signal", email: null, joinedAt: new Date(0).toISOString(), lastActiveAt: null, activeDays30: 0 }, emailDraft: null };
}

function authActionForCustomer(customer: FounderCustomer, now: Date): FounderAction | null {
  if (customer.confirmedAt === undefined) return null;
  const age = ageInDays(now, customer.joinedAt);
  if (age < 30 / 1440) return null;
  const family = familyRef(customer);
  if (!customer.confirmedAt) return { id: `auth:${customer.userId}:unconfirmed`, kind: "setup-help", priority: 70, confidence: "Worth doing now", operatingType: "CHECK", title: "CHECK — EMAIL NOT CONFIRMED", summary: `${customer.displayName} has not confirmed their email.`, why: "The account is old enough to check whether email confirmation is blocking entry.", evidence: ["Email confirmation is still pending", "Account is more than 30 minutes old"], family, emailDraft: null };
  if (!customer.lastSignInAt) return { id: `auth:${customer.userId}:confirmed-no-signin`, kind: "setup-help", priority: 70, confidence: "Worth doing now", operatingType: "CHECK", title: "CHECK — CONFIRMED BUT NOT SIGNED IN", summary: `${customer.displayName} confirmed email but has not entered MyLearna.`, why: "A confirmed account with no sign-in may indicate entry friction.", evidence: ["Email confirmed more than 30 minutes ago", "No completed sign-in found"], family, emailDraft: null };
  if (!customer.profileCompleted && ageInDays(now, customer.lastSignInAt) >= 30 / 1440) return { id: `auth:${customer.userId}:signed-in-no-family`, kind: "setup-help", priority: 70, confidence: "Worth doing now", operatingType: "CHECK", title: "CHECK — SIGNED IN BUT SETUP NOT STARTED", summary: `${customer.displayName} signed in but has not created a family profile.`, why: "The first setup destination may need a private Founder check.", evidence: ["Successful sign-in found", "No family profile found"], family, emailDraft: null };
  return null;
}

export function buildFounderActions(data: FounderDashboardData, now = new Date(data.generatedAt), limit = 5): FounderAction[] {
  const actions = data.customers
    .flatMap((customer) => [actionForCustomer(customer, now), authActionForCustomer(customer, now)])
    .filter((action): action is FounderAction => action !== null)
    .sort((left, right) => right.priority - left.priority || left.family.displayName.localeCompare(right.family.displayName))
  if (data.authFunnel?.signals) actions.push(...data.authFunnel.signals.map((signal) => aggregateAuthAction(signal, 7)));
  return actions.sort((left, right) => right.priority - left.priority || left.family.displayName.localeCompare(right.family.displayName)).slice(0, Math.max(0, limit));
}

export const founderActionInternals = {
  ageInDays,
  actionForCustomer,
  authActionForCustomer,
  quietDraft,
};
