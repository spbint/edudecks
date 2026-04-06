"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentHubNav from "@/app/admin/components/StudentHubNav";
import { supabase } from "@/lib/supabaseClient";
import {
  buildStudentListPath,
  buildStudentProfilePath,
} from "@/lib/studentRoutes";

/* ───────────────────────── TYPES ───────────────────────── */

type StudentRow = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  year_level?: number | null;
  is_ilp?: boolean | null;
  class_id?: string | null;
  is_archived?: boolean | null;
  [k: string]: any;
};

type ClassRow = {
  id: string;
  name?: string | null;
  teacher_name?: string | null;
  room?: string | null;
  year_level?: number | null;
  [k: string]: any;
};

type StudentProfileOverviewRow = {
  student_id: string;
  class_id: string | null;
  student_name?: string | null;
  is_ilp?: boolean | null;
  last_evidence_at?: string | null;
  open_interventions_count?: number | null;
  overdue_reviews_count?: number | null;
  evidence_count_30d?: number | null;
  attention_status?: "Ready" | "Watch" | "Attention" | string | null;
  next_action?: string | null;
  [k: string]: any;
};

type EvidenceEntryRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  visibility?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type AreaFilter =
  | "Literacy"
  | "Maths"
  | "Science"
  | "Wellbeing"
  | "Humanities"
  | "Other";

type EvidenceTemplate = {
  id: string;
  title: string;
  learningArea: AreaFilter;
  evidenceType: string;
  summarySeed: string;
  bodySeed: string;
};

type NextEvidenceSuggestion = {
  area: AreaFilter;
  priorityScore: number;
  urgency: "High" | "Watch" | "Stable";
  title: string;
  text: string;
};

type QualityAssessment = {
  score: number;
  label: "Flagship" | "Strong" | "Usable" | "Thin" | "Rewrite";
  tone: "good" | "watch" | "danger";
  reasons: string[];
  guidance: string;
};

type FormState = {
  studentId: string;
  classId: string;
  title: string;
  learningArea: AreaFilter | "";
  evidenceType: string;
  occurredOn: string;
  summary: string;
  body: string;
  visibility: string;
};

