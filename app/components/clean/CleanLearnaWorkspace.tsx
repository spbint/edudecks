"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import EvidenceThumbnail from "@/app/components/clean/evidence/EvidenceThumbnail";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";
import {
  buildLearnaMilestones,
  buildLearnaStrandSummaries,
  buildLearnaTrendSeries,
  getLearnaProgressLabel,
  inferLearnaEvidenceStrand,
  isLearnaSecureProgress,
  LEARNA_MATH_STRANDS,
} from "@/lib/clean/learna/metrics";
import type {
  LearnaMathStrandKey,
  LearnaMilestone,
  LearnaStrandSummary,
  LearnaTrendPoint,
} from "@/lib/clean/learna/types";
import { getEvidencePreviewImage } from "@/lib/clean/portfolio/evidencePresentation";
import { MATH_WORKSHEET_RESOURCES } from "@/lib/clean/resources/mathWorksheetResources";
import type { Learner } from "@/lib/clean/learners/types";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";

const statusColours: Record<string, { bg: string; fg: string; border: string }> = {
  "Needs support": { bg: "#fff1f2", fg: "#be123c", border: "#fecdd3" },
  "Working towards": { bg: "#fff7ed", fg: "#c2410c", border: "#fed7aa" },
  Consolidating: { bg: "#fefce8", fg: "#a16207", border: "#fde68a" },
  "Goal achieved": { bg: "#f0fdf4", fg: "#15803d", border: "#bbf7d0" },
  "Goal achieved + extension": { bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe" },
};

type LearnaIconName =
  | "learner"
  | "focus"
  | "camera"
  | "check"
  | "record"
  | "report"
  | "shape"
  | "trend"
  | "balance"
  | "capture"
  | "milestone"
  | "strand"
  | "star"
  | "number"
  | "calculation"
  | "fractions"
  | "patterns"
  | "measure"
  | "geometry";

function getLearnerLabel(learner: Learner | null | undefined) {
  if (!learner) return "Learner";
  return learner.preferredName || learner.firstName || "Learner";
}

function getLearnerInitials(label: string) {
  return label
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatCompactDate(value: string | null | undefined) {
  const clean = String(value ?? "").trim();
  if (!clean) return "";
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return clean.slice(0, 10);
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function statusShortLabel(value: string | null | undefined) {
  const clean = String(value ?? "").trim();
  if (/goal achieved \+ extension/i.test(clean)) return "Extension";
  if (/goal achieved/i.test(clean)) return "Goal achieved";
  if (/working towards/i.test(clean)) return "Working";
  if (/needs support/i.test(clean)) return "Support";
  return clean || "Open";
}

function milestoneShortLabel(milestone: LearnaMilestone) {
  if (milestone.id === "first-evidence") return "First";
  if (milestone.id === "ten-evidence") return "10";
  if (milestone.id === "first-secure" || milestone.id === "five-secure") return "Secure";
  if (milestone.id === "report-ready") return "Report";
  if (milestone.id === "photo-evidence") return "Photo";
  return milestone.label.split(/\s+/)[0] || milestone.label;
}

function milestoneIconName(milestone: LearnaMilestone): LearnaIconName {
  if (milestone.id === "photo-evidence") return "camera";
  if (milestone.id === "report-ready") return "report";
  if (milestone.id === "first-secure" || milestone.id === "five-secure") return "check";
  if (milestone.id === "ten-evidence") return "star";
  return "milestone";
}

function strandIconName(strandKey: LearnaMathStrandKey): LearnaIconName {
  if (strandKey === "number-and-place-value") return "number";
  if (strandKey === "operations-and-calculation") return "calculation";
  if (strandKey === "fractions-decimals-percentages") return "fractions";
  if (strandKey === "algebra-patterns-and-functions") return "patterns";
  if (strandKey === "measurement") return "measure";
  if (strandKey === "geometry-and-spatial-reasoning") return "geometry";
  return "strand";
}

function LearnaIcon({ name, size = 22 }: { name: LearnaIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "learner") {
    return (
      <svg {...common}>
        <circle cx="12" cy="7.7" r="3.1" />
        <path d="M5.7 19.2a6.3 6.3 0 0 1 12.6 0" />
      </svg>
    );
  }
  if (name === "focus") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4" />
      </svg>
    );
  }
  if (name === "camera" || name === "capture") {
    return (
      <svg {...common}>
        <path d="M5 8.5A2.5 2.5 0 0 1 7.5 6H9l1.2-1.5h3.6L15 6h1.5A2.5 2.5 0 0 1 19 8.5v7A2.5 2.5 0 0 1 16.5 18h-9A2.5 2.5 0 0 1 5 15.5v-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.2" />
        <path d="m8.5 12.2 2.2 2.2 4.9-5" />
      </svg>
    );
  }
  if (name === "record" || name === "report") {
    return (
      <svg {...common}>
        <path d="M7 3.8h6.5L18 8.3v11.9H7V3.8Z" />
        <path d="M13.5 4v4.5H18" />
        <path d="M9.6 12.2h4.8" />
        <path d="M9.6 15.3h4.8" />
      </svg>
    );
  }
  if (name === "shape") {
    return (
      <svg {...common}>
        <path d="M12 3.5 19 8v8l-7 4.5L5 16V8l7-4.5Z" />
        <path d="M12 3.5v17M5 8l14 8M19 8 5 16" />
      </svg>
    );
  }
  if (name === "trend") {
    return (
      <svg {...common}>
        <path d="M4 18h16" />
        <path d="m5 15 4.2-4 3.4 2.2L19 6.5" />
        <path d="M16 6.5h3v3" />
      </svg>
    );
  }
  if (name === "balance") {
    return (
      <svg {...common}>
        <path d="M4 17h16" />
        <path d="M7 17V9" />
        <path d="M12 17V5" />
        <path d="M17 17v-6" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg {...common}>
        <path d="m12 3.8 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 3.8Z" />
      </svg>
    );
  }
  if (name === "number") {
    return (
      <svg {...common}>
        <path d="M9 4.5 7.5 19.5" />
        <path d="M16.5 4.5 15 19.5" />
        <path d="M5 9h15" />
        <path d="M4 15h15" />
      </svg>
    );
  }
  if (name === "calculation") {
    return (
      <svg {...common}>
        <path d="M6 7h6" />
        <path d="M9 4v6" />
        <path d="M15 7h4" />
        <path d="M6 17h6" />
        <path d="m15.5 14.5 3 3" />
        <path d="m18.5 14.5-3 3" />
      </svg>
    );
  }
  if (name === "fractions") {
    return (
      <svg {...common}>
        <path d="M6 18 18 6" />
        <circle cx="7.5" cy="7.5" r="2.2" />
        <circle cx="16.5" cy="16.5" r="2.2" />
      </svg>
    );
  }
  if (name === "patterns") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <path d="M15 17h4" />
        <path d="M17 15v4" />
      </svg>
    );
  }
  if (name === "measure") {
    return (
      <svg {...common}>
        <path d="m4.5 15.5 11-11 4 4-11 11-4-4Z" />
        <path d="m8 12 2 2" />
        <path d="m10.5 9.5 1.5 1.5" />
        <path d="m13 7 2 2" />
      </svg>
    );
  }
  if (name === "geometry") {
    return (
      <svg {...common}>
        <path d="M12 4 20 18H4L12 4Z" />
        <circle cx="15.8" cy="9" r="2.2" />
      </svg>
    );
  }
  if (name === "milestone") {
    return (
      <svg {...common}>
        <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
        <path d="M8 5H5.5A2.5 2.5 0 0 0 8 10" />
        <path d="M16 5h2.5A2.5 2.5 0 0 1 16 10" />
        <path d="M12 11v4" />
        <path d="M8.5 20h7" />
        <path d="M10 15h4l1 5H9l1-5Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" />
      <path d="M8.5 12h7" />
    </svg>
  );
}

