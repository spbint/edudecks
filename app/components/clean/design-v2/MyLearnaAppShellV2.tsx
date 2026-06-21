"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import ProductAnalyticsProvider from "@/app/components/clean/analytics/ProductAnalyticsProvider";
import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";
import CleanCommunityNotificationsMenu from "@/app/components/clean/CleanCommunityNotificationsMenu";
import ReportProblemButton from "@/app/components/clean/ReportProblemButton";

export const v2Tokens = {
  page: "#F7F9FC",
  card: "#FFFFFF",
  navy: "#17204B",
  slate: "#5B6478",
  purple: "#6C4DF6",
  lavender: "#F2EDFF",
  mint: "#ECFDF4",
  green: "#2F9D68",
  amber: "#F59E0B",
  softAmber: "#FFF7E6",
  red: "#E85D75",
  softRed: "#FFF0F3",
  border: "#E7EAF2",
  shadow: "0 6px 18px rgba(23, 32, 75, 0.05)",
};

const navItems = [
  { href: "/my-day", label: "My Day", icon: "sun", matches: ["/my-day", "/home", "/dashboard"] },
  { href: "/my-calendar", label: "My Calendar", icon: "calendar", matches: ["/my-calendar", "/calendar"] },
  { href: "/my-pathways", label: "My Pathways", icon: "route", matches: ["/my-pathways"] },
  { href: "/my-review", label: "My Review", icon: "review", matches: ["/my-review"] },
  { href: "/my-capture", label: "My Capture", icon: "camera", matches: ["/my-capture", "/capture"] },
  { href: "/my-portfolio", label: "My Portfolio", icon: "folder", matches: ["/my-portfolio", "/portfolio"] },
  { href: "/my-data", label: "My Data", icon: "chart", matches: ["/my-data", "/my-curriculum", "/curriculum"] },
  { href: "/my-reports", label: "My Reports", icon: "file", matches: ["/my-reports", "/reports"] },
  { href: "/my-settings", label: "My Settings", icon: "gear", matches: ["/my-settings", "/settings"] },
] as const;

type ShellIconName = (typeof navItems)[number]["icon"] | "help";

function ShellIcon({ name, size = 20 }: { name: ShellIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "sun") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.8v2.1M12 19.1v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg {...common}>
        <path d="M7 3.5v3" />
        <path d="M17 3.5v3" />
        <path d="M5.2 6h13.6A2.2 2.2 0 0 1 21 8.2v9.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.8V8.2A2.2 2.2 0 0 1 5.2 6Z" />
        <path d="M3.5 10h17" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
      </svg>
    );
  }
  if (name === "route") {
    return (
      <svg {...common}>
        <circle cx="6" cy="18" r="2.4" />
        <circle cx="18" cy="6" r="2.4" />
        <path d="M8.2 17.2c4.6-1 7.7-3.9 8.6-9" />
        <path d="M8.2 18H14a4 4 0 0 0 4-4v-1" />
      </svg>
    );
  }
  if (name === "review") {
    return (
      <svg {...common}>
        <path d="M7 4h10a2 2 0 0 1 2 2v13l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z" />
        <path d="M9.5 8.5h5" />
        <path d="M9.5 12h3.5" />
        <path d="M15 11.7l.8.8 1.7-2" />
      </svg>
    );
  }
  if (name === "camera") {
    return (
      <svg {...common}>
        <path d="M5 8.5A2.5 2.5 0 0 1 7.5 6H9l1.3-1.6h3.4L15 6h1.5A2.5 2.5 0 0 1 19 8.5v7A2.5 2.5 0 0 1 16.5 18h-9A2.5 2.5 0 0 1 5 15.5v-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (name === "folder") {
    return (
      <svg {...common}>
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2.2h5.5A2.5 2.5 0 0 1 20 9.7v6.8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19h16" />
        <path d="M7 16v-5" />
        <path d="M12 16V7" />
        <path d="M17 16v-8" />
      </svg>
    );
  }
  if (name === "file") {
    return (
      <svg {...common}>
        <path d="M7 3.8h6.5L18 8.3v11.9H7V3.8Z" />
        <path d="M13.5 4v4.5H18" />
        <path d="M9.5 12h5" />
        <path d="M9.5 15h5" />
      </svg>
    );
  }
  if (name === "gear") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2M12 18.5v2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M3.5 12h2M18.5 12h2M5.8 18.2l1.4-1.4M16.8 7.2l1.4-1.4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.4a2.4 2.4 0 0 1 4.6 1c0 1.8-2.4 2-2.4 3.8" />
      <path d="M12 17.2h.01" />
    </svg>
  );
}

