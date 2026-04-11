"use client";

import React from "react";
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
  footerPrimaryCta?: CtaLink | null;
  footerSecondaryCta?: CtaLink | null;
  asideTitle?: string;
  asideText?: string;
  showWorkflowStrip?: boolean;
  children: React.ReactNode;
};

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/#families", label: "Families" },
  { href: "/#schools", label: "Schools" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

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

function shellCardStyle(): React.CSSProperties {
  return {
    background: C.bgSurface,
    border: `1px solid ${C.borderSoft}`,
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  };
}

function shellSoftCardStyle(): React.CSSProperties {
  return {
    background: C.bgSoft,
    border: `1px solid ${C.borderSoft}`,
    borderRadius: 14,
    padding: 14,
  };
}

function mobileAsideCardStyle(): React.CSSProperties {
  return {
    ...shellCardStyle(),
    padding: 16,
    marginTop: 8,
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
  title = "EduDecks",
  eyebrow = "Homeschool-first workflow",
  heroTitle,
  heroText,
  heroMicrocopy,
  heroBadges = [],
  asideItems = [
    "Works with different homeschool styles",
    "Nothing is submitted automatically",
    "Build evidence over time, not in a panic",
    "Stay organised without turning home into school",
  ],
  primaryCta = { label: "Start Free", href: "/capture" },
  secondaryCta = { label: "See How It Works", href: "/get-started" },
  headerAction = { label: "Sign in", href: "/login" },
  footerPrimaryCta = primaryCta,
  footerSecondaryCta = { label: "Contact", href: "/contact" },
  asideTitle = "Why families feel calmer",
  asideText = "EduDecks gives families, teachers, and school leaders one calmer way to capture evidence, guide attention, and stay clear on what matters next.",
  showWorkflowStrip = true,
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

  void title;

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

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
              {headerAction ? (
                <Link href={headerAction.href} style={shellButtonStyle(false)}>
                  {headerAction.label}
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
                padding: isMobile ? "20px 16px" : isTablet ? "24px 20px" : "28px 24px",
                display: "grid",
                gridTemplateColumns: isTablet
                  ? "minmax(0, 1fr)"
                  : "minmax(0, 1.3fr) minmax(280px, 0.9fr)",
                gap: isMobile ? 18 : 28,
                alignItems: isTablet ? "start" : "center",
              }}
            >
              <div>
                {!isMobile ? (
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.2,
                      fontWeight: 800,
                      letterSpacing: 1.1,
                      textTransform: "uppercase",
                      color: C.textMuted,
                      marginBottom: 8,
                    }}
                  >
                    {eyebrow}
                  </div>
                ) : null}

                <div
                  style={{
                    fontSize: isMobile ? 30 : 34,
                    lineHeight: isMobile ? 1.08 : 1.1,
                    fontWeight: 900,
                    color: C.textStrong,
                    marginBottom: isMobile ? 10 : 12,
                    maxWidth: 820,
                  }}
                >
                  {heroTitle}
                </div>

                <div
                  style={{
                    fontSize: isMobile ? 15 : 14,
                    lineHeight: isMobile ? 1.72 : 1.6,
                    color: C.textMain,
                    maxWidth: isMobile ? 520 : 860,
                    marginBottom: isMobile ? 20 : 18,
                  }}
                >
                  {heroText}
                </div>

                {!isMobile && heroBadges.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 18,
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

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {primaryCta ? (
                    <Link
                      href={primaryCta.href}
                      style={{
                        ...shellButtonStyle(true),
                        fontSize: isMobile ? 16 : 14,
                        padding: isMobile ? "14px 18px" : "10px 14px",
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
                        display: isMobile ? "none" : "inline-flex",
                      }}
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : null}
                </div>

                {heroMicrocopy ? (
                  <div
                    style={{
                      marginTop: isMobile ? 0 : 10,
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: C.textMuted,
                      fontWeight: 600,
                      display: isMobile ? "none" : "block",
                    }}
                  >
                    {heroMicrocopy}
                  </div>
                ) : null}

                {isMobile ? workflowRibbon : null}

                {isMobile ? (
                  <div style={mobileAsideCardStyle()}>
                    <div
                      style={{
                        fontSize: 12,
                        lineHeight: 1.2,
                        fontWeight: 800,
                        letterSpacing: 1.1,
                        textTransform: "uppercase",
                        color: C.textMuted,
                        marginBottom: 8,
                      }}
                    >
                      {asideTitle}
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: C.textMain,
                        marginBottom: 12,
                      }}
                    >
                      {asideText}
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      {asideItems.slice(0, 3).map((item, i) => (
                        <div
                          key={item}
                          style={{
                            ...shellSoftCardStyle(),
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 999,
                              background:
                                i === 0
                                  ? C.brandPrimaryStrong
                                  : i === 1
                                    ? "#6d28d9"
                                    : C.successText,
                              flexShrink: 0,
                            }}
                          />
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: C.textMain,
                              lineHeight: 1.5,
                            }}
                          >
                            {item}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {!isMobile ? (
                <div style={shellCardStyle()}>
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.2,
                      fontWeight: 800,
                      letterSpacing: 1.1,
                      textTransform: "uppercase",
                      color: C.textMuted,
                      marginBottom: 8,
                    }}
                  >
                    {asideTitle}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: C.textMain,
                      marginBottom: 14,
                    }}
                  >
                    {asideText}
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {asideItems.map((item, i) => (
                      <div
                        key={item}
                        style={{
                          ...shellSoftCardStyle(),
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 14px",
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background:
                              i === 0
                                ? C.brandPrimaryStrong
                                : i === 1
                                  ? "#6d28d9"
                                  : i === 2
                                    ? C.successText
                                    : C.warningText,
                            flexShrink: 0,
                          }}
                        />
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: C.textMain,
                            lineHeight: 1.45,
                          }}
                        >
                          {item}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
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
            gridTemplateColumns: "minmax(0, 1fr) auto",
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
              EduDecks
            </div>
            <div
              style={{
                fontSize: 13,
                color: C.textMuted,
                lineHeight: 1.6,
                maxWidth: 620,
              }}
            >
              One calm operating system for families, teachers, and school
              leaders who want clearer learning visibility and a better next
              move.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
