
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import AdminLeftNav from "@/app/components/AdminLeftNav";

/* ------------------------------------------------------------------------------
   TYPES
------------------------------------------------------------------------------ */

type ExecRole =
  | "CEO"
  | "COO"
  | "CTO"
  | "CRO"
  | "CPO"
  | "CFO"
  | "CDO"
  | "CAIO";

type PriorityStatus = "critical" | "high" | "watch";

type ExecutiveCard = {
  role: ExecRole;
  title: string;
  verdict: string;
  headline: string;
  recommendation: string;
  impact: string;
  status: PriorityStatus;
};

type MarketMetric = {
  label: string;
  value: string;
  note: string;
};

type TrendPoint = {
  year: string;
  value: number;
};

type FactorRow = {
  label: string;
  strength: number;
  type: "push" | "pull";
};

type RegionRow = {
  region: string;
  readiness: number;
  note: string;
};

type BuildPriority = {
  name: string;
  owner: ExecRole;
  score: number;
  why: string;
  status: PriorityStatus;
};

type InsightRow = {
  label: string;
  value: string;
  note: string;
};

/* ------------------------------------------------------------------------------
   DATA (research-informed dashboard seed)
------------------------------------------------------------------------------ */

const MARKET_METRICS: MarketMetric[] = [
  {
    label: "US Homeschool Scale",
    value: "˜ 4M students",
    note: "Persistent post-pandemic market, no longer niche.",
  },
  {
    label: "Pre-Pandemic Baseline",
    value: "˜ 3–4%",
    note: "Useful benchmark for showing the market shift.",
  },
  {
    label: "Post-Pandemic Range",
    value: "˜ 5–10%",
    note: "Different sources vary, but the category remains elevated.",
  },
  {
    label: "Sector Mixing",
    value: "44%",
    note: "Many homeschool households also use another education sector.",
  },
];

const US_TREND: TrendPoint[] = [
  { year: "2019", value: 3.0 },
  { year: "2021", value: 6.0 },
  { year: "2024", value: 6.0 },
  { year: "2026", value: 7.0 },
];

const PUSH_PULL_FACTORS: FactorRow[] = [
  { label: "Safety / school environment concerns", strength: 88, type: "push" },
  { label: "Dissatisfaction with traditional schooling", strength: 82, type: "push" },
  { label: "Need for child-specific support", strength: 79, type: "push" },
  { label: "Policy / ideology mismatch", strength: 72, type: "push" },

  { label: "Personalised learning", strength: 92, type: "pull" },
  { label: "Flexible schedule", strength: 86, type: "pull" },
  { label: "Parent-led responsibility", strength: 80, type: "pull" },
  { label: "Faith / values alignment", strength: 74, type: "pull" },
];

