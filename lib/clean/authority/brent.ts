import type { FamilyProfile } from "@/lib/clean/family/types";

type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

export const BRENT_COUNTRY_CODE = "UK";
export const BRENT_COUNTRY_LABEL = "United Kingdom";
export const BRENT_NATION_CODE = "england";
export const BRENT_NATION_LABEL = "England";
export const BRENT_LOCAL_AUTHORITY_CODE = "brent-council";
export const BRENT_LOCAL_AUTHORITY_LABEL = "Brent Council";
export const BRENT_JURISDICTION_CODE = "england-brent-council";
export const BRENT_REPORTING_PATHWAY_CODE = "brent-ehcp-annual-review-evidence-pack";
export const BRENT_REPORTING_MODE_STORAGE_CODE = "compliance-support";
export const BRENT_REPORTING_PATHWAY_LABEL = "Brent EHCP Annual Review Evidence Pack";
export const BRENT_REPORTING_HELPER_COPY =
  "Choose this if you want MyLearna to prepare outputs using Brent-aligned annual review evidence prompts.";
export const BRENT_OUTPUT_TITLE = "Brent EHCP Annual Review Evidence Pack";
export const BRENT_OUTPUT_COPY =
  "Create a structured evidence pack aligned to Brent Council's annual review expectations.";
export const BRENT_OUTPUT_SECONDARY_COPY =
  "This pack uses learner details, captured evidence, portfolio highlights, progress notes, parent views, young person views, and next-step planning where available.";
export const BRENT_EMPTY_EVIDENCE_COPY = "No learning evidence has been captured yet.";
export const BRENT_DISCLAIMER =
  "This evidence pack is designed to help families organise learning evidence in a structure aligned to Brent Council's annual review expectations. Families and professionals should check Brent Council's current requirements before submitting.";
export const BRENT_FOOTER_DISCLAIMER =
  "Families and professionals should check Brent Council's current requirements before submitting records.";

export const UNITED_KINGDOM_NATION_OPTIONS: SelectOption[] = [
  { value: "england", label: "England" },
  { value: "scotland", label: "Scotland" },
  { value: "wales", label: "Wales" },
  { value: "northern-ireland", label: "Northern Ireland" },
];

export const BRENT_LOCAL_AUTHORITY_OPTIONS: SelectOption[] = [
  { value: "", label: "Not selected" },
  { value: BRENT_LOCAL_AUTHORITY_CODE, label: BRENT_LOCAL_AUTHORITY_LABEL },
];

export const BRENT_REPORTING_PATHWAY_OPTION: SelectOption = {
  value: BRENT_REPORTING_PATHWAY_CODE,
  label: BRENT_REPORTING_PATHWAY_LABEL,
  description: BRENT_REPORTING_HELPER_COPY,
};

type AuthoritySelectionLike = Pick<
  FamilyProfile,
  "countryCode" | "jurisdictionCode" | "reportingMode"
>;

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeJurisdiction(value: string | null | undefined) {
  return safe(value).toLowerCase();
}

export function decodeUnitedKingdomNationCode(jurisdictionCode: string | null | undefined) {
  const code = normalizeJurisdiction(jurisdictionCode);
  if (code.startsWith("england")) return "england";
  if (code.startsWith("scotland")) return "scotland";
  if (code.startsWith("wales")) return "wales";
  if (code.startsWith("northern-ireland")) return "northern-ireland";
  return "";
}

export function decodeUnitedKingdomLocalAuthorityCode(
  jurisdictionCode: string | null | undefined,
) {
  const code = normalizeJurisdiction(jurisdictionCode);
  if (code === BRENT_JURISDICTION_CODE) return BRENT_LOCAL_AUTHORITY_CODE;
  return "";
}

export function encodeUnitedKingdomJurisdictionCode(
  nationCode: string | null | undefined,
  localAuthorityCode: string | null | undefined,
) {
  const nation = safe(nationCode).toLowerCase();
  const localAuthority = safe(localAuthorityCode).toLowerCase();

  if (!nation) return "";
  if (nation === BRENT_NATION_CODE && localAuthority === BRENT_LOCAL_AUTHORITY_CODE) {
    return BRENT_JURISDICTION_CODE;
  }

  return nation;
}

export function getUnitedKingdomLocalAuthorityOptions(nationCode: string) {
  return nationCode === BRENT_NATION_CODE ? BRENT_LOCAL_AUTHORITY_OPTIONS : [];
}

export function getUnitedKingdomNationLabel(nationCode: string | null | undefined) {
  const match = UNITED_KINGDOM_NATION_OPTIONS.find((option) => option.value === nationCode);
  return match?.label || safe(nationCode) || "Not set";
}

export function getUnitedKingdomLocalAuthorityLabel(
  localAuthorityCode: string | null | undefined,
) {
  if (!safe(localAuthorityCode)) return "Not set";
  const match = BRENT_LOCAL_AUTHORITY_OPTIONS.find(
    (option) => option.value === localAuthorityCode,
  );
  return match?.label || safe(localAuthorityCode);
}

