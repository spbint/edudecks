import {
  BLOCKED_SETUP_ROUTE_KEY,
  CURRENT_SETUP_STEP_KEY,
  SETUP_STATUS_KEY,
} from "@/lib/clean/setup/setupFlow";
import { clearSignupPrefill } from "@/lib/signupPrefill";

export const SETUP_REDIRECT_LOOP_KEY = "mylearna.setup.redirectLoop";

const LOCAL_ACCOUNT_SWITCH_KEYS = [
  "mylearna.guidance.setupChecklist",
  "mylearna.guidance.completedTours",
  "mylearna.guidance.pendingTour",
  "mylearna.guidance.setupActive",
  "mylearna.guidance.welcomeSeen",
  "mylearna.guidance.welcomeTourCompleted",
  BLOCKED_SETUP_ROUTE_KEY,
  CURRENT_SETUP_STEP_KEY,
  SETUP_STATUS_KEY,
  SETUP_REDIRECT_LOOP_KEY,
];

const SESSION_ACCOUNT_SWITCH_KEYS = [
  SETUP_REDIRECT_LOOP_KEY,
  "mylearna.auth.returnTo",
  "mylearna.auth.redirectTo",
  "mylearna.auth.next",
  "mylearna.auth.intendedRoute",
];

const FAMILY_IDENTITY_CACHE_KEYS = [
  "edudecks_family_settings_v1",
  "edudecks_children_seed_v1",
  "edudecks_active_student_id",
  "mylearna.clean.activeLearnerByFamily.v1",
];

function removeStorageKey(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures in restricted browser modes.
  }
}

export function clearAuthRedirectState() {
  if (typeof window === "undefined") return;

  for (const key of SESSION_ACCOUNT_SWITCH_KEYS) {
    removeStorageKey(window.sessionStorage, key);
  }

  for (const key of SESSION_ACCOUNT_SWITCH_KEYS) {
    removeStorageKey(window.localStorage, key);
  }
}

export function clearSetupRedirectState() {
  if (typeof window === "undefined") return;

  for (const key of LOCAL_ACCOUNT_SWITCH_KEYS) {
    removeStorageKey(window.localStorage, key);
  }

  removeStorageKey(window.sessionStorage, SETUP_REDIRECT_LOOP_KEY);
}

export function clearLocalSessionForAccountSwitch() {
  clearSignupPrefill();
  clearAuthRedirectState();
  clearSetupRedirectState();

  if (typeof window === "undefined") return;

  for (const key of FAMILY_IDENTITY_CACHE_KEYS) {
    removeStorageKey(window.localStorage, key);
    removeStorageKey(window.sessionStorage, key);
  }
}