const EXECUTIVE_CARDS: ExecutiveCard[] = [
  {
    role: "CEO",
    title: "Chief Executive Officer",
    verdict: "Market category is real and durable.",
    headline: "EduDecks should position as a homeschool confidence engine, not just a tracker.",
    recommendation:
      "Lock the product story around confidence, compliance, and calm family control.",
    impact: "Improves positioning, launch messaging, and category clarity.",
    status: "critical",
  },
  {
    role: "COO",
    title: "Chief Operating Officer",
    verdict: "Build order must narrow.",
    headline: "Too many future ideas are competing with the core family operating loop.",
    recommendation:
      "Prioritise Capture ? Portfolio ? Progress ? Reports ? Authority readiness.",
    impact: "Reduces execution drift and rebuild churn.",
    status: "critical",
  },
  {
    role: "CTO",
    title: "Chief Technology Officer",
    verdict: "Platform scope is growing fast.",
    headline: "The product is becoming a platform, so stability and structure matter more now.",
    recommendation:
      "Keep the executive dashboard data-driven but lightweight; avoid over-engineering charts and data pipelines too early.",
    impact: "Protects production stability while adding strategy visibility.",
    status: "high",
  },
  {
    role: "CRO",
    title: "Chief Revenue Officer",
    verdict: "The problem is parent confidence.",
    headline: "Parents do not buy dashboards; they buy reassurance and reduced stress.",
    recommendation:
      "Make the main CTA about being on track, compliant, and knowing what to do next.",
    impact: "Improves activation and conversion to paid tiers.",
    status: "critical",
  },
  {
    role: "CPO",
    title: "Chief Product Officer",
    verdict: "Families want one home base.",
    headline: "The market is fragmented across planners, portfolios, groups, and reporting tools.",
    recommendation:
      "Unify the product around a simple operating system experience with fewer disconnected surfaces.",
    impact: "Raises product clarity and family retention.",
    status: "critical",
  },
  {
    role: "CFO",
    title: "Chief Financial Officer",
    verdict: "There is willingness to pay, but for relief, not complexity.",
    headline: "Premium should unlock confidence, time savings, storage, exports, and AI assistance.",
    recommendation:
      "Keep the free tier useful, then premium-gate convenience, intelligence, and advanced reporting.",
    impact: "Supports freemium monetisation without hurting trust.",
    status: "high",
  },
  {
    role: "CDO",
    title: "Chief Data Officer",
    verdict: "Research points to trackable parent anxieties and needs.",
    headline: "The most useful signals are readiness, evidence coverage, child support needs, and reporting confidence.",
    recommendation:
      "Model product analytics around confidence and completion, not just usage counts.",
    impact: "Creates a stronger insight layer and smarter future AI.",
    status: "high",
  },
  {
    role: "CAIO",
    title: "Chief AI Officer",
    verdict: "AI should assist, not dominate.",
    headline: "Families need help turning messy activity into useful summaries and next steps.",
    recommendation:
      "Use AI for report drafting, evidence summarisation, and weekly recommendations after the core workflow is stable.",
    impact: "Makes AI genuinely valuable and premium-worthy.",
    status: "watch",
  },
];

const BUILD_PRIORITIES: BuildPriority[] = [
  {
    name: "Authority Confidence Layer",
    owner: "CEO",
    score: 98,
    why: "Parents need reassurance they are doing this correctly and legally.",
    status: "critical",
  },
  {
    name: "Family Progress + Readiness Layer",
    owner: "CDO",
    score: 95,
    why: "Confidence comes from visible progress and clean evidence coverage.",
    status: "critical",
  },
  {
    name: "Evidence Capture Simplification",
    owner: "CPO",
    score: 92,
    why: "Low-friction capture is the root of the whole system.",
    status: "critical",
  },
  {
    name: "Report Generator + Output Quality",
    owner: "COO",
    score: 90,
    why: "Families need chaos converted into authority-ready output.",
    status: "high",
  },
  {
    name: "Regional Compliance Router",
    owner: "CTO",
    score: 86,
    why: "Different regions require flexible outputs and future scale support.",
    status: "high",
  },
  {
    name: "AI Parent Guidance Layer",
    owner: "CAIO",
    score: 72,
    why: "Strong premium upside, but it should follow workflow stability.",
    status: "watch",
  },
];

const REGION_ROWS: RegionRow[] = [
  {
    region: "United States",
    readiness: 88,
    note: "Biggest immediate opportunity; large and persistent homeschool market.",
  },
  {
    region: "Australia",
    readiness: 81,
    note: "Strong fit for values, child-specific needs, and reporting confidence.",
  },
  {
    region: "United Kingdom",
    readiness: 73,
    note: "Attractive future market with flexible home education culture.",
  },
  {
    region: "New Zealand",
    readiness: 69,
    note: "Good fit for family-first positioning and evidence-led support.",
  },
];

const INSIGHTS: InsightRow[] = [
  {
    label: "Primary parent fear",
    value: "Am I doing this right?",
    note: "Confidence is the category entry point.",
  },
  {
    label: "Primary product job",
    value: "Turn learning into proof",
    note: "Capture and reporting must feel effortless.",
  },
  {
    label: "Retention engine",
    value: "Progress + reassurance",
    note: "Families stay when they feel organised and calm.",
  },
  {
    label: "Premium engine",
    value: "Time-saving intelligence",
    note: "AI, exports, storage, and advanced readiness signals.",
  },
];

