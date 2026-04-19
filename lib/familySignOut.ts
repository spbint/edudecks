import { supabase } from "@/lib/supabaseClient";

export const FAMILY_SIGN_OUT_TIMEOUT_MS = 8000;

function createTimeoutError() {
  return new Error(
    `Sign-out timed out after ${FAMILY_SIGN_OUT_TIMEOUT_MS}ms.`,
  );
}

export async function completeFamilySignOut() {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(createTimeoutError());
      }, FAMILY_SIGN_OUT_TIMEOUT_MS);
    });

    const result = await Promise.race([
      supabase.auth.signOut({ scope: "local" }),
      timeoutPromise,
    ]);

    if (result.error) {
      throw result.error;
    }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function isFamilySignOutTimeout(error: unknown) {
  return error instanceof Error && error.message.includes("Sign-out timed out");
}
