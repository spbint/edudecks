"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id: string | null;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type EvidenceEntryRow = {
  id: string;
  student_id: string | null;
  class_id: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  learning_area?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type InterventionRow = {
  id: string;
  student_id: string | null;
  class_id: string | null;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  due_on?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: any;
};

type StudentBatchRow = {
  student_id: string;
  student_name: string;
  is_ilp: boolean;
  readiness_score: number;
  readiness_label: "Ready" | "Near Ready" | "Needs Attention" | "Not Ready";
  evidence_30d: number;
  last_evidence_days: number | null;
  overdue_reviews: number;
  open_plans: number;
  empty_areas: string[];
  weak_areas: string[];
  highlights: string[];
  concerns: string[];
  narrative_risk: boolean;
  finishability: "Ready to finalize" | "Needs review" | "Blocked";
  blocking_reason: string;
};

type DraftMode =
  | "concise_comment"
  | "teacher_paragraph"
  | "parent_summary"
  | "authority_note";

type ProductionStatus =
  | "untouched"
  | "draft_started"
  | "needs_evidence"
  | "ready_for_review"
  | "finalised";

type DraftState = {
  status: ProductionStatus;
  mode: DraftMode;
  draft: string;
  updatedAt: string;
};

type StoredDraftMap = Record<string, DraftState>;

type CompletionForecast = {
  total: number;
  untouched: number;
  draft_started: number;
  needs_evidence: number;
  ready_for_review: number;
  finalised: number;
  ready_to_finalize_now: number;
  blocked_now: number;
  completion_confidence: "On Track" | "Watch" | "At Risk";
};

type WritingGuidance = {
  starters: string[];
  safestEvidence: string[];
  missingNarrativeRisk: string | null;
  hardStop: string | null;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 90) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = safe(s.surname || s.family_name || s.last_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Student";
}

