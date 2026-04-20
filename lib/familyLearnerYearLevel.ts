export const FAMILY_YEAR_LEVEL_OPTIONS = [
  "Pre-K",
  "K",
  "Prep",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "Other",
] as const;

export type FamilyYearLevelOption = (typeof FAMILY_YEAR_LEVEL_OPTIONS)[number];

const OPTION_TO_STORED_LEVEL: Record<FamilyYearLevelOption, number> = {
  "Pre-K": -2,
  K: -1,
  Prep: 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  Other: 99,
};

const STORED_LEVEL_TO_OPTION = new Map<number, FamilyYearLevelOption>(
  Object.entries(OPTION_TO_STORED_LEVEL).map(([label, value]) => [
    value,
    label as FamilyYearLevelOption,
  ]),
);

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function parseNumericYearLevel(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const clean = safe(value);
  if (!clean) return null;

  const stripped = clean.replace(/^year\s+/i, "");
  const numeric = Number(stripped);
  return Number.isFinite(numeric) ? numeric : null;
}

export function familyYearLevelOptionFromStored(
  value: unknown,
): FamilyYearLevelOption | "" {
  const numeric = parseNumericYearLevel(value);
  if (numeric != null) {
    return STORED_LEVEL_TO_OPTION.get(numeric) ?? "Other";
  }

  const clean = safe(value);
  if (!clean) return "";

  const directMatch = FAMILY_YEAR_LEVEL_OPTIONS.find(
    (option) => option.toLowerCase() === clean.toLowerCase(),
  );
  if (directMatch) return directMatch;

  if (/^year\s+\d+$/i.test(clean)) {
    return familyYearLevelOptionFromStored(clean.replace(/^year\s+/i, ""));
  }

  if (clean.toLowerCase() === "foundation") {
    return "Prep";
  }

  return "Other";
}

export function familyYearLevelToStoredNumber(value: unknown) {
  const option = familyYearLevelOptionFromStored(value);
  return option ? OPTION_TO_STORED_LEVEL[option] ?? null : null;
}

export function familyYearLevelLabelFromStored(value: unknown) {
  const option = familyYearLevelOptionFromStored(value);
  return option || "";
}
