"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentQuickViewDrawer from "@/app/admin/components/StudentQuickViewDrawer";
import { loadStudentAnalytics } from "@/lib/analytics";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────────── TYPES ───────────────────────────── */

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
  class_id?: string | null;
  first_name: string | null;
  preferred_name: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

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

/* ───────────────────────────── HELPERS ───────────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Y${y}`;
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function studentDisplayName(s: StudentRow | undefined | null) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = safe(s.surname || s.family_name);
  const full = `${first}${sur ? " " + sur : ""}`.trim();
  return full || "Student";
}

function parseTierToInt(input: any): number | null {
  const s = safe(input).toLowerCase();
  if (!s) return null;
  const m = s.match(/\d+/);
  if (!m) return null;
  const n = Number(m[0]);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function toDateInputValue(v: string | null | undefined) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

function isoShort(d: string | null | undefined) {
  if (!d) return "—";
  try {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return String(d).slice(0, 10);
    return x.toISOString().slice(0, 10);
  } catch {
    return String(d).slice(0, 10);
  }
}

function isoToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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

function daysSince(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function extractTaggedSection(source: string, tag: string) {
  const lines = String(source || "").split(/\r?\n/);
  const prefix = `${tag}:`;
  const match = lines.find((line) => line.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : "";
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

function buildNotesPayload(
  baseNotes: string,
  opts: {
    successCriteria: string;
    deliveryMode: string;
    baseline: string;
    evidenceLink: string;
  }
) {
  const parts = [safe(baseNotes)];
  if (safe(opts.successCriteria)) parts.push(`Success criteria: ${safe(opts.successCriteria)}`);
  if (safe(opts.deliveryMode)) parts.push(`Delivery mode: ${safe(opts.deliveryMode)}`);
  if (safe(opts.baseline)) parts.push(`Baseline: ${safe(opts.baseline)}`);
  if (safe(opts.evidenceLink)) parts.push(`Evidence link: ${safe(opts.evidenceLink)}`);
  return parts.filter(Boolean).join("\n\n") || null;
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

/* ───────────────────────────── TEMPLATES ───────────────────────────── */

const PLAN_TEMPLATES = [
  {
    label: "Reteaching needed",
    title: "Reteaching support plan",
    strategy: "Provide targeted reteaching with worked examples and guided practice.",
    notes: "Student requires reteaching of the current concept before independent application.",
    successCriteria:
      "Student can explain the concept and complete a similar task with minimal prompting.",
    deliveryMode: "Small group",
  },
  {
    label: "Small group support",
    title: "Small group support plan",
    strategy: "Run a short small-group session focused on the key misconception or skill gap.",
    notes: "Student will be included in a targeted group for extra guided support.",
    successCriteria:
      "Student participates successfully in a small-group reteach and transfers learning to class tasks.",
    deliveryMode: "Small group",
  },
  {
    label: "Check understanding",
    title: "Check understanding plan",
    strategy: "Use a short follow-up check, conference, or exit task to confirm understanding.",
    notes: "Student needs a quick re-check to determine whether the concept is secure.",
    successCriteria:
      "Student demonstrates understanding in a short follow-up task or conference.",
    deliveryMode: "1:1 check-in",
  },
  {
    label: "Monitor engagement",
    title: "Engagement monitoring plan",
    strategy: "Use structured check-ins, prompts, and brief monitoring during lesson transitions.",
    notes: "Student engagement and focus will be monitored over the next review cycle.",
    successCriteria:
      "Student sustains attention and completes key task steps with reduced prompting.",
    deliveryMode: "Classroom monitoring",
  },
  {
    label: "Parent communication",
    title: "Home-school communication plan",
    strategy: "Communicate concern, response plan, and review timeline with family.",
    notes: "Teacher will contact home to share goals and support approach.",
    successCriteria: "Family is informed and next review includes home-school update.",
    deliveryMode: "Home-school",
  },
  {
    label: "Writing stamina",
    title: "Writing stamina support plan",
    strategy: "Use shorter writing bursts, scaffolded planning, and regular conferencing.",
    notes: "Student needs support to sustain writing output and maintain focus across the task.",
    successCriteria:
      "Student increases independent writing time and completes an agreed writing target.",
    deliveryMode: "1:1 + small group",
  },
];

