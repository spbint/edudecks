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

export class FamilyBillingEligibilityError extends Error {
  constructor(
    public readonly code:
      | "billing_australia_only"
      | "billing_jurisdiction_required",
    message: string,
  ) {
    super(message);
    this.name = "FamilyBillingEligibilityError";
  }
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizedJurisdiction(value: unknown): AustralianBillingJurisdiction | null {
  const candidate = safe(value).toUpperCase().replace(/^AU-/, "");
  return Object.prototype.hasOwnProperty.call(AUSTRALIAN_BILLING_TIME_ZONES, candidate)
    ? (candidate as AustralianBillingJurisdiction)
    : null;
}

export function resolveAustralianFamilyBillingTimeZone(
  profile: FamilyBillingProfile,
) {
  if (safe(profile.countryCode).toUpperCase() !== "AU") {
    throw new FamilyBillingEligibilityError(
      "billing_australia_only",
      "Media storage purchases are currently available to Australian families only.",
    );
  }

  const jurisdiction = normalizedJurisdiction(profile.jurisdictionCode);
  if (!jurisdiction) {
    throw new FamilyBillingEligibilityError(
      "billing_jurisdiction_required",
      "Update your family settings with your Australian state or territory before choosing media storage.",
    );
  }

  return AUSTRALIAN_BILLING_TIME_ZONES[jurisdiction];
}

export function familyBillingDateKey(
  profile: FamilyBillingProfile,
  now = new Date(),
) {
  const timeZone = resolveAustralianFamilyBillingTimeZone(profile);
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
