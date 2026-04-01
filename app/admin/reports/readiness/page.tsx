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

type StudentReadinessRow = {
  student_id: string;
  student_name: string;
  is_ilp: boolean;
  readiness_score: number;
  readiness_label: "Ready" | "Near Ready" | "Needs Attention" | "Not Ready";
  evidence_30d: number;
  evidence_prev_30d: number;
  evidence_momentum_delta: number;
  last_evidence_days: number | null;
  overdue_reviews: number;
  open_plans: number;
  empty_areas: string[];
  weak_areas: string[];
  highlights: string[];
  concerns: string[];

  time_to_ready_days: number | null;
  readiness_trajectory: "Improving" | "Stable" | "Deteriorating";
  fixable_this_cycle: boolean;

  recommended_strategy:
    | "Capture Maths evidence"
    | "Capture Literacy evidence"
    | "Capture fresh evidence"
    | "Gather narrative evidence"
    | "Close overdue plans"
    | "Conduct review conference"
    | "Escalate support"
    | "Maintain course";

  strategy_reason: string;

  authority_readiness: "Strong" | "Watch" | "Fragile";
  documentation_completeness: number;
  audit_confidence: number;
};

type ClassForecastRow = {
  class_id: string;
  class_name: string;
  avg_score: number;
  ready: number;
  near: number;
  attention: number;
  not_ready: number;
  projected_ready_next_7d: number;
  projected_ready_next_14d: number;
  completion_confidence: "On Track" | "Watch" | "At Risk";
  authority_status: "Strong" | "Watch" | "Fragile";
};

