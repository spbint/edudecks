"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { buildAuthCallbackUrl } from "@/lib/authRedirect";
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

function mapAuthError(error: unknown) {
  const raw = safe(error && typeof error === "object" ? (error as any).message : error);
  const normalized = raw.toLowerCase();

  if (!normalized) return "";

  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "You’ve requested a couple of login links already. Give it a few minutes before trying again so the next one arrives reliably.";
  }

  return raw;
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
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  const authRedirectTo = useMemo(() => buildAuthCallbackUrl("/family"), []);

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
    const nextEmail = safe(email);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail);
  }, [email]);

  async function handleContinue() {
    if (!emailValid) {
      setSaveState("error");
      setMessage("Please enter a valid email address first.");
      return;
    }

    try {
      setSaveState("saving");
      setMessage("");

      const normalizedEmail = safe(email).toLowerCase();

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: authRedirectTo,
          shouldCreateUser: true,
          data: {
            user_type: "family",
            onboarding_state: "new",
          },
        },
      });

      if (error) {
        throw error;
      }

      setSaveState("success");
      setMessage("We’ve sent you a secure link to continue.");
    } catch (err: any) {
      setSaveState("error");
      setMessage(mapAuthError(err) || "We couldn’t send your secure link just yet. Please try again.");
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
              void handleContinue();
            }}
            style={{ display: "grid", gap: 16 }}
          >
            <div>
              <label style={labelStyle()}>Email address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!emailValid || saveState === "saving"}
              style={primaryButtonStyle(!emailValid || saveState === "saving")}
            >
              {saveState === "saving" ? "Sending your secure link..." : "Continue"}
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
              Password-free entry. One secure link. No extra decisions.
            </div>

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
              New accounts and returning families use the same calm flow, so there is nothing to remember and nothing to reset later.
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
