"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ================= TYPES ================= */

type FamilyTopNavShellProps = {
  title?: string;
  subtitle?: string;
  heroTitle?: string;
  heroText?: string;
  heroAsideTitle?: string;
  heroAsideText?: string;
  children: React.ReactNode;
};

/* ================= HELPERS ================= */

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

/* ================= COMPONENT ================= */

export default function FamilyTopNavShell({
  title = "EduDecks Family",
  subtitle = "Homeschool-first learning flow",
  heroTitle = "Build confidence from everyday learning",
  heroText = "Capture learning simply, stay aware of coverage, and move from evidence to reporting without the school-dashboard feel.",
  heroAsideTitle = "Family Snapshot",
  heroAsideText = "A calm, clear command view for family learning.",
  children,
}: FamilyTopNavShellProps) {
  const pathname = usePathname();

  const primary = [{ href: "/family", label: "Home" }];

  const workflow = [
    { href: "/capture", label: "Capture" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/reports", label: "Reports" },
    { href: "/reports/library", label: "Library" },
    { href: "/reports/output", label: "Output" },
    { href: "/authority/readiness", label: "Readiness ⭐" },
    { href: "/authority/builder", label: "Pack Builder 🧱" },
    { href: "/authority/export", label: "Pack Export 📦" },
  ];

  const planning = [
    { href: "/goals", label: "Goals" },
    { href: "/planner", label: "Planner" },
  ];

  const system = [
    { href: "/authority", label: "Authority Router" },
    { href: "/settings", label: "Settings" },
  ];

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
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{subtitle}</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/capture" style={utilBtn()}>
                Quick Capture
              </Link>
              <Link href="/reports" style={utilBtn(true)}>
                Build Report
              </Link>
              <Link href="/authority/builder" style={utilBtn()}>
                Authority Pack Builder
              </Link>
              <Link href="/authority/export" style={utilBtn()}>
                Authority Pack Export
              </Link>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
              gap: 14,
            }}
          >
            {[["Home", primary], ["Workflow", workflow], ["Planning", planning], ["System", system]].map(
              ([title, items]) => (
                <div key={title as string}>
                  <div style={sectionLabel()}>{title}</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {(items as { href: string; label: string }[]).map((item) => (
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
              )
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: 24 }}>
        <section
          style={{
            marginBottom: 20,
            padding: 24,
            borderRadius: 20,
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, color: "#475569" }}>
            Homeschool Command Layer
          </div>

          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>
            {heroTitle}
          </div>

          <div style={{ marginTop: 6, color: "#334155" }}>{heroText}</div>

          {heroAsideTitle || heroAsideText ? (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 16,
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(191,219,254,0.9)",
                maxWidth: 460,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 6,
                }}
              >
                {heroAsideTitle}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#475569",
                  lineHeight: 1.55,
                }}
              >
                {heroAsideText}
              </div>
            </div>
          ) : null}
        </section>

        {children}
      </main>
    </div>
  );
}