import { supabase } from "@/lib/supabaseClient";

export const FAMILY_SIGN_OUT_TIMEOUT_MS = 8000;
const FAMILY_SIGN_OUT_API_TIMEOUT_MS = 3000;
const FAMILY_SIGN_OUT_VERIFY_TIMEOUT_MS = 2000;

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

function removeStoredSession(key: string) {
  if (typeof window === "undefined" || !key) return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      storage.removeItem(key);
      storage.removeItem(`${key}-code-verifier`);
      storage.removeItem(`${key}-user`);
    } catch {
      // ignore storage cleanup failures
    }
  }
}

async function forceClearBrowserSession() {
  const auth = supabase.auth as unknown as {
    storageKey?: string;
    stopAutoRefresh?: () => void;
    _removeSession?: () => Promise<void>;
  };

  auth.stopAutoRefresh?.();

  if (typeof auth._removeSession === "function") {
    await auth._removeSession();
  }

  removeStoredSession(safeString(auth.storageKey));
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
  let lastError: unknown = null;

  try {
    const result = await withTimeout(
      supabase.auth.signOut({ scope: "local" }),
      "Sign-out request",
      FAMILY_SIGN_OUT_API_TIMEOUT_MS,
    );

    if (result.error) {
      throw result.error;
    }
  } catch (error) {
    lastError = error;
    console.warn("Family sign-out request fell back to local session clear", error);
  }

  await forceClearBrowserSession();

  const cleared = await isBrowserSessionCleared();
  if (!cleared) {
    throw lastError ?? createTimeoutError("Sign-out verification", FAMILY_SIGN_OUT_TIMEOUT_MS);
  }
}

export function isFamilySignOutTimeout(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("timed out");
}
