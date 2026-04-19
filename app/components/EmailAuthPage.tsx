"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getMagicLinkErrorDetails,
  isValidMagicLinkEmail,
  isMagicLinkRateLimited,
  MAGIC_LINK_RATE_LIMIT_RETRY_DELAY_MS,
  mapMagicLinkError,
  normalizeMagicLinkFeedback,
  resetMagicLinkClientState,
  sendMagicLink,
} from "@/lib/authMagicLink";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { supabase } from "@/lib/supabaseClient";

type SaveState = "idle" | "saving" | "success" | "error";
type AuthMode = "link" | "password";

function safe(v: unknown) {
  return String(v ?? "").trim();
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

function helperCardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#f8fafc",
    padding: 18,
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

function secondaryButtonStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

export default function EmailAuthPage() {
  return (
    <Suspense fallback={null}>
      <EmailAuthPageContent />
    </Suspense>
  );
}

function EmailAuthPageContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("link");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [diagnosticCode, setDiagnosticCode] = useState("");
  const [retryBlockedUntil, setRetryBlockedUntil] = useState<number | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const devAuthModeEnabled = process.env.NEXT_PUBLIC_DEV_AUTH_MODE === "true";

  useEffect(() => {
    const authError = normalizeMagicLinkFeedback(searchParams.get("authError"));
    const authMessage = normalizeMagicLinkFeedback(searchParams.get("authMessage"));
    const hasAuthFeedback = Boolean(authError || authMessage);

    if (hasAuthFeedback && typeof window !== "undefined") {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("authError");
      nextUrl.searchParams.delete("authMessage");
      const nextSearch = nextUrl.searchParams.toString();
      const nextHref = `${nextUrl.pathname}${nextSearch ? `?${nextSearch}` : ""}${nextUrl.hash}`;
      window.history.replaceState({}, "", nextHref);
    }

    if (authError) {
      setSaveState("error");
      setMessage(authError);
      setDiagnosticCode("AUTH-SEND-URL");
      return;
    }

    if (authMessage) {
      setSaveState("success");
      setMessage(authMessage);
      setDiagnosticCode("");
    }
  }, [searchParams]);

  useEffect(() => {
    resetMagicLinkClientState();
  }, []);

  useEffect(() => {
    if (!retryBlockedUntil) {
      setRetryCountdown(0);
      return;
    }

    const blockedUntil = retryBlockedUntil;

    function updateCountdown() {
      const nextSeconds = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
      setRetryCountdown(nextSeconds);

      if (nextSeconds === 0) {
        setRetryBlockedUntil(null);
      }
    }

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [retryBlockedUntil]);

  const emailValid = useMemo(() => isValidMagicLinkEmail(email), [email]);
  const retryBlocked = retryCountdown > 0;
  const passwordValid = safe(password).length > 0;
  const passwordModeBusy = authMode === "password" && saveState === "saving";

  function resetFeedback() {
    if (saveState !== "idle") {
      setSaveState("idle");
      setMessage("");
    }
    if (diagnosticCode) {
      setDiagnosticCode("");
    }
  }

  async function handleContinueWithLink() {
    if (saveState === "saving" || retryBlocked) {
      return;
    }

    if (!emailValid) {
      setSaveState("error");
      setMessage("Please enter a valid email address first.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");
      setDiagnosticCode("");
      resetMagicLinkClientState();

      await sendMagicLink({
        email,
        nextPath: "/family",
        source: "login-page",
      });

      setSaveState("success");
      setMessage("We’ve sent you a secure link to continue.");
      setDiagnosticCode("");
    } catch (err: unknown) {
      const details = getMagicLinkErrorDetails(err);
      setSaveState("error");
      setMessage(
        mapMagicLinkError(err) ||
          "We couldn't send your secure link just yet. Please try again.",
      );
      setDiagnosticCode(details.diagnosticCode);
      if (isMagicLinkRateLimited(err)) {
        setRetryBlockedUntil(Date.now() + MAGIC_LINK_RATE_LIMIT_RETRY_DELAY_MS);
      }
    }
  }

  async function handleContinueWithPassword() {
    if (saveState === "saving") {
      return;
    }

    if (!emailValid) {
      setSaveState("error");
      setMessage("Please enter a valid email address first.");
      return;
    }

    if (!passwordValid) {
      setSaveState("error");
      setMessage("Please enter your password first.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");
      setDiagnosticCode("");

      const { error } = await supabase.auth.signInWithPassword({
        email: safe(email).toLowerCase(),
        password,
      });

      if (error) {
        throw error;
      }

      window.location.assign("/family");
    } catch (err: unknown) {
      setSaveState("error");
      setMessage(
        safe((err as { message?: unknown })?.message) ||
          "We couldn't sign you in with that password just yet. Please try again.",
      );
    }
  }

  async function handleForgotPassword() {
    if (saveState === "saving") {
      return;
    }

    if (!emailValid) {
      setSaveState("error");
      setMessage("Enter a valid email first so we know where to send the reset link.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");
      setDiagnosticCode("");

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : "/reset-password";

      const { error } = await supabase.auth.resetPasswordForEmail(
        safe(email).toLowerCase(),
        { redirectTo },
      );

      if (error) {
        throw error;
      }

      setSaveState("success");
      setMessage("We’ve sent a password reset link to your email.");
    } catch (err: unknown) {
      setSaveState("error");
      setMessage(
        safe((err as { message?: unknown })?.message) ||
          "We couldn't send the password reset email just yet. Please try again.",
      );
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Passwordless entry"
      heroTitle="Start your first learning moment"
      heroText="Enter your email and we’ll guide you from there."
      heroBadges={[]}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      footerPrimaryCta={{ label: "Continue with your email", href: "/login" }}
      footerSecondaryCta={{ label: "See how EduDecks works", href: "/get-started" }}
      asideTitle="A calm way to begin"
      asideText="There is no password to manage. EduDecks sends one secure link, then guides you into the next step."
      showWorkflowStrip={false}
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.05fr) minmax(320px,0.95fr)",
          gap: 22,
          alignItems: "start",
        }}
      >
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
            Continue with your email
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
            Start with your email
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
              marginBottom: 18,
              maxWidth: 720,
            }}
          >
            Use the same email flow whether you are new to EduDecks or returning to continue where you left off.
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (authMode === "password") {
                void handleContinueWithPassword();
                return;
              }
              void handleContinueWithLink();
            }}
            style={{ display: "grid", gap: 16 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode("link");
                  setPassword("");
                  resetFeedback();
                }}
                style={{
                  ...secondaryButtonStyle(),
                  minHeight: 44,
                  borderColor: authMode === "link" ? "#2563eb" : "#e5e7eb",
                  background: authMode === "link" ? "#eff6ff" : "#ffffff",
                  color: authMode === "link" ? "#1d4ed8" : "#0f172a",
                }}
              >
                Email link
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  resetFeedback();
                }}
                style={{
                  ...secondaryButtonStyle(),
                  minHeight: 44,
                  borderColor: authMode === "password" ? "#2563eb" : "#e5e7eb",
                  background: authMode === "password" ? "#eff6ff" : "#ffffff",
                  color: authMode === "password" ? "#1d4ed8" : "#0f172a",
                }}
              >
                Password
              </button>
            </div>

            <div>
              <label style={labelStyle()}>Email address</label>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  resetFeedback();
                }}
                placeholder="Enter your email"
                style={{
                  ...inputStyle(),
                  borderColor: safe(email) && !emailValid ? "#fca5a5" : "#d1d5db",
                }}
                autoComplete="email"
                inputMode="email"
                disabled={saveState === "saving"}
              />
              {safe(email) && !emailValid ? (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#b91c1c",
                    lineHeight: 1.5,
                  }}
                >
                  Please enter a valid email address.
                </div>
              ) : null}
            </div>

            {authMode === "password" ? (
              <div>
                <label style={labelStyle()}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    resetFeedback();
                  }}
                  placeholder="Enter your password"
                  style={inputStyle()}
                  autoComplete="current-password"
                  disabled={passwordModeBusy}
                />
              </div>
            ) : null}

            {saveState === "success" ? (
              <div
                style={{
                  border: "1px solid #86efac",
                  background: "#ecfdf5",
                  color: "#166534",
                  borderRadius: 14,
                  padding: 14,
                  display: "grid",
                  gap: 4,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900 }}>Check your email</div>
                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.6 }}>{message}</div>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.6 }}>
                  {authMode === "password"
                    ? "Use the reset link from your inbox to choose a new password."
                    : "Refreshing this page will not send another link. Use the resend button only if you need a new email."}
                </div>
              </div>
            ) : message ? (
              <div
                style={{
                  border: "1px solid #fecaca",
                  background: "#fff1f2",
                  color: "#9f1239",
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.6,
                }}
              >
                {message}
                {diagnosticCode ? (
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, lineHeight: 1.5 }}>
                    Diagnostic: {diagnosticCode}
                  </div>
                ) : null}
                {retryBlocked ? (
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, lineHeight: 1.5 }}>
                    Retry available in about {retryCountdown}s.
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={
                authMode === "password"
                  ? !emailValid || !passwordValid || saveState === "saving"
                  : !emailValid || saveState === "saving" || retryBlocked
              }
              style={primaryButtonStyle(
                authMode === "password"
                  ? !emailValid || !passwordValid || saveState === "saving"
                  : !emailValid || saveState === "saving" || retryBlocked,
              )}
            >
              {authMode === "password"
                ? saveState === "saving"
                  ? "Signing you in..."
                  : "Continue with password"
                : saveState === "saving"
                  ? "Sending your secure link..."
                  : retryBlocked
                    ? `Wait ${retryCountdown}s before retrying`
                    : saveState === "success"
                      ? "Resend link"
                      : "Continue"}
            </button>

            {authMode === "password" ? (
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                disabled={!emailValid || saveState === "saving"}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  fontSize: 13,
                  fontWeight: 800,
                  textAlign: "center",
                  cursor: !emailValid || saveState === "saving" ? "not-allowed" : "pointer",
                  opacity: !emailValid || saveState === "saving" ? 0.7 : 1,
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            ) : null}

            <div
              style={{
                marginTop: -4,
                fontSize: 12,
                lineHeight: 1.6,
                color: "#64748b",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {authMode === "password"
                ? "Password sign-in is available for development and returning families."
                : "Password-free entry. One secure link. No extra decisions."}
            </div>

            {devAuthModeEnabled ? (
              <div
                style={{
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: 14,
                  padding: 12,
                  fontSize: 12,
                  fontWeight: 800,
                  lineHeight: 1.6,
                  textAlign: "center",
                }}
              >
                Dev mode: use password login to avoid OTP rate limits.
              </div>
            ) : null}

            <Link href="/get-started" style={secondaryButtonStyle()}>
              See how EduDecks works
            </Link>
          </form>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={helperCardStyle()}>
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
              What happens next
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Enter your email once.",
                "Open the secure link we send.",
                "Continue into EduDecks without a password.",
                "Pick up the next guided step from there.",
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px minmax(0,1fr)",
                    gap: 10,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "#334155",
                      fontWeight: 700,
                    }}
                  >
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={helperCardStyle()}>
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              One simple way in
            </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#475569",
                }}
              >
              Families can still use the simple email link, and development teams can switch to password entry when they need a steadier local sign-in path.
              </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