/* ------------------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------------------ */

function statusColor(status: PriorityStatus) {
  if (status === "critical") return "#dc2626";
  if (status === "high") return "#d97706";
  return "#2563eb";
}

function statusBg(status: PriorityStatus) {
  if (status === "critical") return "#fee2e2";
  if (status === "high") return "#ffedd5";
  return "#dbeafe";
}

function safePct(n: number) {
  return `${Math.max(0, Math.min(100, n))}%`;
}

function sectionCardStyle(highlight = false): React.CSSProperties {
  return {
    background: "#ffffff",
    border: highlight ? "1px solid #c7d2fe" : "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
  };
}

function MiniBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: 10,
        background: "#e5e7eb",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: safePct(value),
          height: "100%",
          background: color,
          borderRadius: 999,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------------
   PAGE
------------------------------------------------------------------------------ */

export default function AdminExecutivePage() {
  const [selectedRole, setSelectedRole] = useState<ExecRole | "ALL">("ALL");

  const visibleExecCards = useMemo(() => {
    if (selectedRole === "ALL") return EXECUTIVE_CARDS;
    return EXECUTIVE_CARDS.filter((card) => card.role === selectedRole);
  }, [selectedRole]);

  const avgReadiness = useMemo(() => {
    if (!REGION_ROWS.length) return 0;
    return Math.round(
      REGION_ROWS.reduce((sum, row) => sum + row.readiness, 0) / REGION_ROWS.length
    );
  }, []);

  const topPriority = useMemo(() => {
    return [...BUILD_PRIORITIES].sort((a, b) => b.score - a.score)[0];
  }, []);

  const criticalCount = BUILD_PRIORITIES.filter((p) => p.status === "critical").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <AdminLeftNav />

        <main
          style={{
            flex: 1,
            padding: 24,
          }}
        >
          {/* Header */}
          <section
            style={{
              ...sectionCardStyle(true),
              padding: 24,
              marginBottom: 20,
              background:
                "linear-gradient(135deg, rgba(238,242,255,1) 0%, rgba(248,250,252,1) 60%, rgba(236,253,245,1) 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 20,
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div style={{ maxWidth: 820 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#4338ca",
                    marginBottom: 14,
                  }}
                >
                  DIGITAL EXECUTIVE BOARD
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: 34,
                    lineHeight: 1.1,
                    fontWeight: 900,
                    letterSpacing: -0.6,
                  }}
                >
                  EduDecks Executive Dashboard
                </h1>

                <p
                  style={{
                    marginTop: 12,
                    marginBottom: 0,
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: "#334155",
                    maxWidth: 780,
                  }}
                >
                  Research-led command view translating homeschooling market data into
                  product strategy, growth decisions, execution order, and launch
                  priorities for the EduDecks family product.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(140px, 1fr))",
                  gap: 12,
                  minWidth: 360,
                  flex: 1,
                  maxWidth: 520,
                }}
              >
                <div style={sectionCardStyle()}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Top Priority
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, marginTop: 8 }}>
                    {topPriority?.name || "—"}
                  </div>
                </div>

                <div style={sectionCardStyle()}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Critical Workstreams
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                    {criticalCount}
                  </div>
                </div>

                <div style={sectionCardStyle()}>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    Avg Region Readiness
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                    {avgReadiness}%
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              <Link
                href="/family"
                style={{
                  textDecoration: "none",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontWeight: 800,
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                Open Family Dashboard
              </Link>

              <Link
                href="/reports"
                style={{
                  textDecoration: "none",
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #e5e7eb",
                  fontWeight: 800,
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                Open Reports Builder
              </Link>

              <Link
                href="/portfolio"
                style={{
                  textDecoration: "none",
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #e5e7eb",
                  fontWeight: 800,
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                Open Portfolio
              </Link>
            </div>
          </section>
          {/* Market Snapshot */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1.25fr 1fr",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div style={sectionCardStyle()}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  marginBottom: 14,
                }}
              >
                Market Snapshot
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                {MARKET_METRICS.map((metric) => (
                  <div
                    key={metric.label}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      background: "#fafafa",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                      {metric.label}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                      {metric.value}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#475569",
                        lineHeight: 1.45,
                        marginTop: 8,
                      }}
                    >
                      {metric.note}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    marginBottom: 10,
                  }}
                >
                  Homeschool Participation Trend
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${US_TREND.length}, minmax(90px, 1fr))`,
                    gap: 12,
                    alignItems: "end",
                    height: 220,
                  }}
                >
                  {US_TREND.map((point) => (
                    <div
                      key={point.year}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 10,
                        height: "100%",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>
                        {point.value.toFixed(1)}%
                      </div>

                      <div
                        style={{
                          width: "100%",
                          maxWidth: 80,
                          height: `${point.value * 24}px`,
                          background:
                            "linear-gradient(180deg, #6366f1 0%, #22c55e 100%)",
                          borderRadius: 16,
                          boxShadow: "0 10px 20px rgba(99,102,241,0.15)",
                        }}
                      />

                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                        {point.year}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={sectionCardStyle()}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  marginBottom: 14,
                }}
              >
                Executive Summary
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                }}
              >
                {INSIGHTS.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        marginTop: 8,
                        color: "#0f172a",
                      }}
                    >
                      {item.value}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: "#475569",
                        lineHeight: 1.45,
                      }}
                    >
                      {item.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Push / Pull */}
          <section
            style={{
              ...sectionCardStyle(),
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>
                  Parent Motivation Map
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    color: "#475569",
                    lineHeight: 1.5,
                  }}
                >
                  Push factors are driving families away from traditional systems.
                  Pull factors are attracting them toward flexible, parent-led learning.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#b91c1c",
                  }}
                >
                  PUSH
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    background: "#ecfdf5",
                    border: "1px solid #bbf7d0",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#15803d",
                  }}
                >
                  PULL
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div
                style={{
                  border: "1px solid #fee2e2",
                  background: "#fffafa",
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, color: "#991b1b" }}>
                  Push Factors
                </div>
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  {PUSH_PULL_FACTORS.filter((f) => f.type === "push").map((factor) => (
                    <div key={factor.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        <span>{factor.label}</span>
                        <span>{factor.strength}</span>
                      </div>
                      <MiniBar value={factor.strength} color="#ef4444" />
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #dcfce7",
                  background: "#f7fff9",
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 900, color: "#166534" }}>
                  Pull Factors
                </div>
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  {PUSH_PULL_FACTORS.filter((f) => f.type === "pull").map((factor) => (
                    <div key={factor.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        <span>{factor.label}</span>
                        <span>{factor.strength}</span>
                      </div>
                      <MiniBar value={factor.strength} color="#22c55e" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Executive Cards */}
          <section
            style={{
              ...sectionCardStyle(),
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>
                  Executive Board Decisions
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    color: "#475569",
                  }}
                >
                  Role-based strategic verdicts generated from homeschool market signals.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {(["ALL", "CEO", "COO", "CTO", "CRO", "CPO", "CFO", "CDO", "CAIO"] as const).map(
                  (role) => {
                    const active = selectedRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        style={{
                          border: active ? "1px solid #4f46e5" : "1px solid #e5e7eb",
                          background: active ? "#eef2ff" : "#ffffff",
                          color: active ? "#3730a3" : "#334155",
                          borderRadius: 999,
                          padding: "8px 12px",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {role}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {visibleExecCards.map((card) => (
                <div
                  key={card.role}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 18,
                    padding: 18,
                    background: "#ffffff",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#64748b",
                          letterSpacing: 0.2,
                        }}
                      >
                        {card.role}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 18,
                          fontWeight: 900,
                        }}
                      >
                        {card.title}
                      </div>
                    </div>

                    <div
                      style={{
                        background: statusBg(card.status),
                        color: statusColor(card.status),
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      {card.status}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    {card.verdict}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: "#334155",
                    }}
                  >
                    {card.headline}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: 14,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                        Recommendation
                      </div>
                      <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.5, marginTop: 4 }}>
                        {card.recommendation}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                        Expected Impact
                      </div>
                      <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.5, marginTop: 4 }}>
                        {card.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Priorities + regions */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div style={sectionCardStyle()}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 14 }}>
                Build Priority Stack
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {BUILD_PRIORITIES.sort((a, b) => b.score - a.score).map((item, index) => (
                  <div
                    key={item.name}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            fontWeight: 800,
                          }}
                        >
                          PRIORITY {index + 1}
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 900,
                            marginTop: 4,
                          }}
                        >
                          {item.name}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e5e7eb",
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#334155",
                          }}
                        >
                          Owner: {item.owner}
                        </div>

                        <div
                          style={{
                            background: statusBg(item.status),
                            color: statusColor(item.status),
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {item.status}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          marginBottom: 6,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <span>Priority Score</span>
                        <span>{item.score}</span>
                      </div>
                      <MiniBar
                        value={item.score}
                        color={
                          item.status === "critical"
                            ? "#ef4444"
                            : item.status === "high"
                            ? "#f59e0b"
                            : "#3b82f6"
                        }
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 14,
                        color: "#334155",
                        lineHeight: 1.55,
                      }}
                    >
                      {item.why}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={sectionCardStyle()}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 14 }}>
                Region Opportunity Radar
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {REGION_ROWS.map((row) => (
                  <div
                    key={row.region}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 900 }}>{row.region}</div>
                      <div style={{ fontSize: 14, fontWeight: 900 }}>{row.readiness}%</div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <MiniBar value={row.readiness} color="#4f46e5" />
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 13,
                        color: "#475569",
                        lineHeight: 1.5,
                      }}
                    >
                      {row.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Closing board call */}
          <section style={sectionCardStyle(true)}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.15fr 0.85fr",
                gap: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 10 }}>
                  Board Call
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    lineHeight: 1.2,
                    letterSpacing: -0.3,
                  }}
                >
                  EduDecks should launch as the calm, evidence-led homeschool operating
                  system that helps families know they are on track.
                </div>

                <div
                  style={{
                    marginTop: 14,
                    fontSize: 15,
                    color: "#334155",
                    lineHeight: 1.7,
                    maxWidth: 880,
                  }}
                >
                  The strongest opportunity is not merely content or planning. It is parent
                  confidence. The product should reduce overwhelm, convert learning into
                  proof, and make reporting feel achievable. Community, marketplace, and
                  deeper AI layers remain strategically valuable, but they should sit on top
                  of a stable family workflow rather than compete with it.
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 18,
                  background: "#ffffff",
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                  NEXT BEST PRODUCT MOVE
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>
                  Authority Confidence Layer
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#334155",
                  }}
                >
                  Turn this research into a parent-facing layer that says:
                  <br />
                  <br />
                  • what has been captured
                  <br />
                  • what still needs evidence
                  <br />
                  • how ready the family is for reporting
                  <br />
                  • what to do next this week
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 16,
                  }}
                >
                  <Link
                    href="/authority"
                    style={{
                      textDecoration: "none",
                      background: "#4f46e5",
                      color: "#ffffff",
                      fontWeight: 800,
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: 14,
                    }}
                  >
                    Open Authority Hub
                  </Link>

                  <Link
                    href="/reports/output"
                    style={{
                      textDecoration: "none",
                      background: "#ffffff",
                      color: "#0f172a",
                      border: "1px solid #e5e7eb",
                      fontWeight: 800,
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: 14,
                    }}
                  >
                    Open Report Output
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
