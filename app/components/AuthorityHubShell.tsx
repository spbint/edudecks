"use client";

import React from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";

export type AuthorityHubMetric = {
  title: string;
  value: string;
  text: string;
  bg: string;
  bd: string;
  fg: string;
};

export type AuthorityHubCheck = {
  title: string;
  ok: boolean;
  detail: string;
};

export type AuthorityHubAction = {
  title: string;
  text: string;
  href: string;
  cta: string;
  tone: "blue" | "orange" | "green" | "rose";
};

export type AuthorityHubMarketConfig = {
  marketKey: string;
  marketLabel: string;
  subtitle: string;
  heroTitle: string;
  heroText: string;
  heroAsideTitle: string;
  heroAsideText: string;
  primaryColor: string;
  introTitle: string;
  introText: string;
  fastLanes?: Array<{
    href: string;
    label: string;
    primary?: boolean;
  }>;
};

type AuthorityHubShellProps = {
  config: AuthorityHubMarketConfig;
  studentName?: string;
  controls?: React.ReactNode;
  metrics: AuthorityHubMetric[];
  checks: AuthorityHubCheck[];
  actions: AuthorityHubAction[];
  strongestAreas?: string[];
  missingAreas?: string[];
  currentDraftCard?: React.ReactNode;
  bottomNote?: string;
};

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  };
}

function buttonStyle(primary = false, accent = "#2563eb"): React.CSSProperties {
  return {
    border: `1px solid ${primary ? accent : "#d1d5db"}`,
    background: primary ? accent : "#ffffff",
    color: primary ? "#ffffff" : "#111827",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  };
}

function pill(bg: string, color: string): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 800,
    borderRadius: 999,
    padding: "6px 10px",
    background: bg,
    color,
    whiteSpace: "nowrap",
  };
}

function toneStyles(tone: AuthorityHubAction["tone"]) {
  if (tone === "green") return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  if (tone === "orange") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  if (tone === "rose") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
}

export default function AuthorityHubShell({
  config,
  studentName,
  controls,
  metrics,
  checks,
  actions,
  strongestAreas = [],
  missingAreas = [],
  currentDraftCard,
  bottomNote,
}: AuthorityHubShellProps) {
  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle={config.subtitle}
      heroTitle={config.heroTitle}
      heroText={config.heroText}
      heroAsideTitle={config.heroAsideTitle}
      heroAsideText={config.heroAsideText}
    >
      <section
        style={{
          ...cardStyle(),
          marginBottom: 18,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 6,
            }}
          >
            {config.marketLabel}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 6,
            }}
          >
            {studentName ? `${studentName} Authority Hub` : config.marketLabel}
          </div>
          <div style={{ fontSize: 14, color: "#475569", maxWidth: 780 }}>
            {config.introText}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {controls}
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 18,
        }}
      >
        {metrics.map((card) => (
          <div
            key={card.title}
            style={{
              background: card.bg,
              border: `1px solid ${card.bd}`,
              borderRadius: 18,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: card.fg,
                marginBottom: 10,
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.45 }}>
              {card.text}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
          gap: 18,
          marginBottom: 18,
        }}
      >
        <section style={cardStyle()}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Compliance checks
          </div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>
            Use these checks to judge whether the current record feels externally reviewable.
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {checks.map((check) => (
              <div
                key={check.title}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  background: "#f8fafc",
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    {check.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                    {check.detail}
                  </div>
                </div>

                <div
                  style={pill(
                    check.ok ? "#dcfce7" : "#ffe4e6",
                    check.ok ? "#166534" : "#be123c"
                  )}
                >
                  {check.ok ? "Ready" : "Missing"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={cardStyle()}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Current pack status
          </div>

          {currentDraftCard ? (
            currentDraftCard
          ) : (
            <div
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: 14,
                padding: 16,
                background: "#f8fafc",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              No current authority draft details were supplied.
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              Strongest areas
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {strongestAreas.length ? (
                strongestAreas.map((area) => (
                  <div key={area} style={pill("#ecfdf5", "#166534")}>
                    {area}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 13, color: "#64748b" }}>No strong areas yet.</div>
              )}
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#0f172a",
                marginTop: 14,
                marginBottom: 8,
              }}
            >
              Missing areas
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {missingAreas.length ? (
                missingAreas.map((area) => (
                  <div key={area} style={pill("#fff1f2", "#be123c")}>
                    {area}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  No major gaps currently visible.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section style={{ ...cardStyle(), marginBottom: 18 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          Next best actions
        </div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>
          These actions help move the family record toward a stronger formal pack.
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {actions.map((action) => {
            const tone = toneStyles(action.tone);
            return (
              <div
                key={action.title}
                style={{
                  background: tone.bg,
                  border: `1px solid ${tone.bd}`,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: "#0f172a",
                    marginBottom: 6,
                  }}
                >
                  {action.title}
                </div>
                <div style={{ fontSize: 14, color: tone.fg, lineHeight: 1.6, marginBottom: 10 }}>
                  {action.text}
                </div>
                <Link href={action.href} style={buttonStyle(true, config.primaryColor)}>
                  {action.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section style={cardStyle()}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          Fast lanes
        </div>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 14 }}>
          Jump straight into the part of the product that improves authority readiness fastest.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(config.fastLanes || [
            { href: "/capture", label: "Capture" },
            { href: "/portfolio", label: "Portfolio" },
            { href: "/reports", label: "Reports", primary: true },
            { href: "/reports/library", label: "Report Library" },
            { href: "/family", label: "Family Dashboard" },
          ]).map((lane) => (
            <Link
              key={lane.href + lane.label}
              href={lane.href}
              style={buttonStyle(!!lane.primary, config.primaryColor)}
            >
              {lane.label}
            </Link>
          ))}
        </div>

        {bottomNote ? (
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 14, lineHeight: 1.6 }}>
            {bottomNote}
          </div>
        ) : null}
      </section>
    </FamilyTopNavShell>
  );
}