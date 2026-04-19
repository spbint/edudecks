"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PublicSiteShell from "@/app/components/PublicSiteShell";

type ResetState = "idle" | "saving" | "success" | "error";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    background: "#ffffff",
    padding: 24,
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
    marginBottom: 6,
    display: "block",
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "0 14px",
    fontSize: 14,
    color: "#0f172a",
    background: "#ffffff",
    outline: "none",
  };
}

function primaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 50,
    borderRadius: 14,
    border: "1px solid #2563eb",
    background: disabled ? "#93c5fd" : "#2563eb",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.8 : 1,
  };
}

function parseHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<ResetState>("idle");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  const passwordValid = useMemo(() => safe(password).length >= 8, [password]);
  const passwordsMatch = useMemo(
    () => safe(password) === safe(confirmPassword) && safe(confirmPassword).length > 0,
    [password, confirmPassword],
  );

  useEffect(() => {
    let active = true;

    async function prepareRecoverySession() {
      try {
        const hashParams = parseHashParams();
        const accessToken = safe(hashParams.get("access_token"));
        const refreshToken = safe(hashParams.get("refresh_token"));
        const code = safe(searchParams.get("code"));

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          } as never);
          if (error) {
            throw error;
          }
        }

        if (!active) return;
        setReady(true);
      } catch (err: unknown) {
        if (!active) return;
        setStatus("error");
        setMessage(
          safe((err as { message?: unknown })?.message) ||
            "We couldn't verify that password reset link. Please request a new one.",
        );
      }
    }

    void prepareRecoverySession();

    return () => {
      active = false;
    };
  }, [searchParams]);

  async function handleResetPassword() {
    if (status === "saving") {
      return;
    }

    if (!passwordValid) {
      setStatus("error");
      setMessage("Choose a password with at least 8 characters.");
      return;
    }

    if (!passwordsMatch) {
      setStatus("error");
      setMessage("Make sure both password fields match.");
      return;
    }

    try {
      setStatus("saving");
      setMessage("");

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      setMessage("Your password has been updated. Taking you back to login...");
      window.setTimeout(() => {
        router.replace("/login?authMessage=Your%20password%20has%20been%20updated.%20You%20can%20sign%20in%20now.");
      }, 1200);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(
        safe((err as { message?: unknown })?.message) ||
          "We couldn't update your password just yet. Please try again.",
      );
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Password reset"
      heroTitle="Set a new password"
      heroText="Choose a new password, then head back into EduDecks with a calmer sign-in path."
      heroBadges={[]}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Back to login", href: "/login" }}
      footerPrimaryCta={{ label: "Back to login", href: "/login" }}
      footerSecondaryCta={{ label: "Home", href: "/" }}
      asideTitle="Reset your password"
      asideText="This only changes your password. Your existing email-link sign-in flow still works."
      showWorkflowStrip={false}
    >
      <section style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={cardStyle()}>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: 1.05,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            Choose a new password
          </div>

          <div
            style={{
              fontSize: 26,
              lineHeight: 1.15,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Finish your password reset
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
              marginBottom: 18,
            }}
          >
            Set a password you can use for development or regular sign-in. Email links remain available too.
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleResetPassword();
            }}
            style={{ display: "grid", gap: 16 }}
          >
            <div>
              <label style={labelStyle()}>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (status !== "idle") {
                    setStatus("idle");
                    setMessage("");
                  }
                }}
                placeholder="At least 8 characters"
                style={inputStyle()}
                autoComplete="new-password"
                disabled={!ready || status === "saving"}
              />
            </div>

            <div>
              <label style={labelStyle()}>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (status !== "idle") {
                    setStatus("idle");
                    setMessage("");
                  }
                }}
                placeholder="Re-enter your password"
                style={inputStyle()}
                autoComplete="new-password"
                disabled={!ready || status === "saving"}
              />
            </div>

            {message ? (
              <div
                style={{
                  border: `1px solid ${status === "success" ? "#86efac" : "#fecaca"}`,
                  background: status === "success" ? "#ecfdf5" : "#fff1f2",
                  color: status === "success" ? "#166534" : "#9f1239",
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.6,
                }}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!ready || !passwordValid || !passwordsMatch || status === "saving"}
              style={primaryButtonStyle(
                !ready || !passwordValid || !passwordsMatch || status === "saving",
              )}
            >
              {status === "saving" ? "Saving your password..." : "Save new password"}
            </button>

            <Link
              href="/login"
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Back to login
            </Link>
          </form>
        </div>
      </section>
    </PublicSiteShell>
  );
}
