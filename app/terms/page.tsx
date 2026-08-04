import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Terms of Use | MyLearna",
  description:
    "Plain-language terms for MyLearna early access, covering family responsibilities, community expectations, and homeschool reporting boundaries.",
  path: "/terms",
});

const EXPECTATIONS = [
  "use MyLearna for lawful, genuine family learning records and constructive participation",
  "review the information you enter and keep it reasonably accurate",
  "avoid spam, harassment, misuse, or attempts to interfere with the service",
  "use Community thoughtfully and avoid sharing information that should stay private",
] as const;

const COMMUNITY_RULES = [
  "Be respectful with other families.",
  "Do not post harassment, spam, or abusive content.",
  "Do not post children's full names, private records, or personal documents in Community.",
  "Do not upload or share copyrighted file downloads you do not have the right to share.",
  "Community discussions, suggestions, and replies are not legal advice.",
] as const;

const REPORT_BOUNDARIES = [
  "Reports, outputs, and PDFs created in MyLearna are family learning records prepared from the information you enter.",
  "Please review records and reports before sharing or submitting them.",
  "MyLearna does not guarantee that any record, report, or PDF will be accepted by a school, authority, reviewer, or regulator.",
  "These outputs are not government-issued forms, authority decisions, or acceptance notices.",
  "Families should check their own local, state, national, or other home education requirements.",
] as const;

const sectionStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  padding: 24,
  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  lineHeight: 1.15,
  fontWeight: 900,
  color: "#0f172a",
};

const paragraphStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.75,
  color: "#334155",
};

const smallLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#64748b",
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  display: "grid",
  gap: 10,
  color: "#334155",
  fontSize: 15,
  lineHeight: 1.7,
};

export default function TermsPage() {
  return (
    <PublicSiteShell
      title="MyLearna"
      heroTitle="Terms of Use"
      heroText="MyLearna helps homeschooling families plan learning, capture evidence, prepare reports, and build learning records with more confidence. These terms explain the practical ground rules for using the platform during early access."
      heroBadges={["Early access", "Family responsibility", "Community standards", "Reporting boundaries"]}
      heroMicrocopy={
        <span>
          Last updated May 11, 2026. Questions can be sent to{" "}
          <a
            href="mailto:hello@mylearna.com"
            style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}
          >
            hello@mylearna.com
          </a>
          .
        </span>
      }
      primaryCta={{ label: "Start free", href: "/start-free?source=terms-primary" }}
      secondaryCta={{ label: "Contact", href: "/contact" }}
      headerAction={{ label: "Sign in", href: "/login" }}
      headerPrimaryAction={{ label: "Start free", href: "/start-free?source=terms-header" }}
      footerPrimaryCta={{ label: "Start free", href: "/start-free?source=terms-footer" }}
      footerSecondaryCta={{ label: "Contact", href: "/contact" }}
      compactHero
    >
      <div style={{ display: "grid", gap: 20, marginBottom: 24 }}>
        <section style={sectionStyle}>
          <div style={{ display: "grid", gap: 12 }}>
            <p style={smallLabelStyle}>Using MyLearna</p>
            <h2 style={sectionTitleStyle}>A practical agreement for early-access families</h2>
            <p style={paragraphStyle}>
              MyLearna is currently in early access. Features, workflows, and outputs may
              evolve over time as the platform grows and as families help shape what is most
              useful.
            </p>
            <p style={paragraphStyle}>
              By using MyLearna, you are agreeing to use the platform responsibly, review the
              records you create, and respect the boundaries described on this page.
            </p>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <p style={smallLabelStyle}>Acceptable use</p>
              <h2 style={sectionTitleStyle}>What we expect from users</h2>
            </div>
            <ul style={listStyle}>
              {EXPECTATIONS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <section style={sectionStyle}>
            <div style={{ display: "grid", gap: 12 }}>
              <p style={smallLabelStyle}>Family responsibility</p>
              <h2 style={sectionTitleStyle}>You are responsible for what you enter</h2>
              <p style={paragraphStyle}>
                Families are responsible for the information they enter into MyLearna, the
                records they keep, and the decisions they make about how those records are
                used.
              </p>
              <p style={paragraphStyle}>
                MyLearna helps organise records and reports, but it does not provide legal
                advice. Families should check the home education requirements that apply in
                their own area before relying on any report or record for submission.
              </p>
            </div>
          </section>

          <section style={sectionStyle}>
            <div style={{ display: "grid", gap: 12 }}>
              <p style={smallLabelStyle}>Account security</p>
              <h2 style={sectionTitleStyle}>Keep your login details secure</h2>
              <p style={paragraphStyle}>
                Please keep your login details secure and do not share account access casually.
                You are responsible for activity that happens under your account.
              </p>
              <p style={paragraphStyle}>
                If you think someone has accessed your account without permission, contact{" "}
                <a
                  href="mailto:hello@mylearna.com"
                  style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}
                >
                  hello@mylearna.com
                </a>{" "}
                as soon as possible.
              </p>
            </div>
          </section>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <p style={smallLabelStyle}>Reports and PDFs</p>
              <h2 style={sectionTitleStyle}>Useful records, not formal decisions</h2>
            </div>
            <ul style={listStyle}>
              {REPORT_BOUNDARIES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <p style={smallLabelStyle}>Community expectations</p>
              <h2 style={sectionTitleStyle}>Respectful, careful participation matters</h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {COMMUNITY_RULES.map((item) => (
                <div
                  key={item}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 18,
                    background: "#f8fafc",
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "#334155",
                    fontWeight: 700,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          style={{
            ...sectionStyle,
            background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
            border: "1px solid #dbeafe",
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <p style={smallLabelStyle}>Questions and contact</p>
            <h2 style={sectionTitleStyle}>How to reach us</h2>
            <p style={paragraphStyle}>
              If you have a question about these terms, need help with your account, or want
              to raise a concern about content on the platform, email{" "}
              <a
                href="mailto:hello@mylearna.com"
                style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}
              >
                hello@mylearna.com
              </a>
              .
            </p>
            <p style={paragraphStyle}>
              You can also review our{" "}
              <Link
                href="/privacy"
                style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}
              >
                Privacy Policy
              </Link>{" "}
              or use the{" "}
              <Link
                href="/contact"
                style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}
              >
                contact page
              </Link>{" "}
              if you want to get in touch through the site.
            </p>
          </div>
        </section>
      </div>
    </PublicSiteShell>
  );
}