function TileHeading({ icon, label }: { icon: LearnaIconName; label: string }) {
  return (
    <div className="learna-tile-heading">
      <span className="learna-icon-pill">
        <LearnaIcon name={icon} size={18} />
      </span>
      <span>{label}</span>
    </div>
  );
}

function startOfWeek(value: Date) {
  const date = new Date(value);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return date;
}

function pathwayHref(learnerId: string, strandKey?: string | null) {
  const params = new URLSearchParams();
  if (learnerId) params.set("learnerId", learnerId);
  if (strandKey) params.set("strandKey", strandKey);
  const query = params.toString();
  return query ? `/my-pathways?${query}` : "/my-pathways";
}

function learnerQueryHref(path: string, learnerId: string) {
  return learnerId ? `${path}?learner_id=${encodeURIComponent(learnerId)}` : path;
}

function appendQueryParam(href: string, key: string, value: string) {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

function ProgressRing({
  value,
  label,
  colour,
  size = 86,
}: {
  value: number;
  label: string;
  colour: string;
  size?: number;
}) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  const ringLabel = label || `${safeValue}%`;
  return (
    <div
      className="learna-progress-ring"
      aria-label={`${ringLabel}: ${safeValue}%`}
      style={
        {
          "--ring-colour": colour,
          "--ring-value": `${safeValue * 3.6}deg`,
          width: size,
          height: size,
        } as React.CSSProperties
      }
    >
      <span>{ringLabel}</span>
    </div>
  );
}

