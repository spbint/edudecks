"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import {
  hasSupabaseEnv,
  MISSING_PUBLIC_SUPABASE_ENV_MESSAGE,
  supabase,
} from "@/lib/supabaseClient";
import { buildAuthCallbackUrl, normalizeAuthNextPath } from "@/lib/authRedirect";
import {
  getMagicLinkRetryAfterMs,
  mapMagicLinkError,
  sendEmailAuthChallenge,
  sendMagicLink,
} from "@/lib/authMagicLink";
import { getEmailAuthDelivery } from "@/lib/authEmailMode";
import { markPendingProductEntry, resetAuthAttempt, trackAuthEvent } from "@/lib/authAnalytics";
import { loadCleanFamilyProfile } from "@/lib/clean/family/client";
import { hasRequiredLearningSettings } from "@/lib/clean/setup/setupFlow";
import { completeFamilySignOut } from "@/lib/familySignOut";
import { readSignupPrefill } from "@/lib/signupPrefill";

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
  | "code-entry"
  | "error";

type AuthAction = "none" | "password" | "email-link" | "password-reset";

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
      return "Please check your password and try again.";
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

  return mode === "signup"
    ? "We couldn't create your account just yet. Please try again."
    : "We couldn't sign you in just yet. Please try again.";
}

function emailLinkErrorMessage(error: unknown, mode: EmailAuthPageMode) {
  const rawMessage = safe((error as { message?: unknown })?.message).toLowerCase();
  const errorCode = safe((error as { code?: unknown })?.code).toLowerCase();

  if (
    mode === "login" &&
    (errorCode === "user_not_found" ||
      rawMessage.includes("user not found") ||
      rawMessage.includes("no user"))
  ) {
    return "We couldn't find a MyLearna account for that email yet. Create your account first, or continue with your password if you already have one.";
  }

  if (
    errorCode === "signup_disabled" ||
    rawMessage.includes("signup disabled") ||
    rawMessage.includes("signups not allowed")
  ) {
    return mode === "signup"
      ? "Secure sign-in links are not available for new accounts right now. Please create your password to continue."
      : "Secure sign-in links are not available for that email right now. Please continue with your password instead.";
  }

  return mapMagicLinkError(error);
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

function secondaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.7 : 1,
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
  if (nextPath.startsWith("/my-pathways")) return "My Pathways";
  if (nextPath.startsWith("/my-assessments")) return "My Assessments";
  if (nextPath.startsWith("/my-capture")) return "Quick Capture";
  if (nextPath.startsWith("/my-portfolio")) return "My Portfolio";
  if (nextPath.startsWith("/my-reports") || nextPath.startsWith("/my-outputs")) {
    return "Reports";
  }

  return "MyLearna";
}

async function resolveFirstAppPath(requestedNextPath: string) {
  try {
    const familyState = await loadCleanFamilyProfile();
    if (!familyState.profile) return "/my-profile";
    if (
      !hasRequiredLearningSettings(familyState.profile) &&
      requestedNextPath !== "/my-profile" &&
      requestedNextPath !== "/my-settings"
    ) {
      return "/my-settings";
    }
    return requestedNextPath;
  } catch {
    return "/my-profile";
  }
}

