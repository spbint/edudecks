import type { AuthorityHubMarketConfig } from "@/app/components/AuthorityHubShell";

export const AUTHORITY_MARKET_CONFIG: Record<string, AuthorityHubMarketConfig> = {
  au: {
    marketKey: "au",
    marketLabel: "Australia Authority Pack",
    subtitle: "Authority Hub — Australia",
    heroTitle: "Prepare a stronger AU-facing authority record",
    heroText:
      "Use this hub to review whether your family evidence, portfolio curation, and saved reporting drafts are strong enough for a more formal Australia-facing pack.",
    heroAsideTitle: "Australia-facing lens",
    heroAsideText:
      "This pathway is best when you want a more formal review surface without losing the calmer family workflow underneath.",
    primaryColor: "#1d4ed8",
    introTitle: "Australia Authority Hub",
    introText:
      "Review the evidence base, identify gaps, and move toward a stronger authority-style pack for Australian contexts.",
    fastLanes: [
      { href: "/capture", label: "Capture" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/reports", label: "Build AU Draft", primary: true },
      { href: "/reports/library", label: "Report Library" },
      { href: "/authority", label: "Authority Selector" },
    ],
  },

  uk: {
    marketKey: "uk",
    marketLabel: "UK Authority Pack",
    subtitle: "Authority Hub — United Kingdom",
    heroTitle: "Prepare a stronger UK-facing home education record",
    heroText:
      "Use this hub to review breadth, evidence quality, and saved reporting drafts through a more UK-facing home education lens.",
    heroAsideTitle: "UK-facing lens",
    heroAsideText:
      "This pathway helps families create a clearer and more reviewable educational record without making the whole product feel bureaucratic.",
    primaryColor: "#6d28d9",
    introTitle: "UK Authority Hub",
    introText:
      "Assess whether your current family record feels visible, broad, and reviewable enough for a stronger UK-facing pack.",
    fastLanes: [
      { href: "/capture", label: "Capture" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/reports", label: "Build UK Draft", primary: true },
      { href: "/reports/library", label: "Report Library" },
      { href: "/authority", label: "Authority Selector" },
    ],
  },

  us: {
    marketKey: "us",
    marketLabel: "US Authority Pack",
    subtitle: "Authority Hub — United States",
    heroTitle: "Prepare a stronger US-facing compliance record",
    heroText:
      "Use this hub to assess documentation strength, evidence quality, and saved reporting drafts through a more compliance-oriented US lens.",
    heroAsideTitle: "US-facing lens",
    heroAsideText:
      "This pathway is useful when you want the reporting layer to feel more formal, credible, and documentation-focused.",
    primaryColor: "#166534",
    introTitle: "US Authority Hub",
    introText:
      "Review whether the family evidence base is strong enough to support a clearer compliance-style reporting pack.",
    fastLanes: [
      { href: "/capture", label: "Capture" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/reports", label: "Build US Draft", primary: true },
      { href: "/reports/library", label: "Report Library" },
      { href: "/authority", label: "Authority Selector" },
    ],
  },
};