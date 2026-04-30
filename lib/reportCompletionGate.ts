import type { ComplianceReadiness } from "@/lib/complianceReadiness";
import type { ReportAssemblySection, ReportAssemblyWorkspace } from "@/lib/reportAssembly";
import type {
  ArtifactMappingResult,
  ReportEvidenceMapping,
  SectionMappingResult,
} from "@/lib/reportEvidenceMapping";
import type {
  ReportSectionAutofillModel,
  ReportSectionStarterContent,
} from "@/lib/reportSectionAutofill";
import type { ReportsBuilderModel } from "@/lib/reporting";
import { resolveReportSectionTemplate } from "@/lib/reportTemplates";
import {
  buildJurisdictionBehaviour,
  requirementImpactForBehaviour,
  type JurisdictionBehaviour,
} from "@/lib/jurisdictionEngine";

export type ReportGateStatus = "blocked" | "in_progress" | "ready_for_export";

export type ReportValidationIssue = {
  type: "blocker" | "warning" | "info";
  code: string;
  label: string;
  detail: string;
  sectionKey?: string | null;
  artifactType?: string | null;
  actionType?: "family_card" | "report_section" | "report_workspace" | "plan_page" | "output_section" | "settings_page" | "reports_page" | null;
  actionTarget?: string | null;
  actionLabel?: string | null;
};

export type ReportSectionGateState = {
  sectionKey: string;
  title: string;
  status: "complete" | "in_progress" | "missing";
  hasPersistedContent: boolean;
  supportStatus: "strong" | "partial" | "weak" | "none";
  blocking: boolean;
  requiredForCompletion: boolean;
  notes: string[];
};

export type ReportArtifactGateState = {
  artifactType: string;
  label: string;
  status: "complete" | "in_progress" | "missing";
  blocking: boolean;
  notes: string[];
};

export type ReportCompletionValidation = {
  learnerId: string;
  reportDocumentId: string | null;
  reportingPeriodId: string | null;
  jurisdictionCode: string | null;
  jurisdictionBehaviour: JurisdictionBehaviour;
  complianceLevel: ReportsBuilderModel["complianceLevel"];
  complianceMode: ReportsBuilderModel["complianceMode"];
  complianceUiMode: ReportsBuilderModel["complianceUiMode"];
  complianceModeLabel: string;
  reportIntent: ReportsBuilderModel["reportIntent"];
  reportRequirementMode: ReportsBuilderModel["reportRequirementMode"];
  reportRequired: boolean;
  requiresNotification: boolean;
  requiresAttendanceTracking: boolean;
  status: ReportGateStatus;
  score: number;

  blockers: ReportValidationIssue[];
  warnings: ReportValidationIssue[];
  info: ReportValidationIssue[];

  sectionStates: ReportSectionGateState[];
  artifactStates: ReportArtifactGateState[];

  completedSectionCount: number;
  totalSectionCount: number;
  completedArtifactCount: number;
  totalArtifactCount: number;

  summary: string;
  nextAction: string | null;
};

type BuildReportCompletionValidationInput = {
  model: ReportsBuilderModel;
  readiness: ComplianceReadiness;
  assembly: ReportAssemblyWorkspace;
  mapping: ReportEvidenceMapping;
  autofill: ReportSectionAutofillModel;
};

