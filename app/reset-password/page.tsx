"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PublicSiteShell from "@/app/components/PublicSiteShell";

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

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = useMemo(
    () => getPasswordChecks(password),
    [password]
  );

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const passwordMatch = useMemo(() => {
    return safe(password) && password === confirmPassword;
  }, [password, confirmPassword]);

  const formReady = useMemo(() => {
    return passwordChecks.every((x) => x.passed) && passwordMatch;
  }, [passwordChecks, passwordMatch]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!formReady) {
      setSaveState("error");
      setMessage("Finish the password fields and we’ll update your account.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setSaveState("success");
      setMessage(
        "Your password has been updated. Taking you back to sign in…"
      );

      window.setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (err: any) {
      setSaveState("error");
      setMessage(
        String(
          err?.message ||
            err ||
            "We couldn’t update your password just yet — please try again."
        )
      );
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Choose a new password"
      heroTitle="Set a new password for EduDecks"
      heroText="You’re almost back in. Choose a strong new password, then return to your account and continue where your family left off."
      heroBadges={["Password reset", "Secure update", "Back into EduDecks"]}
      primaryCta={{ label: "Back to sign in", href: "/login" }}
      secondaryCta={{ label: "Create free account", href: "/signup" }}
      asideTitle="A calm final step"
      asideText="Choose a password that feels strong and memorable enough for you to return confidently later."
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
            Reset password
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
            Choose your new password
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
            Set a new password below, then return to sign in and continue into
            your EduDecks family dashboard.
          </div>

          <form onSubmit={handleResetPassword} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle()}>New password</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a new password"
                  type={showPassword ? "text" : "password"}
                  style={inputStyle()}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    ...secondaryButtonStyle(),
                    width: 88,
                    minHeight: 48,
                  }}
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
              <label style={labelStyle()}>Confirm new password</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  type={showConfirmPassword ? "text" : "password"}
                  style={{
                    ...inputStyle(),
                    borderColor:
                      safe(confirmPassword) && !passwordMatch
                        ? "#fca5a5"
                        : "#d1d5db",
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{
                    ...secondaryButtonStyle(),
                    width: 88,
                    minHeight: 48,
                  }}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {safe(confirmPassword) && !passwordMatch ? (
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
                ? "Updating password…"
                : formReady
                ? "Save new password"
                : "Complete the form to continue"}
            </button>

            <Link href="/login" style={secondaryButtonStyle()}>
              Back to sign in
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
                "Choose a strong new password.",
                "Save the password update.",
                "Return to sign in.",
                "Continue into your EduDecks account.",
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
              Back into EduDecks quickly
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
              }}
            >
              Once your new password is saved, you’ll be ready to sign back in
              and continue with your family dashboard, portfolio, and reports.
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
              Need a new reset link?
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
                marginBottom: 14,
              }}
            >
              If your reset link expires or doesn’t work, you can request a new
              one from the forgot-password page.
            </div>

            <Link href="/forgot-password" style={secondaryButtonStyle()}>
              Request another reset link
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}