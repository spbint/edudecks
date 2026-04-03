import type { PremiumTrigger } from "@/lib/premiumUpgradeEngine";

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
  trigger: PremiumTrigger;
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
  PremiumTrigger,
  PremiumTriggerConfig
> = {
  general: {
    trigger: "general",
    headline: "Unlock richer support across the family workflow",
    supportingText:
      "Premium adds stronger guidance, cleaner organisation, and more polished outputs as your family record grows.",
    primaryCtaLabel: "See premium options",
    secondaryCtaLabel: "Keep using free",
    featureKeys: ["advanced-workflow", "guided-reports"],
    recommendedPlan: "premium",
  },

  reports: {
    trigger: "reports",
    headline: "Unlock stronger reporting support",
    supportingText:
      "Premium helps families shape evidence into clearer, calmer, and more trustworthy reports with less manual effort.",
    primaryCtaLabel: "Unlock reporting support",
    secondaryCtaLabel: "Keep building manually",
    featureKeys: ["guided-reports", "advanced-workflow"],
    recommendedPlan: "premium",
  },

  portfolio: {
    trigger: "portfolio",
    headline: "Make your portfolio more polished and organised",
    supportingText:
      "Premium helps families keep growing records better organised and easier to present as evidence builds over time.",
    primaryCtaLabel: "Unlock portfolio extras",
    secondaryCtaLabel: "Keep using free portfolio",
    featureKeys: ["advanced-workflow", "curriculum-refinement"],
    recommendedPlan: "premium",
  },

  planner: {
    trigger: "planner",
    headline: "Unlock deeper planning support",
    supportingText:
      "Premium adds stronger planning workflows and a calmer way to keep weekly learning more connected to evidence and reporting.",
    primaryCtaLabel: "Unlock planning support",
    secondaryCtaLabel: "Keep using free planner",
    featureKeys: ["advanced-workflow"],
    recommendedPlan: "premium",
  },

  authority: {
    trigger: "authority",
    headline: "Build a stronger authority-ready record",
    supportingText:
      "Premium helps families move from basic readiness to a more structured, more defensible authority-facing workflow.",
    primaryCtaLabel: "Unlock authority support",
    secondaryCtaLabel: "Keep using free authority tools",
    featureKeys: ["authority-pack", "pdf-export", "docx-export"],
    recommendedPlan: "premium",
  },

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

export function getPremiumTriggerConfig(trigger: PremiumTrigger) {
  return PREMIUM_TRIGGER_CONFIGS[trigger];
}

export function planIncludesFeature(
  planKey: PremiumPlanKey,
  featureKey: PremiumFeatureKey
) {
  return PREMIUM_PLANS[planKey].features.includes(featureKey);
}

export function getFeaturesForTrigger(trigger: PremiumTrigger) {
  const config = getPremiumTriggerConfig(trigger);
  return config.featureKeys.map((key) => getPremiumFeature(key));
}

export function getRecommendedPlanForTrigger(trigger: PremiumTrigger) {
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