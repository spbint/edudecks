import type { PremiumTriggerKey } from "@/lib/premiumUpgradeEngine";

export type PremiumPlanKey = "free" | "premium";

export type PremiumFeatureKey =
  | "media-capture"
  | "guided-reports"
  | "pdf-export"
  | "docx-export"
  | "authority-pack"
  | "advanced-workflow"
  | "curriculum-refinement";

export type PremiumPlan = {
  key: PremiumPlanKey;
  label: string;
  shortLabel: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  active: boolean;
  description: string;
  features: PremiumFeatureKey[];
};

export type PremiumFeatureMeta = {
  key: PremiumFeatureKey;
  label: string;
  shortDescription: string;
  longDescription: string;
};

export type PremiumTriggerConfig = {
  trigger: PremiumTriggerKey;
  headline: string;
  supportingText: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  featureKeys: PremiumFeatureKey[];
  recommendedPlan: PremiumPlanKey;
};

export const PREMIUM_PLANS: Record<PremiumPlanKey, PremiumPlan> = {
  free: {
    key: "free",
    label: "EduDecks Free",
    shortLabel: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    active: true,
    description:
      "A genuinely useful starting point for families building a calm, credible learning record.",
    features: [],
  },

  premium: {
    key: "premium",
    label: "EduDecks Premium",
    shortLabel: "Premium",
    priceMonthly: null,
    priceYearly: null,
    active: false,
    description:
      "Richer evidence, stronger reporting support, and cleaner export tools when they become useful.",
    features: [
      "media-capture",
      "guided-reports",
      "pdf-export",
      "docx-export",
      "authority-pack",
      "advanced-workflow",
      "curriculum-refinement",
    ],
  },
};

export const PREMIUM_FEATURES: Record<PremiumFeatureKey, PremiumFeatureMeta> = {
  "media-capture": {
    key: "media-capture",
    label: "Media Capture",
    shortDescription: "Add photos, voice notes, and video to learning records.",
    longDescription:
      "Capture richer evidence with secure media storage for photos, audio reflections, spoken reading, demonstrations, and video moments.",
  },

  "guided-reports": {
    key: "guided-reports",
    label: "Guided Reports",
    shortDescription: "Get stronger guidance when shaping reports.",
    longDescription:
      "Use deeper report guidance, smarter evidence suggestions, and stronger support when turning learning moments into calm, trustworthy reports.",
  },

  "pdf-export": {
    key: "pdf-export",
    label: "PDF Export",
    shortDescription: "Generate polished PDF files for sharing or printing.",
    longDescription:
      "Turn saved reports and submission packs into polished PDFs that feel cleaner, more formal, and easier to share with reviewers or authorities.",
  },

  "docx-export": {
    key: "docx-export",
    label: "DOCX Export",
    shortDescription: "Generate editable DOCX files.",
    longDescription:
      "Export editable Word-format files for families who need a more flexible handoff, editing workflow, or printable archive.",
  },

  "authority-pack": {
    key: "authority-pack",
    label: "Authority Pack Support",
    shortDescription: "Build fuller authority-ready submission packs.",
    longDescription:
      "Unlock stronger authority-pack support, clearer readiness shaping, and more formal submission workflows when a family needs that next layer.",
  },

  "advanced-workflow": {
    key: "advanced-workflow",
    label: "Advanced Workflow",
    shortDescription: "Keep growing records more organised over time.",
    longDescription:
      "Use stronger organisation, deeper family workflow support, and a calmer long-term evidence system as your child’s record grows.",
  },

  "curriculum-refinement": {
    key: "curriculum-refinement",
    label: "Curriculum Refinement",
    shortDescription: "Map evidence more precisely to curriculum paths.",
    longDescription:
      "Use searchable curriculum country, framework, year, subject, strand, and skill mapping to refine evidence more precisely for reporting.",
  },
};

