"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buildStudentProfilePath } from "@/lib/studentRoutes";

/* ───────────────────────── TYPES ───────────────────────── */

type NavTone = "blue" | "violet" | "green" | "orange" | "rose" | "slate";

type StudentNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  tone: NavTone;
  group: "core" | "growth" | "workflow";
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function toneStyles(tone: NavTone) {
  if (tone === "violet") {
    return {
      bg: "#f5f3ff",
      bd: "#ddd6fe",
      fg: "#5b21b6",
      soft: "#faf5ff",
      strong: "#7c3aed",
    };
  }
  if (tone === "green") {
    return {
      bg: "#ecfdf5",
      bd: "#a7f3d0",
      fg: "#166534",
      soft: "#f0fdf4",
      strong: "#16a34a",
    };
  }
  if (tone === "orange") {
    return {
      bg: "#fff7ed",
      bd: "#fed7aa",
      fg: "#9a3412",
      soft: "#fffbf5",
      strong: "#ea580c",
    };
  }
  if (tone === "rose") {
    return {
      bg: "#fff1f2",
      bd: "#fecdd3",
      fg: "#9f1239",
      soft: "#fff7f8",
      strong: "#e11d48",
    };
  }
  if (tone === "slate") {
    return {
      bg: "#f8fafc",
      bd: "#cbd5e1",
      fg: "#334155",
      soft: "#ffffff",
      strong: "#475569",
    };
  }
  return {
    bg: "#eff6ff",
    bd: "#bfdbfe",
    fg: "#1d4ed8",
    soft: "#f8fbff",
    strong: "#2563eb",
  };
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ───────────────────────── COMPONENT ───────────────────────── */

type Props = {
  studentId: string;
};

export default function StudentHubNav({ studentId }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const returnTo = searchParams?.get("returnTo") || "";
  const profileHref = buildStudentProfilePath(studentId, returnTo || null);

  const items = useMemo<StudentNavItem[]>(() => {
    const encodedReturn =
      returnTo && safe(returnTo)
        ? `?returnTo=${encodeURIComponent(returnTo)}`
        : "";

    return [
      {
        href: profileHref,
        label: "Player Profile",
        shortLabel: "Profile",
        description: "Identity, overview, readiness, and current development picture.",
        tone: "blue",
        group: "core",
      },
      {
        href: `/admin/students/${studentId}/timeline${encodedReturn}`,
        label: "Development Timeline",
        shortLabel: "Timeline",
        description: "Chronological story of evidence and intervention activity.",
        tone: "orange",
        group: "growth",
      },
      {
        href: `/admin/evidence-feed?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
        label: "Evidence Feed",
        shortLabel: "Evidence",
        description: "Evidence history and visibility flow for this student.",
        tone: "green",
        group: "growth",
      },
      {
        href: `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
        label: "Support Workflow",
        shortLabel: "Support",
        description: "Intervention queue, review pressure, and support planning.",
        tone: "rose",
        group: "workflow",
      },
      {
        href: `/admin/reporting?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
        label: "Reporting Lens",
        shortLabel: "Reports",
        description: "Conference and reporting context from the student perspective.",
        tone: "violet",
        group: "workflow",
      },
    ];
  }, [studentId, profileHref, returnTo]);

  const activeItem = useMemo(() => {
    return items.find((item) => isActivePath(pathname || "", item.href)) ?? items[0];
  }, [items, pathname]);

  const recommendedItem = useMemo(() => {
    if (pathname.startsWith(`/admin/students/${studentId}/timeline`)) {
      return items.find((x) => x.shortLabel === "Evidence") ?? null;
    }
    if (pathname.startsWith(`/admin/evidence-feed`)) {
      return items.find((x) => x.shortLabel === "Support") ?? null;
    }
    if (pathname.startsWith(`/admin/interventions`)) {
      return items.find((x) => x.shortLabel === "Reports") ?? null;
    }
    return items.find((x) => x.shortLabel === "Timeline") ?? null;
  }, [items, pathname, studentId]);

  return (
    <section style={S.shell}>
      <div style={S.topRow}>
        <div style={S.titleWrap}>
          <div style={S.eyebrow}>Student hub</div>
          <div style={S.title}>Student Navigation</div>
          <div style={S.subtitle}>
            Move through the student suite like one connected profile system.
          </div>
        </div>

        <div style={S.topActions}>
          <button
            type="button"
            style={S.smallBtn}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Compact view" : "Expanded view"}
          </button>
        </div>
      </div>

      <div
        style={{
          ...S.activePanel,
          background: toneStyles(activeItem.tone).bg,
          borderColor: toneStyles(activeItem.tone).bd,
        }}
      >
        <div style={{ ...S.activeTitle, color: toneStyles(activeItem.tone).fg }}>
          Active student surface: {activeItem.label}
        </div>
        <div style={S.activeText}>{activeItem.description}</div>

        {recommendedItem ? (
          <div style={{ ...S.row, marginTop: 10 }}>
            <span style={S.metaPill}>Recommended next</span>
            <Link
              href={recommendedItem.href}
              style={{
                ...S.recommendedLink,
                color: toneStyles(recommendedItem.tone).strong,
              }}
            >
              {recommendedItem.label}
            </Link>
          </div>
        ) : null}
      </div>

      <div style={expanded ? S.gridExpanded : S.gridCompact}>
        {items.map((item) => {
          const active = isActivePath(pathname || "", item.href);
          const tone = toneStyles(item.tone);

          if (!expanded && !active && item.href !== recommendedItem?.href) {
            return null;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...S.navCard,
                background: active ? tone.bg : "#ffffff",
                borderColor: active ? tone.bd : "#1f2937",
                boxShadow: active ? "0 10px 24px rgba(15, 23, 42, 0.14)" : "none",
              }}
            >
              <div style={S.cardTop}>
                <div style={{ ...S.cardLabel, color: active ? tone.fg : "#0f172a" }}>
                  {item.label}
                </div>
                <span
                  style={{
                    ...S.statePill,
                    background: active ? "#ffffff" : "#f8fafc",
                    borderColor: active ? tone.bd : "#e2e8f0",
                    color: active ? tone.fg : "#64748b",
                  }}
                >
                  {active ? "ACTIVE" : item.shortLabel}
                </span>
              </div>

              <div style={S.cardDesc}>{item.description}</div>

              <div style={S.metaRow}>
                <span style={S.groupPill}>{item.group.toUpperCase()}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  shell: {
    marginBottom: 18,
    border: "1px solid #1f2937",
    borderRadius: 18,
    background: "#111827",
    padding: 16,
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },

  titleWrap: {
    minWidth: 260,
  },

  eyebrow: {
    fontSize: 11,
    color: "#93c5fd",
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  title: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 1000,
    color: "#f8fafc",
    lineHeight: 1.2,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 800,
    lineHeight: 1.45,
    maxWidth: 720,
  },

  topActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },

  smallBtn: {
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
    borderRadius: 10,
    padding: "8px 10px",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
  },

  activePanel: {
    marginTop: 14,
    border: "1px solid #334155",
    borderRadius: 16,
    padding: 12,
  },

  activeTitle: {
    fontSize: 14,
    fontWeight: 1000,
  },

  activeText: {
    marginTop: 6,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.45,
  },

  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  metaPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 8px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#475569",
    fontSize: 11,
    fontWeight: 900,
  },

  recommendedLink: {
    fontSize: 12,
    fontWeight: 1000,
    textDecoration: "none",
  },

  gridCompact: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  gridExpanded: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },

  navCard: {
    border: "1px solid #1f2937",
    borderRadius: 16,
    padding: 14,
    textDecoration: "none",
    minWidth: 0,
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  cardLabel: {
    fontSize: 14,
    fontWeight: 1000,
    lineHeight: 1.2,
  },

  statePill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    fontSize: 10,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },

  cardDesc: {
    marginTop: 8,
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 800,
    lineHeight: 1.45,
  },

  metaRow: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  groupPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#cbd5e1",
    fontSize: 10,
    fontWeight: 1000,
  },
};