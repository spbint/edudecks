import { describe, expect, it } from "vitest";
import {
  FamilyBillingEligibilityError,
  familyBillingDateKey,
  resolveAustralianFamilyBillingTimeZone,
} from "@/lib/billing/familyBillingEligibility";

describe("family billing eligibility", () => {
  it("uses the family jurisdiction rather than a universal Hobart date", () => {
    const instant = new Date("2027-01-01T13:30:00.000Z");

    expect(familyBillingDateKey({ countryCode: "AU", jurisdictionCode: "WA" }, instant)).toBe("2027-01-01");
    expect(familyBillingDateKey({ countryCode: "AU", jurisdictionCode: "QLD" }, instant)).toBe("2027-01-01");
    expect(familyBillingDateKey({ countryCode: "AU", jurisdictionCode: "TAS" }, instant)).toBe("2027-01-02");
    expect(familyBillingDateKey({ countryCode: "AU", jurisdictionCode: "NSW" }, instant)).toBe("2027-01-02");
    expect(familyBillingDateKey({ countryCode: "AU", jurisdictionCode: "VIC" }, instant)).toBe("2027-01-02");
  });

  it("maps every supported Australian jurisdiction to its own trusted IANA timezone", () => {
    expect(resolveAustralianFamilyBillingTimeZone({ countryCode: "AU", jurisdictionCode: "AU-WA" }))
      .toBe("Australia/Perth");
    expect(resolveAustralianFamilyBillingTimeZone({ countryCode: "AU", jurisdictionCode: "QLD" }))
      .toBe("Australia/Brisbane");
    expect(resolveAustralianFamilyBillingTimeZone({ countryCode: "AU", jurisdictionCode: "SA" }))
      .toBe("Australia/Adelaide");
  });

  it("rejects non-Australian and incomplete family billing geography", () => {
    try {
      resolveAustralianFamilyBillingTimeZone({ countryCode: "GB", jurisdictionCode: "ENG" });
      throw new Error("Expected non-Australian family to be rejected.");
    } catch (error) {
      expect(error).toBeInstanceOf(FamilyBillingEligibilityError);
      expect((error as FamilyBillingEligibilityError).code).toBe("billing_australia_only");
    }
    try {
      resolveAustralianFamilyBillingTimeZone({ countryCode: "AU", jurisdictionCode: null });
      throw new Error("Expected missing jurisdiction to be rejected.");
    } catch (error) {
      expect(error).toBeInstanceOf(FamilyBillingEligibilityError);
      expect((error as FamilyBillingEligibilityError).code).toBe("billing_jurisdiction_required");
    }
  });
});
