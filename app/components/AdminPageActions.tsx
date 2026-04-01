"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buildClassListPath } from "@/lib/classRoutes";
import {
  buildLeadershipHeatmapPath,
  buildLeadershipHomePath,
  buildRiskRadarPath,
  buildTriagePath,
  buildWholeSchoolPath,
} from "@/lib/leadershipRoutes";
import {
  buildAdminReportingPath,
  buildAdminReportsBatchPath,
  buildAdminReportsOutputPath,
  buildAdminReportsReadinessPath,
} from "@/lib/reportRoutes";

/* ───────────────────────── TYPES ───────────────────────── */

type ActionTone = "blue" | "violet" | "green" | "orange" | "rose" | "slate";

type ActionItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  tone: ActionTone;
  matchPrefixes?: string[];
};

/* ───────────────────────── HELPERS ───────────────────────── */

function toneStyles(tone: ActionTone) {
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

function isActiveItem(pathname: string, item: ActionItem) {
  if (!pathname) return false;

  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }

  return (item.matchPrefixes || []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function currentAreaLabel(pathname: string) {
  if (pathname.startsWith("/admin/command-centre")) return "Teacher Command Centre";
  if (pathname.startsWith("/admin/leadership/heatmap")) return "Leadership Heatmap";
  if (pathname.startsWith("/admin/leadership")) return "Leadership Mission Control";
  if (pathname.startsWith("/admin/whole-school")) return "Whole-School View";
  if (pathname.startsWith("/admin/risk-radar")) return "Risk Radar";
  if (pathname.startsWith("/admin/triage")) return "Triage Queue";
  if (pathname.startsWith("/admin/reporting")) return "Reporting Centre";
  if (pathname.startsWith("/admin/reports/output")) return "Output Centre";
  if (pathname.startsWith("/admin/reports/readiness")) return "Readiness";
  if (pathname.startsWith("/admin/reports/batch")) return "Batch Reports";
  if (pathname.startsWith("/admin/students")) return "Students";
  if (pathname.startsWith("/admin/classes")) return "Classes";
  if (pathname.startsWith("/admin/evidence-entry")) return "Add Evidence";
  if (pathname.startsWith("/admin/evidence-feed")) return "Evidence Feed";
  if (pathname.startsWith("/admin/interventions")) return "Support Plans";
  if (pathname.startsWith("/admin/assessments")) return "Assessments";
  if (pathname.startsWith("/admin/enter-results")) return "Enter Results";
  return "Admin Workspace";
}

function findRecommendedAction(pathname: string) {
  if (pathname.startsWith("/admin/command-centre")) return buildLeadershipHomePath();
  if (
    pathname.startsWith("/admin/leadership") &&
    !pathname.startsWith("/admin/leadership/heatmap")
  ) {
    return buildLeadershipHeatmapPath();
  }
  if (pathname.startsWith("/admin/leadership/heatmap")) return buildAdminReportingPath();
  if (pathname.startsWith("/admin/reporting")) return buildAdminReportsReadinessPath();
  if (pathname.startsWith("/admin/reports/readiness")) return buildAdminReportsOutputPath();
  if (pathname.startsWith("/admin/reports/output")) return buildAdminReportsBatchPath();
  if (pathname.startsWith("/admin/classes")) return "/admin/students";
  if (pathname.startsWith("/admin/students")) return "/admin/evidence-entry";
  if (pathname.startsWith("/admin/evidence-entry")) return "/admin/interventions";
  if (pathname.startsWith("/admin/interventions")) return buildAdminReportingPath();
  return "/admin/command-centre";
}

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function AdminPageActions() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const contextQuery = useMemo(() => {
    const studentId = searchParams?.get("studentId") || "";
    const classId = searchParams?.get("classId") || "";

    return {
      studentId: studentId || undefined,
      classId: classId || undefined,
    };
  }, [searchParams]);

  const items = useMemo<ActionItem[]>(() => {
    return [
      {
        href: "/admin/command-centre",
        label: "Command Centre",
        shortLabel: "Command",
        description: "Return to the main teacher operating surface.",
        tone: "blue",
        matchPrefixes: ["/admin/command-centre"],
      },
      {
        href: buildLeadershipHomePath(),
        label: "Leadership",
        shortLabel: "Leadership",
        description: "Strategic school-level mission control.",
        tone: "violet",
        matchPrefixes: ["/admin/leadership"],
      },
      {
        href: buildLeadershipHeatmapPath(),
        label: "Heatmap",
        shortLabel: "Heatmap",
        description: "Jump to the diagnostic school heatmap.",
        tone: "orange",
        matchPrefixes: ["/admin/leadership/heatmap"],
      },
      {
        href: buildWholeSchoolPath(),
        label: "Whole School",
        shortLabel: "School",
        description: "Whole-school overview and trends.",
        tone: "slate",
        matchPrefixes: ["/admin/whole-school"],
      },
      {
        href: buildRiskRadarPath(),
        label: "Risk Radar",
        shortLabel: "Risk",
        description: "Scan for concern patterns and watchpoints.",
        tone: "rose",
        matchPrefixes: ["/admin/risk-radar"],
      },
      {
        href: buildTriagePath(),
        label: "Triage",
        shortLabel: "Triage",
        description: "Prioritise support and response queues.",
        tone: "orange",
        matchPrefixes: ["/admin/triage"],
      },
      {
        href: buildAdminReportingPath(contextQuery),
        label: "Reporting",
        shortLabel: "Reports",
        description: "Open the main reporting workspace.",
        tone: "green",
        matchPrefixes: ["/admin/reporting"],
      },
      {
        href: buildAdminReportsReadinessPath(contextQuery),
        label: "Readiness",
        shortLabel: "Ready",
        description: "Check report readiness and gaps.",
        tone: "green",
        matchPrefixes: ["/admin/reports/readiness"],
      },
      {
        href: buildAdminReportsOutputPath(contextQuery),
        label: "Output Centre",
        shortLabel: "Output",
        description: "Preview generated reporting outputs.",
        tone: "green",
        matchPrefixes: ["/admin/reports/output"],
      },
      {
        href: buildAdminReportsBatchPath(contextQuery),
        label: "Batch Reports",
        shortLabel: "Batch",
        description: "Run reporting workflows at scale.",
        tone: "green",
        matchPrefixes: ["/admin/reports/batch"],
      },
      {
        href: buildClassListPath(contextQuery.classId ? { classId: contextQuery.classId } : undefined),
        label: "Classes",
        shortLabel: "Classes",
        description: "Return to the canonical class workspace.",
        tone: "slate",
        matchPrefixes: ["/admin/classes"],
      },
      {
        href: "/admin/students",
        label: "Students",
        shortLabel: "Students",
        description: "Return to the canonical student workspace.",
        tone: "slate",
        matchPrefixes: ["/admin/students"],
      },
      {
        href: "/admin/evidence-entry",
        label: "Add Evidence",
        shortLabel: "Evidence",
        description: "Capture a new evidence entry.",
        tone: "blue",
        matchPrefixes: ["/admin/evidence-entry"],
      },
      {
        href: "/admin/interventions",
        label: "Support Plans",
        shortLabel: "Support",
        description: "Manage interventions and support workflows.",
        tone: "rose",
        matchPrefixes: ["/admin/interventions"],
      },
    ];
  }, [contextQuery]);

  const activeItem = useMemo(() => {
    return items.find((item) => isActiveItem(pathname || "", item)) ?? items[0];
  }, [items, pathname]);

  const recommendedItem = useMemo(() => {
    const recommendedHref = findRecommendedAction(pathname || "");
    return items.find((item) => item.href === recommendedHref) ?? null;
  }, [items, pathname]);

  return (
    <section style={S.shell}>
      <div style={S.topRow}>
        <div>
          <div style={S.eyebrow}>Admin actions</div>
          <div style={S.title}>Workspace Actions</div>
          <div style={S.subtitle}>
            Fast movement between the canonical EduDecks operating surfaces.
          </div>
        </div>

        <div style={S.currentWrap}>
          <div style={S.currentK}>Current area</div>
          <div style={S.currentV}>{currentAreaLabel(pathname || "")}</div>
        </div>
      </div>

      {recommendedItem ? (
        <div
          style={{
            ...S.recommendedPanel,
            background: toneStyles(recommendedItem.tone).soft,
            borderColor: toneStyles(recommendedItem.tone).bd,
          }}
        >
          <div
            style={{
              ...S.recommendedK,
              color: toneStyles(recommendedItem.tone).fg,
            }}
          >
            Recommended next
          </div>
          <Link
            href={recommendedItem.href}
            style={{
              ...S.recommendedLink,
              color: toneStyles(recommendedItem.tone).strong,
            }}
          >
            {recommendedItem.label}
          </Link>
          <div style={S.recommendedText}>{recommendedItem.description}</div>
        </div>
      ) : null}

      <div style={S.grid}>
        {items.map((item) => {
          const active = isActiveItem(pathname || "", item);
          const tone = toneStyles(item.tone);

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...S.card,
                background: active ? tone.bg : "#ffffff",
                borderColor: active ? tone.bd : "#e5e7eb",
                boxShadow: active ? "0 10px 24px rgba(15, 23, 42, 0.08)" : "none",
              }}
            >
              <div style={S.cardTop}>
                <div style={{ ...S.cardLabel, color: active ? tone.fg : "#0f172a" }}>
                  {item.label}
                </div>
                <span
                  style={{
                    ...S.pill,
                    background: active ? "#ffffff" : "#f8fafc",
                    borderColor: active ? tone.bd : "#e2e8f0",
                    color: active ? tone.fg : "#64748b",
                  }}
                >
                  {active ? "ACTIVE" : item.shortLabel}
                </span>
              </div>

              <div style={S.cardDesc}>{item.description}</div>
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
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },

  eyebrow: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  title: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 1000,
    color: "#0f172a",
    lineHeight: 1.2,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    lineHeight: 1.45,
    maxWidth: 720,
  },

  currentWrap: {
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    minWidth: 220,
  },

  currentK: {
    fontSize: 10,
    fontWeight: 900,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  currentV: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 1000,
    color: "#0f172a",
    lineHeight: 1.3,
  },

  recommendedPanel: {
    marginTop: 14,
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 12,
  },

  recommendedK: {
    fontSize: 10,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  recommendedLink: {
    display: "inline-block",
    marginTop: 6,
    fontSize: 14,
    fontWeight: 1000,
    textDecoration: "none",
  },

  recommendedText: {
    marginTop: 4,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.45,
  },

  grid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    textDecoration: "none",
    minWidth: 0,
    transition: "all 120ms ease",
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

  pill: {
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
    color: "#64748b",
    fontWeight: 800,
    lineHeight: 1.45,
  },
};