import { supabase } from "@/lib/supabaseClient";

export const FAMILY_SIGN_OUT_TIMEOUT_MS = 3000;
const FAMILY_SIGN_OUT_VERIFY_TIMEOUT_MS = 1200;
const FAMILY_SIGN_OUT_MARKER_KEY = "edudecks_auth_signed_out_at";
const FAMILY_SIGN_OUT_EVENT = "edudecks:auth-signed-out";

function createTimeoutError(label: string, ms: number) {
  return new Error(`${label} timed out after ${ms}ms.`);
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function withTimeout<T>(promise: Promise<T>, label: string, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(createTimeoutError(label, ms));
        }, ms);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function authStorageKeys(storageKey: string) {
  if (!storageKey) return [];
  return [storageKey, `${storageKey}-code-verifier`, `${storageKey}-user`];
}

function clearStorageKey(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // ignore browser storage cleanup failures
  }
}

function clearSupabaseBrowserStorage(storageKey: string) {
  if (typeof window === "undefined") return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of authStorageKeys(storageKey)) {
      clearStorageKey(storage, key);
    }
  }
}

function markSignedOut() {
  if (typeof window === "undefined") return;

  const stamp = String(Date.now());

  try {
    window.localStorage.setItem(FAMILY_SIGN_OUT_MARKER_KEY, stamp);
  } catch {
    // ignore storage failures
  }

  window.dispatchEvent(
    new CustomEvent(FAMILY_SIGN_OUT_EVENT, {
      detail: { signedOutAt: stamp },
    }),
  );
}

export function clearSignedOutMarker() {
  if (typeof window === "undefined") return;

  clearStorageKey(window.localStorage, FAMILY_SIGN_OUT_MARKER_KEY);
}

export function hasRecentSignedOutMarker() {
  if (typeof window === "undefined") return false;
  return Boolean(safeString(window.localStorage.getItem(FAMILY_SIGN_OUT_MARKER_KEY)));
}

export function getFamilySignedOutEventName() {
  return FAMILY_SIGN_OUT_EVENT;
}

export function resetAuthClientStateImmediately() {
  if (typeof window === "undefined") return;

  const auth = supabase.auth as unknown as {
    storageKey?: string;
    stopAutoRefresh?: () => void;
    _removeSession?: () => Promise<void>;
    _notifyAllSubscribers?: (
      event: string,
      session: null,
      broadcast?: boolean,
    ) => void | Promise<void>;
  };

  const storageKey = safeString(auth.storageKey);

  auth.stopAutoRefresh?.();
  clearSupabaseBrowserStorage(storageKey);
  markSignedOut();

  void auth._removeSession?.().catch((error) => {
    console.warn("Local auth session removal failed", error);
  });

  try {
    void auth._notifyAllSubscribers?.("SIGNED_OUT", null, false);
  } catch (error) {
    console.warn("Auth subscriber notification failed", error);
  }
}

function requestSupabaseSignOutInBackground() {
  void supabase.auth
    .signOut({ scope: "local" })
    .then((result) => {
      if (result.error) {
        console.warn("Supabase sign-out request reported an error", result.error);
      }
    })
    .catch((error) => {
      console.warn("Supabase sign-out request failed", error);
    });
}

async function isBrowserSessionCleared() {
  const sessionResponse = await withTimeout(
    supabase.auth.getSession(),
    "Sign-out verification",
    FAMILY_SIGN_OUT_VERIFY_TIMEOUT_MS,
  );

  return !sessionResponse.data.session;
}

export async function completeFamilySignOut() {
  resetAuthClientStateImmediately();
  requestSupabaseSignOutInBackground();

  const cleared = await isBrowserSessionCleared();
  if (!cleared) {
    throw createTimeoutError("Sign-out verification", FAMILY_SIGN_OUT_TIMEOUT_MS);
  }
}

export function isFamilySignOutTimeout(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("timed out");
}