function buildAlternateAuthHref(mode: EmailAuthPageMode, nextPath: string) {
  const base = mode === "login" ? "/signup" : "/login";
  return nextPath ? `${base}?next=${encodeURIComponent(nextPath)}` : base;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function waitForServerSessionReadiness() {
  if (typeof window === "undefined") {
    return;
  }

  const startedAt = Date.now();
  const timeoutMs = 5000;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`/api/auth/session-ready?ts=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "x-mylearna-auth-probe": "1",
        },
      });

      if (response.ok) {
        return;
      }
    } catch {
      // Ignore transient probe failures while the browser and server session catch up.
    }

    await wait(250);
  }

  throw new Error(
    "Your sign-in was accepted, but MyLearna could not finish the secure handoff yet. Please try again.",
  );
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
  const { user, loading: authUserLoading } = useAuthUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [authAction, setAuthAction] = useState<AuthAction>("none");
  const [message, setMessage] = useState("");
  const [statusTitle, setStatusTitle] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [sessionSwitchBusy, setSessionSwitchBusy] = useState(false);
  const [sessionSwitchError, setSessionSwitchError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendRemainingMs, setResendRemainingMs] = useState(0);
  const [showPasswordFallbackUi, setShowPasswordFallbackUi] = useState(false);
  const redirectStarted = useRef(false);
  const signupPrefillChecked = useRef(false);

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
  const isBusy = saveState === "saving" || isRedirecting;
  const emailDelivery = getEmailAuthDelivery();

  useEffect(() => {
    if (resendRemainingMs <= 0) return;
    const timer = window.setInterval(() => setResendRemainingMs((value) => Math.max(0, value - 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [resendRemainingMs]);

  function clearFeedback() {
    setSaveState("idle");
    setAuthAction("none");
    setMessage("");
    setStatusTitle("");
    setIsRedirecting(false);
  }

  function maskedEmail(value: string) {
    const [local, domain] = value.split("@");
    if (!local || !domain) return "your email address";
    return `${local.slice(0, 1)}${"•".repeat(Math.min(4, Math.max(2, local.length - 1)))}@${domain}`;
  }

  function setStatus(
    nextState: SaveState,
    nextTitle: string,
    nextMessage: string,
    nextAction: AuthAction = "none",
  ) {
    setSaveState(nextState);
    setAuthAction(nextAction);
    setStatusTitle(nextTitle);
    setMessage(nextMessage);
  }

  useEffect(() => {
    trackAuthEvent("auth_page_viewed", { journey: mode, challengeType: emailDelivery !== "magic-link" ? "otp_code" : "magic_link", route: window.location.pathname });
  }, [emailDelivery, mode]);

  useEffect(() => {
    if (signupPrefillChecked.current) return;
    signupPrefillChecked.current = true;

    if (!email) {
      const storedEmail = typeof window !== "undefined" ? window.sessionStorage.getItem("mylearna.auth.email") ?? "" : "";
      const prefillEmail = storedEmail || (isSignup ? readSignupPrefill()?.email ?? "" : "");
      if (prefillEmail) {
        setEmail(prefillEmail);
      }
    }
  }, [email, isSignup]);

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

  async function waitForBrowserSessionPropagation() {
    if (typeof window === "undefined") {
      return;
    }

    const currentSession = (await supabase.auth.getSession()).data.session ?? null;
    if (currentSession?.user) {
      await wait(200);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;

      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutHandle);
        subscription.unsubscribe();

        if (error) {
          reject(error);
          return;
        }

        resolve();
      };

      const timeoutHandle = window.setTimeout(async () => {
        try {
          const fallbackSession = (await supabase.auth.getSession()).data.session ?? null;
          if (fallbackSession?.user) {
            await wait(200);
            finish();
            return;
          }

          finish(
            new Error(
              "Your sign-in was accepted, but we could not confirm the session in the browser yet.",
            ),
          );
        } catch (error) {
          finish(error);
        }
      }, 2500);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          (event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED" ||
            event === "INITIAL_SESSION") &&
          session?.user
        ) {
          window.setTimeout(() => finish(), 200);
        }
      });
    });
  }

  async function redirectAfterSession(successTitle: string, successMessage: string, targetPath: string, challengeType = "password") {
    setStatus(
      isSignup ? "signed-up" : "signed-in",
      successTitle,
      successMessage,
      "password",
    );
    setIsRedirecting(true);
    await waitForBrowserSessionPropagation();
    await waitForServerSessionReadiness();
    trackAuthEvent("auth_session_ready", { journey: mode, challengeType, route: targetPath });
    markPendingProductEntry({ journey: mode, challengeType, destination: targetPath });
    resetAuthAttempt();
    window.sessionStorage.removeItem("mylearna.auth.email");
    window.sessionStorage.removeItem("mylearna.auth.journey");
    window.sessionStorage.removeItem("mylearna.auth.nextPath");

    if (redirectStarted.current) return;
    redirectStarted.current = true;
    router.replace(targetPath);
  }

  async function handleContinueExistingSession() {
    if (sessionSwitchBusy) return;
    setSessionSwitchBusy(true);
    setSessionSwitchError(null);

    try {
      router.replace(await resolveFirstAppPath(nextPath));
    } catch {
      setSessionSwitchError("We could not open MyLearna just now. Please try again.");
      setSessionSwitchBusy(false);
    }
  }

  async function handleSignOutForDifferentEmail() {
    if (sessionSwitchBusy) return;
    setSessionSwitchBusy(true);
    setSessionSwitchError(null);

    try {
      await completeFamilySignOut();
      router.replace("/start-free");
      router.refresh();
    } catch {
      setSessionSwitchError("We could not sign you out just yet. Please try again.");
      setSessionSwitchBusy(false);
    }
  }

  async function handlePasswordSignIn() {
    if (isBusy) return;

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
      setAuthAction("password");
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
          "password",
        );
        return;
      }

      const resolvedPath = await resolveFirstAppPath(nextPath);
      await redirectAfterSession(
        "Signed in",
        "Signed in. Taking you to MyLearna...",
        resolvedPath,
        "password",
      );
    } catch (error) {
      setIsRedirecting(false);
      setStatus("error", "We could not sign you in", authErrorMessage(error, "login"), "password");
    }
  }

  async function handleCreateAccount() {
    if (isBusy) return;

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
      setAuthAction("password");
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
        setStatus(
          "check-email",
          "Check your inbox",
          "Open the MyLearna email to confirm your account and continue. It may take a moment to arrive. Check spam or promotions if you do not see it.",
          "password",
        );
        return;
      }

      const resolvedPath = await resolveFirstAppPath(nextPath);
      await redirectAfterSession(
        "Account created",
        "Account created. Taking you to your first setup step...",
        resolvedPath,
        "password",
      );
    } catch (error) {
      setIsRedirecting(false);
      setStatus(
        "error",
        "We could not create your account",
        authErrorMessage(error, "signup"),
        "password",
      );
    }
  }

  async function handleForgotPassword() {
    if (isBusy) return;

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
      setAuthAction("password-reset");
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

      setStatus(
        "check-email",
        "Check your email",
        "We've sent a password reset link to your email.",
        "password-reset",
      );
    } catch (error) {
      setStatus(
        "error",
        "We could not send the reset link",
        safe((error as { message?: unknown })?.message) ||
          "We couldn't send the password reset email just yet. Please try again.",
        "password-reset",
      );
    }
  }

  async function handleEmailLink() {
    if (isBusy) return;

    if (!hasSupabaseEnv) {
      setStatus("error", "Configuration needed", MISSING_PUBLIC_SUPABASE_ENV_MESSAGE);
      return;
    }

    if (!emailValid) {
      setStatus(
        "error",
        "We could not send your sign-in link",
        "Please enter a valid email address first.",
        "email-link",
      );
      return;
    }

    try {
      setAuthAction("email-link");
      setSaveState("saving");
      setMessage("");
      setStatusTitle("");

      trackAuthEvent("auth_email_submitted", { journey: mode, challengeType: emailDelivery !== "magic-link" ? "otp_code" : "magic_link", route: window.location.pathname });
      if (emailDelivery === "magic-link") {
        await sendMagicLink({ email: safe(email).toLowerCase(), mode, nextPath, source: isSignup ? "signup-page" : "login-page", signupPrefill: isSignup ? readSignupPrefill() : null });
      } else {
        await sendEmailAuthChallenge({ email: safe(email).toLowerCase(), mode, nextPath, source: isSignup ? "signup-page" : "login-page", delivery: emailDelivery, signupPrefill: isSignup ? readSignupPrefill() : null });
      }
      setResendRemainingMs(30000);
      setVerificationCode("");
      window.sessionStorage.setItem("mylearna.auth.email", safe(email).toLowerCase());
      window.sessionStorage.setItem("mylearna.auth.journey", mode);
      window.sessionStorage.setItem("mylearna.auth.nextPath", nextPath);
      trackAuthEvent("auth_challenge_sent", { journey: mode, challengeType: emailDelivery !== "magic-link" ? "otp_code" : "magic_link", route: window.location.pathname });
      setStatus(
        emailDelivery !== "magic-link" ? "code-entry" : "check-email",
        emailDelivery !== "magic-link" ? "Check your email" : "Check your inbox",
        emailDelivery !== "magic-link" ? `Enter the code from your email. We sent it to ${maskedEmail(safe(email).toLowerCase())}.` : "Open the secure MyLearna link to continue. It may take a moment to arrive. Check spam or promotions if you do not see it.",
        "email-link",
      );
    } catch (error) {
      const retryAfterMs = getMagicLinkRetryAfterMs(error);
      const retryHint =
        retryAfterMs && retryAfterMs > 0
          ? ` You can try again in about ${Math.max(1, Math.ceil(retryAfterMs / 1000))} seconds.`
          : "";

      setStatus(
        "error",
        "We could not send your sign-in link",
        `${emailLinkErrorMessage(error, mode)}${retryHint}`,
        "email-link",
      );
      trackAuthEvent("auth_challenge_send_failed", { journey: mode, challengeType: emailDelivery === "magic-link" ? "magic_link" : "otp_code", route: window.location.pathname, resultReason: retryAfterMs ? "rate_limited" : "unknown" });
    }
  }

  async function handleVerifyCode() {
    if (isBusy || !emailValid || !verificationCode.trim()) return;
    try {
      setAuthAction("email-link");
      setSaveState("saving");
      trackAuthEvent("auth_verification_started", { journey: mode, challengeType: "otp_code", route: window.location.pathname });
      const { error } = await supabase.auth.verifyOtp({ email: safe(email).toLowerCase(), token: verificationCode.trim(), type: "email" });
      if (error) throw error;
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.user) throw new Error("session_not_ready");
      trackAuthEvent("auth_verification_succeeded", { journey: mode, challengeType: "otp_code", route: window.location.pathname });
      const resolvedPath = await resolveFirstAppPath(nextPath);
      await redirectAfterSession("Signed in", "Signed in. Taking you to MyLearna...", resolvedPath, "otp_code");
      resetAuthAttempt();
    } catch {
      setStatus("error", "We could not verify that code", "That code was not recognised. Check it and try again.", "email-link");
      trackAuthEvent("auth_verification_failed", { journey: mode, challengeType: "otp_code", route: window.location.pathname, resultReason: "invalid_code" });
    }
  }

  async function handleResend() {
    if (isBusy || resendRemainingMs > 0) return;
    trackAuthEvent("auth_resend_selected", { journey: mode, challengeType: emailDelivery === "magic-link" ? "magic_link" : "otp_code", route: window.location.pathname });
    await handleEmailLink();
    if (saveState !== "error") setMessage(emailDelivery !== "magic-link" ? `A new code has been sent to ${maskedEmail(safe(email).toLowerCase())}.` : "A new sign-in link has been sent.");
  }

  const formLabel = isSignup ? "Secure email sign-in" : "Sign in";
  const formTitle = isSignup ? "Open your private MyLearna space" : "Sign in to MyLearna";
  const formText = isSignup
    ? "Enter your email and we’ll send a secure one-time link. There is no password to create, remember or reset."
    : "Enter your email and we'll send you a secure sign-in link. No password needed.";
  const introNotice = isSignup
    ? "No password. No credit card. Your family space stays private."
    : "No password needed. Open the secure sign-in link from your email and we'll bring you back into MyLearna.";
  const heroTitle = isSignup ? "Open your private MyLearna space" : "Sign in to MyLearna";
  const heroText = isSignup
    ? "Enter your email and we’ll send a secure one-time link. There is no password to create, remember or reset."
    : "Enter your email and we'll send you a secure sign-in link so you can get back into today, the week ahead, and your growing family record.";
  const heroMicrocopy = isSignup
    ? "No password. No credit card. Your family space stays private."
    : `No password needed. After sign-in, we will take you to ${destinationLabel}.`;
  const passwordButtonLabel = isSignup ? "Create account with password" : "Continue with password";
  const passwordSavingLabel = isSignup ? "Creating your account..." : "Signing you in...";
  const passwordRedirectingLabel = isSignup
    ? "Taking you to your first setup step..."
    : "Taking you to MyLearna...";
  const emailLinkButtonLabel = emailDelivery !== "magic-link" ? "Continue" : "Send secure sign-in link";
  const emailLinkHelperText = isSignup
    ? "We’ll send one secure email link. Open it to enter your private family space and follow the guided setup."
    : "We'll email you a secure sign-in link. Open it on this device if you can, and we'll bring you straight back into MyLearna.";
  const emailLinkSendingLabel = "Sending sign-in link...";
  const alternatePrompt = isSignup ? "Already have an account?" : "New to MyLearna?";
  const alternateLabel = isSignup ? "Sign in" : "Create an account";
  const footerPrimary = isSignup
    ? { label: "Back to signup", href: "/signup" }
    : { label: "Back to login", href: "/login" };
  const passwordStatusActive = authAction === "password" || authAction === "password-reset";

  if (authUserLoading) {
    return (
      <PublicSiteShell
        title="MyLearna"
        eyebrow="Checking session"
        heroTitle={heroTitle}
        heroText="MyLearna is checking whether this browser is already signed in."
        primaryCta={null}
        secondaryCta={null}
        compactHero
      >
        <section style={cardStyle()}>
          <div style={sectionLabelStyle()}>Account</div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 26 }}>
            Checking your session...
          </h2>
        </section>
      </PublicSiteShell>
    );
  }

  if (user) {
    return (
      <PublicSiteShell
        title="MyLearna"
        eyebrow="Already signed in"
        heroTitle="You're already signed in"
        heroText="Continue to MyLearna, or sign out first if you want to use a different email."
        primaryCta={null}
        secondaryCta={null}
        compactHero
      >
        <section style={{ maxWidth: 680 }}>
          <div style={cardStyle()}>
            <div style={sectionLabelStyle()}>Account</div>
            <h2 style={{ margin: 0, color: "#0f172a", fontSize: 26 }}>
              You&apos;re already signed in
            </h2>
            <p style={{ margin: "10px 0 0", color: "#475569", lineHeight: 1.7 }}>
              You&apos;re currently signed in as:
            </p>
            <div
              style={{
                border: "1px solid #dbeafe",
                borderRadius: 16,
                background: "#eff6ff",
                color: "#0f172a",
                fontWeight: 800,
                padding: 14,
                margin: "14px 0 18px",
                overflowWrap: "anywhere",
              }}
            >
              {user.email || "This MyLearna account"}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <button
                type="button"
                style={primaryButtonStyle(sessionSwitchBusy)}
                disabled={sessionSwitchBusy}
                onClick={() => void handleContinueExistingSession()}
              >
                {sessionSwitchBusy ? "Opening MyLearna..." : "Continue to MyLearna"}
              </button>
              <button
                type="button"
                style={secondaryButtonStyle(sessionSwitchBusy)}
                disabled={sessionSwitchBusy}
                onClick={() => void handleSignOutForDifferentEmail()}
              >
                Sign out and use a different email
              </button>
            </div>
            {sessionSwitchError ? (
              <div style={{ marginTop: 12, color: "#b91c1c", fontSize: 13, lineHeight: 1.5 }}>
                {sessionSwitchError}
              </div>
            ) : null}
          </div>
        </section>
      </PublicSiteShell>
    );
  }

  const statusCard = message ? (
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
      {saveState === "error" && !isSignup && authAction === "password" ? (
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          If you cannot remember your password, use <strong>Forgot password?</strong>.
        </div>
      ) : null}
    </div>
  ) : null;

  const formCard = (
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
          if (emailDelivery !== "magic-link" && saveState === "code-entry") void handleVerifyCode();
          else void handleEmailLink();
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
            disabled={!hasSupabaseEnv || isBusy}
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

        {statusCard}

        {emailDelivery !== "magic-link" && saveState === "code-entry" ? (
          <>
            <div>
              <label style={labelStyle()} htmlFor="mylearna-email-code">Enter the code from your email</label>
              <input
                id="mylearna-email-code"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={12}
                style={inputStyle(false)}
                disabled={isBusy}
              />
            </div>
            <button type="submit" disabled={!verificationCode.trim() || isBusy} style={primaryButtonStyle(!verificationCode.trim() || isBusy)}>
              {isBusy ? "Signing you in..." : "Continue"}
            </button>
            <button type="button" onClick={() => { setVerificationCode(""); setResendRemainingMs(0); window.sessionStorage.removeItem("mylearna.auth.email"); resetAuthAttempt(); clearFeedback(); }} style={{ border: "none", background: "transparent", color: "#2563eb", fontWeight: 800, cursor: "pointer" }}>
              Change email
            </button>
            <button type="button" onClick={() => void handleResend()} disabled={resendRemainingMs > 0 || isBusy} style={secondaryButtonStyle(resendRemainingMs > 0 || isBusy)}>
              {resendRemainingMs > 0 ? `Resend available in ${Math.ceil(resendRemainingMs / 1000)}s` : "Resend code"}
            </button>
          </>
        ) : saveState === "check-email" && authAction === "email-link" ? (
          <>
            <button type="button" onClick={() => { setResendRemainingMs(0); window.sessionStorage.removeItem("mylearna.auth.email"); resetAuthAttempt(); clearFeedback(); }} style={secondaryButtonStyle(false)}>Change email</button>
            <button type="button" onClick={() => void handleResend()} disabled={resendRemainingMs > 0 || isBusy} style={secondaryButtonStyle(resendRemainingMs > 0 || isBusy)}>
              {resendRemainingMs > 0 ? `Resend available in ${Math.ceil(resendRemainingMs / 1000)}s` : "Resend sign-in link"}
            </button>
          </>
        ) : (
          <button type="submit" disabled={!hasSupabaseEnv || !emailValid || isBusy} style={primaryButtonStyle(!hasSupabaseEnv || !emailValid || isBusy)}>
            {saveState === "saving" && authAction === "email-link" ? emailLinkSendingLabel : emailLinkButtonLabel}
          </button>
        )}
      </form>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 18,
        }}
      >
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            background: "#f8fbff",
            padding: 18,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
            No password needed
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            {emailLinkHelperText}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <button type="button" onClick={() => setShowPasswordFallbackUi((value) => !value)} style={{ border: "none", background: "transparent", color: "#2563eb", fontWeight: 800, cursor: "pointer", padding: 0 }}>
          {showPasswordFallbackUi ? "Use email sign-in instead" : "Use password instead"}
        </button>
      </div>

      {showPasswordFallbackUi ? (
        <div>
          {/* Password sign-in retained only as hidden/internal fallback; secure email link is the visible user flow. */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (isSignup) {
                void handleCreateAccount();
              } else {
                void handlePasswordSignIn();
              }
            }}
            style={{ display: "grid", gap: 16, marginTop: 18 }}
          >
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
                    disabled={!hasSupabaseEnv || !emailValid || isBusy}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#2563eb",
                      fontSize: 13,
                      fontWeight: 800,
                      textAlign: "center",
                      cursor:
                        !hasSupabaseEnv || !emailValid || isBusy
                          ? "not-allowed"
                          : "pointer",
                      opacity: !hasSupabaseEnv || !emailValid || isBusy ? 0.7 : 1,
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
                disabled={!hasSupabaseEnv || isBusy}
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
                  disabled={!hasSupabaseEnv || isBusy}
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

            {passwordStatusActive ? statusCard : null}

            <button
              type="submit"
              disabled={
                !hasSupabaseEnv ||
                !emailValid ||
                !passwordValid ||
                (isSignup && !confirmPasswordValid) ||
                isBusy
              }
              style={secondaryButtonStyle(
                !hasSupabaseEnv ||
                  !emailValid ||
                  !passwordValid ||
                  (isSignup && !confirmPasswordValid) ||
                  isBusy,
              )}
            >
              {authAction === "password" && isRedirecting
                ? passwordRedirectingLabel
                : isBusy && authAction === "password"
                  ? passwordSavingLabel
                  : passwordButtonLabel}
            </button>
          </form>
        </div>
      ) : null}

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
  );

  const signupSupportPanel = (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={helperCardStyle()}>
        <div style={sectionLabelStyle()}>What happens next</div>
        <div style={{ display: "grid", gap: 10 }}>
          {SIGNUP_FIRST_STEPS.map((step, index) => (
            <div
              key={step.title}
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
              <div style={{ display: "grid", gap: 4 }}>
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
            </div>
          ))}
        </div>
      </div>

      <div style={spotlightCardStyle()}>
        <div style={sectionLabelStyle()}>Your first app step</div>
        <div style={{ display: "grid", gap: 8 }}>
          <strong style={{ color: "#0f172a", fontSize: 18 }}>My Profile</strong>
          <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.65 }}>
            After account creation, learner and family setup comes first so the rest of the workflow has a clear home.
          </div>
        </div>
      </div>
    </div>
  );

  const loginSupportPanel = (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={spotlightCardStyle()}>
        <div style={sectionLabelStyle()}>Your way back in</div>
        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
              gap: 10,
            }}
          >
            {LOGIN_JOURNEY_STEPS.map((step, index) => (
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
              Next destination
            </div>
            <strong style={{ color: "#0f172a", fontSize: 18 }}>{destinationLabel}</strong>
            <div style={{ color: "#475569", lineHeight: 1.6 }}>
              We only move you on after sign-in succeeds and your session is confirmed.
            </div>
          </div>
        </div>
      </div>

      <div style={helperCardStyle()}>
        <div style={sectionLabelStyle()}>What happens after sign-in</div>
        <div style={{ display: "grid", gap: 10 }}>
          {[
            "Open today's flow for the whole family.",
            "Move into planning when you want to shape the week.",
            "Capture what happened as the day unfolds.",
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
  );

  // Authentication is the primary task; the detailed journey guidance remains
  // defined for future contextual use but is intentionally not shown on login.
  void loginSupportPanel;

  return (
    <PublicSiteShell
      title="MyLearna"
      eyebrow={isSignup ? "Secure email sign-in" : "Return to MyLearna"}
      heroTitle={heroTitle}
      heroText={heroText}
      heroBadges={isSignup ? ["No password", "No credit card", "Private family space", "Guided setup"] : ["Today", "Plan", "Capture", "Portfolio", "Reports"]}
      heroMicrocopy={heroMicrocopy}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      footerPrimaryCta={footerPrimary}
      footerSecondaryCta={{ label: "See how MyLearna works", href: "/#how-it-works" }}
      asideTitle="Your next step"
      asideText="MyLearna should feel like one guided journey from planning through to reporting."
      showWorkflowStrip={false}
      compactHero
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        {isSignup ? (
          <>
            {formCard}
            {signupSupportPanel}
          </>
        ) : (
          <>
            {formCard}
          </>
        )}
      </section>
    </PublicSiteShell>
  );
}
