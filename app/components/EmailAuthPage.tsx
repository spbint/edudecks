"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { supabase } from "@/lib/supabaseClient";
import { normalizeAuthNextPath } from "@/lib/authRedirect";

type SaveState = "idle" | "saving" | "success" | "error";

const JOURNEY_STEPS = [
  {
    title: "Today",
    detail: "See what is planned and keep the day moving.",
  },
  {
    title: "Plan",
    detail: "Shape the week when you are ready.",
  },
  {
    title: "Capture",
    detail: "Record what happened while it is still fresh.",
  },
  {
    title: "Portfolio",
    detail: "Keep the evidence worth saving.",
  },
] as const;

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(value));
}

function passwordErrorMessage(error: unknown) {
  const original = safe((error as { message?: unknown })?.message);
  const message = original.toLowerCase();

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return "That email and password combination didn't match our records. Use Forgot password? below if you need a reset.";
  }

  if (message.includes("email not confirmed")) {
    return "This account still needs email confirmation before password sign-in can continue.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed")
  ) {
    return "We couldn't reach the sign-in service just now. Please try again.";
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

function spotlightCardStyle(): React.CSSProperties {
  return {
    border: "1px solid #dbeafe",
    borderRadius: 20,
    background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
    padding: 20,
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

function sectionLabelStyle(): React.CSSProperties {
  return {
    fontSize: 12,
    lineHeight: 1.2,
    fontWeight: 800,
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
  };
}

function statusCardStyle(saveState: SaveState): React.CSSProperties {
  const success = saveState === "success";
  const error = saveState === "error";

  return {
    border: `1px solid ${success ? "#86efac" : error ? "#fecaca" : "#dbeafe"}`,
    background: success ? "#ecfdf5" : error ? "#fff1f2" : "#eff6ff",
    color: success ? "#166534" : error ? "#9f1239" : "#1d4ed8",
    borderRadius: 16,
    padding: 16,
    display: "grid",
    gap: 8,
  };
}

function statusHeading(saveState: SaveState) {
  if (saveState === "success") return "Signed in";
  if (saveState === "error") return "We could not sign you in";
  return "Sign in to continue";
}

function nextPathLabel(nextPath: string) {
  if (nextPath.startsWith("/my-day")) return "My Day";
  if (nextPath.startsWith("/my-calendar")) return "My Calendar";
  if (nextPath.startsWith("/my-programs")) return "My Programs";
  if (nextPath.startsWith("/my-capture")) return "My Capture";
  if (nextPath.startsWith("/my-portfolio")) return "My Portfolio";
  if (nextPath.startsWith("/my-reports") || nextPath.startsWith("/my-outputs")) {
    return "Reports";
  }

  return "MyLearna";
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
  const redirectStarted = useRef(false);

  const nextPath = useMemo(
    () => normalizeAuthNextPath(searchParams.get("next"), "/my-day"),
    [searchParams],
  );
  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const passwordValid = useMemo(() => safe(password).length > 0, [password]);
  const destinationLabel = useMemo(() => nextPathLabel(nextPath), [nextPath]);

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
      setMessage("Please enter your password first.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");

      const { data, error } = await supabase.auth.signInWithPassword({
        email: safe(email).toLowerCase(),
        password,
      });

      if (error) {
        throw error;
      }

      const confirmedSession =
        data.session ?? (await supabase.auth.getSession()).data.session ?? null;

      if (!confirmedSession?.user) {
        console.warn("[auth] password sign-in returned without a confirmed session");
        setSaveState("error");
        setMessage(
          "Your sign-in was accepted, but we could not confirm the session. Please try again.",
        );
        return;
      }

      setSaveState("success");
      setMessage("Signed in. Taking you to MyLearna...");
      if (redirectStarted.current) return;
      redirectStarted.current = true;

      if (typeof window !== "undefined") {
        window.location.replace(nextPath);
        return;
      }

      router.replace(nextPath);
    } catch (error) {
      console.warn("[auth] password sign-in failed", {
        message: safe((error as { message?: unknown })?.message),
      });
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
      eyebrow="Return to MyLearna"
      heroTitle="Pick up your homeschool journey"
      heroText="Sign in to step back into today, move through the week, and keep your family record growing in one place."
      heroBadges={["Today", "Plan", "Capture", "Portfolio", "Reports"]}
      heroMicrocopy={`After sign-in, we will take you to ${destinationLabel}.`}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      footerPrimaryCta={{ label: "Back to login", href: "/login" }}
      footerSecondaryCta={{ label: "See how EduDecks works", href: "/get-started" }}
      asideTitle="Your next step"
      asideText="MyLearna should feel like one guided journey from planning through to reporting."
      showWorkflowStrip={false}
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div style={spotlightCardStyle()}>
            <div style={sectionLabelStyle()}>Your way back in</div>
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
                  gap: 10,
                }}
              >
                {JOURNEY_STEPS.map((step, index) => (
                  <div
                    key={step.title}
                    style={{
                      border: "1px solid #dbeafe",
                      borderRadius: 16,
                      background: "#ffffff",
                      padding: 14,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </div>
                    <strong style={{ color: "#0f172a", fontSize: 14 }}>{step.title}</strong>
                    <div
                      style={{
                        color: "#475569",
                        fontSize: 13,
                        lineHeight: 1.55,
                      }}
                    >
                      {step.detail}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderRadius: 16,
                  border: "1px solid #dbeafe",
                  background: "#ffffff",
                  padding: 16,
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Next destination
                </div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>{destinationLabel}</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  We will only move you on after sign-in succeeds and your session is confirmed.
                </div>
              </div>
            </div>
          </div>

          <div style={helperCardStyle()}>
            <div style={sectionLabelStyle()}>What to expect</div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Your login stays public until you choose to sign in.",
                "We only redirect after we confirm your session.",
                "If sign-in is rejected, the error stays visible here on the page.",
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px minmax(0, 1fr)",
                    gap: 10,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
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
                      color: "#334155",
                      fontSize: 14,
                      lineHeight: 1.6,
                      fontWeight: 700,
                    }}
                  >
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <div style={sectionLabelStyle()}>Sign in</div>

          <div
            style={{
              fontSize: 26,
              lineHeight: 1.15,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Continue your family journey
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
            Sign in with your MyLearna email and password. If you need to reset your password, the link stays visible here.
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ ...labelStyle(), marginBottom: 0 }}>Password</label>
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
              </div>
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
                  Please enter your password.
                </div>
              ) : null}
            </div>

            {message ? (
              <div
                style={statusCardStyle(saveState)}
                role={saveState === "error" ? "alert" : "status"}
              >
                <strong style={{ fontSize: 14 }}>{statusHeading(saveState)}</strong>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.6,
                  }}
                >
                  {message}
                </div>
                {saveState === "error" ? (
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    If you cannot remember your password, use <strong>Forgot password?</strong>.
                  </div>
                ) : null}
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
          </form>

          <div style={helperCardStyle()}>
            <div style={sectionLabelStyle()}>What happens after sign-in</div>
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {[
                "Open today's flow for the whole family.",
                "Move into planning when you want to shape the week.",
                "Capture what happened as the day unfolds.",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    background: "#ffffff",
                    padding: 12,
                    color: "#475569",
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontWeight: 700,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Link href="/get-started" style={secondaryButtonStyle()}>
            See how MyLearna works
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
