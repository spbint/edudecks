"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
} from "@/app/components/PublicSiteShell";
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

export default function BetaInterestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const source = useMemo(() => safe(searchParams.get("source")), [searchParams]);

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
      };

      const { error } = await supabase.from("beta_interest").insert(payload);

      if (error) {
        throw error;
      }

      router.replace("/beta/thanks");
    } catch (error) {
      const message =
        safe((error as { message?: unknown })?.message) ||
        "We could not save your beta interest just yet. Please try again.";

      setState("error");
      setFeedback(message);
    }
  }

  return (
    <PublicSiteShell
      title="Join the MyLearna Beta"
      eyebrow="Free beta interest"
      heroTitle="Join the MyLearna Beta"
      heroText="MyLearna is a homeschool planning, evidence, portfolio and reporting tool. We're opening a free beta for families who are willing to test the product and help shape it."
      heroBadges={["Free beta", "Homeschool families", "Feedback welcome", "Calm workflow"]}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      headerPrimaryAction={null}
      footerPrimaryCta={{ label: "Back to home", href: "/" }}
      footerSecondaryCta={{ label: "How it works", href: "/#how-it-works" }}
      asideTitle="Who this is for"
      asideText="Families who want a calmer way to plan learning, capture evidence, curate portfolio moments, and build reports over time."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <section style={publicCardStyle()}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Join the MyLearna Beta
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

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
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
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
              ) : null}
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
                style={{ ...publicButtonStyle(true), cursor: "pointer" }}
                disabled={state === "saving"}
              >
                {state === "saving" ? "Joining beta..." : "Join beta waitlist"}
              </button>
              <Link href="/" style={publicButtonStyle(false)}>
                Back to home
              </Link>
            </div>
          </form>
        </section>

        <div style={{ display: "grid", gap: 20 }}>
          <section style={publicCardStyle()}>
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
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section style={publicCardStyle()}>
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
                  border: "1px solid #dbeafe",
                  borderRadius: 12,
                  padding: 12,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Source noted: {source}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </PublicSiteShell>
  );
}