type SaveState = "idle" | "saving" | "saved";

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 180) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function shortDate(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return s.slice(0, 10);
  }
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function nameOf(s: StudentRow | null) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name || s.last_name
  )}`.trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function attentionTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (s === "attention") return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
  if (s === "watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
}

function guessArea(raw: string | null | undefined): AreaFilter {
  const x = safe(raw).toLowerCase();
  if (x.includes("math")) return "Maths";
  if (
    x.includes("liter") ||
    x.includes("reading") ||
    x.includes("writing") ||
    x.includes("english")
  ) {
    return "Literacy";
  }
  if (x.includes("science")) return "Science";
  if (
    x.includes("well") ||
    x.includes("pastoral") ||
    x.includes("social") ||
    x.includes("behaviour") ||
    x.includes("behavior")
  ) {
    return "Wellbeing";
  }
  if (
    x.includes("human") ||
    x.includes("history") ||
    x.includes("geography") ||
    x.includes("hass")
  ) {
    return "Humanities";
  }
  return "Other";
}

function tonePill(kind: "good" | "watch" | "danger") {
  if (kind === "danger") return { bg: "#450a0a", bd: "#7f1d1d", fg: "#fecaca" };
  if (kind === "watch") return { bg: "#422006", bd: "#92400e", fg: "#fde68a" };
  return { bg: "#052e16", bd: "#14532d", fg: "#bbf7d0" };
}

function qualityTone(label: QualityAssessment["label"]) {
  if (label === "Rewrite") return { bg: "#450a0a", bd: "#7f1d1d", fg: "#fecaca" };
  if (label === "Thin") return { bg: "#422006", bd: "#92400e", fg: "#fde68a" };
  if (label === "Usable") return { bg: "#172554", bd: "#1d4ed8", fg: "#bfdbfe" };
  if (label === "Strong") return { bg: "#052e16", bd: "#14532d", fg: "#bbf7d0" };
  return { bg: "#022c22", bd: "#0f766e", fg: "#99f6e4" };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function areaBarColor(score: number) {
  if (score < 40) return "#ef4444";
  if (score < 70) return "#f59e0b";
  return "#22c55e";
}

function emptyForm(studentId = "", classId = ""): FormState {
  return {
    studentId,
    classId,
    title: "",
    learningArea: "",
    evidenceType: "Observation",
    occurredOn: todayIso(),
    summary: "",
    body: "",
    visibility: "internal",
  };
}

/* ───────────────────────── TEMPLATES ───────────────────────── */

const TEMPLATES: EvidenceTemplate[] = [
  {
    id: "literacy-observation",
    title: "Literacy observation",
    learningArea: "Literacy",
    evidenceType: "Observation",
    summarySeed: "Student demonstrated literacy learning by...",
    bodySeed:
      "Context:\nWhat the student was doing:\nWhat was observed:\nWhy this matters for progress:\n",
  },
  {
    id: "maths-work-sample",
    title: "Maths work sample",
    learningArea: "Maths",
    evidenceType: "Work Sample",
    summarySeed: "Student demonstrated mathematical thinking through...",
    bodySeed:
      "Task:\nWhat strategy the student used:\nEvidence of understanding:\nPossible next step:\n",
  },
  {
    id: "science-investigation",
    title: "Science investigation",
    learningArea: "Science",
    evidenceType: "Investigation",
    summarySeed: "Student engaged in scientific inquiry by...",
    bodySeed:
      "Investigation focus:\nObserved process:\nKey finding or explanation:\nNext learning opportunity:\n",
  },
  {
    id: "wellbeing-note",
    title: "Wellbeing note",
    learningArea: "Wellbeing",
    evidenceType: "Teacher Note",
    summarySeed: "Student demonstrated wellbeing/social growth by...",
    bodySeed:
      "Situation:\nObserved behaviour or interaction:\nImpact on participation:\nSuggested support / follow-up:\n",
  },
  {
    id: "humanities-project",
    title: "Humanities project evidence",
    learningArea: "Humanities",
    evidenceType: "Project",
    summarySeed: "Student showed understanding in humanities by...",
    bodySeed:
      "Topic / inquiry:\nEvidence shown:\nUse of knowledge / vocabulary:\nPossible extension:\n",
  },
];

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  shell: { display: "flex", minHeight: "100vh", background: "#0f172a" },
  main: { flex: 1, padding: 28, color: "#e5e7eb", maxWidth: 1480 },

  hero: {
    border: "1px solid #1f2937",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.85), rgba(59,130,246,0.16))",
    padding: 20,
    marginBottom: 18,
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },

  eyebrow: {
    fontSize: 11,
    color: "#93c5fd",
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  h1: { fontSize: 34, fontWeight: 1000, marginTop: 8, marginBottom: 6, lineHeight: 1.05 },
  sub: { color: "#94a3b8", marginBottom: 12, fontWeight: 700, lineHeight: 1.45 },

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1.1fr",
    gap: 14,
    marginTop: 14,
  },

  heroCard: {
    background: "rgba(15,23,42,0.78)",
    borderRadius: 16,
    padding: 16,
    border: "1px solid #233044",
    minHeight: 108,
  },

  metricK: {
    fontSize: 11,
    color: "#93c5fd",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  metricV: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: 1000,
    color: "#ffffff",
    lineHeight: 1.05,
  },

  metricS: {
    marginTop: 8,
    fontSize: 12,
    color: "#cbd5e1",
    fontWeight: 800,
    lineHeight: 1.35,
  },

  card: {
    background: "#111827",
    borderRadius: 18,
    padding: 18,
    border: "1px solid #1f2937",
  },

  sectionTitle: { fontSize: 18, fontWeight: 950, color: "#f8fafc" },
  sectionHelp: {
    color: "#94a3b8",
    marginTop: 6,
    fontWeight: 700,
    fontSize: 12,
    lineHeight: 1.45,
  },

  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #334155",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  badgeMuted: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #334155",
    background: "#0b1220",
    fontSize: 12,
    fontWeight: 900,
    color: "#cbd5e1",
    whiteSpace: "nowrap",
  },

  btn: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#10b981",
    border: "none",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },

  btnMuted: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "#334155",
    border: "none",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },

  btnGhost: {
    padding: "10px 12px",
    borderRadius: 10,
    background: "transparent",
    border: "1px solid #334155",
    color: "#e5e7eb",
    fontWeight: 900,
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 16,
    marginTop: 16,
  },

  list: {
    display: "grid",
    gap: 10,
    marginTop: 14,
  },

  item: {
    border: "1px solid #1f2937",
    borderRadius: 14,
    background: "#0b1220",
    padding: 12,
  },

  itemTitle: {
    fontWeight: 950,
    color: "#f8fafc",
    fontSize: 15,
    lineHeight: 1.3,
  },

  itemText: {
    marginTop: 8,
    color: "#cbd5e1",
    fontWeight: 800,
    lineHeight: 1.45,
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
    fontWeight: 800,
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: 110,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
    fontWeight: 800,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#e5e7eb",
    fontWeight: 800,
    outline: "none",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 14,
  },

  formField: {
    display: "grid",
    gap: 6,
  },

  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#cbd5e1",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  noteBox: {
    marginTop: 12,
    border: "1px solid #1f2937",
    borderRadius: 12,
    padding: 12,
    background: "#0b1220",
    color: "#cbd5e1",
    fontWeight: 700,
    lineHeight: 1.45,
    minHeight: 72,
  },

  ok: {
    marginBottom: 14,
    borderRadius: 12,
    border: "1px solid #14532d",
    background: "#052e16",
    padding: 12,
    color: "#bbf7d0",
    fontWeight: 900,
    fontSize: 13,
  },

  err: {
    marginBottom: 14,
    borderRadius: 12,
    border: "1px solid #7f1d1d",
    background: "#450a0a",
    padding: 12,
    color: "#fecaca",
    fontWeight: 900,
    fontSize: 13,
    lineHeight: 1.45,
  },

  empty: {
    border: "1px dashed #334155",
    borderRadius: 14,
    background: "#0b1220",
    padding: 12,
    color: "#94a3b8",
    fontWeight: 900,
  },

  areaRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr 58px",
    gap: 10,
    alignItems: "center",
    marginTop: 12,
  },

  barBg: {
    width: "100%",
    height: 12,
    borderRadius: 999,
    background: "#1f2937",
    overflow: "hidden",
  },
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function EvidenceEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const studentIdFromUrl = safe(searchParams?.get("studentId"));
  const returnTo = safe(searchParams?.get("returnTo"));

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [overview, setOverview] = useState<StudentProfileOverviewRow | null>(null);
  const [recentEvidence, setRecentEvidence] = useState<EvidenceEntryRow[]>([]);

  const [form, setForm] = useState<FormState>(emptyForm(studentIdFromUrl, ""));
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudents() {
      const tries = [
        "id,preferred_name,first_name,surname,family_name,last_name,year_level,is_ilp,class_id,is_archived",
        "id,preferred_name,first_name,surname,family_name,year_level,is_ilp,class_id,is_archived",
        "id,preferred_name,first_name,surname,year_level,is_ilp,class_id,is_archived",
        "id,preferred_name,first_name,year_level,is_ilp,class_id,is_archived",
      ];

      for (const sel of tries) {
        const r = await supabase
          .from("students")
          .select(sel)
          .eq("is_archived", false)
          .limit(5000);

        if (!r.error) {
          setStudents(((r.data as any[]) ?? []) as StudentRow[]);
          return;
        }
        if (!isMissingRelationOrColumn(r.error)) throw r.error;
      }

      setStudents([]);
    }

    async function loadContext() {
      if (!form.studentId) {
        setStudent(null);
        setKlass(null);
        setOverview(null);
        setRecentEvidence([]);
        return;
      }

      const studentQueries = [
        "id,preferred_name,first_name,surname,family_name,last_name,year_level,is_ilp,class_id",
        "id,preferred_name,first_name,surname,family_name,year_level,is_ilp,class_id",
        "id,preferred_name,first_name,surname,year_level,is_ilp,class_id",
        "id,preferred_name,first_name,year_level,is_ilp,class_id",
      ];

      let studentData: StudentRow | null = null;

      for (const sel of studentQueries) {
        const { data, error } = await supabase
          .from("students")
          .select(sel)
          .eq("id", form.studentId)
          .maybeSingle();

        if (!error) {
          studentData = (data as StudentRow | null) ?? null;
          break;
        }
        if (!isMissingRelationOrColumn(error)) throw error;
      }

      const { data: ov, error: ovError } = await supabase
        .from("v_student_profile_overview_v1")
        .select("*")
        .eq("student_id", form.studentId)
        .maybeSingle();

      if (ovError && !isMissingRelationOrColumn(ovError)) throw ovError;

      let classData: ClassRow | null = null;
      const classId = safe((ov as any)?.class_id) || safe(studentData?.class_id) || safe(form.classId);

      if (classId) {
        const { data: c, error: cError } = await supabase
          .from("classes")
          .select("id,name,teacher_name,room,year_level")
          .eq("id", classId)
          .maybeSingle();

        if (cError && !isMissingRelationOrColumn(cError)) throw cError;
        classData = (c as ClassRow | null) ?? null;
      }

      const { data: ev, error: evError } = await supabase
        .from("evidence_entries")
        .select(
          "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted"
        )
        .eq("student_id", form.studentId)
        .eq("is_deleted", false)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(12);

      if (evError && !isMissingRelationOrColumn(evError)) throw evError;

      setStudent(studentData);
      setOverview((ov as StudentProfileOverviewRow | null) ?? null);
      setKlass(classData);
      setRecentEvidence(((ev as any[]) ?? []) as EvidenceEntryRow[]);

      setForm((prev) => ({
        ...prev,
        classId: classId || prev.classId,
      }));
    }

    async function loadAll() {
      setBusy(true);
      setErr(null);
      try {
        await loadStudents();
        await loadContext();
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      } finally {
        setBusy(false);
      }
    }

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.studentId]);

  const displayName = useMemo(() => {
    return safe(overview?.student_name) || nameOf(student);
  }, [overview, student]);

  const tone = useMemo(() => attentionTone(overview?.attention_status), [overview?.attention_status]);

  const areaProfile = useMemo(() => {
    const labels: AreaFilter[] = ["Literacy", "Maths", "Science", "Wellbeing", "Humanities", "Other"];

    return labels.map((label) => {
      const entries = recentEvidence.filter((e) => guessArea(e.learning_area) === label);
      const fresh = entries.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d <= 30;
      });
      const latest = entries[0]?.occurred_on || entries[0]?.created_at || null;

      let score =
        Math.min(50, entries.length * 12) +
        Math.min(35, fresh.length * 15) +
        ((daysSince(latest) ?? 999) <= 21 ? 15 : 0);

      score = Math.max(0, Math.min(100, score));

      return {
        label,
        count: entries.length,
        fresh: fresh.length,
        latest,
        score,
      };
    });
  }, [recentEvidence]);

  const nextEvidenceSuggestions = useMemo<NextEvidenceSuggestion[]>(() => {
    return areaProfile
      .map((row) => {
        const staleDays = daysSince(row.latest) ?? 999;
        const missing = row.count === 0;
        const thin = row.count > 0 && row.count <= 1;
        const stale = staleDays > 30;

        let priorityScore = 0;
        if (missing) priorityScore += 50;
        if (thin) priorityScore += 24;
        if (stale) priorityScore += 18;
        priorityScore += Math.max(0, 65 - row.score);

        let urgency: "High" | "Watch" | "Stable" = "Stable";
        if (priorityScore >= 70) urgency = "High";
        else if (priorityScore >= 40) urgency = "Watch";

        let text = "Coverage here looks healthy enough for now.";
        if (missing) {
          text = `No recent ${row.label} evidence is visible. A strong item here would improve breadth fastest.`;
        } else if (thin && stale) {
          text = `${row.label} is thin and stale. Capture a fresh example with stronger narrative detail.`;
        } else if (thin) {
          text = `${row.label} is thin. One well-written evidence item would lift readiness quickly.`;
        } else if (stale) {
          text = `${row.label} exists but is stale. Add a fresh item to maintain reporting confidence.`;
        }

        return {
          area: row.label,
          priorityScore,
          urgency,
          title: `${row.label} next-evidence priority`,
          text,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 4);
  }, [areaProfile]);

  const qualityAssessment = useMemo<QualityAssessment>(() => {
    let score = 0;
    const reasons: string[] = [];

    if (safe(form.title)) {
      score += 12;
      reasons.push("clear title");
    } else {
      reasons.push("missing title");
    }

    if (safe(form.summary)) {
      score += 28;
      reasons.push("summary present");
    } else {
      reasons.push("missing summary");
    }

    if (safe(form.body)) {
      const len = safe(form.body).length;
      if (len >= 120) {
        score += 22;
        reasons.push("strong detail");
      } else if (len >= 50) {
        score += 14;
        reasons.push("usable detail");
      } else {
        score += 6;
        reasons.push("thin body");
      }
    } else {
      reasons.push("missing detailed note");
    }

    if (safe(form.learningArea)) {
      score += 12;
      reasons.push("learning area tagged");
    } else {
      reasons.push("no learning area");
    }

    if (safe(form.evidenceType)) {
      score += 8;
      reasons.push("evidence type tagged");
    }

    const occurredDays = daysSince(form.occurredOn) ?? 0;
    if (occurredDays <= 7) {
      score += 10;
      reasons.push("recent capture date");
    } else if (occurredDays <= 30) {
      score += 6;
      reasons.push("acceptable recency");
    }

    score = Math.max(0, Math.min(100, score));

    let label: QualityAssessment["label"] = "Usable";
    let tone: QualityAssessment["tone"] = "watch";
    let guidance = "This is acceptable but could be stronger with clearer narrative detail.";

    if (score >= 82) {
      label = "Flagship";
      tone = "good";
      guidance = "This is strong enough to become a portfolio, report, or exemplar candidate.";
    } else if (score >= 68) {
      label = "Strong";
      tone = "good";
      guidance = "This is a good evidence item for portfolio and conference use.";
    } else if (score >= 50) {
      label = "Usable";
      tone = "watch";
      guidance = "This will work, but a stronger body or clearer summary would improve its long-term value.";
    } else if (score >= 35) {
      label = "Thin";
      tone = "watch";
      guidance = "This entry is thin. Add more observable detail before saving if possible.";
    } else {
      label = "Rewrite";
      tone = "danger";
      guidance = "This is too weak for strong reporting value. Add title, summary, and clearer evidence detail.";
    }

    return {
      score,
      label,
      tone,
      reasons,
      guidance,
    };
  }, [form]);

  const strongestSuggestion = nextEvidenceSuggestions[0] || null;

  function applyTemplate(t: EvidenceTemplate) {
    setForm((prev) => ({
      ...prev,
      title: prev.title || t.title,
      learningArea: t.learningArea,
      evidenceType: t.evidenceType,
      summary: prev.summary || t.summarySeed,
      body: prev.body || t.bodySeed,
    }));
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveEvidence() {
    setSaveState("saving");
    setErr(null);
    setOk(null);

    if (!safe(form.studentId)) {
      setSaveState("idle");
      setErr("Please select a student before saving evidence.");
      return;
    }

    if (!safe(form.title) && !safe(form.summary) && !safe(form.body)) {
      setSaveState("idle");
      setErr("Please add at least a title, summary, or body before saving.");
      return;
    }

    const basePayload = {
      student_id: form.studentId,
      class_id: safe(form.classId) || null,
      title: safe(form.title) || null,
      summary: safe(form.summary) || null,
      body: safe(form.body) || null,
      learning_area: safe(form.learningArea) || null,
      evidence_type: safe(form.evidenceType) || null,
      occurred_on: safe(form.occurredOn) || null,
      visibility: safe(form.visibility) || "internal",
      is_deleted: false,
    };

    const payloads = [
      basePayload,
      { ...basePayload, visibility: undefined },
      {
        student_id: basePayload.student_id,
        class_id: basePayload.class_id,
        title: basePayload.title,
        summary: basePayload.summary,
        body: basePayload.body,
        learning_area: basePayload.learning_area,
        occurred_on: basePayload.occurred_on,
        is_deleted: false,
      },
      {
        student_id: basePayload.student_id,
        class_id: basePayload.class_id,
        title: basePayload.title,
        body: basePayload.body || basePayload.summary,
        learning_area: basePayload.learning_area,
        occurred_on: basePayload.occurred_on,
      },
    ];

    let inserted: any = null;
    let lastError: any = null;

    for (const payload of payloads) {
      const cleaned = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      );

      const r = await supabase.from("evidence_entries").insert(cleaned).select("id").maybeSingle();

      if (!r.error) {
        inserted = r.data;
        lastError = null;
        break;
      }

      lastError = r.error;
      if (!isMissingRelationOrColumn(r.error)) {
        continue;
      }
    }

    if (lastError && !inserted) {
      setSaveState("idle");
      setErr(String(lastError.message || lastError));
      return;
    }

    setSaveState("saved");
    setOk("Evidence saved successfully.");

    const keepStudentId = form.studentId;
    const keepClassId = form.classId;
    setForm({
      ...emptyForm(keepStudentId, keepClassId),
      visibility: form.visibility,
      evidenceType: form.evidenceType,
    });

    try {
      const { data: ev } = await supabase
        .from("evidence_entries")
        .select(
          "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted"
        )
        .eq("student_id", keepStudentId)
        .eq("is_deleted", false)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(12);

      setRecentEvidence(((ev as any[]) ?? []) as EvidenceEntryRow[]);
    } catch {}

    setTimeout(() => setSaveState("idle"), 1000);
  }

  const backHref =
    returnTo ||
    (form.studentId
      ? buildStudentProfilePath(form.studentId, buildStudentListPath())
      : buildStudentListPath());

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        {form.studentId ? <StudentHubNav studentId={form.studentId} /> : null}

        {busy ? <div style={S.ok}>Refreshing evidence-entry context…</div> : null}
        {err ? <div style={S.err}>{err}</div> : null}
        {ok ? <div style={S.ok}>{ok}</div> : null}

        <section style={S.hero}>
          <div style={S.topRow}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={S.eyebrow}>Smart Evidence Capture</div>
              <h1 style={S.h1}>
                {form.studentId ? `Evidence Entry — ${displayName}` : "Evidence Entry"}
              </h1>
              <div style={S.sub}>
                Capture faster, capture better, and capture the evidence that improves readiness most.
              </div>

              <div style={S.row}>
                {form.studentId ? (
                  <>
                    <span
                      style={{
                        ...S.badge,
                        background: tone.bg,
                        borderColor: tone.bd,
                        color: tone.fg,
                      }}
                    >
                      {safe(overview?.attention_status) || "Ready"}
                    </span>
                    <span style={S.badgeMuted}>
                      {klass?.name || "Class"} {fmtYear(student?.year_level ?? klass?.year_level)}
                    </span>
                    {(overview?.is_ilp || student?.is_ilp) ? (
                      <span style={S.badgeMuted}>ILP</span>
                    ) : null}
                    <span style={S.badgeMuted}>
                      Last evidence:{" "}
                      {shortDate(
                        overview?.last_evidence_at ||
                          recentEvidence[0]?.occurred_on ||
                          recentEvidence[0]?.created_at
                      )}
                    </span>
                  </>
                ) : (
                  <span style={S.badgeMuted}>Select a student to begin capture.</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={S.btnGhost} onClick={() => router.push(backHref)}>
                Back
              </button>
              {form.studentId ? (
                <Link
                  href={buildStudentProfilePath(form.studentId, returnTo || null)}
                  style={{
                    ...S.btnMuted,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Open Profile
                </Link>
              ) : null}
            </div>
          </div>

          <div style={S.heroGrid}>
            <div style={S.heroCard}>
              <div style={S.metricK}>Quality score</div>
              <div style={S.metricV}>{qualityAssessment.score}</div>
              <div style={S.metricS}>
                Live evidence usefulness score as you type.
              </div>
            </div>

            <div style={S.heroCard}>
              <div style={S.metricK}>Quality label</div>
              <div style={S.metricV}>{qualityAssessment.label}</div>
              <div style={S.metricS}>
                {qualityAssessment.guidance}
              </div>
            </div>

            <div style={S.heroCard}>
              <div style={S.metricK}>Evidence 30d</div>
              <div style={S.metricV}>{Number(overview?.evidence_count_30d ?? 0)}</div>
              <div style={S.metricS}>Recent evidence already captured for this student.</div>
            </div>

            <div style={S.heroCard}>
              <div style={S.metricK}>Next lift</div>
              <div style={S.metricV}>{strongestSuggestion?.area || "—"}</div>
              <div style={S.metricS}>
                {strongestSuggestion?.text || "Select a student to get capture guidance."}
              </div>
            </div>
          </div>
        </section>

        <section style={S.grid}>
          <section style={S.card}>
            <div style={S.sectionTitle}>Evidence capture form</div>
            <div style={S.sectionHelp}>
              This is now a guided entry surface. Strong evidence is clear, timely, and rich enough to be useful later.
            </div>

            <div style={S.formGrid}>
              <div style={S.formField}>
                <label style={S.label}>Student</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setField("studentId", e.target.value)}
                  style={S.select}
                >
                  <option value="">Select student</option>
                  {students
                    .slice()
                    .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {nameOf(s)} {s.year_level != null ? `• ${fmtYear(s.year_level)}` : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div style={S.formField}>
                <label style={S.label}>Occurred on</label>
                <input
                  type="date"
                  value={form.occurredOn}
                  onChange={(e) => setField("occurredOn", e.target.value)}
                  style={S.input}
                />
              </div>

              <div style={S.formField}>
                <label style={S.label}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. Maths problem-solving task"
                  style={S.input}
                />
              </div>

              <div style={S.formField}>
                <label style={S.label}>Learning area</label>
                <select
                  value={form.learningArea}
                  onChange={(e) => setField("learningArea", e.target.value as AreaFilter | "")}
                  style={S.select}
                >
                  <option value="">Select area</option>
                  <option value="Literacy">Literacy</option>
                  <option value="Maths">Maths</option>
                  <option value="Science">Science</option>
                  <option value="Wellbeing">Wellbeing</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={S.formField}>
                <label style={S.label}>Evidence type</label>
                <select
                  value={form.evidenceType}
                  onChange={(e) => setField("evidenceType", e.target.value)}
                  style={S.select}
                >
                  <option value="Observation">Observation</option>
                  <option value="Work Sample">Work Sample</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Teacher Note">Teacher Note</option>
                  <option value="Project">Project</option>
                  <option value="Investigation">Investigation</option>
                  <option value="Conference Note">Conference Note</option>
                </select>
              </div>

              <div style={S.formField}>
                <label style={S.label}>Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setField("visibility", e.target.value)}
                  style={S.select}
                >
                  <option value="internal">Internal</option>
                  <option value="family">Family</option>
                  <option value="shared">Shared</option>
                </select>
              </div>
            </div>

            <div style={{ ...S.formField, marginTop: 12 }}>
              <label style={S.label}>Summary</label>
              <textarea
                value={form.summary}
                onChange={(e) => setField("summary", e.target.value)}
                placeholder="What was observed or completed?"
                style={{ ...S.textarea, minHeight: 90 }}
              />
            </div>

            <div style={{ ...S.formField, marginTop: 12 }}>
              <label style={S.label}>Detailed note</label>
              <textarea
                value={form.body}
                onChange={(e) => setField("body", e.target.value)}
                placeholder="Add context, detail, significance, and next steps..."
                style={S.textarea}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={S.label}>Quick templates</div>
              <div style={S.row}>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    style={S.btnGhost}
                    onClick={() => applyTemplate(t)}
                    type="button"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.noteBox}>
              <strong style={{ color: "#f8fafc" }}>Live capture coaching:</strong>{" "}
              {qualityAssessment.guidance}
              <div style={{ marginTop: 8 }}>
                {qualityAssessment.reasons.map((r) => (
                  <span key={r} style={{ ...S.badgeMuted, marginRight: 6, marginTop: 6 }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ ...S.row, marginTop: 14 }}>
              <button
                style={S.btn}
                onClick={saveEvidence}
                disabled={saveState === "saving"}
                type="button"
              >
                {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved ✓" : "Save evidence"}
              </button>

              <button
                style={S.btnGhost}
                onClick={() => setForm(emptyForm(form.studentId, form.classId))}
                type="button"
              >
                Clear form
              </button>
            </div>
          </section>

          <section style={S.card}>
            <div style={S.sectionTitle}>Capture guidance</div>
            <div style={S.sectionHelp}>
              The platform should tell staff what will improve readiness fastest, not just accept any note.
            </div>

            <div style={S.list}>
              <div style={S.item}>
                <div style={{ ...S.row, justifyContent: "space-between" }}>
                  <div style={S.itemTitle}>Quality assessment</div>
                  <span
                    style={{
                      ...S.badge,
                      background: qualityTone(qualityAssessment.label).bg,
                      borderColor: qualityTone(qualityAssessment.label).bd,
                      color: qualityTone(qualityAssessment.label).fg,
                    }}
                  >
                    {qualityAssessment.label} • {qualityAssessment.score}
                  </span>
                </div>
                <div style={S.itemText}>{qualityAssessment.guidance}</div>
              </div>

              {nextEvidenceSuggestions.length === 0 ? (
                <div style={S.empty}>Select a student to see next-evidence guidance.</div>
              ) : (
                nextEvidenceSuggestions.map((s) => {
                  const tone =
                    s.urgency === "High"
                      ? tonePill("danger")
                      : s.urgency === "Watch"
                      ? tonePill("watch")
                      : tonePill("good");

                  return (
                    <div key={s.area} style={S.item}>
                      <div style={{ ...S.row, justifyContent: "space-between" }}>
                        <div style={S.itemTitle}>{s.title}</div>
                        <span
                          style={{
                            ...S.badge,
                            background: tone.bg,
                            borderColor: tone.bd,
                            color: tone.fg,
                          }}
                        >
                          {s.urgency}
                        </span>
                      </div>
                      <div style={S.itemText}>{s.text}</div>
                      <div style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          style={S.btnGhost}
                          onClick={() => setField("learningArea", s.area)}
                        >
                          Use {s.area}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={S.sectionTitle}>Recent evidence context</div>
              <div style={S.sectionHelp}>
                See what already exists before adding a duplicate or missing the best next move.
              </div>

              <div style={S.list}>
                {recentEvidence.length === 0 ? (
                  <div style={S.empty}>No recent evidence is available for this student yet.</div>
                ) : (
                  recentEvidence.map((row) => (
                    <div key={row.id} style={S.item}>
                      <div style={{ ...S.row, justifyContent: "space-between" }}>
                        <div style={S.itemTitle}>
                          {safe(row.title) || safe(row.learning_area) || "Evidence"}
                        </div>
                        <span style={S.badgeMuted}>
                          {shortDate(row.occurred_on || row.created_at)}
                        </span>
                      </div>
                      <div style={{ ...S.row, marginTop: 8 }}>
                        <span style={S.badgeMuted}>{guessArea(row.learning_area)}</span>
                        {safe(row.evidence_type) ? (
                          <span style={S.badgeMuted}>{safe(row.evidence_type)}</span>
                        ) : null}
                      </div>
                      <div style={S.itemText}>
                        {clip(row.summary) || clip(row.body) || "No summary available."}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={S.sectionTitle}>Coverage profile</div>
              <div style={S.sectionHelp}>
                Student breadth and freshness by learning area.
              </div>

              <div style={{ marginTop: 12 }}>
                {areaProfile.map((row) => (
                  <div key={row.label} style={S.areaRow}>
                    <div style={{ fontWeight: 900, color: "#e5e7eb" }}>{row.label}</div>
                    <div style={S.barBg}>
                      <div
                        style={{
                          width: `${row.score}%`,
                          height: "100%",
                          background: areaBarColor(row.score),
                        }}
                      />
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 950, color: "#f8fafc" }}>
                      {row.score}
                    </div>
                  </div>
                ))}
              </div>

              <div style={S.noteBox}>
                <strong style={{ color: "#f8fafc" }}>Readiness context:</strong>{" "}
                {strongestSuggestion
                  ? `The biggest lift right now is likely to come from ${strongestSuggestion.area}.`
                  : "Select a student to get readiness guidance."}
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}