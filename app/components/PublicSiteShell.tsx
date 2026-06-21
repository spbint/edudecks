"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FamilyWorkflowStrip from "@/app/components/FamilyWorkflowStrip";
import PreviewBadge from "@/app/components/PreviewBadge";
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
  navItems?: CtaLink[] | null;
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
  { href: "/about", label: "About" },
  { href: "/start-free", label: "Start free" },
];

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

const YOUTUBE_URL = "https://www.youtube.com/@MyLearna";
const FACEBOOK_URL = "#";
const INSTAGRAM_URL = "#";
const PINTEREST_URL = "#";

type SocialPlatform = "facebook" | "youtube" | "instagram" | "pinterest";

type SocialLink = {
  platform: SocialPlatform;
  label: string;
  href: string;
};

const SOCIAL_LINKS: SocialLink[] = [
  { platform: "facebook", label: "Facebook", href: FACEBOOK_URL },
  { platform: "youtube", label: "YouTube", href: YOUTUBE_URL },
  { platform: "instagram", label: "Instagram", href: INSTAGRAM_URL },
  { platform: "pinterest", label: "Pinterest", href: PINTEREST_URL },
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

  footerNavy: "#0f172a",
  footerNavySoft: "#1e293b",
  footerIconDisabled: "#94a3b8",
  footerFocus: "#bfdbfe",
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
    borderRadius: 12,
    padding: "9px 13px",
    fontWeight: 650,
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
    borderRadius: 12,
    padding: "8px 11px",
    fontWeight: 650,
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
    fontWeight: 700,
    borderRadius: 999,
    padding: "5px 9px",
    background,
    color,
    whiteSpace: "nowrap",
    border: `1px solid ${borderColor || background}`,
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  };
}

