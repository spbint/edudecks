"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getMagicLinkCooldownRemainingMs,
  getMagicLinkErrorDetails,
  getMagicLinkRetryAfterMs,
  isValidMagicLinkEmail,
  MAGIC_LINK_CLIENT_RESEND_DELAY_MS,
  MAGIC_LINK_RATE_LIMIT_RETRY_DELAY_MS,
  mapMagicLinkError,
  normalizeMagicLinkFeedback,
  resetMagicLinkClientState,
  sendMagicLink,
} from "@/lib/authMagicLink";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { clearSignedOutMarker } from "@/lib/familySignOut";
import { supabase } from "@/lib/supabaseClient";

type SaveState = "idle" | "saving" | "success" | "error";
type AuthMode = "link" | "password";
const AUTH_MODE_STORAGE_KEY = "edudecks_login_auth_mode";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function readStoredAuthMode(): AuthMode | null {
  if (typeof window === "undefined") return null;
  const raw = safe(window.localStorage.getItem(AUTH_MODE_STORAGE_KEY));
  return raw === "password" || raw === "link" ? raw : null;
}

function persistAuthMode(mode: AuthMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore storage failures
  }
}

function passwordSignInMessage(error: unknown) {
  const original = safe((error as { message?: unknown })?.message);
  const message = original.toLowerCase();

  if (!message) {
    return "We couldn't sign you in with that password just yet. Please try again.";
  }

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "That email and password combination didn't match our records.";
  }

  if (message.includes("email not confirmed")) {
    return "This account still needs email confirmation before password sign-in can continue.";
  }

  return original;
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
  const devAuthModeEnabled = process.env.NEXT_PUBLIC_DEV_AUTH_MODE === "true";
  const [authMode, setAuthMode] = useState<AuthMode>(
    () => (devAuthModeEnabled ? "password" : "link"),
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [diagnosticCode, setDiagnosticCode] = useState("");
  const [retryBlockedUntil, setRetryBlockedUntil] = useState<number | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    const requestedMode = safe(searchParams.get("authMode"));
    const nextMode =
      requestedMode === "password" || requestedMode === "link"
        ? (requestedMode as AuthMode)
        : readStoredAuthMode() ?? (devAuthModeEnabled ? "password" : "link");

    setAuthMode(nextMode);
  }, [devAuthModeEnabled, searchParams]);

  useEffect(() => {
    persistAuthMode(authMode);
  }, [authMode]);

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
    clearSignedOutMarker();
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
  const normalizedEmail = useMemo(() => safe(email).toLowerCase(), [email]);
  const retryBlocked = retryCountdown > 0;
  const passwordValid = safe(password).length > 0;
  const passwordModeBusy = authMode === "password" && saveState === "saving";

  useEffect(() => {
    if (!normalizedEmail) return;

    const remainingMs = getMagicLinkCooldownRemainingMs(normalizedEmail);
    if (remainingMs > 0) {
      setRetryBlockedUntil(Date.now() + remainingMs);
    }
  }, [normalizedEmail]);

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
      clearSignedOutMarker();
      resetMagicLinkClientState();

      await sendMagicLink({
        email,
        nextPath: "/family",
        source: "login-page",
      });

      setRetryBlockedUntil(Date.now() + MAGIC_LINK_CLIENT_RESEND_DELAY_MS);
      setSaveState("success");
      setMessage("We’ve sent you a secure link to continue.");
      setDiagnosticCode("");
    } catch (err: unknown) {
      const details = getMagicLinkErrorDetails(err);
      const retryAfterMs =
        getMagicLinkRetryAfterMs(err) ??
        (details.category === "provider_rate_limit"
          ? MAGIC_LINK_RATE_LIMIT_RETRY_DELAY_MS
          : undefined);
      setSaveState("error");
      setMessage(
        mapMagicLinkError(err) ||
          "We couldn't send your secure link just yet. Please try again.",
      );
      setDiagnosticCode(details.diagnosticCode);
      if (retryAfterMs) {
        setRetryBlockedUntil(Date.now() + retryAfterMs);
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
      clearSignedOutMarker();
      resetMagicLinkClientState();

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
      setMessage(passwordSignInMessage(err));
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
      eyebrow="Sign in to EduDecks"
      heroTitle="Sign in without testing friction"
      heroText="Password sign-in is the steady path for repeated manual testing, while email-link access stays available when you need it."
      heroBadges={[]}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      footerPrimaryCta={{ label: "Continue to login", href: "/login?authMode=password" }}
      footerSecondaryCta={{ label: "See how EduDecks works", href: "/get-started" }}
      asideTitle="Two sign-in paths"
      asideText="Use password sign-in for repeat testing cycles. Keep the secure email link as a secondary option for families who prefer it."
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
            Sign in to EduDecks
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
            Choose your sign-in path
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
            Password sign-in is ready for repeated product testing. Email-link access remains available as a secondary path.
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
                ? "Password sign-in stays available across refresh, sign-out, and immediate sign-in again."
                : "Email-link sign-in stays available, but repeated testing should use password sign-in to avoid provider throttling."}
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
                "Choose Password for repeated testing.",
                "Use Email link only when you want a secure inbox hand-off.",
                "Reset your password if you need to establish the testing path.",
                "Sign out and back in again without waiting on email delivery.",
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
              Testing-safe sign-in
            </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#475569",
                }}
              >
              Password mode now stays selected across refresh and return visits, so manual testing can repeat cleanly without falling back to magic links.
              </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
