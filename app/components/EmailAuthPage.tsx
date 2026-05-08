"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import {
  hasSupabaseEnv,
  MISSING_PUBLIC_SUPABASE_ENV_MESSAGE,
  supabase,
} from "@/lib/supabaseClient";
import { buildAuthCallbackUrl, normalizeAuthNextPath } from "@/lib/authRedirect";
import { loadCleanFamilyProfile } from "@/lib/clean/family/client";

export type EmailAuthPageMode = "login" | "signup";

type EmailAuthPageProps = {
  mode?: EmailAuthPageMode;
};

type SaveState =
  | "idle"
  | "saving"
  | "signed-in"
  | "signed-up"
  | "check-email"
  | "error";

const LOGIN_JOURNEY_STEPS = [
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

const SIGNUP_FIRST_STEPS = [
  {
    title: "Add learner",
    detail: "Start with the learner you want to support first.",
  },
  {
    title: "Set context",
    detail: "Choose your country, state, and reporting context.",
  },
  {
    title: "Plan week",
    detail: "Set up the week before the learning notes begin.",
  },
  {
    title: "Capture note",
    detail: "Record the first real learning moment from the day.",
  },
] as const;

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(value));
}

function authErrorMessage(error: unknown, mode: EmailAuthPageMode) {
  const original = safe((error as { message?: unknown })?.message);
  const message = original.toLowerCase();

  if (mode === "signup") {
    if (
      message.includes("user already registered") ||
      message.includes("already registered") ||
      message.includes("already been registered")
    ) {
      return "That email already has a MyLearna account. Sign in instead, or use Forgot password? on the sign-in screen.";
    }

    if (message.includes("password")) {
      return original || "Please choose a stronger password and try again.";
    }
  }

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
    return mode === "signup"
      ? "We couldn't reach account creation just now. Please try again."
      : "We couldn't reach the sign-in service just now. Please try again.";
  }

  return (
    original ||
    (mode === "signup"
      ? "We couldn't create your account just yet. Please try again."
      : "We couldn't sign you in just yet. Please try again.")
  );
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
  const success = saveState === "signed-in" || saveState === "signed-up";
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