type ValidationIssueInput = Omit<ReportValidationIssue, "type"> & {
  type: ReportValidationIssue["type"];
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toLower(value: unknown) {
  return safe(value).toLowerCase();
}

function normalizeSectionKey(title: string) {
  return safe(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function findMatchingSectionMapping(
  section: ReportAssemblySection,
  mappingSections: SectionMappingResult[],
) {
  const sectionKey = normalizeSectionKey(section.title);
  return (
    mappingSections.find((item) => item.sectionKey === sectionKey) ||
    mappingSections.find((item) => safe(item.title) === safe(section.title))
  );
}

function findMatchingAutofillSection(
  section: ReportAssemblySection,
  autofillSections: ReportSectionStarterContent[],
) {
  const sectionKey = normalizeSectionKey(section.title);
  return (
    autofillSections.find((item) => item.sectionKey === sectionKey) ||
    autofillSections.find((item) => safe(item.title) === safe(section.title))
  );
}

function issue(input: ValidationIssueInput): ReportValidationIssue {
  return {
    ...input,
    ...buildIssueAction(input),
  };
}

function buildIssueAction(input: {
  code: string;
  label: string;
  sectionKey?: string | null;
  artifactType?: string | null;
}): Pick<ReportValidationIssue, "actionLabel" | "actionTarget" | "actionType"> {
  const sectionKey = safe(input.sectionKey);
  const artifactType = toLower(input.artifactType);
  const label = safe(input.label);
  const lowerCode = toLower(input.code);

  if (sectionKey) {
    return {
      actionType: "report_section",
      actionTarget: `#report-section-${sectionKey}`,
      actionLabel: "Fix this",
    };
  }

  if (artifactType.includes("notification") || lowerCode.includes("notification")) {
    return {
      actionType: "family_card",
      actionTarget: "/family#notification-compliance",
      actionLabel: "Fix this",
    };
  }

  if (artifactType.includes("attendance") || lowerCode.includes("attendance")) {
    return {
      actionType: "family_card",
      actionTarget: "/family#attendance-compliance",
      actionLabel: "Fix this",
    };
  }

  if (artifactType.includes("plan") || artifactType.includes("subject") || lowerCode.includes("plan")) {
    return {
      actionType: "plan_page",
      actionTarget: "/my-calendar",
      actionLabel: "Fix this",
    };
  }

  if (lowerCode.includes("report_document") || lowerCode.includes("reporting_period")) {
    return {
      actionType: "reports_page",
      actionTarget: "/reports",
      actionLabel: "Fix this",
    };
  }

  if (lowerCode.includes("registration_cycle") || lowerCode.includes("rule_set") || lowerCode.includes("jurisdiction")) {
    return {
      actionType: "settings_page",
      actionTarget: "/family#family-learning-setup",
      actionLabel: "Fix this",
    };
  }

  if (lowerCode.includes("concern") || lowerCode.includes("condition")) {
    return {
      actionType: "output_section",
      actionTarget: "#report-completion-gate",
      actionLabel: "Review",
    };
  }

  return {
    actionType: null,
    actionTarget: null,
    actionLabel: label ? "Fix this" : null,
  };
}

function supportStatusForSection(input: {
  section: ReportAssemblySection;
  sectionMapping: SectionMappingResult | undefined;
  autofillSection: ReportSectionStarterContent | undefined;
}) {
  const hasPersistedContent = Boolean(input.section.hasContent && safe(input.section.contentPreview));
  const mappedStatus = input.sectionMapping?.status || "missing";
  const canAutofill = Boolean(input.autofillSection?.canAutofill);
  const supportsPresent =
    Boolean(input.sectionMapping?.supportingEvidenceCount || input.sectionMapping?.supportingPlanCount);

  if (hasPersistedContent && mappedStatus === "complete") return "strong" as const;
  if (hasPersistedContent && mappedStatus === "in_progress") return "partial" as const;
  if (hasPersistedContent && supportsPresent) return "partial" as const;
  if (!hasPersistedContent && (canAutofill || supportsPresent || mappedStatus === "in_progress")) {
    return "weak" as const;
  }
  if (hasPersistedContent) return "weak" as const;
  return "none" as const;
}

function sectionNotes(input: {
  section: ReportAssemblySection;
  sectionMapping: SectionMappingResult | undefined;
  autofillSection: ReportSectionStarterContent | undefined;
  supportStatus: ReportSectionGateState["supportStatus"];
}) {
  const notes: string[] = [];

  if (input.section.hasContent) {
    notes.push("Persisted draft content is present.");
  } else if (input.autofillSection?.canAutofill) {
    notes.push("Structured starter content is available but has not been promoted yet.");
  } else {
    notes.push("This section is still empty.");
  }

  if (input.sectionMapping) {
    notes.push(
      `${input.sectionMapping.supportingEvidenceCount} evidence item${input.sectionMapping.supportingEvidenceCount === 1 ? "" : "s"} and ${input.sectionMapping.supportingPlanCount} plan${input.sectionMapping.supportingPlanCount === 1 ? "" : "s"} currently support this section.`,
    );
  }

  if (input.sectionMapping?.notes.length) {
    notes.push(input.sectionMapping.notes[0]);
  }

  if (input.autofillSection?.notes.length) {
    notes.push(input.autofillSection.notes[0]);
  }

  if (input.supportStatus === "strong") {
    notes.push("This section is complete enough for the current gate.");
  } else if (input.supportStatus === "partial") {
    notes.push("This section has usable content but still needs refinement.");
  } else if (input.supportStatus === "weak") {
    notes.push("This section has some support, but not enough to clear the gate yet.");
  } else {
    notes.push("No dependable support has been identified for this section yet.");
  }

  return Array.from(new Set(notes)).slice(0, 4);
}

function artifactNotes(artifact: ArtifactMappingResult) {
  const notes: string[] = [];

  if (artifact.notes.length) {
    notes.push(artifact.notes[0]);
  }

  if (artifact.supportingCounts.plans > 0) {
    notes.push(`${artifact.supportingCounts.plans} plan record${artifact.supportingCounts.plans === 1 ? "" : "s"} linked.`);
  }
  if (artifact.supportingCounts.experiences > 0) {
    notes.push(`${artifact.supportingCounts.experiences} learning experience${artifact.supportingCounts.experiences === 1 ? "" : "s"} linked.`);
  }
  if (artifact.supportingCounts.evidence > 0) {
    notes.push(`${artifact.supportingCounts.evidence} evidence item${artifact.supportingCounts.evidence === 1 ? "" : "s"} linked.`);
  }
  if (artifact.supportingCounts.pairs > 0) {
    notes.push(`${artifact.supportingCounts.pairs} evidence pair${artifact.supportingCounts.pairs === 1 ? "" : "s"} linked.`);
  }
  if (artifact.supportingCounts.reviews > 0) {
    notes.push(`${artifact.supportingCounts.reviews} review record${artifact.supportingCounts.reviews === 1 ? "" : "s"} linked.`);
  }

  if (artifact.suggestedNextAction) {
    notes.push(`Next: ${artifact.suggestedNextAction}`);
  }

  return Array.from(new Set(notes)).slice(0, 4);
}

function sectionIssueLabel(section: ReportAssemblySection) {
  return section.title;
}

function artifactIssueLabel(artifact: ArtifactMappingResult) {
  return artifact.label;
}

function nextActionFromIssue(issueItem: ReportValidationIssue) {
  if (issueItem.sectionKey) {
    if (issueItem.code === "missing_section_content") {
      return `Complete ${issueItem.label}`;
    }
    if (issueItem.code === "weak_section_support") {
      return `Strengthen ${issueItem.label}`;
    }
  }

  if (issueItem.artifactType) {
    if (issueItem.code === "missing_required_artifact") {
      return `Complete ${issueItem.label}`;
    }
    if (issueItem.code === "artifact_in_progress") {
      return `Tighten ${issueItem.label}`;
    }
  }

  if (issueItem.code === "active_concern") {
    return "Review active concerns";
  }

  if (issueItem.code === "active_registration_condition") {
    return "Review active registration conditions";
  }

  if (issueItem.code === "missing_report_document") {
    return "Open the reports workspace to create the draft";
  }

  if (issueItem.code === "missing_reporting_period") {
    return "Confirm the current reporting period";
  }

  if (issueItem.code === "missing_registration_cycle") {
    return "Confirm the current registration cycle";
  }

  if (issueItem.code === "missing_rule_set") {
    return "Resolve the jurisdiction rule set first";
  }

  return issueItem.detail;
}

function buildSummary(
  status: ReportGateStatus,
  validation: Pick<
    ReportCompletionValidation,
    | "completedSectionCount"
    | "totalSectionCount"
    | "completedArtifactCount"
    | "totalArtifactCount"
    | "blockers"
    | "warnings"
    | "jurisdictionBehaviour"
    | "reportIntent"
    | "reportRequirementMode"
  >,
) {
  const sectionText = `${validation.completedSectionCount}/${validation.totalSectionCount || 0} section${validation.totalSectionCount === 1 ? "" : "s"}`;
  const artifactText = `${validation.completedArtifactCount}/${validation.totalArtifactCount || 0} artifact${validation.totalArtifactCount === 1 ? "" : "s"}`;
  const documentationMode =
    validation.reportIntent === "portfolio" ||
    validation.reportRequirementMode === "not_required" ||
    validation.jurisdictionBehaviour.portfolioModeEnabled;

  if (status === "ready_for_export") {
    return documentationMode
      ? `This documentation export is ready. ${sectionText} and ${artifactText} are complete enough to move to the next step.`
      : `This report is ready for export. ${sectionText} and ${artifactText} are complete enough to move to the next step.`;
  }

  if (status === "blocked") {
    const blockerCount = validation.blockers.length;
    return documentationMode
      ? `This documentation export needs attention. ${blockerCount} issue${blockerCount === 1 ? "" : "s"} still need attention before it can move forward.`
      : `This report is blocked. ${blockerCount} blocking issue${blockerCount === 1 ? "" : "s"} still need attention before it can move forward.`;
  }

  const warningCount = validation.warnings.length;
  return documentationMode
    ? `This documentation export is in progress. ${sectionText} and ${artifactText} are moving forward, and ${warningCount} note${warningCount === 1 ? "" : "s"} remain to review.`
    : `This report is in progress. ${sectionText} and ${artifactText} are moving forward, but ${warningCount} warning${warningCount === 1 ? "" : "s"} still need attention.`;
}

function computeScore(input: {
  completedSectionCount: number;
  totalSectionCount: number;
  completedArtifactCount: number;
  totalArtifactCount: number;
  blockers: ReportValidationIssue[];
  warnings: ReportValidationIssue[];
}) {
  const sectionProgress = input.totalSectionCount > 0 ? input.completedSectionCount / input.totalSectionCount : 0;
  const artifactProgress = input.totalArtifactCount > 0 ? input.completedArtifactCount / input.totalArtifactCount : 0;
  const base = Math.round(((sectionProgress + artifactProgress) / 2) * 100);
  const penalty = input.blockers.length * 12 + input.warnings.length * 4;
  return clamp(base - penalty, 0, 100);
}

function readinessIssues(readiness: ComplianceReadiness) {
  return readiness.warnings.filter((item) => /concern|condition/i.test(item));
}

function isFormalContentIssue(issue: ReportValidationIssue) {
  return Boolean(
    issue.sectionKey ||
      issue.artifactType ||
      issue.code === "no_required_artifacts",
  );
}

export function buildReportCompletionValidation(
  input: BuildReportCompletionValidationInput,
): ReportCompletionValidation {
  const learnerId = safe(input.model.learner?.id);
  const reportDocumentId =
    safe(input.model.reportDocument?.id) ||
    safe(input.mapping.reportDocumentId) ||
    null;
  const reportingPeriodId =
    safe(input.model.reportingPeriod?.id) ||
    safe(input.mapping.reportingPeriodId) ||
    null;
  const jurisdictionCode =
    input.model.effectiveJurisdiction?.code ||
    input.mapping.jurisdictionCode ||
    input.readiness.jurisdictionCode ||
    null;
  const jurisdictionBehaviour =
    input.model.jurisdictionBehaviour ||
    buildJurisdictionBehaviour({
      jurisdictionId: input.model.effectiveJurisdiction?.code || null,
      jurisdictionCode: input.model.effectiveJurisdiction?.code || jurisdictionCode,
      jurisdictionName: input.model.effectiveJurisdiction?.label || null,
      countryCode: input.model.effectiveJurisdiction?.countryCode || null,
      complianceLevel: input.model.complianceLevel,
      complianceMode: input.model.complianceMode,
      complianceUiMode: input.model.complianceUiMode,
      reportRequirementMode: input.model.reportRequirementMode,
      reportRequired: input.model.reportRequired,
      requiresNotification: input.model.requiresNotification,
      requiresAttendanceTracking: input.model.requiresAttendanceTracking,
      requiresInstructionHours: input.model.effectiveJurisdiction?.requiresInstructionHours,
      requiredInstructionHoursPerYear: input.model.requiredInstructionHoursPerYear,
      requiredInstructionDaysPerYear: input.model.requiredInstructionDaysPerYear,
      requiresAnnualAssessment: input.model.effectiveJurisdiction?.requiresAnnualAssessment,
      exportShouldBeBlockedWhenIncomplete:
        input.model.effectiveJurisdiction?.exportShouldBeBlockedWhenIncomplete,
      allowsPortfolioInsteadOfTesting:
        input.model.effectiveJurisdiction?.allowsPortfolioInsteadOfTesting,
      allowsEvaluationInsteadOfTesting:
        input.model.effectiveJurisdiction?.allowsEvaluationInsteadOfTesting,
    });
  const reportIntent = input.model.reportIntent;

  const sectionStates = input.assembly.sections.map((section) => {
    const sectionMapping = findMatchingSectionMapping(section, input.mapping.sections);
    const autofillSection = findMatchingAutofillSection(section, input.autofill.sections);
    const template = resolveReportSectionTemplate(section.title, {
      intent: input.model.reportIntent,
      jurisdictionCode,
      countryCode: input.model.effectiveJurisdiction?.countryCode || null,
      complianceUiMode: input.model.complianceUiMode,
      reportRequired: input.model.reportRequired,
    });
    const supportStatus = supportStatusForSection({
      section,
      sectionMapping,
      autofillSection,
    });
    const hasPersistedContent = Boolean(section.hasContent && safe(section.contentPreview));
    const status =
      hasPersistedContent && supportStatus === "strong"
        ? "complete"
      : hasPersistedContent && (supportStatus === "partial" || supportStatus === "weak")
          ? "in_progress"
          : "missing";
    const requiredForCompletion = template?.requiredForCompletion ?? true;
    const blocking =
      requiredForCompletion && (!hasPersistedContent || supportStatus === "weak" || supportStatus === "none");

    return {
      sectionKey: normalizeSectionKey(section.title),
      title: section.title,
      status,
      hasPersistedContent,
      supportStatus,
      blocking,
      requiredForCompletion,
      notes: sectionNotes({
        section,
        sectionMapping,
        autofillSection,
        supportStatus,
      }),
    } satisfies ReportSectionGateState;
  });

  const artifactStates = input.mapping.artifacts.map((artifact) => {
    const notes = artifactNotes(artifact);
    return {
      artifactType: artifact.artifactType,
      label: artifact.label,
      status: artifact.status,
      blocking: artifact.status === "missing",
      notes,
    } satisfies ReportArtifactGateState;
  });

  const blockers: ReportValidationIssue[] = [];
  const warnings: ReportValidationIssue[] = [];
  const info: ReportValidationIssue[] = [];

  const reportDocumentImpact = requirementImpactForBehaviour(jurisdictionBehaviour, {
    required: true,
    legal: jurisdictionBehaviour.enforceReportCompletion,
  });
  const reportingPeriodImpact = requirementImpactForBehaviour(jurisdictionBehaviour, {
    required: true,
    legal: jurisdictionBehaviour.enforceReportCompletion,
  });
  const registrationCycleImpact = requirementImpactForBehaviour(jurisdictionBehaviour, {
    required: true,
    legal: jurisdictionBehaviour.enforceReportCompletion,
  });
  const ruleSetImpact = requirementImpactForBehaviour(jurisdictionBehaviour, {
    required: true,
    legal: jurisdictionBehaviour.enforceReportCompletion,
  });

  if (!input.model.reportDocument) {
    if (reportDocumentImpact === "blocker") {
      blockers.push(
        issue({
          type: "blocker",
          code: "missing_report_document",
          label: "Report document missing",
        detail: "A current report document is required before the completion gate can pass.",
      }),
      );
    } else if (reportDocumentImpact === "warning") {
    warnings.push(
      issue({
        type: "warning",
        code: "missing_report_document",
        label: "Report document missing",
        detail: "This jurisdiction can still export documentation without a formal report draft.",
      }),
      );
    } else {
      info.push(
        issue({
          type: "info",
          code: "missing_report_document",
          label: "Report document missing",
          detail: "A formal report draft is not required for this jurisdiction's current workflow.",
        }),
      );
    }
  }

  if (!input.model.reportingPeriod) {
    if (reportingPeriodImpact === "blocker") {
      blockers.push(
        issue({
          type: "blocker",
          code: "missing_reporting_period",
          label: "Reporting period missing",
        detail: "The current reporting period is not resolved yet.",
      }),
      );
    } else if (reportingPeriodImpact === "warning") {
    warnings.push(
      issue({
        type: "warning",
        code: "missing_reporting_period",
        label: "Reporting period missing",
        detail: "A formal reporting period has not been resolved yet, but documentation export can still continue.",
      }),
      );
    } else {
      info.push(
        issue({
          type: "info",
          code: "missing_reporting_period",
          label: "Reporting period missing",
          detail: "A formal reporting period is not required here, so the workspace can continue in documentation mode.",
        }),
      );
    }
  }

  if (!input.model.registrationCycle) {
    if (registrationCycleImpact === "blocker") {
      blockers.push(
        issue({
          type: "blocker",
          code: "missing_registration_cycle",
          label: "Registration cycle missing",
        detail: "The active registration cycle is not resolved yet.",
      }),
      );
    } else if (registrationCycleImpact === "warning") {
    warnings.push(
      issue({
        type: "warning",
        code: "missing_registration_cycle",
        label: "Registration cycle missing",
        detail: "A registration cycle has not been resolved yet, but this documentation export can still move forward.",
      }),
      );
    } else {
      info.push(
        issue({
          type: "info",
          code: "missing_registration_cycle",
          label: "Registration cycle missing",
          detail: "A registration cycle has not been resolved yet, but this documentation workflow can still move forward.",
        }),
      );
    }
  }

  if (!input.model.ruleSet) {
    if (ruleSetImpact === "blocker") {
      blockers.push(
        issue({
          type: "blocker",
          code: "missing_rule_set",
          label: "Jurisdiction rule set missing",
        detail: "The current jurisdiction rule set is required before this report can be validated.",
      }),
      );
    } else if (ruleSetImpact === "warning") {
    warnings.push(
      issue({
        type: "warning",
        code: "missing_rule_set",
        label: "Jurisdiction rule set missing",
        detail: "A jurisdiction rule set was not resolved, so the gate is using the lighter documentation posture.",
      }),
      );
    } else {
      info.push(
        issue({
          type: "info",
          code: "missing_rule_set",
          label: "Jurisdiction rule set missing",
          detail: "A current rule set was not resolved, so the workspace is using the lighter documentation posture.",
        }),
      );
    }
  }

  if (!jurisdictionCode) {
    blockers.push(
      issue({
        type: "blocker",
        code: "missing_jurisdiction",
        label: "Jurisdiction missing",
        detail: "The learner's effective jurisdiction is not resolved yet.",
      }),
    );
  }

  sectionStates.forEach((section) => {
    if (section.status === "complete") {
      info.push(
        issue({
          type: "info",
          code: "section_complete",
          label: section.title,
          detail: "This section is complete enough for the current validation gate.",
          sectionKey: section.sectionKey,
        }),
      );
      return;
    }

    if (!section.requiredForCompletion) {
      info.push(
        issue({
          type: "info",
          code: "optional_section_support",
          label: section.title,
          detail: section.notes[0] || "This section is optional in the current mode and can be used as supportive context.",
          sectionKey: section.sectionKey,
        }),
      );
      return;
    }

    const sectionImpact = requirementImpactForBehaviour(jurisdictionBehaviour, {
      required: true,
      legal: jurisdictionBehaviour.enforceReportCompletion,
      progress: section.status === "in_progress",
    });

    if (section.status === "missing" && sectionImpact === "blocker") {
      blockers.push(
        issue({
          type: "blocker",
          code: "missing_section_content",
          label: section.title,
          detail: section.notes[0] || "This section still needs persisted draft content.",
          sectionKey: section.sectionKey,
        }),
      );
      return;
    }

    if (section.status === "missing" && sectionImpact === "warning") {
      warnings.push(
        issue({
          type: "warning",
          code: "missing_section_content",
          label: section.title,
          detail: section.notes[0] || "This section still needs persisted draft content.",
          sectionKey: section.sectionKey,
        }),
      );
      return;
    }

    if (section.status === "missing") {
      info.push(
        issue({
          type: "info",
          code: "missing_section_content",
          label: section.title,
          detail: section.notes[0] || "This section still needs persisted draft content.",
          sectionKey: section.sectionKey,
        }),
      );
      return;
    }

    if (sectionImpact === "warning") {
      warnings.push(
        issue({
          type: "warning",
          code: "section_in_progress",
          label: section.title,
          detail: section.notes[0] || "This section is moving forward but still needs refinement.",
          sectionKey: section.sectionKey,
        }),
      );
      return;
    }

    info.push(
      issue({
        type: "info",
        code: "section_in_progress",
        label: section.title,
        detail: section.notes[0] || "This section is moving forward but still needs refinement.",
        sectionKey: section.sectionKey,
      }),
    );
  });

  artifactStates.forEach((artifact) => {
    if (artifact.status === "complete") {
      info.push(
        issue({
          type: "info",
          code: "artifact_complete",
          label: artifact.label,
          detail: "This required artifact is satisfied for the current gate.",
          artifactType: artifact.artifactType,
        }),
      );
      return;
    }

    const artifactImpact = requirementImpactForBehaviour(jurisdictionBehaviour, {
      required: true,
      legal: jurisdictionBehaviour.enforceReportCompletion,
      progress: artifact.status === "in_progress",
    });

    if (artifact.status === "missing" && artifactImpact === "blocker") {
      blockers.push(
        issue({
          type: "blocker",
          code: "missing_required_artifact",
          label: artifact.label,
          detail: artifact.notes[0] || "This required artifact is still missing.",
          artifactType: artifact.artifactType,
        }),
      );
      return;
    }

    if (artifact.status === "missing" && artifactImpact === "warning") {
      warnings.push(
        issue({
          type: "warning",
          code: "missing_required_artifact",
          label: artifact.label,
          detail: artifact.notes[0] || "This required artifact is still missing.",
          artifactType: artifact.artifactType,
        }),
      );
      return;
    }

    if (artifact.status === "missing") {
      info.push(
        issue({
          type: "info",
          code: "missing_required_artifact",
          label: artifact.label,
          detail: artifact.notes[0] || "This required artifact is still missing.",
          artifactType: artifact.artifactType,
        }),
      );
      return;
    }

    if (artifactImpact === "warning") {
      warnings.push(
        issue({
          type: "warning",
          code: "artifact_in_progress",
          label: artifact.label,
          detail: artifact.notes[0] || "This required artifact is still in progress.",
          artifactType: artifact.artifactType,
        }),
      );
      return;
    }

    info.push(
      issue({
        type: "info",
        code: "artifact_in_progress",
        label: artifact.label,
        detail: artifact.notes[0] || "This required artifact is still in progress.",
        artifactType: artifact.artifactType,
      }),
    );
  });

  if (input.model.reportDocument?.status) {
    info.push(
      issue({
        type: "info",
        code: "report_document_status",
        label: "Report document status",
        detail: `Current report document status: ${input.model.reportDocument.status}.`,
      }),
    );
  }

  if (input.readiness.summary) {
    info.push(
      issue({
        type: "info",
        code: "readiness_summary",
        label: "Readiness summary",
        detail: input.readiness.summary,
      }),
    );
  }

  const readinessGateIssues = readinessIssues(input.readiness);
  readinessGateIssues.forEach((entry) => {
    const lower = toLower(entry);
    if (lower.includes("concern")) {
      blockers.push(
        issue({
          type: "blocker",
          code: "active_concern",
          label: "Active concern",
          detail: entry,
        }),
      );
      return;
    }

    if (lower.includes("condition")) {
      blockers.push(
        issue({
          type: "blocker",
          code: "active_registration_condition",
          label: "Active registration condition",
          detail: entry,
        }),
      );
      return;
    }
  });

  if (!input.mapping.artifacts.length) {
    const artifactListImpact = requirementImpactForBehaviour(jurisdictionBehaviour, {
      required: true,
      legal: jurisdictionBehaviour.enforceReportCompletion,
    });
    const issueTone: ReportValidationIssue["type"] =
      artifactListImpact === "blocker"
        ? "blocker"
        : artifactListImpact === "warning"
          ? "warning"
          : "info";
    const artifactListIssue = issue({
      type: issueTone,
      code: "no_required_artifacts",
      label: "No required artifacts",
      detail: "The jurisdiction artifact list was not available, so the gate is using section-level evidence only.",
    });

    if (issueTone === "blocker") {
      blockers.push(artifactListIssue);
    } else if (issueTone === "warning") {
      warnings.push(artifactListIssue);
    } else {
      info.push(artifactListIssue);
    }
  }

  if (reportIntent === "portfolio") {
    const downgradedBlockers: ReportValidationIssue[] = [];
    blockers.forEach((issueItem) => {
      if (isFormalContentIssue(issueItem)) {
        warnings.push({
          ...issueItem,
          type: "warning",
          detail:
            issueItem.detail ||
            "This item is still helpful, but it is treated as a recommendation in portfolio mode.",
        });
      } else {
        downgradedBlockers.push(issueItem);
      }
    });
    blockers.length = 0;
    blockers.push(...downgradedBlockers);

    warnings.forEach((issueItem, index) => {
      if (isFormalContentIssue(issueItem) && issueItem.type === "blocker") {
        warnings[index] = {
          ...issueItem,
          type: "warning",
        };
      }
    });
  }

  const completedSectionCount = sectionStates.filter((section) => section.status === "complete").length;
  const totalSectionCount = sectionStates.length;
  const completedArtifactCount = artifactStates.filter((artifact) => artifact.status === "complete").length;
  const totalArtifactCount = artifactStates.length;

  const status: ReportGateStatus =
    blockers.length > 0
      ? "blocked"
      : warnings.length > 0 && reportIntent !== "portfolio" && !jurisdictionBehaviour.portfolioModeEnabled
        ? "in_progress"
        : "ready_for_export";

  const score = computeScore({
    completedSectionCount,
    totalSectionCount,
    completedArtifactCount,
    totalArtifactCount,
    blockers,
    warnings,
  });

  const nextIssue = blockers[0] || warnings[0] || null;
  const nextAction =
    nextIssue ? nextActionFromIssue(nextIssue) : input.mapping.nextAction || input.readiness.nextAction || null;

  return {
    learnerId,
    reportDocumentId,
    reportingPeriodId,
    jurisdictionCode,
    jurisdictionBehaviour,
    complianceLevel: input.model.complianceLevel,
    complianceMode: input.model.complianceMode,
    complianceUiMode: input.model.complianceUiMode,
    complianceModeLabel: input.model.complianceModeLabel,
    reportIntent,
    reportRequirementMode: input.model.reportRequirementMode,
    reportRequired: input.model.reportRequired,
    requiresNotification: input.model.requiresNotification,
    requiresAttendanceTracking: input.model.requiresAttendanceTracking,
    status,
    score,
    blockers,
    warnings,
    info,
    sectionStates,
    artifactStates,
    completedSectionCount,
    totalSectionCount,
    completedArtifactCount,
    totalArtifactCount,
    summary: buildSummary(status, {
      completedSectionCount,
      totalSectionCount,
      completedArtifactCount,
      totalArtifactCount,
      blockers,
      warnings,
      jurisdictionBehaviour,
      reportIntent,
      reportRequirementMode: input.model.reportRequirementMode,
    }),
    nextAction,
  };
}
