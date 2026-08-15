export type QuickCaptureReturnKind = "my-day" | "pathways" | "other";

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
  const returnKind = getReturnKind(returnHref);
  const returnLabel =
    returnKind === "my-day"
      ? "Back to My Day"
      : returnKind === "pathways"
        ? "Return to pathway"
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
    primaryHref: portfolioHref ?? returnHref,
    primaryLabel: portfolioHref ? "View in Portfolio" : returnLabel,
    returnHref,
    returnKind,
    returnLabel,
    showCaptureAnother: returnKind !== "pathways",
  };
}
