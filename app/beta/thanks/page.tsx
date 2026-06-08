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
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
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

type BetaThanksPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function BetaThanksPage({ searchParams }: BetaThanksPageProps) {
  const params = searchParams ? await searchParams : {};
  const alreadyRecorded = params.status === "already";
  const heroTitle = alreadyRecorded
    ? "You're already on the MyLearna beta list"
    : "Thanks for joining the MyLearna Beta";
  const heroText = alreadyRecorded
    ? "You're already on the beta list. We've got your interest recorded, and we'll contact you when a suitable beta place opens."
    : "Thanks - your beta interest has been recorded. We're inviting families gradually so we can learn from real use without overwhelming the experience.";

  return (
    <PublicSiteShell
      title={heroTitle}
      eyebrow={alreadyRecorded ? "Beta interest already recorded" : "Beta interest received"}
      heroTitle={heroTitle}
      heroText={heroText}
      heroBadges={["Free beta", "Gradual invites", "Family feedback", "You're on the list"]}
      navItems={[]}
      primaryCta={null}
      secondaryCta={null}
      headerAction={{ label: "Home", href: "/" }}
      headerPrimaryAction={null}
      footerPrimaryCta={null}
      footerSecondaryCta={null}
      compactHero
      asideTitle="What happens next"
      asideText="We'll review interest in small waves and invite families gradually so the beta stays useful, calm, and well supported."
    >
      <section
        style={{
          width: "100%",
          maxWidth: 760,
          minWidth: 0,
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
            {alreadyRecorded
              ? "You're already on the beta list"
              : "Thanks - your beta interest has been recorded"}
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
              marginBottom: 18,
            }}
          >
            {alreadyRecorded
              ? "We've got your interest recorded. You do not need to submit the form again."
              : "We are opening the beta carefully so we can learn from real families, fix the rough edges, and keep the experience calm. When a place opens, we'll contact you with the next step."}
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

          <Link href="/signup?next=/my-day" style={primaryButtonStyle()}>
            Create your MyLearna account
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
