"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
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
  const [message, setMessage] = useState("Signing you in and returning you to EduDecks...");
  const [error, setError] = useState("");

  const nextPath = useMemo(() => {
    const fallback = normalizeNextPath("/family");
    const candidate = searchParams.get("next");
    return normalizeNextPath(candidate || fallback);
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    async function completeAuth() {
      try {
        const errorParam = safe(searchParams.get("error"));
        const errorDescription = safe(searchParams.get("error_description"));

        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        const code = safe(searchParams.get("code"));
        const hashParams = parseHashParams();
        const hashAccessToken = safe(hashParams.get("access_token"));
        const hashRefreshToken = safe(hashParams.get("refresh_token"));
        const hashExposes = parseNumber(hashParams.get("expires_in"));
        const hashExpiresAt = parseNumber(hashParams.get("expires_at"));
        const hashTokenType = safe(hashParams.get("token_type"));
        const hashProviderToken = safe(hashParams.get("provider_token"));
        const hashProviderRefresh = safe(hashParams.get("provider_refresh_token"));

        const existingAccessToken = safe(searchParams.get("access_token"));
        const existingRefreshToken = safe(searchParams.get("refresh_token"));

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        } else {
          const accessToken = hashAccessToken || existingAccessToken;
          const refreshToken = hashRefreshToken || existingRefreshToken;

          if (accessToken && refreshToken) {
            const sessionPayload: Record<string, unknown> = {
              access_token: accessToken,
              refresh_token: refreshToken,
            };
            if (hashExposes !== undefined) {
              sessionPayload.expires_in = hashExposes;
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

            const { error: sessionError } = await supabase.auth.setSession(sessionPayload as any);
            if (sessionError) {
              throw sessionError;
            }
          } else {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
              throw new Error("We could not complete sign-in from that link. Please try again.");
            }
          }
        }

        if (!mounted) return;

        setMessage(
          nextPath === "/start"
            ? "You're signed in. Returning you to your learning record..."
            : "You're signed in. Taking you back to EduDecks..."
        );

        window.setTimeout(() => {
          router.replace(nextPath);
        }, 350);
      } catch (err: any) {
        console.error("Auth callback failed", err);
        if (!mounted) return;
        const safeMessage =
          safe(err?.message) || "We could not complete sign-in. Please try again.";
        setError(safeMessage);

        window.setTimeout(() => {
          router.replace(
            `/login?authError=${encodeURIComponent(safeMessage)}`
          );
        }, 900);
      }
    }

    void completeAuth();

    return () => {
      mounted = false;
    };
  }, [nextPath, router, searchParams]);

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
            EduDecks Family
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
              ? "We hit a problem while completing sign-in. We're sending you back to a safe place now."
              : nextPath === "/start"
              ? "Your learning record is still waiting for you. We'll take you back so you can keep saving your progress."
              : "You'll be returned to the right EduDecks page automatically."}
          </div>
        </div>
      </section>
    </main>
  );
}
