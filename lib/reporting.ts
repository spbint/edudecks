import type { FamilyProfileRow } from "@/lib/familySettings";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";
import type { FamilyLearner } from "@/lib/familyWorkspace";
import {
  getRequiredArtifactSeeds,
  jurisdictionDisplayLabel,
  resolveJurisdictionComplianceProfile,
  type ComplianceLevel,
  type ComplianceMode,
  type ComplianceUiMode,
  type JurisdictionComplianceProfile,
  type RequiredArtifactSeed,
  type ReportRequirementMode,
} from "@/lib/jurisdictionCompliance";
import {
  buildJurisdictionBehaviour,
  jurisdictionBehaviourLabel,
  jurisdictionBehaviourSentence,
  type JurisdictionBehaviour,
} from "@/lib/jurisdictionEngine";
import { supabase } from "@/lib/supabaseClient";

type QueryClient = Pick<typeof supabase, "from">;

type ReadMode = "read" | "ensure";

export type EffectiveJurisdiction = {
  code: string;
  countryCode: string;
  stateCode: string;
  label: string;
  reportingMode: string;
  localeCode: string;
  spellingStyle: string;
  terminologyMode: string;
  complianceLevel: ComplianceLevel;
  complianceMode: ComplianceMode;
  complianceUiMode: ComplianceUiMode;
  reportRequirementMode: ReportRequirementMode;
  regulatoryFamily: string;
  reportRequired: boolean;
  requiresNotification: boolean;
  requiresNotificationAnnual: boolean;
  requiresAttendanceTracking: boolean;
  requiresInstructionHours: boolean;
  requiredInstructionHoursPerYear: number | null;
  requiredInstructionDaysPerYear: number | null;
  requiresSubjectList: boolean;
  requiresYearlyPlan: boolean;
  requiresQuarterlyReports: boolean;
  requiresAnnualAssessment: boolean;
  requiresStandardizedTesting: boolean;
  requiresProfessionalEvaluation: boolean;
  requiresPortfolio: boolean;
  requiresWorkSamples: boolean;
  requiresParentQualificationCheck: boolean;
  requiresImmunizationRecordOrExemption: boolean;
  requiresSubmissionToAuthority: boolean;
  exportShouldBeBlockedWhenIncomplete: boolean;
  allowsPortfolioInsteadOfTesting: boolean;
  allowsEvaluationInsteadOfTesting: boolean;
};

export type ReportingRuleSet = {
  id: string;
  title: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  status: string;
  cycleLabel: string;
  localeCode: string;
  spellingStyle: string;
  terminologyMode: string;
  complianceLevel: ComplianceLevel;
  complianceMode: ComplianceMode;
  complianceUiMode: ComplianceUiMode;
  reportRequirementMode: ReportRequirementMode;
  regulatoryFamily: string;
  reportRequired: boolean;
  requiresNotification: boolean;
  requiresNotificationAnnual: boolean;
  requiresAttendanceTracking: boolean;
  requiresInstructionHours: boolean;
  requiredInstructionHoursPerYear: number | null;
  requiredInstructionDaysPerYear: number | null;
  requiresSubjectList: boolean;
  requiresYearlyPlan: boolean;
  requiresQuarterlyReports: boolean;
  requiresAnnualAssessment: boolean;
  requiresStandardizedTesting: boolean;
  requiresProfessionalEvaluation: boolean;
  requiresPortfolio: boolean;
  requiresWorkSamples: boolean;
  requiresParentQualificationCheck: boolean;
  requiresImmunizationRecordOrExemption: boolean;
  requiresSubmissionToAuthority: boolean;
  exportShouldBeBlockedWhenIncomplete: boolean;
  allowsPortfolioInsteadOfTesting: boolean;
  allowsEvaluationInsteadOfTesting: boolean;
};

