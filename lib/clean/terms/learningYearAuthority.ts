import type { CleanAcademicYear } from "@/lib/clean/terms/types";

export const LEARNING_YEAR_TIME_ZONE_OPTIONS = [
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Broken_Hill",
  "Australia/Darwin",
  "Australia/Hobart",
  "Australia/Lord_Howe",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/London",
  "America/Anchorage",
  "America/Boise",
  "America/Chicago",
  "America/Denver",
  "America/Detroit",
  "America/Indiana/Indianapolis",
  "America/Kentucky/Louisville",
  "America/Los_Angeles",
  "America/New_York",
  "America/North_Dakota/Center",
  "America/Phoenix",
  "Pacific/Honolulu",
] as const;

const AMBIGUOUS_AU_JURISDICTIONS = new Set(["NSW"]);
const AMBIGUOUS_US_JURISDICTIONS = new Set([
  "AK", "AZ", "FL", "ID", "IN", "KS", "KY", "MI", "ND", "NE", "NV", "OR", "SD", "TN", "TX",
]);

const AU_TIME_ZONES: Record<string, string> = {
  ACT: "Australia/Sydney",
  NT: "Australia/Darwin",
  QLD: "Australia/Brisbane",
  SA: "Australia/Adelaide",
  TAS: "Australia/Hobart",
  VIC: "Australia/Melbourne",
  WA: "Australia/Perth",
};

