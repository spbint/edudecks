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
  return (
    <div
      className="learna-progress-ring"
      aria-label={`${label}: ${safeValue}%`}
      style={
        {
          "--ring-colour": colour,
          "--ring-value": `${safeValue * 3.6}deg`,
          width: size,
          height: size,
        } as React.CSSProperties
      }
    >
      <span>{label}</span>
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
          stroke="#dbe4ef"
          strokeWidth="1"
        />
      ))}
      {points.map((point) => (
        <line
          key={point.summary.code}
          x1={cx}
          y1={cy}
          x2={point.axisX}
          y2={point.axisY}
          stroke="#dbe4ef"
          strokeWidth="1"
        />
      ))}
      <polygon points={polygon} fill="rgba(37,99,235,0.22)" stroke="#2563eb" strokeWidth="2.5" />
      {points.map((point) => (
        <g key={point.summary.code}>
          <circle cx={point.valueX} cy={point.valueY} r="3.5" fill={point.summary.colour} />
          <text
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="800"
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

  return (
    <svg className="learna-trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evidence trend by week">
      <title>Evidence trend</title>
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e2e8f0" />
      <polyline
        points={line}
        fill="none"
        stroke="#0d9488"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((coord) => (
        <g key={coord.point.weekStart}>
          <circle cx={coord.x} cy={coord.y} r="4" fill="#0d9488" />
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
  meta,
  href,
  colour = "#2563eb",
}: {
  heading: string;
  value: string;
  meta: string;
  href: string;
  colour?: string;
}) {
  return (
    <Link className="learna-tile learna-stat-tile" href={href}>
      <span>{heading}</span>
      <strong style={{ color: colour }}>{value}</strong>
      <small>{meta}</small>
    </Link>
  );
}

function StrandTile({ summary, learnerId }: { summary: LearnaStrandSummary; learnerId: string }) {
  const ratio = summary.totalSteps > 0 ? (summary.secureSteps / summary.totalSteps) * 100 : 0;
  return (
    <Link className="learna-tile learna-strand-tile" href={pathwayHref(learnerId, summary.key)}>
      <div className="learna-tile-row">
        <span className="learna-strand-code" style={{ color: summary.colour, borderColor: summary.colour }}>
          {summary.code}
        </span>
        <ProgressRing value={ratio} label={`${summary.secureSteps}`} colour={summary.colour} size={54} />
      </div>
      <strong>{summary.shortLabel}</strong>
      <div className="learna-strand-metrics">
        <span>{summary.secureSteps} secure</span>
        <span>{summary.evidenceCount} evidence</span>
      </div>
      {summary.latestStatus ? <em>{summary.latestStatus}</em> : null}
    </Link>
  );
}

function MilestonesTile({ milestones }: { milestones: LearnaMilestone[] }) {
  const active = milestones.filter((milestone) => milestone.active);
  return (
    <section className="learna-tile learna-wide-tile">
      <div className="learna-section-head">
        <span>Milestones</span>
        <strong>{active.length}</strong>
      </div>
      <div className="learna-badge-row">
        {milestones.map((milestone) => (
          <span key={milestone.id} className={milestone.active ? "is-active" : ""}>
            {milestone.label}
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
          font-size: clamp(28px, 5vw, 52px);
          line-height: 0.95;
          letter-spacing: 0;
          font-weight: 950;
        }

        .learna-title-row span {
          color: #64748b;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .learna-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 14px;
          align-items: stretch;
        }

        .learna-tile {
          min-width: 0;
          border: 1px solid #dbe4ef;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
          padding: 16px;
          text-decoration: none;
          color: inherit;
          overflow: hidden;
        }

        .learna-identity {
          grid-column: span 3;
          display: grid;
          gap: 14px;
        }

        .learna-avatar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .learna-avatar {
          display: grid;
          place-items: center;
          width: 64px;
          height: 64px;
          border-radius: 22px;
          background: #0f172a;
          color: #ffffff;
          font-size: 22px;
          font-weight: 950;
        }

        .learna-identity strong,
        .learna-section-head strong {
          display: block;
          font-size: 26px;
          line-height: 1;
          font-weight: 950;
        }

        .learna-identity span,
        .learna-section-head span,
        .learna-stat-tile > span {
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
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
          font-weight: 800;
        }

        .learna-focus {
          grid-column: span 5;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 16px;
          align-items: center;
          background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
        }

        .learna-focus h2 {
          margin: 0;
          font-size: clamp(22px, 3vw, 34px);
          line-height: 1.05;
          font-weight: 950;
        }

        .learna-focus-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .learna-chip {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          border: 1px solid #dbe4ef;
          border-radius: 999px;
          background: #f8fafc;
          padding: 0 10px;
          color: #475569;
          font-size: 12px;
          font-weight: 900;
        }

        .learna-action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
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
          font-weight: 900;
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
          gap: 8px;
          min-height: 140px;
        }

        .learna-stat-tile strong {
          font-size: clamp(30px, 5vw, 46px);
          line-height: 1;
          font-weight: 950;
        }

        .learna-stat-tile small {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .learna-chart-tile {
          grid-column: span 4;
          display: grid;
          gap: 12px;
          min-height: 260px;
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
          height: 38px;
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
          font-weight: 900;
        }

        .learna-mini-legend i {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }

        .learna-strand-tile {
          grid-column: span 2;
          display: grid;
          gap: 11px;
          min-height: 178px;
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
          font-weight: 950;
        }

        .learna-strand-tile strong {
          font-size: 20px;
          line-height: 1.05;
          font-weight: 950;
        }

        .learna-strand-tile em {
          color: #64748b;
          font-size: 12px;
          font-style: normal;
          font-weight: 900;
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
          font-weight: 950;
        }

        .learna-captures {
          grid-column: span 8;
          display: grid;
          gap: 12px;
        }

        .learna-capture-strip {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(138px, 1fr);
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-gutter: stable;
        }

        .learna-capture-card {
          min-width: 0;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #f8fafc;
          padding: 10px;
          display: grid;
          gap: 8px;
          color: inherit;
          text-decoration: none;
        }

        .learna-capture-card strong {
          overflow: hidden;
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .learna-capture-card span {
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .learna-wide-tile {
          grid-column: span 4;
          display: grid;
          gap: 14px;
        }

        .learna-badge-row span.is-active {
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
          <span>Learner</span>
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

        <section className="learna-tile learna-focus">
          <ProgressRing value={focusStrand?.radarValue ?? 0} label={focusStrand?.code ?? "Focus"} colour={focusColour} />
          <div>
            <div className="learna-section-head">
              <span>Current Focus</span>
              {focusChip ? (
                <span
                  className="learna-chip"
                  style={{ background: focusChip.bg, borderColor: focusChip.border, color: focusChip.fg }}
                >
                  {focusStatus}
                </span>
              ) : null}
            </div>
            <h2>
              {focusContext?.stepTitle || latestPathwayEvidence?.title || focusStrand?.shortLabel || "Choose step"}
            </h2>
            <div className="learna-focus-meta">
              {focusContext?.stepNumber ? <span className="learna-chip">Step {focusContext.stepNumber}</span> : null}
              <span className="learna-chip">{focusStrand?.shortLabel || "Maths"}</span>
              {focusContext?.stageLabel ? <span className="learna-chip">{focusContext.stageLabel}</span> : null}
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
          meta={`+${evidenceThisWeek} week - ${photoEvidenceCount} photo`}
          href={learnerQueryHref("/my-portfolio", selectedLearnerId)}
          colour="#2563eb"
        />
        <StatTile
          heading="Secure"
          value={`${secureStepCount}`}
          meta={`${Math.round(secureRatio)}% steps`}
          href={pathwayHref(selectedLearnerId)}
          colour="#16a34a"
        />
        <StatTile
          heading="Record"
          value={evidenceEntries.length > 0 ? "Ready" : "0"}
          meta="Download"
          href={learnerQueryHref("/my-portfolio", selectedLearnerId)}
          colour="#0f172a"
        />
        <StatTile
          heading="Reports"
          value={String(reportReadyCount)}
          meta={`${Math.round(reportRatio)}% ready`}
          href={learnerQueryHref("/my-reports", selectedLearnerId)}
          colour="#7c3aed"
        />

        <section className="learna-tile learna-chart-tile">
          <div className="learna-section-head">
            <span>Learning Shape</span>
            <strong>{strandSummaries.filter((summary) => summary.evidenceCount > 0).length}/6</strong>
          </div>
          <RadarChart summaries={strandSummaries} />
        </section>

        <section className="learna-tile learna-chart-tile">
          <div className="learna-section-head">
            <span>Trend</span>
            <strong>{evidenceThisWeek}</strong>
          </div>
          <TrendLine points={trendSeries} />
        </section>

        <section className="learna-tile learna-chart-tile">
          <div className="learna-section-head">
            <span>Balance</span>
            <strong>{photoEvidenceCount}</strong>
          </div>
          <BalanceBar summaries={strandSummaries} />
        </section>

        {strandSummaries.map((summary) => (
          <StrandTile key={summary.key} summary={summary} learnerId={selectedLearnerId} />
        ))}

        <section className="learna-tile learna-captures">
          <div className="learna-section-head">
            <span>Latest Captures</span>
            <strong>{latestCaptures.length}</strong>
          </div>
          {latestCaptures.length ? (
            <div className="learna-capture-strip" aria-label="Latest learner captures">
              {latestCaptures.map((entry) => {
                const preview = getEvidencePreviewImage(entry);
                const pathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
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
                    {preview ? <EvidenceThumbnail image={preview} width={118} height={76} /> : <div className="learna-empty">Capture</div>}
                    <strong>{entry.title || entry.whatHappened || "Evidence"}</strong>
                    <span>{formatCompactDate(entry.observedOn)}</span>
                    <span>{pathwayContext?.pathwayLabel || entry.learningArea || "Portfolio"}</span>
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