type CrossClassRow = {
  class_id: string;
  class_name: string;
  avg_score: number;
  risk_count: number;
  authority_status: "Strong" | "Watch" | "Fragile";
  support_recommendation: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 60) {
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

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
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

function readinessLabel(score: number): StudentReadinessRow["readiness_label"] {
  if (score >= 85) return "Ready";
  if (score >= 70) return "Near Ready";
  if (score >= 50) return "Needs Attention";
  return "Not Ready";
}

function labelTone(label: StudentReadinessRow["readiness_label"]) {
  if (label === "Ready") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (label === "Near Ready") return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
  if (label === "Needs Attention") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function trajectoryTone(label: StudentReadinessRow["readiness_trajectory"]) {
  if (label === "Improving") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (label === "Stable") return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function authorityTone(label: "Strong" | "Watch" | "Fragile") {
  if (label === "Strong") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (label === "Watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
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
    maxWidth: 1600,
    margin: "0 auto",
    padding: 22,
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 24,
    background: "linear-gradient(135deg, rgba(17,24,39,0.08), rgba(99,102,241,0.10))",
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
    gridTemplateColumns: "1fr 0.95fr 0.95fr auto auto",
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
    gridTemplateColumns: "repeat(7, minmax(135px, 1fr))",
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

  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
    marginTop: 14,
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

  tableWrap: {
    marginTop: 12,
    overflowX: "auto",
    border: "1px solid #e8eaf0",
    borderRadius: 14,
    background: "#fff",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse",
  } as React.CSSProperties,

  th: {
    textAlign: "left",
    padding: "12px 12px",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    borderBottom: "1px solid #e8eaf0",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  td: {
    padding: "12px 12px",
    borderBottom: "1px solid #edf2f7",
    color: "#0f172a",
    fontWeight: 800,
    verticalAlign: "top",
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

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginTop: 14,
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

export default function ClassReportingReadinessPage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntryRow[]>([]);
  const [allEvidenceEntries, setAllEvidenceEntries] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [allInterventions, setAllInterventions] = useState<InterventionRow[]>([]);

  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState("all");

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

  async function loadAllStudents() {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,last_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,is_ilp",
      "id,class_id,first_name,preferred_name,is_ilp",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).limit(50000);
      if (!r.error) {
        setAllStudents(((r.data as any[]) ?? []) as StudentRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }
    setAllStudents([]);
  }

  async function loadAllEvidence() {
    const tries = [
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,learning_area,occurred_on,created_at,is_deleted",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("is_deleted", false)
        .limit(50000);

      if (!r.error) {
        setAllEvidenceEntries(((r.data as any[]) ?? []) as EvidenceEntryRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }
    setAllEvidenceEntries([]);
  }

  async function loadAllInterventions() {
    const tries = [
      "id,student_id,class_id,title,status,priority,review_due_on,review_due_date,next_review_on,due_on,created_at,updated_at",
      "id,student_id,class_id,status,priority,review_due_on,review_due_date,next_review_on,due_on,created_at,updated_at",
      "*",
    ];

    for (const sel of tries) {
      const r = await supabase.from("interventions").select(sel).limit(50000);
      if (!r.error) {
        setAllInterventions(((r.data as any[]) ?? []) as InterventionRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }
    setAllInterventions([]);
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);

    try {
      await Promise.all([loadClasses(), loadAllStudents(), loadAllEvidence(), loadAllInterventions()]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!classId) return;
    setStudents(allStudents.filter((s) => safe(s.class_id) === classId));
    setEvidenceEntries(allEvidenceEntries.filter((e) => safe(e.class_id) === classId));
    setInterventions(allInterventions.filter((iv) => safe(iv.class_id) === classId));
  }, [classId, allStudents, allEvidenceEntries, allInterventions]);

  const readinessRows = useMemo<StudentReadinessRow[]>(() => {
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

      const evidencePrev30d = studentEvidence.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d > 30 && d <= 60;
      }).length;

      const evidenceMomentumDelta = evidence30d - evidencePrev30d;

      const openPlans = studentPlans.filter((iv) => !isClosedStatus(iv.status)).length;

      const overdueReviews = studentPlans.filter((iv) => {
        if (isClosedStatus(iv.status)) return false;
        const review = pickReviewDate(iv);
        return review ? (daysSince(review) ?? 0) > 0 : false;
      }).length;

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

      let timeToReadyDays: number | null = null;
      if (score >= 85) timeToReadyDays = 0;
      else if (score >= 70) timeToReadyDays = 7;
      else if (score >= 50) timeToReadyDays = 14;
      else timeToReadyDays = 21;

      if (evidenceMomentumDelta > 0 && timeToReadyDays != null) timeToReadyDays = Math.max(0, timeToReadyDays - 3);
      if (overdueReviews > 0 && timeToReadyDays != null) timeToReadyDays += 4;
      if (emptyAreas.length >= 2 && timeToReadyDays != null) timeToReadyDays += 5;

      let readinessTrajectory: StudentReadinessRow["readiness_trajectory"] = "Stable";
      if (evidenceMomentumDelta > 0 && overdueReviews === 0) readinessTrajectory = "Improving";
      if (evidenceMomentumDelta < 0 || evidence30d === 0) readinessTrajectory = "Deteriorating";

      const fixableThisCycle = (timeToReadyDays ?? 999) <= 14;

      let recommendedStrategy: StudentReadinessRow["recommended_strategy"] = "Maintain course";
      let strategyReason = "Student appears broadly on track for reporting readiness.";

      if (emptyAreas.includes("Maths")) {
        recommendedStrategy = "Capture Maths evidence";
        strategyReason = "Maths is missing entirely and would lift coverage fastest.";
      } else if (emptyAreas.includes("Literacy")) {
        recommendedStrategy = "Capture Literacy evidence";
        strategyReason = "Literacy is missing entirely and is a core reporting gap.";
      } else if (overdueReviews > 0) {
        recommendedStrategy = "Close overdue plans";
        strategyReason = "Overdue intervention reviews are weakening reporting confidence.";
      } else if (evidence30d === 0 || (lastEvidenceDays ?? 999) > 30) {
        recommendedStrategy = "Capture fresh evidence";
        strategyReason = "Evidence freshness is too weak to sustain confident report writing.";
      } else if (
        studentEvidence.filter((e) => safe(e.summary) || safe(e.body)).length < 2
      ) {
        recommendedStrategy = "Gather narrative evidence";
        strategyReason = "There is not enough descriptive evidence to support stronger report commentary.";
      } else if (openPlans > 0 && overdueReviews === 0 && score < 50) {
        recommendedStrategy = "Conduct review conference";
        strategyReason = "A teacher/parent/student review conference may clarify next reporting steps.";
      } else if (score < 40 && openPlans >= 2) {
        recommendedStrategy = "Escalate support";
        strategyReason = "Readiness is weak despite active support load, suggesting stronger response may be needed.";
      }

      const documentationCompleteness = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            percent(studentEvidence.length, 6) * 0.35 +
              percent(studentEvidence.filter((e) => safe(e.summary) || safe(e.body)).length, 4) * 0.35 +
              percent(areas.length - emptyAreas.length, areas.length) * 0.3
          )
        )
      );

      const auditConfidence = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            score * 0.5 +
              documentationCompleteness * 0.3 +
              Math.max(0, 100 - overdueReviews * 15) * 0.2
          )
        )
      );

      let authorityReadiness: StudentReadinessRow["authority_readiness"] = "Strong";
      if (auditConfidence < 55) authorityReadiness = "Fragile";
      else if (auditConfidence < 75) authorityReadiness = "Watch";

      return {
        student_id: s.id,
        student_name: studentDisplayName(s),
        is_ilp: Boolean(s.is_ilp),
        readiness_score: score,
        readiness_label: readinessLabel(score),
        evidence_30d: evidence30d,
        evidence_prev_30d: evidencePrev30d,
        evidence_momentum_delta: evidenceMomentumDelta,
        last_evidence_days: lastEvidenceDays,
        overdue_reviews: overdueReviews,
        open_plans: openPlans,
        empty_areas: emptyAreas,
        weak_areas: weakAreas,
        highlights,
        concerns,
        time_to_ready_days: timeToReadyDays,
        readiness_trajectory: readinessTrajectory,
        fixable_this_cycle: fixableThisCycle,
        recommended_strategy: recommendedStrategy,
        strategy_reason: strategyReason,
        authority_readiness: authorityReadiness,
        documentation_completeness: documentationCompleteness,
        audit_confidence: auditConfidence,
      };
    });
  }, [students, evidenceEntries, interventions]);

  const filteredRows = useMemo(() => {
    return readinessRows
      .filter((r) => {
        if (labelFilter !== "all" && r.readiness_label !== labelFilter) return false;
        if (search && !r.student_name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.readiness_score - b.readiness_score);
  }, [readinessRows, labelFilter, search]);

  const headline = useMemo(() => {
    const total = readinessRows.length;
    const ready = readinessRows.filter((r) => r.readiness_label === "Ready").length;
    const near = readinessRows.filter((r) => r.readiness_label === "Near Ready").length;
    const attention = readinessRows.filter((r) => r.readiness_label === "Needs Attention").length;
    const notReady = readinessRows.filter((r) => r.readiness_label === "Not Ready").length;
    const avg = total ? Math.round(readinessRows.reduce((sum, r) => sum + r.readiness_score, 0) / total) : 0;
    const fragile = readinessRows.filter((r) => r.authority_readiness === "Fragile").length;
    const auditAvg = total ? Math.round(readinessRows.reduce((sum, r) => sum + r.audit_confidence, 0) / total) : 0;
    return { total, ready, near, attention, notReady, avg, fragile, auditAvg };
  }, [readinessRows]);

  const selectedClass = useMemo(() => classes.find((c) => c.id === classId) ?? null, [classes, classId]);

  const classForecast = useMemo<ClassForecastRow | null>(() => {
    if (!selectedClass) return null;
    const total = readinessRows.length;
    if (!total) {
      return {
        class_id: selectedClass.id,
        class_name: safe(selectedClass.name) || "Class",
        avg_score: 0,
        ready: 0,
        near: 0,
        attention: 0,
        not_ready: 0,
        projected_ready_next_7d: 0,
        projected_ready_next_14d: 0,
        completion_confidence: "At Risk",
        authority_status: "Fragile",
      };
    }

    const ready = readinessRows.filter((r) => r.readiness_label === "Ready").length;
    const near = readinessRows.filter((r) => r.readiness_label === "Near Ready").length;
    const attention = readinessRows.filter((r) => r.readiness_label === "Needs Attention").length;
    const notReady = readinessRows.filter((r) => r.readiness_label === "Not Ready").length;
    const avg_score = Math.round(readinessRows.reduce((sum, r) => sum + r.readiness_score, 0) / total);

    const projected_ready_next_7d = readinessRows.filter(
      (r) => (r.time_to_ready_days ?? 999) <= 7
    ).length;

    const projected_ready_next_14d = readinessRows.filter(
      (r) => (r.time_to_ready_days ?? 999) <= 14
    ).length;

    let completion_confidence: ClassForecastRow["completion_confidence"] = "On Track";
    if (percent(projected_ready_next_14d, total) < 70) completion_confidence = "At Risk";
    else if (percent(projected_ready_next_14d, total) < 85) completion_confidence = "Watch";

    const auditAvg =
      Math.round(readinessRows.reduce((sum, r) => sum + r.audit_confidence, 0) / total);

    let authority_status: ClassForecastRow["authority_status"] = "Strong";
    if (auditAvg < 55) authority_status = "Fragile";
    else if (auditAvg < 75) authority_status = "Watch";

    return {
      class_id: selectedClass.id,
      class_name: safe(selectedClass.name) || "Class",
      avg_score,
      ready,
      near,
      attention,
      not_ready: notReady,
      projected_ready_next_7d,
      projected_ready_next_14d,
      completion_confidence,
      authority_status,
    };
  }, [selectedClass, readinessRows]);

  const crossClass = useMemo<CrossClassRow[]>(() => {
    return classes.map((c) => {
      const classStudents = allStudents.filter((s) => safe(s.class_id) === safe(c.id));
      const classEvidence = allEvidenceEntries.filter((e) => safe(e.class_id) === safe(c.id));
      const classInterventions = allInterventions.filter((iv) => safe(iv.class_id) === safe(c.id));

      const tempRows = classStudents.map((s) => {
        const studentEvidence = classEvidence.filter((e) => safe(e.student_id) === s.id);
        const studentPlans = classInterventions.filter((iv) => safe(iv.student_id) === s.id);

        const lastEvidence = studentEvidence
          .sort((a, b) => safe(b.occurred_on || b.created_at).localeCompare(safe(a.occurred_on || a.created_at)))[0]
          ?.occurred_on || studentEvidence[0]?.created_at || null;

        const lastEvidenceDays = daysSince(lastEvidence);

        const evidence30d = studentEvidence.filter((e) => {
          const d = daysSince(e.occurred_on || e.created_at);
          return d != null && d <= 30;
        }).length;

        const overdueReviews = studentPlans.filter((iv) => {
          if (isClosedStatus(iv.status)) return false;
          const review = pickReviewDate(iv);
          return review ? (daysSince(review) ?? 0) > 0 : false;
        }).length;

        let score = 100;
        if (lastEvidenceDays == null) score -= 25;
        else if (lastEvidenceDays > 45) score -= 20;
        else if (lastEvidenceDays > 30) score -= 10;
        if (evidence30d === 0) score -= 20;
        else if (evidence30d === 1) score -= 10;
        score -= overdueReviews * 12;
        return Math.max(0, Math.min(100, Math.round(score)));
      });

      const avg_score = tempRows.length
        ? Math.round(tempRows.reduce((sum, x) => sum + x, 0) / tempRows.length)
        : 0;

      const risk_count = tempRows.filter((x) => x < 70).length;

      let authority_status: CrossClassRow["authority_status"] = "Strong";
      if (avg_score < 55) authority_status = "Fragile";
      else if (avg_score < 75) authority_status = "Watch";

      let support_recommendation = "Low support priority.";
      if (authority_status === "Fragile") support_recommendation = "Leadership support should go here first.";
      else if (authority_status === "Watch") support_recommendation = "Monitor closely and provide short-term help.";

      return {
        class_id: c.id,
        class_name: `${safe(c.name) || "Class"}${c.year_level != null ? ` (${c.year_level})` : ""}`,
        avg_score,
        risk_count,
        authority_status,
        support_recommendation,
      };
    })
      .sort((a, b) => a.avg_score - b.avg_score)
      .slice(0, 8);
  }, [classes, allStudents, allEvidenceEntries, allInterventions]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Reports</div>
          <div style={S.h1}>Class Reporting Forecast & Readiness</div>
          <div style={S.sub}>
            A forecasting dashboard for reporting season showing who is ready, who can realistically be fixed in time, what action lifts readiness fastest, and whether the class is on track for authority-safe completion.
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
              <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Search student</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find learner..."
                style={S.input}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Status</label>
              <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} style={S.select}>
                <option value="all">All</option>
                <option value="Ready">Ready</option>
                <option value="Near Ready">Near Ready</option>
                <option value="Needs Attention">Needs Attention</option>
                <option value="Not Ready">Not Ready</option>
              </select>
            </div>

            <button type="button" style={{ ...S.btnPrimary, alignSelf: "end" }} onClick={() => loadAll()}>
              Refresh
            </button>

            <button type="button" style={{ ...S.btn, alignSelf: "end" }} onClick={() => router.push("/admin/command-centre")}>
              Open command centre
            </button>
          </div>

          {busy ? <div style={S.ok}>Loading reporting forecast dashboard…</div> : null}
          {err ? <div style={S.err}>Error: {err}</div> : null}

          <div style={S.tiles}>
            <div style={S.tile}>
              <div style={S.tileK}>Class</div>
              <div style={S.tileV}>{selectedClass?.name || "—"}</div>
              <div style={S.tileS}>Current class in reporting focus.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Average score</div>
              <div style={S.tileV}>{headline.avg}</div>
              <div style={S.tileS}>Overall reporting readiness confidence.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Ready now</div>
              <div style={S.tileV}>{headline.ready}</div>
              <div style={S.tileS}>Students already ready for drafting.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Fixable in 14d</div>
              <div style={S.tileV}>{classForecast?.projected_ready_next_14d ?? 0}</div>
              <div style={S.tileS}>Students likely to become ready this cycle.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Fragile authority</div>
              <div style={S.tileV}>{headline.fragile}</div>
              <div style={S.tileS}>Students with weak audit/submission confidence.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Audit confidence</div>
              <div style={S.tileV}>{headline.auditAvg}</div>
              <div style={S.tileS}>Class-level average documentation confidence.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Completion forecast</div>
              <div style={S.tileV}>{classForecast?.completion_confidence || "—"}</div>
              <div style={S.tileS}>Will this class finish reporting on time?</div>
            </div>
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionPad}>
            <div style={S.sectionTitle}>Student readiness forecast table</div>
            <div style={S.sectionHelp}>
              Sorted from lowest readiness to highest. The table now includes time-to-readiness, trajectory, strategy guidance, and authority confidence.
            </div>

            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Student</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Score</th>
                    <th style={S.th}>Trajectory</th>
                    <th style={S.th}>Time to Ready</th>
                    <th style={S.th}>Fix This Cycle</th>
                    <th style={S.th}>Strategy</th>
                    <th style={S.th}>Authority</th>
                    <th style={S.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const tone = labelTone(row.readiness_label);
                    const traj = trajectoryTone(row.readiness_trajectory);
                    const auth = authorityTone(row.authority_readiness);

                    return (
                      <tr key={row.student_id}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 950 }}>{row.student_name}</div>
                          {row.is_ilp ? (
                            <div style={{ marginTop: 6 }}>
                              <span style={S.chipMuted}>ILP</span>
                            </div>
                          ) : null}
                        </td>

                        <td style={S.td}>
                          <span style={{ ...S.chip, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
                            {row.readiness_label}
                          </span>
                        </td>

                        <td style={S.td}>{row.readiness_score}</td>

                        <td style={S.td}>
                          <span style={{ ...S.chip, background: traj.bg, borderColor: traj.bd, color: traj.fg }}>
                            {row.readiness_trajectory}
                          </span>
                          <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                            Δ {row.evidence_momentum_delta >= 0 ? "+" : ""}
                            {row.evidence_momentum_delta}
                          </div>
                        </td>

                        <td style={S.td}>
                          {row.time_to_ready_days == null
                            ? "—"
                            : row.time_to_ready_days === 0
                            ? "Ready now"
                            : `${row.time_to_ready_days}d`}
                        </td>

                        <td style={S.td}>
                          <span style={S.chipMuted}>{row.fixable_this_cycle ? "Yes" : "Unlikely"}</span>
                        </td>

                        <td style={S.td}>
                          <div style={{ fontWeight: 900 }}>{row.recommended_strategy}</div>
                          <div style={{ marginTop: 6, color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>
                            {row.strategy_reason}
                          </div>
                        </td>

                        <td style={S.td}>
                          <span style={{ ...S.chip, background: auth.bg, borderColor: auth.bd, color: auth.fg }}>
                            {row.authority_readiness}
                          </span>
                          <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                            Docs {row.documentation_completeness} • Audit {row.audit_confidence}
                          </div>
                        </td>

                        <td style={S.td}>
                          <button
                            type="button"
                            style={S.btn}
                            onClick={() => router.push(`/admin/students/${row.student_id}?view=reporting`)}
                          >
                            Open student
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div style={S.grid2}>
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Class completion forecast</div>
              <div style={S.sectionHelp}>
                Leadership view of whether this class is likely to complete reporting on time.
              </div>

              {classForecast ? (
                <div style={S.list}>
                  <div style={S.item}>
                    <div style={S.itemTitle}>{classForecast.class_name}</div>
                    <div style={S.itemText}>
                      {classForecast.projected_ready_next_7d} students are projected ready in 7 days, and {classForecast.projected_ready_next_14d} in 14 days.
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <span style={S.chipMuted}>Completion: {classForecast.completion_confidence}</span>
                      <span style={S.chipMuted}>Authority: {classForecast.authority_status}</span>
                      <span style={S.chipMuted}>Ready {classForecast.ready}</span>
                      <span style={S.chipMuted}>Near {classForecast.near}</span>
                      <span style={S.chipMuted}>Risk {classForecast.attention + classForecast.not_ready}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={S.item}>No class forecast available.</div>
              )}
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Priority students this cycle</div>
              <div style={S.sectionHelp}>
                Highest-risk students, with realistic fixability and next action built in.
              </div>

              <div style={S.list}>
                {filteredRows.slice(0, 5).map((row) => (
                  <div key={row.student_id} style={S.item}>
                    <div style={S.itemTitle}>{row.student_name}</div>
                    <div style={S.itemText}>
                      {row.concerns.length ? row.concerns.join(" • ") : "No major concern"}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <span style={S.chipMuted}>Score {row.readiness_score}</span>
                      <span style={S.chipMuted}>{row.readiness_label}</span>
                      <span style={S.chipMuted}>
                        {row.time_to_ready_days == null ? "—" : `${row.time_to_ready_days}d`}
                      </span>
                      <span style={S.chipMuted}>{row.recommended_strategy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div style={S.grid2}>
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Recent highlight pool</div>
              <div style={S.sectionHelp}>
                Good evidence candidates to draw on for reports and parent conversations.
              </div>

              <div style={S.list}>
                {filteredRows
                  .filter((r) => r.highlights.length > 0)
                  .slice(0, 5)
                  .map((row) => (
                    <div key={row.student_id} style={S.item}>
                      <div style={S.itemTitle}>{row.student_name}</div>
                      <div style={S.itemText}>{row.highlights.join(" • ")}</div>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Cross-class comparison</div>
              <div style={S.sectionHelp}>
                A system-level view of which classes are safest, which are high-risk, and where leadership support should go.
              </div>

              <div style={S.list}>
                {crossClass.map((row) => {
                  const tone = authorityTone(row.authority_status);
                  return (
                    <div key={row.class_id} style={S.item}>
                      <div style={S.itemTitle}>{row.class_name}</div>
                      <div style={S.itemText}>{row.support_recommendation}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                        <span style={S.chipMuted}>Avg {row.avg_score}</span>
                        <span style={S.chipMuted}>Risk {row.risk_count}</span>
                        <span style={{ ...S.chip, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
                          {row.authority_status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}