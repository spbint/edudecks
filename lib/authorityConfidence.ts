import type { ReportDraftRow } from "@/lib/reportDrafts";
import type { AuthorityPackConfig } from "@/lib/authorityPackConfig";
import type { AuthorityEvidenceRow } from "@/lib/authorityPackData";

/* ───────────────────────── TYPES ───────────────────────── */

export type AuthorityConfidenceResult = {
  score: number;
  band: "ready" | "strong" | "developing" | "attention";
  checklist: {
    label: string;
    passed: boolean;
  }[];
  insights: string[];
};

/* ───────────────────────── HELPERS ───────────────────────── */

function daysBetween(dateStr?: string | null) {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function getLatestEvidenceDays(rows: AuthorityEvidenceRow[]) {
  if (!rows.length) return 999;
  const dates = rows.map((r) => new Date(r.occurredOn).getTime());
  const latest = Math.max(...dates);
  return Math.floor((Date.now() - latest) / (1000 * 60 * 60 * 24));
}

/* ───────────────────────── MAIN ENGINE ───────────────────────── */

export function buildAuthorityConfidence(
  draft: ReportDraftRow,
  config: AuthorityPackConfig,
  evidenceRows: AuthorityEvidenceRow[]
): AuthorityConfidenceResult {
  let score = 0;
  const insights: string[] = [];

  const total = evidenceRows.length;
  const areas = new Set(evidenceRows.map((r) => r.learningArea));
  const required = evidenceRows.filter((r) => r.required).length;
  const core = evidenceRows.filter((r) => r.role !== "appendix").length;
  const latestDays = getLatestEvidenceDays(evidenceRows);

  /* ───────────────── SCORE COMPONENTS ───────────────── */

  // Volume
  if (total >= 5) score += 25;
  else if (total >= 3) score += 18;
  else if (total >= 1) score += 10;

  // Coverage
  if (areas.size >= 4) score += 20;
  else if (areas.size >= 3) score += 14;
  else if (areas.size >= 2) score += 8;

  // Required
  if (required >= 1) score += 15;
  else insights.push("Mark at least one evidence item as required.");

  // Core
  if (core >= 2) score += 15;
  else insights.push("Add at least two core evidence items.");

  // Recency
  if (latestDays <= 21) score += 15;
  else if (latestDays <= 45) score += 8;
  else insights.push("Add more recent evidence (last 3–4 weeks ideal).");

  // Structure
  if (config.includeSections?.coverage) score += 5;
  if (config.includeSections?.evidence) score += 5;

  score = Math.min(score, 100);

  /* ───────────────── BANDING ───────────────── */

  let band: AuthorityConfidenceResult["band"] = "attention";
  if (score >= 80) band = "ready";
  else if (score >= 65) band = "strong";
  else if (score >= 45) band = "developing";

  /* ───────────────── CHECKLIST ───────────────── */

  const checklist = [
    {
      label: "At least 3 evidence items included",
      passed: total >= 3,
    },
    {
      label: "Balanced learning areas (3+)",
      passed: areas.size >= 3,
    },
    {
      label: "At least 1 required evidence item",
      passed: required >= 1,
    },
    {
      label: "Recent evidence included (≤ 30 days)",
      passed: latestDays <= 30,
    },
    {
      label: "At least 2 core evidence items",
      passed: core >= 2,
    },
  ];

  /* ───────────────── EXTRA INSIGHTS ───────────────── */

  if (total < 3) {
    insights.push("Add more evidence to strengthen submission credibility.");
  }

  if (areas.size < 3) {
    insights.push("Increase subject coverage for a more balanced profile.");
  }

  return {
    score,
    band,
    checklist,
    insights,
  };
}