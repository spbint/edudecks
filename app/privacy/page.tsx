import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Privacy Policy | MyLearna",
  description:
    "Plain-language privacy policy for MyLearna, covering family learning records, community content, Google Analytics, and the services used to run the platform.",
  path: "/privacy",
});

const INFO_CATEGORIES = [
  {
    title: "Account setup details",
    text: "When you start an account, we may store basic setup details such as your name, email address, country or region, and number of children so My Profile and My Settings can be easier to complete.",
  },
  {
    title: "Account and sign-in information",
    text: "We may store your email address and the authentication details needed to help you sign in and manage your account.",
  },
  {
    title: "Information entered by families",
    text: "This can include learner names or details, programs, planning and calendar items, learning captures, portfolio selections, and reports or other outputs you create in MyLearna.",
  },
  {
    title: "Community content",
    text: "If you use Community features, we may store posts, replies, suggestions, and other feedback you choose to share there.",
  },
  {
    title: "Technical and usage information",
    text: "Like most online services, we may receive routine hosting logs, basic service diagnostics, and browser or device metadata that our providers collect to keep the platform running.",
  },
] as const;

const USES = [
  "to create accounts and make first setup easier",
  "to create and secure accounts",
  "to store and show your family learning records inside the product",
  "to provide Community features and respond to feedback",
  "to send transactional or sign-in emails",
  "to troubleshoot issues, keep the service operating, and improve the platform over time",
] as const;

const SERVICES = [
  {
    name: "Supabase",
    text: "used for authentication and database services",
  },
  {
    name: "Vercel",
    text: "used for hosting and deployment",
  },
  {
    name: "Resend",
    text: "used for transactional and authentication email delivery",
  },
  {
    name: "Google Workspace",
    text: "used for human contact email handling",
  },
  {
    name: "Google Analytics",
    text: "used for basic website usage analytics such as page views and referral sources",
  },
  {
    name: "Meta Pixel",
    text: "used on public pages to understand visits and measure account signup effectiveness",
  },
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

export default function PrivacyPage() {
  return (
    <PublicSiteShell
      title="MyLearna"
      heroTitle="Privacy Policy"
      heroText="MyLearna helps homeschooling families plan learning, capture evidence, prepare reports, and build learning records with more confidence. This page explains, in plain language, how information is handled during early access."
      heroBadges={["Early access", "Family records", "Community guidance", "No data selling"]}
      heroMicrocopy={
        <span>
          Last updated May 12, 2026. Questions can be sent to{" "}
          <a
            href="mailto:hello@mylearna.com"
            style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}
          >
            hello@mylearna.com
          </a>
          .
        </span>
      }
      primaryCta={{ label: "Start free during beta", href: "/start-free?source=privacy-primary" }}
      secondaryCta={{ label: "Contact", href: "/contact" }}
      headerAction={{ label: "Sign in", href: "/login" }}
      headerPrimaryAction={{ label: "Start free", href: "/start-free?source=privacy-header" }}
      footerPrimaryCta={{ label: "Start free during beta", href: "/start-free?source=privacy-footer" }}
      footerSecondaryCta={{ label: "Contact", href: "/contact" }}
      compactHero
    >
      <div style={{ display: "grid", gap: 20, marginBottom: 24 }}>
        <section style={sectionStyle}>
          <div style={{ display: "grid", gap: 12 }}>
            <p style={smallLabelStyle}>What this policy covers</p>
            <h2 style={sectionTitleStyle}>A practical overview for early-access families</h2>
            <p style={paragraphStyle}>
              MyLearna is built to support private family learning records. Most of the
              information in the product comes directly from what families choose to add,
              and we use that information to operate the platform and improve it over time.
            </p>
            <p style={paragraphStyle}>
              MyLearna is currently in early access, so features and workflows may evolve as
              we learn from real family use. If that changes how information is handled, this
              page will be updated.
            </p>
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <p style={smallLabelStyle}>Information we may collect</p>
              <h2 style={sectionTitleStyle}>Information categories</h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {INFO_CATEGORIES.map((item) => (
                <div
                  key={item.title}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 18,
                    background: "#f8fafc",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                      lineHeight: 1.3,
                      fontWeight: 900,
                      color: "#0f172a",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={paragraphStyle}>{item.text}</p>
                </div>
              ))}
            </div>
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
              <p style={smallLabelStyle}>How information is used</p>
              <h2 style={sectionTitleStyle}>We use information to run MyLearna</h2>
              <ul style={listStyle}>
                {USES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p style={paragraphStyle}>
                MyLearna does not sell personal data. Information is used to operate,
                support, and improve the platform.
              </p>
            </div>
          </section>

          <section style={sectionStyle}>
            <div style={{ display: "grid", gap: 12 }}>
              <p style={smallLabelStyle}>Community and family safety</p>
              <h2 style={sectionTitleStyle}>Private records and public discussion are different</h2>
              <p style={paragraphStyle}>
                MyLearna is intended for private family learning records. Community areas are
                better used for discussion, suggestions, and general support than for detailed
                personal records.
              </p>
              <p style={paragraphStyle}>
                Please avoid posting children&apos;s full names, private records, addresses,
                health information, or other sensitive personal information in Community.
                Community posts may be visible to authenticated users inside Community.
              </p>
            </div>
          </section>
        </section>

        <section style={sectionStyle}>
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <p style={smallLabelStyle}>Services used to run the platform</p>
              <h2 style={sectionTitleStyle}>Current providers</h2>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {SERVICES.map((service) => (
                <div
                  key={service.name}
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 16,
                    padding: 18,
                    background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                      lineHeight: 1.3,
                      fontWeight: 900,
                      color: "#0f172a",
                    }}
                  >
                    {service.name}
                  </h3>
                  <p style={paragraphStyle}>{service.text}</p>
                </div>
              ))}
            </div>
            <p style={paragraphStyle}>
              We use Google Analytics in a minimal way to understand basic website usage,
              such as page visits and how people found MyLearna. We do not use it for ads
              personalization, remarketing, or session replay.
            </p>
            <p style={paragraphStyle}>
              We may use marketing analytics tools, such as Meta Pixel, on public pages to
              understand visits and sign-ups. We do not use these tools to track children&apos;s
              learning records, portfolio evidence, assessment responses or authenticated
              homeschool content.
            </p>
            <p style={paragraphStyle}>
              We use product analytics inside MyLearna to understand which features are used
              and where families may need support. We avoid sending children&apos;s learning
              content, evidence text, report text, assessment answers or uploaded files to
              analytics tools.
            </p>
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
              If you have a privacy question, need help with your account, or want to raise a
              concern about information in MyLearna, email{" "}
              <a
                href="mailto:hello@mylearna.com"
                style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}
              >
                hello@mylearna.com
              </a>
              .
            </p>
            <p style={paragraphStyle}>
              You can also use the{" "}
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
