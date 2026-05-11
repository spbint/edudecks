"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FamilyWorkflowStrip from "@/app/components/FamilyWorkflowStrip";
import BrandHomeLink from "@/app/components/BrandHomeLink";
import useIsMobile from "@/app/components/useIsMobile";

type CtaLink = { label: string; href: string };

type PublicSiteShellProps = {
  title?: string;
  eyebrow?: string;
  heroTitle: string;
  heroText: string;
  heroMicrocopy?: React.ReactNode;
  heroBadges?: string[];
  asideItems?: string[];
  primaryCta?: CtaLink | null;
  secondaryCta?: CtaLink | null;
  headerAction?: CtaLink | null;
  headerPrimaryAction?: CtaLink | null;
  footerPrimaryCta?: CtaLink | null;
  footerSecondaryCta?: CtaLink | null;
  asideTitle?: string;
  asideText?: string;
  heroAsideVisible?: boolean;
  showWorkflowStrip?: boolean;
  compactHero?: boolean;
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

const C = {
  bgApp: "#f6f8fc",
  bgSurface: "#ffffff",
  bgSoft: "#f8fafc",
  borderSoft: "#e5e7eb",
  borderMid: "#d1d5db",
  textStrong: "#0f172a",
  textMain: "#1f2937",
  textMuted: "#64748b",

  brandPrimaryStrong: "#2563eb",
  brandPrimarySoft: "#eff6ff",
  brandPrimaryBorder: "#bfdbfe",

  brandSecondarySoft: "#f5f3ff",
  brandSecondaryBorder: "#ddd6fe",

  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#166534",

  warningBg: "#fff7ed",
  warningBorder: "#fed7aa",
  warningText: "#9a3412",
};

function isActive(pathname: string, href: string) {
  if (href.startsWith("/#")) return pathname === "/";
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function shellButtonStyle(primary = false): React.CSSProperties {
  return {
    border: `1px solid ${primary ? C.brandPrimaryStrong : C.borderMid}`,
    background: primary ? C.brandPrimaryStrong : C.bgSurface,
    color: primary ? "#ffffff" : C.textMain,
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    whiteSpace: "nowrap",
    boxShadow: primary ? "0 12px 24px rgba(37,99,235,0.14)" : "none",
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  };
}

function shellNavStyle(active: boolean): React.CSSProperties {
  return {
    border: active
      ? `1px solid ${C.brandPrimaryStrong}`
      : `1px solid ${C.borderMid}`,
    background: active ? C.brandPrimaryStrong : C.bgSurface,
    color: active ? "#ffffff" : C.textMain,
    borderRadius: 10,
    padding: "9px 12px",
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  };
}

function shellPillStyle(
  background: string,
  color: string,
  borderColor?: string
): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 800,
    borderRadius: 999,
    padding: "6px 10px",
    background,
    color,
    whiteSpace: "nowrap",
    border: `1px solid ${borderColor || background}`,
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  };
}

