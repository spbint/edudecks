import {
  complianceModeSentence,
  resolveJurisdictionComplianceProfile,
  type ComplianceLevel,
  type ComplianceUiMode,
  type JurisdictionComplianceProfile,
} from "@/lib/jurisdictionCompliance";

export type ComplianceMode = "strict" | "guided" | "portfolio";

export type ReportRequirementMode =
  | "required"
  | "conditional"
  | "optional"
  | "not_required";

export type RequirementImpact = "blocker" | "warning" | "info" | "ignored";

export type JurisdictionBehaviour = {
  jurisdictionId: string | null;
  jurisdictionCode: string | null;
  jurisdictionName: string | null;
  countryCode: string | null;

  complianceLevel: ComplianceLevel;
  complianceMode: ComplianceMode;
  reportRequirementMode: ReportRequirementMode;

  strictGateEnabled: boolean;
  advisoryGateEnabled: boolean;
  portfolioModeEnabled: boolean;

  enforceReportCompletion: boolean;
  enforceNotificationCompletion: boolean;
  enforceAttendanceCompletion: boolean;
  enforceAssessmentCompletion: boolean;

  exportShouldBeBlockedWhenIncomplete: boolean;

  summaryText: string;
  reportsText: string;
  portfolioText: string;
};

export type JurisdictionBehaviourInput = {
  jurisdictionId?: string | null;
  jurisdictionCode?: string | null;
  jurisdictionName?: string | null;
  countryCode?: string | null;
  stateCode?: string | null;
  complianceLevel?: ComplianceLevel | string | null;
  complianceMode?: ComplianceMode | string | null;
  complianceUiMode?: ComplianceUiMode | string | null;
  reportRequirementMode?: ReportRequirementMode | string | null;
  reportRequired?: boolean | null;
  requiresNotification?: boolean | null;
  requiresNotificationAnnual?: boolean | null;
  requiresAttendanceTracking?: boolean | null;
  requiresInstructionHours?: boolean | null;
  requiredInstructionHoursPerYear?: number | null;
  requiredInstructionDaysPerYear?: number | null;
  requiresAnnualAssessment?: boolean | null;
  exportShouldBeBlockedWhenIncomplete?: boolean | null;
  allowsPortfolioInsteadOfTesting?: boolean | null;
  allowsEvaluationInsteadOfTesting?: boolean | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeComplianceMode(
  input: string | null | undefined,
  fallback: ComplianceLevel,
): ComplianceMode {
  const normalized = safe(input).toLowerCase();
  if (normalized === "strict" || normalized === "guided" || normalized === "portfolio") {
    return normalized;
  }
  if (normalized === "high") return "strict";
  if (normalized === "moderate") return "guided";
  if (normalized === "low") return "portfolio";
  if (fallback === "high") return "strict";
  if (fallback === "moderate") return "guided";
  return "portfolio";
}

function normalizeReportRequirementMode(
  input: string | null | undefined,
  behavior: ComplianceMode,
  reportRequired: boolean,
): ReportRequirementMode {
  const normalized = safe(input).toLowerCase();
  if (
    normalized === "required" ||
    normalized === "conditional" ||
    normalized === "optional" ||
    normalized === "not_required"
  ) {
    return normalized;
  }

  if (!reportRequired) {
    return behavior === "portfolio" ? "not_required" : "optional";
  }

  if (behavior === "strict") return "required";
  if (behavior === "guided") return "conditional";
  return "optional";
}

function profileFromInput(input: JurisdictionBehaviourInput): JurisdictionComplianceProfile {
  return resolveJurisdictionComplianceProfile({
    jurisdictionCode: input.jurisdictionCode,
    countryCode: input.countryCode,
    stateCode: input.stateCode,
    jurisdictionName: input.jurisdictionName,
    complianceLevel: input.complianceLevel,
    complianceMode: input.complianceMode ?? input.complianceUiMode,
    reportRequirementMode: input.reportRequirementMode,
    reportRequired: input.reportRequired,
    requiresNotification: input.requiresNotification,
    requiresNotificationAnnual: input.requiresNotificationAnnual,
    requiresAttendanceTracking: input.requiresAttendanceTracking,
    requiresInstructionHours: input.requiresInstructionHours,
    requiredInstructionHoursPerYear: input.requiredInstructionHoursPerYear,
    requiredInstructionDaysPerYear: input.requiredInstructionDaysPerYear,
    requiresAnnualAssessment: input.requiresAnnualAssessment,
    exportShouldBeBlockedWhenIncomplete: input.exportShouldBeBlockedWhenIncomplete,
    allowsPortfolioInsteadOfTesting: input.allowsPortfolioInsteadOfTesting,
    allowsEvaluationInsteadOfTesting: input.allowsEvaluationInsteadOfTesting,
  });
}

function modeLabel(mode: ComplianceMode) {
  if (mode === "strict") return "Strict compliance mode";
  if (mode === "guided") return "Guided compliance mode";
  return "Portfolio documentation mode";
}

function reportsTextFor(behavior: JurisdictionBehaviour) {
  if (behavior.portfolioModeEnabled || behavior.reportRequirementMode === "not_required") {
    return "Formal reporting is not required here, so the reporting workspace stays focused on steady documentation and a clean portfolio trail.";
  }
  if (behavior.strictGateEnabled) {
    return "Formal report completion is required here, and missing required items can block export.";
  }
  return "Formal reporting is conditional here, so the workspace keeps required items visible without forcing a fully strict filing posture.";
}

function portfolioTextFor(behavior: JurisdictionBehaviour) {
  if (behavior.portfolioModeEnabled || behavior.reportRequirementMode === "not_required") {
    return "Portfolio export is the main output in this jurisdiction. The system will stay supportive and avoid inventing formal-report blockers where the law does not require them.";
  }
  if (behavior.advisoryGateEnabled) {
    return "Portfolio records still matter here, but they sit alongside any formal reporting and attendance obligations.";
  }
  return "Portfolio records support the formal report cycle and are expected to stay complete.";
}

export function buildJurisdictionBehaviour(
  input: JurisdictionBehaviourInput,
): JurisdictionBehaviour {
  const profile = profileFromInput(input);
  const complianceMode = normalizeComplianceMode(
    input.complianceMode ?? input.complianceUiMode,
    profile.complianceLevel,
  );
  const reportRequired = input.reportRequired ?? profile.reportRequired;
  const reportRequirementMode = normalizeReportRequirementMode(
    input.reportRequirementMode,
    complianceMode,
    reportRequired,
  );
  const portfolioModeEnabled =
    complianceMode === "portfolio" || reportRequirementMode === "not_required";
  const strictGateEnabled = complianceMode === "strict";
  const advisoryGateEnabled = complianceMode !== "strict";
  const enforceReportCompletion = reportRequired !== false && reportRequirementMode !== "not_required";
  const enforceNotificationCompletion =
    Boolean(profile.requiresNotification) && enforceReportCompletion && !portfolioModeEnabled;
  const enforceAttendanceCompletion =
    Boolean(profile.requiresAttendanceTracking) && enforceReportCompletion && !portfolioModeEnabled;
  const enforceAssessmentCompletion =
    Boolean(profile.requiresAnnualAssessment) && enforceReportCompletion && !portfolioModeEnabled;
  const exportShouldBeBlockedWhenIncomplete =
    profile.exportShouldBeBlockedWhenIncomplete !== false &&
    enforceReportCompletion &&
    !portfolioModeEnabled;

  const summaryText =
    complianceModeSentence({
      complianceLevel: profile.complianceLevel,
      complianceUiMode: complianceMode,
      reportRequired,
      jurisdictionName: profile.jurisdictionName,
    }) +
    (portfolioModeEnabled
      ? " This jurisdiction is operating in portfolio-first documentation mode."
      : enforceReportCompletion
        ? " Formal report completion remains part of the workflow."
        : " The workflow is documentation-first rather than authority-first.");

  return {
    jurisdictionId: safe(input.jurisdictionId) || null,
    jurisdictionCode: safe(profile.jurisdictionCode) || null,
    jurisdictionName: safe(profile.jurisdictionName) || null,
    countryCode: safe(profile.countryCode) || null,
    complianceLevel: profile.complianceLevel,
    complianceMode,
    reportRequirementMode,
    strictGateEnabled,
    advisoryGateEnabled,
    portfolioModeEnabled,
    enforceReportCompletion,
    enforceNotificationCompletion,
    enforceAttendanceCompletion,
    enforceAssessmentCompletion,
    exportShouldBeBlockedWhenIncomplete,
    summaryText,
    reportsText: reportsTextFor({
      jurisdictionId: safe(input.jurisdictionId) || null,
      jurisdictionCode: safe(profile.jurisdictionCode) || null,
      jurisdictionName: safe(profile.jurisdictionName) || null,
      countryCode: safe(profile.countryCode) || null,
      complianceLevel: profile.complianceLevel,
      complianceMode,
      reportRequirementMode,
      strictGateEnabled,
      advisoryGateEnabled,
      portfolioModeEnabled,
      enforceReportCompletion,
      enforceNotificationCompletion,
      enforceAttendanceCompletion,
      enforceAssessmentCompletion,
      exportShouldBeBlockedWhenIncomplete,
      summaryText: "",
      reportsText: "",
      portfolioText: "",
    }),
    portfolioText: portfolioTextFor({
      jurisdictionId: safe(input.jurisdictionId) || null,
      jurisdictionCode: safe(profile.jurisdictionCode) || null,
      jurisdictionName: safe(profile.jurisdictionName) || null,
      countryCode: safe(profile.countryCode) || null,
      complianceLevel: profile.complianceLevel,
      complianceMode,
      reportRequirementMode,
      strictGateEnabled,
      advisoryGateEnabled,
      portfolioModeEnabled,
      enforceReportCompletion,
      enforceNotificationCompletion,
      enforceAttendanceCompletion,
      enforceAssessmentCompletion,
      exportShouldBeBlockedWhenIncomplete,
      summaryText: "",
      reportsText: "",
      portfolioText: "",
    }),
  };
}

export function requirementImpactForBehaviour(
  behaviour: JurisdictionBehaviour,
  input: {
    required: boolean;
    legal?: boolean;
    progress?: boolean;
  },
): RequirementImpact {
  if (!input.required) return "ignored";

  if (behaviour.portfolioModeEnabled) {
    return input.progress ? "info" : "info";
  }

  if (behaviour.strictGateEnabled) {
    return input.progress ? "warning" : "blocker";
  }

  if (input.legal === false) {
    return input.progress ? "info" : "info";
  }

  return input.progress ? "info" : "warning";
}

export function shouldBlockExport(behaviour: JurisdictionBehaviour, hasBlockingIssues: boolean) {
  if (!behaviour.exportShouldBeBlockedWhenIncomplete) {
    return false;
  }

  if (behaviour.portfolioModeEnabled) {
    return false;
  }

  return hasBlockingIssues;
}

export function jurisdictionBehaviourLabel(behaviour: JurisdictionBehaviour) {
  return modeLabel(behaviour.complianceMode);
}

export function jurisdictionBehaviourSentence(behaviour: JurisdictionBehaviour) {
  return behaviour.summaryText;
}