function RadarChart({ summaries }: { summaries: LearnaStrandSummary[] }) {
  const cx = 90;
  const cy = 90;
  const radius = 60;
  const points = summaries.map((summary, index) => {
    const angle = (-90 + index * 60) * (Math.PI / 180);
    const valueRadius = radius * (summary.radarValue / 100);
    return {
      axisX: cx + Math.cos(angle) * radius,
      axisY: cy + Math.sin(angle) * radius,
      valueX: cx + Math.cos(angle) * valueRadius,
      valueY: cy + Math.sin(angle) * valueRadius,
      labelX: cx + Math.cos(angle) * (radius + 20),
      labelY: cy + Math.sin(angle) * (radius + 20),
      summary,
    };
  });
  const polygon = points.map((point) => `${point.valueX},${point.valueY}`).join(" ");

  return (
    <svg className="learna-radar" viewBox="0 0 180 180" role="img" aria-label="Learning shape radar">
      <title>Learning Shape</title>
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={points
            .map((point, index) => {
              const angle = (-90 + index * 60) * (Math.PI / 180);
              return `${cx + Math.cos(angle) * radius * scale},${cy + Math.sin(angle) * radius * scale}`;
            })
            .join(" ")}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />
      ))}
      {points.map((point) => (
        <line
          key={point.summary.code}
          x1={cx}
          y1={cy}
          x2={point.axisX}
          y2={point.axisY}
          stroke="#cbd5e1"
          strokeWidth="1.2"
        />
      ))}
      <polygon points={polygon} fill="rgba(37,99,235,0.3)" stroke="#1d4ed8" strokeWidth="3.2" />
      {points.map((point) => (
        <g key={point.summary.code}>
          <circle cx={point.valueX} cy={point.valueY} r="4.2" fill={point.summary.colour} />
          <text
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="900"
            fill="#334155"
          >
            {point.summary.code}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TrendLine({ points }: { points: LearnaTrendPoint[] }) {
  const width = 260;
  const height = 116;
  const pad = 16;
  const max = Math.max(1, ...points.map((point) => point.count));
  const coords = points.map((point, index) => {
    const x = pad + (index / Math.max(1, points.length - 1)) * (width - pad * 2);
    const y = height - pad - (point.count / max) * (height - pad * 2);
    return { x, y, point };
  });
  const line = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
  const latest = coords[coords.length - 1];

  return (
    <svg className="learna-trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evidence trend by week">
      <title>Evidence trend</title>
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e2e8f0" />
      <polyline
        points={line}
        fill="none"
        stroke="#0d9488"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((coord) => (
        <g key={coord.point.weekStart}>
          <circle cx={coord.x} cy={coord.y} r={coord === latest ? "6" : "4"} fill="#0d9488" />
          <text x={coord.x} y={height - 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">
            {coord.point.label.split(" ")[0]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function BalanceBar({ summaries }: { summaries: LearnaStrandSummary[] }) {
  const total = summaries.reduce((sum, summary) => sum + summary.evidenceCount, 0);
  return (
    <div className="learna-balance" aria-label="Evidence balance by maths strand">
      <div className="learna-balance-bar">
        {summaries.map((summary) => (
          <span
            key={summary.code}
            style={{
              background: summary.colour,
              flexGrow: total > 0 ? Math.max(1, summary.evidenceCount) : 1,
            }}
            title={`${summary.shortLabel}: ${summary.evidenceCount}`}
          />
        ))}
      </div>
      <div className="learna-mini-legend">
        {summaries.map((summary) => (
          <span key={summary.code}>
            <i style={{ background: summary.colour }} />
            {summary.code}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatTile({
  heading,
  value,
  chips,
  href,
  icon,
  colour = "#2563eb",
  ringValue,
}: {
  heading: string;
  value: string;
  chips: string[];
  href: string;
  icon: LearnaIconName;
  colour?: string;
  ringValue?: number;
}) {
  return (
    <Link className="learna-tile learna-stat-tile" href={href}>
      <TileHeading icon={icon} label={heading} />
      <div className="learna-stat-main">
        <strong style={{ color: colour }}>{value}</strong>
        {typeof ringValue === "number" ? (
          <ProgressRing value={ringValue} label={`${Math.round(ringValue)}%`} colour={colour} size={48} />
        ) : null}
      </div>
      <div className="learna-chip-row">
        {chips.map((chip) => (
          <small key={chip}>{chip}</small>
        ))}
      </div>
    </Link>
  );
}

function StrandTile({ summary, learnerId }: { summary: LearnaStrandSummary; learnerId: string }) {
  const ratio = summary.totalSteps > 0 ? (summary.secureSteps / summary.totalSteps) * 100 : 0;
  const active = summary.evidenceCount > 0 || summary.secureSteps > 0;
  return (
    <Link
      className={`learna-tile learna-strand-tile ${active ? "is-active" : "is-quiet"}`}
      href={pathwayHref(learnerId, summary.key)}
      style={
        active
          ? ({
              "--strand-colour": summary.colour,
              background: `linear-gradient(135deg, #ffffff 0%, ${summary.colour}14 100%)`,
            } as React.CSSProperties)
          : ({ "--strand-colour": summary.colour } as React.CSSProperties)
      }
      aria-label={`${summary.shortLabel}: ${summary.secureSteps} secure, ${summary.evidenceCount} evidence`}
    >
      <div className="learna-tile-row">
        <span className="learna-strand-icon" style={{ color: summary.colour }}>
          <LearnaIcon name={strandIconName(summary.key)} size={22} />
        </span>
        <ProgressRing value={ratio} label={`${summary.secureSteps}`} colour={summary.colour} size={54} />
      </div>
      <strong>{summary.shortLabel}</strong>
      <div className="learna-strand-metrics">
        <span>{summary.code}</span>
        <span>{summary.evidenceCount}</span>
      </div>
      {summary.latestStatus ? <em>{statusShortLabel(summary.latestStatus)}</em> : <em>{active ? "Active" : "Quiet"}</em>}
    </Link>
  );
}

function MilestonesTile({ milestones }: { milestones: LearnaMilestone[] }) {
  const active = milestones.filter((milestone) => milestone.active);
  return (
    <section className="learna-tile learna-wide-tile">
      <div className="learna-section-head">
        <TileHeading icon="milestone" label="Milestones" />
        <strong>{active.length}</strong>
      </div>
      <div className="learna-milestone-grid">
        {milestones.map((milestone) => (
          <span
            key={milestone.id}
            className={milestone.active ? "is-active" : ""}
            aria-label={`${milestone.label}: ${milestone.active ? "active" : "not yet"}`}
            title={milestone.label}
          >
            <LearnaIcon name={milestoneIconName(milestone)} size={20} />
            {milestoneShortLabel(milestone)}
          </span>
        ))}
      </div>
    </section>
  );
}

function CleanLearnaWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [evidenceEntries, setEvidenceEntries] = useState<CleanEvidenceEntry[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const learnerFromQuery = searchParams.get("learner_id") || searchParams.get("learnerId") || "";
  const learners = workspace.learners;
  const selectedLearner = learners.find((learner) => learner.id === selectedLearnerId) ?? null;
  const selectedLearnerLabel = getLearnerLabel(selectedLearner);
  const learnerStageLabel = selectedLearner?.yearLevel || "Learner";

  useEffect(() => {
    if (!learners.length) {
      setSelectedLearnerId("");
      return;
    }

    if (selectedLearnerId && learners.some((learner) => learner.id === selectedLearnerId)) return;

    const queryLearner = learners.find((learner) => learner.id === learnerFromQuery);
    setSelectedLearnerId(queryLearner?.id || learners[0]?.id || "");
  }, [learnerFromQuery, learners, selectedLearnerId]);

  useEffect(() => {
    let cancelled = false;

    async function loadEvidence() {
      if (!workspace.profile?.id || !selectedLearnerId) {
        setEvidenceEntries([]);
        setEvidenceLoading(false);
        return;
      }

      setEvidenceLoading(true);
      setEvidenceError(null);

      try {
        const entries = await listCleanEvidenceEntries(workspace.profile.id, {
          learnerId: selectedLearnerId,
          limit: 250,
        });
        if (!cancelled) setEvidenceEntries(entries);
      } catch (error) {
        if (!cancelled) {
          setEvidenceEntries([]);
          setEvidenceError(
            normalizeCleanErrorMessage(error, "We could not load learner evidence right now."),
          );
        }
      } finally {
        if (!cancelled) setEvidenceLoading(false);
      }
    }

    void loadEvidence();

    return () => {
      cancelled = true;
    };
  }, [selectedLearnerId, workspace.profile?.id]);

  const totalStepsByStrand = useMemo(() => {
    const totals: Partial<Record<LearnaMathStrandKey, number>> = {};
    for (const strand of LEARNA_MATH_STRANDS) {
      totals[strand.key] = MATH_WORKSHEET_RESOURCES.filter(
        (resource) => resource.strandKey === strand.key,
      ).length;
    }
    return totals;
  }, []);

  const now = useMemo(() => new Date(), []);
  const thisWeekStart = useMemo(() => startOfWeek(now), [now]);
  const evidenceThisWeek = evidenceEntries.filter((entry) => {
    const date = new Date(entry.observedOn || entry.createdAt || "");
    return !Number.isNaN(date.getTime()) && date >= thisWeekStart;
  }).length;
  const photoEvidenceCount = evidenceEntries.filter(
    (entry) => Boolean(entry.imageUrl) || entry.attachmentUrls.length > 0,
  ).length;
  const reportReadyCount = evidenceEntries.filter((entry) => entry.includeInReport).length;
  const secureStepCount = evidenceEntries.filter((entry) =>
    isLearnaSecureProgress(getLearnaProgressLabel(entry)),
  ).length;
  const totalStepCount = Object.values(totalStepsByStrand).reduce((sum, count) => sum + (count ?? 0), 0);
  const strandSummaries = useMemo(
    () => buildLearnaStrandSummaries(evidenceEntries, totalStepsByStrand),
    [evidenceEntries, totalStepsByStrand],
  );
  const trendSeries = useMemo(
    () => buildLearnaTrendSeries(evidenceEntries, { weeks: 8, today: now }),
    [evidenceEntries, now],
  );
  const milestones = useMemo(
    () => buildLearnaMilestones(evidenceEntries, { secureStepCount, reportReadyCount }),
    [evidenceEntries, reportReadyCount, secureStepCount],
  );
  const latestCaptures = evidenceEntries.slice(0, 5);
  const latestPathwayEvidence =
    evidenceEntries.find((entry) => parsePathwayContextFromNodeIds(entry.curriculumNodeIds)) ||
    evidenceEntries[0] ||
    null;
  const focusContext = latestPathwayEvidence
    ? parsePathwayContextFromNodeIds(latestPathwayEvidence.curriculumNodeIds)
    : null;
  const focusStatus = latestPathwayEvidence ? getLearnaProgressLabel(latestPathwayEvidence) : null;
  const focusStrand =
    strandSummaries.find(
      (summary) =>
        summary.key === focusContext?.pathwayKey ||
        summary.label.toLowerCase() === String(focusContext?.pathwayLabel ?? "").toLowerCase(),
    ) || strandSummaries.find((summary) => summary.evidenceCount > 0) || strandSummaries[0];

  if (workspace.loading) {
    return <V2LoadingState title="Building learner profile" body="Learner story tiles are loading." />;
  }

  if (workspace.schemaMissing) {
    return (
      <section className="learna-shell">
        <div className="learna-tile">
          <strong>My Learna</strong>
          <span>Workspace setup needed</span>
        </div>
      </section>
    );
  }

  if (!workspace.profile) {
    return (
      <section className="learna-shell">
        <CleanFirstRunSetupGate currentStep="portfolio" />
      </section>
    );
  }

  const pageTitle = selectedLearner ? `${selectedLearnerLabel}'s Learna` : "My Learna";
  const secureRatio = totalStepCount > 0 ? (secureStepCount / totalStepCount) * 100 : 0;
  const reportRatio = evidenceEntries.length > 0 ? (reportReadyCount / evidenceEntries.length) * 100 : 0;
  const focusColour = focusStrand?.colour || "#2563eb";
  const focusChip = focusStatus ? statusColours[focusStatus] || statusColours.Consolidating : null;
  const focusStepTitle =
    focusContext?.stepTitle || latestPathwayEvidence?.title || focusStrand?.shortLabel || "Choose step";
  const focusStepNumber = focusContext?.stepNumber || "Next";
  const latestTrendValue = trendSeries[trendSeries.length - 1]?.count ?? 0;

  return (
    <section className="learna-shell">
      <style jsx global>{`
        .learna-shell {
          display: grid;
          gap: 18px;
          color: #0f172a;
        }

        .learna-header {
          display: grid;
          gap: 12px;
          grid-template-columns: minmax(0, 1fr);
        }

        .learna-title-row {
          display: flex;
          flex-wrap: wrap;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
        }

        .learna-title-row h1 {
          margin: 0;
          font-size: clamp(26px, 4vw, 42px);
          line-height: 1;
          letter-spacing: 0;
          font-weight: 780;
        }

        .learna-title-row span {
          color: #64748b;
          font-size: 11px;
          font-weight: 720;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .learna-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 10px;
          align-items: stretch;
        }

        .learna-tile {
          min-width: 0;
          border: 1px solid #dbe4ef;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 7px 18px rgba(23, 32, 75, 0.045);
          padding: 12px;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
        }

        .learna-tile-heading {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          color: #64748b;
          font-size: 11px;
          font-weight: 720;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .learna-icon-pill,
        .learna-strand-icon {
          display: inline-grid;
          place-items: center;
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
          border: 1px solid #e7eaf2;
          border-radius: 12px;
          background: #f8fafc;
          color: #17204b;
        }

        .learna-screen-reader-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .learna-identity {
          grid-column: span 3;
          display: grid;
          gap: 12px;
        }

        .learna-avatar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .learna-avatar {
          display: grid;
          place-items: center;
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: #17204b;
          color: #ffffff;
          font-size: 21px;
          font-weight: 760;
        }

        .learna-identity strong,
        .learna-section-head strong {
          display: block;
          font-size: 24px;
          line-height: 1;
          font-weight: 780;
        }

        .learna-identity > span,
        .learna-section-head > span,
        .learna-stat-tile > span {
          color: #64748b;
          font-size: 11px;
          font-weight: 720;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .learna-select {
          width: 100%;
          min-height: 44px;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          background: #f8fafc;
          color: #0f172a;
          padding: 0 12px;
          font-weight: 720;
        }

        .learna-focus {
          grid-column: span 5;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 12px;
          align-items: center;
          background: linear-gradient(135deg, #ffffff 0%, #f3f7ff 100%);
        }

        .learna-focus h2 {
          margin: 0;
          font-size: clamp(28px, 4vw, 46px);
          line-height: 1.05;
          font-weight: 800;
        }

        .learna-focus-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .learna-chip {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          border: 1px solid #dbe4ef;
          border-radius: 999px;
          background: #f8fafc;
          padding: 0 10px;
          color: #475569;
          font-size: 12px;
          font-weight: 720;
        }

        .learna-action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
        }

        .learna-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          border-radius: 14px;
          border: 1px solid #0f172a;
          background: #0f172a;
          color: #ffffff;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 760;
          text-decoration: none;
        }

        .learna-button.is-secondary {
          border-color: #cbd5e1;
          background: #ffffff;
          color: #0f172a;
        }

        .learna-stat-tile {
          grid-column: span 2;
          display: grid;
          gap: 10px;
          min-height: 116px;
        }

        .learna-stat-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .learna-stat-tile strong {
          font-size: clamp(30px, 5vw, 46px);
          line-height: 1;
          font-weight: 820;
        }

        .learna-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .learna-chip-row small {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          border-radius: 999px;
          background: #f1f5f9;
          padding: 0 9px;
          color: #64748b;
          font-size: 12px;
          font-weight: 720;
        }

        .learna-chart-tile {
          grid-column: span 4;
          display: grid;
          gap: 10px;
          min-height: 218px;
        }

        .learna-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .learna-radar,
        .learna-trend {
          width: 100%;
          height: auto;
          min-height: 170px;
        }

        .learna-balance {
          display: grid;
          gap: 14px;
          align-self: center;
        }

        .learna-balance-bar {
          display: flex;
          height: 42px;
          overflow: hidden;
          border-radius: 999px;
          background: #eef2f7;
        }

        .learna-balance-bar span {
          min-width: 14px;
        }

        .learna-mini-legend,
        .learna-strand-metrics,
        .learna-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .learna-mini-legend span,
        .learna-strand-metrics span,
        .learna-badge-row span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 30px;
          border-radius: 999px;
          background: #f8fafc;
          padding: 0 9px;
          color: #475569;
          font-size: 12px;
          font-weight: 720;
        }

        .learna-mini-legend i {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }

        .learna-strand-tile {
          grid-column: span 2;
          display: grid;
          gap: 9px;
          min-height: 154px;
          border-color: color-mix(in srgb, var(--strand-colour) 22%, #dbe4ef);
          position: relative;
        }

        .learna-strand-tile.is-active {
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
        }

        .learna-strand-tile.is-active::before {
          content: "";
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--strand-colour);
          position: absolute;
          right: 12px;
          top: 12px;
        }

        .learna-strand-tile.is-quiet {
          opacity: 0.5;
          box-shadow: none;
        }

        .learna-tile-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .learna-strand-code {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          height: 34px;
          border: 1px solid;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 760;
        }

        .learna-strand-tile strong {
          font-size: 21px;
          line-height: 1.05;
          font-weight: 780;
        }

        .learna-strand-tile em {
          color: #64748b;
          font-size: 12px;
          font-style: normal;
          font-weight: 720;
        }

        .learna-progress-ring {
          display: grid;
          place-items: center;
          border-radius: 999px;
          background:
            radial-gradient(circle at center, #ffffff 0 56%, transparent 57%),
            conic-gradient(var(--ring-colour) 0 var(--ring-value), #e2e8f0 var(--ring-value) 360deg);
        }

        .learna-progress-ring span {
          color: #0f172a;
          font-size: 15px;
          font-weight: 780;
        }

        .learna-captures {
          grid-column: span 8;
          display: grid;
          gap: 10px;
        }

        .learna-capture-strip {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(132px, 1fr);
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-gutter: stable;
        }

        .learna-capture-card {
          min-width: 0;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #f8fafc;
          padding: 8px;
          display: grid;
          gap: 7px;
          color: inherit;
          text-decoration: none;
        }

        .learna-capture-media {
          position: relative;
          min-height: 86px;
        }

        .learna-capture-status {
          position: absolute;
          left: 8px;
          bottom: 8px;
          max-width: calc(100% - 16px);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.85);
          border-radius: 999px;
          background: rgba(15,23,42,0.82);
          color: #ffffff !important;
          padding: 4px 8px;
          font-size: 11px !important;
          font-weight: 760 !important;
        }

        .learna-capture-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .learna-capture-meta span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #64748b;
          font-size: 12px;
          font-weight: 760;
        }

        .learna-wide-tile {
          grid-column: span 4;
          display: grid;
          gap: 10px;
        }

        .learna-milestone-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .learna-milestone-grid span {
          display: grid;
          place-items: center;
          gap: 5px;
          min-height: 66px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #f8fafc;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 760;
          text-align: center;
        }

        .learna-milestone-grid span.is-active {
          border-color: #bbf7d0;
          background: #ecfdf5;
          color: #047857;
        }

        .learna-empty {
          display: grid;
          place-items: center;
          min-height: 120px;
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
          color: #64748b;
          font-size: 13px;
          font-weight: 900;
        }

        @media (max-width: 920px) {
          .learna-identity,
          .learna-focus,
          .learna-chart-tile,
          .learna-captures,
          .learna-wide-tile {
            grid-column: span 12;
          }

          .learna-stat-tile,
          .learna-strand-tile {
            grid-column: span 6;
          }
        }

        @media (max-width: 520px) {
          .learna-shell {
            gap: 14px;
          }

          .learna-grid {
            gap: 10px;
          }

          .learna-tile {
            border-radius: 18px;
            padding: 13px;
          }

          .learna-focus {
            grid-template-columns: 1fr;
          }

          .learna-action-row .learna-button {
            width: 100%;
          }

          .learna-stat-tile {
            min-height: 126px;
          }

          .learna-strand-tile {
            min-height: 166px;
          }
        }
      `}</style>

      <CleanFirstRunSetupGate currentStep="portfolio" />

      <div className="learna-header">
        <div className="learna-title-row">
          <div>
            <span>Evidence - Progress - Growth</span>
            <h1>{pageTitle}</h1>
          </div>
          {evidenceLoading ? <span>Loading tiles</span> : null}
        </div>
      </div>

      {evidenceError ? (
        <div className="learna-tile" role="status">
          <strong>Evidence</strong>
          <span>{evidenceError}</span>
        </div>
      ) : null}

      <div className="learna-grid">
        <section className="learna-tile learna-identity">
          <TileHeading icon="learner" label="Learner" />
          <div className="learna-avatar-row">
            <div className="learna-avatar" aria-hidden="true">
              {getLearnerInitials(selectedLearnerLabel)}
            </div>
            <div>
              <strong>{selectedLearner ? selectedLearnerLabel : "Choose learner"}</strong>
              <div className="learna-chip">{learnerStageLabel}</div>
            </div>
          </div>
          <select
            className="learna-select"
            value={selectedLearnerId}
            aria-label="Choose learner"
            onChange={(event) => {
              const nextLearnerId = event.target.value;
              setSelectedLearnerId(nextLearnerId);
              const params = new URLSearchParams(searchParams.toString());
              if (nextLearnerId) params.set("learner_id", nextLearnerId);
              router.replace(`/my-learna?${params.toString()}`);
            }}
          >
            {learners.length ? null : <option value="">Choose learner</option>}
            {learners.map((learner) => (
              <option key={learner.id} value={learner.id}>
                {getLearnerLabel(learner)}
              </option>
            ))}
          </select>
        </section>

        <section className="learna-tile learna-focus" aria-label={`Current focus: ${focusStepTitle}`}>
          <ProgressRing
            value={focusStrand?.radarValue ?? 0}
            label={focusStepNumber === "Next" ? "Next" : `S${focusStepNumber}`}
            colour={focusColour}
          />
          <div>
            <div className="learna-section-head">
              <TileHeading icon="focus" label="Focus" />
              {focusChip ? (
                <span
                  className="learna-chip"
                  style={{ background: focusChip.bg, borderColor: focusChip.border, color: focusChip.fg }}
                >
                  {statusShortLabel(focusStatus)}
                </span>
              ) : null}
            </div>
            <h2 title={focusStepTitle}>{focusStrand?.shortLabel || "Maths"}</h2>
            <div className="learna-focus-meta">
              <span className="learna-chip">Step {focusStepNumber}</span>
              {focusContext?.stageLabel ? <span className="learna-chip">{focusContext.stageLabel}</span> : null}
              <span className="learna-screen-reader-only">{focusStepTitle}</span>
            </div>
            <div className="learna-action-row">
              <Link className="learna-button" href={pathwayHref(selectedLearnerId, focusStrand?.key)}>
                Open
              </Link>
              <Link className="learna-button is-secondary" href={learnerQueryHref("/my-capture", selectedLearnerId)}>
                Add Evidence
              </Link>
            </div>
          </div>
        </section>

        <StatTile
          heading="Evidence"
          value={String(evidenceEntries.length)}
          chips={[`+${evidenceThisWeek}`, `${photoEvidenceCount} photos`]}
          href={learnerQueryHref("/my-portfolio", selectedLearnerId)}
          icon="camera"
          colour="#2563eb"
        />
        <StatTile
          heading="Secure"
          value={`${secureStepCount}`}
          chips={[`${Math.round(secureRatio)}%`, "steps"]}
          href={pathwayHref(selectedLearnerId)}
          icon="check"
          colour="#16a34a"
          ringValue={secureRatio}
        />
        <StatTile
          heading="Record"
          value={evidenceEntries.length > 0 ? "Ready" : "0"}
          chips={["Download"]}
          href={learnerQueryHref("/my-portfolio", selectedLearnerId)}
          icon="record"
          colour="#0f172a"
        />
        <StatTile
          heading="Reports"
          value={String(reportReadyCount)}
          chips={[`${Math.round(reportRatio)}%`, "ready"]}
          href={learnerQueryHref("/my-reports", selectedLearnerId)}
          icon="report"
          colour="#7c3aed"
          ringValue={reportRatio}
        />

        <section className="learna-tile learna-chart-tile">
          <div className="learna-section-head">
            <TileHeading icon="shape" label="Learning Shape" />
            <strong>{strandSummaries.filter((summary) => summary.evidenceCount > 0).length}/6</strong>
          </div>
          <RadarChart summaries={strandSummaries} />
        </section>

        <section className="learna-tile learna-chart-tile">
          <div className="learna-section-head">
            <TileHeading icon="trend" label="Trend" />
            <strong>{latestTrendValue}</strong>
          </div>
          <TrendLine points={trendSeries} />
        </section>

        <section className="learna-tile learna-chart-tile">
          <div className="learna-section-head">
            <TileHeading icon="balance" label="Balance" />
            <strong>{strandSummaries.filter((summary) => summary.evidenceCount > 0).length}</strong>
          </div>
          <BalanceBar summaries={strandSummaries} />
        </section>

        {strandSummaries.map((summary) => (
          <StrandTile key={summary.key} summary={summary} learnerId={selectedLearnerId} />
        ))}

        <section className="learna-tile learna-captures">
          <div className="learna-section-head">
            <TileHeading icon="capture" label="Latest Captures" />
            <strong>{latestCaptures.length}</strong>
          </div>
          {latestCaptures.length ? (
            <div className="learna-capture-strip" aria-label="Latest learner captures">
              {latestCaptures.map((entry) => {
                const preview = getEvidencePreviewImage(entry);
                const pathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
                const captureStrandKey = inferLearnaEvidenceStrand(entry);
                const captureStrand = strandSummaries.find((summary) => summary.key === captureStrandKey);
                const progressLabel = statusShortLabel(getLearnaProgressLabel(entry));
                return (
                  <Link
                    key={entry.id}
                    className="learna-capture-card"
                    href={appendQueryParam(
                      learnerQueryHref("/my-portfolio", selectedLearnerId),
                      "latestEvidenceId",
                      entry.id,
                    )}
                  >
                    <div className="learna-capture-media">
                      {preview ? (
                        <EvidenceThumbnail image={preview} width={128} height={86} />
                      ) : (
                        <div className="learna-empty">Capture</div>
                      )}
                      <span className="learna-capture-status">{progressLabel}</span>
                    </div>
                    <div className="learna-capture-meta">
                      <span style={{ color: captureStrand?.colour || "#64748b" }}>
                        {captureStrand?.shortLabel || pathwayContext?.pathwayLabel || entry.learningArea || "Portfolio"}
                      </span>
                      <span>{formatCompactDate(entry.observedOn)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Link className="learna-empty" href={learnerQueryHref("/my-capture", selectedLearnerId)}>
              Add evidence
            </Link>
          )}
        </section>

        <MilestonesTile milestones={milestones} />
      </div>
    </section>
  );
}

export default function CleanLearnaWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanLearnaWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