/* ───────────────────────────── STYLES ───────────────────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f7fb" } as React.CSSProperties,
  main: { flex: 1, padding: 22, maxWidth: 1360, margin: "0 auto", width: "100%" } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
  } as React.CSSProperties,

  card: { border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff" } as React.CSSProperties,
  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  } as React.CSSProperties,
  h1: { fontSize: 34, fontWeight: 950, lineHeight: 1.05, marginTop: 8, color: "#0f172a" } as React.CSSProperties,
  sub: { marginTop: 8, color: "#475569", fontWeight: 800, fontSize: 13, lineHeight: 1.45 } as React.CSSProperties,

  row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" } as React.CSSProperties,
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as React.CSSProperties,
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 } as React.CSSProperties,
  row4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 } as React.CSSProperties,
  split: { display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: 14 } as React.CSSProperties,
  grid: { display: "grid", gap: 14 } as React.CSSProperties,

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

  label: { display: "block", fontWeight: 950, color: "#0f172a", marginBottom: 6 } as React.CSSProperties,

  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
    width: "100%",
  } as React.CSSProperties,

  textarea: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 850,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
    width: "100%",
    minHeight: 140,
    whiteSpace: "pre-wrap",
    lineHeight: 1.35,
  } as React.CSSProperties,

  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
    width: "100%",
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff",
    color: "#0f172a",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #0f172a",
    fontWeight: 900,
    cursor: "pointer",
    background: "#0f172a",
    color: "#fff",
  } as React.CSSProperties,

  btnDanger: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #fecaca",
    fontWeight: 900,
    cursor: "pointer",
    background: "#fff1f2",
    color: "#9f1239",
  } as React.CSSProperties,

  btnSoft: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    fontWeight: 900,
    cursor: "pointer",
    background: "#f8fafc",
    color: "#334155",
  } as React.CSSProperties,

  alert: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
  } as React.CSSProperties,

  ok: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #a7f3d0",
    background: "#ecfdf5",
    padding: 12,
    color: "#065f46",
    fontWeight: 900,
  } as React.CSSProperties,

  warn: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 12,
    color: "#92400e",
    fontWeight: 900,
  } as React.CSSProperties,

  info: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 12,
    color: "#1d4ed8",
    fontWeight: 900,
  } as React.CSSProperties,

  tableWrap: { border: "1px solid #e8eaf0", borderRadius: 16, overflow: "hidden" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const } as React.CSSProperties,
  th: {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 950,
    color: "#64748b",
    padding: 12,
    borderBottom: "1px solid #e8eaf0",
    background: "#fbfcff",
  } as React.CSSProperties,
  td: { padding: 12, borderBottom: "1px solid #eef2f7", verticalAlign: "top" } as React.CSSProperties,

  list: { display: "grid", gap: 10 } as React.CSSProperties,
  item: { border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, background: "#fff" } as React.CSSProperties,

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

/* ───────────────────────────── PAGE ───────────────────────────── */