export default function PublicSiteShell({
  title = "MyLearna",
  eyebrow = "",
  heroTitle,
  heroText,
  heroMicrocopy,
  heroBadges = [],
  asideItems = [],
  primaryCta = { label: "Start Free", href: "/capture" },
  secondaryCta = { label: "See How It Works", href: "/get-started" },
  headerAction = { label: "Sign in", href: "/login" },
  headerPrimaryAction = null,
  footerPrimaryCta = primaryCta,
  footerSecondaryCta = { label: "Contact", href: "/contact" },
  asideTitle = "",
  asideText = "",
  heroAsideVisible = false,
  showWorkflowStrip = false,
  compactHero = false,
  children,
}: PublicSiteShellProps) {
  const pathname = usePathname();
  const isTablet = useIsMobile(1080);
  const isMobile = useIsMobile(720);

  const workflowRibbon = showWorkflowStrip ? (
    <section style={{ marginBottom: isMobile ? 18 : 20 }}>
      <FamilyWorkflowStrip />
    </section>
  ) : null;

  void eyebrow;
  void asideItems;
  void asideTitle;
  void asideText;
  void heroAsideVisible;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        color: C.textStrong,
        position: "relative",
        isolation: "isolate",
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,0.94)",
          borderBottom: `1px solid ${C.borderSoft}`,
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: isMobile ? "14px 16px 12px" : "18px 24px 16px",
            display: "grid",
            gap: isMobile ? 12 : 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: isMobile ? 12 : 22,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <BrandHomeLink
              href="/"
              height={isMobile ? 40 : 50}
              width={isMobile ? 148 : 184}
              style={{
                flexShrink: 0,
                paddingRight: isMobile ? 0 : 6,
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginLeft: "auto",
              }}
            >
              {headerAction ? (
                <Link href={headerAction.href} style={shellButtonStyle(false)}>
                  {headerAction.label}
                </Link>
              ) : null}
              {headerPrimaryAction ? (
                <Link
                  href={headerPrimaryAction.href}
                  style={shellButtonStyle(true)}
                >
                  {headerPrimaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>

          {!isMobile ? (
            <nav
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={shellNavStyle(isActive(pathname, item.href))}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <main
        style={{
          padding: isMobile ? "14px 16px 36px" : "24px 24px 48px",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          {!isMobile ? workflowRibbon : null}

          <section
            style={{
              marginBottom: 24,
              borderRadius: 26,
              overflow: "hidden",
              background:
                "linear-gradient(135deg, rgba(79,124,240,0.08) 0%, rgba(139,124,246,0.08) 100%)",
              border: `1px solid ${C.brandPrimaryBorder}`,
              boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
            }}
          >
            <div
              style={{
              padding: isMobile
                  ? compactHero
                    ? "22px 16px 20px"
                    : "28px 16px 24px"
                  : isTablet
                    ? compactHero
                      ? "28px 24px 24px"
                      : "36px 24px 30px"
                    : compactHero
                      ? "34px 32px 30px"
                      : "48px 32px 38px",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: isMobile ? 18 : 28,
                alignItems: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: isMobile ? 20 : 24,
                  }}
                >
                  <Image
                    src="/branding/MyLearna Logo.png"
                    alt="MyLearna logo"
                    width={1916}
                    height={821}
                    priority
                    style={{
                      width: compactHero
                        ? isMobile
                          ? "220px"
                          : isTablet
                            ? "320px"
                            : "400px"
                        : isMobile
                          ? "280px"
                          : isTablet
                            ? "420px"
                            : "560px",
                      maxWidth: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: compactHero ? (isMobile ? 28 : 36) : isMobile ? 32 : 44,
                    lineHeight: 1.02,
                    fontWeight: 900,
                    color: C.textStrong,
                    marginBottom: compactHero ? 10 : isMobile ? 12 : 14,
                    maxWidth: 820,
                    marginLeft: "auto",
                    marginRight: "auto",
                    textAlign: "center",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {heroTitle}
                </div>

                <div
                  style={{
                    fontSize: compactHero ? 15 : isMobile ? 16 : 17,
                    lineHeight: 1.7,
                    color: C.textMain,
                    maxWidth: 700,
                    marginBottom: compactHero ? 16 : 20,
                    marginLeft: "auto",
                    marginRight: "auto",
                    textAlign: "center",
                  }}
                >
                  {heroText}
                </div>

                {heroBadges.length > 0 ? (
                  <div
                    style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginBottom: compactHero ? 14 : 18,
                  }}
                >
                    {heroBadges.map((badge, i) => {
                      const tones = [
                        [C.brandPrimarySoft, C.brandPrimaryStrong, C.brandPrimaryBorder],
                        [C.brandSecondarySoft, "#6d28d9", C.brandSecondaryBorder],
                        [C.successBg, C.successText, C.successBorder],
                        [C.warningBg, C.warningText, C.warningBorder],
                      ] as const;
                      const tone = tones[i % tones.length];
                      return (
                        <div
                          key={badge}
                          style={shellPillStyle(tone[0], tone[1], tone[2])}
                        >
                          {badge}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {primaryCta ? (
                    <Link
                      href={primaryCta.href}
                      style={{
                        ...shellButtonStyle(true),
                        fontSize: isMobile ? 16 : 15,
                        padding: isMobile ? "14px 18px" : "12px 18px",
                        boxShadow: isMobile
                          ? "0 16px 28px rgba(37,99,235,0.18)"
                          : "0 12px 24px rgba(37,99,235,0.14)",
                        width: isMobile ? "100%" : undefined,
                      }}
                    >
                      {primaryCta.label}
                    </Link>
                  ) : null}

                  {secondaryCta ? (
                    <Link
                      href={secondaryCta.href}
                      style={{
                        ...shellButtonStyle(false),
                        width: isMobile ? "100%" : undefined,
                      }}
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : null}
                </div>

                {heroMicrocopy ? (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: C.textMuted,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {heroMicrocopy}
                  </div>
                ) : null}

                {isMobile ? workflowRibbon : null}
              </div>
            </div>
          </section>

          {children}
        </div>
      </main>

      <footer
        style={{
          borderTop: `1px solid ${C.borderSoft}`,
          background: "rgba(255,255,255,0.88)",
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "24px",
            display: "grid",
            gridTemplateColumns: isMobile ? "minmax(0, 1fr)" : "minmax(0, 1fr) auto",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: C.textStrong,
                marginBottom: 4,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 13,
                color: C.textMuted,
                lineHeight: 1.6,
                maxWidth: 620,
              }}
            >
              Capture learning, build a record over time, and move into reporting with a clearer pathway.
            </div>
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                marginTop: 10,
              }}
            >
              {FOOTER_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.textMain,
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: isMobile ? "flex-start" : "flex-end",
            }}
          >
            {footerSecondaryCta ? (
              <Link href={footerSecondaryCta.href} style={shellButtonStyle(false)}>
                {footerSecondaryCta.label}
              </Link>
            ) : null}
            {footerPrimaryCta ? (
              <Link href={footerPrimaryCta.href} style={shellButtonStyle(true)}>
                {footerPrimaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}

export function publicCardStyle() {
  return {
    background: C.bgSurface,
    border: `1px solid ${C.borderSoft}`,
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  } as React.CSSProperties;
}

export function publicButtonStyle(primary = false) {
  return {
    border: `1px solid ${primary ? C.brandPrimaryStrong : C.borderMid}`,
    background: primary ? C.brandPrimaryStrong : C.bgSurface,
    color: primary ? "#ffffff" : C.textMain,
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    whiteSpace: "nowrap",
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties;
}

export function publicPill(bg: string, color: string) {
  return {
    fontSize: 12,
    fontWeight: 800,
    borderRadius: 999,
    padding: "6px 10px",
    background: bg,
    color,
    whiteSpace: "nowrap",
    border: `1px solid ${bg}`,
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties;
}
