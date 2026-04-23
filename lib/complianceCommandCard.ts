import type { ComplianceReadiness } from "@/lib/complianceReadiness";
import { loadComplianceReadiness } from "@/lib/complianceReadiness";
import type { FamilyProfileRow } from "@/lib/familySettings";
import type { FamilyLearner } from "@/lib/familyWorkspace";
import { loadReportsBuilderModel, nextReportCta } from "@/lib/reporting";

export type FamilyComplianceCommandCardModel = {
  learnerId: string;
  learnerName: string;
  jurisdictionName: string | null;
  jurisdictionCode: string | null;
  complianceModeLabel: string;
  complianceSummary: string;
  readinessStatus: "ready" | "warning" | "not_ready";
  readinessScore: number;
  summary: string;
  nextAction: string | null;
  topMissing: string[];
  primaryCta: {
    label: string;
    href: string;
  } | null;
  secondaryCta: {
    label: string;
    href: string;
  } | null;
  draftState: {
    hasReportDraft: boolean;
    reportStatus: string | null;
    reportingPeriodLabel: string | null;
    cycleLabel: string | null;
  } | null;
  helperNote: string | null;
};

type LoadFamilyComplianceCommandCardInput = {
  profile: FamilyProfileRow;
  learner: FamilyLearner | null;
  userId?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toLower(value: unknown) {
  return safe(value).toLowerCase();
}

function pickTopMissing(readiness: ComplianceReadiness) {
  return readiness.missing.filter(Boolean).slice(0, 3);
}

function secondaryCtaFor(readiness: ComplianceReadiness) {
  const missing = readiness.missing.map((item) => toLower(item));
  const nextAction = toLower(readiness.nextAction);

  if (
    missing.some((item) => item.includes("plan") || item.includes("program")) ||
    nextAction.includes("plan")
  ) {
    return {
      label: "Update learning plan",
      href: "/my-plan",
    };
  }

  if (
    missing.some(
      (item) =>
        item.includes("evidence") ||
        item.includes("sample") ||
        item.includes("record"),
    ) ||
    nextAction.includes("evidence")
  ) {
    return {
      label: "Review evidence",
      href: "/capture",
    };
  }

  if (
    missing.some((item) => item.includes("review")) ||
    nextAction.includes("review")
  ) {
    return {
      label: "Open report workspace",
      href: "/reports",
    };
  }

  return null;
}

function helperNoteFor(readiness: ComplianceReadiness) {
  const count = readiness.totalCount;
  if (!count) {
    return "Based on current planning, evidence, and reporting records.";
  }

  return `Based on ${readiness.completedCount} of ${readiness.totalCount} tracked compliance artifacts for this learner.`;
}

export async function loadFamilyComplianceCommandCard(
  input: LoadFamilyComplianceCommandCardInput,
): Promise<FamilyComplianceCommandCardModel | null> {
  if (!input.learner) return null;

  const [readiness, reportsModel] = await Promise.all([
    loadComplianceReadiness({ learnerId: input.learner.id }),
    loadReportsBuilderModel({
      profile: input.profile,
      learner: input.learner,
      userId: input.userId,
      mode: "read",
    }),
  ]);

  const primary = nextReportCta(reportsModel);
  const secondary = secondaryCtaFor(readiness);

  return {
    learnerId: input.learner.id,
    learnerName: readiness.learnerName || input.learner.label,
    jurisdictionName:
      reportsModel.effectiveJurisdiction?.label || readiness.jurisdictionName,
    jurisdictionCode:
      reportsModel.effectiveJurisdiction?.code || readiness.jurisdictionCode,
    complianceModeLabel: reportsModel.complianceModeLabel,
    complianceSummary: reportsModel.complianceSummary,
    readinessStatus: readiness.status,
    readinessScore: readiness.score,
    summary: readiness.summary,
    nextAction: readiness.nextAction,
    topMissing: pickTopMissing(readiness),
    primaryCta: primary
      ? {
          label: primary.label,
          href: primary.href,
        }
      : null,
    secondaryCta: secondary,
    draftState: {
      hasReportDraft: Boolean(reportsModel.reportDocument),
      reportStatus: reportsModel.reportDocument?.status || null,
      reportingPeriodLabel: reportsModel.reportingPeriod?.label || null,
      cycleLabel:
        reportsModel.registrationCycle?.label ||
        reportsModel.ruleSet?.cycleLabel ||
        null,
    },
    helperNote: helperNoteFor(readiness),
  };
}
