"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { normalizeAuthNextPath } from "@/lib/authRedirect";
import { loadCleanFamilyProfile } from "@/lib/clean/family/client";
import { hasRequiredLearningSettings } from "@/lib/clean/setup/setupFlow";
import { trackAuthEvent } from "@/lib/authAnalytics";

type CallbackErrorKind = "none" | "missing-pkce" | "expired-link" | "generic";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function cardStyle(): React.CSSProperties {
  return {
    width: "100%",
    maxWidth: 520,
    borderRadius: 24,
    border: "1px solid #dbeafe",
    background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.96) 100%)",
    boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
    padding: 24,
    display: "grid",
    gap: 14,
  };
}

function parseHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

function parseNumber(value?: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function localLearnerCount() {
  if (typeof window === "undefined") return 0;

  try {
    const raw = window.localStorage.getItem("edudecks_children_seed_v1");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function isMissingPkceError(error: unknown) {
  const message = safe((error as { message?: unknown })?.message).toLowerCase();
  return (
    message.includes("pkce") ||
    message.includes("code verifier") ||
    message.includes("verifier not found") ||
    message.includes("both auth code and code verifier should be non-empty")
  );
}

function readErrorCode(error: unknown) {
  return safe((error as { code?: unknown })?.code).toLowerCase();
}

function isExpiredOrUsedLinkError(error: unknown) {
  const message = safe((error as { message?: unknown })?.message).toLowerCase();
  const errorCode = readErrorCode(error);

  return (
    errorCode === "otp_expired" ||
    errorCode === "flow_state_expired" ||
    errorCode === "flow_state_not_found" ||
    errorCode === "session_expired" ||
    errorCode === "bad_code_verifier" ||
    message.includes("expired") ||
    message.includes("already used") ||
    message.includes("flow state") ||
    message.includes("bad code verifier")
  );
}

function isProtectedMyLearnaPath(path: string) {
  return (
    path === "/my-day" ||
    path === "/home" ||
    path === "/dashboard" ||
    path === "/my-profile" ||
    path === "/my-settings" ||
    path.startsWith("/my-") ||
    path === "/clean" ||
    path.startsWith("/clean-my-")
  );
}

async function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms.`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function reconcileExistingSession(requestedNextPath: string) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const session = (await supabase.auth.getSession()).data.session;
    if (session?.user) {
      try {
        const familyState = await withTimeout(loadCleanFamilyProfile(), 1000);
        if (!familyState.profile) return "/my-profile";
        if (!hasRequiredLearningSettings(familyState.profile) && requestedNextPath !== "/my-settings") return "/my-settings";
      } catch {
        // Keep the requested safe path when the family lookup is temporarily unavailable.
      }
      return requestedNextPath;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }
  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackPageContent />
    </Suspense>
  );
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("Finishing your sign-in");
  const [message, setMessage] = useState("Signing you in and returning you to MyLearna...");
  const [errorKind, setErrorKind] = useState<CallbackErrorKind>("none");
  const redirectInProgress = useRef(false);
  const callbackHandled = useRef(false);
  const resolvedNextPathRef = useRef("/my-profile");

  const requestedNextPath = useMemo(() => {
    const fallback = normalizeAuthNextPath("/my-profile", "/my-profile");
    const candidate = searchParams.get("next");
    const normalized = normalizeAuthNextPath(candidate || fallback, "/my-profile");
    return normalized === "/" ? "/my-day" : normalized;
  }, [searchParams]);

  const errorParam = useMemo(() => safe(searchParams.get("error")), [searchParams]);
  const errorDescription = useMemo(
    () => safe(searchParams.get("error_description")),
    [searchParams],
  );
  const codeParam = useMemo(() => safe(searchParams.get("code")), [searchParams]);
  const accessTokenParam = useMemo(() => safe(searchParams.get("access_token")), [searchParams]);
  const refreshTokenParam = useMemo(() => safe(searchParams.get("refresh_token")), [searchParams]);
  const loginHref = useMemo(
    () => `/login?next=${encodeURIComponent(requestedNextPath)}`,
    [requestedNextPath],
  );

  useEffect(() => {
    let mounted = true;
    if (callbackHandled.current) return;
    callbackHandled.current = true;

    async function completeAuth() {
      try {
        trackAuthEvent("auth_callback_entered", { route: "/auth/callback" });
        console.info("[auth] callback entered", {
          requestedNextPath,
          hasCode: Boolean(codeParam),
          hasAccessToken: Boolean(accessTokenParam),
          hasRefreshToken: Boolean(refreshTokenParam),
        });

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        setTitle("Finishing your sign-in");
        setMessage("Completing your MyLearna session...");
        setErrorKind("none");

        const hashParams = parseHashParams();
        const hashAccessToken = safe(hashParams.get("access_token"));
        const hashRefreshToken = safe(hashParams.get("refresh_token"));
        const hashExpiresIn = parseNumber(hashParams.get("expires_in"));
        const hashExpiresAt = parseNumber(hashParams.get("expires_at"));
        const hashTokenType = safe(hashParams.get("token_type"));
        const hashProviderToken = safe(hashParams.get("provider_token"));
        const hashProviderRefresh = safe(hashParams.get("provider_refresh_token"));

        if (codeParam) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeParam);
          if (exchangeError) {
            throw exchangeError;
          }
        } else {
          const accessToken = hashAccessToken || accessTokenParam;
          const refreshToken = hashRefreshToken || refreshTokenParam;

          if (accessToken && refreshToken) {
            const sessionPayload: Record<string, unknown> = {
              access_token: accessToken,
              refresh_token: refreshToken,
            };
            if (hashExpiresIn !== undefined) {
              sessionPayload.expires_in = hashExpiresIn;
            }
            if (hashExpiresAt !== undefined) {
              sessionPayload.expires_at = hashExpiresAt;
            }
            if (hashTokenType) {
              sessionPayload.token_type = hashTokenType;
            }
            if (hashProviderToken) {
              sessionPayload.provider_token = hashProviderToken;
            }
            if (hashProviderRefresh) {
              sessionPayload.provider_refresh_token = hashProviderRefresh;
            }

            const { error: sessionError } = await supabase.auth.setSession(sessionPayload as never);
            if (sessionError) {
              throw sessionError;
            }
          }
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          throw new Error("We could not complete sign-in from that link. Please try again.");
        }

        trackAuthEvent("auth_session_ready", { route: resolvedNextPathRef.current || requestedNextPath, challengeType: "magic_link" });

        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        let resolvedNextPath = requestedNextPath;
        let hasCleanFamilyProfile = false;
        let hasCleanLearningSettings = false;

        if (user?.id) {
          try {
            const familyState = await withTimeout(loadCleanFamilyProfile(), 1200);
            hasCleanFamilyProfile = Boolean(familyState.profile);
            hasCleanLearningSettings = hasRequiredLearningSettings(familyState.profile);
          } catch (familyError) {
            console.error("[auth] callback clean family lookup failed", familyError);
          }

          try {
            const profileAndRouting = await withTimeout(
              (async () => {
                const profileResp = await supabase
                  .from("profiles")
                  .select("id,onboarding_complete")
                  .eq("id", user.id)
                  .maybeSingle();

                const onboardingComplete = Boolean(profileResp.data?.onboarding_complete);

                await supabase.from("profiles").upsert({
                  id: user.id,
                  email: user.email?.toLowerCase() || null,
                  full_name:
                    safe(user.user_metadata?.full_name) ||
                    safe(user.user_metadata?.name) ||
                    null,
                  user_type: safe(user.user_metadata?.user_type) || "family",
                  onboarding_complete: onboardingComplete,
                });

                return {
                  onboardingComplete,
                  linkedChildrenCount: localLearnerCount(),
                };
              })(),
              1200,
            );

            if (
              (requestedNextPath === "/home" || requestedNextPath === "/my-day") &&
              !profileAndRouting.onboardingComplete &&
              profileAndRouting.linkedChildrenCount === 0
            ) {
              resolvedNextPath = "/my-profile";
            }
          } catch (profileError) {
            console.error("[auth] callback profile hydration failed", profileError);
          }

          if (!hasCleanFamilyProfile && isProtectedMyLearnaPath(requestedNextPath)) {
            resolvedNextPath = "/my-profile";
          } else if (
            hasCleanFamilyProfile &&
            !hasCleanLearningSettings &&
            isProtectedMyLearnaPath(requestedNextPath) &&
            requestedNextPath !== "/my-profile" &&
            requestedNextPath !== "/my-settings"
          ) {
            resolvedNextPath = "/my-settings";
          }
        }

        if (!mounted) return;

        console.info("[auth] callback session established", {
          requestedNextPath,
          resolvedNextPath,
          userId: safe(user?.id),
        });

        setMessage(
          resolvedNextPath === "/my-day"
            ? "You're signed in. Returning you to your learning record..."
            : resolvedNextPath === "/my-profile"
              ? "You're signed in. Getting your first step ready..."
              : "You're signed in. Taking you back to MyLearna...",
        );
        setErrorKind("none");
        resolvedNextPathRef.current = resolvedNextPath;

        if (redirectInProgress.current) return;
        redirectInProgress.current = true;
        trackAuthEvent("auth_product_entry", { route: resolvedNextPath, challengeType: "magic_link" });
        router.replace(resolvedNextPath);
      } catch (authError: unknown) {
        console.error("[auth] callback failed", { kind: isMissingPkceError(authError) ? "missing_pkce" : isExpiredOrUsedLinkError(authError) ? "expired" : "unknown" });
        if (!mounted) return;
        if (isMissingPkceError(authError)) {
          trackAuthEvent("auth_callback_missing_pkce", { route: "/auth/callback", resultReason: "missing_pkce" });
          const reconciledPath = await reconcileExistingSession(requestedNextPath);
          if (reconciledPath) {
            trackAuthEvent("auth_callback_reconciled", { route: "/auth/callback", resultReason: "missing_pkce" });
            trackAuthEvent("auth_session_ready", { route: reconciledPath, challengeType: "magic_link" });
            trackAuthEvent("auth_product_entry", { route: reconciledPath, challengeType: "magic_link" });
            resolvedNextPathRef.current = reconciledPath;
            setTitle("Signed in");
            setMessage("Signed in. Taking you to MyLearna...");
            setErrorKind("none");
            if (!redirectInProgress.current) {
              redirectInProgress.current = true;
              router.replace(reconciledPath);
            }
            return;
          }
          setTitle("Finish signing in from this browser");
          setMessage(
            "This sign-in link opened in a different browser or email app, so we could not finish automatically. Please sign in here and we'll take you back into MyLearna.",
          );
          setErrorKind("missing-pkce");
          return;
        }

        if (isExpiredOrUsedLinkError(authError)) {
          trackAuthEvent("auth_callback_expired", { route: "/auth/callback", resultReason: "expired_code" });
          setTitle("That sign-in link needs a fresh try");
          setMessage(
            "That sign-in link has expired or has already been used. Please request a fresh link and we'll get you back into MyLearna.",
          );
          setErrorKind("expired-link");
          return;
        }

        setTitle("Sign-in link needs another try");
        trackAuthEvent("auth_callback_failed", { route: "/auth/callback", resultReason: "unknown" });
        setMessage("We could not finish sign-in from this link. Please sign in again or request a new link.");
        setErrorKind("generic");
      }
    }

    void completeAuth();

    return () => {
      mounted = false;
    };
  }, [
    requestedNextPath,
    router,
    errorParam,
    errorDescription,
    codeParam,
    accessTokenParam,
    refreshTokenParam,
  ]);

  function handleManualContinue() {
    if (redirectInProgress.current) return;
    redirectInProgress.current = true;
    router.replace(resolvedNextPathRef.current);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <section style={cardStyle()}>
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            MyLearna
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.08,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            {message}
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${
              errorKind === "generic" || errorKind === "expired-link"
                ? "#fecaca"
                : "#bfdbfe"
            }`,
            background:
              errorKind === "generic" || errorKind === "expired-link"
                ? "#fff1f2"
                : "#eff6ff",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color:
                errorKind === "generic" || errorKind === "expired-link"
                  ? "#9f1239"
                  : "#1d4ed8",
              lineHeight: 1.6,
            }}
          >
            {errorKind === "missing-pkce"
              ? "If you opened the confirmation link in a different browser or email app, sign in here and we'll take you back into MyLearna."
              : errorKind === "expired-link"
                ? "Please request a fresh sign-in link from the sign-in screen. Opening the newest email usually resolves this straight away."
              : errorKind === "generic"
                ? "Please sign in again. If the link has expired or was interrupted, request a fresh one from the sign-in screen."
                : requestedNextPath === "/my-day"
                ? "Your learning record is still waiting for you. We'll take you back so you can keep saving your progress."
                : "You'll be returned to the right MyLearna page automatically."}
          </div>

          {errorKind === "missing-pkce" ? (
            <Link
              href={loginHref}
              style={{
                marginTop: 12,
                width: "100%",
                borderRadius: 12,
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                padding: "10px",
                display: "inline-flex",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              Sign in to MyLearna
            </Link>
          ) : errorKind === "generic" || errorKind === "expired-link" ? (
            <Link
              href={loginHref}
              style={{
                marginTop: 12,
                width: "100%",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                color: "#0f172a",
                fontWeight: 700,
                padding: "10px",
                display: "inline-flex",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              Back to sign in
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleManualContinue}
              style={{
                marginTop: 12,
                width: "100%",
                borderRadius: 12,
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 700,
                padding: "10px",
                cursor: "pointer",
              }}
            >
              Continue to MyLearna
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
