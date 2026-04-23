export type ComplianceLevel = "high" | "moderate" | "low";
export type ComplianceUiMode = "strict" | "guided" | "portfolio";
export type ComplianceMode = ComplianceUiMode;
export type ReportRequirementMode =
  | "required"
  | "conditional"
  | "optional"
  | "not_required";

export type JurisdictionComplianceProfile = {
  countryCode: string;
  stateCode: string;
  jurisdictionCode: string;
  jurisdictionName: string;
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

export type RequiredArtifactSeed = {
  artifactType: string;
  code: string;
  label: string;
  shortNote: string;
  frequency: string;
  category:
    | "plan"
    | "evidence"
    | "report"
    | "notification"
    | "attendance"
    | "assessment"
    | "portfolio"
    | "other";
  displayOrder: number;
};

export type JurisdictionDisplayInfo = {
  code: string;
  label: string;
  countryCode: string;
  stateCode: string;
};

export const US_STATE_OPTIONS: Array<JurisdictionDisplayInfo> = [
  { code: "US-AL", label: "Alabama", countryCode: "US", stateCode: "AL" },
  { code: "US-AK", label: "Alaska", countryCode: "US", stateCode: "AK" },
  { code: "US-AZ", label: "Arizona", countryCode: "US", stateCode: "AZ" },
  { code: "US-AR", label: "Arkansas", countryCode: "US", stateCode: "AR" },
  { code: "US-CA", label: "California", countryCode: "US", stateCode: "CA" },
  { code: "US-CO", label: "Colorado", countryCode: "US", stateCode: "CO" },
  { code: "US-CT", label: "Connecticut", countryCode: "US", stateCode: "CT" },
  { code: "US-DE", label: "Delaware", countryCode: "US", stateCode: "DE" },
  { code: "US-FL", label: "Florida", countryCode: "US", stateCode: "FL" },
  { code: "US-GA", label: "Georgia", countryCode: "US", stateCode: "GA" },
  { code: "US-HI", label: "Hawaii", countryCode: "US", stateCode: "HI" },
  { code: "US-ID", label: "Idaho", countryCode: "US", stateCode: "ID" },
  { code: "US-IL", label: "Illinois", countryCode: "US", stateCode: "IL" },
  { code: "US-IN", label: "Indiana", countryCode: "US", stateCode: "IN" },
  { code: "US-IA", label: "Iowa", countryCode: "US", stateCode: "IA" },
  { code: "US-KS", label: "Kansas", countryCode: "US", stateCode: "KS" },
  { code: "US-KY", label: "Kentucky", countryCode: "US", stateCode: "KY" },
  { code: "US-LA", label: "Louisiana", countryCode: "US", stateCode: "LA" },
  { code: "US-ME", label: "Maine", countryCode: "US", stateCode: "ME" },
  { code: "US-MD", label: "Maryland", countryCode: "US", stateCode: "MD" },
  { code: "US-MA", label: "Massachusetts", countryCode: "US", stateCode: "MA" },
  { code: "US-MI", label: "Michigan", countryCode: "US", stateCode: "MI" },
  { code: "US-MN", label: "Minnesota", countryCode: "US", stateCode: "MN" },
  { code: "US-MS", label: "Mississippi", countryCode: "US", stateCode: "MS" },
  { code: "US-MO", label: "Missouri", countryCode: "US", stateCode: "MO" },
  { code: "US-MT", label: "Montana", countryCode: "US", stateCode: "MT" },
  { code: "US-NE", label: "Nebraska", countryCode: "US", stateCode: "NE" },
  { code: "US-NV", label: "Nevada", countryCode: "US", stateCode: "NV" },
  { code: "US-NH", label: "New Hampshire", countryCode: "US", stateCode: "NH" },
  { code: "US-NJ", label: "New Jersey", countryCode: "US", stateCode: "NJ" },
  { code: "US-NM", label: "New Mexico", countryCode: "US", stateCode: "NM" },
  { code: "US-NY", label: "New York", countryCode: "US", stateCode: "NY" },
  { code: "US-NC", label: "North Carolina", countryCode: "US", stateCode: "NC" },
  { code: "US-ND", label: "North Dakota", countryCode: "US", stateCode: "ND" },
  { code: "US-OH", label: "Ohio", countryCode: "US", stateCode: "OH" },
  { code: "US-OK", label: "Oklahoma", countryCode: "US", stateCode: "OK" },
  { code: "US-OR", label: "Oregon", countryCode: "US", stateCode: "OR" },
  { code: "US-PA", label: "Pennsylvania", countryCode: "US", stateCode: "PA" },
  { code: "US-RI", label: "Rhode Island", countryCode: "US", stateCode: "RI" },
  { code: "US-SC", label: "South Carolina", countryCode: "US", stateCode: "SC" },
  { code: "US-SD", label: "South Dakota", countryCode: "US", stateCode: "SD" },
  { code: "US-TN", label: "Tennessee", countryCode: "US", stateCode: "TN" },
  { code: "US-TX", label: "Texas", countryCode: "US", stateCode: "TX" },
  { code: "US-UT", label: "Utah", countryCode: "US", stateCode: "UT" },
  { code: "US-VT", label: "Vermont", countryCode: "US", stateCode: "VT" },
  { code: "US-VA", label: "Virginia", countryCode: "US", stateCode: "VA" },
  { code: "US-WA", label: "Washington", countryCode: "US", stateCode: "WA" },
  { code: "US-WV", label: "West Virginia", countryCode: "US", stateCode: "WV" },
  { code: "US-WI", label: "Wisconsin", countryCode: "US", stateCode: "WI" },
  { code: "US-WY", label: "Wyoming", countryCode: "US", stateCode: "WY" },
];

const HIGH_STATES = new Set(["NY", "PA", "MA", "RI"]);
const MODERATE_STATES = new Set([
  "CA",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "MD",
  "ME",
  "MN",
  "MO",
  "NC",
  "OH",
  "OR",
  "SC",
  "TN",
  "VA",
  "WA",
  "WI",
  "WV",
  "CO",
  "NJ",
  "MI",
  "IA",
  "KS",
  "NE",
  "NM",
]);

const AU_TERRITORY_NAMES: Record<string, string> = {
  "AU-QLD": "Queensland",
  "AU-NSW": "New South Wales",
  "AU-VIC": "Victoria",
  "AU-SA": "South Australia",
  "AU-WA": "Western Australia",
  "AU-TAS": "Tasmania",
  "AU-ACT": "Australian Capital Territory",
  "AU-NT": "Northern Territory",
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function upper(value: unknown) {
  return safe(value).toUpperCase();
}

function lower(value: unknown) {
  return safe(value).toLowerCase();
}

function normalizeComplianceMode(
  input: string | null | undefined,
  fallback: ComplianceLevel,
): ComplianceMode {
  const normalized = lower(input);
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
  complianceMode: ComplianceMode,
  reportRequired: boolean,
): ReportRequirementMode {
  const normalized = lower(input);
  if (
    normalized === "required" ||
    normalized === "conditional" ||
    normalized === "optional" ||
    normalized === "not_required"
  ) {
    return normalized;
  }

  if (!reportRequired) {
    return complianceMode === "portfolio" ? "not_required" : "optional";
  }

  if (complianceMode === "strict") return "required";
  if (complianceMode === "guided") return "conditional";
  return "optional";
}

function classifyState(stateCode: string): ComplianceLevel {
  if (HIGH_STATES.has(stateCode)) return "high";
  if (MODERATE_STATES.has(stateCode)) return "moderate";
  return "low";
}

function baseProfile(
  countryCode: string,
  stateCode: string,
  jurisdictionName: string,
): JurisdictionComplianceProfile {
  return {
    countryCode,
    stateCode,
    jurisdictionCode: `${countryCode}-${stateCode}`,
    jurisdictionName,
    complianceLevel: "high",
    complianceMode: "strict",
    complianceUiMode: "strict",
    reportRequirementMode: "required",
    regulatoryFamily: countryCode === "US" ? "us_homeschool" : "australia_home_education",
    reportRequired: true,
    requiresNotification: false,
    requiresNotificationAnnual: false,
    requiresAttendanceTracking: false,
    requiresInstructionHours: false,
    requiredInstructionHoursPerYear: null,
    requiredInstructionDaysPerYear: null,
    requiresSubjectList: true,
    requiresYearlyPlan: true,
    requiresQuarterlyReports: false,
    requiresAnnualAssessment: true,
    requiresStandardizedTesting: false,
    requiresProfessionalEvaluation: false,
    requiresPortfolio: true,
    requiresWorkSamples: true,
    requiresParentQualificationCheck: false,
    requiresImmunizationRecordOrExemption: false,
    requiresSubmissionToAuthority: true,
    exportShouldBeBlockedWhenIncomplete: true,
    allowsPortfolioInsteadOfTesting: false,
    allowsEvaluationInsteadOfTesting: false,
  };
}

function withProfileOverrides(
  profile: JurisdictionComplianceProfile,
  overrides: Partial<JurisdictionComplianceProfile>,
) {
  return {
    ...profile,
    ...overrides,
  } satisfies JurisdictionComplianceProfile;
}

function usProfile(stateCode: string, jurisdictionName: string) {
  const level = classifyState(stateCode);
  const common: JurisdictionComplianceProfile = baseProfile("US", stateCode, jurisdictionName);

  if (level === "high") {
    return withProfileOverrides(common, {
      complianceLevel: "high",
      complianceUiMode: "strict",
      requiresNotification: true,
      requiresNotificationAnnual: true,
      requiresAttendanceTracking: true,
      requiresInstructionHours: stateCode === "PA",
      requiredInstructionHoursPerYear: stateCode === "PA" ? 900 : null,
      requiredInstructionDaysPerYear: 180,
      requiresSubjectList: true,
      requiresYearlyPlan: true,
      requiresQuarterlyReports: true,
      requiresAnnualAssessment: true,
      requiresStandardizedTesting: stateCode !== "RI",
      requiresProfessionalEvaluation: stateCode === "PA" || stateCode === "NY",
      requiresPortfolio: true,
      requiresWorkSamples: true,
      requiresParentQualificationCheck: stateCode === "PA" || stateCode === "NY",
      requiresImmunizationRecordOrExemption: stateCode === "NY" || stateCode === "PA",
      requiresSubmissionToAuthority: true,
      exportShouldBeBlockedWhenIncomplete: true,
      allowsPortfolioInsteadOfTesting: true,
      allowsEvaluationInsteadOfTesting: true,
    });
  }

  if (level === "moderate") {
    return withProfileOverrides(common, {
      complianceLevel: "moderate",
      complianceUiMode: "guided",
      requiresNotification: true,
      requiresNotificationAnnual: true,
      requiresAttendanceTracking: true,
      requiresInstructionHours: stateCode === "CA" || stateCode === "TX" ? false : true,
      requiredInstructionHoursPerYear: stateCode === "CA" ? 180 : 900,
      requiredInstructionDaysPerYear: stateCode === "TX" ? null : 180,
      requiresSubjectList: true,
      requiresYearlyPlan: true,
      requiresQuarterlyReports: false,
      requiresAnnualAssessment: true,
      requiresStandardizedTesting: stateCode === "FL" || stateCode === "WA" || stateCode === "OR",
      requiresProfessionalEvaluation: stateCode === "FL" || stateCode === "WA",
      requiresPortfolio: true,
      requiresWorkSamples: true,
      requiresParentQualificationCheck: false,
      requiresImmunizationRecordOrExemption: stateCode === "FL" || stateCode === "GA",
      requiresSubmissionToAuthority: true,
      exportShouldBeBlockedWhenIncomplete: true,
      allowsPortfolioInsteadOfTesting: true,
      allowsEvaluationInsteadOfTesting: true,
    });
  }

  return withProfileOverrides(common, {
    complianceLevel: "low",
    complianceUiMode: "portfolio",
    reportRequired: false,
    requiresNotification: false,
    requiresNotificationAnnual: false,
    requiresAttendanceTracking: false,
    requiresInstructionHours: false,
    requiredInstructionHoursPerYear: null,
    requiredInstructionDaysPerYear: null,
    requiresSubjectList: false,
    requiresYearlyPlan: false,
    requiresQuarterlyReports: false,
    requiresAnnualAssessment: false,
    requiresStandardizedTesting: false,
    requiresProfessionalEvaluation: false,
    requiresPortfolio: true,
    requiresWorkSamples: true,
    requiresParentQualificationCheck: false,
    requiresImmunizationRecordOrExemption: false,
    requiresSubmissionToAuthority: false,
    exportShouldBeBlockedWhenIncomplete: false,
    allowsPortfolioInsteadOfTesting: true,
    allowsEvaluationInsteadOfTesting: true,
  });
}

function usStateName(stateCode: string) {
  const normalized = upper(stateCode);
  return (
    US_STATE_OPTIONS.find((item) => item.stateCode === normalized)?.label ||
    normalized
  );
}

export function jurisdictionDisplayLabel(code?: string | null) {
  const normalized = upper(code);
  if (!normalized) return "";
  if (AU_TERRITORY_NAMES[normalized]) return AU_TERRITORY_NAMES[normalized];
  if (normalized.startsWith("US-")) {
    return usStateName(normalized.slice(3));
  }
  return normalized;
}

export function jurisdictionCountryFromCode(code?: string | null) {
  const normalized = upper(code);
  if (normalized.startsWith("US-")) return "US";
  if (normalized.startsWith("AU-")) return "AU";
  if (normalized.startsWith("UK-")) return "UK";
  return "";
}

export function resolveJurisdictionComplianceProfile(input: {
  countryCode?: string | null;
  stateCode?: string | null;
  jurisdictionCode?: string | null;
  jurisdictionName?: string | null;
  complianceLevel?: string | null;
  complianceMode?: string | null;
  complianceUiMode?: string | null;
  reportRequirementMode?: string | null;
  regulatoryFamily?: string | null;
  reportRequired?: boolean | null;
  requiresNotification?: boolean | null;
  requiresNotificationAnnual?: boolean | null;
  requiresAttendanceTracking?: boolean | null;
  requiresInstructionHours?: boolean | null;
  requiredInstructionHoursPerYear?: number | null;
  requiredInstructionDaysPerYear?: number | null;
  requiresSubjectList?: boolean | null;
  requiresYearlyPlan?: boolean | null;
  requiresQuarterlyReports?: boolean | null;
  requiresAnnualAssessment?: boolean | null;
  requiresStandardizedTesting?: boolean | null;
  requiresProfessionalEvaluation?: boolean | null;
  requiresPortfolio?: boolean | null;
  requiresWorkSamples?: boolean | null;
  requiresParentQualificationCheck?: boolean | null;
  requiresImmunizationRecordOrExemption?: boolean | null;
  requiresSubmissionToAuthority?: boolean | null;
  exportShouldBeBlockedWhenIncomplete?: boolean | null;
  allowsPortfolioInsteadOfTesting?: boolean | null;
  allowsEvaluationInsteadOfTesting?: boolean | null;
}): JurisdictionComplianceProfile {
  const countryCode = upper(input.countryCode || jurisdictionCountryFromCode(input.jurisdictionCode));
  const rawStateCode = upper(input.stateCode || safe(input.jurisdictionCode).split("-")[1]);
  const stateCode = rawStateCode || (countryCode === "US" ? "TX" : "");
  const jurisdictionCode = upper(input.jurisdictionCode || (countryCode && stateCode ? `${countryCode}-${stateCode}` : ""));
  const jurisdictionName =
    safe(input.jurisdictionName) ||
    jurisdictionDisplayLabel(jurisdictionCode) ||
    jurisdictionDisplayLabel(`${countryCode}-${stateCode}`);

  if (countryCode === "US") {
    const profile = usProfile(stateCode || "TX", jurisdictionName || usStateName(stateCode || "TX"));
    const complianceMode = normalizeComplianceMode(
      input.complianceMode || input.complianceUiMode,
      profile.complianceLevel,
    );
    const reportRequirementMode = normalizeReportRequirementMode(
      input.reportRequirementMode,
      complianceMode,
      input.reportRequired ?? profile.reportRequired,
    );
    const reportRequired =
      input.reportRequired ?? (reportRequirementMode === "required" || reportRequirementMode === "conditional");

    return withProfileOverrides(profile, {
      jurisdictionCode,
      jurisdictionName: jurisdictionName || profile.jurisdictionName,
      complianceLevel:
        (input.complianceLevel as ComplianceLevel | null) ||
        profile.complianceLevel,
      complianceMode,
      complianceUiMode: complianceMode,
      reportRequirementMode,
      regulatoryFamily: safe(input.regulatoryFamily) || profile.regulatoryFamily,
      reportRequired,
      requiresNotification:
        input.requiresNotification ?? profile.requiresNotification,
      requiresNotificationAnnual:
        input.requiresNotificationAnnual ?? profile.requiresNotificationAnnual,
      requiresAttendanceTracking:
        input.requiresAttendanceTracking ?? profile.requiresAttendanceTracking,
      requiresInstructionHours:
        input.requiresInstructionHours ?? profile.requiresInstructionHours,
      requiredInstructionHoursPerYear:
        input.requiredInstructionHoursPerYear ?? profile.requiredInstructionHoursPerYear,
      requiredInstructionDaysPerYear:
        input.requiredInstructionDaysPerYear ?? profile.requiredInstructionDaysPerYear,
      requiresSubjectList:
        input.requiresSubjectList ?? profile.requiresSubjectList,
      requiresYearlyPlan:
        input.requiresYearlyPlan ?? profile.requiresYearlyPlan,
      requiresQuarterlyReports:
        input.requiresQuarterlyReports ?? profile.requiresQuarterlyReports,
      requiresAnnualAssessment:
        input.requiresAnnualAssessment ?? profile.requiresAnnualAssessment,
      requiresStandardizedTesting:
        input.requiresStandardizedTesting ?? profile.requiresStandardizedTesting,
      requiresProfessionalEvaluation:
        input.requiresProfessionalEvaluation ?? profile.requiresProfessionalEvaluation,
      requiresPortfolio: input.requiresPortfolio ?? profile.requiresPortfolio,
      requiresWorkSamples:
        input.requiresWorkSamples ?? profile.requiresWorkSamples,
      requiresParentQualificationCheck:
        input.requiresParentQualificationCheck ?? profile.requiresParentQualificationCheck,
      requiresImmunizationRecordOrExemption:
        input.requiresImmunizationRecordOrExemption ??
        profile.requiresImmunizationRecordOrExemption,
      requiresSubmissionToAuthority:
        input.requiresSubmissionToAuthority ?? profile.requiresSubmissionToAuthority,
      exportShouldBeBlockedWhenIncomplete:
        input.exportShouldBeBlockedWhenIncomplete ??
        profile.exportShouldBeBlockedWhenIncomplete,
      allowsPortfolioInsteadOfTesting:
        input.allowsPortfolioInsteadOfTesting ?? profile.allowsPortfolioInsteadOfTesting,
      allowsEvaluationInsteadOfTesting:
        input.allowsEvaluationInsteadOfTesting ?? profile.allowsEvaluationInsteadOfTesting,
    });
  }

  const complianceMode = normalizeComplianceMode(
    input.complianceMode || input.complianceUiMode,
    input.complianceLevel as ComplianceLevel | null || "high",
  );
  const reportRequirementMode = normalizeReportRequirementMode(
    input.reportRequirementMode,
    complianceMode,
    input.reportRequired ?? true,
  );
  const reportRequired =
    input.reportRequired ?? (reportRequirementMode === "required" || reportRequirementMode === "conditional");

  return {
    countryCode: countryCode || "AU",
    stateCode,
    jurisdictionCode: jurisdictionCode || "AU-TAS",
    jurisdictionName: jurisdictionName || "Current jurisdiction",
    complianceLevel:
      (input.complianceLevel as ComplianceLevel | null) || "high",
    complianceMode,
    complianceUiMode: complianceMode,
    reportRequirementMode,
    regulatoryFamily: safe(input.regulatoryFamily) || "australia_home_education",
    reportRequired,
    requiresNotification: input.requiresNotification ?? false,
    requiresNotificationAnnual: input.requiresNotificationAnnual ?? false,
    requiresAttendanceTracking: input.requiresAttendanceTracking ?? false,
    requiresInstructionHours: input.requiresInstructionHours ?? false,
    requiredInstructionHoursPerYear: input.requiredInstructionHoursPerYear ?? null,
    requiredInstructionDaysPerYear: input.requiredInstructionDaysPerYear ?? null,
    requiresSubjectList: input.requiresSubjectList ?? true,
    requiresYearlyPlan: input.requiresYearlyPlan ?? true,
    requiresQuarterlyReports: input.requiresQuarterlyReports ?? false,
    requiresAnnualAssessment: input.requiresAnnualAssessment ?? true,
    requiresStandardizedTesting: input.requiresStandardizedTesting ?? false,
    requiresProfessionalEvaluation: input.requiresProfessionalEvaluation ?? false,
    requiresPortfolio: input.requiresPortfolio ?? true,
    requiresWorkSamples: input.requiresWorkSamples ?? true,
    requiresParentQualificationCheck: input.requiresParentQualificationCheck ?? false,
    requiresImmunizationRecordOrExemption: input.requiresImmunizationRecordOrExemption ?? false,
    requiresSubmissionToAuthority: input.requiresSubmissionToAuthority ?? true,
    exportShouldBeBlockedWhenIncomplete: input.exportShouldBeBlockedWhenIncomplete ?? true,
    allowsPortfolioInsteadOfTesting: input.allowsPortfolioInsteadOfTesting ?? true,
    allowsEvaluationInsteadOfTesting: input.allowsEvaluationInsteadOfTesting ?? true,
  };
}

export function complianceModeLabel(profile: {
  complianceLevel?: string | null;
  complianceUiMode?: string | null;
  reportRequired?: boolean | null;
  jurisdictionName?: string | null;
}) {
  if (profile.complianceUiMode === "portfolio") return "Portfolio documentation mode";
  if (profile.complianceUiMode === "guided") return "Guided compliance mode";
  if (profile.reportRequired === false) return "Documentation mode";
  if (profile.complianceLevel === "moderate") return "Guided compliance mode";
  return "Strict compliance mode";
}

export function complianceModeSentence(profile: {
  complianceLevel?: string | null;
  complianceUiMode?: string | null;
  reportRequired?: boolean | null;
  jurisdictionName?: string | null;
}) {
  const name = safe(profile.jurisdictionName) || "This jurisdiction";
  if (profile.complianceUiMode === "portfolio" || profile.reportRequired === false) {
    return `${name} is running in portfolio-first documentation mode. Formal reporting is lighter here, so the focus stays on steady records and visible learning evidence.`;
  }
  if (profile.complianceUiMode === "guided" || profile.complianceLevel === "moderate") {
    return `${name} is running in guided compliance mode. Notification, attendance, and record keeping matter, but the workflow stays calmer than a strict filing pathway.`;
  }
  return `${name} is running in strict compliance mode. Required filings, reporting, and supporting records need to be kept in step with the cycle.`;
}

export function getRequiredArtifactSeeds(profile: JurisdictionComplianceProfile): RequiredArtifactSeed[] {
  const frequencyAnnual = profile.requiresNotificationAnnual ? "Annual" : "Per cycle";
  if (profile.complianceUiMode === "portfolio" || profile.reportRequired === false) {
    return [
      {
        artifactType: "portfolio",
        code: "portfolio_record",
        label: "Portfolio record",
        shortNote: "Core portfolio evidence that keeps the learning story visible.",
        frequency: "Ongoing",
        category: "portfolio",
        displayOrder: 1,
      },
      {
        artifactType: "work_samples",
        code: "work_samples",
        label: "Work samples",
        shortNote: "Representative samples that make the documentation feel grounded.",
        frequency: "Ongoing",
        category: "evidence",
        displayOrder: 2,
      },
      {
        artifactType: "subject_list",
        code: "subject_list",
        label: "Subject list",
        shortNote: "A simple subject list to keep coverage visible.",
        frequency: "Per cycle",
        category: "plan",
        displayOrder: 3,
      },
      {
        artifactType: "learning_log",
        code: "learning_log",
        label: "Learning log",
        shortNote: "A calm running record of learning activity.",
        frequency: "Ongoing",
        category: "evidence",
        displayOrder: 4,
      },
    ];
  }

  if (profile.complianceLevel === "high") {
    return [
      {
        artifactType: "notification",
        code: "notice_of_intent",
        label: "Notice of intent",
        shortNote: "The jurisdiction notice or registration filing needed to keep the cycle active.",
        frequency: frequencyAnnual,
        category: "notification",
        displayOrder: 1,
      },
      {
        artifactType: "attendance",
        code: "attendance_record",
        label: "Attendance record",
        shortNote: "A running record of days or hours if the state expects them.",
        frequency: "Weekly",
        category: "attendance",
        displayOrder: 2,
      },
      {
        artifactType: "hours",
        code: "instruction_hours",
        label: "Instructional hours",
        shortNote: "Instructional hours or days required by the state.",
        frequency: "Weekly",
        category: "attendance",
        displayOrder: 3,
      },
      {
        artifactType: "subject_list",
        code: "subject_list",
        label: "Subject list",
        shortNote: "A current subject list that shows what is being taught.",
        frequency: "Per cycle",
        category: "plan",
        displayOrder: 4,
      },
      {
        artifactType: "yearly_plan",
        code: "yearly_plan",
        label: "Yearly plan",
        shortNote: "A yearly plan or program outline for the current cycle.",
        frequency: "Annual",
        category: "plan",
        displayOrder: 5,
      },
      {
        artifactType: "quarterly_report",
        code: "quarterly_report",
        label: "Quarterly report",
        shortNote: "A periodic report or update when the jurisdiction expects one.",
        frequency: "Quarterly",
        category: "report",
        displayOrder: 6,
      },
      {
        artifactType: "assessment",
        code: "annual_assessment",
        label: "Annual assessment",
        shortNote: "An annual assessment, review, or evaluation record.",
        frequency: "Annual",
        category: "assessment",
        displayOrder: 7,
      },
      {
        artifactType: "portfolio",
        code: "portfolio_record",
        label: "Portfolio record",
        shortNote: "Representative work samples and documentation to support the record.",
        frequency: "Ongoing",
        category: "portfolio",
        displayOrder: 8,
      },
    ];
  }

  return [
    {
      artifactType: "notification",
      code: "annual_notice",
      label: "Annual notice",
      shortNote: "A simple annual notice if the state expects one.",
      frequency: frequencyAnnual,
      category: "notification",
      displayOrder: 1,
    },
    {
      artifactType: "attendance",
      code: "attendance_record",
      label: "Attendance record",
      shortNote: "Attendance or hour tracking if the state expects it.",
      frequency: "Weekly",
      category: "attendance",
      displayOrder: 2,
    },
    {
      artifactType: "subject_list",
      code: "subject_list",
      label: "Subject list",
      shortNote: "A practical subject list for the current year.",
      frequency: "Per cycle",
      category: "plan",
      displayOrder: 3,
    },
    {
      artifactType: "portfolio",
      code: "portfolio_record",
      label: "Portfolio record",
      shortNote: "A growing set of work samples and portfolio notes.",
      frequency: "Ongoing",
      category: "portfolio",
      displayOrder: 4,
    },
    {
      artifactType: "assessment",
      code: "annual_assessment",
      label: "Annual assessment",
      shortNote: "A light evaluation or assessment record if the state asks for it.",
      frequency: "Annual",
      category: "assessment",
      displayOrder: 5,
    },
  ];
}
