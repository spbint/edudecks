"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
} from "@/app/components/PublicSiteShell";
import useIsMobile from "@/app/components/useIsMobile";
import {
  hasSupabaseEnv,
  MISSING_PUBLIC_SUPABASE_ENV_MESSAGE,
  supabase,
} from "@/lib/supabaseClient";

type SubmitState = "idle" | "saving" | "error";

type FormValues = {
  name: string;
  email: string;
  country: string;
  stateOrRegion: string;
  numberOfChildren: string;
  biggestHomeschoolChallenge: string;
  currentlyHomeschooling: "" | "yes" | "no";
  willingToTestFreeBeta: boolean;
  companyWebsite: string;
};

type FormErrors = Partial<Record<keyof Omit<FormValues, "companyWebsite">, string>>;

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(value));
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 14px",
    background: "#ffffff",
    fontSize: 14,
    color: "#111827",
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

function helperStyle(): React.CSSProperties {
  return {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 1.55,
    color: "#64748b",
  };
}

function errorTextStyle(): React.CSSProperties {
  return {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 1.55,
    color: "#b91c1c",
    fontWeight: 700,
  };
}

function yesNoLabel(value: FormValues["currentlyHomeschooling"]) {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackBetaEvent(
  eventName: "beta_page_view" | "beta_submit" | "beta_submit_success" | "beta_submit_error",
  params: Record<string, string | number | boolean | null | undefined>,
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  const cleanedParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

  window.gtag("event", eventName, {
    page_path: "/beta",
    ...cleanedParams,
  });
}

async function notifyOwnerOfBetaSignup(payload: Record<string, unknown>) {
  try {
    await fetch("/api/beta-interest/notify-owner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Could not request beta signup owner notification.", error);
  }
}

export default function BetaInterestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobileLayout = useIsMobile(820);
  const isCompact = useIsMobile(560);
  const [state, setState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    country: "",
    stateOrRegion: "",
    numberOfChildren: "",
    biggestHomeschoolChallenge: "",
    currentlyHomeschooling: "",
    willingToTestFreeBeta: false,
    companyWebsite: "",
  });
  const hasTrackedPageView = useRef(false);

  const source = useMemo(() => safe(searchParams.get("source")), [searchParams]);

  useEffect(() => {
    if (hasTrackedPageView.current) return;
    hasTrackedPageView.current = true;

    trackBetaEvent("beta_page_view", {
      source: source || undefined,
    });
  }, [source]);

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFeedback("");
    setState("idle");
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!safe(values.name)) {
      nextErrors.name = "Please enter your name.";
    }

    if (!isValidEmail(values.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!safe(values.country)) {
      nextErrors.country = "Please tell us your country.";
    }

    if (values.numberOfChildren) {
      const parsed = Number(values.numberOfChildren);
      if (!Number.isInteger(parsed) || parsed < 1) {
        nextErrors.numberOfChildren = "Please enter a whole number of children.";
      }
    }

    if (!safe(values.biggestHomeschoolChallenge)) {
      nextErrors.biggestHomeschoolChallenge =
        "Please tell us a little about your biggest homeschool challenge right now.";
    }

    if (!values.currentlyHomeschooling) {
      nextErrors.currentlyHomeschooling =
        "Please let us know whether you are currently homeschooling.";
    }

    if (!values.willingToTestFreeBeta) {
      nextErrors.willingToTestFreeBeta =
        "Please confirm that you are willing to test the free beta.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (safe(values.companyWebsite)) {
      router.replace("/beta/thanks");
      return;
    }

    trackBetaEvent("beta_submit", {
      source: source || undefined,
      country: safe(values.country) || undefined,
      currently_homeschooling: values.currentlyHomeschooling || undefined,
      willing_to_test_free_beta: values.willingToTestFreeBeta ? "yes" : "no",
    });

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setState("error");
      setFeedback("Please check the highlighted fields and try again.");
      return;
    }

    if (!hasSupabaseEnv) {
      setState("error");
      setFeedback(MISSING_PUBLIC_SUPABASE_ENV_MESSAGE);
      return;
    }

    try {
      setState("saving");
      setFeedback("");

      const numberOfChildren = values.numberOfChildren
        ? Number(values.numberOfChildren)
        : null;

      const payload = {
        name: safe(values.name),
        email: safe(values.email).toLowerCase(),
        country: safe(values.country),
        state_or_region: safe(values.stateOrRegion) || null,
        number_of_children: numberOfChildren,
        biggest_homeschool_challenge: safe(values.biggestHomeschoolChallenge),
        currently_homeschooling: yesNoLabel(values.currentlyHomeschooling),
        willing_to_test_free_beta: values.willingToTestFreeBeta,
        source: source || null,
        submitted_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("beta_interest").insert(payload);

      if (error) {
        throw error;
      }

      await notifyOwnerOfBetaSignup(payload);

      trackBetaEvent("beta_submit_success", {
        source: source || undefined,
        country: safe(values.country) || undefined,
        currently_homeschooling: values.currentlyHomeschooling || undefined,
        willing_to_test_free_beta: values.willingToTestFreeBeta ? "yes" : "no",
      });
      router.replace("/beta/thanks");
    } catch (error) {
      const rawMessage = safe((error as { message?: unknown })?.message).toLowerCase();
      const message =
        rawMessage.includes("timed out") ||
        rawMessage.includes("network") ||
        rawMessage.includes("fetch")
          ? "We could not reach the beta sign-up service just now. Please try again in a moment."
          : "We could not save your beta interest just yet. Please try again in a moment.";

      trackBetaEvent("beta_submit_error", {
        source: source || undefined,
        country: safe(values.country) || undefined,
        currently_homeschooling: values.currentlyHomeschooling || undefined,
        willing_to_test_free_beta: values.willingToTestFreeBeta ? "yes" : "no",
      });
      setState("error");
      setFeedback(message);
    }
  }

  return (
    <PublicSiteShell
      title="Join the MyLearna Beta"
      eyebrow="Free beta interest"
      heroTitle="Join the MyLearna Beta"
      heroText="MyLearna helps homeschool families plan learning, capture evidence, build portfolios, and prepare reports. We're opening a free beta gradually so real families can test the workflow and help shape what comes next."
      heroMicrocopy="The beta is free. Families will be invited gradually, and feedback will help shape what comes next."
      heroBadges={["Free beta", "Gradual invites", "Family feedback", "Calm workflow"]}
      navItems={[]}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      headerPrimaryAction={null}
      footerPrimaryCta={null}
      footerSecondaryCta={null}
      compactHero
      asideTitle="Who this is for"
      asideText="Families who want a calmer way to plan learning, capture evidence, curate portfolio moments, and build reports over time."
    >
      <section
        style={{
          ...publicCardStyle(),
          marginBottom: 20,
          display: "grid",
          gap: 12,
          border: "1px solid #bfdbfe",
          background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          Want to see the workflow first?
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.65,
            color: "#475569",
            maxWidth: 820,
          }}
        >
          Not ready to join yet? Explore the public demo first and see how a
          fictional homeschool family moves from planning to reports.
        </p>
        <div>
          <Link href="/demo" style={publicButtonStyle(false)}>
            Explore the demo
          </Link>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobileLayout
            ? "minmax(0, 1fr)"
            : "minmax(0, 1.05fr) minmax(300px, 0.95fr)",
          gap: isMobileLayout ? 16 : 20,
          marginBottom: 24,
          width: "100%",
          maxWidth: "100%",
          alignItems: "start",
        }}
      >
        <section
          style={{
            ...publicCardStyle(),
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: isMobileLayout ? 24 : 28,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
              lineHeight: 1.2,
              overflowWrap: "anywhere",
            }}
          >
            Request free beta access
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#475569",
              lineHeight: 1.65,
              marginBottom: 18,
            }}
          >
            Enter your details below and we&apos;ll contact you when beta places open.
            No password or account setup is needed yet.
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gap: 14, width: "100%", minWidth: 0 }}
          >
            <div
              style={{
                position: "absolute",
                left: "-10000px",
                top: "auto",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
              aria-hidden="true"
            >
              <label htmlFor="beta-company-website">Leave this field empty</label>
              <input
                id="beta-company-website"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                value={values.companyWebsite}
                onChange={(event) => updateField("companyWebsite", event.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle()}>Name</label>
              <input
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Your name"
                style={inputStyle()}
                autoComplete="name"
                disabled={state === "saving"}
              />
              {errors.name ? <div style={errorTextStyle()}>{errors.name}</div> : null}
            </div>

            <div>
              <label style={labelStyle()}>Email</label>
              <input
                type="email"
                value={values.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                style={inputStyle()}
                autoComplete="email"
                inputMode="email"
                disabled={state === "saving"}
              />
              {errors.email ? <div style={errorTextStyle()}>{errors.email}</div> : null}
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                width: "100%",
                minWidth: 0,
              }}
            >
              <div>
                <label style={labelStyle()}>Country</label>
                <input
                  value={values.country}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Country"
                  style={inputStyle()}
                  autoComplete="country-name"
                  disabled={state === "saving"}
                />
                {errors.country ? <div style={errorTextStyle()}>{errors.country}</div> : null}
              </div>

              <div>
                <label style={labelStyle()}>State or region</label>
                <input
                  value={values.stateOrRegion}
                  onChange={(event) => updateField("stateOrRegion", event.target.value)}
                  placeholder="State or region"
                  style={inputStyle()}
                  autoComplete="address-level1"
                  disabled={state === "saving"}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                width: "100%",
                minWidth: 0,
              }}
            >
              <div>
                <label style={labelStyle()}>Number of children</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={values.numberOfChildren}
                  onChange={(event) => updateField("numberOfChildren", event.target.value)}
                  placeholder="Optional"
                  style={inputStyle()}
                  inputMode="numeric"
                  disabled={state === "saving"}
                />
                {errors.numberOfChildren ? (
                  <div style={errorTextStyle()}>{errors.numberOfChildren}</div>
                ) : (
                  <div style={helperStyle()}>Optional, but helpful for planning the beta.</div>
                )}
              </div>

              <div>
                <label style={labelStyle()}>Currently homeschooling</label>
                <select
                  value={values.currentlyHomeschooling}
                  onChange={(event) =>
                    updateField(
                      "currentlyHomeschooling",
                      event.target.value as FormValues["currentlyHomeschooling"],
                    )
                  }
                  style={inputStyle()}
                  disabled={state === "saving"}
                >
                  <option value="">Please choose</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {errors.currentlyHomeschooling ? (
                  <div style={errorTextStyle()}>{errors.currentlyHomeschooling}</div>
                ) : null}
              </div>
            </div>

            <div>
              <label style={labelStyle()}>Biggest homeschool challenge</label>
              <textarea
                rows={5}
                value={values.biggestHomeschoolChallenge}
                onChange={(event) =>
                  updateField("biggestHomeschoolChallenge", event.target.value)
                }
                placeholder="What feels hardest to manage right now?"
                style={{ ...inputStyle(), resize: "vertical" }}
                disabled={state === "saving"}
              />
              {errors.biggestHomeschoolChallenge ? (
                <div style={errorTextStyle()}>{errors.biggestHomeschoolChallenge}</div>
              ) : (
                <div style={helperStyle()}>
                  Keep this high-level. Please do not include private child, medical, or
                  identifying details.
                </div>
              )}
            </div>

            <label
              style={{
                display: "grid",
                gap: 8,
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 14,
                background: "#f8fafc",
              }}
            >
              <span
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "start",
                }}
              >
                <input
                  type="checkbox"
                  checked={values.willingToTestFreeBeta}
                  onChange={(event) =>
                    updateField("willingToTestFreeBeta", event.target.checked)
                  }
                  style={{ marginTop: 2 }}
                  disabled={state === "saving"}
                />
                <span style={{ color: "#0f172a", fontWeight: 700, lineHeight: 1.55 }}>
                  I am willing to test a free beta and share feedback.
                </span>
              </span>
              {errors.willingToTestFreeBeta ? (
                <div style={errorTextStyle()}>{errors.willingToTestFreeBeta}</div>
              ) : null}
            </label>

            <div
              style={{
                fontSize: 12,
                lineHeight: 1.65,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              By joining, you agree that MyLearna may contact you about beta access and
              feedback. We&apos;ll only use your details for beta-related communication.
            </div>

            {feedback ? (
              <div
                style={{
                  border: "1px solid #fecaca",
                  background: "#fff1f2",
                  color: "#be123c",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  fontWeight: 700,
                }}
                role="alert"
              >
                {feedback}
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="submit"
                style={{
                  ...publicButtonStyle(true),
                  cursor: "pointer",
                  width: isCompact ? "100%" : undefined,
                  maxWidth: "100%",
                  whiteSpace: isCompact ? "normal" : "nowrap",
                  textAlign: "center",
                }}
                disabled={state === "saving"}
              >
                {state === "saving" ? "Requesting beta access..." : "Request free beta access"}
              </button>
            </div>
          </form>
        </section>

        <div style={{ display: "grid", gap: 20, width: "100%", minWidth: 0 }}>
          <section
            style={{
              ...publicCardStyle(),
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 12,
              }}
            >
              What the beta is for
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Test the product with real homeschool family workflows.",
                "See where planning, evidence, portfolio, and reporting feel strongest.",
                "Spot the gaps before wider rollout.",
                "Shape the calmest possible family experience.",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                    background: "#f8fafc",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#334155",
                    lineHeight: 1.55,
                    overflowWrap: "anywhere",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              ...publicCardStyle(),
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              A gentle beta
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: "#475569",
              }}
            >
              Beta places will open gradually. We want enough families to learn from real
              use, without making the experience noisy or overwhelming.
            </div>

            {source ? (
              <div
                style={{
                  marginTop: 14,
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                Source noted for beta testing.
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </PublicSiteShell>
  );
}
