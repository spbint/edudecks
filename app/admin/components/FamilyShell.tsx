"use client";

import React from "react";
import Link from "next/link";

type ChildOption = {
  id: string;
  label: string;
};

type StatItem = {
  label: string;
  value: React.ReactNode;
  help?: string;
};

type FamilyShellProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;

  selectedChildId?: string;
  onChildChange?: (value: string) => void;
  childrenOptions?: ChildOption[];

  stats?: StatItem[];

  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;

  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
};

export default function FamilyShell({
  title = "Family View",
  subtitle = "Family-friendly workspace for reporting, portfolio, planning, and evidence review.",
  eyebrow = "Parent / Family Dashboard",

  selectedChildId,
  onChildChange,
  childrenOptions = [],

  stats = [],

  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,

  actions,
  children,
  maxWidth = 1480,
}: FamilyShellProps) {
  const showChildSwitcher =
    typeof selectedChildId === "string" &&
    typeof onChildChange === "function" &&
    Array.isArray(childrenOptions) &&
    childrenOptions.length > 0;

  const showPrimary = !!primaryHref && !!primaryLabel;
  const showSecondary = !!secondaryHref && !!secondaryLabel;
  const showTopControls = showChildSwitcher || showPrimary || showSecondary || !!actions;

  return (
    <div
      style={{
        ...S.shell,
        maxWidth,
      }}
    >
      <section style={S.hero}>
        <div style={S.heroTop}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={S.subtle}>{eyebrow}</div>
            <h1 style={S.h1}>{title}</h1>
            <div style={S.sub}>{subtitle}</div>
          </div>
        </div>

        {showTopControls ? (
          <div style={S.controls}>
            {showChildSwitcher ? (
              <select
                style={S.select}
                value={selectedChildId}
                onChange={(e) => onChildChange?.(e.target.value)}
              >
                {childrenOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            ) : null}

            {showPrimary ? (
              <Link href={primaryHref!} style={S.btn}>
                {primaryLabel}
              </Link>
            ) : null}

            {showSecondary ? (
              <Link href={secondaryHref!} style={S.btnGhost}>
                {secondaryLabel}
              </Link>
            ) : null}

            {actions ? <div style={S.actionsWrap}>{actions}</div> : null}
          </div>
        ) : null}

        {stats.length ? (
          <div style={S.statGrid}>
            {stats.map((s) => (
              <div key={String(s.label)} style={S.statCard}>
                <div style={S.statLabel}>{s.label}</div>
                <div style={S.statValue}>{s.value}</div>
                {s.help ? <div style={S.statHelp}>{s.help}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section style={S.content}>{children}</section>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  shell: {
    width: "100%",
    margin: "0 auto",
    color: "#0f172a",
  },

  hero: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
  },

  heroTop: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  subtle: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#64748b",
  },

  h1: {
    margin: "8px 0 0 0",
    fontSize: 34,
    lineHeight: 1.05,
    fontWeight: 1000,
    letterSpacing: -0.8,
    color: "#0f172a",
  },

  sub: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#475569",
    fontWeight: 700,
    maxWidth: 960,
  },

  controls: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 18,
  },

  select: {
    minWidth: 240,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
  },

  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#2563eb",
    border: "1px solid #2563eb",
    color: "#ffffff",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
  },

  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
  },

  actionsWrap: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
    marginTop: 18,
  },

  statCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 14,
    minWidth: 0,
  },

  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  statValue: {
    fontSize: 28,
    fontWeight: 950,
    marginTop: 6,
    color: "#0f172a",
    lineHeight: 1.05,
    wordBreak: "break-word",
  },

  statHelp: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.45,
  },

  content: {
    marginTop: 16,
  },
};