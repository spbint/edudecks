import { supabase } from "@/lib/supabaseClient";

const FAMILY_SIGN_OUT_EVENT = "edudecks:auth-signed-out";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

export function getFamilySignedOutEventName() {
  return FAMILY_SIGN_OUT_EVENT;
}

export function clearSignedOutMarker() {
  // preserved as a no-op for callers that still import it
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

  void auth._removeSession?.().catch((error) => {
    console.warn("Local auth session removal failed", error);
  });

  try {
    void auth._notifyAllSubscribers?.("SIGNED_OUT", null, false);
  } catch (error) {
    console.warn("Auth subscriber notification failed", error);
  }

  window.dispatchEvent(new CustomEvent(FAMILY_SIGN_OUT_EVENT));
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

export async function completeFamilySignOut() {
  resetAuthClientStateImmediately();
  requestSupabaseSignOutInBackground();
}

export function isFamilySignOutTimeout() {
  return false;
}
