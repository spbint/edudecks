"use client";

import React, { useMemo } from "react";

/* ───────────────────────── TYPES ───────────────────────── */

export type AttributeTrend = "up" | "flat" | "down";

export type StudentAttribute = {
  key?:
    | "reading"
    | "writing"
    | "mathematics"
    | "reasoning"
    | "focus"
    | "independence"
    | "organisation"
    | "task_completion"
    | "collaboration"
    | "resilience"
    | string;
  code?: string;
  label?: string;
  name?: string;
  score?: number | null; // legacy or engine
  value?: number | null; // engine-friendly alias
  trend?: AttributeTrend | string | null;
  band?: string | null;
  status?: string | null;
  [k: string]: any;
};

type NormalisedStudentAttribute = {
  key: string;
  label: string;
  score: number; // 1–20
  trend: AttributeTrend;
  band?: string | null;
  status?: string | null;
};

type StudentAttributeCardProps = {
  studentName?: string | null;
  attributes?: StudentAttribute[];
  compact?: boolean;
};

/* ───────────────────────── DEFAULT MOCK DATA ───────────────────────── */

const DEFAULT_ATTRIBUTES: StudentAttribute[] = [
  { key: "reading", label: "Reading", score: 14, trend: "up" },
  { key: "writing", label: "Writing", score: 11, trend: "flat" },
  { key: "mathematics", label: "Mathematics", score: 12, trend: "up" },
  { key: "reasoning", label: "Reasoning", score: 13, trend: "up" },
  { key: "focus", label: "Focus", score: 8, trend: "down" },
  { key: "independence", label: "Independence", score: 10, trend: "flat" },
  { key: "organisation", label: "Organisation", score: 7, trend: "down" },
  { key: "task_completion", label: "Task Completion", score: 10, trend: "flat" },
  { key: "collaboration", label: "Collaboration", score: 16, trend: "up" },
  { key: "resilience", label: "Resilience", score: 12, trend: "flat" },
];

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

function toTrend(v: any): AttributeTrend {
  const x = safe(v).toLowerCase();
  if (x === "up") return "up";
  if (x === "down") return "down";
  return "flat";
}

function toScore20(v: any) {
  const n = Number(v);
  if (Number.isNaN(n)) return 10;
  return clamp(Math.round(n), 1, 20);
}

function normaliseAttribute(a: StudentAttribute): NormalisedStudentAttribute {
  const label = safe(a.label) || safe(a.name) || safe(a.code) || safe(a.key) || "Attribute";
  const key = safe(a.key) || safe(a.code) || label.toLowerCase().replace(/\s+/g, "_");
  const rawScore = a.score ?? a.value ?? 10;

  return {
    key,
    label,
    score: toScore20(rawScore),
    trend: toTrend(a.trend),
    band: a.band ?? null,
    status: a.status ?? null,
  };
}

function scoreTone(score: number) {
  if (score <= 8) {
    return {
      bg: "#fff7ed",
      bd: "#fed7aa",
      fg: "#9a3412",
      fill: "#f59e0b",
      label: "Developing",
    };
  }

  if (score <= 12) {
    return {
      bg: "#f8fafc",
      bd: "#e2e8f0",
      fg: "#475569",
      fill: "#94a3b8",
      label: "Secure",
    };
  }

  if (score <= 16) {
    return {
      bg: "#ecfdf5",
      bd: "#a7f3d0",
      fg: "#166534",
      fill: "#22c55e",
      label: "Strength",
    };
  }

  return {
    bg: "#dcfce7",
    bd: "#86efac",
    fg: "#166534",
    fill: "#16a34a",
    label: "Standout",
  };
}

