"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { normalizeNextPath } from "@/lib/authRedirect";

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
  const [message, setMessage] = useState("Signing you in and returning you to MyLearna...");
  const [error, setError] = useState("");
  const redirectInProgress = useRef(false);
  const callbackHandled = useRef(false);

  const requestedNextPath = useMemo(() => {
    const fallback = normalizeNextPath("/my-day");
    const candidate = searchParams.get("next");
    return normalizeNextPath(candidate || fallback);
  }, [searchParams]);

  const errorParam = useMemo(() => safe(searchParams.get("error")), [searchParams]);
  const errorDescription = useMemo(
    () => safe(searchParams.get("error_description")),
    [searchParams],
  );
  const codeParam = useMemo(() => safe(searchParams.get("code")), [searchParams]);
  const accessTokenParam = useMemo(() => safe(searchParams.get("access_token")), [searchParams]);
  const refreshTokenParam = useMemo(() => safe(searchParams.get("refresh_token")), [searchParams]);

  useEffect(() => {
    let mounted = true;
    if (callbackHandled.current) return;
    callbackHandled.current = true;

    async function completeAuth() {
      try {
        console.info("[auth] callback entered", {
          requestedNextPath,
          hasCode: Boolean(codeParam),
          hasAccessToken: Boolean(accessTokenParam),
          hasRefreshToken: Boolean(refreshTokenParam),
        });

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        setMessage("Completing your MyLearna session...");

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

        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        let resolvedNextPath = requestedNextPath;

        if (user?.id) {
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
              resolvedNextPath = "/welcome";
            }
          } catch (profileError) {
            console.error("[auth] callback profile hydration failed", profileError);
          }
        }

        if (!mounted) return;

        console.info("[auth] callback session established", {
          requestedNextPath,
          resolvedNextPath,
          userId: safe(user?.id),
        });

        setMessage(
          resolvedNextPath === "/start"
            ? "You're signed in. Returning you to your learning record..."
            : resolvedNextPath === "/welcome"
              ? "You're signed in. Getting your first step ready..."
              : "You're signed in. Taking you back to MyLearna...",
        );

        if (redirectInProgress.current) return;
        redirectInProgress.current = true;
        router.replace(resolvedNextPath);
      } catch (authError: unknown) {
        console.error("[auth] callback failed", authError);
        if (!mounted) return;
        setMessage("");
        setError(
          safe((authError as { message?: unknown })?.message) ||
            "We could not complete sign-in. Please try again.",
        );
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
    router.replace(requestedNextPath);
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
            Finishing your sign-in
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            {error || message}
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${error ? "#fecaca" : "#bfdbfe"}`,
            background: error ? "#fff1f2" : "#eff6ff",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: error ? "#9f1239" : "#1d4ed8",
              lineHeight: 1.6,
            }}
          >
            {error
              ? "We hit a problem while completing sign-in. No new login link has been sent."
              : requestedNextPath === "/start"
                ? "Your learning record is still waiting for you. We'll take you back so you can keep saving your progress."
                : "You'll be returned to the right MyLearna page automatically."}
          </div>

          {error ? (
            <Link
              href="/login"
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
              Back to login
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