const US_TIME_ZONES: Record<string, string> = {
  AL: "America/Chicago", AR: "America/Chicago", CA: "America/Los_Angeles",
  CO: "America/Denver", CT: "America/New_York", DC: "America/New_York",
  DE: "America/New_York", GA: "America/New_York", HI: "Pacific/Honolulu",
  IA: "America/Chicago", IL: "America/Chicago", LA: "America/Chicago",
  MA: "America/New_York", MD: "America/New_York", ME: "America/New_York",
  MN: "America/Chicago", MO: "America/Chicago", MS: "America/Chicago",
  MT: "America/Denver", NC: "America/New_York", NH: "America/New_York",
  NJ: "America/New_York", NM: "America/Denver", NY: "America/New_York",
  OH: "America/New_York", OK: "America/Chicago", PA: "America/New_York",
  RI: "America/New_York", SC: "America/New_York", UT: "America/Denver",
  VA: "America/New_York", VT: "America/New_York", WA: "America/Los_Angeles",
  WI: "America/Chicago", WV: "America/New_York", WY: "America/Denver",
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizedJurisdiction(value: unknown) {
  return safe(value).toUpperCase().replace(/^(AU|US)-/, "");
}

export function isValidIanaTimeZone(value: unknown) {
  const timeZone = safe(value);
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

export function browserTimeZoneSuggestion() {
  if (typeof Intl === "undefined") return null;
  const timeZone = safe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  return isValidIanaTimeZone(timeZone) ? timeZone : null;
}

export function suggestLearningYearTimeZone(input: {
  countryCode?: string | null;
  jurisdictionCode?: string | null;
  browserTimeZone?: string | null;
}) {
  const countryCode = safe(input.countryCode).toUpperCase();
  const jurisdictionCode = normalizedJurisdiction(input.jurisdictionCode);
  if (countryCode === "UK") return "Europe/London";
  if (countryCode === "AU" && !AMBIGUOUS_AU_JURISDICTIONS.has(jurisdictionCode)) {
    return AU_TIME_ZONES[jurisdictionCode] ?? null;
  }
  if (countryCode === "US" && !AMBIGUOUS_US_JURISDICTIONS.has(jurisdictionCode)) {
    return US_TIME_ZONES[jurisdictionCode] ?? null;
  }
  const browserTimeZone = safe(input.browserTimeZone);
  return isValidIanaTimeZone(browserTimeZone) ? browserTimeZone : null;
}

export function localDateKey(at: Date, timeZone: string) {
  if (!isValidIanaTimeZone(timeZone) || !Number.isFinite(at.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function legacyLocalDateKey(at: Date) {
  if (!Number.isFinite(at.getTime())) return null;
  const year = at.getFullYear();
  const month = String(at.getMonth() + 1).padStart(2, "0");
  const day = String(at.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type LearningYearResolutionSource =
  | "confirmed_timezone"
  | "unconfirmed_timezone"
  | "legacy_date";

export function resolveCurrentLearningYearWithSource<
  T extends Pick<CleanAcademicYear, "startsOn" | "endsOn" | "timeZone">
    & Partial<Pick<CleanAcademicYear, "timeZoneConfirmedAt" | "isTimeZoneConfirmed">>,
>(academicYears: T[], at = new Date()) {
  for (const academicYear of academicYears) {
    const validTimeZone = Boolean(
      academicYear.timeZone && isValidIanaTimeZone(academicYear.timeZone),
    );
    const dateKey = validTimeZone
      ? localDateKey(at, academicYear.timeZone!)
      : legacyLocalDateKey(at);
    if (!dateKey || academicYear.startsOn > dateKey || academicYear.endsOn < dateKey) continue;

    const source: LearningYearResolutionSource = validTimeZone
      ? academicYear.isTimeZoneConfirmed || academicYear.timeZoneConfirmedAt
        ? "confirmed_timezone"
        : "unconfirmed_timezone"
      : "legacy_date";
    return { academicYear, source };
  }
  return null;
}

export function resolveCurrentLearningYear<
  T extends Pick<CleanAcademicYear, "startsOn" | "endsOn" | "timeZone">
    & Partial<Pick<CleanAcademicYear, "timeZoneConfirmedAt" | "isTimeZoneConfirmed">>,
>(
  academicYears: T[],
  at = new Date(),
) {
  return resolveCurrentLearningYearWithSource(academicYears, at)?.academicYear ?? null;
}

export function learningYearsOverlap(
  left: Pick<CleanAcademicYear, "startsOn" | "endsOn">,
  right: Pick<CleanAcademicYear, "startsOn" | "endsOn">,
) {
  return left.startsOn <= right.endsOn && right.startsOn <= left.endsOn;
}

type LearningYearAuthoritySnapshot = {
  familyId: string;
  startsOn: string;
  endsOn: string;
  countryCode: string | null;
  jurisdictionCode: string | null;
  timeZone: string | null;
  timeZoneConfirmedAt: string | null;
};

export function dependentLearningYearAuthorityChangeAllowed(input: {
  hasDependentFacts: boolean;
  previous: LearningYearAuthoritySnapshot;
  next: LearningYearAuthoritySnapshot;
}) {
  const { previous, next } = input;
  if (next.familyId !== previous.familyId) return false;
  if (!input.hasDependentFacts) return true;
  if (
    next.startsOn !== previous.startsOn
    || next.endsOn !== previous.endsOn
    || next.countryCode !== previous.countryCode
    || next.jurisdictionCode !== previous.jurisdictionCode
  ) return false;
  if (previous.timeZoneConfirmedAt) {
    return next.timeZone === previous.timeZone
      && next.timeZoneConfirmedAt === previous.timeZoneConfirmedAt;
  }
  if (next.timeZone !== previous.timeZone && !next.timeZoneConfirmedAt) return false;
  return true;
}

export function dependentLearningYearDeleteAllowed(hasDependentFacts: boolean) {
  return !hasDependentFacts;
}

function addCalendarDay(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1));
  if (!Number.isFinite(date.getTime())) return null;
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function zonedParts(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA-u-hc-h23", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function learningYearCutoffUtc(input: {
  endsOn: string;
  timeZone: string | null | undefined;
  timeZoneConfirmedAt: string | null | undefined;
}) {
  const timeZone = safe(input.timeZone);
  if (!input.timeZoneConfirmedAt || !isValidIanaTimeZone(timeZone)) return null;
  const nextDay = addCalendarDay(input.endsOn);
  if (!nextDay) return null;

  const desiredWallClock = Date.UTC(nextDay.year, nextDay.month - 1, nextDay.day, 0, 0, 0);
  let candidate = desiredWallClock;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = zonedParts(new Date(candidate), timeZone);
    const actualWallClock = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const difference = actualWallClock - desiredWallClock;
    candidate -= difference;
    if (difference === 0) break;
  }

  const confirmed = zonedParts(new Date(candidate), timeZone);
  if (
    confirmed.year !== nextDay.year || confirmed.month !== nextDay.month ||
    confirmed.day !== nextDay.day || confirmed.hour !== 0 ||
    confirmed.minute !== 0 || confirmed.second !== 0
  ) {
    return null;
  }
  return new Date(candidate);
}
