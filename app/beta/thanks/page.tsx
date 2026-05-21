import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import PublicSiteShell from "@/app/components/PublicSiteShell";

export const metadata: Metadata = {
  title: "Thanks for joining the MyLearna Beta",
};

function cardStyle(): CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 24,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  };
}

function primaryButtonStyle(): CSSProperties {
  return {
    minHeight: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

export default function BetaThanksPage() {
  return (
    <PublicSiteShell
      title="Thanks for joining the MyLearna Beta"
      eyebrow="Beta interest received"
      heroTitle="Thanks for joining the MyLearna Beta"
      heroText="We have your details and we'll be inviting families into the beta gradually. This is a free beta, and we'll only contact you about access and feedback."
      heroBadges={["Free beta", "Gradual invites", "Family feedback", "Thanks for joining"]}
      primaryCta={{ label: "Back to home", href: "/" }}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      headerPrimaryAction={null}
      footerPrimaryCta={{ label: "Back to home", href: "/" }}
      footerSecondaryCta={{ label: "How it works", href: "/#how-it-works" }}
      asideTitle="What happens next"
      asideText="We'll review interest in small waves and invite families gradually so the beta stays useful, calm, and well supported."
    >
      <section
        style={{
          maxWidth: 760,
          marginBottom: 24,
        }}
      >
        <div style={cardStyle()}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            You&apos;re on the beta list
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
              marginBottom: 18,
            }}
          >
            We are opening the beta carefully so we can learn from real families, fix the
            rough edges, and keep the experience calm. When a place opens, we&apos;ll contact
            you with the next step.
          </div>

          <div
            style={{
              border: "1px solid #bfdbfe",
              borderRadius: 14,
              background: "#eff6ff",
              padding: 14,
              color: "#1d4ed8",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.6,
              marginBottom: 18,
            }}
          >
            This is a free beta. You are not being charged, and there is nothing else you
            need to do right now.
          </div>

          <Link href="/" style={primaryButtonStyle()}>
            Back to the homepage
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
