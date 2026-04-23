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

export type ReportGateStatus = "blocked" | "in_progress" | "ready_for_export";

export type ReportValidationIssue = {
  type: "blocker" | "warning" | "info";
  code: string;
  label: string;
  detail: string;
  sectionKey?: string | null;
  artifactType?: string | null;
};

export type ReportSectionGateState = {
  sectionKey: string;
  title: string;
  status: "complete" | "in_progress" | "missing";
  hasPersistedContent: boolean;
  supportStatus: "strong" | "partial" | "weak" | "none";
  blocking: boolean;
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
  return input;
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

function buildSummary(status: ReportGateStatus, validation: Pick<ReportCompletionValidation, "completedSectionCount" | "totalSectionCount" | "completedArtifactCount" | "totalArtifactCount" | "blockers" | "warnings">) {
  const sectionText = `${validation.completedSectionCount}/${validation.totalSectionCount || 0} section${validation.totalSectionCount === 1 ? "" : "s"}`;
  const artifactText = `${validation.completedArtifactCount}/${validation.totalArtifactCount || 0} artifact${validation.totalArtifactCount === 1 ? "" : "s"}`;

  if (status === "ready_for_export") {
    return `This report is ready for export. ${sectionText} and ${artifactText} are complete enough to move to the next step.`;
  }

  if (status === "blocked") {
    const blockerCount = validation.blockers.length;
    return `This report is blocked. ${blockerCount} blocking issue${blockerCount === 1 ? "" : "s"} still need attention before it can move forward.`;
  }

  const warningCount = validation.warnings.length;
  return `This report is in progress. ${sectionText} and ${artifactText} are moving forward, but ${warningCount} warning${warningCount === 1 ? "" : "s"} still need attention.`;
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

  const sectionStates = input.assembly.sections.map((section) => {
    const sectionMapping = findMatchingSectionMapping(section, input.mapping.sections);
    const autofillSection = findMatchingAutofillSection(section, input.autofill.sections);
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
    const blocking = !hasPersistedContent || supportStatus === "weak" || supportStatus === "none";

    return {
      sectionKey: normalizeSectionKey(section.title),
      title: section.title,
      status,
      hasPersistedContent,
      supportStatus,
      blocking,
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

  if (!input.model.reportDocument) {
    blockers.push(
      issue({
        type: "blocker",
        code: "missing_report_document",
        label: "Report document missing",
        detail: "A current report document is required before the completion gate can pass.",
      }),
    );
  }

  if (!input.model.reportingPeriod) {
    blockers.push(
      issue({
        type: "blocker",
        code: "missing_reporting_period",
        label: "Reporting period missing",
        detail: "The current reporting period is not resolved yet.",
      }),
    );
  }

  if (!input.model.registrationCycle) {
    blockers.push(
      issue({
        type: "blocker",
        code: "missing_registration_cycle",
        label: "Registration cycle missing",
        detail: "The active registration cycle is not resolved yet.",
      }),
    );
  }

  if (!input.model.ruleSet) {
    blockers.push(
      issue({
        type: "blocker",
        code: "missing_rule_set",
        label: "Jurisdiction rule set missing",
        detail: "The current jurisdiction rule set is required before this report can be validated.",
      }),
    );
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

    if (section.status === "missing") {
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

    warnings.push(
      issue({
        type: "warning",
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

    if (artifact.status === "missing") {
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

    warnings.push(
      issue({
        type: "warning",
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
    warnings.push(
      issue({
        type: "warning",
        code: "no_required_artifacts",
        label: "No required artifacts",
        detail: "The jurisdiction artifact list was not available, so the gate is using section-level evidence only.",
      }),
    );
  }

  const completedSectionCount = sectionStates.filter((section) => section.status === "complete").length;
  const totalSectionCount = sectionStates.length;
  const completedArtifactCount = artifactStates.filter((artifact) => artifact.status === "complete").length;
  const totalArtifactCount = artifactStates.length;

  const status: ReportGateStatus =
    blockers.length > 0
      ? "blocked"
      : warnings.length > 0
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
    }),
    nextAction,
  };
}