function nextPathLabel(nextPath: string) {
  if (nextPath.startsWith("/my-profile")) return "My Profile";
  if (nextPath.startsWith("/my-settings")) return "My Settings";
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

async function resolveFirstAppPath(requestedNextPath: string) {
  try {
    const familyState = await loadCleanFamilyProfile();
    return familyState.profile ? requestedNextPath : "/my-profile";
  } catch {
    return "/my-profile";
  }
}

function buildAlternateAuthHref(mode: EmailAuthPageMode, nextPath: string) {
  const base = mode === "login" ? "/signup" : "/login";
  return nextPath ? `${base}?next=${encodeURIComponent(nextPath)}` : base;
}

export default function EmailAuthPage({ mode = "login" }: EmailAuthPageProps) {
  return (
    <Suspense fallback={null}>
      <EmailAuthPageContent mode={mode} />
    </Suspense>
  );
}

function EmailAuthPageContent({ mode }: { mode: EmailAuthPageMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [statusTitle, setStatusTitle] = useState("");
  const redirectStarted = useRef(false);

  const isSignup = mode === "signup";
  const defaultNextPath = isSignup ? "/my-profile" : "/my-day";
  const nextPath = useMemo(
    () => normalizeAuthNextPath(searchParams.get("next"), defaultNextPath),
    [defaultNextPath, searchParams],
  );
  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const passwordValid = useMemo(() => safe(password).length > 0, [password]);
  const confirmPasswordValid = useMemo(
    () => !isSignup || safe(confirmPassword) === safe(password),
    [confirmPassword, isSignup, password],
  );
  const destinationLabel = useMemo(() => nextPathLabel(nextPath), [nextPath]);
  const alternateAuthHref = useMemo(() => buildAlternateAuthHref(mode, nextPath), [mode, nextPath]);

  function clearFeedback() {
    setSaveState("idle");
    setMessage("");
    setStatusTitle("");
  }

  function setStatus(nextState: SaveState, nextTitle: string, nextMessage: string) {
    setSaveState(nextState);
    setStatusTitle(nextTitle);
    setMessage(nextMessage);
  }

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setStatus("error", "Configuration needed", MISSING_PUBLIC_SUPABASE_ENV_MESSAGE);
      return;
    }

    const authMessage = safe(searchParams.get("authMessage"));
    const authError = safe(searchParams.get("authError"));

    if (authError) {
      setStatus(
        "error",
        isSignup ? "We could not create your account" : "We could not sign you in",
        authError,
      );
      return;
    }

    if (authMessage) {
      const lower = authMessage.toLowerCase();
      if (lower.includes("signed out")) {
        setStatus("idle", "Signed out", authMessage);
      } else {
        setStatus("idle", "Notice", authMessage);
      }
      return;
    }

    clearFeedback();
  }, [isSignup, searchParams]);

  async function redirectAfterSession(successTitle: string, successMessage: string, targetPath: string) {
    setStatus(isSignup ? "signed-up" : "signed-in", successTitle, successMessage);

    if (redirectStarted.current) return;
    redirectStarted.current = true;

    if (typeof window !== "undefined") {
      window.location.replace(targetPath);
      return;
    }

    router.replace(targetPath);
  }

  async function handlePasswordSignIn() {
    if (saveState === "saving") return;

    if (!hasSupabaseEnv) {
      setStatus("error", "Configuration needed", MISSING_PUBLIC_SUPABASE_ENV_MESSAGE);
      return;
    }

    if (!emailValid) {
      setStatus("error", "We could not sign you in", "Please enter a valid email address first.");
      return;
    }

    if (!passwordValid) {
      setStatus("error", "We could not sign you in", "Please enter your password first.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");
      setStatusTitle("");

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
        setStatus(
          "error",
          "We could not sign you in",
          "Your sign-in was accepted, but we could not confirm the session. Please try again.",
        );
        return;
      }

      await redirectAfterSession(
        "Signed in",
        "Signed in. Taking you to MyLearna...",
        nextPath,
      );
    } catch (error) {
      setStatus("error", "We could not sign you in", authErrorMessage(error, "login"));
    }
  }

  async function handleCreateAccount() {
    if (saveState === "saving") return;

    if (!hasSupabaseEnv) {
      setStatus("error", "Configuration needed", MISSING_PUBLIC_SUPABASE_ENV_MESSAGE);
      return;
    }

    if (!emailValid) {
      setStatus("error", "We could not create your account", "Please enter a valid email address first.");
      return;
    }

    if (!passwordValid) {
      setStatus("error", "We could not create your account", "Please enter your password first.");
      return;
    }

    if (!confirmPasswordValid) {
      setStatus("error", "We could not create your account", "Confirm password must match your password.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");
      setStatusTitle("");

      const { data, error } = await supabase.auth.signUp({
        email: safe(email).toLowerCase(),
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(nextPath),
        },
      });

      if (error) {
        throw error;
      }

      const confirmedSession =
        data.session ?? (await supabase.auth.getSession()).data.session ?? null;

      if (!confirmedSession?.user) {
        const identityCount = Array.isArray(data.user?.identities)
          ? data.user.identities.length
          : undefined;

        const emailMessage =
          identityCount === 0
            ? "If this email is new, check your email to confirm your account. If you already have an account, sign in instead."
            : "Check your email to confirm your account.";

        setStatus(
          "check-email",
          "Check your email",
          `${emailMessage} After confirmation, we'll take you to My Profile to add your learner, set your reporting context, plan your week, and capture your first note.`,
        );
        return;
      }

      const resolvedPath = await resolveFirstAppPath(nextPath);
      await redirectAfterSession(
        "Account created",
        "Account created. Taking you to your first setup step...",
        resolvedPath,
      );
    } catch (error) {
      setStatus("error", "We could not create your account", authErrorMessage(error, "signup"));
    }
  }

  async function handleForgotPassword() {
    if (saveState === "saving") return;

    if (!hasSupabaseEnv) {
      setStatus("error", "Configuration needed", MISSING_PUBLIC_SUPABASE_ENV_MESSAGE);
      return;
    }

    if (!emailValid) {
      setStatus(
        "error",
        "We could not send the reset link",
        "Enter a valid email first so we know where to send the reset link.",
      );
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");
      setStatusTitle("");

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

      setStatus("check-email", "Check your email", "We've sent a password reset link to your email.");
    } catch (error) {
      setStatus(
        "error",
        "We could not send the reset link",
        safe((error as { message?: unknown })?.message) ||
          "We couldn't send the password reset email just yet. Please try again.",
      );
    }
  }

  const formLabel = isSignup ? "Create account" : "Sign in";
  const formTitle = isSignup ? "Create your MyLearna account" : "Continue your family journey";
  const formText = isSignup
    ? "Use your email and password to begin. After account creation, you'll move into learner and family setup."
    : "Sign in with your MyLearna email and password. If you need to reset your password, the link stays visible here.";
  const introNotice = isSignup
    ? "New to MyLearna? Start with your email and password. If email confirmation is required, we'll ask you to check your inbox before you continue."
    : "Existing account sign-in is live on this screen. New to MyLearna? Create your account from the signup screen.";
  const heroTitle = isSignup ? "Create your MyLearna account" : "Pick up your homeschool journey";
  const heroText = isSignup
    ? "Start your learning record with your email and password, then move into learner setup, weekly planning, and your first capture note."
    : "Sign in to step back into today, move through the week, and keep your family record growing in one place.";
  const heroMicrocopy = isSignup
    ? "After account creation, we will take you into your first setup step."
    : `After sign-in, we will take you to ${destinationLabel}.`;
  const alternatePrompt = isSignup ? "Already have an account?" : "New to MyLearna?";
  const alternateLabel = isSignup ? "Sign in" : "Create an account";
  const footerPrimary = isSignup
    ? { label: "Back to signup", href: "/signup" }
    : { label: "Back to login", href: "/login" };

  return (
    <PublicSiteShell
      title="MyLearna"
      eyebrow={isSignup ? "Create your account" : "Return to MyLearna"}
      heroTitle={heroTitle}
      heroText={heroText}
      heroBadges={isSignup ? ["Add learner", "Set context", "Plan week", "Capture note"] : ["Today", "Plan", "Capture", "Portfolio", "Reports"]}
      heroMicrocopy={heroMicrocopy}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      footerPrimaryCta={footerPrimary}
      footerSecondaryCta={{ label: "See how MyLearna works", href: "/#how-it-works" }}
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
            <div style={sectionLabelStyle()}>
              {isSignup ? "Your first steps" : "Your way back in"}
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
                  gap: 10,
                }}
              >
                {(isSignup ? SIGNUP_FIRST_STEPS : LOGIN_JOURNEY_STEPS).map((step, index) => (
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
                <div
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {isSignup ? "Starting point" : "Next destination"}
                </div>
                <strong style={{ color: "#0f172a", fontSize: 18 }}>
                  {isSignup ? "My Profile" : destinationLabel}
                </strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {isSignup
                    ? "After account creation, learner and family setup comes first so the rest of the workflow has a home."
                    : "We only move you on after sign-in succeeds and your session is confirmed."}
                </div>
              </div>
            </div>
          </div>

          <div style={helperCardStyle()}>
            <div style={sectionLabelStyle()}>{isSignup ? "What to expect" : "What happens after sign-in"}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {(isSignup
                ? [
                    "Create your account with your email and password.",
                    "Add your learner and family details first.",
                    "Move into planning, capture, portfolio, and reports over time.",
                  ]
                : [
                    "Open today's flow for the whole family.",
                    "Move into planning when you want to shape the week.",
                    "Capture what happened as the day unfolds.",
                  ]).map((item, index) => (
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
          <div style={sectionLabelStyle()}>{formLabel}</div>

          <div
            style={{
              fontSize: 26,
              lineHeight: 1.15,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            {formTitle}
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
            {formText}
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              background: "#f8fafc",
              padding: 14,
              marginBottom: 18,
              color: "#475569",
              fontSize: 14,
              lineHeight: 1.6,
              fontWeight: 700,
            }}
          >
            {introNotice}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (isSignup) {
                void handleCreateAccount();
              } else {
                void handlePasswordSignIn();
              }
            }}
            style={{ display: "grid", gap: 16 }}
          >
            <div>
              <label style={labelStyle()}>Email address</label>
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFeedback();
                }}
                placeholder="Enter your email"
                style={inputStyle(safe(email) !== "" && !emailValid)}
                autoComplete="email"
                inputMode="email"
                disabled={!hasSupabaseEnv || saveState === "saving"}
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
                {!isSignup ? (
                  <button
                    type="button"
                    onClick={() => void handleForgotPassword()}
                    disabled={!hasSupabaseEnv || !emailValid || saveState === "saving"}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#2563eb",
                      fontSize: 13,
                      fontWeight: 800,
                      textAlign: "center",
                      cursor:
                        !hasSupabaseEnv || !emailValid || saveState === "saving"
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        !hasSupabaseEnv || !emailValid || saveState === "saving" ? 0.7 : 1,
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                ) : null}
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFeedback();
                }}
                placeholder={isSignup ? "Create a password" : "Enter your password"}
                style={inputStyle(safe(password) !== "" && !passwordValid)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                disabled={!hasSupabaseEnv || saveState === "saving"}
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

            {isSignup ? (
              <div>
                <label style={labelStyle()}>Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    clearFeedback();
                  }}
                  placeholder="Confirm your password"
                  style={inputStyle(safe(confirmPassword) !== "" && !confirmPasswordValid)}
                  autoComplete="new-password"
                  disabled={!hasSupabaseEnv || saveState === "saving"}
                />
                {safe(confirmPassword) && !confirmPasswordValid ? (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: "#b91c1c",
                      lineHeight: 1.5,
                    }}
                  >
                    Confirm password must match your password.
                  </div>
                ) : null}
              </div>
            ) : null}

            {message ? (
              <div style={statusCardStyle(saveState)} role={saveState === "error" ? "alert" : "status"}>
                <strong style={{ fontSize: 14 }}>
                  {statusTitle ||
                    (saveState === "signed-up"
                      ? "Account created"
                      : saveState === "signed-in"
                        ? "Signed in"
                        : saveState === "check-email"
                          ? "Check your email"
                          : saveState === "error"
                            ? isSignup
                              ? "We could not create your account"
                              : "We could not sign you in"
                            : isSignup
                              ? "Create your account"
                              : "Sign in to continue")}
                </strong>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1.6,
                  }}
                >
                  {message}
                </div>
                {saveState === "error" && !isSignup ? (
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    If you cannot remember your password, use <strong>Forgot password?</strong>.
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={
                !hasSupabaseEnv ||
                !emailValid ||
                !passwordValid ||
                (isSignup && !confirmPasswordValid) ||
                saveState === "saving"
              }
              style={primaryButtonStyle(
                !hasSupabaseEnv ||
                  !emailValid ||
                  !passwordValid ||
                  (isSignup && !confirmPasswordValid) ||
                  saveState === "saving",
              )}
            >
              {saveState === "saving"
                ? isSignup
                  ? "Creating your account..."
                  : "Signing you in..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <div
            style={{
              marginTop: 16,
              color: "#475569",
              fontSize: 14,
              lineHeight: 1.6,
              fontWeight: 700,
            }}
          >
            {alternatePrompt}{" "}
            <Link href={alternateAuthHref} style={{ color: "#2563eb", fontWeight: 800 }}>
              {alternateLabel}
            </Link>
          </div>

          <Link href="/#how-it-works" style={{ ...secondaryButtonStyle(), marginTop: 16 }}>
            See how MyLearna works
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