export default function InterventionEntryPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const id = safe(sp.get("id"));
  const classIdFromUrl = safe(sp.get("classId"));
  const studentIdFromUrl = safe(sp.get("studentId"));
  const titleFromUrl = safe(sp.get("title"));
  const notesFromUrl = safe(sp.get("notes"));
  const strategyFromUrl = safe(sp.get("strategy"));
  const returnTo = safe(sp.get("returnTo"));

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [latest, setLatest] = useState<InterventionRow[]>([]);
  const [latestEvidence, setLatestEvidence] = useState<EvidenceEntryRow[]>([]);
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);

  const [classId, setClassId] = useState<string>(classIdFromUrl);
  const [studentId, setStudentId] = useState<string>(studentIdFromUrl);

  const [title, setTitle] = useState(titleFromUrl);
  const [notes, setNotes] = useState(notesFromUrl);
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState<string>("normal");
  const [tier, setTier] = useState<string>("");
  const [strategy, setStrategy] = useState<string>(strategyFromUrl);

  const [reviewDueOn, setReviewDueOn] = useState<string>("");
  const [nextReviewOn, setNextReviewOn] = useState<string>("");
  const [dueOn, setDueOn] = useState<string>("");

  const [successCriteria, setSuccessCriteria] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("");
  const [baseline, setBaseline] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");

  const [quickViewOpen, setQuickViewOpen] = useState(false);

  async function loadClasses() {
    const candidates = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of candidates) {
      const r = await supabase
        .from("classes")
        .select(sel)
        .order("year_level", { ascending: true })
        .order("name", { ascending: true });

      if (!r.error) {
        setClasses((r.data as any[]) ?? []);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setClasses([]);
  }

  async function loadStudentsForClass(cId: string) {
    if (!cId) {
      setStudents([]);
      return;
    }

    const base = "id,class_id,first_name,preferred_name,is_ilp";
    const candidates = [`${base},surname`, `${base},family_name`, base];

    for (const sel of candidates) {
      const r = await supabase
        .from("students")
        .select(sel)
        .eq("class_id", cId)
        .order("preferred_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (!r.error) {
        setStudents((((r.data as any[]) ?? []) as StudentRow[]));
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadLatestForStudent(sId: string) {
    if (!sId) {
      setLatest([]);
      return;
    }

    const r = await supabase
      .from("interventions")
      .select("*")
      .eq("student_id", sId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (r.error) throw r.error;
    setLatest((((r.data as any[]) ?? []) as InterventionRow[]));
  }

  async function loadEvidenceForStudent(sId: string) {
    if (!sId) {
      setLatestEvidence([]);
      return;
    }

    const candidates = [
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility,is_deleted",
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,summary,body,learning_area,created_at",
    ];

    for (const sel of candidates) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("student_id", sId)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(8);

      if (!r.error) {
        setLatestEvidence((((r.data as any[]) ?? []) as EvidenceEntryRow[]).filter((x) => x.is_deleted !== true));
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setLatestEvidence([]);
  }

  async function loadAnalyticsForStudent(sId: string) {
    if (!sId) {
      setAnalytics(null);
      return;
    }

    try {
      const data = (await loadStudentAnalytics(sId)) as StudentAnalytics;
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    }
  }

  async function loadExisting() {
    if (!id) return null;

    const r = await supabase.from("interventions").select("*").eq("id", id).single();
    if (r.error) throw r.error;

    const it = r.data as InterventionRow;

    setClassId(safe(it.class_id));
    setStudentId(safe(it.student_id));
    setTitle(safe(it.title));
    setNotes(stripTaggedSections(safe(it.notes || it.note)));
    setStatus(safe(it.status) || "open");
    setPriority(safe(it.priority) || "normal");
    setTier(it.tier == null ? "" : String(it.tier));
    setStrategy(safe(it.strategy));
    setReviewDueOn(toDateInputValue(it.review_due_on || it.review_due_date));
    setNextReviewOn(toDateInputValue(it.next_review_on));
    setDueOn(toDateInputValue(it.due_on));

    const taggedNotes = safe(it.notes || it.note);
    setSuccessCriteria(extractTaggedSection(taggedNotes, "Success criteria"));
    setDeliveryMode(extractTaggedSection(taggedNotes, "Delivery mode"));
    setBaseline(extractTaggedSection(taggedNotes, "Baseline"));
    setEvidenceLink(extractTaggedSection(taggedNotes, "Evidence link"));

    return it;
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);
    setOk(null);

    try {
      await loadClasses();
      const existing = await loadExisting();

      const effectiveClassId = safe(existing?.class_id || classIdFromUrl || classId);
      const effectiveStudentId = safe(existing?.student_id || studentIdFromUrl || studentId);

      if (effectiveClassId) await loadStudentsForClass(effectiveClassId);
      if (effectiveStudentId) {
        await Promise.all([
          loadLatestForStudent(effectiveStudentId),
          loadEvidenceForStudent(effectiveStudentId),
          loadAnalyticsForStudent(effectiveStudentId),
        ]);
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      return;
    }
    loadStudentsForClass(classId).catch((e: any) => setErr(String(e?.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    loadLatestForStudent(studentId).catch((e: any) => setErr(String(e?.message ?? e)));
    loadEvidenceForStudent(studentId).catch((e: any) => setErr(String(e?.message ?? e)));
    loadAnalyticsForStudent(studentId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(null), 1600);
    return () => clearTimeout(t);
  }, [ok]);

  const header = useMemo(() => (id ? "Edit intervention" : "New intervention"), [id]);

  const selectedClass = useMemo(() => classes.find((x) => x.id === classId), [classes, classId]);
  const selectedStudent = useMemo(() => students.find((x) => x.id === studentId), [students, studentId]);

  const selectedClassLabel = useMemo(() => {
    return selectedClass
      ? `${safe(selectedClass.name) || "Class"} ${
          selectedClass.year_level != null ? `(${fmtYear(selectedClass.year_level)})` : ""
        }`
      : "Class";
  }, [selectedClass]);

  const openInterventionsForStudent = useMemo(() => {
    return latest.filter((x) => {
      const s = safe(x.status).toLowerCase();
      return !(s === "closed" || s === "done" || s === "resolved" || s === "archived" || s === "completed");
    });
  }, [latest]);

  const overdueInterventionsForStudent = useMemo(() => {
    return openInterventionsForStudent.filter((x) => {
      const d = pickReviewDate(x);
      if (!d) return false;
      const delta = daysSince(d);
      return delta != null && delta > 0;
    });
  }, [openInterventionsForStudent]);

  const lastEvidenceDays = useMemo(() => {
    if (analytics?.lastEvidenceDays != null) return analytics.lastEvidenceDays;
    if (!latestEvidence.length) return null;
    return daysSince(latestEvidence[0]?.occurred_on || latestEvidence[0]?.created_at || null);
  }, [latestEvidence, analytics?.lastEvidenceDays]);

  const topAttributes = useMemo(() => (analytics?.attributes ?? []).slice(0, 4), [analytics?.attributes]);
  const topFreshness = useMemo(() => (analytics?.evidenceFreshness ?? []).slice(0, 4), [analytics?.evidenceFreshness]);

  const currentStatusTone = useMemo(() => pickStatusTone(status), [status]);

  function clearForm() {
    setTitle(titleFromUrl || "");
    setNotes(notesFromUrl || "");
    setStatus("open");
    setPriority("normal");
    setTier("");
    setStrategy(strategyFromUrl || "");
    setReviewDueOn("");
    setNextReviewOn("");
    setDueOn("");
    setSuccessCriteria("");
    setDeliveryMode("");
    setBaseline("");
    setEvidenceLink("");
  }

  function onChangeClass(nextClassId: string) {
    setClassId(nextClassId);

    if (studentId) {
      const s = students.find((x) => x.id === studentId);
      if (s && nextClassId && s.class_id !== nextClassId) setStudentId("");
    }
  }

  function onChangeStudent(nextStudentId: string) {
    setStudentId(nextStudentId);

    const s = students.find((x) => x.id === nextStudentId);
    if (s?.class_id) setClassId(s.class_id || "");
  }

  function applyTemplate(t: (typeof PLAN_TEMPLATES)[number]) {
    setTitle((prev) => safe(prev) || t.title);
    setStrategy((prev) => safe(prev) || t.strategy);
    setNotes((prev) => safe(prev) || t.notes);
    setSuccessCriteria((prev) => safe(prev) || t.successCriteria);
    setDeliveryMode((prev) => safe(prev) || t.deliveryMode);
  }

  function applyReviewRhythm(days: number) {
    const date = addDays(days);
    setReviewDueOn(date);
    setNextReviewOn(date);
  }

  function captureBaseline() {
    const latestEvidenceItem = latestEvidence[0];
    const evidenceText = latestEvidenceItem
      ? `${safe(latestEvidenceItem.title) || "Evidence"}${
          safe(latestEvidenceItem.learning_area) ? ` • ${safe(latestEvidenceItem.learning_area)}` : ""
        }${
          isoShort(latestEvidenceItem.occurred_on || latestEvidenceItem.created_at || null) !== "—"
            ? ` • ${isoShort(latestEvidenceItem.occurred_on || latestEvidenceItem.created_at || null)}`
            : ""
        }`
      : "";

    const baselineText = [safe(baseline), `Baseline captured ${isoToday()}.`, evidenceText ? `Starting evidence: ${evidenceText}.` : ""]
      .filter(Boolean)
      .join(" ");

    setBaseline(baselineText.trim());
    setOk("Baseline captured into the form.");
  }

  function loadEvidenceIntoPlan(ev: EvidenceEntryRow) {
    const descriptor = [safe(ev.title) || "Evidence", safe(ev.learning_area), isoShort(ev.occurred_on || ev.created_at || null)]
      .filter(Boolean)
      .join(" • ");

    setEvidenceLink(descriptor);
    if (!safe(title) && safe(ev.title)) setTitle(`${safe(ev.title)} support plan`);
    if (!safe(notes)) {
      const noteBits = [safe(ev.summary), safe(ev.body)].filter(Boolean);
      setNotes(noteBits.join("\n\n"));
    }
    setOk("Evidence linked into the plan.");
  }

  function duplicateFromLatest(r: InterventionRow) {
    setTitle(safe(r.title));
    setNotes(stripTaggedSections(safe(r.notes || r.note)));
    setStatus("open");
    setPriority(safe(r.priority) || "normal");
    setTier(r.tier == null ? "" : String(r.tier));
    setStrategy(safe(r.strategy));
    setReviewDueOn("");
    setNextReviewOn("");
    setDueOn("");
    setSuccessCriteria(extractTaggedSection(safe(r.notes || r.note), "Success criteria"));
    setDeliveryMode(extractTaggedSection(safe(r.notes || r.note), "Delivery mode"));
    setBaseline(extractTaggedSection(safe(r.notes || r.note), "Baseline"));
    setEvidenceLink(extractTaggedSection(safe(r.notes || r.note), "Evidence link"));
    setOk("Plan duplicated into the form.");
  }

  function continueFromLatest(r: InterventionRow) {
    router.push(
      `/admin/interventions-entry?id=${encodeURIComponent(r.id)}${
        classId ? `&classId=${encodeURIComponent(classId)}` : ""
      }${studentId ? `&studentId=${encodeURIComponent(studentId)}` : ""}${
        returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
      }`
    );
  }

  async function save(goToReview = false) {
    if (!classId) {
      setErr("Please choose a class.");
      return;
    }
    if (!studentId) {
      setErr("Please choose a student.");
      return;
    }
    if (!safe(title)) {
      setErr("Please enter a title.");
      return;
    }

    setBusy(true);
    setErr(null);
    setOk(null);

    try {
      const payload: any = {
        class_id: classId,
        student_id: studentId,
        title: title.trim(),
        notes: buildNotesPayload(notes.trim(), {
          successCriteria,
          deliveryMode,
          baseline,
          evidenceLink,
        }),
        status: (safe(status) || "open").toLowerCase(),
        priority: safe(priority) || "normal",
        strategy: safe(strategy) || null,
        review_due_on: safe(reviewDueOn) || null,
        review_due_date: safe(reviewDueOn) || null,
        next_review_on: safe(nextReviewOn) || null,
        due_on: safe(dueOn) || null,
      };

      const tierInt = parseTierToInt(tier);
      payload.tier = tierInt != null ? tierInt : null;

      const resp = id
        ? await supabase.from("interventions").update(payload).eq("id", id)
        : await supabase.from("interventions").insert(payload).select("id").single();

      if (resp.error) throw resp.error;

      const newId = id || (resp.data as any)?.id;
      setOk(id ? "Intervention updated." : "Intervention created.");

      await loadLatestForStudent(studentId);

      if (goToReview && newId) {
        router.push(`/admin/interventions/${encodeURIComponent(newId)}/review`);
        return;
      }

      if (!id && newId) {
        router.push(`/admin/interventions/${encodeURIComponent(newId)}/review`);
        return;
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function closeNow() {
    if (!id) return;

    const okConfirm = window.confirm("Close this intervention now?");
    if (!okConfirm) return;

    setBusy(true);
    setErr(null);
    setOk(null);

    try {
      const payload: any = {
        status: "closed",
        review_due_on: safe(reviewDueOn) || null,
        review_due_date: safe(reviewDueOn) || null,
        next_review_on: safe(nextReviewOn) || null,
        due_on: safe(dueOn) || null,
      };

      const r = await supabase.from("interventions").update(payload).eq("id", id);
      if (r.error) throw r.error;

      setStatus("closed");
      setOk("Intervention closed.");
      await loadLatestForStudent(studentId);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!id) return;
    const okConfirm = window.confirm("Delete this intervention?\n\nThis cannot be undone.");
    if (!okConfirm) return;

    setBusy(true);
    setErr(null);

    try {
      const r = await supabase.from("interventions").delete().eq("id", id);
      if (r.error) throw r.error;

      router.push(
        returnTo || `/admin/interventions${classId ? `?classId=${encodeURIComponent(classId)}&status=open` : ""}`
      );
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
          <div style={S.subtle}>Intervention Entry</div>
          <div style={S.h1}>{header}</div>
          <div style={S.sub}>
            Create or update a support plan, ground it in recent evidence, and move straight into review workflow.
          </div>

          <div style={{ ...S.row, marginTop: 10 }}>
            <span style={S.chip}>Class: {classId ? selectedClassLabel : "—"}</span>
            <span style={S.chip}>Student: {selectedStudent ? studentDisplayName(selectedStudent) : "—"}</span>
            <span style={S.chip}>Mode: {id ? "Edit" : "Create"}</span>
            {selectedStudent?.is_ilp ? <span style={S.chip}>ILP</span> : null}
            {analytics ? <span style={S.chipMuted}>Status: {safe(analytics.statusLabel) || "Watch"}</span> : null}
            {lastEvidenceDays != null ? (
              <span style={S.chipMuted}>
                Last evidence: {lastEvidenceDays} day{lastEvidenceDays === 1 ? "" : "s"} ago
              </span>
            ) : null}
            {!!openInterventionsForStudent.length ? (
              <span style={S.chipMuted}>Open plans: {openInterventionsForStudent.length}</span>
            ) : null}
            {!!overdueInterventionsForStudent.length ? (
              <span style={S.chipMuted}>Overdue reviews: {overdueInterventionsForStudent.length}</span>
            ) : null}

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              {selectedStudent ? (
                <button style={S.btn} onClick={() => setQuickViewOpen(true)} disabled={busy}>
                  Quick view
                </button>
              ) : null}

              <button
                style={S.btn}
                onClick={() =>
                  router.push(
                    returnTo ||
                      `/admin/interventions${classId ? `?classId=${encodeURIComponent(classId)}&status=open` : ""}`
                  )
                }
                disabled={busy}
              >
                ← Back
              </button>

              {id ? (
                <button
                  style={S.btn}
                  onClick={() => router.push(`/admin/interventions/${encodeURIComponent(id)}/review`)}
                  disabled={busy}
                >
                  Open review
                </button>
              ) : null}

              <button style={S.btnPrimary} onClick={() => save(false)} disabled={busy}>
                {id ? "Save" : "Create"}
              </button>

              {id ? (
                <>
                  <button
                    style={S.btn}
                    onClick={closeNow}
                    disabled={busy || safe(status).toLowerCase() === "closed"}
                  >
                    Close now
                  </button>
                  <button style={S.btnDanger} onClick={del} disabled={busy}>
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div
            style={{
              ...S.chip,
              marginTop: 12,
              background: currentStatusTone.bg,
              border: `1px solid ${currentStatusTone.bd}`,
              color: currentStatusTone.fg,
            }}
          >
            Current outcome status: {status || "open"}
          </div>

          {selectedStudent ? (
            <div style={S.warn}>
              Triage: {studentDisplayName(selectedStudent)}
              {selectedStudent.is_ilp ? " is ILP flagged." : ""}
              {lastEvidenceDays != null
                ? ` Last evidence was ${lastEvidenceDays} day${lastEvidenceDays === 1 ? "" : "s"} ago.`
                : " No evidence preview available."}
              {openInterventionsForStudent.length
                ? ` ${openInterventionsForStudent.length} open plan${openInterventionsForStudent.length === 1 ? "" : "s"} currently exist.`
                : " No open plans currently exist."}
              {overdueInterventionsForStudent.length
                ? ` ${overdueInterventionsForStudent.length} review${overdueInterventionsForStudent.length === 1 ? "" : "s"} are overdue.`
                : ""}
              {analytics?.nextAction ? ` Next action: ${safe(analytics.nextAction)}.` : ""}
            </div>
          ) : null}

          {err ? <div style={S.alert}>Error: {err}</div> : null}
          {ok ? <div style={S.ok}>{ok}</div> : null}
        </section>

        <div style={{ ...S.split, marginTop: 14 }}>
          <div style={{ display: "grid", gap: 14 }}>
            <section style={{ ...S.card, padding: 16 }}>
              <div style={{ ...S.grid, gap: 16 }}>
                <div>
                  <div style={S.subtle}>Quick Templates</div>
                  <div style={{ ...S.row, marginTop: 10 }}>
                    {PLAN_TEMPLATES.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        style={S.btnSoft}
                        onClick={() => applyTemplate(t)}
                        disabled={busy}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={S.row2}>
                  <div>
                    <label style={S.label}>Class</label>
                    <select
                      value={classId}
                      onChange={(e) => onChangeClass(e.target.value)}
                      style={S.select}
                      disabled={busy}
                    >
                      <option value="">Select class…</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {safe(c.name) || "Unnamed"}{" "}
                          {c.year_level != null ? `(${fmtYear(c.year_level)})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Student</label>
                    <select
                      value={studentId}
                      onChange={(e) => onChangeStudent(e.target.value)}
                      style={S.select}
                      disabled={busy || !classId}
                    >
                      <option value="">{classId ? "Select student…" : "Select class first…"}</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {studentDisplayName(s)} {s.is_ilp ? "• ILP" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={S.label}>Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={S.input}
                    placeholder="e.g. Writing stamina support plan"
                    disabled={busy}
                  />
                </div>

                <div style={S.row4}>
                  <div>
                    <label style={S.label}>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} style={S.select} disabled={busy}>
                      <option value="open">open</option>
                      <option value="monitoring">monitoring</option>
                      <option value="review">review</option>
                      <option value="paused">paused</option>
                      <option value="closed">closed</option>
                      <option value="done">done</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} style={S.select} disabled={busy}>
                      <option value="low">low</option>
                      <option value="normal">normal</option>
                      <option value="high">high</option>
                      <option value="urgent">urgent</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Tier</label>
                    <select value={tier} onChange={(e) => setTier(e.target.value)} style={S.select} disabled={busy}>
                      <option value="">—</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>

                  <div>
                    <label style={S.label}>Delivery mode</label>
                    <select
                      value={deliveryMode}
                      onChange={(e) => setDeliveryMode(e.target.value)}
                      style={S.select}
                      disabled={busy}
                    >
                      <option value="">—</option>
                      <option value="1:1">1:1</option>
                      <option value="Small group">Small group</option>
                      <option value="Classroom monitoring">Classroom monitoring</option>
                      <option value="Whole-class adjustment">Whole-class adjustment</option>
                      <option value="Home-school">Home-school</option>
                      <option value="1:1 check-in">1:1 check-in</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={S.label}>Review rhythm shortcuts</label>
                  <div style={S.row}>
                    <button type="button" style={S.btnSoft} onClick={() => applyReviewRhythm(1)} disabled={busy}>
                      Tomorrow
                    </button>
                    <button type="button" style={S.btnSoft} onClick={() => applyReviewRhythm(7)} disabled={busy}>
                      Next week
                    </button>
                    <button type="button" style={S.btnSoft} onClick={() => applyReviewRhythm(14)} disabled={busy}>
                      Fortnight
                    </button>
                    <button type="button" style={S.btnSoft} onClick={() => applyReviewRhythm(21)} disabled={busy}>
                      3 weeks
                    </button>
                    <button type="button" style={S.btnSoft} onClick={() => applyReviewRhythm(28)} disabled={busy}>
                      4 weeks
                    </button>
                  </div>
                </div>

                <div style={S.row3}>
                  <div>
                    <label style={S.label}>Review due</label>
                    <input
                      type="date"
                      value={reviewDueOn}
                      onChange={(e) => {
                        setReviewDueOn(e.target.value);
                        if (!safe(nextReviewOn)) setNextReviewOn(e.target.value);
                      }}
                      style={S.input}
                      disabled={busy}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Next review on</label>
                    <input
                      type="date"
                      value={nextReviewOn}
                      onChange={(e) => setNextReviewOn(e.target.value)}
                      style={S.input}
                      disabled={busy}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Due on</label>
                    <input
                      type="date"
                      value={dueOn}
                      onChange={(e) => setDueOn(e.target.value)}
                      style={S.input}
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label style={S.label}>Strategy</label>
                  <input
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    style={S.input}
                    placeholder="e.g. Daily 10-minute conferencing + scaffolded paragraph frame"
                    disabled={busy}
                  />
                </div>

                <div>
                  <label style={S.label}>Success criteria</label>
                  <input
                    value={successCriteria}
                    onChange={(e) => setSuccessCriteria(e.target.value)}
                    style={S.input}
                    placeholder="What will improvement look like by review time?"
                    disabled={busy}
                  />
                </div>

                <div>
                  <label style={S.label}>Baseline</label>
                  <div style={S.row}>
                    <button
                      type="button"
                      style={S.btnSoft}
                      onClick={captureBaseline}
                      disabled={busy || !studentId}
                    >
                      Capture baseline
                    </button>
                  </div>
                  <textarea
                    value={baseline}
                    onChange={(e) => setBaseline(e.target.value)}
                    style={{ ...S.textarea, minHeight: 90, marginTop: 10 }}
                    placeholder="Starting point before the intervention begins…"
                    disabled={busy}
                  />
                </div>

                <div>
                  <label style={S.label}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={S.textarea}
                    placeholder="Context, action steps, review notes, parent communication, next teaching steps…"
                    disabled={busy}
                  />
                </div>

                <div style={S.row}>
                  <button style={S.btnPrimary} onClick={() => save(false)} disabled={busy}>
                    {busy ? "Saving…" : id ? "Save intervention" : "Create intervention"}
                  </button>

                  <button style={S.btn} onClick={() => save(true)} disabled={busy}>
                    {id ? "Save + review" : "Create + review"}
                  </button>

                  {!id ? (
                    <button
                      style={S.btn}
                      onClick={() => {
                        clearForm();
                        router.push(
                          classId
                            ? `/admin/interventions-entry?classId=${encodeURIComponent(classId)}`
                            : "/admin/interventions-entry"
                        );
                      }}
                      disabled={busy}
                    >
                      New intervention
                    </button>
                  ) : null}

                  <button
                    style={S.btn}
                    onClick={() =>
                      router.push(
                        returnTo ||
                          `/admin/interventions${classId ? `?classId=${encodeURIComponent(classId)}&status=open` : ""}`
                      )
                    }
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>

            <section style={{ ...S.card, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 950, color: "#0f172a" }}>Linked evidence (preview)</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginTop: 6 }}>
                Recent evidence for this student. Use this to ground the support plan in classroom evidence.
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {latestEvidence.map((ev) => (
                  <div key={ev.id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12 }}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>{safe(ev.title) || "Evidence"}</div>
                    <div style={{ marginTop: 6, ...S.row }}>
                      <span style={S.chip}>{isoShort(ev.occurred_on || ev.created_at || null)}</span>
                      <span style={S.chipMuted}>{safe(ev.learning_area) || "General"}</span>
                      {safe(ev.visibility) ? <span style={S.chipMuted}>{safe(ev.visibility)}</span> : null}
                    </div>
                    {safe(ev.summary) ? (
                      <div style={{ marginTop: 8, color: "#475569", fontWeight: 800, lineHeight: 1.35 }}>
                        {safe(ev.summary)}
                      </div>
                    ) : null}
                    <div style={{ marginTop: 10 }}>
                      <button type="button" style={S.btnSoft} disabled={busy} onClick={() => loadEvidenceIntoPlan(ev)}>
                        Use in plan
                      </button>
                    </div>
                  </div>
                ))}

                {!studentId ? <div style={S.warn}>Choose a student to preview linked evidence.</div> : null}
                {studentId && latestEvidence.length === 0 ? (
                  <div style={S.warn}>No recent evidence found for this student yet.</div>
                ) : null}
              </div>
            </section>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <section style={{ ...S.card, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 950, color: "#0f172a" }}>Student signals</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800, marginTop: 6 }}>
                Shared analytics to help decide the right support plan and cadence.
              </div>

              {analytics ? (
                <>
                  <div style={{ ...S.row, marginTop: 12 }}>
                    <span style={S.chip}>Status: {safe(analytics.statusLabel) || "Watch"}</span>
                    <span style={S.chipMuted}>
                      Confidence: {clamp(Math.round(Number(analytics.profileConfidence ?? 0)), 0, 100)}%
                    </span>
                    <span style={S.chipMuted}>
                      Attention: {clamp(Math.round(Number(analytics.attentionScore ?? 0)), 0, 100)}%
                    </span>
                  </div>

                  {safe(analytics.nextAction) ? <div style={S.info}>Next action: {safe(analytics.nextAction)}</div> : null}

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {topFreshness.length ? (
                      topFreshness.map((row) => {
                        const tone = freshnessTone(row.days);
                        const fill = row.days >= 999 ? 0 : clamp(100 - row.days * 4, 0, 100);
                        return (
                          <div key={row.label} style={S.barRow}>
                            <div style={{ fontWeight: 900, color: "#0f172a" }}>{row.label}</div>
                            <div style={S.barBg}>
                              <div
                                style={{
                                  width: `${fill}%`,
                                  height: "100%",
                                  background:
                                    row.days <= 7 ? "#22c55e" : row.days <= 21 ? "#f59e0b" : "#ef4444",
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
                      <div style={S.warn}>No freshness summary available yet.</div>
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
                <div style={S.warn}>Choose a student to load student signals.</div>
              )}
            </section>

            <section style={{ ...S.card, padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 950, color: "#0f172a" }}>Latest for student</div>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
                  {studentId ? "Recent interventions for selected student." : "Pick a student to see recent interventions."}
                </div>
              </div>

              <div style={{ marginTop: 12, ...S.tableWrap }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Date</th>
                      <th style={S.th}>Status / Tier</th>
                      <th style={S.th}>Title / Notes</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((r) => {
                      const tone = pickStatusTone(r.status);
                      return (
                        <tr key={r.id}>
                          <td style={S.td}>
                            <span style={S.chip}>{isoShort(r.updated_at ?? r.created_at ?? null)}</span>
                          </td>

                          <td style={S.td}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <span
                                style={{
                                  ...S.chip,
                                  background: tone.bg,
                                  border: `1px solid ${tone.bd}`,
                                  color: tone.fg,
                                }}
                              >
                                {safe(r.status) || "open"}
                              </span>
                              {safe(r.tier) ? <span style={S.chip}>Tier {safe(r.tier)}</span> : null}
                              {safe(r.priority) ? <span style={S.chip}>{safe(r.priority)}</span> : null}
                              {pickReviewDate(r) ? (
                                <span style={S.chip}>Review: {isoShort(pickReviewDate(r))}</span>
                              ) : null}
                            </div>
                          </td>

                          <td style={S.td}>
                            <div style={{ color: "#0f172a", fontWeight: 950, lineHeight: 1.25 }}>
                              {safe(r.title) || "Intervention"}
                            </div>
                            {safe(r.strategy) ? (
                              <div style={{ marginTop: 6, color: "#334155", fontWeight: 800, lineHeight: 1.35 }}>
                                Strategy: {safe(r.strategy)}
                              </div>
                            ) : null}
                            {safe(r.notes || r.note) ? (
                              <div
                                style={{
                                  marginTop: 6,
                                  color: "#475569",
                                  fontWeight: 800,
                                  lineHeight: 1.35,
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {stripTaggedSections(safe(r.notes || r.note))}
                              </div>
                            ) : null}
                            <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
                              ID: <span style={{ fontFamily: "monospace" }}>{String(r.id).slice(0, 8)}…</span>
                            </div>
                          </td>

                          <td style={S.td}>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button style={S.btn} disabled={busy} onClick={() => duplicateFromLatest(r)}>
                                Duplicate
                              </button>

                              <button style={S.btn} disabled={busy} onClick={() => continueFromLatest(r)}>
                                Continue
                              </button>

                              <button
                                style={S.btnPrimary}
                                disabled={busy}
                                onClick={() =>
                                  router.push(`/admin/interventions/${encodeURIComponent(r.id)}/review`)
                                }
                              >
                                Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!studentId ? (
                      <tr>
                        <td colSpan={4} style={{ ...S.td, padding: 16, color: "#64748b", fontWeight: 900 }}>
                          Select a student to view recent interventions.
                        </td>
                      </tr>
                    ) : null}

                    {studentId && latest.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ ...S.td, padding: 16, color: "#64748b", fontWeight: 900 }}>
                          No interventions yet for this student — create one above.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>

      <StudentQuickViewDrawer
        studentId={safe(selectedStudent?.id) || null}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        returnTo={
          id
            ? `/admin/interventions-entry?id=${encodeURIComponent(id)}`
            : `/admin/interventions-entry${classId ? `?classId=${encodeURIComponent(classId)}` : ""}`
        }
      />
    </div>
  );
}