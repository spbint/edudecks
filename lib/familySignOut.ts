import { supabase } from "@/lib/supabaseClient";
import { clearLocalSessionForAccountSwitch } from "@/lib/authSessionEscape";

const FAMILY_SIGN_OUT_EVENT = "edudecks:auth-signed-out";
const SIGN_OUT_TIMEOUT_MS = 4500;

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function authStorageKeys(storageKey: string) {
  if (!storageKey) return [];
  return [storageKey, `${storageKey}-code-verifier`, `${storageKey}-user`];
}

function isSupabaseAuthStorageKey(key: string) {
  return (
    key === "supabase-auth-token" ||
    key.startsWith("supabase-auth-token.") ||
    (key.startsWith("sb-") &&
      (key.includes("-auth-token") || key.endsWith("-code-verifier")))
  );
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

    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key && isSupabaseAuthStorageKey(key)) {
        clearStorageKey(storage, key);
      }
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

async function requestSupabaseSignOut() {
  const [clientResult, serverResult] = await Promise.allSettled([
    supabase.auth.signOut({ scope: "global" }),
    fetch("/api/auth/sign-out", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    }),
  ]);

  if (clientResult.status === "fulfilled" && clientResult.value.error) {
    console.warn("[auth] client sign-out failed", {
      message: clientResult.value.error.message,
    });
  } else if (clientResult.status === "rejected") {
    console.warn("[auth] client sign-out rejected", {
      message: safeString(clientResult.reason?.message),
    });
  }

  if (serverResult.status === "fulfilled" && !serverResult.value.ok) {
    console.warn("[auth] server sign-out returned non-ok", {
      status: serverResult.value.status,
    });
  } else if (serverResult.status === "rejected") {
    console.warn("[auth] server sign-out rejected", {
      message: safeString(serverResult.reason?.message),
    });
  }
}

function timeoutSignOut() {
  return new Promise<"timeout">((resolve) => {
    window.setTimeout(() => resolve("timeout"), SIGN_OUT_TIMEOUT_MS);
  });
}

export async function completeFamilySignOut() {
  const signOutRequest = requestSupabaseSignOut();
  clearLocalSessionForAccountSwitch();
  resetAuthClientStateImmediately();

  if (typeof window === "undefined") {
    await signOutRequest;
    return;
  }

  const result = await Promise.race([signOutRequest, timeoutSignOut()]);
  if (result === "timeout") {
    console.warn("[auth] sign-out timed out; continuing with local signed-out state.");
  }
}

export function isFamilySignOutTimeout() {
  return false;
}