function daysSince(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function isClosedStatus(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return ["closed", "done", "resolved", "archived", "completed"].includes(s);
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function pickReviewDate(iv: InterventionRow) {
  return (
    safe(iv.review_due_on) ||
    safe(iv.review_due_date) ||
    safe(iv.next_review_on) ||
    safe(iv.due_on) ||
    ""
  );
}

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();
  if (x.includes("math")) return "Maths";
  if (x.includes("liter") || x.includes("reading") || x.includes("writing") || x.includes("english")) return "Literacy";
  if (x.includes("science")) return "Science";
  if (x.includes("well") || x.includes("pastoral") || x.includes("social") || x.includes("behaviour") || x.includes("behavior")) return "Wellbeing";
  if (x.includes("human") || x.includes("history") || x.includes("geography") || x.includes("hass")) return "Humanities";
  return "Other";
}

function readinessLabel(score: number): StudentBatchRow["readiness_label"] {
  if (score >= 85) return "Ready";
  if (score >= 70) return "Near Ready";
  if (score >= 50) return "Needs Attention";
  return "Not Ready";
}

function labelTone(label: StudentBatchRow["readiness_label"]) {
  if (label === "Ready") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (label === "Near Ready") return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
  if (label === "Needs Attention") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function finishTone(label: StudentBatchRow["finishability"]) {
  if (label === "Ready to finalize") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (label === "Needs review") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function productionTone(status: ProductionStatus) {
  if (status === "finalised") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (status === "ready_for_review") return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
  if (status === "draft_started") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  if (status === "needs_evidence") return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
  return { bg: "#f8fafc", bd: "#e2e8f0", fg: "#475569" };
}

function storageKey(classId: string) {
  return `edudecks.batchReports.${classId}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isoNow() {
  return new Date().toISOString();
}

function modeLabel(mode: DraftMode) {
  if (mode === "concise_comment") return "Concise comment";
  if (mode === "teacher_paragraph") return "Teacher paragraph";
  if (mode === "parent_summary") return "Parent summary";
  return "Authority note";
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f7fb",
  } as React.CSSProperties,

  main: {
    flex: 1,
    width: "100%",
    maxWidth: 1620,
    margin: "0 auto",
    padding: 22,
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 24,
    background: "linear-gradient(135deg, rgba(17,24,39,0.08), rgba(59,130,246,0.10))",
    padding: 18,
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  h1: {
    fontSize: 38,
    fontWeight: 950,
    lineHeight: 1.05,
    marginTop: 8,
    color: "#0f172a",
  } as React.CSSProperties,

  sub: {
    marginTop: 8,
    color: "#475569",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.45,
  } as React.CSSProperties,

  topBar: {
    display: "grid",
    gridTemplateColumns: "1fr 0.9fr auto auto",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
  } as React.CSSProperties,

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(8, minmax(120px, 1fr))",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  tile: {
    border: "1px solid #e8eaf0",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
    minHeight: 92,
  } as React.CSSProperties,

  tileK: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 900,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  } as React.CSSProperties,

  tileV: {
    marginTop: 6,
    fontSize: 28,
    color: "#0f172a",
    fontWeight: 950,
    lineHeight: 1.05,
  } as React.CSSProperties,

  tileS: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.35,
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: 14,
    marginTop: 14,
    alignItems: "start",
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginTop: 14,
  } as React.CSSProperties,

  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
  } as React.CSSProperties,

  sectionPad: {
    padding: 16,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  sectionHelp: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 1.45,
    color: "#64748b",
    fontWeight: 800,
  } as React.CSSProperties,

  list: {
    display: "grid",
    gap: 10,
    marginTop: 12,
  } as React.CSSProperties,

  item: {
    border: "1px solid #edf2f7",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
  } as React.CSSProperties,

  queueItem: {
    border: "1px solid #edf2f7",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
    cursor: "pointer",
  } as React.CSSProperties,

  itemTitle: {
    fontWeight: 950,
    color: "#0f172a",
    fontSize: 15,
    lineHeight: 1.3,
  } as React.CSSProperties,

  itemText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.45,
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

  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  textarea: {
    width: "100%",
    minHeight: 240,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.5,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  } as React.CSSProperties,

  ok: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #a7f3d0",
    background: "#ecfdf5",
    padding: 12,
    color: "#065f46",
    fontWeight: 900,
    fontSize: 13,
  } as React.CSSProperties,

  err: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
    fontSize: 13,
    lineHeight: 1.45,
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function BatchReportsPage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [draftMode, setDraftMode] = useState<DraftMode>("teacher_paragraph");
  const [draftText, setDraftText] = useState("");
  const [draftMap, setDraftMap] = useState<StoredDraftMap>({});

  async function loadClasses() {
    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level,teacher_name",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of tries) {
      const r = await supabase.from("classes").select(sel).order("year_level").order("name");
      if (!r.error) {
        const rows = ((r.data as any[]) ?? []) as ClassRow[];
        setClasses(rows);
        if (!classId && rows.length) setClassId(rows[0].id);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setClasses([]);
  }

  async function loadStudents(selectedClassId: string) {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,last_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,is_ilp",
      "id,class_id,first_name,preferred_name,is_ilp",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).eq("class_id", selectedClassId);
      if (!r.error) {
        setStudents(((r.data as any[]) ?? []) as StudentRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadEvidence(selectedClassId: string) {
    const tries = [
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,learning_area,occurred_on,created_at,is_deleted",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("class_id", selectedClassId)
        .eq("is_deleted", false)
        .limit(5000);

      if (!r.error) {
        setEvidenceEntries(((r.data as any[]) ?? []) as EvidenceEntryRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setEvidenceEntries([]);
  }

  async function loadInterventions(selectedClassId: string) {
    const tries = [
      "id,student_id,class_id,title,status,priority,review_due_on,review_due_date,next_review_on,due_on,created_at,updated_at",
      "id,student_id,class_id,status,priority,review_due_on,review_due_date,next_review_on,due_on,created_at,updated_at",
      "*",
    ];

    for (const sel of tries) {
      const r = await supabase.from("interventions").select(sel).eq("class_id", selectedClassId).limit(3000);
      if (!r.error) {
        setInterventions(((r.data as any[]) ?? []) as InterventionRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setInterventions([]);
  }

  async function loadAll(selectedClassId: string) {
    if (!selectedClassId) return;

    setBusy(true);
    setErr(null);

    try {
      await Promise.all([
        loadStudents(selectedClassId),
        loadEvidence(selectedClassId),
        loadInterventions(selectedClassId),
      ]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadClasses().catch((e) => setErr(String(e?.message ?? e)));
  }, []);

  useEffect(() => {
    if (!classId) return;
    loadAll(classId);
  }, [classId]);

  useEffect(() => {
    if (!classId || typeof window === "undefined") return;
    const stored = safeParse<StoredDraftMap>(window.localStorage.getItem(storageKey(classId)), {});
    setDraftMap(stored);
  }, [classId]);

  function persistDraftMap(next: StoredDraftMap) {
    setDraftMap(next);
    if (typeof window !== "undefined" && classId) {
      window.localStorage.setItem(storageKey(classId), JSON.stringify(next));
    }
  }

  const batchRows = useMemo<StudentBatchRow[]>(() => {
    return students.map((s) => {
      const studentEvidence = evidenceEntries
        .filter((e) => safe(e.student_id) === s.id)
        .sort((a, b) => safe(b.occurred_on || b.created_at).localeCompare(safe(a.occurred_on || a.created_at)));

      const studentPlans = interventions.filter((iv) => safe(iv.student_id) === s.id);

      const lastEvidence = studentEvidence[0]?.occurred_on || studentEvidence[0]?.created_at || null;
      const lastEvidenceDays = daysSince(lastEvidence);

      const evidence30d = studentEvidence.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d <= 30;
      }).length;

      const openPlans = studentPlans.filter((iv) => !isClosedStatus(iv.status)).length;

      const overdueReviews = studentPlans.filter((iv) => {
        if (isClosedStatus(iv.status)) return false;
        const review = pickReviewDate(iv);
        return review ? (daysSince(review) ?? 0) > 0 : false;
      }).length;

      const evidencePrev30d = studentEvidence.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d > 30 && d <= 60;
      }).length;

      const evidenceMomentumDelta = evidence30d - evidencePrev30d;

      const areas = ["Maths", "Literacy", "Science", "Wellbeing", "Humanities", "Other"];
      const areaCounts = new Map<string, number>();
      for (const area of areas) areaCounts.set(area, 0);

      for (const e of studentEvidence) {
        const area = guessArea(e.learning_area);
        areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
      }

      const emptyAreas = areas.filter((a) => (areaCounts.get(a) ?? 0) === 0);
      const weakAreas = areas.filter((a) => {
        const count = areaCounts.get(a) ?? 0;
        return count > 0 && count < 2;
      });

      let score = 100;
      if (lastEvidenceDays == null) score -= 25;
      else if (lastEvidenceDays > 45) score -= 20;
      else if (lastEvidenceDays > 30) score -= 10;

      if (evidence30d === 0) score -= 20;
      else if (evidence30d === 1) score -= 10;

      score -= overdueReviews * 12;
      score -= emptyAreas.length * 8;
      score -= weakAreas.length * 4;

      score = Math.max(0, Math.min(100, Math.round(score)));

      const highlights = studentEvidence
        .slice(0, 3)
        .map((e) => safe(e.title) || clip(safe(e.summary || e.body), 60))
        .filter(Boolean);

      const concerns: string[] = [];
      if (lastEvidenceDays == null || lastEvidenceDays > 45) concerns.push("stale evidence");
      if (evidence30d === 0) concerns.push("no evidence in 30d");
      if (overdueReviews > 0) concerns.push("overdue reviews");
      if (emptyAreas.length > 0) concerns.push(`missing ${emptyAreas.join(", ")}`);

      const narrativeCount = studentEvidence.filter((e) => safe(e.summary) || safe(e.body)).length;
      const narrativeRisk = narrativeCount < 2;

      let finishability: StudentBatchRow["finishability"] = "Ready to finalize";
      let blockingReason = "Enough evidence exists for confident final review.";

      if (emptyAreas.length >= 2 || evidence30d === 0 || overdueReviews > 1) {
        finishability = "Blocked";
        blockingReason = "Missing fresh evidence or unresolved support issues are likely to delay finalisation.";
      } else if (narrativeRisk || weakAreas.length > 1 || readinessLabel(score) === "Needs Attention") {
        finishability = "Needs review";
        blockingReason = "Draft can begin, but stronger narrative or evidence selection is still needed.";
      }

      return {
        student_id: s.id,
        student_name: studentDisplayName(s),
        is_ilp: Boolean(s.is_ilp),
        readiness_score: score,
        readiness_label: readinessLabel(score),
        evidence_30d: evidence30d,
        last_evidence_days: lastEvidenceDays,
        overdue_reviews: overdueReviews,
        open_plans: openPlans,
        empty_areas: emptyAreas,
        weak_areas: weakAreas,
        highlights,
        concerns,
        narrative_risk: narrativeRisk,
        finishability,
        blocking_reason: blockingReason,
      };
    });
  }, [students, evidenceEntries, interventions]);

  const filteredRows = useMemo(() => {
    return batchRows
      .filter((r) => {
        if (search && !r.student_name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.readiness_score - b.readiness_score);
  }, [batchRows, search]);

  const selectedRow = useMemo(
    () => filteredRows.find((r) => r.student_id === selectedStudentId) ?? filteredRows[0] ?? null,
    [filteredRows, selectedStudentId]
  );

  useEffect(() => {
    if (!selectedRow) return;
    setSelectedStudentId(selectedRow.student_id);
  }, [selectedRow?.student_id]);

  useEffect(() => {
    if (!selectedRow) {
      setDraftText("");
      return;
    }

    const saved = draftMap[selectedRow.student_id];
    if (saved && saved.mode === draftMode) {
      setDraftText(saved.draft);
      return;
    }

    const nextDraft = buildDraftReport(selectedRow, draftMode);
    setDraftText(nextDraft);
  }, [selectedRow?.student_id, draftMode, draftMap]);

  const completionForecast = useMemo<CompletionForecast>(() => {
    const total = batchRows.length;
    const statuses: ProductionStatus[] = batchRows.map((row) => {
      const stored = draftMap[row.student_id];
      if (stored) return stored.status;
      return "untouched";
    });

    const ready_to_finalize_now = batchRows.filter((r) => r.finishability === "Ready to finalize").length;
    const blocked_now = batchRows.filter((r) => r.finishability === "Blocked").length;

    let completion_confidence: CompletionForecast["completion_confidence"] = "On Track";
    if (total > 0 && ready_to_finalize_now / total < 0.55) completion_confidence = "At Risk";
    else if (total > 0 && ready_to_finalize_now / total < 0.75) completion_confidence = "Watch";

    return {
      total,
      untouched: statuses.filter((s) => s === "untouched").length,
      draft_started: statuses.filter((s) => s === "draft_started").length,
      needs_evidence: statuses.filter((s) => s === "needs_evidence").length,
      ready_for_review: statuses.filter((s) => s === "ready_for_review").length,
      finalised: statuses.filter((s) => s === "finalised").length,
      ready_to_finalize_now,
      blocked_now,
      completion_confidence,
    };
  }, [batchRows, draftMap]);

  const selectedStudentEvidence = useMemo(() => {
    if (!selectedRow) return [];
    return evidenceEntries
      .filter((e) => safe(e.student_id) === selectedRow.student_id)
      .sort((a, b) => safe(b.occurred_on || b.created_at).localeCompare(safe(a.occurred_on || a.created_at)))
      .slice(0, 6);
  }, [selectedRow, evidenceEntries]);

  const writingGuidance = useMemo<WritingGuidance | null>(() => {
    if (!selectedRow) return null;

    const starters =
      draftMode === "concise_comment"
        ? [
            `${selectedRow.student_name} has shown progress in`,
            `${selectedRow.student_name} is continuing to develop`,
            `${selectedRow.student_name} demonstrates growing confidence in`,
          ]
        : draftMode === "teacher_paragraph"
        ? [
            `${selectedRow.student_name} has engaged positively with class learning this period and has shown strengths in`,
            `Across the reporting period, ${selectedRow.student_name} has demonstrated developing capability in`,
            `${selectedRow.student_name} is making progress and has particularly shown understanding in`,
          ]
        : draftMode === "parent_summary"
        ? [
            `${selectedRow.student_name} has been working on`,
            `This term, ${selectedRow.student_name} has shown growth in`,
            `${selectedRow.student_name} can feel proud of progress in`,
          ]
        : [
            `Evidence indicates that ${selectedRow.student_name} has demonstrated`,
            `Current documentation shows developing attainment in`,
            `Available evidence supports reporting commentary in`,
          ];

    const safestEvidence = selectedStudentEvidence
      .map((e) => safe(e.title) || clip(safe(e.summary || e.body), 80))
      .filter(Boolean)
      .slice(0, 3);

    let missingNarrativeRisk: string | null = null;
    if (selectedRow.narrative_risk) {
      missingNarrativeRisk =
        "There is not enough descriptive evidence yet. Use care before finalising broad judgement statements.";
    }

    let hardStop: string | null = null;
    if (selectedRow.finishability === "Blocked") {
      hardStop = `Do not finalise until ${selectedRow.blocking_reason.toLowerCase()}`;
    } else if (selectedRow.empty_areas.includes("Maths")) {
      hardStop = "Do not finalise until at least one stronger Maths evidence point is captured.";
    } else if (selectedRow.overdue_reviews > 0) {
      hardStop = "Do not finalise until overdue support reviews are checked.";
    }

    return {
      starters,
      safestEvidence,
      missingNarrativeRisk,
      hardStop,
    };
  }, [selectedRow, draftMode, selectedStudentEvidence]);

  const selectedDraftState = selectedRow ? draftMap[selectedRow.student_id] : null;

  function buildDraftReport(row: StudentBatchRow, mode: DraftMode) {
    const strengths =
      row.highlights.length > 0
        ? row.highlights.slice(0, 2).join(" and ")
        : "participation across class learning";

    const concerns =
      row.concerns.length > 0
        ? row.concerns.join(", ")
        : "no major reporting concern";

    const gapText =
      row.empty_areas.length > 0
        ? `Coverage is still thin in ${row.empty_areas.join(", ")}.`
        : row.weak_areas.length > 0
        ? `Some areas still need stronger evidence depth, particularly ${row.weak_areas.join(", ")}.`
        : `Coverage across the visible learning areas is broadly balanced.`;

    if (mode === "concise_comment") {
      return `${row.student_name} has shown progress through ${strengths}. ${gapText}`;
    }

    if (mode === "parent_summary") {
      return `${row.student_name} has been working steadily this period and has shown strengths through ${strengths}. ${gapText} Current priorities include ${row.concerns.length ? concerns : "maintaining progress and confidence"}.`;
    }

    if (mode === "authority_note") {
      return `Available evidence indicates that ${row.student_name} has demonstrated learning across the reporting period through ${strengths}. Current documentation status is ${row.readiness_label.toLowerCase()} with a readiness score of ${row.readiness_score}. ${gapText} Noted risks include ${concerns}.`;
    }

    return `${row.student_name} has engaged positively across the reporting period and has shown evidence of learning through ${strengths}. ${gapText} Current support considerations include ${concerns}.`;
  }

  function updateDraftState(status?: ProductionStatus, draft?: string, mode?: DraftMode) {
    if (!selectedRow) return;

    const current = draftMap[selectedRow.student_id] ?? {
      status: "untouched" as ProductionStatus,
      mode: draftMode,
      draft: draftText,
      updatedAt: isoNow(),
    };

    const next: DraftState = {
      status: status ?? current.status,
      mode: mode ?? draftMode,
      draft: draft ?? draftText,
      updatedAt: isoNow(),
    };

    persistDraftMap({
      ...draftMap,
      [selectedRow.student_id]: next,
    });

    setOk("Batch draft state updated.");
    setTimeout(() => setOk(null), 1400);
  }

  const selectedClass = useMemo(() => classes.find((c) => c.id === classId) ?? null, [classes, classId]);

  const classSummary = useMemo(() => {
    const total = batchRows.length;
    const avg = total ? Math.round(batchRows.reduce((sum, r) => sum + r.readiness_score, 0) / total) : 0;
    const ready = batchRows.filter((r) => r.readiness_label === "Ready").length;
    const notReady = batchRows.filter((r) => r.readiness_label === "Not Ready").length;
    return { total, avg, ready, notReady };
  }, [batchRows]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Reports</div>
          <div style={S.h1}>Batch Report Production Workspace</div>
          <div style={S.sub}>
            Move through a class as a production queue, track progress states, generate richer draft modes, and see which learners are finishable now versus blocked by missing evidence.
          </div>

          <div style={S.topBar}>
            <div>
              <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} style={S.select}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {safe(c.name) || "Class"} {c.year_level != null ? `(${c.year_level})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Search learner</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find learner..."
                style={S.input}
              />
            </div>

            <button type="button" style={{ ...S.btnPrimary, alignSelf: "end" }} onClick={() => loadAll(classId)}>
              Refresh
            </button>

            <button type="button" style={{ ...S.btn, alignSelf: "end" }} onClick={() => router.push("/admin/reports/readiness")}>
              Open readiness
            </button>
          </div>

          {busy ? <div style={S.ok}>Loading batch workspace…</div> : null}
          {err ? <div style={S.err}>Error: {err}</div> : null}
          {ok ? <div style={S.ok}>{ok}</div> : null}

          <div style={S.tiles}>
            <div style={S.tile}>
              <div style={S.tileK}>Class</div>
              <div style={S.tileV}>{selectedClass?.name || "—"}</div>
              <div style={S.tileS}>Current production class.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Students</div>
              <div style={S.tileV}>{classSummary.total}</div>
              <div style={S.tileS}>Learners in this production queue.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Untouched</div>
              <div style={S.tileV}>{completionForecast.untouched}</div>
              <div style={S.tileS}>No report drafting started yet.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>In Draft</div>
              <div style={S.tileV}>{completionForecast.draft_started}</div>
              <div style={S.tileS}>Drafts currently being worked on.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Needs Evidence</div>
              <div style={S.tileV}>{completionForecast.needs_evidence}</div>
              <div style={S.tileS}>Blocked by missing evidence or support issues.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Review Ready</div>
              <div style={S.tileV}>{completionForecast.ready_for_review}</div>
              <div style={S.tileS}>Ready for final teacher review.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Finalised</div>
              <div style={S.tileV}>{completionForecast.finalised}</div>
              <div style={S.tileS}>Production-complete reports.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Forecast</div>
              <div style={S.tileV}>{completionForecast.completion_confidence}</div>
              <div style={S.tileS}>Class batch completion confidence.</div>
            </div>
          </div>
        </section>

        <div style={S.grid}>
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Learner production queue</div>
              <div style={S.sectionHelp}>
                Work from the highest-risk cases first. Each learner now carries a production state and finishability signal.
              </div>

              <div style={S.list}>
                {filteredRows.map((row) => {
                  const selected = row.student_id === selectedRow?.student_id;
                  const readyTone = labelTone(row.readiness_label);
                  const finish = finishTone(row.finishability);
                  const state = draftMap[row.student_id]?.status || "untouched";
                  const stateTone = productionTone(state);

                  return (
                    <div
                      key={row.student_id}
                      style={{
                        ...S.queueItem,
                        borderColor: selected ? "#1d4ed8" : "#edf2f7",
                        boxShadow: selected ? "0 0 0 2px rgba(29,78,216,0.10)" : "none",
                      }}
                      onClick={() => setSelectedStudentId(row.student_id)}
                    >
                      <div style={{ ...S.row, justifyContent: "space-between" }}>
                        <div style={S.itemTitle}>{row.student_name}</div>
                        <span style={{ ...S.chip, background: readyTone.bg, borderColor: readyTone.bd, color: readyTone.fg }}>
                          {row.readiness_label}
                        </span>
                      </div>

                      <div style={{ ...S.row, marginTop: 8 }}>
                        <span style={S.chipMuted}>Score {row.readiness_score}</span>
                        <span style={{ ...S.chip, background: finish.bg, borderColor: finish.bd, color: finish.fg }}>
                          {row.finishability}
                        </span>
                        <span style={{ ...S.chip, background: stateTone.bg, borderColor: stateTone.bd, color: stateTone.fg }}>
                          {state}
                        </span>
                      </div>

                      <div style={S.itemText}>{row.blocking_reason}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={{ ...S.row, justifyContent: "space-between" }}>
                <div>
                  <div style={S.sectionTitle}>
                    {selectedRow ? `Drafting workspace — ${selectedRow.student_name}` : "Drafting workspace"}
                  </div>
                  <div style={S.sectionHelp}>
                    Generate the right draft mode, write with guidance, and move the learner through production states.
                  </div>
                </div>
              </div>

              {selectedRow ? (
                <>
                  <div style={{ ...S.row, marginTop: 12 }}>
                    <span style={S.chipMuted}>Evidence 30d {selectedRow.evidence_30d}</span>
                    <span style={S.chipMuted}>
                      Last evidence {selectedRow.last_evidence_days == null ? "—" : `${selectedRow.last_evidence_days}d`}
                    </span>
                    <span style={S.chipMuted}>Open plans {selectedRow.open_plans}</span>
                    <span style={S.chipMuted}>Overdue {selectedRow.overdue_reviews}</span>
                  </div>

                  <div style={S.grid2}>
                    <div style={S.item}>
                      <div style={S.itemTitle}>Draft mode</div>
                      <div style={S.itemText}>
                        Choose the output style that best matches the immediate reporting task.
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <select
                          value={draftMode}
                          onChange={(e) => setDraftMode(e.target.value as DraftMode)}
                          style={S.select}
                        >
                          <option value="concise_comment">Concise report comment</option>
                          <option value="teacher_paragraph">Full teacher paragraph</option>
                          <option value="parent_summary">Parent-friendly summary</option>
                          <option value="authority_note">Authority-style compliance note</option>
                        </select>
                      </div>
                    </div>

                    <div style={S.item}>
                      <div style={S.itemTitle}>Current production state</div>
                      <div style={S.itemText}>
                        {selectedDraftState
                          ? `This learner is currently marked as ${selectedDraftState.status}.`
                          : "No production state has been set yet."}
                      </div>
                      <div style={{ ...S.row, marginTop: 10 }}>
                        <button type="button" style={S.btn} onClick={() => updateDraftState("draft_started", draftText, draftMode)}>
                          Mark draft started
                        </button>
                        <button type="button" style={S.btn} onClick={() => updateDraftState("needs_evidence", draftText, draftMode)}>
                          Needs evidence
                        </button>
                        <button type="button" style={S.btn} onClick={() => updateDraftState("ready_for_review", draftText, draftMode)}>
                          Ready for review
                        </button>
                        <button type="button" style={S.btnPrimary} onClick={() => updateDraftState("finalised", draftText, draftMode)}>
                          Finalised
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      style={S.textarea}
                    />
                  </div>

                  <div style={{ ...S.row, marginTop: 12 }}>
                    <button type="button" style={S.btnPrimary} onClick={() => updateDraftState(undefined, draftText, draftMode)}>
                      Save draft
                    </button>
                    <button
                      type="button"
                      style={S.btn}
                      onClick={() => setDraftText(buildDraftReport(selectedRow, draftMode))}
                    >
                      Regenerate {modeLabel(draftMode)}
                    </button>
                    <button
                      type="button"
                      style={S.btn}
                      onClick={() =>
                        router.push(`/admin/evidence-entry?studentId=${selectedRow.student_id}&returnTo=${encodeURIComponent("/admin/reports/batch")}`)
                      }
                    >
                      Add evidence
                    </button>
                    <button
                      type="button"
                      style={S.btn}
                      onClick={() => router.push(`/admin/interventions?studentId=${selectedRow.student_id}`)}
                    >
                      Open interventions
                    </button>
                  </div>
                </>
              ) : (
                <div style={S.item}>No learner selected.</div>
              )}
            </div>
          </section>
        </div>

        <div style={S.grid2}>
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Smarter writing guidance</div>
              <div style={S.sectionHelp}>
                Use the strongest starting point, safest evidence, and hard-stop warnings before finalising.
              </div>

              {selectedRow && writingGuidance ? (
                <div style={S.list}>
                  <div style={S.item}>
                    <div style={S.itemTitle}>Strongest sentence starters</div>
                    <div style={S.itemText}>{writingGuidance.starters.join(" • ")}</div>
                  </div>

                  <div style={S.item}>
                    <div style={S.itemTitle}>Safest evidence to cite</div>
                    <div style={S.itemText}>
                      {writingGuidance.safestEvidence.length
                        ? writingGuidance.safestEvidence.join(" • ")
                        : "No strong evidence candidate is visible yet."}
                    </div>
                  </div>

                  <div style={S.item}>
                    <div style={S.itemTitle}>Missing narrative risk</div>
                    <div style={S.itemText}>
                      {writingGuidance.missingNarrativeRisk || "Narrative evidence risk is currently manageable."}
                    </div>
                  </div>

                  <div style={S.item}>
                    <div style={S.itemTitle}>Finalisation warning</div>
                    <div style={S.itemText}>
                      {writingGuidance.hardStop || "No hard stop detected. Final review can proceed when drafting is complete."}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={S.item}>Select a learner to see writing guidance.</div>
              )}
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Completion forecast</div>
              <div style={S.sectionHelp}>
                See how close the class is to completion and which learners will slow the batch.
              </div>

              <div style={S.list}>
                <div style={S.item}>
                  <div style={S.itemTitle}>Class-level production forecast</div>
                  <div style={S.itemText}>
                    {completionForecast.ready_to_finalize_now} learners are ready to finalise now, while {completionForecast.blocked_now} are currently blocked.
                  </div>
                  <div style={{ ...S.row, marginTop: 10 }}>
                    <span style={S.chipMuted}>Forecast {completionForecast.completion_confidence}</span>
                    <span style={S.chipMuted}>Untouched {completionForecast.untouched}</span>
                    <span style={S.chipMuted}>Review-ready {completionForecast.ready_for_review}</span>
                    <span style={S.chipMuted}>Finalised {completionForecast.finalised}</span>
                  </div>
                </div>

                <div style={S.item}>
                  <div style={S.itemTitle}>Likely batch delays</div>
                  <div style={S.itemText}>
                    {batchRows
                      .filter((r) => r.finishability === "Blocked")
                      .slice(0, 5)
                      .map((r) => `${r.student_name}: ${r.blocking_reason}`)
                      .join(" • ") || "No major blockers are currently visible."}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}