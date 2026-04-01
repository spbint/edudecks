export type PremiumTriggerKey =
  | "capture-media"
  | "reports-guidance"
  | "output-export"
  | "authority-pack"
  | "momentum-progress";

export type PremiumTriggerTone = "violet" | "blue" | "amber" | "green";

export type PremiumAction = {
  label: string;
  href?: string;
  kind?: "primary" | "secondary" | "ghost";
};

export type PremiumTriggerContent = {
  key: PremiumTriggerKey;
  eyebrow: string;
  title: string;
  body: string;
  badge?: string;
  tone: PremiumTriggerTone;
  benefits: string[];
  primaryAction: PremiumAction;
  secondaryAction?: PremiumAction;
  footnote?: string;
};

export type PremiumUsageSnapshot = {
  captureCount?: number;
  reportCount?: number;
  selectedEvidenceCount?: number;
  hasTriedMediaUpload?: boolean;
  hasReachedOutput?: boolean;
  hasEnteredAuthorityFlow?: boolean;
  hasAttemptedExport?: boolean;
};

export type PremiumTriggerDecision = {
  shouldShow: boolean;
  reason: string;
};

export function getPremiumTriggerContent(
  key: PremiumTriggerKey
): PremiumTriggerContent {
  switch (key) {
    case "capture-media":
      return {
        key,
        eyebrow: "Richer evidence",
        title: "Add photos, audio, and video to learning records",
        body:
          "Visual and audio evidence can make your learning records richer, easier to revisit, and more powerful when you build reports later.",
        badge: "Premium",
        tone: "violet",
        benefits: [
          "Attach photos to learning moments",
          "Add audio reflections or voice notes",
          "Include video evidence for stronger records",
        ],
        primaryAction: {
          label: "Unlock media capture",
          href: "/pricing",
          kind: "primary",
        },
        secondaryAction: {
          label: "Continue with text only",
          kind: "ghost",
        },
        footnote:
          "You can keep using EduDecks for free — upgrade only if richer evidence becomes useful.",
      };

    case "reports-guidance":
      return {
        key,
        eyebrow: "Guided report support",
        title: "Make reports faster and more guided",
        body:
          "Unlock deeper report guidance, stronger evidence suggestions, and a smoother path from selected records to a confident report draft.",
        badge: "Premium",
        tone: "blue",
        benefits: [
          "Stronger guided report suggestions",
          "Faster evidence selection support",
          "Deeper interpretation and reporting help",
        ],
        primaryAction: {
          label: "Unlock guided reports",
          href: "/pricing",
          kind: "primary",
        },
        secondaryAction: {
          label: "Keep building manually",
          kind: "ghost",
        },
        footnote:
          "Premium should feel like relief, not pressure. Keep going free if the manual flow still works for your family.",
      };

    case "output-export":
      return {
        key,
        eyebrow: "Shareable output",
        title: "Turn this into a polished, shareable report",
        body:
          "Export clean PDF and DOCX files when you are ready to save, print, or share your child’s learning record more formally.",
        badge: "Premium",
        tone: "amber",
        benefits: [
          "Export polished PDF reports",
          "Generate editable DOCX versions",
          "Create cleaner authority-ready handoff files",
        ],
        primaryAction: {
          label: "Unlock export",
          href: "/pricing",
          kind: "primary",
        },
        secondaryAction: {
          label: "Keep reviewing on screen",
          kind: "ghost",
        },
        footnote:
          "You can still view and refine your report for free. Upgrade only when export becomes valuable.",
      };

    case "authority-pack":
      return {
        key,
        eyebrow: "Authority-ready support",
        title: "Build a fuller authority-ready submission",
        body:
          "Unlock deeper authority-pack structure, stronger readiness support, and a calmer submission workflow when you need a more formal pack.",
        badge: "Premium",
        tone: "green",
        benefits: [
          "Full authority-pack workflow support",
          "Stronger submission readiness guidance",
          "Cleaner formal pack assembly",
        ],
        primaryAction: {
          label: "Unlock authority support",
          href: "/pricing",
          kind: "primary",
        },
        secondaryAction: {
          label: "Continue basic version",
          kind: "ghost",
        },
        footnote:
          "Use the free workflow for as long as it serves you. Premium is there when the submission layer becomes important.",
      };

    case "momentum-progress":
    default:
      return {
        key: "momentum-progress",
        eyebrow: "You’re building something valuable",
        title: "Keep everything organised as your system grows",
        body:
          "You’ve already started building a meaningful evidence trail. Premium tools can help you keep that momentum calm, structured, and easier to use over time.",
        badge: "Premium",
        tone: "violet",
        benefits: [
          "Stronger workflow support as records grow",
          "More advanced planning and reporting layers",
          "A calmer long-term family system",
        ],
        primaryAction: {
          label: "See premium options",
          href: "/pricing",
          kind: "primary",
        },
        secondaryAction: {
          label: "Keep going free",
          kind: "ghost",
        },
        footnote:
          "Upgrade only if the fuller system becomes useful. The free layer should always remain genuinely helpful.",
      };
  }
}

export function shouldShowPremiumTrigger(
  key: PremiumTriggerKey,
  usage: PremiumUsageSnapshot
): PremiumTriggerDecision {
  switch (key) {
    case "capture-media":
      if (usage.hasTriedMediaUpload) {
        return {
          shouldShow: true,
          reason: "User tried to add premium media evidence.",
        };
      }
      return {
        shouldShow: false,
        reason: "User has not tried media capture yet.",
      };

    case "reports-guidance":
      if ((usage.reportCount || 0) >= 3 || (usage.selectedEvidenceCount || 0) >= 4) {
        return {
          shouldShow: true,
          reason: "User has enough report usage to benefit from guidance.",
        };
      }
      return {
        shouldShow: false,
        reason: "User has not yet reached reporting depth threshold.",
      };

    case "output-export":
      if (usage.hasReachedOutput || usage.hasAttemptedExport) {
        return {
          shouldShow: true,
          reason: "User has reached output or attempted export.",
        };
      }
      return {
        shouldShow: false,
        reason: "User has not yet reached export intent.",
      };

    case "authority-pack":
      if (usage.hasEnteredAuthorityFlow) {
        return {
          shouldShow: true,
          reason: "User is in authority flow.",
        };
      }
      return {
        shouldShow: false,
        reason: "User has not entered authority flow.",
      };

    case "momentum-progress":
    default:
      if ((usage.captureCount || 0) >= 5 || (usage.reportCount || 0) >= 1) {
        return {
          shouldShow: true,
          reason: "User has built enough momentum for a gentle upgrade prompt.",
        };
      }
      return {
        shouldShow: false,
        reason: "User has not yet built enough product momentum.",
      };
  }
}