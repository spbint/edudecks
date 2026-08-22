import type { FounderCustomer, FounderDashboardData } from "@/lib/clean/founder/founderDashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

export type FounderActionKind =
  | "welcome"
  | "setup-help"
  | "first-value-gap"
  | "going-quiet"
  | "feedback";

export type FounderActionConfidence = "Worth doing now" | "Worth watching" | "Opportunity";

export type FounderAction = {
  id: string;
  kind: FounderActionKind;
  priority: number;
  confidence: FounderActionConfidence;
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
    body: "Hi,\n\nI wanted to personally welcome you to MyLearna. I’m the founder, and I’m really glad you’ve joined us.\n\nIf anything feels unclear while you’re getting started, just reply to this email and I’ll be happy to help.\n\nSean\nFounder, MyLearna",
  };
}

function setupDraft(): FounderAction["emailDraft"] {
  return {
    subject: "How are you getting on with MyLearna?",
    body: "Hi,\n\nI wanted to check in while you’re getting started with MyLearna. If you’ve hit anything confusing while setting up your family or learners, just reply and I’ll be happy to help.\n\nSean\nFounder, MyLearna",
  };
}

function captureDraft(): FounderAction["emailDraft"] {
  return {
    subject: "A quick MyLearna check-in",
    body: "Hi,\n\nI wanted to check in as you’re getting started with planning and capturing learning in MyLearna. If anything has felt unclear or harder than it should, I’d really value hearing about it.\n\nSean\nFounder, MyLearna",
  };
}

function quietDraft(): FounderAction["emailDraft"] {
  return {
    subject: "A quick MyLearna check-in",
    body: "Hi,\n\nI wanted to check in and see how you’re getting on with MyLearna. If you’ve run into anything that has made it harder to keep using, I’d be grateful to hear about it and happy to help.\n\nSean\nFounder, MyLearna",
  };
}

function feedbackDraft(): FounderAction["emailDraft"] {
  return {
    subject: "Could I ask for your MyLearna feedback?",
    body: "Hi,\n\nThanks for spending some time with MyLearna. As the founder, I’d really value hearing what has been most useful so far and anything you think I could improve.\n\nSean\nFounder, MyLearna",
  };
}

function actionForCustomer(customer: FounderCustomer, now: Date): FounderAction | null {
  const joinedDays = ageInDays(now, customer.joinedAt);
  const inactiveDays = ageInDays(now, customer.lastActiveAt);
  const planned = customer.myDayViews > 0 || customer.calendarActions > 0;
  const meaningfulProgress = customer.capturesSaved > 0 || customer.portfolioViews > 0 || customer.reportViews > 0;

  if (joinedDays <= 1) {
    return {
      id: `welcome:${customer.userId}:${customer.joinedAt}`,
      kind: "welcome",
      priority: 100,
      confidence: "Worth doing now",
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
      id: `setup:${customer.userId}:${customer.joinedAt}`,
      kind: "setup-help",
      priority: 95,
      confidence: "Worth doing now",
      title: "Offer setup help",
      summary: `${customer.displayName} joined ${dayLabel(joinedDays)} ago and setup is still incomplete.`,
      why: "This is a clear early friction signal. A personal check-in may reveal something confusing before the family disengages.",
      evidence: [
        customer.profileCompleted ? "Family profile completed" : "Family profile still incomplete",
        `${customer.learnerCount} ${customer.learnerCount === 1 ? "learner" : "learners"} added`,
        customer.lastActiveAt ? `Last active ${dayLabel(inactiveDays)} ago` : "No product activity recorded yet",
      ],
      family: familyRef(customer),
      emailDraft: customer.email ? setupDraft() : null,
    };
  }

  if (joinedDays <= 14 && planned && customer.capturesSaved === 0 && inactiveDays <= 7) {
    return {
      id: `first-capture:${customer.userId}:${customer.lastActiveAt ?? customer.joinedAt}`,
      kind: "first-value-gap",
      priority: 90,
      confidence: "Worth doing now",
      title: "Check first-capture friction",
      summary: `${customer.displayName} has planned learning but has not saved a first capture yet.`,
      why: "Planning without a first saved learning record is the clearest current gap between setup and experiencing MyLearna’s record-keeping value.",
      evidence: [
        `${customer.myDayViews} My Day ${customer.myDayViews === 1 ? "view" : "views"}`,
        `${customer.calendarActions} Calendar ${customer.calendarActions === 1 ? "action" : "actions"}`,
        "0 learning captures saved",
      ],
      family: familyRef(customer),
      emailDraft: customer.email ? captureDraft() : null,
    };
  }

  if (customer.status === "Going quiet") {
    return {
      id: `quiet:${customer.userId}:${customer.lastActiveAt ?? "none"}`,
      kind: "going-quiet",
      priority: 80,
      confidence: "Worth watching",
      title: "Check in with a family going quiet",
      summary: `${customer.displayName} used MyLearna previously but has not been active for ${dayLabel(inactiveDays)}.`,
      why: "A previously active family becoming quiet can reveal a support need, a product friction point, or simply a natural pause. It is worth checking before assuming why.",
      evidence: [
        `${customer.activeDays30} active ${customer.activeDays30 === 1 ? "day" : "days"} in the last 30 days`,
        `Last active ${dayLabel(inactiveDays)} ago`,
        customer.topArea ? `Most-used area: ${customer.topArea}` : "No strongest product area yet",
      ],
      family: familyRef(customer),
      emailDraft: customer.email ? quietDraft() : null,
    };
  }

  if (customer.activeDays30 >= 3 && meaningfulProgress && customer.status !== "Dormant") {
    return {
      id: `feedback:${customer.userId}:first-regular-use`,
      kind: "feedback",
      priority: 60,
      confidence: "Opportunity",
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

export function buildFounderActions(data: FounderDashboardData, now = new Date(data.generatedAt), limit = 5): FounderAction[] {
  return data.customers
    .map((customer) => actionForCustomer(customer, now))
    .filter((action): action is FounderAction => action !== null)
    .sort((left, right) => right.priority - left.priority || left.family.displayName.localeCompare(right.family.displayName))
    .slice(0, Math.max(0, limit));
}

export const founderActionInternals = {
  ageInDays,
  actionForCustomer,
};
