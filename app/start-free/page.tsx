"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import {
  getSignupJurisdictionOptions,
  saveSignupPrefill,
  SIGNUP_COUNTRY_OPTIONS,
  type SignupPrefill,
} from "@/lib/signupPrefill";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(value));
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
    color: "#334155",
    display: "block",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 6,
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
  };
}

const buttonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 50,
  borderRadius: 14,
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
};

function errorTextStyle(): React.CSSProperties {
  return {
    color: "#b91c1c",
    fontSize: 12,
    lineHeight: 1.5,
    marginTop: 6,
  };
}

export default function StartFreePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = safe(searchParams.get("source"));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [stateOrRegion, setStateOrRegion] = useState("");
  const [numberOfChildren, setNumberOfChildren] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const jurisdictionOptions = useMemo(() => getSignupJurisdictionOptions(country), [country]);

  const emailValid = isValidEmail(email);
  const formValid =
    safe(fullName) &&
    emailValid &&
    safe(country) &&
    (country === "INTL" || safe(stateOrRegion)) &&
    safe(numberOfChildren);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!formValid) return;

    const prefill: SignupPrefill = {
      version: 1,
      fullName: safe(fullName),
      email: safe(email).toLowerCase(),
      country: safe(country),
      stateOrRegion: safe(stateOrRegion),
      jurisdiction: safe(stateOrRegion),
      numberOfChildren: Number(numberOfChildren),
      source: source || "start-free",
      createdAt: new Date().toISOString(),
    };

    saveSignupPrefill(prefill);
    const params = new URLSearchParams();
    params.set("next", "/my-profile");
    params.set("source", prefill.source ?? "start-free");
    router.push(`/signup?${params.toString()}`);
  }

  return (
    <PublicSiteShell
      eyebrow="Start free"
      heroTitle="Start using MyLearna"
      heroText="Create your account with your email. We will use a few setup details to prefill your family profile so you do not have to enter them again later."
      heroBadges={["Email sign-in", "Profile prefill", "Start with family setup"]}
      primaryCta={null}
      secondaryCta={{ label: "Already have an account?", href: "/login" }}
      asideTitle="What happens next"
      asideText="After email sign-in, MyLearna takes you to My Profile first so you can review and save your family setup."
      compactHero
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: 22,
          alignItems: "start",
        }}
      >
        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0, color: "#0f172a", fontSize: 26 }}>
            Start with email
          </h2>
          <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.7 }}>
            Enter a few basic setup details. You can edit them later in My Profile
            and My Settings.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle()}>Name</label>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                style={inputStyle(submitted && !safe(fullName))}
              />
              {submitted && !safe(fullName) ? (
                <div style={errorTextStyle()}>Please enter your name.</div>
              ) : null}
            </div>

            <div>
              <label style={labelStyle()}>Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                style={inputStyle(submitted && !emailValid)}
              />
              {submitted && !emailValid ? (
                <div style={errorTextStyle()}>Please enter your email.</div>
              ) : null}
            </div>

            <div>
              <label style={labelStyle()}>Country</label>
              <select
                value={country}
                onChange={(event) => {
                  setCountry(event.target.value);
                  setStateOrRegion("");
                }}
                style={inputStyle(submitted && !safe(country))}
              >
                <option value="">Choose country</option>
                {SIGNUP_COUNTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {submitted && !safe(country) ? (
                <div style={errorTextStyle()}>Please choose your country.</div>
              ) : null}
            </div>

            {country ? (
              <div>
                <label style={labelStyle()}>
                  {country === "UK" ? "Nation" : "State or region"}
                </label>
                {jurisdictionOptions.length ? (
                  <select
                    value={stateOrRegion}
                    onChange={(event) => setStateOrRegion(event.target.value)}
                    style={inputStyle(
                      submitted && country !== "INTL" && !safe(stateOrRegion),
                    )}
                  >
                    <option value="">
                      {country === "UK" ? "Choose nation" : "Choose state or region"}
                    </option>
                    {jurisdictionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={stateOrRegion}
                    onChange={(event) => setStateOrRegion(event.target.value)}
                    placeholder="Optional region"
                    style={inputStyle(false)}
                  />
                )}
                {submitted && country !== "INTL" && !safe(stateOrRegion) ? (
                  <div style={errorTextStyle()}>Please choose your state or region.</div>
                ) : null}
              </div>
            ) : null}

            <div>
              <label style={labelStyle()}>Number of children</label>
              <select
                value={numberOfChildren}
                onChange={(event) => setNumberOfChildren(event.target.value)}
                style={inputStyle(submitted && !safe(numberOfChildren))}
              >
                <option value="">Choose number</option>
                {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
                <option value="9">9 or more</option>
              </select>
              {submitted && !safe(numberOfChildren) ? (
                <div style={errorTextStyle()}>
                  Please choose the number of children.
                </div>
              ) : null}
            </div>

            <button type="submit" style={buttonStyle}>
              Continue with email
            </button>
          </form>
          <p style={{ margin: "14px 0 0", color: "#64748b", lineHeight: 1.6 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#2563eb", fontWeight: 800 }}>
              Sign in with your email
            </Link>
            .
          </p>
        </div>

        <div style={cardStyle()}>
          <h2 style={{ marginTop: 0, color: "#0f172a", fontSize: 22 }}>
            Why we ask for these details
          </h2>
          <div style={{ display: "grid", gap: 12, color: "#475569", lineHeight: 1.7 }}>
            <p style={{ margin: 0 }}>
              Name and email help create your account.
            </p>
            <p style={{ margin: 0 }}>
              Country and region help prefill My Settings so reports and records
              use the right context.
            </p>
            <p style={{ margin: 0 }}>
              Number of children is used only as a setup prompt. MyLearna will not
              create child records until you choose to add them.
            </p>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
