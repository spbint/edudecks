"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FamilyWorkflowStrip from "@/app/components/FamilyWorkflowStrip";
import SignOutButton from "@/app/components/SignOutButton";
import useIsMobile from "@/app/components/useIsMobile";

type FamilyTopNavShellProps = {
  title?: string;
  subtitle?: string;
  heroTitle?: string;
  heroText?: string;
  heroAsideTitle?: string;
  heroAsideText?: string;
  workflowCurrentHref?: string;
  workflowHelperText?: string;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function isActive(pathname: string, href: string) {
  if (href === "/family") return pathname === "/family";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navBtn(active: boolean): React.CSSProperties {
  return {
    border: active ? "1px solid #2563eb" : "1px solid #d1d5db",
    background: active ? "#2563eb" : "#fff",
    color: active ? "#fff" : "#111827",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
    boxShadow: active ? "0 10px 24px rgba(37,99,235,0.18)" : "none",
  };
}

function utilBtn(primary = false): React.CSSProperties {
  return {
    border: `1px solid ${primary ? "#2563eb" : "#d1d5db"}`,
    background: primary ? "#2563eb" : "#fff",
    color: primary ? "#fff" : "#111827",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
    boxShadow: primary ? "0 10px 24px rgba(37,99,235,0.18)" : "none",
  };
}

function sectionLabel(): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
  };
}

const PRIMARY_NAV: NavItem[] = [{ href: "/family", label: "Home" }];

const SECTIONS: NavSection[] = [
  {
    title: "Planning",
    items: [
      { href: "/goals", label: "Goals" },
      { href: "/planner", label: "Planner" },
      { href: "/calendar", label: "Calendar" },
    ],
  },
  {
    title: "Workflow",
    items: [
      { href: "/capture", label: "Capture" },
      { href: "/reports", label: "Reports" },
      { href: "/portfolio", label: "Portfolio" },
    ],
  },
  {
    title: "More",
    items: [
      { href: "/reports/library", label: "Report Library" },
      { href: "/reports/output", label: "Output" },
    ],
  },
  {
    title: "Authority",
    items: [
      { href: "/authority", label: "Authority Hub" },
      { href: "/authority/readiness", label: "Readiness" },
      { href: "/authority/builder", label: "Pack Builder" },
      { href: "/authority/export", label: "Pack Export" },
    ],
  },
  {
    title: "System",
    items: [{ href: "/settings", label: "Settings" }],
  },
];

export default function FamilyTopNavShell({
  title = "EduDecks Family",
  subtitle = "Homeschool-first learning flow",
  heroTitle = "Build confidence from everyday learning",
  heroText = "Capture learning simply, stay aware of coverage, and move from evidence to reporting without the school-dashboard feel.",
  heroAsideTitle = "Family Snapshot",
  heroAsideText = "A calm, clear command view for family learning.",
  workflowCurrentHref,
  workflowHelperText,
  children,
}: FamilyTopNavShellProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)",
        color: "#0f172a",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e5e7eb",
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: isMobile ? "14px 16px" : "16px 20px",
            display: "grid",
            gap: isMobile ? 12 : 14,
          }}
        >
          {isMobile ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: "#64748b",
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#475569",
                    marginTop: 4,
                    fontWeight: 700,
                  }}
                >
                  {subtitle}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SignOutButton style={utilBtn(false)} />
                <details
                  style={{
                    position: "relative",
                  }}
                >
                  <summary
                    style={{
                      ...utilBtn(false),
                      cursor: "pointer",
                      listStyle: "none",
                    }}
                  >
                    Menu
                  </summary>
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 10px)",
                    width: 280,
                    maxWidth: "calc(100vw - 32px)",
                    border: "1px solid #e5e7eb",
                    borderRadius: 18,
                    background: "#ffffff",
                    boxShadow: "0 20px 50px rgba(15,23,42,0.12)",
                    padding: 14,
                    display: "grid",
                    gap: 12,
                    zIndex: 30,
                  }}
                >
                  <SignOutButton style={{ ...utilBtn(false), width: "100%", justifyContent: "center" }} />
                  <Link href="/family" style={navBtn(isActive(pathname, "/family"))}>
                    Home
                  </Link>
                  {SECTIONS.map((section) => (
                    <div key={section.title}>
                      <div style={sectionLabel()}>{section.title}</div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            style={navBtn(isActive(pathname, item.href))}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                </details>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      color: "#64748b",
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#475569",
                      marginTop: 4,
                    }}
                  >
                    {subtitle}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <Link href="/capture" style={utilBtn(true)}>
                    Quick Capture
                  </Link>
                  <Link href="/calendar" style={utilBtn(false)}>
                    Calendar
                  </Link>
                  <Link href="/planner" style={utilBtn(false)}>
                    Planner
                  </Link>
                  <Link href="/reports" style={utilBtn(false)}>
                    Build Report
                  </Link>
                  <Link href="/reports/library" style={utilBtn(false)}>
                    Report Library
                  </Link>
                  <SignOutButton style={utilBtn(false)} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {PRIMARY_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={navBtn(isActive(pathname, item.href))}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: isMobile ? 16 : 20,
        }}
      >
        <section style={{ marginBottom: 18 }}>
          <FamilyWorkflowStrip
            currentHref={workflowCurrentHref}
            helperText={workflowHelperText}
          />
        </section>

        {!isMobile ? (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(280px, 0.7fr)",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                border: "1px solid #dbeafe",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.96) 100%)",
                borderRadius: 24,
                padding: 24,
                boxShadow: "0 20px 50px rgba(15,23,42,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 10,
                }}
              >
                Family workspace
              </div>
              <div
                style={{
                  fontSize: 34,
                  lineHeight: 1.08,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: 12,
                }}
              >
                {heroTitle}
              </div>
              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "#334155",
                  maxWidth: 820,
                }}
              >
                {heroText}
              </div>
            </div>

            <aside
              style={{
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                borderRadius: 24,
                padding: 20,
                boxShadow: "0 20px 50px rgba(15,23,42,0.05)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 10,
                }}
              >
                {heroAsideTitle}
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#475569",
                }}
              >
                {heroAsideText}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <Link href="/goals" style={utilBtn(false)}>
                  Goals
                </Link>
                <Link href="/planner" style={utilBtn(false)}>
                  Planner
                </Link>
                <Link href="/calendar" style={utilBtn(false)}>
                  Calendar
                </Link>
                <Link href="/portfolio" style={utilBtn(false)}>
                  Portfolio
                </Link>
              </div>
            </aside>
          </section>
        ) : null}

        {children}
      </main>
    </div>
  );
}
