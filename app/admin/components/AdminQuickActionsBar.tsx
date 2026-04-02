"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

/* ───────────────────────── TYPES ───────────────────────── */

type QuickActionTone = "primary" | "neutral" | "family" | "school";

type QuickAction = {
  label: string;
  href: string;
  keywords: string[];
  tone?: QuickActionTone;
};

type AdminQuickActionsBarProps = {
  studentId?: string;
  classId?: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(value: unknown) {
  return String(value ?? "").trim();
}

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function AdminQuickActionsBar({
  studentId,
  classId,
}: AdminQuickActionsBarProps) {
  const [query, setQuery] = useState("");

  const quickActions = useMemo<QuickAction[]>(() => {
    const actions: QuickAction[] = [
      {
        label: "Admin Home",
        href: "/admin",
        keywords: ["home", "admin", "dashboard", "command"],
        tone: "primary",
      },
      {
        label: "Command Centre",
        href: "/admin/command-centre",
        keywords: ["command", "centre", "center", "ops", "operations"],
        tone: "school",
      },
      {
        label: "Classes",
        href: "/admin/classes",
        keywords: ["class", "classes", "groups", "roster"],
        tone: "neutral",
      },
      {
        label: "Leadership",
        href: "/admin/leadership",
        keywords: ["leadership", "exec", "overview", "school"],
        tone: "school",
      },
      {
        label: "Evidence Entry",
        href: "/admin/evidence-entry",
        keywords: ["evidence", "capture", "entry", "record"],
        tone: "primary",
      },
      {
        label: "Evidence Feed",
        href: "/admin/evidence-feed",
        keywords: ["evidence", "feed", "stream", "entries"],
        tone: "neutral",
      },
      {
        label: "Reports",
        href: "/reports",
        keywords: ["report", "reports", "output", "authority"],
        tone: "neutral",
      },
      {
        label: "Portfolio",
        href: "/portfolio",
        keywords: ["portfolio", "showcase", "evidence"],
        tone: "neutral",
      },
      {
        label: "Capture",
        href: "/capture",
        keywords: ["capture", "record", "moment"],
        tone: "primary",
      },
      {
        label: "Planner",
        href: "/planner",
        keywords: ["planner", "plan", "schedule", "day"],
        tone: "family",
      },
      {
        label: "Calendar",
        href: "/calendar",
        keywords: ["calendar", "schedule", "dates"],
        tone: "family",
      },
      {
        label: "Family Dashboard",
        href: "/family",
        keywords: ["family", "parent", "home", "dashboard"],
        tone: "family",
      },
    ];

    if (classId) {
      actions.unshift({
        label: "Open Class Hub",
        href: `/admin/classes/${encodeURIComponent(classId)}`,
        keywords: ["class hub", "class", "hub", "group"],
        tone: "school",
      });
    }

    if (studentId) {
      actions.unshift(
        {
          label: "Student Profile",
          href: `/admin/students/${encodeURIComponent(studentId)}`,
          keywords: ["student", "profile", "learner"],
          tone: "primary",
        },
        {
          label: "Student Portfolio",
          href: `/admin/students/${encodeURIComponent(studentId)}/portfolio`,
          keywords: ["student portfolio", "portfolio", "learner work"],
          tone: "neutral",
        }
      );
    }

    return actions;
  }, [studentId, classId]);

  const filtered = useMemo(() => {
    const q = safe(query).toLowerCase();
    if (!q) return quickActions.slice(0, 8);

    return quickActions
      .filter((item) => {
        const haystack = [item.label, item.href, ...item.keywords]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 10);
  }, [quickActions, query]);

  return (
    <section style={S.shell}>
      <div style={S.topRow}>
        <div style={S.searchWrap}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admin actions, pages, or workflows..."
            style={S.input}
          />
        </div>

        <div style={S.chipRow}>
          {quickActions.slice(0, 6).map((action) => (
            <Link
              key={`${action.label}-${action.href}`}
              href={action.href}
              style={S.chip(action.tone || "neutral")}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {safe(query) ? (
        <div style={S.resultsWrap}>
          <div style={S.resultsTitle}>Quick results</div>

          <div style={S.resultsList}>
            {filtered.map((item) => (
              <Link
                key={`${item.label}-${item.href}-result`}
                href={item.href}
                style={S.resultItem}
              >
                <div style={S.resultLabel}>{item.label}</div>
                <div style={S.resultHref}>{item.href}</div>
              </Link>
            ))}

            {filtered.length === 0 ? (
              <div style={S.empty}>No matching admin actions found.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: {
    display: "grid",
    gap: 12,
    marginBottom: 16,
  } as React.CSSProperties,

  topRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  searchWrap: {
    flex: 1,
    minWidth: 280,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 800,
    fontSize: 14,
    outline: "none",
  } as React.CSSProperties,

  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  } as React.CSSProperties,

  chip: (tone: QuickActionTone): React.CSSProperties => {
    const styles = {
      primary: {
        background: "#2563eb",
        border: "#2563eb",
        color: "#ffffff",
      },
      neutral: {
        background: "#ffffff",
        border: "#cbd5e1",
        color: "#0f172a",
      },
      family: {
        background: "#16a34a",
        border: "#16a34a",
        color: "#ffffff",
      },
      school: {
        background: "#1e293b",
        border: "#334155",
        color: "#ffffff",
      },
    }[tone];

    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "9px 11px",
      borderRadius: 10,
      background: styles.background,
      border: `1px solid ${styles.border}`,
      color: styles.color,
      fontWeight: 900,
      textDecoration: "none",
      fontSize: 13,
      whiteSpace: "nowrap",
    };
  },

  resultsWrap: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  } as React.CSSProperties,

  resultsTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  } as React.CSSProperties,

  resultsList: {
    display: "grid",
    gap: 8,
  } as React.CSSProperties,

  resultItem: {
    display: "block",
    textDecoration: "none",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "10px 12px",
  } as React.CSSProperties,

  resultLabel: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
  } as React.CSSProperties,

  resultHref: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  } as React.CSSProperties,

  empty: {
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    padding: 14,
    color: "#64748b",
    background: "#f8fafc",
    fontWeight: 700,
  } as React.CSSProperties,
};