import { buildAuthCallbackUrl, normalizeNextPath } from "@/lib/authRedirect";
import { supabase } from "@/lib/supabaseClient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MagicLinkErrorCategory =
  | "provider_rate_limit"
  | "redirect_config"
  | "network"
  | "auth_client"
  | "unknown";

export type MagicLinkErrorDetails = {
  category: MagicLinkErrorCategory;
  message: string;
  rawMessage: string;
  provider: "supabase" | "browser" | "app";
  isRetryable: boolean;
  diagnosticCode: string;
};

export const MAGIC_LINK_RATE_LIMIT_RETRY_DELAY_MS = 30000;

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeMagicLinkEmail(email: string) {
  return safe(email).toLowerCase();
}

export function isValidMagicLinkEmail(email: string) {
  return EMAIL_PATTERN.test(normalizeMagicLinkEmail(email));
}

export function mapMagicLinkError(error: unknown) {
  return getMagicLinkErrorDetails(error).message;
}

export function normalizeMagicLinkFeedback(message: unknown) {
  const raw = safe(message);
  const normalized = raw.toLowerCase();

  if (!raw) return "";

  if (
    normalized.includes("login links already") ||
    (normalized.includes("give it a few minutes") &&
      normalized.includes("arrives reliably"))
  ) {
    return "We couldn't send another sign-in link right now. Please try again from this page.";
  }

  return raw;
}

export function getMagicLinkErrorDetails(error: unknown): MagicLinkErrorDetails {
  const rawMessage = normalizeMagicLinkFeedback(
    error && typeof error === "object" ? (error as { message?: unknown }).message : error,
  );
  const normalized = rawMessage.toLowerCase();

  if (!normalized) {
    return {
      category: "unknown",
      message: "We couldn't send your sign-in link for an unknown reason. Please try again.",
      rawMessage,
      provider: "app",
      isRetryable: true,
      diagnosticCode: "AUTH-SEND-UNKNOWN",
    };
  }

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return {
      category: "provider_rate_limit",
      message:
        "Sign-in email is currently being rate-limited by the auth provider. Please wait briefly, then try again.",
      rawMessage,
      provider: "supabase",
      isRetryable: true,
      diagnosticCode: "AUTH-SEND-RATE-LIMIT",
    };
  }

  if (
    normalized.includes("redirect") ||
    normalized.includes("site url") ||
    normalized.includes("not allowed")
  ) {
    return {
      category: "redirect_config",
      message:
        "We couldn't send your sign-in link because the return URL is not configured correctly yet.",
      rawMessage,
      provider: "supabase",
      isRetryable: false,
      diagnosticCode: "AUTH-SEND-REDIRECT",
    };
  }

  if (
    normalized.includes("network") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("load failed") ||
    normalized.includes("timed out")
  ) {
    return {
      category: "network",
      message: "We couldn't reach the auth service just now. Please try again.",
      rawMessage,
      provider: "browser",
      isRetryable: true,
      diagnosticCode: "AUTH-SEND-NETWORK",
    };
  }

  if (
    normalized.includes("invalid") ||
    normalized.includes("jwt") ||
    normalized.includes("auth") ||
    normalized.includes("otp")
  ) {
    return {
      category: "auth_client",
      message: "The sign-in request was rejected by the auth service. Please try again.",
      rawMessage,
      provider: "supabase",
      isRetryable: true,
      diagnosticCode: "AUTH-SEND-AUTH",
    };
  }

  return {
    category: "unknown",
    message: "We couldn't send your sign-in link because the auth service returned an unexpected error.",
    rawMessage,
    provider: "supabase",
    isRetryable: true,
    diagnosticCode: "AUTH-SEND-UNEXPECTED",
  };
}

export function isMagicLinkRateLimited(error: unknown) {
  return getMagicLinkErrorDetails(error).category === "provider_rate_limit";
}

export function resetMagicLinkClientState() {
  if (typeof window === "undefined") return;

  const auth = supabase.auth as unknown as {
    storageKey?: string;
    stopAutoRefresh?: () => void;
  };

  const storageKey = safe(auth.storageKey);
  auth.stopAutoRefresh?.();

  if (!storageKey) return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      storage.removeItem(storageKey);
      storage.removeItem(`${storageKey}-code-verifier`);
      storage.removeItem(`${storageKey}-user`);
    } catch {
      // ignore browser storage cleanup failures
    }
  }
}

export async function sendMagicLink(input: {
  email: string;
  nextPath: string;
  source: string;
}) {
  const normalizedEmail = normalizeMagicLinkEmail(input.email);

  if (!isValidMagicLinkEmail(normalizedEmail)) {
    throw new Error("Please enter a valid email address first.");
  }

  const nextPath = normalizeNextPath(input.nextPath || "/family");
  const emailRedirectTo = buildAuthCallbackUrl(nextPath);

  console.info("[auth] magic link requested", {
    source: input.source,
    nextPath,
  });

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
      data: {
        user_type: "family",
        onboarding_state: "new",
      },
    },
  });

  if (error) {
    const details = getMagicLinkErrorDetails(error);
    console.error("[auth] magic link failed", {
      source: input.source,
      nextPath,
      category: details.category,
      diagnosticCode: details.diagnosticCode,
      provider: details.provider,
      retryable: details.isRetryable,
      message: safe(error.message),
      rawMessage: details.rawMessage,
    });
    throw error;
  }

  console.info("[auth] magic link sent", {
    source: input.source,
    nextPath,
  });

  return {
    email: normalizedEmail,
    nextPath,
  };
}
