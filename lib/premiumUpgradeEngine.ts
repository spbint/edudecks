export type PremiumPlan = "free" | "premium";

export type PremiumTrigger =
  | "reports"
  | "portfolio"
  | "authority"
  | "planner"
  | "general";

export type PremiumUpgradeDecision = {
  shouldShow: boolean;
  trigger: PremiumTrigger;
  title: string;
  message: string;
};

const STORAGE_KEY_PLAN = "edudecks_premium_plan";
const STORAGE_KEY_DISMISSED = "edudecks_premium_dismissed_triggers";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readDismissedTriggers(): PremiumTrigger[] {
  if (!canUseBrowserStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PremiumTrigger[]) : [];
  } catch {
    return [];
  }
}

function writeDismissedTriggers(triggers: PremiumTrigger[]) {
  if (!canUseBrowserStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(triggers));
  } catch {
    // ignore storage errors
  }
}

export function getPremiumPlanFromStorage(): PremiumPlan {
  if (!canUseBrowserStorage()) return "free";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PLAN);
    return raw === "premium" ? "premium" : "free";
  } catch {
    return "free";
  }
}

export function dismissPremiumTrigger(trigger: PremiumTrigger) {
  const current = readDismissedTriggers();
  if (current.includes(trigger)) return;
  writeDismissedTriggers([...current, trigger]);
}

export function getPremiumUpgradeDecision(
  trigger: PremiumTrigger = "general"
): PremiumUpgradeDecision {
  const plan = getPremiumPlanFromStorage();
  if (plan === "premium") {
    return {
      shouldShow: false,
      trigger,
      title: "Premium active",
      message: "Premium features are already available on this account.",
    };
  }

  const dismissed = readDismissedTriggers();
  if (dismissed.includes(trigger)) {
    return {
      shouldShow: false,
      trigger,
      title: "Dismissed",
      message: "This upgrade prompt has already been dismissed.",
    };
  }

  const contentByTrigger: Record<PremiumTrigger, { title: string; message: string }> = {
    reports: {
      title: "Unlock richer reporting",
      message:
        "Premium adds more advanced report guidance, deeper drafting support, and richer export options.",
    },
    portfolio: {
      title: "Unlock richer portfolios",
      message:
        "Premium adds stronger portfolio presentation, smarter organisation, and enhanced evidence tools.",
    },
    authority: {
      title: "Unlock authority-ready extras",
      message:
        "Premium adds stronger pack guidance, deeper readiness checks, and more polished export support.",
    },
    planner: {
      title: "Unlock smarter planning",
      message:
        "Premium adds enhanced planning support, smarter prompts, and deeper family workflow tools.",
    },
    general: {
      title: "Unlock EduDecks Premium",
      message:
        "Premium adds richer guidance, deeper tools, and more polished outputs across the family workflow.",
    },
  };

  return {
    shouldShow: true,
    trigger,
    title: contentByTrigger[trigger].title,
    message: contentByTrigger[trigger].message,
  };
}