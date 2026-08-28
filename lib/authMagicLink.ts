import { buildAuthCallbackUrl, normalizeNextPath } from "@/lib/authRedirect";
import { supabase } from "@/lib/supabaseClient";
import { buildSignupPrefillMetadata, type SignupPrefill } from "@/lib/signupPrefill";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MagicLinkErrorCategory =
  | "provider_rate_limit"
  | "cooldown"
  | "duplicate_request"
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
  errorCode?: string;
  retryAfterMs?: number;
};

export type MagicLinkMode = "login" | "signup";
export type EmailAuthChallengeDelivery = "magic-link" | "otp-code";

export const MAGIC_LINK_RATE_LIMIT_RETRY_DELAY_MS = 60000;
export const MAGIC_LINK_CLIENT_RESEND_DELAY_MS = 60000;

const inFlightMagicLinkEmails = new Set<string>();
const magicLinkCooldowns = new Map<string, number>();

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function createMagicLinkControlError(
  message: string,
  code: string,
  retryAfterMs?: number,
) {
  const error = new Error(message) as Error & {
    code?: string;
    retryAfterMs?: number;
  };
  error.code = code;
  error.retryAfterMs = retryAfterMs;
  return error;
}

function readRetryAfterMs(error: unknown) {
  const raw = Number((error as { retryAfterMs?: unknown })?.retryAfterMs);
  return Number.isFinite(raw) && raw > 0 ? raw : undefined;
}

function readErrorCode(error: unknown) {
  return safe((error as { code?: unknown })?.code);
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

export function getMagicLinkRetryAfterMs(error: unknown) {
  return getMagicLinkErrorDetails(error).retryAfterMs;
}

export function getMagicLinkCooldownRemainingMs(email: string) {
  const normalizedEmail = normalizeMagicLinkEmail(email);
  const blockedUntil = magicLinkCooldowns.get(normalizedEmail) ?? 0;
  return Math.max(0, blockedUntil - Date.now());
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
  const errorCode = readErrorCode(error).toLowerCase();

  if (!normalized) {
    return {
      category: "unknown",
      message: "We couldn't send your sign-in link for an unknown reason. Please try again.",
      rawMessage,
      provider: "app",
      isRetryable: true,
      diagnosticCode: "AUTH-SEND-UNKNOWN",
      errorCode: errorCode || undefined,
    };
  }

  const retryAfterMs = readRetryAfterMs(error);

  if (errorCode === "AUTH-SEND-DUPLICATE") {
    return {
      category: "duplicate_request",
      message: "A sign-in email request is already in progress. Please wait a moment.",
      rawMessage,
      provider: "app",
      isRetryable: true,
      diagnosticCode: "AUTH-SEND-DUPLICATE",
      errorCode,
      retryAfterMs,
    };
  }

  if (errorCode === "AUTH-SEND-COOLDOWN") {
    return {
      category: "cooldown",
      message:
        "We just sent a sign-in link. Please wait briefly before requesting another one.",
      rawMessage,
      provider: "app",
      isRetryable: true,
      diagnosticCode: "AUTH-SEND-COOLDOWN",
      errorCode,
      retryAfterMs,
    };
  }

  if (
    errorCode === "user_not_found" ||
    normalized.includes("user not found") ||
    normalized.includes("no user")
  ) {
    return {
      category: "auth_client",
      message: "We couldn't find a MyLearna account for that email yet.",
      rawMessage,
      provider: "supabase",
      isRetryable: false,
      diagnosticCode: "AUTH-SEND-USER-NOT-FOUND",
      errorCode,
    };
  }

  if (
    errorCode === "signup_disabled" ||
    normalized.includes("signup disabled") ||
    normalized.includes("signups not allowed")
  ) {
    return {
      category: "auth_client",
      message: "Secure sign-in links are not available for that email right now.",
      rawMessage,
      provider: "supabase",
      isRetryable: false,
      diagnosticCode: "AUTH-SEND-SIGNUP-DISABLED",
      errorCode,
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
      errorCode: errorCode || undefined,
      retryAfterMs: MAGIC_LINK_RATE_LIMIT_RETRY_DELAY_MS,
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
      errorCode: errorCode || undefined,
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
      errorCode: errorCode || undefined,
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
      errorCode: errorCode || undefined,
    };
  }

  return {
    category: "unknown",
    message: "We couldn't send your sign-in link because the auth service returned an unexpected error.",
    rawMessage,
    provider: "supabase",
    isRetryable: true,
    diagnosticCode: "AUTH-SEND-UNEXPECTED",
    errorCode: errorCode || undefined,
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
  mode: MagicLinkMode;
  nextPath: string;
  source: string;
  signupPrefill?: SignupPrefill | null;
}) {
  return sendEmailAuthChallenge({ ...input, delivery: "magic-link" });
}

export async function sendEmailAuthChallenge(input: {
  email: string;
  mode: MagicLinkMode;
  nextPath: string;
  source: string;
  delivery: EmailAuthChallengeDelivery;
  signupPrefill?: SignupPrefill | null;
}) {
  const normalizedEmail = normalizeMagicLinkEmail(input.email);

  if (!isValidMagicLinkEmail(normalizedEmail)) {
    throw new Error("Please enter a valid email address first.");
  }

  if (inFlightMagicLinkEmails.has(normalizedEmail)) {
    throw createMagicLinkControlError(
      "A sign-in email request is already in progress. Please wait a moment.",
      "AUTH-SEND-DUPLICATE",
      2000,
    );
  }

  const cooldownRemainingMs = getMagicLinkCooldownRemainingMs(normalizedEmail);
  if (cooldownRemainingMs > 0) {
    throw createMagicLinkControlError(
      "We just sent a sign-in link. Please wait briefly before requesting another one.",
      "AUTH-SEND-COOLDOWN",
      cooldownRemainingMs,
    );
  }

  const nextPath = normalizeNextPath(input.nextPath || "/my-day");
  const emailRedirectTo = buildAuthCallbackUrl(nextPath);

  console.info("[auth] magic link requested", {
    source: input.source,
    nextPath,
  });

  inFlightMagicLinkEmails.add(normalizedEmail);

  try {
    const shouldCreateUser = input.mode === "signup";
    const signupPrefillMetadata = buildSignupPrefillMetadata(input.signupPrefill ?? null);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        ...(input.delivery === "magic-link" ? { emailRedirectTo } : {}),
        shouldCreateUser,
        ...(shouldCreateUser
          ? {
              data: {
                user_type: "family",
                onboarding_state: "new",
                ...signupPrefillMetadata,
              },
            }
          : {}),
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
      });
      throw error;
    }

    magicLinkCooldowns.set(
      normalizedEmail,
      Date.now() + MAGIC_LINK_CLIENT_RESEND_DELAY_MS,
    );

    console.info("[auth] magic link sent", {
      source: input.source,
      nextPath,
    });

    return {
      email: normalizedEmail,
      nextPath,
    };
  } finally {
    inFlightMagicLinkEmails.delete(normalizedEmail);
  }
}
