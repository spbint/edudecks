import { describe, expect, it } from "vitest";
import {
  dependentLearningYearAuthorityChangeAllowed,
  dependentLearningYearDeleteAllowed,
  isValidIanaTimeZone,
  learningYearCutoffUtc,
  learningYearsOverlap,
  localDateKey,
  resolveCurrentLearningYear,
  resolveCurrentLearningYearWithSource,
  suggestLearningYearTimeZone,
} from "./learningYearAuthority";

function year(overrides: Partial<{ startsOn: string; endsOn: string; timeZone: string | null }> = {}) {
  return {
    startsOn: "2027-01-01",
    endsOn: "2027-12-31",
    timeZone: "Australia/Hobart",
    ...overrides,
  };
}

describe("Learning Year timezone authority", () => {
  it("accepts IANA timezones and rejects invalid values", () => {
    expect(isValidIanaTimeZone("Australia/Hobart")).toBe(true);
    expect(isValidIanaTimeZone("America/New_York")).toBe(true);
    expect(isValidIanaTimeZone("Australia/Tasmania-ish")).toBe(false);
  });

  it("does not guess ambiguous geography without a browser suggestion", () => {
    expect(suggestLearningYearTimeZone({ countryCode: "AU", jurisdictionCode: "NSW" })).toBeNull();
    expect(suggestLearningYearTimeZone({ countryCode: "US", jurisdictionCode: "TX" })).toBeNull();
    expect(suggestLearningYearTimeZone({ countryCode: "AU", jurisdictionCode: "TAS" })).toBe("Australia/Hobart");
    expect(suggestLearningYearTimeZone({
      countryCode: "US",
      jurisdictionCode: "TX",
      browserTimeZone: "America/Denver",
    })).toBe("America/Denver");
  });

  it("resolves one inclusive current year using each year's local date", () => {
    const instant = new Date("2026-12-31T13:30:00.000Z");
    expect(localDateKey(instant, "Australia/Hobart")).toBe("2027-01-01");
    expect(localDateKey(instant, "America/Los_Angeles")).toBe("2026-12-31");
    expect(resolveCurrentLearningYear([
      year(),
      year({ startsOn: "2028-01-01", endsOn: "2028-12-31" }),
    ], instant)?.startsOn).toBe("2027-01-01");
    expect(resolveCurrentLearningYear([year()], new Date("2028-01-01T12:00:00.000Z"))).toBeNull();
  });

  it("marks confirmed and unconfirmed timezone resolution separately", () => {
    const instant = new Date("2027-06-01T12:00:00.000Z");
    expect(resolveCurrentLearningYearWithSource([
      { ...year(), timeZoneConfirmedAt: "2027-01-01T00:00:00.000Z" },
    ], instant)?.source).toBe("confirmed_timezone");
    expect(resolveCurrentLearningYearWithSource([
      { ...year(), timeZoneConfirmedAt: null },
    ], instant)?.source).toBe("unconfirmed_timezone");
  });

  it("keeps a NULL-timezone legacy year current only through the transitional non-destructive fallback", () => {
    const legacyYear = year({ timeZone: null });
    const resolution = resolveCurrentLearningYearWithSource(
      [legacyYear],
      new Date("2027-06-01T12:00:00.000Z"),
    );
    expect(resolution?.academicYear).toBe(legacyYear);
    expect(resolution?.source).toBe("legacy_date");
    expect(learningYearCutoffUtc({
      endsOn: legacyYear.endsOn,
      timeZone: null,
      timeZoneConfirmedAt: null,
    })).toBeNull();
  });

  it("keeps adjacent years valid and treats a shared inclusive boundary as overlap", () => {
    expect(learningYearsOverlap(
      year({ startsOn: "2026-01-01", endsOn: "2026-12-31" }),
      year({ startsOn: "2027-01-01", endsOn: "2027-12-31" }),
    )).toBe(false);
    expect(learningYearsOverlap(
      year({ startsOn: "2026-01-01", endsOn: "2026-12-31" }),
      year({ startsOn: "2026-12-31", endsOn: "2027-12-30" }),
    )).toBe(true);
  });

  it("withholds destructive cutoff authority until the timezone is confirmed", () => {
    expect(learningYearCutoffUtc({
      endsOn: "2027-12-31",
      timeZone: "Australia/Hobart",
      timeZoneConfirmedAt: null,
    })).toBeNull();
  });

  it("calculates local next-day midnight and follows DST rather than adding 24 hours", () => {
    const beforeTransition = learningYearCutoffUtc({
      endsOn: "2026-03-07",
      timeZone: "America/New_York",
      timeZoneConfirmedAt: "2026-01-01T00:00:00.000Z",
    });
    const afterTransition = learningYearCutoffUtc({
      endsOn: "2026-03-08",
      timeZone: "America/New_York",
      timeZoneConfirmedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(beforeTransition?.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(afterTransition?.toISOString()).toBe("2026-03-09T04:00:00.000Z");
    expect(afterTransition!.getTime() - beforeTransition!.getTime()).toBe(23 * 60 * 60 * 1000);
  });
});

describe("dependent Learning Year authority transition", () => {
  const previous = {
    familyId: "family-1",
    startsOn: "2027-01-01",
    endsOn: "2027-12-31",
    countryCode: "US",
    jurisdictionCode: "TX",
    timeZone: "America/Chicago",
    timeZoneConfirmedAt: null,
  };

  it("allows an unconfirmed dependent year to confirm its suggestion once", () => {
    expect(dependentLearningYearAuthorityChangeAllowed({
      hasDependentFacts: true,
      previous,
      next: { ...previous, timeZoneConfirmedAt: "2027-02-01T00:00:00.000Z" },
    })).toBe(true);
  });

  it("allows an unconfirmed dependent year to correct and confirm its timezone once", () => {
    expect(dependentLearningYearAuthorityChangeAllowed({
      hasDependentFacts: true,
      previous,
      next: {
        ...previous,
        timeZone: "America/Denver",
        timeZoneConfirmedAt: "2027-02-01T00:00:00.000Z",
      },
    })).toBe(true);
  });

  it("blocks dependent date changes before and after timezone confirmation", () => {
    expect(dependentLearningYearAuthorityChangeAllowed({
      hasDependentFacts: true,
      previous,
      next: { ...previous, endsOn: "2028-01-01", timeZoneConfirmedAt: "2027-02-01T00:00:00.000Z" },
    })).toBe(false);
    const confirmed = { ...previous, timeZoneConfirmedAt: "2027-02-01T00:00:00.000Z" };
    expect(dependentLearningYearAuthorityChangeAllowed({
      hasDependentFacts: true,
      previous: confirmed,
      next: { ...confirmed, startsOn: "2027-01-02" },
    })).toBe(false);
  });

  it("permanently locks a confirmed dependent timezone", () => {
    const confirmed = { ...previous, timeZoneConfirmedAt: "2027-02-01T00:00:00.000Z" };
    expect(dependentLearningYearAuthorityChangeAllowed({
      hasDependentFacts: true,
      previous: confirmed,
      next: { ...confirmed, timeZone: "America/Denver" },
    })).toBe(false);
  });

  it("allows unused authority edits and title-independent dependent updates", () => {
    expect(dependentLearningYearAuthorityChangeAllowed({
      hasDependentFacts: false,
      previous,
      next: { ...previous, startsOn: "2027-02-01", timeZone: "America/Denver" },
    })).toBe(true);
    expect(dependentLearningYearAuthorityChangeAllowed({
      hasDependentFacts: true,
      previous,
      next: previous,
    })).toBe(true);
  });

  it("blocks dependent deletion and permits unused deletion", () => {
    expect(dependentLearningYearDeleteAllowed(true)).toBe(false);
    expect(dependentLearningYearDeleteAllowed(false)).toBe(true);
  });
});
