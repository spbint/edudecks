"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentQuickViewDrawer from "@/app/admin/components/StudentQuickViewDrawer";
import { loadStudentAnalytics } from "@/lib/analytics";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type InterventionRow = {
  id: string;
  class_id: string | null;
  student_id: string | null;
  title?: string | null;
  notes?: string | null;
  note?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: any;
  strategy?: string | null;
  due_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_reviewed_at?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id?: string | null;
  first_name: string | null;
  preferred_name: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
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
  visibility?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type AttributeRow = {
  key?: string;
  id?: string;
  code?: string;
  label?: string;
  name?: string;
  score?: number | null;
  value?: number | null;
  band?: string | null;
  status?: string | null;
  [k: string]: any;
};

type EvidenceFreshnessRow = {
  label: string;
  days: number;
};

type StatusLabel = "Stable" | "Watch" | "Attention";

type StudentAnalytics = {
  student: StudentRow | null;
  klass: ClassRow | null;
  evidence: EvidenceEntryRow[];
  interventions: InterventionRow[];
  openInterventions: InterventionRow[];
  overdueReviews: InterventionRow[];
  lastEvidenceDays: number | null;
  profileConfidence: number;
  attentionScore: number;
  statusLabel: StatusLabel;
  nextAction: string;
  evidenceFreshness: EvidenceFreshnessRow[];
  attributes: AttributeRow[];
};

type ReviewDecision = "continue" | "adjust" | "close" | "escalate";

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(text: string | null | undefined, max = 220) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const last = safe(s.surname || s.family_name);
  return `${first}${last ? ` ${last}` : ""}`.trim() || "Student";
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Y${y}`;
}

function isoShort(v: string | null | undefined) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(v).slice(0, 10);
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function pickReviewDate(r: Partial<InterventionRow> | null | undefined) {
  return (
    safe(r?.review_due_on) ||
    safe(r?.review_due_date) ||
    safe(r?.next_review_on) ||
    safe(r?.due_on) ||
    ""
  );
}

function pickStatusTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (s === "closed" || s === "done" || s === "resolved" || s === "archived" || s === "completed") {
    return { bg: "#f8fafc", bd: "#e5e7eb", fg: "#475569" };
  }
  if (s === "paused") {
    return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  }
  if (s === "monitoring") {
    return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
  }
  if (s === "review") {
    return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  }
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#065f46" };
}

function stripTaggedSections(source: string) {
  const lines = String(source || "").split(/\r?\n/);
  return lines
    .filter(
      (line) =>
        !line.startsWith("Success criteria:") &&
        !line.startsWith("Delivery mode:") &&
        !line.startsWith("Baseline:") &&
        !line.startsWith("Evidence link:")
    )
    .join("\n")
    .trim();
}

function effectiveEvidenceDate(ev: EvidenceEntryRow) {
  return safe(ev.occurred_on) || safe(ev.created_at);
}

function buildReviewBlock(input: {
  date: string;
  decision: ReviewDecision;
  improved: string;
  stillNeeds: string;
  nextStep: string;
  reviewSummary: string;
}) {
  const lines = [
    `Review date: ${safe(input.date) || todayIso()}`,
    `Review decision: ${safe(input.decision)}`,
  ];

  if (safe(input.reviewSummary)) lines.push(`Review summary: ${safe(input.reviewSummary)}`);
  if (safe(input.improved)) lines.push(`Improved: ${safe(input.improved)}`);
  if (safe(input.stillNeeds)) lines.push(`Still needs support: ${safe(input.stillNeeds)}`);
  if (safe(input.nextStep)) lines.push(`Next step: ${safe(input.nextStep)}`);

  return lines.join("\n");
}

function mergeNotesWithReview(baseNotes: string, reviewBlock: string) {
  const cleanBase = safe(baseNotes);
  if (!cleanBase) return `--- Review Update ---\n${reviewBlock}`;
  return `${cleanBase}\n\n--- Review Update ---\n${reviewBlock}`;
}

function attributeLabel(a: AttributeRow) {
  return safe(a.label) || safe(a.name) || safe(a.code) || safe(a.key) || "Attribute";
}

function attributeScorePercent(a: AttributeRow) {
  const raw = Number(a.score ?? a.value ?? 0);
  if (!Number.isFinite(raw)) return 0;
  if (raw <= 20) return clamp(Math.round((raw / 20) * 100), 0, 100);
  return clamp(Math.round(raw), 0, 100);
}

function freshnessTone(days: number) {
  if (days <= 7) return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534", label: `${days}d` };
  if (days <= 21) return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e", label: `${days}d` };
  if (days >= 999) return { bg: "#f8fafc", bd: "#e2e8f0", fg: "#64748b", label: "—" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239", label: `${days}d` };
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
    maxWidth: 1440,
    margin: "0 auto",
    padding: 22,
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,

  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,

  h1: {
    fontSize: 34,
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

  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 14,
  } as React.CSSProperties,

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
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

  textarea: {
    width: "100%",
    minHeight: 120,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    lineHeight: 1.45,
    outline: "none",
    whiteSpace: "pre-wrap",
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

  btnSoft: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  decisionBtn: {
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid #dbe4f0",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: 950,
    cursor: "pointer",
    textAlign: "left",
  } as React.CSSProperties,

  decisionBtnActive: {
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
    textAlign: "left",
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
  } as React.CSSProperties,

  warn: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 12,
    color: "#92400e",
    fontWeight: 900,
    fontSize: 13,
  } as React.CSSProperties,

  info: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 12,
    color: "#1d4ed8",
    fontWeight: 900,
    fontSize: 13,
  } as React.CSSProperties,

  barBg: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
  } as React.CSSProperties,

  barRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr auto",
    gap: 10,
    alignItems: "center",
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function InterventionReviewPage() {
  return (
    <Suspense fallback={null}>
      <InterventionReviewPageContent />
    </Suspense>
  );
}

function InterventionReviewPageContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sp = useSearchParams();

  const id = safe((params as any)?.id);
  const returnTo = safe(sp.get("returnTo"));

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [intervention, setIntervention] = useState<InterventionRow | null>(null);
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceEntryRow[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);

  const [decision, setDecision] = useState<ReviewDecision>("continue");
  const [reviewDate, setReviewDate] = useState(todayIso());
  const [reviewSummary, setReviewSummary] = useState("");
  const [improved, setImproved] = useState("");
  const [stillNeeds, setStillNeeds] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextReviewOn, setNextReviewOn] = useState("");
  const [status, setStatus] = useState("open");

  const [quickViewOpen, setQuickViewOpen] = useState(false);

  async function loadIntervention() {
    const r = await supabase.from("interventions").select("*").eq("id", id).single();
    if (r.error) throw r.error;

    const row = (r.data as InterventionRow) || null;
    setIntervention(row);

    if (row) {
      setStatus(safe(row.status) || "open");
      setNextReviewOn(safe(row.review_due_on || row.review_due_date || row.next_review_on || ""));
    }

    return row;
  }

  async function loadStudentAndClass(row: InterventionRow | null) {
    if (!row?.student_id) {
      setStudent(null);
      setKlass(null);
      return;
    }

    const studentCandidates = [
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,is_ilp",
      "id,class_id,first_name,preferred_name,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,is_ilp",
    ];

    let foundStudent: StudentRow | null = null;

    for (const sel of studentCandidates) {
      const s = await supabase.from("students").select(sel).eq("id", row.student_id).maybeSingle();
      if (!s.error) {
        foundStudent = (s.data as any) || null;
        break;
      }
      if (!isMissingRelationOrColumn(s.error)) throw s.error;
    }

    setStudent(foundStudent);

    const classId = safe(foundStudent?.class_id || row.class_id);
    if (!classId) {
      setKlass(null);
      return;
    }

    const classCandidates = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level,room",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of classCandidates) {
      const c = await supabase.from("classes").select(sel).eq("id", classId).maybeSingle();
      if (!c.error) {
        setKlass((c.data as any) || null);
        return;
      }
      if (!isMissingRelationOrColumn(c.error)) throw c.error;
    }

    setKlass(null);
  }

  async function loadEvidence(row: InterventionRow | null) {
    if (!row?.student_id) {
      setEvidence([]);
      return;
    }

    const candidates = [
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility,is_deleted",
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility",
      "id,student_id,class_id,title,summary,body,learning_area,created_at",
    ];

    for (const sel of candidates) {
      let r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("student_id", row.student_id)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(8);

      if (!r.error) {
        const rows = (((r.data as any[]) ?? []) as EvidenceEntryRow[]).filter((x) => x.is_deleted !== true);
        setEvidence(rows);
        return;
      }

      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setEvidence([]);
  }

  async function loadAnalytics(row: InterventionRow | null) {
    if (!row?.student_id) {
      setAnalytics(null);
      return;
    }

    try {
      const data = (await loadStudentAnalytics(row.student_id)) as StudentAnalytics;
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    }
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);

    try {
      const row = await loadIntervention();
      await Promise.all([loadStudentAndClass(row), loadEvidence(row), loadAnalytics(row)]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(null), 1800);
    return () => clearTimeout(t);
  }, [ok]);

  const tone = useMemo(() => pickStatusTone(intervention?.status), [intervention?.status]);

  const suggestedSummary = useMemo(() => {
    if (decision === "close") return "Student has met the current support goal and the plan can now be closed.";
    if (decision === "adjust") return "Current plan needs adjustment based on the latest evidence and review findings.";
    if (decision === "escalate") return "Current support appears insufficient and should be escalated or broadened.";
    return "Current support should continue with monitoring and another scheduled review.";
  }, [decision]);

  const topAttributes = useMemo(() => (analytics?.attributes ?? []).slice(0, 5), [analytics?.attributes]);
  const topFreshness = useMemo(() => (analytics?.evidenceFreshness ?? []).slice(0, 4), [analytics?.evidenceFreshness]);

  function applyDecisionTemplate(next: ReviewDecision) {
    setDecision(next);

    if (next === "continue") {
      setReviewSummary("Support should continue with current focus.");
      setNextStep("Continue the current plan and monitor progress.");
      setStatus("open");
      if (!nextReviewOn) setNextReviewOn(addDays(14));
      return;
    }

    if (next === "adjust") {
      setReviewSummary("The plan needs refinement based on current evidence.");
      setNextStep("Adjust the strategy and review again after another short cycle.");
      setStatus("monitoring");
      if (!nextReviewOn) setNextReviewOn(addDays(14));
      return;
    }

    if (next === "close") {
      setReviewSummary("The support goal appears secure and the plan can be closed.");
      setNextStep("Close the plan and continue normal classroom monitoring.");
      setStatus("closed");
      setNextReviewOn("");
      return;
    }

    if (next === "escalate") {
      setReviewSummary("The student needs more intensive or broader support than the current plan provides.");
      setNextStep("Escalate support and set a tighter review window.");
      setStatus("open");
      if (!nextReviewOn) setNextReviewOn(addDays(7));
    }
  }

  function applyReviewRhythm(days: number) {
    setNextReviewOn(addDays(days));
  }

  async function saveReview(goBack = false) {
    if (!intervention) {
      setErr("Intervention not loaded.");
      return;
    }

    setBusy(true);
    setErr(null);
    setOk(null);

    try {
      const reviewBlock = buildReviewBlock({
        date: reviewDate,
        decision,
        improved,
        stillNeeds,
        nextStep,
        reviewSummary: reviewSummary || suggestedSummary,
      });

      const baseNotes = safe(intervention.notes || intervention.note);
      const mergedNotes = mergeNotesWithReview(baseNotes, reviewBlock);

      let payload: any = {
        notes: mergedNotes,
        status: safe(status) || (decision === "close" ? "closed" : "open"),
        review_due_on: safe(nextReviewOn) || null,
        review_due_date: safe(nextReviewOn) || null,
        next_review_on: safe(nextReviewOn) || null,
        updated_at: new Date().toISOString(),
      };

      const withLastReviewed = {
        ...payload,
        last_reviewed_at: new Date().toISOString(),
      };

      let updateResp = await supabase.from("interventions").update(withLastReviewed).eq("id", intervention.id);

      if (updateResp.error && isMissingRelationOrColumn(updateResp.error)) {
        updateResp = await supabase.from("interventions").update(payload).eq("id", intervention.id);
      }

      if (updateResp.error) throw updateResp.error;

      setOk("Review saved.");
      await loadAll();

      if (goBack) {
        router.push(
          returnTo ||
            `/admin/interventions${
              safe(intervention.class_id) ? `?classId=${encodeURIComponent(safe(intervention.class_id))}` : ""
            }`
        );
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Intervention Review</div>
          <div style={S.h1}>{safe(intervention?.title) || "Review support plan"}</div>
          <div style={S.sub}>
            {student ? studentDisplayName(student) : "Student"}
            {klass ? ` • ${safe(klass.name) || "Class"} ${klass.year_level != null ? fmtYear(klass.year_level) : ""}` : ""}
            {student?.is_ilp ? " • ILP" : ""}
          </div>

          <div style={{ ...S.row, marginTop: 12 }}>
            <span
              style={{
                ...S.chip,
                background: tone.bg,
                border: `1px solid ${tone.bd}`,
                color: tone.fg,
              }}
            >
              {safe(intervention?.status) || "open"}
            </span>

            {safe(intervention?.priority) ? <span style={S.chipMuted}>{safe(intervention?.priority)}</span> : null}
            {safe(intervention?.tier) ? <span style={S.chipMuted}>Tier {safe(intervention?.tier)}</span> : null}
            {pickReviewDate(intervention || {}) ? (
              <span style={S.chipMuted}>Current review {isoShort(pickReviewDate(intervention || {}))}</span>
            ) : null}
            {analytics ? <span style={S.chipMuted}>Student status: {safe(analytics.statusLabel) || "Watch"}</span> : null}
            {analytics?.lastEvidenceDays != null ? (
              <span style={S.chipMuted}>Last evidence: {analytics.lastEvidenceDays}d</span>
            ) : null}

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              {student ? (
                <button style={S.btn} onClick={() => setQuickViewOpen(true)}>
                  Quick view
                </button>
              ) : null}

              {intervention ? (
                <button
                  style={S.btn}
                  onClick={() =>
                    router.push(
                      `/admin/interventions-entry?id=${encodeURIComponent(intervention.id)}${
                        safe(intervention.class_id) ? `&classId=${encodeURIComponent(safe(intervention.class_id))}` : ""
                      }${safe(intervention.student_id) ? `&studentId=${encodeURIComponent(safe(intervention.student_id))}` : ""}`
                    )
                  }
                >
                  Edit plan
                </button>
              ) : null}

              {student ? (
                <button
                  style={S.btn}
                  onClick={() => router.push(`/admin/students/${encodeURIComponent(safe(student.id))}`)}
                >
                  Student hub
                </button>
              ) : null}

              <button
                style={S.btn}
                onClick={() =>
                  router.push(
                    returnTo ||
                      `/admin/interventions${
                        safe(intervention?.class_id) ? `?classId=${encodeURIComponent(safe(intervention?.class_id))}` : ""
                      }`
                  )
                }
              >
                ← Back to queue
              </button>

              <button style={S.btnPrimary} onClick={() => saveReview(false)} disabled={busy}>
                Save review
              </button>
            </div>
          </div>

          {busy ? <div style={S.ok}>Loading review page…</div> : null}
          {ok ? <div style={S.ok}>{ok}</div> : null}
          {err ? <div style={S.err}>Error: {err}</div> : null}
        </section>

        <div style={{ ...S.grid2, marginTop: 14 }}>
          <div style={{ display: "grid", gap: 14 }}>
            <section style={S.card}>
              <div style={S.sectionPad}>
                <div style={S.sectionTitle}>Review Decision</div>
                <div style={S.sectionHelp}>
                  Decide what should happen next: continue, adjust, close, or escalate the plan.
                </div>

                <div style={{ ...S.grid3, marginTop: 12 }}>
                  {([
                    ["continue", "Continue plan", "Keep the current support in place."],
                    ["adjust", "Adjust strategy", "Refine the plan based on evidence."],
                    ["close", "Close plan", "End the intervention and return to normal monitoring."],
                  ] as Array<[ReviewDecision, string, string]>).map(([key, label, help]) => (
                    <button
                      key={key}
                      type="button"
                      style={decision === key ? S.decisionBtnActive : S.decisionBtn}
                      onClick={() => applyDecisionTemplate(key)}
                    >
                      <div>{label}</div>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.82, lineHeight: 1.35 }}>
                        {help}
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 10, maxWidth: 420 }}>
                  <button
                    type="button"
                    style={decision === "escalate" ? S.decisionBtnActive : S.decisionBtn}
                    onClick={() => applyDecisionTemplate("escalate")}
                  >
                    <div>Escalate support</div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.82, lineHeight: 1.35 }}>
                      Increase intensity, broaden support, or refer upward.
                    </div>
                  </button>
                </div>
              </div>
            </section>

            <section style={S.card}>
              <div style={S.sectionPad}>
                <div style={S.sectionTitle}>Review Reflection</div>
                <div style={S.sectionHelp}>
                  Capture what changed, what still matters, and what should happen next.
                </div>

                <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
                  <div>
                    <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Review date</label>
                    <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} style={S.input} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Review summary</label>
                    <textarea
                      value={reviewSummary}
                      onChange={(e) => setReviewSummary(e.target.value)}
                      style={S.textarea}
                      placeholder={suggestedSummary}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>What has improved?</label>
                    <textarea
                      value={improved}
                      onChange={(e) => setImproved(e.target.value)}
                      style={S.textarea}
                      placeholder="What has improved since the plan began or since the last review?"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>What still needs support?</label>
                    <textarea
                      value={stillNeeds}
                      onChange={(e) => setStillNeeds(e.target.value)}
                      style={S.textarea}
                      placeholder="What is still not secure, consistent, or improving fast enough?"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Next step</label>
                    <textarea
                      value={nextStep}
                      onChange={(e) => setNextStep(e.target.value)}
                      style={S.textarea}
                      placeholder="What should happen next in teaching, support, or monitoring?"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <section style={S.card}>
              <div style={S.sectionPad}>
                <div style={S.sectionTitle}>Plan Context</div>
                <div style={S.sectionHelp}>
                  Review the current intervention details before making a decision.
                </div>

                <div style={S.list}>
                  <div style={S.item}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>Current title</div>
                    <div style={{ marginTop: 6, color: "#475569", fontWeight: 800 }}>
                      {safe(intervention?.title) || "—"}
                    </div>
                  </div>

                  <div style={S.item}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>Strategy</div>
                    <div style={{ marginTop: 6, color: "#475569", fontWeight: 800 }}>
                      {safe(intervention?.strategy) || "—"}
                    </div>
                  </div>

                  <div style={S.item}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>Current notes</div>
                    <div
                      style={{
                        marginTop: 6,
                        color: "#475569",
                        fontWeight: 800,
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.45,
                      }}
                    >
                      {stripTaggedSections(safe(intervention?.notes || intervention?.note)) || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section style={S.card}>
              <div style={S.sectionPad}>
                <div style={S.sectionTitle}>Student Signals</div>
                <div style={S.sectionHelp}>
                  Shared student analytics give context before you finalise the review.
                </div>

                {analytics ? (
                  <>
                    <div style={{ ...S.row, marginTop: 12 }}>
                      <span style={S.chip}>Status: {safe(analytics.statusLabel) || "Watch"}</span>
                      <span style={S.chipMuted}>Confidence: {clamp(Math.round(Number(analytics.profileConfidence ?? 0)), 0, 100)}%</span>
                      <span style={S.chipMuted}>Attention: {clamp(Math.round(Number(analytics.attentionScore ?? 0)), 0, 100)}%</span>
                      <span style={S.chipMuted}>Next action: {safe(analytics.nextAction) || "Monitor current plan"}</span>
                    </div>

                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                      {topFreshness.length ? (
                        topFreshness.map((fresh) => {
                          const tone = freshnessTone(fresh.days);
                          const fill = fresh.days >= 999 ? 0 : clamp(100 - fresh.days * 4, 0, 100);
                          return (
                            <div key={fresh.label} style={S.barRow}>
                              <div style={{ fontWeight: 900, color: "#0f172a" }}>{fresh.label}</div>
                              <div style={{ ...S.barBg }}>
                                <div
                                  style={{
                                    width: `${fill}%`,
                                    height: "100%",
                                    background:
                                      fresh.days <= 7 ? "#22c55e" : fresh.days <= 21 ? "#f59e0b" : "#ef4444",
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  ...S.chipMuted,
                                  background: tone.bg,
                                  border: `1px solid ${tone.bd}`,
                                  color: tone.fg,
                                }}
                              >
                                {tone.label}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={S.warn}>No freshness breakdown available yet.</div>
                      )}
                    </div>

                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                      {topAttributes.length ? (
                        topAttributes.map((attr, idx) => {
                          const score = attributeScorePercent(attr);
                          return (
                            <div key={attr.id || attr.code || attr.label || attr.name || attr.key || `attr-${idx}`} style={S.barRow}>
                              <div style={{ fontWeight: 900, color: "#0f172a" }}>{attributeLabel(attr)}</div>
                              <div style={S.barBg}>
                                <div
                                  style={{
                                    width: `${score}%`,
                                    height: "100%",
                                    background: score >= 75 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444",
                                  }}
                                />
                              </div>
                              <div style={S.chipMuted}>{score}%</div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={S.warn}>No learning profile attributes available yet.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={S.warn}>Student analytics are unavailable for this intervention right now.</div>
                )}
              </div>
            </section>

            <section style={S.card}>
              <div style={S.sectionPad}>
                <div style={S.sectionTitle}>Next Review</div>
                <div style={S.sectionHelp}>
                  Choose a follow-up rhythm or close the plan now.
                </div>

                <div style={{ ...S.row, marginTop: 12 }}>
                  <button type="button" style={S.btnSoft} onClick={() => applyReviewRhythm(7)}>
                    1 week
                  </button>
                  <button type="button" style={S.btnSoft} onClick={() => applyReviewRhythm(14)}>
                    2 weeks
                  </button>
                  <button type="button" style={S.btnSoft} onClick={() => applyReviewRhythm(21)}>
                    3 weeks
                  </button>
                  <button type="button" style={S.btnSoft} onClick={() => applyReviewRhythm(28)}>
                    4 weeks
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Next review on</label>
                  <input
                    type="date"
                    value={nextReviewOn}
                    onChange={(e) => setNextReviewOn(e.target.value)}
                    style={S.input}
                    disabled={decision === "close"}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "block", fontWeight: 950, marginBottom: 6 }}>Outcome status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} style={S.select}>
                    <option value="open">open</option>
                    <option value="monitoring">monitoring</option>
                    <option value="review">review</option>
                    <option value="paused">paused</option>
                    <option value="closed">closed</option>
                    <option value="done">done</option>
                  </select>
                </div>

                <div style={{ ...S.row, marginTop: 12 }}>
                  <button style={S.btnPrimary} onClick={() => saveReview(false)} disabled={busy}>
                    Save review
                  </button>
                  <button style={S.btn} onClick={() => saveReview(true)} disabled={busy}>
                    Save + back to queue
                  </button>
                </div>
              </div>
            </section>

            <section style={S.card}>
              <div style={S.sectionPad}>
                <div style={S.sectionTitle}>Linked Evidence</div>
                <div style={S.sectionHelp}>
                  Recent evidence for this student to ground the review in classroom observations.
                </div>

                <div style={S.list}>
                  {evidence.length === 0 ? (
                    <div style={S.item}>No recent evidence found for this student.</div>
                  ) : (
                    evidence.map((ev) => (
                      <div key={ev.id} style={S.item}>
                        <div style={{ ...S.row, justifyContent: "space-between" }}>
                          <div style={{ fontWeight: 950, color: "#0f172a" }}>{safe(ev.title) || "Evidence"}</div>
                          <span style={S.chipMuted}>{isoShort(effectiveEvidenceDate(ev))}</span>
                        </div>

                        <div style={{ ...S.row, marginTop: 8 }}>
                          {safe(ev.learning_area) ? <span style={S.chip}>{safe(ev.learning_area)}</span> : null}
                          {safe(ev.visibility) ? <span style={S.chipMuted}>{safe(ev.visibility)}</span> : null}
                        </div>

                        {safe(ev.summary) ? (
                          <div style={{ marginTop: 8, color: "#475569", fontWeight: 800, lineHeight: 1.4 }}>
                            {safe(ev.summary)}
                          </div>
                        ) : null}

                        {safe(ev.body) && !safe(ev.summary) ? (
                          <div style={{ marginTop: 8, color: "#475569", fontWeight: 800, lineHeight: 1.4 }}>
                            {clip(safe(ev.body), 220)}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>

                {student ? (
                  <div style={{ ...S.row, marginTop: 12 }}>
                    <button
                      style={S.btnSoft}
                      onClick={() =>
                        router.push(
                          `/admin/evidence-entry?studentId=${encodeURIComponent(student.id)}${
                            safe(student.class_id) ? `&classId=${encodeURIComponent(safe(student.class_id))}` : ""
                          }&returnTo=${encodeURIComponent(`/admin/interventions/${encodeURIComponent(id)}/review`)}`
                        )
                      }
                    >
                      + Add evidence
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </main>

      <StudentQuickViewDrawer
        studentId={safe(student?.id) || null}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        returnTo={`/admin/interventions/${encodeURIComponent(id)}/review`}
      />
    </div>
  );
}