export function isBrentLocalAuthoritySelection(input: {
  countryCode: string | null | undefined;
  jurisdictionCode: string | null | undefined;
}) {
  return (
    safe(input.countryCode).toUpperCase() === BRENT_COUNTRY_CODE &&
    decodeUnitedKingdomNationCode(input.jurisdictionCode) === BRENT_NATION_CODE &&
    decodeUnitedKingdomLocalAuthorityCode(input.jurisdictionCode) ===
      BRENT_LOCAL_AUTHORITY_CODE
  );
}

export function getCanonicalAuthorityReportingMode(
  input:
    | Partial<AuthoritySelectionLike>
    | {
        countryCode?: string | null | undefined;
        jurisdictionCode?: string | null | undefined;
        reportingMode?: string | null | undefined;
      }
    | null
    | undefined,
) {
  const reportingMode = safe(input?.reportingMode);

  if (
    isBrentLocalAuthoritySelection({
      countryCode: input?.countryCode,
      jurisdictionCode: input?.jurisdictionCode,
    }) &&
    reportingMode === BRENT_REPORTING_MODE_STORAGE_CODE
  ) {
    return BRENT_REPORTING_PATHWAY_CODE;
  }

  return reportingMode;
}

export function encodeAuthorityReportingModeForSave(
  input:
    | Partial<AuthoritySelectionLike>
    | {
        countryCode?: string | null | undefined;
        jurisdictionCode?: string | null | undefined;
        reportingMode?: string | null | undefined;
      }
    | null
    | undefined,
) {
  const reportingMode = safe(input?.reportingMode);

  if (
    reportingMode === BRENT_REPORTING_PATHWAY_CODE &&
    isBrentLocalAuthoritySelection({
      countryCode: input?.countryCode,
      jurisdictionCode: input?.jurisdictionCode,
    })
  ) {
    return BRENT_REPORTING_MODE_STORAGE_CODE;
  }

  return reportingMode;
}

export function isBrentReportingPathwayMode(reportingMode: string | null | undefined) {
  const mode = safe(reportingMode);
  return mode === BRENT_REPORTING_PATHWAY_CODE || mode === BRENT_REPORTING_MODE_STORAGE_CODE;
}

export function isBrentEhcpPathway(
  profile:
    | Pick<FamilyProfile, "countryCode" | "jurisdictionCode" | "reportingMode">
    | null
    | undefined,
) {
  if (!profile) return false;

  return (
    isBrentLocalAuthoritySelection(profile) &&
    getCanonicalAuthorityReportingMode(profile) === BRENT_REPORTING_PATHWAY_CODE
  );
}

export const isBrentAuthorityTemplateActive = isBrentEhcpPathway;

export function getAuthorityDisplayValues(
  profile:
    | Pick<FamilyProfile, "countryCode" | "jurisdictionCode" | "reportingMode">
    | null
    | undefined,
) {
  const nationCode = decodeUnitedKingdomNationCode(profile?.jurisdictionCode);
  const localAuthorityCode = decodeUnitedKingdomLocalAuthorityCode(
    profile?.jurisdictionCode,
  );
  const reportingModeCode = getCanonicalAuthorityReportingMode(profile);
  const brentPathwayActive = isBrentEhcpPathway(profile);

  return {
    countryCode: safe(profile?.countryCode).toUpperCase(),
    countryLabel:
      safe(profile?.countryCode).toUpperCase() === BRENT_COUNTRY_CODE
        ? BRENT_COUNTRY_LABEL
        : "Not set",
    nationCode,
    nationLabel: getUnitedKingdomNationLabel(nationCode),
    localAuthorityCode,
    localAuthorityLabel: getUnitedKingdomLocalAuthorityLabel(localAuthorityCode),
    reportingModeCode,
    reportingModeLabel: brentPathwayActive
      ? BRENT_REPORTING_PATHWAY_LABEL
      : reportingModeCode || "Not set",
    isBrentEhcpPathway: brentPathwayActive,
  };
}

export function getBrentPathwaySelectionSummary(
  profile:
    | Pick<FamilyProfile, "countryCode" | "jurisdictionCode" | "reportingMode">
    | null
    | undefined,
) {
  const authorityDisplayValues = getAuthorityDisplayValues(profile);

  return {
    countryLabel: authorityDisplayValues.countryLabel,
    nationCode: authorityDisplayValues.nationCode,
    nationLabel: authorityDisplayValues.nationLabel,
    localAuthorityCode: authorityDisplayValues.localAuthorityCode,
    localAuthorityLabel: authorityDisplayValues.localAuthorityLabel,
    reportingPathwayCode: authorityDisplayValues.reportingModeCode,
    reportingPathwayLabel: authorityDisplayValues.reportingModeLabel,
    isBrentAuthorityTemplateActive: authorityDisplayValues.isBrentEhcpPathway,
  };
}
