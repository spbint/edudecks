import {
  getMediaBillingCountry,
  getMediaBillingCurrencyForCountry,
  type MediaBillingCountry,
  type MediaBillingCurrency,
} from "@/lib/billing/mediaProducts";

export type FamilyBillingProfile = {
  countryCode: string | null;
  jurisdictionCode: string | null;
};

export type AustralianBillingJurisdiction =
  | "ACT"
  | "NSW"
  | "NT"
  | "QLD"
  | "SA"
  | "TAS"
  | "VIC"
  | "WA";

export const AUSTRALIAN_BILLING_TIME_ZONES: Record<
  AustralianBillingJurisdiction,
  string
> = {
  ACT: "Australia/Sydney",
  NSW: "Australia/Sydney",
  NT: "Australia/Darwin",
  QLD: "Australia/Brisbane",
  SA: "Australia/Adelaide",
  TAS: "Australia/Hobart",
  VIC: "Australia/Sydney",
  WA: "Australia/Perth",
};

const UNITED_STATES_BILLING_TIME_ZONES: Record<string, string> = {
  AL: "America/Chicago", AK: "America/Anchorage", AZ: "America/Phoenix",
  AR: "America/Chicago", CA: "America/Los_Angeles", CO: "America/Denver",
  CT: "America/New_York", DE: "America/New_York", FL: "America/New_York",
  GA: "America/New_York", HI: "Pacific/Honolulu", ID: "America/Boise",
  IL: "America/Chicago", IN: "America/Indiana/Indianapolis", IA: "America/Chicago",
  KS: "America/Chicago", KY: "America/Kentucky/Louisville", LA: "America/Chicago",
  ME: "America/New_York", MD: "America/New_York", MA: "America/New_York",
  MI: "America/Detroit", MN: "America/Chicago", MS: "America/Chicago",
  MO: "America/Chicago", MT: "America/Denver", NE: "America/Chicago",
  NV: "America/Los_Angeles", NH: "America/New_York", NJ: "America/New_York",
  NM: "America/Denver", NY: "America/New_York", NC: "America/New_York",
  ND: "America/North_Dakota/Center", OH: "America/New_York", OK: "America/Chicago",
  OR: "America/Los_Angeles", PA: "America/New_York", RI: "America/New_York",
  SC: "America/New_York", SD: "America/Chicago", TN: "America/Chicago",
  TX: "America/Chicago", UT: "America/Denver", VT: "America/New_York",
  VA: "America/New_York", WA: "America/Los_Angeles", WV: "America/New_York",
  WI: "America/Chicago", WY: "America/Denver",
};

export class FamilyBillingEligibilityError extends Error {
  constructor(
    public readonly code: "billing_country_unsupported" | "billing_jurisdiction_required",
    message: string,
  ) {
    super(message);
    this.name = "FamilyBillingEligibilityError";
  }
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizedAustralianJurisdiction(value: unknown): AustralianBillingJurisdiction | null {
  const candidate = safe(value).toUpperCase().replace(/^AU-/, "");
  return Object.prototype.hasOwnProperty.call(AUSTRALIAN_BILLING_TIME_ZONES, candidate)
    ? (candidate as AustralianBillingJurisdiction)
    : null;
}

function requiredJurisdictionTimeZone(
  countryCode: string,
  jurisdictionCode: unknown,
  timeZones: Record<string, string>,
) {
  const jurisdiction = safe(jurisdictionCode).toUpperCase().replace(/^US-/, "");
  const timeZone = timeZones[jurisdiction];
  if (!timeZone) {
    throw new FamilyBillingEligibilityError(
      "billing_jurisdiction_required",
      `Update your family settings with a valid ${countryCode === "AU" ? "Australian state or territory" : "United States state"} before choosing media storage.`,
    );
  }
  return timeZone;
}

export function resolveAustralianFamilyBillingTimeZone(profile: FamilyBillingProfile) {
  if (getMediaBillingCountry(profile.countryCode) !== "AU") {
    throw new FamilyBillingEligibilityError(
      "billing_country_unsupported",
      "Media storage purchases are not available in your country yet.",
    );
  }

  const jurisdiction = normalizedAustralianJurisdiction(profile.jurisdictionCode);
  if (!jurisdiction) {
    throw new FamilyBillingEligibilityError(
      "billing_jurisdiction_required",
      "Update your family settings with your Australian state or territory before choosing media storage.",
    );
  }
  return AUSTRALIAN_BILLING_TIME_ZONES[jurisdiction];
}

export type FamilyBillingMarket = {
  countryCode: MediaBillingCountry;
  currency: MediaBillingCurrency;
  timeZone: string;
};

export function resolveFamilyBillingMarket(profile: FamilyBillingProfile): FamilyBillingMarket {
  const countryCode = getMediaBillingCountry(profile.countryCode);
  const currency = getMediaBillingCurrencyForCountry(profile.countryCode);
  if (!countryCode || !currency) {
    throw new FamilyBillingEligibilityError(
      "billing_country_unsupported",
      "Media storage purchases are not available in your country yet.",
    );
  }

  const timeZone =
    countryCode === "AU"
      ? resolveAustralianFamilyBillingTimeZone(profile)
      : countryCode === "US"
        ? requiredJurisdictionTimeZone("US", profile.jurisdictionCode, UNITED_STATES_BILLING_TIME_ZONES)
        : "Europe/London";

  return { countryCode, currency, timeZone };
}

export function familyBillingDateKey(
  profile: FamilyBillingProfile,
  now = new Date(),
) {
  const { timeZone } = resolveFamilyBillingMarket(profile);
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}