function routeTitle(pathname: string) {
  const item = navItems.find((candidate) =>
    candidate.matches.some((match) => pathname === match || pathname.startsWith(`${match}/`)),
  );
  if (pathname.startsWith("/my-profile") || pathname.startsWith("/clean-my-profile")) {
    return "My Profile";
  }
  if (pathname.startsWith("/my-settings") || pathname.startsWith("/clean-my-settings")) {
    return "My Settings";
  }
  if (pathname.startsWith("/my-community")) return "My Community";
  if (pathname.startsWith("/my-pathways/activity-player-v4-preview")) {
    return "Activity Player V4 Preview";
  }
  if (pathname.startsWith("/my-pathways/placement") || pathname.startsWith("/clean-my-pathways/placement")) {
    return "Pathway Placement";
  }
  if (pathname.startsWith("/pathways/practice-prototype")) return "Practise";
  if (pathname.startsWith("/practice/number-targeted")) return "Practise";
  if (pathname.startsWith("/assessments/number")) return "Assess";
  return item?.label ?? "MyLearna";
}

type BreadcrumbItem = {
  label: string;
  href?: string;
};

function routeCrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname.startsWith("/my-profile") || pathname.startsWith("/clean-my-profile")) {
    return [{ label: "MyLearna" }, { label: "My Profile" }];
  }
  if (pathname.startsWith("/my-settings") || pathname.startsWith("/clean-my-settings")) {
    return [{ label: "MyLearna" }, { label: "My Settings", href: "/my-settings" }];
  }
  if (pathname.startsWith("/my-community")) return [{ label: "MyLearna" }, { label: "My Community" }];
  if (pathname.startsWith("/my-pathways/activity-player-v4-preview")) {
    return [
      { label: "MyLearna" },
      { label: "My Pathways", href: "/my-pathways" },
      { label: "Activity Player V4 Preview" },
    ];
  }
  if (pathname.startsWith("/my-pathways/placement") || pathname.startsWith("/clean-my-pathways/placement")) {
    return [{ label: "MyLearna" }, { label: "My Pathways", href: "/my-pathways" }, { label: "Placement" }];
  }
  if (pathname.startsWith("/practice/number-targeted")) {
    return [{ label: "My Pathways", href: "/my-pathways" }, { label: "Practise" }];
  }
  if (pathname.startsWith("/pathways/practice-prototype")) {
    return [{ label: "My Pathways", href: "/my-pathways" }, { label: "Practise" }];
  }
  if (pathname.startsWith("/assessments/number")) {
    return [{ label: "My Pathways", href: "/my-pathways" }, { label: "Assess" }];
  }
  const navItem = navItems.find((candidate) =>
    candidate.matches.some((match) => pathname === match || pathname.startsWith(`${match}/`)),
  );
  return [{ label: "MyLearna" }, { label: routeTitle(pathname), href: navItem?.href }];
}

function getActivityMode(pathname: string): "practice" | "assess" | null {
  if (pathname.startsWith("/my-pathways/activity-player-v4-preview")) {
    return "practice";
  }
  if (pathname.startsWith("/practice/number-targeted") || pathname.startsWith("/pathways/practice-prototype")) {
    return "practice";
  }
  if (pathname.startsWith("/assessments/number")) {
    return "assess";
  }
  return null;
}

