export type SignupPrefill = {
  version: 1;
  fullName?: string;
  email?: string;
  country?: string;
  stateOrRegion?: string;
  jurisdiction?: string;
  numberOfChildren?: number;
  source?: string;
  createdAt?: string;
};

export const SIGNUP_PREFILL_STORAGE_KEY = "mylearna_signup_prefill_v1";
export const SIGNUP_PREFILL_METADATA_KEY = "mylearna_signup_prefill";

export type SignupPrefillOption = {
  value: string;
  label: string;
};

export const SIGNUP_COUNTRY_OPTIONS: SignupPrefillOption[] = [
  { value: "AU", label: "Australia" },
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "INTL", label: "Another country" },
];

export const SIGNUP_AUSTRALIA_JURISDICTIONS: SignupPrefillOption[] = [
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NSW", label: "New South Wales" },
  { value: "NT", label: "Northern Territory" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "VIC", label: "Victoria" },
  { value: "WA", label: "Western Australia" },
];

export const SIGNUP_US_JURISDICTIONS: SignupPrefillOption[] = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export const SIGNUP_UK_JURISDICTIONS: SignupPrefillOption[] = [
  { value: "england", label: "England" },
  { value: "scotland", label: "Scotland" },
  { value: "wales", label: "Wales" },
  { value: "northern-ireland", label: "Northern Ireland" },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function optionLabel(options: SignupPrefillOption[], value: unknown) {
  const clean = safe(value);
  if (!clean) return "";
  return options.find((option) => option.value === clean)?.label || clean;
}

export function getSignupJurisdictionOptions(countryCode: string) {
  if (countryCode === "AU") return SIGNUP_AUSTRALIA_JURISDICTIONS;
  if (countryCode === "US") return SIGNUP_US_JURISDICTIONS;
  if (countryCode === "UK") return SIGNUP_UK_JURISDICTIONS;
  return [];
}

export function getSignupCountryLabel(countryCode: unknown) {
  return optionLabel(SIGNUP_COUNTRY_OPTIONS, countryCode);
}

export function getSignupJurisdictionLabel(countryCode: unknown, jurisdictionCode: unknown) {
  const cleanCountry = safe(countryCode);
  return optionLabel(getSignupJurisdictionOptions(cleanCountry), jurisdictionCode);
}

function normalizeNumberOfChildren(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 12 ? parsed : undefined;
}

export function normalizeSignupPrefill(value: unknown): SignupPrefill | null {
  if (!value || typeof value !== "object") return null;

  const input = value as Record<string, unknown>;
  const fullName = safe(input.fullName || input.name);
  const email = safe(input.email).toLowerCase();
  const country = safe(input.country);
  const stateOrRegion = safe(input.stateOrRegion || input.state_or_region);
  const jurisdiction = safe(input.jurisdiction);
  const source = safe(input.source);
  const createdAt = safe(input.createdAt || input.created_at);
  const numberOfChildren = normalizeNumberOfChildren(
    input.numberOfChildren || input.number_of_children,
  );

  const prefill: SignupPrefill = { version: 1 };
  if (fullName) prefill.fullName = fullName;
  if (email) prefill.email = email;
  if (country) prefill.country = country;
  if (stateOrRegion) prefill.stateOrRegion = stateOrRegion;
  if (jurisdiction) prefill.jurisdiction = jurisdiction;
  if (numberOfChildren) prefill.numberOfChildren = numberOfChildren;
  if (source) prefill.source = source;
  if (createdAt) prefill.createdAt = createdAt;

  return prefill;
}

export function saveSignupPrefill(prefill: SignupPrefill) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIGNUP_PREFILL_STORAGE_KEY, JSON.stringify(prefill));
}

export function readSignupPrefill() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SIGNUP_PREFILL_STORAGE_KEY);
    return raw ? normalizeSignupPrefill(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clearSignupPrefill() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SIGNUP_PREFILL_STORAGE_KEY);
}

export function buildSignupPrefillMetadata(prefill: SignupPrefill | null) {
  if (!prefill) return undefined;
  return {
    [SIGNUP_PREFILL_METADATA_KEY]: prefill,
  };
}
