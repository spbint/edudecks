"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { supabase } from "@/lib/supabaseClient";

type SaveState = "idle" | "saving" | "success" | "error";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(value));
}

function normalizeNextPath(value: string | null | undefined) {
  const clean = safe(value);
  if (!clean.startsWith("/")) return "/family";
  if (clean.startsWith("//")) return "/family";
  return clean || "/family";
}

function passwordErrorMessage(error: unknown) {
  const original = safe((error as { message?: unknown })?.message);
  const message = original.toLowerCase();

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "That email and password combination didn't match our records.";
  }

  if (message.includes("email not confirmed")) {
    return "This account still needs email confirmation before password sign-in can continue.";
  }

  return original || "We couldn't sign you in just yet. Please try again.";
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

function inputStyle(invalid = false): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    border: `1px solid ${invalid ? "#fca5a5" : "#d1d5db"}`,
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  const nextPath = useMemo(
    () => normalizeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const passwordValid = useMemo(() => safe(password).length >= 8, [password]);

  useEffect(() => {
    const authMessage = safe(searchParams.get("authMessage"));
    const authError = safe(searchParams.get("authError"));

    if (authError) {
      setSaveState("error");
      setMessage(authError);
      return;
    }

    if (authMessage) {
      setSaveState("success");
      setMessage(authMessage);
      return;
    }

    setSaveState("idle");
    setMessage("");
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        router.replace(nextPath);
      }
    }

    void hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        router.replace(nextPath);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [nextPath, router]);

  function resetFeedback() {
    if (saveState !== "idle") {
      setSaveState("idle");
      setMessage("");
    }
  }

  async function handlePasswordSignIn() {
    if (saveState === "saving") return;

    if (!emailValid) {
      setSaveState("error");
      setMessage("Please enter a valid email address first.");
      return;
    }

    if (!passwordValid) {
      setSaveState("error");
      setMessage("Please enter your password. Passwords need at least 8 characters.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");

      const { error } = await supabase.auth.signInWithPassword({
        email: safe(email).toLowerCase(),
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setSaveState("error");
      setMessage(passwordErrorMessage(error));
    }
  }

  async function handleForgotPassword() {
    if (saveState === "saving") return;

    if (!emailValid) {
      setSaveState("error");
      setMessage("Enter a valid email first so we know where to send the reset link.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");

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
      setMessage("We've sent a password reset link to your email.");
    } catch (error) {
      setSaveState("error");
      setMessage(
        safe((error as { message?: unknown })?.message) ||
          "We couldn't send the password reset email just yet. Please try again.",
      );
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Sign in to EduDecks"
      heroTitle="Password-first family sign-in"
      heroText="Use your email and password to get back into the family workspace quickly and repeatably."
      heroBadges={[]}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      footerPrimaryCta={{ label: "Back to login", href: "/login" }}
      footerSecondaryCta={{ label: "See how EduDecks works", href: "/get-started" }}
      asideTitle="Simple auth"
      asideText="EduDecks now uses a single password-first login flow for real use, repeated testing, and admin verification."
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
            Sign in
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
            Continue with password
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
            Sign in with your EduDecks email and password. If you need to set a new password, use the reset link below.
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handlePasswordSignIn();
            }}
            style={{ display: "grid", gap: 16 }}
          >
            <div>
              <label style={labelStyle()}>Email address</label>
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  resetFeedback();
                }}
                placeholder="Enter your email"
                style={inputStyle(safe(email) !== "" && !emailValid)}
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

            <div>
              <label style={labelStyle()}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  resetFeedback();
                }}
                placeholder="Enter your password"
                style={inputStyle(safe(password) !== "" && !passwordValid)}
                autoComplete="current-password"
                disabled={saveState === "saving"}
              />
              {safe(password) && !passwordValid ? (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#b91c1c",
                    lineHeight: 1.5,
                  }}
                >
                  Passwords need at least 8 characters.
                </div>
              ) : null}
            </div>

            {message ? (
              <div
                style={{
                  border: `1px solid ${saveState === "success" ? "#86efac" : "#fecaca"}`,
                  background: saveState === "success" ? "#ecfdf5" : "#fff1f2",
                  color: saveState === "success" ? "#166534" : "#9f1239",
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
              disabled={!emailValid || !passwordValid || saveState === "saving"}
              style={primaryButtonStyle(
                !emailValid || !passwordValid || saveState === "saving",
              )}
            >
              {saveState === "saving" ? "Signing you in..." : "Sign in"}
            </button>

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
              What works now
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "One password form on one login page.",
                "One reset-password path from the same screen.",
                "Session stays valid across refresh until you sign out.",
                "Sign-out returns you cleanly to login.",
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
              Testing-safe login
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
              }}
            >
              This flow no longer depends on sending a sign-in email for repeated manual testing. Use password sign-in, sign out, and sign in again immediately.
            </div>
          </div>

          <Link href="/get-started" style={secondaryButtonStyle()}>
            See how EduDecks works
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