function trendArrow(trend: AttributeTrend) {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

function trendTone(trend: AttributeTrend) {
  if (trend === "up") return "#166534";
  if (trend === "down") return "#9f1239";
  return "#64748b";
}

function profileBand(avg: number) {
  if (avg >= 15) return "Highly developed learning profile";
  if (avg >= 12) return "Strong all-round learner";
  if (avg >= 9) return "Emerging independent learner";
  return "Developing support profile";
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function buildRadarPoints(
  attributes: NormalisedStudentAttribute[],
  cx: number,
  cy: number,
  radius: number
) {
  const count = attributes.length;
  return attributes.map((a, i) => {
    const angle = (360 / count) * i;
    const scaled = (clamp(a.score, 1, 20) / 20) * radius;
    const p = polarToCartesian(cx, cy, scaled, angle);
    return { ...p, angle, score: a.score, label: a.label };
  });
}

function buildOuterPoints(
  attributes: NormalisedStudentAttribute[],
  cx: number,
  cy: number,
  radius: number
) {
  const count = attributes.length;
  return attributes.map((_, i) => {
    const angle = (360 / count) * i;
    return polarToCartesian(cx, cy, radius, angle);
  });
}

function polygonPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  return points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 20,
    background: "#fff",
  } as React.CSSProperties,

  pad: {
    padding: 16,
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  title: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  help: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    lineHeight: 1.45,
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: 16,
    marginTop: 14,
    alignItems: "start",
  } as React.CSSProperties,

  compactGrid: {
    display: "grid",
    gap: 14,
    marginTop: 14,
  } as React.CSSProperties,

  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipMuted: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  insightGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
    marginTop: 14,
  } as React.CSSProperties,

  insightCard: {
    border: "1px solid #eef2f7",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
  } as React.CSSProperties,

  insightK: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  insightV: {
    marginTop: 8,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 950,
    lineHeight: 1.3,
  } as React.CSSProperties,

  attributeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  } as React.CSSProperties,

  attrCard: {
    border: "1px solid #eef2f7",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
  } as React.CSSProperties,

  attrTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  } as React.CSSProperties,

  attrLabel: {
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.2,
  } as React.CSSProperties,

  attrScoreWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  } as React.CSSProperties,

  attrScore: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  meterBg: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
    marginTop: 10,
  } as React.CSSProperties,

  meterFill: {
    height: "100%",
    borderRadius: 999,
  } as React.CSSProperties,

  attrMeta: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  } as React.CSSProperties,

  svgWrap: {
    border: "1px solid #eef2f7",
    borderRadius: 18,
    background: "#fbfcff",
    padding: 12,
  } as React.CSSProperties,
};

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function StudentAttributeCard({
  studentName,
  attributes = DEFAULT_ATTRIBUTES,
  compact = false,
}: StudentAttributeCardProps) {
  const finalAttributes = useMemo(() => {
    return [...attributes]
      .map(normaliseAttribute)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [attributes]);

  const averageScore = useMemo(() => {
    if (!finalAttributes.length) return 0;
    const total = finalAttributes.reduce((sum, a) => sum + a.score, 0);
    return total / finalAttributes.length;
  }, [finalAttributes]);

  const strongest = useMemo(() => {
    return [...finalAttributes].sort((a, b) => b.score - a.score)[0];
  }, [finalAttributes]);

  const growthEdge = useMemo(() => {
    return [...finalAttributes].sort((a, b) => a.score - b.score)[0];
  }, [finalAttributes]);

  const nextAction = useMemo(() => {
    if (!growthEdge) return "Capture fresh evidence";
    const key = safe(growthEdge.key).toLowerCase();

    if (key === "writing") return "Capture writing evidence";
    if (key === "focus") return "Review attention supports";
    if (key === "organisation") return "Tighten routines and task setup";
    if (key === "independence") return "Reduce prompting gradually";
    if (key === "task_completion") return "Monitor completion rate";
    return `Track ${growthEdge.label.toLowerCase()} growth`;
  }, [growthEdge]);

  const radarData = useMemo(() => {
    const cx = 150;
    const cy = 150;
    const outer = 110;
    const points = buildRadarPoints(finalAttributes, cx, cy, outer);
    const outerPoints = buildOuterPoints(finalAttributes, cx, cy, outer);
    const rings = [0.25, 0.5, 0.75, 1].map((scale) =>
      buildOuterPoints(finalAttributes, cx, cy, outer * scale)
    );

    return { cx, cy, outer, points, outerPoints, rings };
  }, [finalAttributes]);

  const profileLabel = profileBand(averageScore);

  return (
    <section style={S.card}>
      <div style={S.pad}>
        <div style={S.subtle}>Student Attributes</div>
        <div style={S.title}>
          {safe(studentName) ? `${safe(studentName)} • Attribute Engine` : "Attribute Engine"}
        </div>
        <div style={S.help}>
          Learner attributes built from teaching insight, evidence, and shared analytics.
        </div>

        <div style={S.chipRow}>
          <span style={S.chip}>Profile: {profileLabel}</span>
          {strongest ? <span style={S.chipMuted}>Strength: {strongest.label}</span> : null}
          {growthEdge ? <span style={S.chipMuted}>Watch: {growthEdge.label}</span> : null}
          <span style={S.chipMuted}>Average: {averageScore.toFixed(1)}</span>
        </div>

        <div style={compact ? S.compactGrid : S.grid}>
          <div style={S.svgWrap}>
            <svg
              viewBox="0 0 300 300"
              width="100%"
              height="320"
              role="img"
              aria-label="Student attribute radar chart"
            >
              {radarData.rings.map((ring, idx) => (
                <path
                  key={`ring-${idx}`}
                  d={polygonPath(ring)}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              ))}

              {radarData.outerPoints.map((p, idx) => (
                <line
                  key={`axis-${idx}`}
                  x1={radarData.cx}
                  y1={radarData.cy}
                  x2={p.x}
                  y2={p.y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              ))}

              <path
                d={polygonPath(radarData.points)}
                fill="rgba(34, 197, 94, 0.18)"
                stroke="#16a34a"
                strokeWidth="2.5"
              />

              {radarData.points.map((p, idx) => (
                <g key={`point-${idx}`}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#16a34a" />
                </g>
              ))}

              {radarData.outerPoints.map((_, idx) => {
                const labelPoint = polarToCartesian(
                  radarData.cx,
                  radarData.cy,
                  radarData.outer + 24,
                  (360 / finalAttributes.length) * idx
                );
                return (
                  <text
                    key={`label-${idx}`}
                    x={labelPoint.x}
                    y={labelPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill="#475569"
                  >
                    {finalAttributes[idx]?.label}
                  </text>
                );
              })}
            </svg>
          </div>

          <div>
            <div style={S.attributeGrid}>
              {finalAttributes.map((attr) => {
                const tone = scoreTone(attr.score);
                const fill = (attr.score / 20) * 100;

                return (
                  <div key={attr.key} style={S.attrCard}>
                    <div style={S.attrTop}>
                      <div style={S.attrLabel}>{attr.label}</div>
                      <div style={S.attrScoreWrap}>
                        <span style={{ color: trendTone(attr.trend), fontWeight: 950 }}>
                          {trendArrow(attr.trend)}
                        </span>
                        <span style={S.attrScore}>{attr.score}</span>
                      </div>
                    </div>

                    <div style={S.meterBg}>
                      <div
                        style={{
                          ...S.meterFill,
                          width: `${fill}%`,
                          background: tone.fill,
                        }}
                      />
                    </div>

                    <div style={S.attrMeta}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: tone.bg,
                          border: `1px solid ${tone.bd}`,
                          color: tone.fg,
                          fontWeight: 900,
                          fontSize: 11,
                        }}
                      >
                        {attr.band || attr.status || tone.label}
                      </span>

                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>
                        /20
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={S.insightGrid}>
              <div style={S.insightCard}>
                <div style={S.insightK}>Strongest Area</div>
                <div style={S.insightV}>
                  {strongest ? `${strongest.label} (${strongest.score})` : "—"}
                </div>
              </div>

              <div style={S.insightCard}>
                <div style={S.insightK}>Growth Edge</div>
                <div style={S.insightV}>
                  {growthEdge ? `${growthEdge.label} (${growthEdge.score})` : "—"}
                </div>
              </div>

              <div style={S.insightCard}>
                <div style={S.insightK}>Suggested Next Action</div>
                <div style={S.insightV}>{nextAction}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}