function formatActivityContext(value: string | null) {
  if (!value) return null;
  return value
    .replace(/^number-step-/i, "Step ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isActive(pathname: string, matches: readonly string[]) {
  return matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
}

export function V2Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section
      style={{
        border: `1px solid ${v2Tokens.border}`,
        borderRadius: 18,
        background: v2Tokens.card,
        boxShadow: v2Tokens.shadow,
        padding: "clamp(14px, 2.4vw, 20px)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function V2PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <V2Card>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 14 }}>
        <div style={{ display: "grid", gap: 6, maxWidth: 720 }}>
          {eyebrow ? (
            <div style={{ color: v2Tokens.purple, fontSize: 12, fontWeight: 700 }}>
              {eyebrow}
            </div>
          ) : null}
          <h1
            style={{
              margin: 0,
              color: v2Tokens.navy,
              fontSize: "clamp(24px, 3.2vw, 30px)",
              lineHeight: 1.18,
              fontWeight: 750,
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p style={{ margin: 0, color: v2Tokens.slate, lineHeight: 1.5, fontSize: 14, maxWidth: 680 }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </V2Card>
  );
}

export default function MyLearnaAppShellV2({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthUser();
  const title = routeTitle(pathname);
  const breadcrumbs = routeCrumbs(pathname);
  const activityMode = getActivityMode(pathname);
  const activityContext =
    pathname.startsWith("/my-pathways/activity-player-v4-preview")
      ? "Activity Player V4 preview"
      :
    formatActivityContext(searchParams.get("stepKey")) ||
    formatActivityContext(searchParams.get("pathwayStepId")) ||
    "My Pathways";

  if (activityMode) {
    const modeLabel = activityMode === "practice" ? "Practise" : "Assess";
    const modeSubtitle = activityMode === "practice" ? "Let's try together." : "Have a go on your own.";
    const modeColor = activityMode === "practice" ? v2Tokens.purple : v2Tokens.green;
    const modeFill = activityMode === "practice" ? v2Tokens.lavender : v2Tokens.mint;

    return (
      <div
        className="mylearna-activity-focus-shell"
        style={{
          minHeight: "100vh",
          background: v2Tokens.page,
          color: v2Tokens.navy,
        }}
      >
        <ProductAnalyticsProvider />
        <style jsx global>{`
          @media (max-width: 720px) {
            .mylearna-activity-focus-header {
              align-items: flex-start !important;
              flex-direction: column !important;
            }

            .mylearna-activity-focus-main {
              padding: 10px !important;
            }
          }
        `}</style>
        <header
          className="mylearna-activity-focus-header"
          style={{
            minHeight: 54,
            position: "sticky",
            top: 0,
            zIndex: 40,
            borderBottom: `1px solid ${v2Tokens.border}`,
            background: "rgba(247,249,252,0.94)",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "9px clamp(12px, 3vw, 24px)",
          }}
        >
          <Link
            href="/my-pathways"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: v2Tokens.navy,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 999,
              padding: "8px 10px",
              background: "#FFFFFF",
              border: `1px solid ${v2Tokens.border}`,
              boxShadow: "0 6px 16px rgba(23,32,75,0.04)",
            }}
          >
            <span aria-hidden="true">&larr;</span>
            Back to My Pathways
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              minWidth: 0,
              textAlign: "center",
            }}
          >
            <span
              style={{
                borderRadius: 999,
                background: modeFill,
                color: modeColor,
                padding: "4px 9px",
                fontSize: 12,
                fontWeight: 650,
                lineHeight: 1.2,
              }}
            >
              {modeLabel}
            </span>
            <span
              style={{
                color: v2Tokens.slate,
                fontSize: 13,
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "min(48vw, 520px)",
              }}
            >
              {activityContext}
            </span>
          </div>

          <div
            aria-label={`${modeLabel}: ${modeSubtitle}`}
            style={{
              color: v2Tokens.slate,
              fontSize: 13,
              lineHeight: 1.35,
              fontWeight: 500,
            }}
          >
            {modeSubtitle}
          </div>
        </header>

        <main
          className="mylearna-activity-focus-main"
          style={{
            padding: "clamp(12px, 3vw, 28px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1040,
              margin: "0 auto",
              display: "grid",
              gap: 12,
            }}
          >
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: v2Tokens.page, color: v2Tokens.navy }}>
      <ProductAnalyticsProvider />
      <style jsx global>{`
        @media (max-width: 900px) {
          .mylearna-v2-grid {
            grid-template-columns: 1fr !important;
          }

          .mylearna-v2-sidebar {
            position: relative !important;
            height: auto !important;
            border-right: 0 !important;
            border-bottom: 1px solid ${v2Tokens.border} !important;
          }

          .mylearna-v2-nav {
            grid-auto-flow: column !important;
            grid-auto-columns: max-content !important;
            overflow-x: auto !important;
            padding-bottom: 4px !important;
          }

          .mylearna-v2-encouragement {
            display: none !important;
          }
        }
      `}</style>
      <div
        className="mylearna-v2-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "244px minmax(0, 1fr)",
          minHeight: "100vh",
        }}
      >
        <aside
          className="mylearna-v2-sidebar"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            borderRight: `1px solid ${v2Tokens.border}`,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "10px 0 30px rgba(23,32,75,0.035)",
            padding: 18,
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
            gap: 22,
          }}
        >
          <Link href="/my-day" style={{ display: "block", textDecoration: "none" }}>
            <Image
              src="/branding/MyLearna Logo.png"
              alt="MyLearna"
              width={1916}
              height={821}
              priority
              style={{ width: 154, height: "auto", display: "block" }}
            />
          </Link>

          <nav
            className="mylearna-v2-nav"
            aria-label="MyLearna sections"
            style={{ display: "grid", gap: 6, alignContent: "start" }}
          >
            {navItems.map((item) => {
              const active = isActive(pathname, item.matches);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  style={{
                    minHeight: 44,
                    display: "grid",
                    gridTemplateColumns: "28px minmax(0, 1fr)",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 14,
                    padding: "9px 11px",
                    textDecoration: "none",
                    background: active ? v2Tokens.lavender : "transparent",
                    color: active ? v2Tokens.purple : v2Tokens.navy,
                    fontSize: 14,
                    fontWeight: 650,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 26,
                      height: 26,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: active ? v2Tokens.purple : v2Tokens.slate,
                    }}
                  >
                    <ShellIcon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div
            className="mylearna-v2-encouragement"
            style={{
              border: `1px solid ${v2Tokens.border}`,
              borderRadius: 18,
              background: "linear-gradient(145deg, #FFFFFF 0%, #F7F4FF 100%)",
              padding: 14,
              color: v2Tokens.navy,
              display: "grid",
              gap: 6,
              boxShadow: "0 8px 24px rgba(23,32,75,0.045)",
            }}
          >
            <strong style={{ fontSize: 13, fontWeight: 650 }}>Ready for today</strong>
            <span style={{ color: v2Tokens.slate, fontSize: 13, lineHeight: 1.5 }}>
              Choose one useful step, then let the pathway guide what comes next.
            </span>
          </div>
        </aside>

        <div style={{ minWidth: 0 }}>
          <header
            style={{
              minHeight: 58,
              position: "sticky",
              top: 0,
              zIndex: 30,
              borderBottom: `1px solid ${v2Tokens.border}`,
              background: "rgba(247,249,252,0.88)",
              backdropFilter: "blur(14px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              padding: "8px clamp(16px, 3vw, 26px)",
            }}
          >
            <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <nav
                aria-label="Breadcrumb"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 5,
                  color: v2Tokens.slate,
                  fontSize: 12,
                  fontWeight: 550,
                }}
              >
                {breadcrumbs.map((crumb, index) => {
                  const current = index === breadcrumbs.length - 1;
                  const clickable = Boolean(crumb.href && !current);
                  return (
                    <React.Fragment key={`${crumb.label}-${index}`}>
                      {index > 0 ? <span aria-hidden="true" style={{ color: "#94A3B8" }}>&gt;</span> : null}
                      {clickable ? (
                        <Link
                          href={crumb.href || "#"}
                          style={{
                            color: v2Tokens.navy,
                            textDecoration: "none",
                            borderRadius: 6,
                            outlineOffset: 3,
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.color = v2Tokens.purple;
                            event.currentTarget.style.textDecoration = "underline";
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.color = v2Tokens.navy;
                            event.currentTarget.style.textDecoration = "none";
                          }}
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span aria-current={current ? "page" : undefined} style={{ color: current ? v2Tokens.slate : v2Tokens.slate }}>
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
              <div style={{ color: v2Tokens.navy, fontSize: 17, fontWeight: 650 }}>
                {title}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link
                href="/my-community"
                aria-label="Open help and community"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  border: `1px solid ${v2Tokens.border}`,
                  background: "#FFFFFF",
                  color: v2Tokens.slate,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                <ShellIcon name="help" size={18} />
              </Link>
              <CleanCommunityNotificationsMenu />
              <CleanAccountMenu email={user?.email ?? null} redirectTo="/start-free" />
            </div>
          </header>

          <main style={{ padding: "clamp(16px, 3vw, 28px)" }}>
            <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 18 }}>
              {children}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  paddingTop: 4,
                }}
              >
                <ReportProblemButton pageTitle={title} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
