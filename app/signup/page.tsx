"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { buildAuthCallbackUrl } from "@/lib/authRedirect";
import PublicSiteShell from "@/app/components/PublicSiteShell";

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SaveState = "idle" | "saving" | "success" | "error";

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

function getPasswordChecks(password: string) {
  const value = safe(password);

  return [
    {
      label: "At least 8 characters",
      passed: value.length >= 8,
    },
    {
      label: "Includes a letter",
      passed: /[A-Za-z]/.test(value),
    },
    {
      label: "Includes a number",
      passed: /\d/.test(value),
    },
  ];
}

function getPasswordStrength(password: string) {
  const checks = getPasswordChecks(password);
  const passed = checks.filter((x) => x.passed).length;

  if (passed <= 1) {
    return {
      label: "Early",
      toneBg: "#fff7ed",
      toneBorder: "#fed7aa",
      toneText: "#9a3412",
      width: "33%",
    };
  }

  if (passed === 2) {
    return {
      label: "Good",
      toneBg: "#eff6ff",
      toneBorder: "#bfdbfe",
      toneText: "#1d4ed8",
      width: "66%",
    };
  }

  return {
    label: "Strong",
    toneBg: "#ecfdf5",
    toneBorder: "#86efac",
    toneText: "#166534",
    width: "100%",
  };
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password]
  );

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const emailValid = useMemo(() => {
    const email = safe(form.email);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [form.email]);

  const passwordMatch = useMemo(() => {
    return safe(form.password) && form.password === form.confirmPassword;
  }, [form.password, form.confirmPassword]);

  const formReady = useMemo(() => {
    return (
      safe(form.fullName).length >= 2 &&
      emailValid &&
      passwordChecks.every((x) => x.passed) &&
      passwordMatch
    );
  }, [form.fullName, emailValid, passwordChecks, passwordMatch]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!formReady) {
      setSaveState("error");
      setMessage("Just a couple of things to finish before we get you started.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");

      const fullName = safe(form.fullName);
      const email = safe(form.email).toLowerCase();
      const password = form.password;

      const redirectTo = buildAuthCallbackUrl("/onboarding");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
            user_type: "family",
            onboarding_state: "new",
          },
        },
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      if (user?.id) {
        try {
          await supabase.from("profiles").upsert({
            id: user.id,
            full_name: fullName,
            email,
            user_type: "family",
            onboarding_complete: false,
          });
        } catch {
          // non-blocking for now
        }
      }

      setSaveState("success");

      if (data.session) {
        setMessage("Your account is ready. Taking you into EduDecks now…");

        window.setTimeout(() => {
          router.push("/onboarding");
        }, 700);
      } else {
        setMessage(
          "Check your email to confirm your account. Once confirmed, you’ll be taken straight into EduDecks."
        );
      }
    } catch (err: any) {
      setSaveState("error");
      setMessage(
        String(
          err?.message ||
            err ||
            "We couldn’t create your account just yet — please try again."
        )
      );
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Start free"
      heroTitle="Create your EduDecks account"
      heroText="Begin with one child and one learning moment. You do not need everything set up today — just enough to start building confidence."
      heroBadges={["Start free", "Family-first", "Build confidence", "Grow over time"]}
      primaryCta={{ label: "Already have an account?", href: "/login" }}
      secondaryCta={{ label: "See how it works", href: "/get-started" }}
      asideTitle="A calm way to begin"
      asideText="EduDecks is designed so families can start small, build real evidence, and grow into stronger reporting over time."
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
            Step 1 of 2 — Create your account
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
            Start free and build steadily
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
            Your free account gives you a calm starting point for capturing
            learning, building a portfolio, and growing into reports when you’re
            ready.
          </div>

          <form onSubmit={handleSignup} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle()}>Your name</label>
              <input
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Enter your name"
                style={inputStyle()}
                autoComplete="name"
                disabled={saveState === "saving"}
              />
            </div>

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

            <div>
              <label style={labelStyle()}>Password</label>
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
                  placeholder="Create a password"
                  type={showPassword ? "text" : "password"}
                  style={inputStyle()}
                  autoComplete="new-password"
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

              <div
                style={{
                  marginTop: 10,
                  border: `1px solid ${passwordStrength.toneBorder}`,
                  background: passwordStrength.toneBg,
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#64748b",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    Password strength
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: passwordStrength.toneText,
                    }}
                  >
                    {passwordStrength.label}
                  </div>
                </div>

                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "#e2e8f0",
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: passwordStrength.width,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        passwordStrength.label === "Strong"
                          ? "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)"
                          : passwordStrength.label === "Good"
                          ? "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)"
                          : "linear-gradient(90deg, #fb923c 0%, #ea580c 100%)",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      style={{
                        fontSize: 13,
                        color: check.passed ? "#166534" : "#92400e",
                        fontWeight: 700,
                        lineHeight: 1.45,
                      }}
                    >
                      {check.passed ? "✓" : "•"} {check.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle()}>Confirm password</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                  type={showConfirmPassword ? "text" : "password"}
                  style={{
                    ...inputStyle(),
                    borderColor:
                      safe(form.confirmPassword) && !passwordMatch
                        ? "#fca5a5"
                        : "#d1d5db",
                  }}
                  autoComplete="new-password"
                  disabled={saveState === "saving"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{
                    ...secondaryButtonStyle(),
                    width: 88,
                    minHeight: 48,
                  }}
                  disabled={saveState === "saving"}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {safe(form.confirmPassword) && !passwordMatch ? (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#b91c1c",
                    lineHeight: 1.5,
                  }}
                >
                  Your passwords do not match yet.
                </div>
              ) : null}
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
              type="submit"
              disabled={!formReady || saveState === "saving"}
              style={primaryButtonStyle(!formReady || saveState === "saving")}
            >
              {saveState === "saving"
                ? "Creating your account…"
                : formReady
                ? "Start your free account"
                : "Complete the form to continue"}
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
              No credit card required. Start free and take your time.
            </div>

            <Link href="/login" style={secondaryButtonStyle()}>
              I already have an account
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
                "Create your free account",
                "Add your family details and first child",
                "Capture one learning moment",
                "Grow into portfolio and reports over time",
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
              You do not need everything ready on day one
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
              }}
            >
              Most families begin with one child, one captured learning moment,
              and one simple next step. EduDecks is designed to grow with your
              family over time.
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
              Already started with EduDecks?
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
                marginBottom: 14,
              }}
            >
              Sign in to continue building your family’s learning record where
              you left off.
            </div>

            <Link href="/login" style={secondaryButtonStyle()}>
              Go to sign in
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
