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

function safe(value: unknown) {
  return String(value ?? "").trim();
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
