export type QuickCaptureReturnKind = "my-day" | "pathways" | "curriculum" | "other";

export type QuickCaptureSuccessHandoff = {
  portfolioHref: string | null;
  portfolioMessage: string | null;
  reportMessage: string | null;
  primaryHref: string;
  primaryLabel: string;
  returnHref: string;
  returnKind: QuickCaptureReturnKind;
  returnLabel: string;
  showCaptureAnother: boolean;
};

export function safeQuickCaptureReturnPath(
  value: string | null | undefined,
  fallback = "/my-day",
) {
  const normalized = String(value ?? "").trim();
  return normalized.startsWith("/") && !normalized.startsWith("//")
    ? normalized
    : fallback;
}

function getReturnKind(returnHref: string): QuickCaptureReturnKind {
  const pathname = returnHref.split(/[?#]/, 1)[0];
  if (
    pathname === "/my-day" ||
    pathname.startsWith("/my-day/") ||
    pathname === "/clean-my-day" ||
    pathname.startsWith("/clean-my-day/")
  ) {
    return "my-day";
  }
  if (
    pathname === "/my-pathways" ||
    pathname.startsWith("/my-pathways/") ||
    pathname === "/clean-my-pathways" ||
    pathname.startsWith("/clean-my-pathways/")
  ) {
    return "pathways";
  }
  if (
    pathname === "/my-learna" ||
    pathname.startsWith("/my-learna/") ||
    pathname === "/clean-my-curriculum" ||
    pathname.startsWith("/clean-my-curriculum/")
  ) {
    return "curriculum";
  }
  return "other";
}

export function buildQuickCaptureSuccessHandoff({
  evidenceId,
  learnerId,
  learnerLabel,
  includeInPortfolio,
  includeInReport,
  returnTo,
  portfolioPathBase = "/my-portfolio",
}: {
  evidenceId: string;
  learnerId: string;
  learnerLabel: string;
  includeInPortfolio: boolean;
  includeInReport: boolean;
  returnTo: string | null | undefined;
  portfolioPathBase?: "/my-portfolio" | "/clean-my-portfolio";
}): QuickCaptureSuccessHandoff {
  const returnHref = safeQuickCaptureReturnPath(returnTo);
  const returnKind = String(returnTo ?? "").trim() ? getReturnKind(returnHref) : "other";
  const returnLabel =
    returnKind === "my-day"
      ? "Back to My Day"
      : returnKind === "pathways"
        ? "Return to pathway"
        : returnKind === "curriculum"
          ? "Back to My Learna"
          : "Return";
  const portfolioHref = includeInPortfolio
    ? `${portfolioPathBase}?learner_id=${encodeURIComponent(learnerId)}&latestEvidenceId=${encodeURIComponent(evidenceId)}&source=my-capture`
    : null;

  return {
    portfolioHref,
    portfolioMessage: includeInPortfolio
      ? `Added to ${learnerLabel}’s Portfolio.`
      : null,
    reportMessage: includeInReport ? "Included in Reports." : null,
    primaryHref: returnKind === "other" ? portfolioHref ?? returnHref : returnHref,
    primaryLabel: returnKind === "other" && portfolioHref ? "View in Portfolio" : returnLabel,
    returnHref,
    returnKind,
    returnLabel,
    showCaptureAnother: true,
  };
}
