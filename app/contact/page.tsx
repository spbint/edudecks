"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

type SignupState = "idle" | "saving" | "success" | "error";

function safe(v: any) {
  return String(v ?? "").trim();
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

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SignupState>("idle");
  const [feedback, setFeedback] = useState("");

  const formReady = useMemo(() => !!safe(name) && !!safe(email), [name, email]);

  async function handleSubmit() {
    if (!formReady) {
      setState("error");
      setFeedback("Please enter your name and email.");
      return;
    }

    try {
      setState("saving");
      setFeedback("");

      // Placeholder for real backend
      await new Promise((resolve) => setTimeout(resolve, 600));

      setState("success");
      setFeedback(
        "You’re on the list. Thanks for your interest in EduDecks Family."
      );

      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setState("error");
      setFeedback(String(err?.message || err || "Something went wrong."));
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Stay close to the launch"
      heroTitle="Join the waitlist. Share your needs. Help shape the product."
      heroText="EduDecks Family is being built for homeschool families who want a calmer, stronger system for capture, portfolios, planning, and reporting."
      heroBadges={["Waitlist", "Early access", "Feedback welcome", "Beta interest"]}
      primaryCta={{ label: "Start Free", href: "/capture" }}
      secondaryCta={{ label: "View Pricing", href: "/pricing" }}
      asideTitle="Best fit"
      asideText="Families who want a homeschool workflow that feels calmer than school software and more useful than scattered notes."
    >
      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* LEFT — FORM */}
        <section style={publicCardStyle()}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Join the waitlist
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#475569",
              lineHeight: 1.6,
              marginBottom: 18,
            }}
          >
            Tell us who you are and what you’re hoping for. Early feedback helps
            shape the product around real family needs.
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle()}>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle()}>Optional message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="What would make this product especially helpful for your family?"
                style={{ ...inputStyle(), resize: "vertical" }}
              />
            </div>

            {/* FEEDBACK */}
            {feedback && (
              <div
                style={{
                  border:
                    state === "success"
                      ? "1px solid #a7f3d0"
                      : "1px solid #fecdd3",
                  background:
                    state === "success" ? "#ecfdf5" : "#fff1f2",
                  color:
                    state === "success" ? "#166534" : "#be123c",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {feedback}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={handleSubmit}
                style={{ ...publicButtonStyle(true), cursor: "pointer" }}
                type="button"
                disabled={state === "saving"}
              >
                {state === "saving" ? "Submitting…" : "Join Waitlist"}
              </button>

              <Link href="/pricing" style={publicButtonStyle(false)}>
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* RIGHT — TRUST PANEL */}
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
              Why join now?
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Stay informed as the workflow expands",
                "Signal what matters most to your family",
                "Raise your hand for beta access",
                "Help shape the product early",
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
                    lineHeight: 1.5,
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
              Privacy promise
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#475569",
              }}
            >
              We will only contact you about EduDecks Family updates and launch
              information. No spam. No third-party sharing.
            </div>
          </section>
        </div>
      </div>

      {/* FINAL CTA */}
      <section
        style={{
          ...publicCardStyle(),
          background:
            "linear-gradient(135deg, rgba(79,124,240,0.06) 0%, rgba(139,124,246,0.06) 100%)",
          border: "1px solid #bfdbfe",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          Not ready to join yet?
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#475569",
            lineHeight: 1.7,
            marginBottom: 16,
            maxWidth: 760,
          }}
        >
          You can still explore the workflow and see how the system fits your
          family before signing up.
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/get-started" style={publicButtonStyle(true)}>
            See How It Works
          </Link>

          <Link href="/capture" style={publicButtonStyle(false)}>
            Try Quick Capture
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}