"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { buildAuthCallbackUrl } from "@/lib/authRedirect";

type FormState = {
  email: string;
  password: string;
};

type SaveState = "idle" | "saving" | "success" | "error";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function mapAuthError(error: unknown) {
  const raw = safe(error && typeof error === "object" ? (error as any).message : error);
  const normalized = raw.toLowerCase();

  if (!normalized) return "";

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "You\u2019ve requested a couple of login links already. Give it a few minutes before trying again so the next one arrives reliably.";
  }

  return raw;
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
    minHeight: 48,
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
  });

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const otpRedirectTo = useMemo(() => buildAuthCallbackUrl("/family"), []);

  useEffect(() => {
    const authError = safe(searchParams.get("authError"));
    const authMessage = safe(searchParams.get("authMessage"));

    if (authError) {
      setSaveState("error");
      setMessage(authError);
      return;
    }

    if (authMessage) {
      setSaveState("success");
      setMessage(authMessage);
    }
  }, [searchParams]);

  const emailValid = useMemo(() => {
    const email = safe(form.email);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [form.email]);

  const formReady = useMemo(() => {
    return emailValid && safe(form.password).length >= 1;
  }, [emailValid, form.password]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLogin() {
    if (!formReady) {
      setSaveState("error");
      setMessage("Just enter your email and password and we’ll get you back in.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");

      const email = safe(form.email).toLowerCase();
      const password = form.password;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error("We couldn’t sign you in just yet — please try again.");
      }

      setSaveState("success");
      setMessage("Welcome back — taking you into EduDecks now…");

      window.setTimeout(() => {
        router.push("/family");
      }, 600);
    } catch (err: any) {
      setSaveState("error");
      setMessage(
        String(
          mapAuthError(err) ||
            err ||
            "We couldn’t sign you in just yet — please check your details and try again."
        )
      );
    }
  }

  async function handleOtpLogin() {
    if (!emailValid) {
      setSaveState("error");
      setMessage("Please enter a valid email address first.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");

      const email = safe(form.email).toLowerCase();

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: otpRedirectTo,
        },
      });

      if (error) {
        throw error;
      }

      setSaveState("success");
      setMessage("Check your email — your login link is on its way");
    } catch (err: any) {
      console.error("OTP sign-in failed", err);
      setSaveState("error");
      setMessage(mapAuthError(err) || "We couldn't send your login link just yet. Please try again.");
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Welcome back"
      heroTitle="Sign in to continue with EduDecks"
      heroText="Pick up where your family left off. EduDecks keeps your learning record, reports, and next steps ready when you return."
      heroBadges={["Calm workflow", "Family-first", "Continue where you left off"]}
      primaryCta={{ label: "Create free account", href: "/signup" }}
      secondaryCta={{ label: "See how it works", href: "/get-started" }}
      asideTitle="A calm return"
      asideText="You do not need to remember everything. EduDecks is designed to help you continue one step at a time."
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
            Returning to your account
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
            Welcome back
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
            Sign in to continue building your family’s learning record, portfolio,
            and reports.
          </div>

          <form style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle()}>Email address</label>
              <input
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="Enter your email"
                style={{
                  ...inputStyle(),
                  borderColor:
                    safe(form.email) && !emailValid ? "#fca5a5" : "#d1d5db",
                }}
                autoComplete="email"
                inputMode="email"
                disabled={saveState === "saving"}
              />
              {safe(form.email) && !emailValid ? (
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

            <button
              type="button"
              onClick={() => void handleOtpLogin()}
              disabled={!emailValid || saveState === "saving"}
              style={primaryButtonStyle(!emailValid || saveState === "saving")}
            >
              {saveState === "saving" ? "Sending your login link..." : "Send login link"}
            </button>

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
              Password-free sign in. We'll send a secure link that returns you to your family space.
            </div>

            <div
              style={{
                height: 1,
                background: "#e5e7eb",
                margin: "4px 0",
              }}
            />

            <div>
              <label style={labelStyle()}>Or sign in with password</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  style={inputStyle()}
                  autoComplete="current-password"
                  disabled={saveState === "saving"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    ...secondaryButtonStyle(),
                    width: 88,
                    minHeight: 48,
                  }}
                  disabled={saveState === "saving"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div style={{ marginTop: 10 }}>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#2563eb",
                    textDecoration: "none",
                  }}
                >
                  Forgot your password?
                </Link>
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: "#64748b",
                  fontWeight: 700,
                }}
              >
                Use your password only if you prefer it. Email login is the lighter default path.
              </div>
            </div>

            {message ? (
              <div
                style={{
                  border:
                    saveState === "success"
                      ? "1px solid #86efac"
                      : saveState === "error"
                      ? "1px solid #fecaca"
                      : "1px solid #e5e7eb",
                  background:
                    saveState === "success"
                      ? "#ecfdf5"
                      : saveState === "error"
                      ? "#fff1f2"
                      : "#f8fafc",
                  color:
                    saveState === "success"
                      ? "#166534"
                      : saveState === "error"
                      ? "#9f1239"
                      : "#334155",
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
              type="button"
              onClick={() => void handleLogin()}
              disabled={!formReady || saveState === "saving"}
              style={secondaryButtonStyle()}
            >
              {saveState === "saving"
                ? "Signing you in…"
                : formReady
                ? "Sign in with password"
                : "Enter password to continue"}
            </button>

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
              Secure sign in. Your data stays private.
            </div>

            <Link href="/signup" style={secondaryButtonStyle()}>
              Create free account
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
              When you sign in
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Continue from your family dashboard",
                "Return to saved reports and learning records",
                "Pick up the next suggested step",
                "Keep building without starting over",
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
              New to EduDecks?
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
                marginBottom: 14,
              }}
            >
              Create a free account and begin with one child and one learning
              moment. You can build everything else over time.
            </div>

            <Link href="/signup" style={secondaryButtonStyle()}>
              Create free account
            </Link>
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
              Need help getting back in?
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
                marginBottom: 14,
              }}
            >
              If you’ve forgotten your password, we can help you reset it calmly
              and get back into your account.
            </div>

            <Link href="/forgot-password" style={secondaryButtonStyle()}>
              Reset password
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
