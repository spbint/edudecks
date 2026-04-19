import { buildAuthCallbackUrl, normalizeNextPath } from "@/lib/authRedirect";
import { supabase } from "@/lib/supabaseClient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const raw = safe(
    error && typeof error === "object" ? (error as { message?: unknown }).message : error,
  );
  const normalized = raw.toLowerCase();

  if (!normalized) return "";

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "You’ve requested a couple of login links already. Give it a few minutes before trying again so the next one arrives reliably.";
  }

  if (
    normalized.includes("redirect") ||
    normalized.includes("site url") ||
    normalized.includes("not allowed")
  ) {
    return "We couldn't send your sign-in link because the return URL is not configured correctly yet.";
  }

  return raw;
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
    console.error("[auth] magic link failed", {
      source: input.source,
      nextPath,
      message: safe(error.message),
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