export type RegistrationCycleRecord = {
  id: string;
  label: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

export type ReportingPeriodRecord = {
  id: string;
  label: string;
  status: string;
  periodType: string;
  startDate: string | null;
  endDate: string | null;
  registrationCycleId: string | null;
};

export type ReportSectionRecord = {
  id: string;
  title: string;
  content: string;
  status: string;
};

export type ReportPackItemRecord = {
  id: string;
  label: string;
  note: string;
};

export type ReportDocumentRecord = {
  id: string;
  title: string;
  status: string;
  documentType: string;
  localeCode: string;
  spellingStyle: string;
  terminologyMode: string;
  toneProfile: string;
  reportingPeriodId: string | null;
  studentId: string | null;
  userId: string | null;
  sections: ReportSectionRecord[];
  linkedPackItems: ReportPackItemRecord[];
  updatedAt: string | null;
};

export type ArtifactStatus = "Ready" | "In progress" | "Not started";

export type RequiredArtifactRecord = {
  id: string;
  code: string;
  label: string;
  frequency: string;
  note: string;
  category:
    | "plan"
    | "evidence"
    | "report"
    | "notification"
    | "attendance"
    | "assessment"
    | "portfolio"
    | "other";
  status: ArtifactStatus;
};

export type ReportReadinessSummary = {
  status: ArtifactStatus;
  sentence: string;
  completeCount: number;
  totalCount: number;
};

export type ReportsBuilderModel = {
  learner: FamilyLearner | null;
  effectiveJurisdiction: EffectiveJurisdiction | null;
  ruleSet: ReportingRuleSet | null;
  registrationCycle: RegistrationCycleRecord | null;
  reportingPeriod: ReportingPeriodRecord | null;
  reportDocument: ReportDocumentRecord | null;
  requiredArtifacts: RequiredArtifactRecord[];
  readiness: ReportReadinessSummary;
  planCount: number;
  evidenceCount: number;
  softWarning: string;
  jurisdictionBehaviour: JurisdictionBehaviour;
  complianceLevel: ComplianceLevel;
  complianceMode: ComplianceMode;
  complianceUiMode: ComplianceUiMode;
  complianceModeLabel: string;
  complianceSummary: string;
  reportRequirementMode: ReportRequirementMode;
  reportRequired: boolean;
  requiresNotification: boolean;
  requiresAttendanceTracking: boolean;
  requiredInstructionHoursPerYear: number | null;
  requiredInstructionDaysPerYear: number | null;
};

type LoadReportsBuilderOptions = {
  profile: FamilyProfileRow;
  learner: FamilyLearner | null;
  userId?: string | null;
  mode?: ReadMode;
  preferredDocumentId?: string | null;
  preferredReportingPeriodId?: string | null;
  client?: QueryClient;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function toLower(value: unknown) {
  return safe(value).toLowerCase();
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safe(item)).filter(Boolean);
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asDate(value: unknown) {
  const clean = safe(value);
  if (!clean) return null;
  const parsed = new Date(clean);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ymd(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function withSentenceCase(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  const start = asDate(startDate);
  const end = asDate(endDate);
  if (!start && !end) return "Dates not set";
  if (start && end) {
    return `${start.toLocaleDateString(undefined, { dateStyle: "medium" })} to ${end.toLocaleDateString(undefined, { dateStyle: "medium" })}`;
  }
  return start
    ? `From ${start.toLocaleDateString(undefined, { dateStyle: "medium" })}`
    : `Until ${end?.toLocaleDateString(undefined, { dateStyle: "medium" })}`;
}

function jurisdictionCodeFrom(countryCode: string, stateCode: string) {
  const country = safe(countryCode).toUpperCase() || "AU";
  const state = safe(stateCode).toUpperCase() || "TAS";
  return `${country}-${state}`;
}

function jurisdictionLabelFromCode(code: string) {
  return jurisdictionDisplayLabel(code) || safe(code).toUpperCase() || "Your jurisdiction";
}

function terminologyLabelFor(code: string) {
  const normalized = safe(code).toUpperCase();
  if (normalized === "AU-QLD") return "Educational progress";
  if (normalized === "AU-NSW") return "Educational program";
  if (normalized === "AU-VIC") return "Learning plan";
  if (normalized === "AU-SA") return "Exemption review";
  return "Reporting workspace";
}

function complianceProfileFromRaw(
  raw: Record<string, unknown>,
  fallback: {
    code: string;
    countryCode: string;
    stateCode: string;
    label: string;
    reportRequired?: boolean;
    complianceLevel?: ComplianceLevel;
    complianceMode?: ComplianceMode;
    complianceUiMode?: ComplianceUiMode;
    reportRequirementMode?: ReportRequirementMode;
  },
): JurisdictionComplianceProfile {
  return resolveJurisdictionComplianceProfile({
    jurisdictionCode: safe(raw.code) || fallback.code,
    countryCode: safe(raw.country_code) || fallback.countryCode,
    stateCode: safe(raw.state_code) || fallback.stateCode,
    jurisdictionName: safe(raw.label) || safe(raw.name) || fallback.label,
    complianceLevel: safe(raw.compliance_level) || fallback.complianceLevel || null,
    complianceMode: safe(raw.compliance_mode) || fallback.complianceMode || null,
    complianceUiMode: safe(raw.compliance_ui_mode) || fallback.complianceUiMode || null,
    reportRequirementMode:
      safe(raw.report_requirement_mode) || fallback.reportRequirementMode || null,
    regulatoryFamily: safe(raw.regulatory_family) || null,
    reportRequired: raw.report_required === undefined ? fallback.reportRequired ?? null : Boolean(raw.report_required),
    requiresNotification: raw.requires_notification === undefined ? null : Boolean(raw.requires_notification),
    requiresNotificationAnnual: raw.requires_notification_annual === undefined ? null : Boolean(raw.requires_notification_annual),
    requiresAttendanceTracking: raw.requires_attendance_tracking === undefined ? null : Boolean(raw.requires_attendance_tracking),
    requiresInstructionHours: raw.requires_instruction_hours === undefined ? null : Boolean(raw.requires_instruction_hours),
    requiredInstructionHoursPerYear: Number.isFinite(Number(raw.required_instruction_hours_per_year))
      ? Number(raw.required_instruction_hours_per_year)
      : null,
    requiredInstructionDaysPerYear: Number.isFinite(Number(raw.required_instruction_days_per_year))
      ? Number(raw.required_instruction_days_per_year)
      : null,
    requiresSubjectList: raw.requires_subject_list === undefined ? null : Boolean(raw.requires_subject_list),
    requiresYearlyPlan: raw.requires_yearly_plan === undefined ? null : Boolean(raw.requires_yearly_plan),
    requiresQuarterlyReports: raw.requires_quarterly_reports === undefined ? null : Boolean(raw.requires_quarterly_reports),
    requiresAnnualAssessment: raw.requires_annual_assessment === undefined ? null : Boolean(raw.requires_annual_assessment),
    requiresStandardizedTesting: raw.requires_standardized_testing === undefined ? null : Boolean(raw.requires_standardized_testing),
    requiresProfessionalEvaluation: raw.requires_professional_evaluation === undefined ? null : Boolean(raw.requires_professional_evaluation),
    requiresPortfolio: raw.requires_portfolio === undefined ? null : Boolean(raw.requires_portfolio),
    requiresWorkSamples: raw.requires_work_samples === undefined ? null : Boolean(raw.requires_work_samples),
    requiresParentQualificationCheck: raw.requires_parent_qualification_check === undefined ? null : Boolean(raw.requires_parent_qualification_check),
    requiresImmunizationRecordOrExemption: raw.requires_immunization_record_or_exemption === undefined ? null : Boolean(raw.requires_immunization_record_or_exemption),
    requiresSubmissionToAuthority: raw.requires_submission_to_authority === undefined ? null : Boolean(raw.requires_submission_to_authority),
    exportShouldBeBlockedWhenIncomplete: raw.export_should_be_blocked_when_incomplete === undefined ? null : Boolean(raw.export_should_be_blocked_when_incomplete),
    allowsPortfolioInsteadOfTesting: raw.allows_portfolio_instead_of_testing === undefined ? null : Boolean(raw.allows_portfolio_instead_of_testing),
    allowsEvaluationInsteadOfTesting: raw.allows_evaluation_instead_of_testing === undefined ? null : Boolean(raw.allows_evaluation_instead_of_testing),
  });
}

function normalizeJurisdiction(raw: Record<string, unknown>, fallback: EffectiveJurisdiction): EffectiveJurisdiction {
  const profile = complianceProfileFromRaw(raw, fallback);
  return {
    code: profile.jurisdictionCode,
    countryCode: profile.countryCode,
    stateCode: profile.stateCode,
    label: profile.jurisdictionName,
    reportingMode:
      safe(raw.reporting_mode_label) ||
      safe(raw.reporting_mode) ||
      fallback.reportingMode,
    localeCode: safe(raw.locale_code) || fallback.localeCode,
    spellingStyle: safe(raw.spelling_style) || fallback.spellingStyle,
    terminologyMode: safe(raw.terminology_mode) || fallback.terminologyMode,
    complianceLevel: profile.complianceLevel,
    complianceMode: profile.complianceMode,
    complianceUiMode: profile.complianceUiMode,
    reportRequirementMode: profile.reportRequirementMode,
    regulatoryFamily: profile.regulatoryFamily,
    reportRequired: profile.reportRequired,
    requiresNotification: profile.requiresNotification,
    requiresNotificationAnnual: profile.requiresNotificationAnnual,
    requiresAttendanceTracking: profile.requiresAttendanceTracking,
    requiresInstructionHours: profile.requiresInstructionHours,
    requiredInstructionHoursPerYear: profile.requiredInstructionHoursPerYear,
    requiredInstructionDaysPerYear: profile.requiredInstructionDaysPerYear,
    requiresSubjectList: profile.requiresSubjectList,
    requiresYearlyPlan: profile.requiresYearlyPlan,
    requiresQuarterlyReports: profile.requiresQuarterlyReports,
    requiresAnnualAssessment: profile.requiresAnnualAssessment,
    requiresStandardizedTesting: profile.requiresStandardizedTesting,
    requiresProfessionalEvaluation: profile.requiresProfessionalEvaluation,
    requiresPortfolio: profile.requiresPortfolio,
    requiresWorkSamples: profile.requiresWorkSamples,
    requiresParentQualificationCheck: profile.requiresParentQualificationCheck,
    requiresImmunizationRecordOrExemption: profile.requiresImmunizationRecordOrExemption,
    requiresSubmissionToAuthority: profile.requiresSubmissionToAuthority,
    exportShouldBeBlockedWhenIncomplete: profile.exportShouldBeBlockedWhenIncomplete,
    allowsPortfolioInsteadOfTesting: profile.allowsPortfolioInsteadOfTesting,
    allowsEvaluationInsteadOfTesting: profile.allowsEvaluationInsteadOfTesting,
  };
}

function normalizeRuleSet(raw: Record<string, unknown>, jurisdiction: EffectiveJurisdiction): ReportingRuleSet {
  const profile = complianceProfileFromRaw(raw, jurisdiction);
  return {
    id: safe(raw.id),
    title: safe(raw.title) || safe(raw.name) || `${jurisdiction.label} reporting rules`,
    effectiveFrom: safe(raw.effective_from) || null,
    effectiveTo: safe(raw.effective_to) || null,
    status: safe(raw.status) || "active",
    cycleLabel:
      safe(raw.reporting_cycle_label) ||
      safe(raw.cycle_label) ||
      safe(raw.review_cycle_label) ||
      "Annual review",
    localeCode: safe(raw.locale_code) || jurisdiction.localeCode,
    spellingStyle: safe(raw.spelling_style) || jurisdiction.spellingStyle,
    terminologyMode: safe(raw.terminology_mode) || jurisdiction.terminologyMode,
    complianceLevel: profile.complianceLevel,
    complianceMode: profile.complianceMode,
    complianceUiMode: profile.complianceUiMode,
    reportRequirementMode: profile.reportRequirementMode,
    regulatoryFamily: profile.regulatoryFamily,
    reportRequired: profile.reportRequired,
    requiresNotification: profile.requiresNotification,
    requiresNotificationAnnual: profile.requiresNotificationAnnual,
    requiresAttendanceTracking: profile.requiresAttendanceTracking,
    requiresInstructionHours: profile.requiresInstructionHours,
    requiredInstructionHoursPerYear: profile.requiredInstructionHoursPerYear,
    requiredInstructionDaysPerYear: profile.requiredInstructionDaysPerYear,
    requiresSubjectList: profile.requiresSubjectList,
    requiresYearlyPlan: profile.requiresYearlyPlan,
    requiresQuarterlyReports: profile.requiresQuarterlyReports,
    requiresAnnualAssessment: profile.requiresAnnualAssessment,
    requiresStandardizedTesting: profile.requiresStandardizedTesting,
    requiresProfessionalEvaluation: profile.requiresProfessionalEvaluation,
    requiresPortfolio: profile.requiresPortfolio,
    requiresWorkSamples: profile.requiresWorkSamples,
    requiresParentQualificationCheck: profile.requiresParentQualificationCheck,
    requiresImmunizationRecordOrExemption: profile.requiresImmunizationRecordOrExemption,
    requiresSubmissionToAuthority: profile.requiresSubmissionToAuthority,
    exportShouldBeBlockedWhenIncomplete: profile.exportShouldBeBlockedWhenIncomplete,
    allowsPortfolioInsteadOfTesting: profile.allowsPortfolioInsteadOfTesting,
    allowsEvaluationInsteadOfTesting: profile.allowsEvaluationInsteadOfTesting,
  };
}

function normalizeCycle(raw: Record<string, unknown>): RegistrationCycleRecord {
  return {
    id: safe(raw.id),
    label: safe(raw.label) || safe(raw.title) || safe(raw.name) || "Registration cycle",
    status: safe(raw.status) || "active",
    startDate:
      safe(raw.start_date) ||
      safe(raw.starts_on) ||
      safe(raw.cycle_start) ||
      safe(raw.period_start) ||
      null,
    endDate:
      safe(raw.end_date) ||
      safe(raw.ends_on) ||
      safe(raw.cycle_end) ||
      safe(raw.period_end) ||
      null,
  };
}

function normalizePeriod(raw: Record<string, unknown>): ReportingPeriodRecord {
  return {
    id: safe(raw.id),
    label: safe(raw.label) || safe(raw.title) || safe(raw.name) || "Reporting period",
    status: safe(raw.status) || "draft",
    periodType: safe(raw.period_type) || "annual",
    registrationCycleId: safe(raw.registration_cycle_id) || null,
    startDate:
      safe(raw.start_date) ||
      safe(raw.starts_on) ||
      safe(raw.period_start) ||
      null,
    endDate:
      safe(raw.end_date) ||
      safe(raw.ends_on) ||
      safe(raw.period_end) ||
      null,
  };
}

function normalizeSections(raw: Record<string, unknown>): ReportSectionRecord[] {
  const direct = raw.sections ?? raw.document_sections;
  const nestedContent = asObject(raw.content);
  const nestedBody = asObject(raw.body);
  const source =
    direct ??
    nestedContent.sections ??
    nestedBody.sections ??
    [];

  if (!Array.isArray(source)) return [];

  return source.map((item, index) => {
    const row = asObject(item);
    return {
      id: safe(row.id) || `section-${index + 1}`,
      title: safe(row.title) || safe(row.heading) || `Section ${index + 1}`,
      content: safe(row.content) || safe(row.body) || safe(row.note),
      status: safe(row.status) || "draft",
    };
  });
}

function normalizePackItems(raw: Record<string, unknown>): ReportPackItemRecord[] {
  const source =
    raw.linked_pack_items ??
    raw.pack_items ??
    raw.selected_pack_items ??
    [];

  if (!Array.isArray(source)) return [];

  return source.map((item, index) => {
    const row = asObject(item);
    return {
      id: safe(row.id) || `pack-${index + 1}`,
      label: safe(row.label) || safe(row.title) || `Pack item ${index + 1}`,
      note: safe(row.note) || safe(row.description),
    };
  });
}

function normalizeDocument(raw: Record<string, unknown>, fallback: { label: string; localeCode: string; spellingStyle: string; terminologyMode: string }): ReportDocumentRecord {
  return {
    id: safe(raw.id),
    title: safe(raw.title) || `${fallback.label} report draft`,
    status: safe(raw.status) || "draft",
    documentType: safe(raw.document_type) || "authority_ready",
    localeCode: safe(raw.locale_code) || fallback.localeCode,
    spellingStyle: safe(raw.spelling_style) || fallback.spellingStyle,
    terminologyMode: safe(raw.terminology_mode) || fallback.terminologyMode,
    toneProfile: safe(raw.tone_profile) || "regulatory_formal",
    reportingPeriodId: safe(raw.reporting_period_id) || null,
    studentId: safe(raw.student_id) || null,
    userId: safe(raw.user_id) || null,
    sections: normalizeSections(raw),
    linkedPackItems: normalizePackItems(raw),
    updatedAt: safe(raw.updated_at) || safe(raw.created_at) || null,
  };
}

function artifactCategoryFromRow(raw: Record<string, unknown>) {
  const haystack = [
    raw.code,
    raw.artifact_type,
    raw.label,
    raw.name,
    raw.note,
    raw.short_note,
  ]
    .map((item) => toLower(item))
    .join(" ");

  if (
    haystack.includes("report") ||
    haystack.includes("review") ||
    haystack.includes("summary")
  ) {
    return "report" as const;
  }
  if (
    haystack.includes("evidence") ||
    haystack.includes("portfolio") ||
    haystack.includes("sample") ||
    haystack.includes("record") ||
    haystack.includes("work log") ||
    haystack.includes("learning log")
  ) {
    return "evidence" as const;
  }
  if (
    haystack.includes("plan") ||
    haystack.includes("program") ||
    haystack.includes("subject")
  ) {
    return "plan" as const;
  }
  if (haystack.includes("notification") || haystack.includes("notice")) {
    return "notification" as const;
  }
  if (
    haystack.includes("attendance") ||
    haystack.includes("hour") ||
    haystack.includes("days")
  ) {
    return "attendance" as const;
  }
  if (
    haystack.includes("assessment") ||
    haystack.includes("evaluation") ||
    haystack.includes("testing")
  ) {
    return "assessment" as const;
  }
  if (haystack.includes("portfolio")) {
    return "portfolio" as const;
  }
  return "other" as const;
}

function buildSoftWarning(message: string, error: unknown) {
  const detail =
    error && typeof error === "object" && "message" in error
      ? safe((error as { message?: unknown }).message)
      : safe(error);
  return detail ? `${message} ${detail}` : message;
}

async function maybeSingle(
  db: QueryClient,
  table: string,
  configure: (query: ReturnType<typeof db.from>) => any,
) {
  const response = await configure(db.from(table));
  if (response.error) throw response.error;
  return response.data ? asObject(response.data) : null;
}

async function many(
  db: QueryClient,
  table: string,
  configure: (query: ReturnType<typeof db.from>) => any,
) {
  const response = await configure(db.from(table));
  if (response.error) throw response.error;
  return Array.isArray(response.data)
    ? (response.data as unknown[]).map((item: unknown) => asObject(item))
    : [];
}

async function countRows(
  db: QueryClient,
  table: string,
  configure: (query: ReturnType<typeof db.from>) => any,
) {
  const response = await configure(db.from(table));
  if (response.error) throw response.error;
  return Number(response.count ?? 0);
}

export function resolveEffectiveJurisdiction(
  profile: FamilyProfileRow,
  learner: FamilyLearner | null,
): EffectiveJurisdiction {
  const learningConfig = resolveEffectiveLearnerLearningConfig(profile, learner);
  const countryCode = safe(learningConfig.country).toUpperCase() || "AU";
  const stateCode = safe(learningConfig.jurisdictionId).toUpperCase() || "TAS";
  const code = jurisdictionCodeFrom(countryCode, stateCode);
  const complianceProfile = resolveJurisdictionComplianceProfile({
    countryCode,
    stateCode,
    jurisdictionCode: code,
    jurisdictionName: jurisdictionLabelFromCode(code),
  });

  return {
    code,
    countryCode,
    stateCode,
    label: complianceProfile.jurisdictionName,
    reportingMode: withSentenceCase(safe(learningConfig.reportingMode).replace(/-/g, " ")) || "Family summary",
    localeCode: countryCode === "AU" ? "en-AU" : countryCode === "UK" ? "en-GB" : "en-US",
    spellingStyle: countryCode === "AU" || countryCode === "UK" ? "british" : "american",
    terminologyMode: "jurisdiction",
    complianceLevel: complianceProfile.complianceLevel,
    complianceMode: complianceProfile.complianceMode,
    complianceUiMode: complianceProfile.complianceUiMode,
    reportRequirementMode: complianceProfile.reportRequirementMode,
    regulatoryFamily: complianceProfile.regulatoryFamily,
    reportRequired: complianceProfile.reportRequired,
    requiresNotification: complianceProfile.requiresNotification,
    requiresNotificationAnnual: complianceProfile.requiresNotificationAnnual,
    requiresAttendanceTracking: complianceProfile.requiresAttendanceTracking,
    requiresInstructionHours: complianceProfile.requiresInstructionHours,
    requiredInstructionHoursPerYear: complianceProfile.requiredInstructionHoursPerYear,
    requiredInstructionDaysPerYear: complianceProfile.requiredInstructionDaysPerYear,
    requiresSubjectList: complianceProfile.requiresSubjectList,
    requiresYearlyPlan: complianceProfile.requiresYearlyPlan,
    requiresQuarterlyReports: complianceProfile.requiresQuarterlyReports,
    requiresAnnualAssessment: complianceProfile.requiresAnnualAssessment,
    requiresStandardizedTesting: complianceProfile.requiresStandardizedTesting,
    requiresProfessionalEvaluation: complianceProfile.requiresProfessionalEvaluation,
    requiresPortfolio: complianceProfile.requiresPortfolio,
    requiresWorkSamples: complianceProfile.requiresWorkSamples,
    requiresParentQualificationCheck: complianceProfile.requiresParentQualificationCheck,
    requiresImmunizationRecordOrExemption: complianceProfile.requiresImmunizationRecordOrExemption,
    requiresSubmissionToAuthority: complianceProfile.requiresSubmissionToAuthority,
    exportShouldBeBlockedWhenIncomplete: complianceProfile.exportShouldBeBlockedWhenIncomplete,
    allowsPortfolioInsteadOfTesting: complianceProfile.allowsPortfolioInsteadOfTesting,
    allowsEvaluationInsteadOfTesting: complianceProfile.allowsEvaluationInsteadOfTesting,
  };
}

async function loadJurisdictionRecord(db: QueryClient, effective: EffectiveJurisdiction) {
  try {
    const row = await maybeSingle(db, "jurisdictions", (query) =>
      query.select("*").eq("code", effective.code).maybeSingle(),
    );
    return row ? normalizeJurisdiction(row, effective) : effective;
  } catch {
    return effective;
  }
}

async function loadRuleSetRecord(db: QueryClient, jurisdiction: EffectiveJurisdiction) {
  const today = ymd(new Date());

  try {
    const byCode = await many(db, "jurisdiction_rule_sets", (query) =>
      query
        .select("*")
        .eq("jurisdiction_code", jurisdiction.code)
        .or(`effective_to.is.null,effective_to.gte.${today}`)
        .order("effective_from", { ascending: false })
        .limit(5),
    );

    if (byCode.length) {
      return normalizeRuleSet(byCode[0], jurisdiction);
    }
  } catch {
    // try id-based variant next
  }

  try {
    const jurisdictionRow = await maybeSingle(db, "jurisdictions", (query) =>
      query.select("id").eq("code", jurisdiction.code).maybeSingle(),
    );

    const jurisdictionId = safe(jurisdictionRow?.id);
    if (!jurisdictionId) return null;

    const rows = await many(db, "jurisdiction_rule_sets", (query) =>
      query
        .select("*")
        .eq("jurisdiction_id", jurisdictionId)
        .or(`effective_to.is.null,effective_to.gte.${today}`)
        .order("effective_from", { ascending: false })
        .limit(5),
    );

    return rows.length ? normalizeRuleSet(rows[0], jurisdiction) : null;
  } catch {
    return null;
  }
}

function selectCurrentCycle(rows: RegistrationCycleRecord[]) {
  const now = new Date();
  const active = rows.find((row) => {
    const start = asDate(row.startDate);
    const end = asDate(row.endDate);
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  });

  return active || rows[0] || null;
}

async function loadRegistrationCycleRecord(
  db: QueryClient,
  learnerId: string,
  preferredCycleId?: string | null,
) {
  const cycleId = safe(preferredCycleId);
  if (cycleId) {
    try {
      const direct = await maybeSingle(db, "registration_cycles", (query) =>
        query.select("*").eq("id", cycleId).maybeSingle(),
      );
      if (direct) return normalizeCycle(direct);
    } catch {
      // continue to learner-based lookup
    }
  }

  try {
    const rows = await many(db, "registration_cycles", (query) =>
      query
        .select("*")
        .eq("student_id", learnerId)
        .order("start_date", { ascending: false })
        .limit(10),
    );

    if (rows.length) {
      return selectCurrentCycle(rows.map(normalizeCycle));
    }
  } catch {
    // try learner_id variant
  }

  try {
    const rows = await many(db, "registration_cycles", (query) =>
      query
        .select("*")
        .eq("learner_id", learnerId)
        .order("start_date", { ascending: false })
        .limit(10),
    );

    return rows.length ? selectCurrentCycle(rows.map(normalizeCycle)) : null;
  } catch {
    return null;
  }
}

function selectCurrentOrNextPeriod(rows: ReportingPeriodRecord[]) {
  const now = new Date();
  const current = rows.find((row) => {
    const start = asDate(row.startDate);
    const end = asDate(row.endDate);
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  });
  if (current) return current;

  const upcoming = rows
    .filter((row) => {
      const start = asDate(row.startDate);
      return start ? start >= now : false;
    })
    .sort((left, right) => {
      const leftTime = asDate(left.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightTime = asDate(right.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })[0];

  return upcoming || rows[0] || null;
}

async function createReportingPeriodRecord(
  cycle: RegistrationCycleRecord,
  learnerId: string,
  db: QueryClient,
) {
  const startDate = cycle.startDate || ymd(new Date());
  const endDate = cycle.endDate || startDate;
  const year = asDate(startDate)?.getFullYear() ?? new Date().getFullYear();
  const payload = {
    registration_cycle_id: cycle.id,
    student_id: learnerId,
    label: `${year} Annual Review`,
    period_type: "annual",
    start_date: startDate,
    end_date: endDate,
    status: "draft",
  };

  const response = await db
    .from("reporting_periods")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (response.error) throw response.error;
  return response.data ? normalizePeriod(asObject(response.data)) : null;
}

async function loadReportingPeriodRecord(
  cycle: RegistrationCycleRecord | null,
  learnerId: string,
  mode: ReadMode,
  db: QueryClient,
  preferredReportingPeriodId?: string | null,
) {
  const preferredPeriodId = safe(preferredReportingPeriodId);
  if (preferredPeriodId) {
    try {
      const preferred = await maybeSingle(db, "reporting_periods", (query) =>
        query.select("*").eq("id", preferredPeriodId).maybeSingle(),
      );
      if (preferred) return normalizePeriod(preferred);
    } catch {
      // continue below
    }
  }

  if (!cycle) return null;

  try {
    const rows = await many(db, "reporting_periods", (query) =>
      query
        .select("*")
        .eq("registration_cycle_id", cycle.id)
        .order("start_date", { ascending: false })
        .limit(10),
    );

    const period = rows.length ? selectCurrentOrNextPeriod(rows.map(normalizePeriod)) : null;
    if (period || mode !== "ensure") return period;
  } catch {
    // fall through to learner-based variant
  }

  try {
    const rows = await many(db, "reporting_periods", (query) =>
      query
        .select("*")
        .eq("student_id", learnerId)
        .order("start_date", { ascending: false })
        .limit(10),
    );

    const period = rows.length ? selectCurrentOrNextPeriod(rows.map(normalizePeriod)) : null;
    if (period || mode !== "ensure") return period;
  } catch {
    // create below if allowed
  }

  return mode === "ensure" ? createReportingPeriodRecord(cycle, learnerId, db) : null;
}

async function loadDocumentById(
  documentId: string,
  fallback: { label: string; localeCode: string; spellingStyle: string; terminologyMode: string },
  db: QueryClient,
) {
  const row = await maybeSingle(db, "report_documents", (query) =>
    query.select("*").eq("id", documentId).maybeSingle(),
  );
  return row ? normalizeDocument(row, fallback) : null;
}

async function createReportDocumentRecord(
  reportingPeriod: ReportingPeriodRecord,
  learner: FamilyLearner,
  userId: string | null | undefined,
  jurisdiction: EffectiveJurisdiction,
  ruleSet: ReportingRuleSet | null,
  db: QueryClient,
) {
  const payload = {
    reporting_period_id: reportingPeriod.id,
    student_id: learner.id,
    user_id: safe(userId) || null,
    title: `${reportingPeriod.label} report draft`,
    document_type: "authority_ready",
    locale_code: ruleSet?.localeCode || jurisdiction.localeCode,
    spelling_style: ruleSet?.spellingStyle || jurisdiction.spellingStyle,
    terminology_mode: "jurisdiction",
    tone_profile: "regulatory_formal",
    status: "draft",
    sections: [],
  };

  const response = await db
    .from("report_documents")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (response.error) throw response.error;
  return response.data
    ? normalizeDocument(asObject(response.data), {
        label: reportingPeriod.label,
        localeCode: payload.locale_code,
        spellingStyle: payload.spelling_style,
        terminologyMode: payload.terminology_mode,
      })
    : null;
}

async function loadReportDocumentRecord(input: {
  preferredDocumentId?: string | null;
  reportingPeriod: ReportingPeriodRecord | null;
  learner: FamilyLearner | null;
  userId?: string | null;
  jurisdiction: EffectiveJurisdiction | null;
  ruleSet: ReportingRuleSet | null;
  mode: ReadMode;
  client?: QueryClient;
}) {
  const db = input.client ?? supabase;
  const fallback = {
    label: input.reportingPeriod?.label || "Current",
    localeCode: input.ruleSet?.localeCode || input.jurisdiction?.localeCode || "en-AU",
    spellingStyle: input.ruleSet?.spellingStyle || input.jurisdiction?.spellingStyle || "british",
    terminologyMode: input.ruleSet?.terminologyMode || input.jurisdiction?.terminologyMode || "jurisdiction",
  };

  const preferredDocumentId = safe(input.preferredDocumentId);
  if (preferredDocumentId) {
    try {
      return await loadDocumentById(preferredDocumentId, fallback, db);
    } catch {
      // fall through to current-period lookup
    }
  }

  if (!input.reportingPeriod || !input.learner) return null;

  const reportingPeriod = input.reportingPeriod;
  const learner = input.learner;

  try {
    const row = await maybeSingle(db, "report_documents", (query) =>
      query
        .select("*")
        .eq("reporting_period_id", reportingPeriod.id)
        .eq("student_id", learner.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

    if (row) {
      return normalizeDocument(row, fallback);
    }
  } catch {
    // try period-only variant
  }

  try {
    const row = await maybeSingle(db, "report_documents", (query) =>
      query
        .select("*")
        .eq("reporting_period_id", reportingPeriod.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );

    if (row) {
      return normalizeDocument(row, fallback);
    }
  } catch {
    // create below if requested
  }

  if (input.mode !== "ensure") return null;

  return createReportDocumentRecord(
    reportingPeriod,
    learner,
    input.userId,
    input.jurisdiction || resolveEffectiveJurisdiction(DEFAULT_PROFILE_FALLBACK, input.learner),
    input.ruleSet,
    db,
  );
}

const DEFAULT_PROFILE_FALLBACK = {
  id: "local",
  family_display_name: "My family",
  preferred_market: "au",
  country: "au",
  curriculum_framework_id: "au-v9",
  curriculum_jurisdiction_id: "tas",
  reporting_mode: "family-summary",
  academic_structure_type: "terms",
  cycle_count: 4,
  weeks_per_cycle: 10,
  experience_mode: "family",
  default_child_id: null,
  default_child_landing: "dashboard",
  week_start: "monday",
  compact_mode: false,
  show_advanced_insights: false,
  show_authority_guidance: true,
  auto_open_last_child: true,
  evidence_privacy_default: "family",
  planner_auto_carry_forward: true,
  planner_show_weekend: true,
  portfolio_print_style: "calm",
  report_tone_default: "family-summary",
  notifications_weekly_digest: true,
  notifications_readiness_alerts: true,
  notifications_planner_nudges: true,
} as FamilyProfileRow;

async function loadRequiredArtifactRows(
  db: QueryClient,
  ruleSet: ReportingRuleSet | null,
  jurisdictionProfile: JurisdictionComplianceProfile,
) {
  if (!ruleSet) {
    return getRequiredArtifactSeeds(jurisdictionProfile);
  }

  try {
    const rows = await many(db, "jurisdiction_required_artifacts", (query) =>
      query
        .select("*")
        .eq("rule_set_id", ruleSet.id)
        .order("display_order", { ascending: true }),
    );
    if (rows.length) return rows;
  } catch {
    // try alternate column below
  }

  try {
    const rows = await many(db, "jurisdiction_required_artifacts", (query) =>
      query
        .select("*")
        .eq("jurisdiction_rule_set_id", ruleSet.id)
        .order("display_order", { ascending: true }),
    );
    if (rows.length) return rows;
  } catch {
    // fall through to seeded defaults below
  }

  return getRequiredArtifactSeeds(jurisdictionProfile);
}

async function loadPlanCount(db: QueryClient, learnerId: string, cycle: RegistrationCycleRecord | null) {
  if (!cycle) return 0;

  try {
    return await countRows(db, "learning_plan_items", (query) =>
      query
        .select("id", { count: "exact", head: true })
        .eq("student_id", learnerId)
        .gte("planned_date", cycle.startDate || "1900-01-01")
        .lte("planned_date", cycle.endDate || "2999-12-31"),
    );
  } catch {
    try {
      return await countRows(db, "learning_plan_items", (query) =>
        query
          .select("id", { count: "exact", head: true })
          .eq("student_id", learnerId),
      );
    } catch {
      return 0;
    }
  }
}

async function loadEvidenceCount(db: QueryClient, learnerId: string, cycle: RegistrationCycleRecord | null) {
  if (!cycle) return 0;

  try {
    return await countRows(db, "evidence_entries", (query) =>
      query
        .select("id", { count: "exact", head: true })
        .eq("student_id", learnerId)
        .eq("is_deleted", false)
        .gte("occurred_on", cycle.startDate || "1900-01-01")
        .lte("occurred_on", cycle.endDate || "2999-12-31"),
    );
  } catch {
    try {
      return await countRows(db, "evidence_entries", (query) =>
        query
          .select("id", { count: "exact", head: true })
          .eq("student_id", learnerId)
          .eq("is_deleted", false),
      );
    } catch {
      return 0;
    }
  }
}

type AttendanceSummary = {
  days: number;
  hours: number;
  records: number;
};

async function loadNotificationSubmissionCount(
  db: QueryClient,
  learnerId: string,
  cycle: RegistrationCycleRecord | null,
) {
  if (!cycle) return { total: 0, submitted: 0 };

  try {
    const rows = await many(db, "homeschool_notifications", (query) =>
      query
        .select("id,learner_id,registration_cycle_id,status,submitted_at")
        .eq("learner_id", learnerId)
        .eq("registration_cycle_id", cycle.id),
    );

    const submitted = rows.filter((row) => {
      const status = toLower(row.status);
      return Boolean(safe(row.submitted_at)) || status === "submitted" || status === "filed" || status === "complete";
    }).length;

    return {
      total: rows.length,
      submitted,
    };
  } catch {
    return { total: 0, submitted: 0 };
  }
}

async function loadAttendanceSummary(
  db: QueryClient,
  learnerId: string,
  cycle: RegistrationCycleRecord | null,
): Promise<AttendanceSummary> {
  if (!cycle) return { days: 0, hours: 0, records: 0 };

  try {
    const rows = await many(db, "attendance_hour_logs", (query) =>
      query
        .select("id,learner_id,registration_cycle_id,recorded_date,instructional_hours,school_day")
        .eq("learner_id", learnerId)
        .eq("registration_cycle_id", cycle.id),
    );

    const days = rows.filter((row) => {
      const schoolDay = row.school_day;
      const recordedDate = safe(row.recorded_date);
      return Boolean(schoolDay === true || schoolDay === "true" || recordedDate);
    }).length;

    const hours = rows.reduce((sum, row) => sum + (Number(row.instructional_hours) || 0), 0);

    return {
      days,
      hours,
      records: rows.length,
    };
  } catch {
    return { days: 0, hours: 0, records: 0 };
  }
}

async function loadReviewCount(
  db: QueryClient,
  learnerId: string,
  cycle: RegistrationCycleRecord | null,
) {
  try {
    return await countRows(db, "reviews", (query) => {
      let next = query.select("id", { count: "exact", head: true }).eq("learner_id", learnerId);
      if (cycle?.startDate) {
        next = next.gte("review_date", cycle.startDate);
      }
      if (cycle?.endDate) {
        next = next.lte("review_date", cycle.endDate);
      }
      return next;
    });
  } catch {
    return 0;
  }
}

function artifactStatusForCategory(
  category:
    | "plan"
    | "evidence"
    | "report"
    | "notification"
    | "attendance"
    | "assessment"
    | "portfolio"
    | "other",
  input: {
    planCount: number;
    evidenceCount: number;
    reportDocument: ReportDocumentRecord | null;
    notificationCount: number;
    submittedNotificationCount: number;
    attendance: AttendanceSummary;
    reportRequired: boolean;
    requiresAttendanceTracking: boolean;
    requiredInstructionHoursPerYear: number | null;
    requiredInstructionDaysPerYear: number | null;
    complianceUiMode: ComplianceUiMode;
    reviewCount: number;
  },
): ArtifactStatus {
  if (input.reportRequired === false || input.complianceUiMode === "portfolio") {
    if (category === "portfolio") {
      return input.evidenceCount > 0 ? "Ready" : "In progress";
    }
    return "Ready";
  }

  if (category === "plan") {
    return input.planCount > 0 ? "Ready" : "Not started";
  }
  if (category === "evidence") {
    return input.evidenceCount > 0 ? "Ready" : "Not started";
  }
  if (category === "report") {
    return input.reportRequired ? (input.reportDocument ? "Ready" : "Not started") : "Ready";
  }
  if (category === "notification") {
    if (input.submittedNotificationCount > 0) return "Ready";
    if (input.notificationCount > 0) return "In progress";
    return "Not started";
  }
  if (category === "attendance") {
    const meetsDays =
      input.requiredInstructionDaysPerYear != null &&
      input.attendance.days >= input.requiredInstructionDaysPerYear;
    const meetsHours =
      input.requiredInstructionHoursPerYear != null &&
      input.attendance.hours >= input.requiredInstructionHoursPerYear;
    if (meetsDays || meetsHours) return "Ready";
    if (input.attendance.records > 0) return "In progress";
    return "Not started";
  }
  if (category === "assessment") {
    if (input.reviewCount > 0) return "Ready";
    if (input.reportDocument || input.evidenceCount > 0) return "In progress";
    return "Not started";
  }
  if (category === "portfolio") {
    if (input.evidenceCount > 0) return "Ready";
    if (input.planCount > 0 || input.reportDocument) return "In progress";
    return "Not started";
  }
  return "Not started";
}

function buildReadinessSentence(input: {
  status: ArtifactStatus;
  jurisdictionLabel: string;
  planCount: number;
  evidenceCount: number;
  reportDocument: ReportDocumentRecord | null;
  complianceLevel: ComplianceLevel;
  complianceUiMode: ComplianceUiMode;
  reportRequired: boolean;
}) {
  if (input.reportRequired === false || input.complianceUiMode === "portfolio") {
    if (input.status === "Ready") {
      return `Your ${input.jurisdictionLabel} documentation workspace is set up and ready for export.`;
    }
    if (input.planCount > 0 || input.evidenceCount > 0 || input.reportDocument) {
      return `Your ${input.jurisdictionLabel} documentation workspace is in progress. The portfolio is growing, but a few records still need attention.`;
    }
    return `Your ${input.jurisdictionLabel} documentation workspace has not been started yet.`;
  }

  if (input.status === "Ready") {
    return `Your ${input.jurisdictionLabel} compliance workspace is set up and ready for review.`;
  }
  if (input.status === "In progress") {
    const completed: string[] = [];
    if (input.planCount > 0) completed.push("a plan");
    if (input.evidenceCount > 0) completed.push("evidence");
    if (input.reportDocument) completed.push("a report draft");
    const joined = completed.length
      ? `${completed.slice(0, -1).join(", ")}${completed.length > 1 ? " and " : ""}${completed[completed.length - 1]}`
      : "some reporting items";
    const posture =
      input.complianceUiMode === "guided" || input.complianceLevel === "moderate"
        ? "compliance workspace"
        : "reporting workspace";
    return `Your ${input.jurisdictionLabel} ${posture} is in progress. ${withSentenceCase(joined)} exist, but some reporting items still need attention.`;
  }
  return "Your reporting workspace has not been started yet.";
}

function buildEmptyModel(learner: FamilyLearner | null, softWarning = ""): ReportsBuilderModel {
  const behavior = buildJurisdictionBehaviour({
    jurisdictionCode: null,
    jurisdictionName: null,
    countryCode: null,
    complianceLevel: "high",
    complianceMode: "strict",
    reportRequired: true,
  });

  return {
    learner,
    effectiveJurisdiction: null,
    ruleSet: null,
    registrationCycle: null,
    reportingPeriod: null,
    reportDocument: null,
    requiredArtifacts: [],
    readiness: {
      status: "Not started",
      sentence: "Your reporting workspace has not been started yet.",
      completeCount: 0,
      totalCount: 0,
    },
    planCount: 0,
    evidenceCount: 0,
    softWarning,
    jurisdictionBehaviour: behavior,
    complianceLevel: "high",
    complianceMode: "strict",
    complianceUiMode: "strict",
    complianceModeLabel: jurisdictionBehaviourLabel(behavior),
    complianceSummary: "Your reporting workspace has not been started yet.",
    reportRequirementMode: "required",
    reportRequired: true,
    requiresNotification: false,
    requiresAttendanceTracking: false,
    requiredInstructionHoursPerYear: null,
    requiredInstructionDaysPerYear: null,
  };
}

export async function loadReportsBuilderModel(
  options: LoadReportsBuilderOptions,
): Promise<ReportsBuilderModel> {
  const learner = options.learner;
  if (!learner) {
    return buildEmptyModel(null);
  }

  const db = options.client ?? supabase;
  const mode = options.mode ?? "read";
  const effectiveJurisdiction = await loadJurisdictionRecord(
    db,
    resolveEffectiveJurisdiction(options.profile, learner),
  );
  const jurisdictionProfile = resolveJurisdictionComplianceProfile({
    countryCode: effectiveJurisdiction.countryCode,
    stateCode: effectiveJurisdiction.stateCode,
    jurisdictionCode: effectiveJurisdiction.code,
    jurisdictionName: effectiveJurisdiction.label,
    complianceLevel: effectiveJurisdiction.complianceLevel,
    complianceMode: effectiveJurisdiction.complianceMode,
    complianceUiMode: effectiveJurisdiction.complianceUiMode,
    reportRequirementMode: effectiveJurisdiction.reportRequirementMode,
    regulatoryFamily: effectiveJurisdiction.regulatoryFamily,
    reportRequired: effectiveJurisdiction.reportRequired,
    requiresNotification: effectiveJurisdiction.requiresNotification,
    requiresNotificationAnnual: effectiveJurisdiction.requiresNotificationAnnual,
    requiresAttendanceTracking: effectiveJurisdiction.requiresAttendanceTracking,
    requiresInstructionHours: effectiveJurisdiction.requiresInstructionHours,
    requiredInstructionHoursPerYear: effectiveJurisdiction.requiredInstructionHoursPerYear,
    requiredInstructionDaysPerYear: effectiveJurisdiction.requiredInstructionDaysPerYear,
    requiresSubjectList: effectiveJurisdiction.requiresSubjectList,
    requiresYearlyPlan: effectiveJurisdiction.requiresYearlyPlan,
    requiresQuarterlyReports: effectiveJurisdiction.requiresQuarterlyReports,
    requiresAnnualAssessment: effectiveJurisdiction.requiresAnnualAssessment,
    requiresStandardizedTesting: effectiveJurisdiction.requiresStandardizedTesting,
    requiresProfessionalEvaluation: effectiveJurisdiction.requiresProfessionalEvaluation,
    requiresPortfolio: effectiveJurisdiction.requiresPortfolio,
    requiresWorkSamples: effectiveJurisdiction.requiresWorkSamples,
    requiresParentQualificationCheck: effectiveJurisdiction.requiresParentQualificationCheck,
    requiresImmunizationRecordOrExemption: effectiveJurisdiction.requiresImmunizationRecordOrExemption,
    requiresSubmissionToAuthority: effectiveJurisdiction.requiresSubmissionToAuthority,
    exportShouldBeBlockedWhenIncomplete: effectiveJurisdiction.exportShouldBeBlockedWhenIncomplete,
    allowsPortfolioInsteadOfTesting: effectiveJurisdiction.allowsPortfolioInsteadOfTesting,
    allowsEvaluationInsteadOfTesting: effectiveJurisdiction.allowsEvaluationInsteadOfTesting,
  });
  const jurisdictionBehaviour = buildJurisdictionBehaviour({
    jurisdictionId: safe(effectiveJurisdiction.code) || null,
    jurisdictionCode: effectiveJurisdiction.code,
    jurisdictionName: effectiveJurisdiction.label,
    countryCode: effectiveJurisdiction.countryCode,
    stateCode: effectiveJurisdiction.stateCode,
    complianceLevel: jurisdictionProfile.complianceLevel,
    complianceMode: effectiveJurisdiction.complianceMode,
    complianceUiMode: effectiveJurisdiction.complianceUiMode,
    reportRequirementMode: effectiveJurisdiction.reportRequirementMode,
    reportRequired: jurisdictionProfile.reportRequired,
    requiresNotification: jurisdictionProfile.requiresNotification,
    requiresNotificationAnnual: jurisdictionProfile.requiresNotificationAnnual,
    requiresAttendanceTracking: jurisdictionProfile.requiresAttendanceTracking,
    requiresInstructionHours: jurisdictionProfile.requiresInstructionHours,
    requiredInstructionHoursPerYear: jurisdictionProfile.requiredInstructionHoursPerYear,
    requiredInstructionDaysPerYear: jurisdictionProfile.requiredInstructionDaysPerYear,
    requiresAnnualAssessment: jurisdictionProfile.requiresAnnualAssessment,
    exportShouldBeBlockedWhenIncomplete: jurisdictionProfile.exportShouldBeBlockedWhenIncomplete,
    allowsPortfolioInsteadOfTesting: jurisdictionProfile.allowsPortfolioInsteadOfTesting,
    allowsEvaluationInsteadOfTesting: jurisdictionProfile.allowsEvaluationInsteadOfTesting,
  });

  try {
    const ruleSet = await loadRuleSetRecord(db, effectiveJurisdiction);
    const reportingPeriod = await loadReportingPeriodRecord(
      null,
      learner.id,
      mode,
      db,
      options.preferredReportingPeriodId,
    );
    const registrationCycle = await loadRegistrationCycleRecord(
      db,
      learner.id,
      reportingPeriod?.registrationCycleId,
    );
    const resolvedReportingPeriod =
      reportingPeriod ||
      (registrationCycle
        ? await loadReportingPeriodRecord(registrationCycle, learner.id, mode, db)
        : null);
    const reportDocument = await loadReportDocumentRecord({
      preferredDocumentId: options.preferredDocumentId,
      reportingPeriod: resolvedReportingPeriod,
      learner,
      userId: options.userId,
      jurisdiction: effectiveJurisdiction,
      ruleSet,
      mode,
      client: db,
    });
    const requiredArtifactRows = await loadRequiredArtifactRows(db, ruleSet, jurisdictionProfile);
    const [planCount, evidenceCount] = await Promise.all([
      loadPlanCount(db, learner.id, registrationCycle),
      loadEvidenceCount(db, learner.id, registrationCycle),
    ]);
    const [notificationCounts, attendance] = await Promise.all([
      loadNotificationSubmissionCount(db, learner.id, registrationCycle),
      loadAttendanceSummary(db, learner.id, registrationCycle),
    ]);
    const reviewCount = await loadReviewCount(db, learner.id, registrationCycle);

    const requiredArtifacts = requiredArtifactRows.map((row: any) => {
      const category = artifactCategoryFromRow(row);
      return {
        id: safe(row.id) || safe(row.code) || safe(row.artifactType) || safe(row.artifact_type),
        code: safe(row.code) || safe(row.slug) || safe(row.artifactType) || safe(row.artifact_type),
        label: safe(row.label) || safe(row.name) || safe(row.title) || "Required artifact",
        frequency:
          safe(row.frequency) ||
          safe(row.required_frequency) ||
          safe(row.shortNote) ||
          safe(row.short_note) ||
          "Per cycle",
        note: safe(row.shortNote) || safe(row.short_note) || safe(row.note),
        category,
        status: artifactStatusForCategory(category, {
          planCount,
          evidenceCount,
          reportDocument,
          notificationCount: notificationCounts.total,
          submittedNotificationCount: notificationCounts.submitted,
          attendance,
          reportRequired: jurisdictionProfile.reportRequired,
          requiresAttendanceTracking: jurisdictionProfile.requiresAttendanceTracking,
          requiredInstructionHoursPerYear: jurisdictionProfile.requiredInstructionHoursPerYear,
          requiredInstructionDaysPerYear: jurisdictionProfile.requiredInstructionDaysPerYear,
          complianceUiMode: jurisdictionProfile.complianceUiMode,
          reviewCount,
        }),
      } satisfies RequiredArtifactRecord;
    });

    const completeCount = requiredArtifacts.filter((artifact) => artifact.status === "Ready").length;
    const readinessStatus: ArtifactStatus =
      requiredArtifacts.length > 0 && completeCount === requiredArtifacts.length
        ? "Ready"
        : completeCount > 0
          ? "In progress"
          : "Not started";

    return {
      learner,
      effectiveJurisdiction,
      ruleSet,
      registrationCycle,
      reportingPeriod: resolvedReportingPeriod,
      reportDocument,
      requiredArtifacts,
      readiness: {
        status: readinessStatus,
        sentence: buildReadinessSentence({
          status: readinessStatus,
          jurisdictionLabel: effectiveJurisdiction.label,
          planCount,
          evidenceCount,
          reportDocument,
          complianceLevel: jurisdictionProfile.complianceLevel,
          complianceUiMode: jurisdictionProfile.complianceUiMode,
          reportRequired: jurisdictionProfile.reportRequired,
        }),
        completeCount,
        totalCount: requiredArtifacts.length,
      },
      planCount,
      evidenceCount,
      softWarning: "",
      jurisdictionBehaviour,
      complianceLevel: jurisdictionProfile.complianceLevel,
      complianceMode: jurisdictionBehaviour.complianceMode,
      complianceUiMode: jurisdictionProfile.complianceUiMode,
      complianceModeLabel: jurisdictionBehaviourLabel(jurisdictionBehaviour),
      complianceSummary: jurisdictionBehaviourSentence(jurisdictionBehaviour),
      reportRequirementMode: jurisdictionBehaviour.reportRequirementMode,
      reportRequired: jurisdictionProfile.reportRequired,
      requiresNotification: jurisdictionProfile.requiresNotification,
      requiresAttendanceTracking: jurisdictionProfile.requiresAttendanceTracking,
      requiredInstructionHoursPerYear: jurisdictionProfile.requiredInstructionHoursPerYear,
      requiredInstructionDaysPerYear: jurisdictionProfile.requiredInstructionDaysPerYear,
    };
  } catch (error) {
    return buildEmptyModel(
      learner,
      buildSoftWarning(
        "The jurisdiction-aware reporting data could not be loaded cleanly. Showing a lighter workspace instead.",
        error,
      ),
    );
  }
}

export function reportingModeLabel(model: ReportsBuilderModel) {
  if (model.jurisdictionBehaviour) return jurisdictionBehaviourLabel(model.jurisdictionBehaviour);
  if (model.complianceModeLabel) return model.complianceModeLabel;
  if (model.ruleSet?.cycleLabel) return model.ruleSet.cycleLabel;
  if (model.effectiveJurisdiction?.reportingMode) return model.effectiveJurisdiction.reportingMode;
  return "Reporting cycle";
}

export function currentPeriodRangeLabel(model: ReportsBuilderModel) {
  return model.reportingPeriod
    ? formatDateRange(model.reportingPeriod.startDate, model.reportingPeriod.endDate)
    : "No reporting period yet";
}

export function nextReportCta(model: ReportsBuilderModel) {
  if (!model.learner) {
    return {
      label: "Choose learner",
      href: "/family",
      note: "Choose a learner first so the reporting builder can resolve the correct jurisdiction.",
    };
  }

  if (!model.registrationCycle) {
    return {
      label: "Open My Family",
      href: "/family",
      note: "A registration cycle has not been found yet, so start by confirming the learner and jurisdiction setup.",
    };
  }

  if (model.reportDocument) {
    return model.reportRequired === false || model.complianceUiMode === "portfolio"
      ? {
          label: "Open documentation export",
          href: "/reports/output",
          note: "Your current record is ready for a portfolio-style export and review.",
        }
      : {
          label: "Open report draft",
          href: "/reports/output",
          note: "Your current reporting period already has a draft document ready to review.",
        };
  }

  if (model.planCount === 0) {
    return model.reportRequired === false || model.complianceUiMode === "portfolio"
      ? {
          label: "Open portfolio",
          href: "/my-portfolio",
          note: "This jurisdiction is documentation-led, so start by keeping the learning story visible in the portfolio.",
        }
      : {
          label: "Update learning plan",
          href: "/my-plan",
          note: "This jurisdiction expects planning evidence, so begin by making the current learning plan visible.",
        };
  }

  if (model.evidenceCount === 0) {
    return model.reportRequired === false || model.complianceUiMode === "portfolio"
      ? {
          label: "Review portfolio",
          href: "/my-portfolio",
          note: "This jurisdiction is documentation-led, so the next calm step is to keep the portfolio broad enough to trust.",
        }
      : {
          label: "Review learning evidence",
          href: "/capture",
          note: "A report draft will be more useful once at least one evidence item has been captured in this cycle.",
        };
  }

  return model.reportRequired === false || model.complianceUiMode === "portfolio"
    ? {
        label: "Open documentation export",
        href: "/reports/output",
        note: "This jurisdiction can move through a lighter export path once the portfolio is ready.",
      }
    : {
        label: "Start report draft",
        href: "/reports/output",
        note: "A draft document will be created for the current reporting period when you open the report workspace.",
      };
}