function isActiveSocialLink(href: string) {
  return href.trim() !== "#";
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const svgProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (platform === "youtube") {
    return (
      <svg {...svgProps}>
        <rect x="3.5" y="6.5" width="17" height="11" rx="3.8" />
        <path d="M10 9.4 15 12l-5 2.6Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg {...svgProps}>
        <rect x="4.5" y="4.5" width="15" height="15" rx="4.2" />
        <circle cx="12" cy="12" r="3.3" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (platform === "facebook") {
    return (
      <svg {...svgProps} viewBox="0 0 24 24">
        <path
          d="M13.8 20v-6.1h2.4l.4-2.7h-2.8V9.5c0-.8.3-1.4 1.6-1.4h1.3V5.8c-.2 0-1-.1-1.9-.1-2 0-3.3 1.2-3.3 3.4v2.1H9.4v2.7h2.4V20Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    );
  }

  return (
    <svg {...svgProps} viewBox="0 0 24 24">
      <path
        d="M12 4.8c-3.5 0-5.9 2.4-5.9 5.6 0 2.1 1 3.4 2.3 4l.8-2.8c-.2-.5-.3-1-.3-1.6 0-1.6 1.1-2.8 2.4-2.8 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.7-1 4.3-.2 1.3.6 2.2 1.8 2.2 2.3 0 3.8-2.7 3.8-6.1 0-2.5-1.8-4.6-4.9-4.6Zm0 14.5c-.9 0-1.8-.4-2.4-1l-.9 3.2c-.2.8-.6 1.6-1 2.3.8.2 1.6.3 2.5.3 4.8 0 8.3-3.7 8.3-8.3 0-4.2-3-7.2-7.3-7.2-5.1 0-8.1 3.6-8.1 7.5 0 2.1.9 4 2.8 4.7.3.1.5 0 .6-.2l.4-1.5c.1-.2 0-.4-.2-.6-.4-.5-.7-1.4-.7-2.4 0-2.4 1.8-4.9 5.1-4.9 2.8 0 4.3 1.9 4.3 4.1 0 3.1-1.3 5.7-3.4 5.7-1.1 0-1.9-.9-1.7-2.1.3-1.4.9-2.8.9-3.9 0-.9-.5-1.7-1.6-1.7-1.2 0-2.2 1.3-2.2 2.9 0 1 .3 1.8.3 1.8l-1.2 5c.5.1 1 .2 1.6.2Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default function PublicSiteShell({
  title = "MyLearna",
  eyebrow = "",
  heroTitle,
  heroText,
  heroMicrocopy,
  heroBadges = [],
  asideItems = [],
  navItems,
  primaryCta = { label: "Start free during beta", href: "/start-free" },
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
  const activeSocialLinks = SOCIAL_LINKS.filter((item) => isActiveSocialLink(item.href));
  const inactiveSocialLinks = SOCIAL_LINKS.filter((item) => !isActiveSocialLink(item.href));
  const resolvedNavItems = navItems === undefined ? NAV_ITEMS : navItems;

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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 8 : 10,
                flexWrap: "wrap",
                minWidth: 0,
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
              <PreviewBadge
                compact={isMobile}
                label="Beta V1"
                title="MyLearna Free Beta V1 is evolving with family feedback."
              />
            </div>

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

          {!isMobile && resolvedNavItems && resolvedNavItems.length > 0 ? (
            <nav
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {resolvedNavItems.map((item) => (
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
              marginBottom: isMobile ? 18 : 20,
              borderRadius: 24,
              overflow: "hidden",
              background:
                "linear-gradient(135deg, rgba(79,124,240,0.08) 0%, rgba(139,124,246,0.08) 100%)",
              border: `1px solid ${C.brandPrimaryBorder}`,
              boxShadow: "0 14px 34px rgba(15,23,42,0.05)",
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
                      ? "30px 28px 28px"
                      : "38px 28px 34px",
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
                    marginBottom: isMobile ? 16 : 18,
                  }}
                >
                  <Image
                    src="/branding/mylearna_logo_transparent_cropped.png"
                    alt="MyLearna logo"
                    width={1916}
                    height={821}
                    priority
                    style={{
                      width: compactHero
                        ? isMobile
                          ? "200px"
                          : isTablet
                            ? "300px"
                            : "380px"
                        : isMobile
                          ? "240px"
                          : isTablet
                            ? "360px"
                            : "460px",
                      maxWidth: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                </div>

                <h1
                  style={{
                    fontSize: compactHero ? (isMobile ? 27 : 34) : isMobile ? 30 : 38,
                    lineHeight: 1.08,
                    fontWeight: 800,
                    color: C.textStrong,
                    marginTop: 0,
                    marginBottom: compactHero ? 10 : isMobile ? 12 : 14,
                    maxWidth: 820,
                    marginLeft: "auto",
                    marginRight: "auto",
                    textAlign: "center",
                    letterSpacing: 0,
                  }}
                >
                  {heroTitle}
                </h1>

                <div
                  style={{
                    fontSize: compactHero ? 15 : isMobile ? 15 : 16,
                    lineHeight: 1.55,
                    color: C.textMain,
                    maxWidth: 640,
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
                        padding: isMobile ? "13px 18px" : "11px 17px",
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
          <style jsx>{`
            .public-social-button {
              width: 46px;
              height: 46px;
              border-radius: 999px;
              border: 1px solid rgba(255, 255, 255, 0.42);
              background: rgba(15, 23, 42, 0.14);
              color: #ffffff;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              text-decoration: none;
              transition:
                transform 140ms ease,
                border-color 140ms ease,
                background 140ms ease,
                box-shadow 140ms ease;
            }

            .public-social-button:hover {
              transform: translateY(-1px);
              background: rgba(37, 99, 235, 0.18);
              border-color: rgba(191, 219, 254, 0.82);
            }

            .public-social-button:focus-visible {
              outline: none;
              border-color: #ffffff;
              box-shadow: 0 0 0 3px rgba(191, 219, 254, 0.6);
            }

            .public-social-button--disabled {
              color: ${C.footerIconDisabled};
              border-color: rgba(148, 163, 184, 0.36);
              background: rgba(15, 23, 42, 0.08);
            }

            .public-social-sr {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border: 0;
            }
          `}</style>
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
              Plan learning, capture evidence, build portfolios, and create report-ready records.
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

            <div
              style={{
                marginTop: 16,
                borderRadius: 18,
                padding: isMobile ? "16px 14px" : "18px 18px 16px",
                background: `linear-gradient(135deg, ${C.footerNavy} 0%, ${C.footerNavySoft} 100%)`,
                border: "1px solid rgba(148,163,184,0.18)",
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#cbd5e1",
                  }}
                >
                  Connect with MyLearna
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#e2e8f0",
                  }}
                >
                  MyLearna - Plan. Learn. Capture. Report.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {activeSocialLinks.map((item) => (
                  <a
                    key={item.platform}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit MyLearna on ${item.label}`}
                    title={`Visit MyLearna on ${item.label}`}
                    className="public-social-button"
                  >
                    <SocialIcon platform={item.platform} />
                    <span className="public-social-sr">{item.label}</span>
                  </a>
                ))}

                {inactiveSocialLinks.map((item) => (
                  <span
                    key={item.platform}
                    className="public-social-button public-social-button--disabled"
                    role="img"
                    aria-label={`${item.label} coming soon`}
                    title={`${item.label} coming soon`}
                  >
                    <SocialIcon platform={item.platform} />
                  </span>
                ))}
              </div>
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
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
  } as React.CSSProperties;
}

export function publicButtonStyle(primary = false) {
  return {
    border: `1px solid ${primary ? C.brandPrimaryStrong : C.borderMid}`,
    background: primary ? C.brandPrimaryStrong : C.bgSurface,
    color: primary ? "#ffffff" : C.textMain,
    borderRadius: 12,
    padding: "9px 13px",
    fontWeight: 650,
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
    fontWeight: 700,
    borderRadius: 999,
    padding: "5px 9px",
    background: bg,
    color,
    whiteSpace: "nowrap",
    border: `1px solid ${bg}`,
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties;
}
