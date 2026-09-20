import { describe, expect, it } from "vitest";
import {
  FamilyBillingEligibilityError,
  familyBillingDateKey,
  resolveAustralianFamilyBillingTimeZone,
  resolveFamilyBillingMarket,
} from "@/lib/billing/familyBillingEligibility";

describe("family billing eligibility", () => {
  it("uses trusted jurisdiction timezones rather than a universal date", () => {
    const instant = new Date("2027-01-01T13:30:00.000Z");
    expect(familyBillingDateKey({ countryCode: "AU", jurisdictionCode: "WA" }, instant)).toBe("2027-01-01");
    expect(familyBillingDateKey({ countryCode: "AU", jurisdictionCode: "TAS" }, instant)).toBe("2027-01-02");
    expect(familyBillingDateKey({ countryCode: "US", jurisdictionCode: "CA" }, instant)).toBe("2027-01-01");
    expect(familyBillingDateKey({ countryCode: "UK", jurisdictionCode: "england" }, instant)).toBe("2027-01-01");
  });

  it("maps every supported market to only its approved billing currency", () => {
    expect(resolveAustralianFamilyBillingTimeZone({ countryCode: "AU", jurisdictionCode: "AU-WA" }))
      .toBe("Australia/Perth");
    expect(resolveFamilyBillingMarket({ countryCode: "AU", jurisdictionCode: "QLD" })).toMatchObject({ currency: "AUD" });
    expect(resolveFamilyBillingMarket({ countryCode: "US", jurisdictionCode: "NY" })).toMatchObject({ currency: "USD", timeZone: "America/New_York" });
    expect(resolveFamilyBillingMarket({ countryCode: "UK", jurisdictionCode: "scotland" })).toMatchObject({ currency: "GBP", timeZone: "Europe/London" });
  });

  it("rejects unsupported countries and incomplete required jurisdiction", () => {
    for (const profile of [
      { countryCode: "GB", jurisdictionCode: "ENG" },
      { countryCode: "INTL", jurisdictionCode: null },
      { countryCode: null, jurisdictionCode: null },
      { countryCode: "US", jurisdictionCode: null },
      { countryCode: "AU", jurisdictionCode: null },
    ]) {
      expect(() => resolveFamilyBillingMarket(profile)).toThrow(FamilyBillingEligibilityError);
    }
  });
});
