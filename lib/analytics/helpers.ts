import type { EvidenceEntryRow, InterventionRow, StudentRow } from "./types";

export function safe(v: any) {
  return String(v ?? "").trim();
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

export function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const last = safe(s.surname || s.family_name);
  return `${first}${last ? ` ${last}` : ""}`.trim() || "Student";
}

export function evidenceDate(ev: EvidenceEntryRow) {
  return safe(ev.occurred_on) || safe(ev.created_at);
}

export function reviewDate(iv: InterventionRow) {
  return safe(iv.review_due_on) || safe(iv.review_due_date) || safe(iv.next_review_on) || safe(iv.due_on);
}

export function daysSince(v: string | null | undefined) {
  if (!v) return 999;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 999;
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

export function areaMatches(area: string, patterns: string[]) {
  const a = area.toLowerCase();
  return patterns.some((p) => a.includes(p));
}

export function isOpenIntervention(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return !(s === "closed" || s === "done" || s === "resolved" || s === "archived");
}

export function scoreTrend(score: number): "up" | "flat" | "down" {
  if (score <= 8) return "down";
  if (score <= 12) return "flat";
  return "up";
}