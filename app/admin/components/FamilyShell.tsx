"use client";

import React from "react";

type FamilyShellProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
};

export default function FamilyShell({
  title = "Family View",
  subtitle = "Family-friendly workspace for reporting, portfolio, planning, and evidence review.",
  eyebrow = "Family",
  actions,
  children,
  maxWidth = 1480,
}: FamilyShellProps) {
  return (
    <main
      style={{
        ...S.main,
        maxWidth,
      }}
    >
      <section style={S.hero}>
        <div style={S.heroTop}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={S.eyebrow}>{eyebrow}</div>
            <h1 style={S.h1}>{title}</h1>
            <div style={S.subtitle}>{subtitle}</div>
          </div>

          {actions ? <div style={S.actions}>{actions}</div> : null}
        </div>
      </section>

      <section style={S.content}>{children}</section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: {
    flex: 1,
    width: "100%",
    margin: "0 auto",
    padding: 24,
    color: "#0f172a",
  },

  hero: {
    background:
      "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(59,130,246,0.08) 100%)",
    border: "1px solid #dbeafe",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.05)",
  },

  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#2563eb",
  },

  h1: {
    margin: "8px 0 0 0",
    fontSize: 36,
    lineHeight: 1.05,
    fontWeight: 950,
    color: "#0f172a",
  },

  subtitle: {
    marginTop: 10,
    maxWidth: 980,
    color: "#475569",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.6,
  },

  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },

  content: {
    marginTop: 16,
    display: "grid",
    gap: 16,
  },
};