export const PREMIUM_TRIGGER_CONFIGS: Record<
  PremiumTriggerKey,
  PremiumTriggerConfig
> = {
  "capture-media": {
    trigger: "capture-media",
    headline: "Add richer evidence with photos, audio, and video",
    supportingText:
      "When media becomes useful, premium helps families capture more complete learning moments without changing the calm free workflow.",
    primaryCtaLabel: "Unlock media capture",
    secondaryCtaLabel: "Keep using free capture",
    featureKeys: ["media-capture"],
    recommendedPlan: "premium",
  },

  "reports-guidance": {
    trigger: "reports-guidance",
    headline: "Make reports easier to build and stronger to trust",
    supportingText:
      "Premium reporting support helps you move from scattered evidence to clearer, calmer reports with less manual effort.",
    primaryCtaLabel: "Unlock guided reports",
    secondaryCtaLabel: "Keep building manually",
    featureKeys: ["guided-reports", "advanced-workflow"],
    recommendedPlan: "premium",
  },

  "output-export": {
    trigger: "output-export",
    headline: "Turn this into a polished, shareable report",
    supportingText:
      "Premium export tools help families move from on-screen review into clean files for printing, sharing, and formal submission.",
    primaryCtaLabel: "Unlock export tools",
    secondaryCtaLabel: "Keep reviewing on screen",
    featureKeys: ["pdf-export", "docx-export"],
    recommendedPlan: "premium",
  },

  "authority-pack": {
    trigger: "authority-pack",
    headline: "Build a fuller, calmer authority-ready pack",
    supportingText:
      "Premium authority support helps shape a more structured and more defensible submission when a family needs formal export confidence.",
    primaryCtaLabel: "Unlock authority support",
    secondaryCtaLabel: "Continue with the basic pack",
    featureKeys: ["authority-pack", "pdf-export", "docx-export"],
    recommendedPlan: "premium",
  },

  "momentum-progress": {
    trigger: "momentum-progress",
    headline: "You’ve started building something valuable",
    supportingText:
      "As evidence, reports, and learning records grow, premium can help keep the system more organised, more powerful, and easier to use over time.",
    primaryCtaLabel: "See premium options",
    secondaryCtaLabel: "Keep going free",
    featureKeys: ["advanced-workflow", "guided-reports"],
    recommendedPlan: "premium",
  },
};

export function getPremiumPlan(planKey: PremiumPlanKey) {
  return PREMIUM_PLANS[planKey];
}

export function getPremiumFeature(featureKey: PremiumFeatureKey) {
  return PREMIUM_FEATURES[featureKey];
}

export function getPremiumTriggerConfig(trigger: PremiumTriggerKey) {
  return PREMIUM_TRIGGER_CONFIGS[trigger];
}

export function planIncludesFeature(
  planKey: PremiumPlanKey,
  featureKey: PremiumFeatureKey
) {
  return PREMIUM_PLANS[planKey].features.includes(featureKey);
}

export function getFeaturesForTrigger(trigger: PremiumTriggerKey) {
  const config = getPremiumTriggerConfig(trigger);
  return config.featureKeys.map((key) => getPremiumFeature(key));
}

export function getRecommendedPlanForTrigger(trigger: PremiumTriggerKey) {
  const config = getPremiumTriggerConfig(trigger);
  return getPremiumPlan(config.recommendedPlan);
}

export function getLockedFeatureListForFreePlan() {
  return PREMIUM_PLANS.premium.features.map((key) => PREMIUM_FEATURES[key]);
}

export function getPremiumPlanFromStorage(): PremiumPlanKey {
  if (typeof window === "undefined") return "free";

  try {
    const raw = String(localStorage.getItem("edudecks_plan") || "")
      .trim()
      .toLowerCase();

    if (raw === "premium") return "premium";
    return "free";
  } catch {
    return "free";
  }
}

export function isPremiumActive() {
  return getPremiumPlanFromStorage() === "premium";
}