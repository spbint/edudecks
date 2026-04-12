"use client";

// Dormant B2B component: preserved for admin/school workflows, not for the live family-first product.
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildClassListPath } from "@/lib/classRoutes";
import {
  buildLeadershipHeatmapPath,
  buildLeadershipHomePath,
} from "@/lib/leadershipRoutes";
import { buildAdminReportingPath } from "@/lib/reportRoutes";

/* ───────────────────────── TYPES ───────────────────────── */

type NavTone = "blue" | "violet" | "green" | "orange" | "rose" | "slate";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  description?: string;
  tone?: NavTone;
};

type NavSection = {
  key: string;
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

/* ───────────────────────── DATA ───────────────────────── */

const NAV_SECTIONS: NavSection[] = [
  {
    key: "flagship",
    label: "Flagship Surfaces",
    defaultOpen: true,
    items: [
      {
        href: "/admin/command-centre",
        label: "Teacher Command Centre",
        shortLabel: "Command",
        description: "Teacher mission control",
        tone: "blue",
      },
      {
        href: buildLeadershipHomePath(),
        label: "Leadership Mission Control",
        shortLabel: "Leadership",
        description: "Strategic school overview",
        tone: "violet",
      },
      {
        href: buildLeadershipHeatmapPath(),
        label: "Leadership Heatmap",
        shortLabel: "Heatmap",
        description: "Diagnostic radar",
        tone: "orange",
      },
      {
        href: buildAdminReportingPath(),
        label: "Reporting Centre",
        shortLabel: "Reporting",
        description: "Readiness and export",
        tone: "green",
      },
      {
        href: "/admin/parent-dashboard",
        label: "Parent Command Dashboard",
        shortLabel: "Parent",
        description: "Family-facing surface",
        tone: "rose",
      },
    ],
  },
  {
    key: "teaching",
    label: "Teaching Workflow",
    defaultOpen: true,
    items: [
      { href: buildClassListPath(), label: "Classes" },
      { href: "/admin/students", label: "Students" },
      { href: "/admin/evidence-entry", label: "Add Evidence" },
      { href: "/admin/interventions", label: "Support Plans" },
    ],
  },
  {
    key: "assessment",
    label: "Assessment & Results",
    defaultOpen: false,
    items: [
      { href: "/admin/assessments", label: "Assessments" },
      { href: "/admin/enter-results", label: "Enter Results" },
    ],
  },
  {
    key: "admin",
    label: "Admin Setup",
    defaultOpen: false,
    items: [
      { href: "/admin/class-entry", label: "Create Class" },
      { href: "/admin/student-entry", label: "Add Student" },
      { href: "/admin/import", label: "Import Data" },
      { href: "/admin/access", label: "User Access" },
    ],
  },
  {
    key: "system",
    label: "System",
    defaultOpen: false,
    items: [
      { href: "/admin/sis", label: "SIS Integrations" },
      { href: "/admin/templates", label: "Templates" },
    ],
  },
];

/* ───────────────────────── HELPERS ───────────────────────── */

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
  if (!pathname || !href) return false;

  if (
    href === buildLeadershipHomePath() &&
    pathname.startsWith("/admin/leadership/heatmap")
  ) {
    return false;
  }

  if (href === buildClassListPath()) {
    return pathname === href || pathname.startsWith("/admin/classes/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentSurfaceLabel(pathname: string) {
  if (pathname.startsWith("/admin/command-centre")) return "Teacher Command Centre";
  if (pathname.startsWith("/admin/leadership/heatmap")) return "Leadership Heatmap";
  if (pathname.startsWith("/admin/leadership")) return "Leadership Mission Control";
  if (pathname.startsWith("/admin/reporting")) return "Reporting Centre";
  if (pathname.startsWith("/admin/reports")) return "Reporting Centre";
  if (pathname.startsWith("/admin/parent-dashboard")) return "Parent Command Dashboard";
  if (pathname.startsWith("/admin/evidence-entry")) return "Add Evidence";
  if (pathname.startsWith("/admin/interventions")) return "Support Plans";
  if (pathname.startsWith("/admin/students")) return "Students";
  if (pathname.startsWith("/admin/classes")) return "Classes";
  if (pathname.startsWith("/admin/assessments")) return "Assessments";
  if (pathname.startsWith("/admin/enter-results")) return "Enter Results";
  if (pathname.startsWith("/admin/whole-school")) return "Whole-School View";
  if (pathname.startsWith("/admin/risk-radar")) return "Risk Radar";
  if (pathname.startsWith("/admin/triage")) return "Triage";
  return "Admin";
}

function findRecommendedSurface(pathname: string) {
  if (pathname.startsWith("/admin/command-centre")) {
    return buildLeadershipHomePath();
  }

  if (
    pathname.startsWith("/admin/leadership") &&
    !pathname.startsWith("/admin/leadership/heatmap")
  ) {
    return buildLeadershipHeatmapPath();
  }

  if (pathname.startsWith("/admin/leadership/heatmap")) {
    return buildAdminReportingPath();
  }

  if (pathname.startsWith("/admin/reporting") || pathname.startsWith("/admin/reports")) {
    return "/admin/parent-dashboard";
  }

  if (pathname.startsWith("/admin/parent-dashboard")) {
    return "/admin/command-centre";
  }

  if (pathname.startsWith("/admin/classes")) {
    return "/admin/students";
  }

  if (pathname.startsWith("/admin/students")) {
    return "/admin/evidence-entry";
  }

  return "/admin/command-centre";
}

function buildInitialOpenSections() {
  return NAV_SECTIONS.reduce<Record<string, boolean>>((acc, section) => {
    acc[section.key] = !!section.defaultOpen;
    return acc;
  }, {});
}

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function AdminLeftNav() {
  const pathname = usePathname() || "";
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    buildInitialOpenSections()
  );

  const currentLabel = useMemo(() => currentSurfaceLabel(pathname), [pathname]);

  const recommendedHref = useMemo(
    () => findRecommendedSurface(pathname),
    [pathname]
  );

  const recommendedItem = useMemo(() => {
    for (const section of NAV_SECTIONS) {
      const found = section.items.find((item) => item.href === recommendedHref);
      if (found) return found;
    }

    if (recommendedHref === "/admin/command-centre") {
      return {
        href: "/admin/command-centre",
        label: "Teacher Command Centre",
        shortLabel: "Command",
        description: "Teacher mission control",
        tone: "blue" as NavTone,
      };
    }

    if (recommendedHref === "/admin/parent-dashboard") {
      return {
        href: "/admin/parent-dashboard",
        label: "Parent Command Dashboard",
        shortLabel: "Parent",
        description: "Family-facing surface",
        tone: "rose" as NavTone,
      };
    }

    if (recommendedHref === "/admin/students") {
      return {
        href: "/admin/students",
        label: "Students",
        shortLabel: "Students",
        description: "Student profiles and navigation",
        tone: "slate" as NavTone,
      };
    }

    if (recommendedHref === "/admin/evidence-entry") {
      return {
        href: "/admin/evidence-entry",
        label: "Add Evidence",
        shortLabel: "Evidence",
        description: "Capture learning evidence",
        tone: "slate" as NavTone,
      };
    }

    return null;
  }, [recommendedHref]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  return (
    <aside
      style={{
        ...S.shell,
        width: collapsed ? 92 : 300,
      }}
    >
      <div style={S.brandWrap}>
        <div>
          <div style={S.brand}>EduDecks</div>
          {!collapsed ? (
            <div style={S.subtitle}>
              Human development operating system
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          style={S.collapseBtn}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <div style={S.currentSurface}>
        <div style={S.currentLabel}>Current</div>
        <div style={S.currentValue}>{collapsed ? "Live" : currentLabel}</div>
      </div>

      {!collapsed && recommendedItem ? (
        <Link
          href={recommendedItem.href}
          style={{
            ...S.recommendedCard,
            background: toneStyles(recommendedItem.tone || "blue").soft,
            borderColor: toneStyles(recommendedItem.tone || "blue").bd,
          }}
        >
          <div
            style={{
              ...S.recommendedK,
              color: toneStyles(recommendedItem.tone || "blue").fg,
            }}
          >
            Recommended next
          </div>
          <div style={S.recommendedV}>{recommendedItem.label}</div>
          {recommendedItem.description ? (
            <div style={S.recommendedS}>{recommendedItem.description}</div>
          ) : null}
        </Link>
      ) : null}

      <nav style={S.nav}>
        {NAV_SECTIONS.map((section) => {
          const isOpen = openSections[section.key] ?? !!section.defaultOpen;

          return (
            <div key={section.key} style={S.section}>
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                style={S.sectionHeader}
              >
                {!collapsed ? (
                  <>
                    <span style={S.sectionLabel}>{section.label}</span>
                    <span style={S.sectionCaret}>{isOpen ? "−" : "+"}</span>
                  </>
                ) : (
                  <span style={S.sectionMiniDot} />
                )}
              </button>

              {!collapsed && isOpen ? (
                <div style={S.linkList}>
                  {section.items.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    const tone = toneStyles(item.tone || "slate");

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          ...S.link,
                          ...(active
                            ? {
                                background: tone.bg,
                                borderColor: tone.bd,
                                color: tone.fg,
                                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                              }
                            : S.linkInactive),
                        }}
                      >
                        <div style={S.linkTop}>
                          <div style={S.linkLabel}>{item.label}</div>
                          {item.shortLabel ? (
                            <span
                              style={{
                                ...S.linkPill,
                                background: active ? "#ffffff" : "#f8fafc",
                                borderColor: active ? tone.bd : "#e2e8f0",
                                color: active ? tone.fg : "#64748b",
                              }}
                            >
                              {active ? "ACTIVE" : item.shortLabel}
                            </span>
                          ) : null}
                        </div>

                        {item.description ? (
                          <div
                            style={{
                              ...S.linkDesc,
                              color: active ? "#334155" : "#94a3b8",
                            }}
                          >
                            {item.description}
                          </div>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {!collapsed ? (
        <div style={S.footer}>
          <div style={S.footerTitle}>EduDecks v1</div>
          <div style={S.footerText}>
            Built for classrooms, leadership, reporting, and family learning.
          </div>
        </div>
      ) : null}
    </aside>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    borderRight: "1px solid #1e293b",
    background: "#0f172a",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    transition: "width 160ms ease",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
  },

  brandWrap: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  brand: {
    fontSize: 24,
    fontWeight: 1000,
    color: "#ffffff",
    lineHeight: 1.05,
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 800,
    color: "#94a3b8",
    lineHeight: 1.4,
    maxWidth: 220,
  },

  collapseBtn: {
    border: "1px solid #334155",
    background: "#111827",
    color: "#e2e8f0",
    borderRadius: 10,
    padding: "7px 9px",
    fontWeight: 900,
    cursor: "pointer",
  },

  currentSurface: {
    border: "1px solid #1e293b",
    background: "#111827",
    borderRadius: 14,
    padding: 12,
  },

  currentLabel: {
    fontSize: 10,
    fontWeight: 900,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  currentValue: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 1000,
    color: "#ffffff",
    lineHeight: 1.3,
  },

  recommendedCard: {
    display: "block",
    textDecoration: "none",
    border: "1px solid #334155",
    borderRadius: 16,
    padding: 12,
  },

  recommendedK: {
    fontSize: 10,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  recommendedV: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 1000,
    color: "#0f172a",
    lineHeight: 1.25,
  },

  recommendedS: {
    marginTop: 4,
    fontSize: 11,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.4,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    border: "none",
    background: "transparent",
    color: "#cbd5e1",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#94a3b8",
  },

  sectionCaret: {
    fontSize: 14,
    fontWeight: 900,
    color: "#64748b",
  },

  sectionMiniDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#334155",
    display: "inline-block",
    margin: "0 auto",
  },

  linkList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  link: {
    display: "block",
    textDecoration: "none",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: 12,
    transition: "all 120ms ease",
  },

  linkInactive: {
    background: "#111827",
    borderColor: "#1f2937",
    color: "#e2e8f0",
  },

  linkTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  linkLabel: {
    fontSize: 13,
    fontWeight: 1000,
    lineHeight: 1.25,
  },

  linkPill: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "4px 8px",
    fontSize: 10,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },

  linkDesc: {
    marginTop: 6,
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 800,
    lineHeight: 1.4,
  },

  footer: {
    marginTop: "auto",
    borderTop: "1px solid #1e293b",
    paddingTop: 14,
  },

  footerTitle: {
    fontSize: 12,
    fontWeight: 1000,
    color: "#e2e8f0",
  },

  footerText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: 800,
    color: "#64748b",
    lineHeight: 1.45,
  },
};
