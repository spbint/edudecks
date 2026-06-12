"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";
import CleanCommunityNotificationsMenu from "@/app/components/clean/CleanCommunityNotificationsMenu";

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
  shadow: "0 8px 24px rgba(23, 32, 75, 0.06)",
};

const navItems = [
  { href: "/my-day", label: "My Day", icon: "D", matches: ["/my-day", "/home", "/dashboard"] },
  { href: "/my-pathways", label: "My Pathways", icon: "P", matches: ["/my-pathways"] },
  { href: "/my-assessments", label: "My Assessments", icon: "A", matches: ["/my-assessments", "/assessments"] },
  { href: "/my-capture", label: "My Capture", icon: "C", matches: ["/my-capture", "/capture"] },
  { href: "/my-portfolio", label: "My Portfolio", icon: "F", matches: ["/my-portfolio", "/portfolio"] },
  { href: "/my-data", label: "My Data", icon: "M", matches: ["/my-data", "/my-curriculum", "/curriculum"] },
  { href: "/my-reports", label: "My Reports", icon: "R", matches: ["/my-reports", "/reports"] },
  { href: "/my-settings", label: "My Settings", icon: "S", matches: ["/my-settings", "/settings"] },
] as const;

function routeTitle(pathname: string) {
  const item = navItems.find((candidate) =>
    candidate.matches.some((match) => pathname === match || pathname.startsWith(`${match}/`)),
  );
  if (pathname.startsWith("/practice/number-targeted")) return "Practise";
  if (pathname.startsWith("/assessments/number")) return "Assess";
  return item?.label ?? "MyLearna";
}

function routeCrumb(pathname: string) {
  if (pathname.startsWith("/practice/number-targeted")) {
    return "My Pathways > Practise";
  }
  if (pathname.startsWith("/assessments/number")) {
    return "My Pathways > Assess";
  }
  return `MyLearna > ${routeTitle(pathname)}`;
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
        borderRadius: 20,
        background: v2Tokens.card,
        boxShadow: v2Tokens.shadow,
        padding: "clamp(16px, 3vw, 24px)",
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
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "grid", gap: 8, maxWidth: 780 }}>
          {eyebrow ? (
            <div style={{ color: v2Tokens.purple, fontSize: 12, fontWeight: 800 }}>
              {eyebrow}
            </div>
          ) : null}
          <h1 style={{ margin: 0, color: v2Tokens.navy, fontSize: "clamp(26px, 4vw, 34px)", lineHeight: 1.15 }}>
            {title}
          </h1>
          {subtitle ? (
            <p style={{ margin: 0, color: v2Tokens.slate, lineHeight: 1.6 }}>{subtitle}</p>
          ) : null}
        </div>
        {children}
      </div>
    </V2Card>
  );
}

export default function MyLearnaAppShellV2({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthUser();
  const title = routeTitle(pathname);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: v2Tokens.page,
        color: v2Tokens.navy,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
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

          .mylearna-v2-main-header {
            position: relative !important;
          }
        }
      `}</style>
      <div
        className="mylearna-v2-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(0, 1fr)",
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
            background: "rgba(255,255,255,0.94)",
            boxShadow: "10px 0 30px rgba(23, 32, 75, 0.035)",
            padding: 20,
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
                    borderRadius: 16,
                    padding: "9px 11px",
                    textDecoration: "none",
                    background: active ? v2Tokens.lavender : "transparent",
                    color: active ? v2Tokens.purple : v2Tokens.slate,
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 9,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: active ? "#FFFFFF" : "#F4F6FB",
                      color: active ? v2Tokens.purple : v2Tokens.slate,
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    {item.icon}
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
              background: v2Tokens.lavender,
              padding: 14,
              color: v2Tokens.navy,
              display: "grid",
              gap: 6,
            }}
          >
            <strong style={{ fontSize: 14 }}>Keep it simple today.</strong>
            <span style={{ color: v2Tokens.slate, fontSize: 13, lineHeight: 1.5 }}>
              Practise teaches. Assess checks. Results guide the next step.
            </span>
          </div>
        </aside>

        <div style={{ minWidth: 0 }}>
          <header
            className="mylearna-v2-main-header"
            style={{
              minHeight: 68,
              position: "sticky",
              top: 0,
              zIndex: 30,
              borderBottom: `1px solid ${v2Tokens.border}`,
              background: "rgba(247,249,252,0.88)",
              backdropFilter: "blur(14px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "12px clamp(16px, 3vw, 28px)",
            }}
          >
            <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <div style={{ color: v2Tokens.slate, fontSize: 12, fontWeight: 700 }}>
                {routeCrumb(pathname)}
              </div>
              <div style={{ color: v2Tokens.navy, fontSize: 20, fontWeight: 900 }}>
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
                  borderRadius: 14,
                  border: `1px solid ${v2Tokens.border}`,
                  background: "#FFFFFF",
                  color: v2Tokens.slate,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  fontWeight: 900,
                }}
              >
                ?
              </Link>
              <CleanCommunityNotificationsMenu />
              <CleanAccountMenu email={user?.email ?? null} redirectTo="/start-free" />
            </div>
          </header>

          <main style={{ padding: "clamp(16px, 3vw, 28px)" }}>
            <div style={{ maxWidth: 1240, margin: "0 auto" }}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
