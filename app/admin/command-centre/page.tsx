"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import AdminPageActions from "@/app/components/AdminPageActions";
import StudentQuickViewDrawer from "@/app/admin/components/StudentQuickViewDrawer";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type ClassRow = {
  id: string;
  name?: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
  [k: string]: any;
};

type StudentRow = {
  id: string;
  class_id?: string | null;
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

type InterventionRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: string | number | null;
  due_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  note?: string | null;
  notes?: string | null;
  [k: string]: any;
};

type StudentProfileOverviewRow = {
  student_id: string;
  class_id?: string | null;
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

type ClassHealthViewRow = {
  class_id: string;
  class_name?: string | null;
  health_score?: number | null;
  students_total?: number | null;
  students_attention?: number | null;
  evidence_fresh_pct?: number | null;
  active_interventions?: number | null;
  overdue_reviews?: number | null;
  [k: string]: any;
};

type CommandPresetKey =
  | "teacher"
  | "triage"
  | "reporting"
  | "invisible"
  | "interventions"
  | "coverage"
  | "authority"
  | "deployment";

type CommandPreset = {
  key: CommandPresetKey;
  label: string;
  description: string;
  accent: string;
  bg: string;
  border: string;
  text: string;
  filters: {
    showOnlyAttention: boolean;
    showOnlyInvisibleRisk: boolean;
    emphasizeAuthority: boolean;
    emphasizeDeployment: boolean;
    sortMode: "priority" | "name" | "coverage" | "interventions" | "reporting" | "authority" | "deployment";
    maxRows: number;
  };
};

type CommandStudentRow = {
  studentId: string;
  classId: string | null;
  studentName: string;
  isILP: boolean;
  attentionStatus: "Ready" | "Watch" | "Attention";
  nextAction: string;

  evidenceCount30d: number;
  evidencePrev30d: number;
  evidenceMomentumDelta: number;
  totalEvidenceCount: number;
  lastEvidenceDays: number | null;

  openInterventions: number;
  overdueReviews: number;
  dueSoonReviews: number;

  missingAreaCount: number;
  narrativeCount: number;
  reportingFragile: boolean;
  invisibleRisk: boolean;
  authorityFragile: boolean;
  forecastRisk: "Stable" | "Watch" | "Escalating";

  priorityScore: number;
  authorityReadinessScore: number;
  recommendedAction:
    | "Capture evidence"
    | "Review intervention"
    | "Prepare report"
    | "Conference needed"
    | "Monitor"
    | "Escalate support";
};

type CommandClassRow = {
  classId: string;
  classLabel: string;
  teacherName: string;
  studentsTotal: number;
  attentionCount: number;
  invisibleCount: number;
  reportingFragileCount: number;
  authorityFragileCount: number;
  overdueReviews: number;
  avgRisk: number;
  evidenceFreshPct: number;
  healthScore: number;
  teacherLoadScore: number;
  deploymentRecommendation: string;
  recommendedAction: string;
  authorityStatus: "Strong" | "Watch" | "Fragile";
};

type QueueRow = {
  id: string;
  title: string;
  text: string;
  studentId: string | null;
  classId: string | null;
  priority: number;
  tone: "good" | "watch" | "danger" | "info";
  cta: string;
};

type AlertRow = {
  id: string;
  text: string;
  tone: "good" | "watch" | "danger" | "info";
};

type ScenarioMode =
  | "today"
  | "no_evidence_week"
  | "reporting_starts_now"
  | "reviews_uncleared"
  | "targeted_push";

type ScenarioRow = {
  title: string;
  tone: "good" | "watch" | "danger" | "info";
  text: string;
};

type ResourceRecommendationRow = {
  classId: string;
  classLabel: string;
  priority: number;
  recommendation: string;
  why: string;
};

type StrategicPlanRow = {
  title: string;
  owner: string;
  timing: string;
  rationale: string;
  tone: "good" | "watch" | "danger" | "info";
};

type TeacherLoadRow = {
  classId: string;
  classLabel: string;
  teacherName: string;
  loadScore: number;
  evidencePressure: number;
  reviewPressure: number;
  supportPressure: number;
};

type BenchmarkRow = {
  classId: string;
  classLabel: string;
  benchmarkPosition: "Above" | "Near" | "Below";
  note: string;
};

/* ───────────────────────── PRESETS ───────────────────────── */

const COMMAND_PRESETS: CommandPreset[] = [
  {
    key: "teacher",
    label: "Teacher",
    description: "Balanced daily class management and next-step control.",
    accent: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      emphasizeDeployment: false,
      sortMode: "priority",
      maxRows: 20,
    },
  },
  {
    key: "triage",
    label: "Triage",
    description: "Start with the most urgent learners first.",
    accent: "#be123c",
    bg: "#fff1f2",
    border: "#fecdd3",
    text: "#9f1239",
    filters: {
      showOnlyAttention: true,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      emphasizeDeployment: false,
      sortMode: "priority",
      maxRows: 20,
    },
  },
  {
    key: "reporting",
    label: "Reporting",
    description: "Focus on fragile report readiness and missing evidence.",
    accent: "#c2410c",
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#9a3412",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      emphasizeDeployment: false,
      sortMode: "reporting",
      maxRows: 20,
    },
  },
  {
    key: "invisible",
    label: "Invisible",
    description: "Recover students slipping out of the evidence stream.",
    accent: "#7c2d12",
    bg: "#fff7ed",
    border: "#fdba74",
    text: "#9a3412",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: true,
      emphasizeAuthority: false,
      emphasizeDeployment: false,
      sortMode: "priority",
      maxRows: 20,
    },
  },
  {
    key: "interventions",
    label: "Interventions",
    description: "Support load, overdue reviews, and escalation risk.",
    accent: "#be123c",
    bg: "#fff1f2",
    border: "#fecdd3",
    text: "#9f1239",
    filters: {
      showOnlyAttention: true,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      emphasizeDeployment: false,
      sortMode: "interventions",
      maxRows: 20,
    },
  },
  {
    key: "coverage",
    label: "Coverage",
    description: "Coverage breadth, freshness, and evidence balance.",
    accent: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    text: "#0c4a6e",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      emphasizeDeployment: false,
      sortMode: "coverage",
      maxRows: 20,
    },
  },
  {
    key: "authority",
    label: "Authority",
    description: "Compliance posture, documentation, and audit confidence.",
    accent: "#0f766e",
    bg: "#f0fdfa",
    border: "#99f6e4",
    text: "#115e59",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: true,
      emphasizeDeployment: false,
      sortMode: "authority",
      maxRows: 20,
    },
  },
  {
    key: "deployment",
    label: "Deployment",
    description: "Where teacher effort and support time should go first.",
    accent: "#4338ca",
    bg: "#eef2ff",
    border: "#c7d2fe",
    text: "#4338ca",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      emphasizeDeployment: true,
      sortMode: "deployment",
      maxRows: 20,
    },
  },
];

function getPreset(key: string | null | undefined) {
  return COMMAND_PRESETS.find((p) => p.key === key) ?? COMMAND_PRESETS[0];
}

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function daysSince(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function daysUntil(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = safe(s.surname || s.family_name || s.last_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Student";
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

function isClosedStatus(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return ["closed", "done", "resolved", "archived", "completed"].includes(s);
}

function isPausedStatus(status: string | null | undefined) {
  return safe(status).toLowerCase() === "paused";
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
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

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function attentionTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (s === "attention") return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
  if (s === "watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
}

function forecastTone(status: "Stable" | "Watch" | "Escalating") {
  if (status === "Stable") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (status === "Watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function authorityTone(status: "Strong" | "Watch" | "Fragile") {
  if (status === "Strong") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (status === "Watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function alertToneStyle(tone: AlertRow["tone"]): React.CSSProperties {
  if (tone === "danger") return { borderColor: "#fecaca", background: "#fff1f2", color: "#9f1239" };
  if (tone === "watch") return { borderColor: "#fde68a", background: "#fffbeb", color: "#92400e" };
  if (tone === "info") return { borderColor: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" };
  return { borderColor: "#bbf7d0", background: "#ecfdf5", color: "#166534" };
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function benchmarkPosition(avgRisk: number) {
  if (avgRisk <= 25) return "Above" as const;
  if (avgRisk <= 45) return "Near" as const;
  return "Below" as const;
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function AdminCommandCentrePage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classHealthRows, setClassHealthRows] = useState<ClassHealthViewRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentOverviewRows, setStudentOverviewRows] = useState<StudentProfileOverviewRow[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  const [classId, setClassId] = useState("all");
  const [searchStudent, setSearchStudent] = useState("");
  const [activePresetKey, setActivePresetKey] = useState<CommandPresetKey>("teacher");
  const [scenarioMode, setScenarioMode] = useState<ScenarioMode>("today");

  const [quickViewStudentId, setQuickViewStudentId] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  function openQuickView(id: string) {
    setQuickViewStudentId(id);
    setQuickViewOpen(true);
  }

  async function loadClasses() {
    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("classes")
        .select(sel)
        .order("year_level", { ascending: true })
        .order("name", { ascending: true });

      if (!r.error) {
        setClasses(((r.data as any[]) ?? []) as ClassRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setClasses([]);
  }

  async function loadStudents() {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,last_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,is_ilp",
      "id,class_id,first_name,preferred_name,is_ilp",
    ];

    for (const sel of tries) {
      const q = await supabase
        .from("students")
        .select(sel)
        .order("class_id", { ascending: true })
        .order("preferred_name", { ascending: true })
        .order("first_name", { ascending: true });

      if (!q.error) {
        setStudents(((q.data as any[]) ?? []) as StudentRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(q.error)) throw q.error;
    }

    setStudents([]);
  }

  async function loadEvidenceEntries() {
    const tries = [
      "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted",
    ];

    for (const sel of tries) {
      const q = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("is_deleted", false)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(18000);

      if (!q.error) {
        setEvidenceEntries(((q.data as any[]) ?? []) as EvidenceEntryRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(q.error)) throw q.error;
    }

    setEvidenceEntries([]);
  }

  async function loadInterventions() {
    const tries = [
      "id,student_id,class_id,title,status,priority,tier,due_on,review_due_on,review_due_date,next_review_on,created_at,updated_at,note,notes",
      "id,student_id,class_id,title,status,priority,tier,due_on,review_due_on,review_due_date,next_review_on,created_at",
      "*",
    ];

    for (const sel of tries) {
      const q = await supabase
        .from("interventions")
        .select(sel)
        .order("created_at", { ascending: false })
        .limit(8000);

      if (!q.error) {
        setInterventions(((q.data as any[]) ?? []) as InterventionRow[]);
        return;
      }
      if (!isMissingRelationOrColumn(q.error)) throw q.error;
    }

    setInterventions([]);
  }

  async function loadStudentOverviewView() {
    const q = await supabase.from("v_student_profile_overview_v1").select("*");

    if (q.error) {
      if (isMissingRelationOrColumn(q.error)) {
        setStudentOverviewRows([]);
        return;
      }
      throw q.error;
    }

    setStudentOverviewRows(((q.data as any[]) ?? []) as StudentProfileOverviewRow[]);
  }

  async function loadClassHealthView() {
    const q = await supabase.from("v_class_health_v1").select("*");

    if (q.error) {
      if (isMissingRelationOrColumn(q.error)) {
        setClassHealthRows([]);
        return;
      }
      throw q.error;
    }

    setClassHealthRows(((q.data as any[]) ?? []) as ClassHealthViewRow[]);
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);

    try {
      await Promise.all([
        loadClasses(),
        loadStudents(),
        loadEvidenceEntries(),
        loadInterventions(),
        loadStudentOverviewView(),
        loadClassHealthView(),
      ]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("edudecks.commandcentre.phase2.preset.v1")
        : null;
    const preset = getPreset(stored);
    setActivePresetKey(preset.key);
    loadAll();
  }, []);

  function applyPreset(key: CommandPresetKey) {
    setActivePresetKey(key);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("edudecks.commandcentre.phase2.preset.v1", key);
    }
  }

  const activePreset = useMemo(() => getPreset(activePresetKey), [activePresetKey]);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassRow>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  const studentMap = useMemo(() => {
    const map = new Map<string, StudentRow>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const overviewMap = useMemo(() => {
    const map = new Map<string, StudentProfileOverviewRow>();
    studentOverviewRows.forEach((r) => map.set(r.student_id, r));
    return map;
  }, [studentOverviewRows]);

  const interventionMap = useMemo(() => {
    const map = new Map<string, InterventionRow[]>();
    interventions.forEach((iv) => {
      const sid = safe(iv.student_id);
      if (!sid) return;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(iv);
    });
    return map;
  }, [interventions]);

  const evidenceMap = useMemo(() => {
    const map = new Map<string, EvidenceEntryRow[]>();
    evidenceEntries.forEach((e) => {
      const sid = safe(e.student_id);
      if (!sid) return;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(e);
    });
    return map;
  }, [evidenceEntries]);

  const scopedStudentIds = useMemo(() => {
    return students
      .filter((s) => classId === "all" || safe(s.class_id) === classId)
      .map((s) => s.id);
  }, [students, classId]);

  const commandStudents = useMemo<CommandStudentRow[]>(() => {
    return scopedStudentIds.map((studentId) => {
      const s = studentMap.get(studentId);
      const o = overviewMap.get(studentId);
      const evidenceList = (evidenceMap.get(studentId) ?? []).slice().sort((a, b) =>
        safe(b.occurred_on || b.created_at).localeCompare(safe(a.occurred_on || a.created_at))
      );
      const interventionList = interventionMap.get(studentId) ?? [];

      const activeInterventions = interventionList.filter(
        (x) => !isClosedStatus(x.status) && !isPausedStatus(x.status)
      );

      const overdueReviews = activeInterventions.filter((x) => {
        const review = pickReviewDate(x);
        const d = daysSince(review);
        return d != null && d > 0;
      });

      const dueSoonReviews = activeInterventions.filter((x) => {
        const review = pickReviewDate(x);
        const d = daysUntil(review);
        return d != null && d >= 0 && d <= 14;
      });

      const totalEvidenceCount = evidenceList.length;

      const evidenceCount30d =
        Number(o?.evidence_count_30d ?? 0) ||
        evidenceList.filter((e) => {
          const d = daysSince(e.occurred_on || e.created_at);
          return d != null && d <= 30;
        }).length;

      const evidencePrev30d = evidenceList.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d > 30 && d <= 60;
      }).length;

      const evidenceMomentumDelta = evidenceCount30d - evidencePrev30d;

      const lastEvidenceAt =
        o?.last_evidence_at ||
        evidenceList[0]?.occurred_on ||
        evidenceList[0]?.created_at ||
        null;

      const lastEvidenceDays = daysSince(lastEvidenceAt);
      const invisibleRisk = totalEvidenceCount === 0 || lastEvidenceDays == null || lastEvidenceDays > 45;

      const attentionStatus =
        safe(o?.attention_status) === "Attention"
          ? "Attention"
          : safe(o?.attention_status) === "Watch"
          ? "Watch"
          : "Ready";

      const allAreas = ["Literacy", "Maths", "Science", "Wellbeing", "Humanities", "Other"];
      const missingAreaCount = allAreas.reduce((sum, area) => {
        const count = evidenceList.filter((e) => guessArea(e.learning_area) === area).length;
        return sum + (count === 0 ? 1 : 0);
      }, 0);

      const narrativeCount = evidenceList.filter((e) => safe(e.summary) || safe(e.body)).length;

      const reportingFragile =
        evidenceCount30d === 0 ||
        lastEvidenceDays == null ||
        lastEvidenceDays > 30 ||
        missingAreaCount >= 2;

      const authorityFragile =
        reportingFragile ||
        narrativeCount < 2 ||
        overdueReviews.length > 0 ||
        invisibleRisk;

      let priorityScore = 0;
      if (attentionStatus === "Attention") priorityScore += 40;
      if (attentionStatus === "Watch") priorityScore += 20;
      if (invisibleRisk) priorityScore += 24;
      if (lastEvidenceDays != null && lastEvidenceDays > 30) priorityScore += 12;
      if (evidenceMomentumDelta < 0) priorityScore += 14;
      priorityScore += activeInterventions.length * 6;
      priorityScore += overdueReviews.length * 12;
      priorityScore += dueSoonReviews.length * 6;
      if (evidenceCount30d === 0) priorityScore += 14;
      if (s?.is_ilp) priorityScore += 8;
      if (reportingFragile) priorityScore += 10;
      if (authorityFragile) priorityScore += 10;

      let authorityReadinessScore = 100;
      authorityReadinessScore -= missingAreaCount * 12;
      authorityReadinessScore -= overdueReviews.length * 10;
      authorityReadinessScore -= narrativeCount < 2 ? 16 : 0;
      authorityReadinessScore -= invisibleRisk ? 18 : 0;
      authorityReadinessScore -= evidenceCount30d === 0 ? 18 : 0;
      authorityReadinessScore = Math.max(0, Math.min(100, authorityReadinessScore));

      let forecastRisk: CommandStudentRow["forecastRisk"] = "Stable";
      if (
        evidenceMomentumDelta < 0 ||
        dueSoonReviews.length >= 2 ||
        overdueReviews.length > 0 ||
        reportingFragile
      ) {
        forecastRisk = "Watch";
      }
      if (
        (attentionStatus === "Attention" && evidenceMomentumDelta < 0) ||
        overdueReviews.length >= 2 ||
        invisibleRisk
      ) {
        forecastRisk = "Escalating";
      }

      let recommendedAction: CommandStudentRow["recommendedAction"] = "Monitor";
      if (overdueReviews.length > 0) recommendedAction = "Review intervention";
      else if (invisibleRisk) recommendedAction = "Capture evidence";
      else if (reportingFragile) recommendedAction = "Prepare report";
      else if (forecastRisk === "Escalating" && activeInterventions.length > 0) recommendedAction = "Escalate support";
      else if (attentionStatus === "Attention") recommendedAction = "Conference needed";

      const nextAction =
        safe(o?.next_action) ||
        (recommendedAction === "Review intervention"
          ? "Review support plan"
          : recommendedAction === "Capture evidence"
          ? "Capture new evidence"
          : recommendedAction === "Prepare report"
          ? "Strengthen reporting evidence"
          : recommendedAction === "Conference needed"
          ? "Schedule conference"
          : recommendedAction === "Escalate support"
          ? "Escalate support response"
          : "Maintain visibility");

      return {
        studentId,
        classId: s?.class_id ?? o?.class_id ?? null,
        studentName: safe(o?.student_name) || studentDisplayName(s),
        isILP: !!(o?.is_ilp ?? s?.is_ilp),
        attentionStatus,
        nextAction,

        evidenceCount30d,
        evidencePrev30d,
        evidenceMomentumDelta,
        totalEvidenceCount,
        lastEvidenceDays,

        openInterventions: Number(o?.open_interventions_count ?? activeInterventions.length) || activeInterventions.length,
        overdueReviews: Number(o?.overdue_reviews_count ?? overdueReviews.length) || overdueReviews.length,
        dueSoonReviews: dueSoonReviews.length,

        missingAreaCount,
        narrativeCount,
        reportingFragile,
        invisibleRisk,
        authorityFragile,
        forecastRisk,

        priorityScore,
        authorityReadinessScore,
        recommendedAction,
      };
    });
  }, [scopedStudentIds, studentMap, overviewMap, evidenceMap, interventionMap]);

  const filteredStudents = useMemo(() => {
    let rows = [...commandStudents];

    const q = safe(searchStudent).toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.studentName.toLowerCase().includes(q));
    }

    if (activePreset.filters.showOnlyAttention) {
      rows = rows.filter((r) => r.attentionStatus === "Attention" || r.overdueReviews > 0 || r.openInterventions > 0);
    }

    if (activePreset.filters.showOnlyInvisibleRisk) {
      rows = rows.filter((r) => r.invisibleRisk);
    }

    if (activePreset.filters.sortMode === "name") {
      rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
    } else if (activePreset.filters.sortMode === "coverage") {
      rows.sort((a, b) => b.missingAreaCount - a.missingAreaCount || b.priorityScore - a.priorityScore);
    } else if (activePreset.filters.sortMode === "interventions") {
      rows.sort((a, b) => b.overdueReviews + b.openInterventions - (a.overdueReviews + a.openInterventions));
    } else if (activePreset.filters.sortMode === "reporting") {
      rows.sort((a, b) => Number(b.reportingFragile) - Number(a.reportingFragile) || b.priorityScore - a.priorityScore);
    } else if (activePreset.filters.sortMode === "authority") {
      rows.sort((a, b) => a.authorityReadinessScore - b.authorityReadinessScore || b.priorityScore - a.priorityScore);
    } else if (activePreset.filters.sortMode === "deployment") {
      rows.sort((a, b) => b.priorityScore - a.priorityScore);
    } else {
      rows.sort((a, b) => b.priorityScore - a.priorityScore);
    }

    return rows.slice(0, activePreset.filters.maxRows);
  }, [commandStudents, searchStudent, activePreset]);

  const classRows = useMemo<CommandClassRow[]>(() => {
    return classes
      .filter((c) => classId === "all" || safe(c.id) === classId)
      .map((c) => {
        const classStudents = commandStudents.filter((r) => safe(r.classId) === safe(c.id));
        const classHealth = classHealthRows.find((r) => safe(r.class_id) === safe(c.id));

        const studentsTotal = classStudents.length;
        const attentionCount = classStudents.filter((r) => r.attentionStatus === "Attention").length;
        const invisibleCount = classStudents.filter((r) => r.invisibleRisk).length;
        const reportingFragileCount = classStudents.filter((r) => r.reportingFragile).length;
        const authorityFragileCount = classStudents.filter((r) => r.authorityFragile).length;
        const overdueReviews = classStudents.reduce((sum, r) => sum + r.overdueReviews, 0);
        const avgRisk = studentsTotal
          ? Math.round(classStudents.reduce((sum, r) => sum + r.priorityScore, 0) / studentsTotal)
          : 0;
        const evidenceFreshPct = percent(
          classStudents.filter((r) => r.evidenceCount30d > 0).length,
          Math.max(1, studentsTotal)
        );
        const healthScore =
          Math.round(Number(classHealth?.health_score ?? 0)) ||
          Math.max(
            0,
            Math.min(
              100,
              100 - attentionCount * 8 - invisibleCount * 7 - overdueReviews * 4 - Math.max(0, 60 - evidenceFreshPct) * 0.5
            )
          );

        const teacherLoadScore =
          attentionCount * 10 +
          invisibleCount * 8 +
          reportingFragileCount * 6 +
          overdueReviews * 5 +
          authorityFragileCount * 7;

        let authorityStatus: CommandClassRow["authorityStatus"] = "Strong";
        const fragileRate = percent(authorityFragileCount, Math.max(1, studentsTotal));
        if (fragileRate >= 40) authorityStatus = "Fragile";
        else if (fragileRate >= 20) authorityStatus = "Watch";

        let deploymentRecommendation = "Maintain normal teacher workflow.";
        if (teacherLoadScore >= 75) deploymentRecommendation = "Deploy support time here first.";
        else if (teacherLoadScore >= 45) deploymentRecommendation = "Protect time for focused review and evidence capture.";

        let recommendedAction = "Stable class — maintain normal operations.";
        if (reportingFragileCount >= 4) recommendedAction = "Run evidence push and reporting prep this week.";
        else if (overdueReviews >= 3) recommendedAction = "Clear overdue reviews before workload compounds.";
        else if (invisibleCount >= 3) recommendedAction = "Restore learner visibility through fresh capture.";
        else if (attentionCount >= 3) recommendedAction = "Prioritise support check-in and triage.";

        return {
          classId: c.id,
          classLabel: [safe(c.name), fmtYear(c.year_level), safe(c.room)].filter(Boolean).join(" • ") || "Class",
          teacherName: safe(c.teacher_name) || "—",
          studentsTotal,
          attentionCount,
          invisibleCount,
          reportingFragileCount,
          authorityFragileCount,
          overdueReviews,
          avgRisk,
          evidenceFreshPct: Math.round(Number(classHealth?.evidence_fresh_pct ?? evidenceFreshPct)) || evidenceFreshPct,
          healthScore,
          teacherLoadScore,
          deploymentRecommendation,
          recommendedAction,
          authorityStatus,
        };
      })
      .sort((a, b) => b.teacherLoadScore - a.teacherLoadScore);
  }, [classes, classId, commandStudents, classHealthRows]);

  const queueRows = useMemo<QueueRow[]>(() => {
    const rows: QueueRow[] = [];

    filteredStudents.forEach((student) => {
      if (student.forecastRisk === "Escalating") {
        rows.push({
          id: `student-${student.studentId}-forecast`,
          title: `${student.studentName} is escalating`,
          text: `${student.nextAction}. Momentum is ${student.evidenceMomentumDelta >= 0 ? "stable/improving" : "declining"} and risk is rising.`,
          studentId: student.studentId,
          classId: student.classId,
          priority: 90 + student.priorityScore,
          tone: "danger",
          cta: "Open student",
        });
      } else if (student.invisibleRisk) {
        rows.push({
          id: `student-${student.studentId}-invisible`,
          title: `${student.studentName} needs visibility`,
          text: "Fresh evidence capture is needed so this learner does not drift out of view.",
          studentId: student.studentId,
          classId: student.classId,
          priority: 70 + student.priorityScore,
          tone: "watch",
          cta: "Open student",
        });
      } else if (student.authorityFragile && activePreset.filters.emphasizeAuthority) {
        rows.push({
          id: `student-${student.studentId}-authority`,
          title: `${student.studentName} is fragile for authority readiness`,
          text: "Documentation quality is not yet strong enough for confident audit or submission use.",
          studentId: student.studentId,
          classId: student.classId,
          priority: 65 + student.priorityScore,
          tone: "watch",
          cta: "Open student",
        });
      } else if (student.reportingFragile) {
        rows.push({
          id: `student-${student.studentId}-reporting`,
          title: `${student.studentName} is fragile for reporting`,
          text: "Coverage and freshness are not yet strong enough for confident reporting.",
          studentId: student.studentId,
          classId: student.classId,
          priority: 60 + student.priorityScore,
          tone: "watch",
          cta: "Open student",
        });
      }
    });

    classRows.forEach((c) => {
      if (c.teacherLoadScore >= 75) {
        rows.push({
          id: `class-${c.classId}-deployment`,
          title: `${c.classLabel} needs support deployment`,
          text: c.deploymentRecommendation,
          studentId: null,
          classId: c.classId,
          priority: 50 + c.teacherLoadScore,
          tone: "danger",
          cta: "Open class",
        });
      } else if (c.reportingFragileCount >= 4 || c.overdueReviews >= 4) {
        rows.push({
          id: `class-${c.classId}-queue`,
          title: `${c.classLabel} needs class-level action`,
          text: c.recommendedAction,
          studentId: null,
          classId: c.classId,
          priority: 50 + c.avgRisk,
          tone: "danger",
          cta: "Open class",
        });
      }
    });

    return rows.sort((a, b) => b.priority - a.priority).slice(0, 12);
  }, [filteredStudents, classRows, activePreset]);

  const alerts = useMemo<AlertRow[]>(() => {
    const attention = commandStudents.filter((r) => r.attentionStatus === "Attention").length;
    const invisible = commandStudents.filter((r) => r.invisibleRisk).length;
    const escalating = commandStudents.filter((r) => r.forecastRisk === "Escalating").length;
    const fragile = commandStudents.filter((r) => r.reportingFragile).length;
    const authorityFragile = commandStudents.filter((r) => r.authorityFragile).length;
    const overdue = commandStudents.reduce((sum, r) => sum + r.overdueReviews, 0);

    const items: AlertRow[] = [];
    if (attention > 0) items.push({ id: "attention", text: `${attention} students are in Attention.`, tone: "danger" });
    if (escalating > 0) items.push({ id: "escalating", text: `${escalating} students are forecast to escalate soon.`, tone: "danger" });
    if (invisible > 0) items.push({ id: "invisible", text: `${invisible} students are slipping out of the evidence stream.`, tone: "watch" });
    if (fragile > 0) items.push({ id: "fragile", text: `${fragile} students are fragile for reporting readiness.`, tone: "watch" });
    if (authorityFragile > 0) items.push({ id: "authority", text: `${authorityFragile} students are fragile for authority-readiness.`, tone: "watch" });
    if (overdue > 0) items.push({ id: "overdue", text: `${overdue} overdue reviews are adding operational pressure.`, tone: "danger" });

    if (items.length === 0) {
      items.push({ id: "clear", text: "No major command-centre alerts stand out right now.", tone: "good" });
    }

    return items;
  }, [commandStudents]);

  const summaryMetrics = useMemo(() => {
    const totalStudents = filteredStudents.length;
    const attentionCount = filteredStudents.filter((r) => r.attentionStatus === "Attention").length;
    const invisible = filteredStudents.filter((r) => r.invisibleRisk).length;
    const fragile = filteredStudents.filter((r) => r.reportingFragile).length;
    const authorityFragile = filteredStudents.filter((r) => r.authorityFragile).length;
    const escalating = filteredStudents.filter((r) => r.forecastRisk === "Escalating").length;
    const freshEvidence = percent(
      filteredStudents.filter((r) => r.evidenceCount30d > 0).length,
      Math.max(1, totalStudents)
    );
    const avgRisk = totalStudents
      ? Math.round(filteredStudents.reduce((sum, r) => sum + r.priorityScore, 0) / totalStudents)
      : 0;

    return {
      totalStudents,
      attentionCount,
      invisible,
      fragile,
      authorityFragile,
      escalating,
      freshEvidence,
      avgRisk,
    };
  }, [filteredStudents]);

  const scenarioRows = useMemo<ScenarioRow[]>(() => {
    const total = commandStudents.length;
    if (!total) return [];

    if (scenarioMode === "today") {
      const high = queueRows.length;
      return [
        {
          title: "If the team acts today",
          tone: high >= 8 ? "watch" : "good",
          text: `${high} queue items would still need active follow-through, but the system remains manageable if work starts now.`,
        },
      ];
    }

    if (scenarioMode === "no_evidence_week") {
      const projected = commandStudents.filter(
        (s) => s.invisibleRisk || s.evidenceCount30d === 0 || (s.lastEvidenceDays ?? 0) > 14
      ).length;
      return [
        {
          title: "If no new evidence is added this week",
          tone: projected > total * 0.35 ? "danger" : projected > total * 0.2 ? "watch" : "good",
          text: `${projected} students would likely move into or remain in fragile visibility / reporting posture.`,
        },
      ];
    }

    if (scenarioMode === "reporting_starts_now") {
      const readyClasses = classRows.filter(
        (c) => c.reportingFragileCount < 3 && c.overdueReviews < 3 && c.evidenceFreshPct >= 65
      ).length;
      return [
        {
          title: "If reporting started now",
          tone:
            readyClasses >= classRows.length * 0.7
              ? "good"
              : readyClasses >= classRows.length * 0.45
              ? "watch"
              : "danger",
          text: `${readyClasses} classes look ready enough to begin confidently, while ${classRows.length - readyClasses} would enter reporting under pressure.`,
        },
      ];
    }

    if (scenarioMode === "reviews_uncleared") {
      const atRisk = classRows.filter((c) => c.overdueReviews >= 3 || c.teacherLoadScore >= 75).length;
      return [
        {
          title: "If overdue reviews remain uncleared",
          tone: atRisk >= 3 ? "danger" : atRisk >= 1 ? "watch" : "good",
          text: `${atRisk} classes are likely to carry unstable support pressure into the next cycle.`,
        },
      ];
    }

    const boosted = classRows.filter((c) => c.reportingFragileCount >= 3 || c.invisibleCount >= 3).length;
    return [
      {
        title: "If we run a targeted evidence push",
        tone: boosted >= 1 ? "info" : "good",
        text: `${boosted} classes stand to gain most quickly from a short, targeted evidence-capture push this week.`,
      },
    ];
  }, [scenarioMode, commandStudents, classRows, queueRows]);

  const resourceRecommendations = useMemo<ResourceRecommendationRow[]>(() => {
    return classRows
      .filter((c) => c.teacherLoadScore >= 45 || c.reportingFragileCount >= 3 || c.overdueReviews >= 3)
      .map((c) => ({
        classId: c.classId,
        classLabel: c.classLabel,
        priority: c.teacherLoadScore,
        recommendation:
          c.teacherLoadScore >= 75
            ? "Deploy relief/support time"
            : c.reportingFragileCount >= 4
            ? "Run evidence sprint"
            : "Protect review/moderation block",
        why:
          c.teacherLoadScore >= 75
            ? "Teacher load is high enough to threaten execution."
            : c.reportingFragileCount >= 4
            ? "Reporting fragility is clustering in this class."
            : "Overdue review load is likely to compound if not cleared.",
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6);
  }, [classRows]);

  const teacherLoadRows = useMemo<TeacherLoadRow[]>(() => {
    return classRows.map((c) => ({
      classId: c.classId,
      classLabel: c.classLabel,
      teacherName: c.teacherName,
      loadScore: c.teacherLoadScore,
      evidencePressure: c.reportingFragileCount,
      reviewPressure: c.overdueReviews,
      supportPressure: c.attentionCount + c.invisibleCount,
    }));
  }, [classRows]);

  const strategicPlan = useMemo<StrategicPlanRow[]>(() => {
    const rows: StrategicPlanRow[] = [];

    if (summaryMetrics.invisible > 0) {
      rows.push({
        title: "Run a visibility recovery push",
        owner: "Teacher / Team",
        timing: "Next 5 school days",
        rationale: `${summaryMetrics.invisible} students are slipping from the evidence stream.`,
        tone: "watch",
      });
    }

    if (summaryMetrics.fragile > 0) {
      rows.push({
        title: "Prioritise reporting-strength evidence",
        owner: "Teacher",
        timing: "This week",
        rationale: `${summaryMetrics.fragile} students are fragile for report readiness.`,
        tone: "watch",
      });
    }

    if (summaryMetrics.authorityFragile > 0) {
      rows.push({
        title: "Lift documentation confidence",
        owner: "Teacher / Leadership",
        timing: "Before next reporting checkpoint",
        rationale: `${summaryMetrics.authorityFragile} students may not yet be authority-safe.`,
        tone: "danger",
      });
    }

    if (classRows.some((c) => c.overdueReviews >= 3)) {
      rows.push({
        title: "Clear overdue support reviews",
        owner: "Support / Teacher",
        timing: "Immediately",
        rationale: "Uncleared reviews are compounding support uncertainty.",
        tone: "danger",
      });
    }

    if (!rows.length) {
      rows.push({
        title: "Maintain current operating rhythm",
        owner: "Teacher",
        timing: "Ongoing",
        rationale: "No major strategic weaknesses are visible in the current scope.",
        tone: "good",
      });
    }

    return rows.slice(0, 6);
  }, [summaryMetrics, classRows]);

  const automatedBriefing = useMemo(() => {
    const topClass = classRows[0];
    const topStudent = filteredStudents[0];
    const headline =
      summaryMetrics.attentionCount > 0 || summaryMetrics.escalating > 0
        ? "Operational pressure is present and should be managed proactively."
        : "The current class scope appears broadly stable.";

    return [
      `Briefing headline: ${headline}`,
      `Students in current scope: ${summaryMetrics.totalStudents}.`,
      `Attention students: ${summaryMetrics.attentionCount}. Invisible-risk students: ${summaryMetrics.invisible}.`,
      `Reporting-fragile students: ${summaryMetrics.fragile}. Authority-fragile students: ${summaryMetrics.authorityFragile}.`,
      topClass
        ? `Highest-load class: ${topClass.classLabel} with load score ${topClass.teacherLoadScore}. Recommended action: ${topClass.recommendedAction}`
        : "No class pressure data available.",
      topStudent
        ? `Top learner priority: ${topStudent.studentName}. Recommended action: ${topStudent.recommendedAction}.`
        : "No student priority data available.",
      scenarioRows[0] ? `Scenario note: ${scenarioRows[0].text}` : "No scenario note available.",
    ].join("\n");
  }, [summaryMetrics, classRows, filteredStudents, scenarioRows]);

  const benchmarkRows = useMemo<BenchmarkRow[]>(() => {
    return classRows.map((r) => {
      const pos = benchmarkPosition(r.avgRisk);
      return {
        classId: r.classId,
        classLabel: r.classLabel,
        benchmarkPosition: pos,
        note:
          pos === "Above"
            ? "Operating above internal benchmark."
            : pos === "Near"
            ? "Near benchmark — watch movement."
            : "Below benchmark and likely to need support.",
      };
    });
  }, [classRows]);

  function exportCsv() {
    const headers = [
      "Student",
      "Class",
      "Attention",
      "Forecast Risk",
      "Invisible Risk",
      "Reporting Fragile",
      "Authority Fragile",
      "Authority Readiness Score",
      "Evidence 30d",
      "Evidence Prev30d",
      "Momentum Delta",
      "Open Interventions",
      "Overdue Reviews",
      "Recommended Action",
      "Next Action",
    ];

    const lines = [headers.join(",")];

    filteredStudents.forEach((row) => {
      const cls = classMap.get(safe(row.classId));
      lines.push(
        [
          csvEscape(row.studentName),
          csvEscape([safe(cls?.name), fmtYear(cls?.year_level)].filter(Boolean).join(" • ")),
          csvEscape(row.attentionStatus),
          csvEscape(row.forecastRisk),
          csvEscape(row.invisibleRisk ? "Yes" : "No"),
          csvEscape(row.reportingFragile ? "Yes" : "No"),
          csvEscape(row.authorityFragile ? "Yes" : "No"),
          csvEscape(row.authorityReadinessScore),
          csvEscape(row.evidenceCount30d),
          csvEscape(row.evidencePrev30d),
          csvEscape(row.evidenceMomentumDelta),
          csvEscape(row.openInterventions),
          csvEscape(row.overdueReviews),
          csvEscape(row.recommendedAction),
          csvEscape(row.nextAction),
        ].join(",")
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teacher-command-centre-phase2-premier.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.row}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={S.subtle}>Teacher Mission Control</div>
              <div style={S.h1}>Command Centre — Phase 2 Premier</div>
              <div style={S.sub}>
                Scenario-aware teacher operations hub with resource deployment guidance, authority readiness, strategic planning, automated briefing, and queue-first daily control.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={S.btn} onClick={() => router.push("/admin/leadership")}>
                Leadership Centre
              </button>
              <button type="button" style={S.btn} onClick={exportCsv}>
                Export CSV
              </button>
              <AdminPageActions />
            </div>
          </div>

          <section
            style={{
              ...S.card,
              marginTop: 14,
              padding: 16,
              borderColor: activePreset.border,
              background: activePreset.bg,
            }}
          >
            <div style={{ ...S.row, justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ ...S.sectionTitle, color: activePreset.text }}>Premier Presets</div>
                <div style={S.sectionHelp}>
                  Switch between teacher, triage, reporting, invisible, intervention, authority, deployment, and coverage modes.
                </div>
              </div>

              <button type="button" style={S.btn} onClick={() => applyPreset("teacher")}>
                Reset to Teacher
              </button>
            </div>

            <div style={{ ...S.row, marginTop: 12 }}>
              {COMMAND_PRESETS.map((preset) => {
                const active = preset.key === activePresetKey;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset.key)}
                    style={{
                      border: `1px solid ${active ? preset.accent : "#dbe2ea"}`,
                      background: active ? preset.accent : "#fff",
                      color: active ? "#fff" : "#0f172a",
                      borderRadius: 14,
                      padding: "12px 14px",
                      cursor: "pointer",
                      minWidth: 168,
                      textAlign: "left",
                    }}
                    title={preset.description}
                  >
                    <div style={{ fontSize: 13, fontWeight: 950 }}>{preset.label}</div>
                    <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.35, opacity: active ? 0.95 : 0.78, fontWeight: 800 }}>
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div style={S.topBar}>
            <div>
              <label style={S.subtle}>Class scope</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} style={S.select}>
                <option value="all">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {[safe(c.name), fmtYear(c.year_level), safe(c.room)].filter(Boolean).join(" • ") || "Class"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={S.subtle}>Search student</label>
              <input
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Search by student name"
                style={S.input}
              />
            </div>

            <div>
              <label style={S.subtle}>Scenario mode</label>
              <select value={scenarioMode} onChange={(e) => setScenarioMode(e.target.value as ScenarioMode)} style={S.select}>
                <option value="today">If we act today</option>
                <option value="no_evidence_week">If no evidence is added this week</option>
                <option value="reporting_starts_now">If reporting started now</option>
                <option value="reviews_uncleared">If reviews remain uncleared</option>
                <option value="targeted_push">If we run a targeted evidence push</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button type="button" style={S.btn} onClick={loadAll}>
                Refresh
              </button>
            </div>
          </div>

          <div style={S.tiles}>
            <div style={S.tile}>
              <div style={S.tileK}>Students in View</div>
              <div style={S.tileV}>{summaryMetrics.totalStudents}</div>
              <div style={S.tileS}>Students shown after current preset and filters.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Attention</div>
              <div style={S.tileV}>{summaryMetrics.attentionCount}</div>
              <div style={S.tileS}>Highest concern learners.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Invisible</div>
              <div style={S.tileV}>{summaryMetrics.invisible}</div>
              <div style={S.tileS}>Learners slipping out of view.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Reporting Fragile</div>
              <div style={S.tileV}>{summaryMetrics.fragile}</div>
              <div style={S.tileS}>Weak readiness for report writing.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Authority Fragile</div>
              <div style={S.tileV}>{summaryMetrics.authorityFragile}</div>
              <div style={S.tileS}>Documentation/audit confidence risk.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Escalating</div>
              <div style={S.tileV}>{summaryMetrics.escalating}</div>
              <div style={S.tileS}>Learners forecast to worsen soon.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Fresh Evidence</div>
              <div style={S.tileV}>{summaryMetrics.freshEvidence}%</div>
              <div style={S.tileS}>Students with evidence in the last 30 days.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Average Risk</div>
              <div style={S.tileV}>{summaryMetrics.avgRisk}</div>
              <div style={S.tileS}>Overall class pressure position.</div>
            </div>
          </div>
        </section>

        {busy ? <div style={S.ok}>Refreshing command centre…</div> : null}
        {err ? <div style={S.err}>{err}</div> : null}

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Teacher Alerts</div>
            <div style={S.sectionHelp}>
              Signals that should shape today’s teaching and support priorities.
            </div>
            <div style={S.list}>
              {alerts.map((a) => (
                <div key={a.id} style={{ ...S.item, ...alertToneStyle(a.tone) }}>
                  <div style={S.itemTitle}>{a.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Scenario Simulator</div>
            <div style={S.sectionHelp}>
              Pressure-test the current operating picture under realistic classroom and reporting scenarios.
            </div>
            <div style={S.list}>
              {scenarioRows.map((r) => (
                <div key={r.title} style={{ ...S.item, ...alertToneStyle(r.tone) }}>
                  <div style={S.itemTitle}>{r.title}</div>
                  <div style={S.itemText}>{r.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Priority Queue</div>
            <div style={S.sectionHelp}>
              Ranked actions for today. Start here instead of scanning dashboards.
            </div>
            <div style={S.list}>
              {queueRows.length === 0 ? (
                <div style={S.empty}>No immediate queue items stand out right now.</div>
              ) : (
                queueRows.map((row) => (
                  <div key={row.id} style={{ ...S.item, ...alertToneStyle(row.tone) }}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <div style={S.itemTitle}>{row.title}</div>
                      <span style={S.chipMuted}>Priority {row.priority}</span>
                    </div>
                    <div style={S.itemText}>{row.text}</div>
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        style={S.btn}
                        onClick={() => {
                          if (row.studentId) openQuickView(row.studentId);
                          else if (row.classId) router.push(`/admin/classes/${row.classId}`);
                        }}
                      >
                        {row.cta}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Strategic Intervention Planner</div>
            <div style={S.sectionHelp}>
              A short operating plan that turns today’s signals into concrete next steps.
            </div>
            <div style={S.list}>
              {strategicPlan.map((row) => (
                <div key={row.title} style={{ ...S.item, ...alertToneStyle(row.tone) }}>
                  <div style={S.itemTitle}>{row.title}</div>
                  <div style={S.itemText}>
                    Owner: {row.owner} • Timing: {row.timing}
                  </div>
                  <div style={{ marginTop: 6, color: "#475569", fontWeight: 800 }}>{row.rationale}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Resource Allocation Optimizer</div>
            <div style={S.sectionHelp}>
              Where support time, relief, moderation, or review blocks should go first.
            </div>
            <div style={S.list}>
              {resourceRecommendations.length === 0 ? (
                <div style={S.empty}>No strong resource reallocation signal is visible right now.</div>
              ) : (
                resourceRecommendations.map((row) => (
                  <div key={row.classId} style={S.item}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <div style={S.itemTitle}>{row.classLabel}</div>
                      <span style={S.chipMuted}>Priority {row.priority}</span>
                    </div>
                    <div style={S.itemText}>{row.recommendation}</div>
                    <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800 }}>{row.why}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Staff Workload Modelling</div>
            <div style={S.sectionHelp}>
              Compare evidence pressure, review pressure, and support pressure by class.
            </div>
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Class</th>
                    <th style={S.th}>Teacher</th>
                    <th style={S.th}>Load</th>
                    <th style={S.th}>Evidence</th>
                    <th style={S.th}>Reviews</th>
                    <th style={S.th}>Support</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherLoadRows.map((row) => (
                    <tr key={row.classId}>
                      <td style={S.td}>{row.classLabel}</td>
                      <td style={S.td}>{row.teacherName}</td>
                      <td style={S.td}>{row.loadScore}</td>
                      <td style={S.td}>{row.evidencePressure}</td>
                      <td style={S.td}>{row.reviewPressure}</td>
                      <td style={S.td}>{row.supportPressure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Automated Leadership Briefing</div>
            <div style={S.sectionHelp}>
              Ready-to-use operational briefing text for leadership or teacher planning conversations.
            </div>
            <textarea readOnly value={automatedBriefing} style={S.textarea} />
          </div>

          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Benchmark Positioning</div>
            <div style={S.sectionHelp}>
              Quick comparison against internal benchmark expectations.
            </div>
            <div style={S.list}>
              {benchmarkRows.slice(0, 8).map((row) => (
                <div key={row.classId} style={S.item}>
                  <div style={{ ...S.row, justifyContent: "space-between" }}>
                    <div style={S.itemTitle}>{row.classLabel}</div>
                    <span style={S.chipMuted}>{row.benchmarkPosition}</span>
                  </div>
                  <div style={S.itemText}>{row.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ ...S.card, ...S.sectionPad, marginTop: 14 }}>
          <div style={S.sectionTitle}>Class Operations Table</div>
          <div style={S.sectionHelp}>
            Compare class pressure, authority posture, and the next recommended teacher/team action.
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Class</th>
                  <th style={S.th}>Teacher</th>
                  <th style={S.th}>Students</th>
                  <th style={S.th}>Attention</th>
                  <th style={S.th}>Invisible</th>
                  <th style={S.th}>Reporting Fragile</th>
                  <th style={S.th}>Authority</th>
                  <th style={S.th}>Fresh Evidence</th>
                  <th style={S.th}>Load</th>
                  <th style={S.th}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {classRows.map((row) => {
                  const tone = authorityTone(row.authorityStatus);
                  return (
                    <tr key={row.classId}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 950 }}>{row.classLabel}</div>
                        <div style={{ marginTop: 6 }}>
                          <button
                            type="button"
                            style={S.linkBtn}
                            onClick={() => router.push(`/admin/classes/${row.classId}`)}
                          >
                            Open class
                          </button>
                        </div>
                      </td>
                      <td style={S.td}>{row.teacherName}</td>
                      <td style={S.td}>{row.studentsTotal}</td>
                      <td style={S.td}>{row.attentionCount}</td>
                      <td style={S.td}>{row.invisibleCount}</td>
                      <td style={S.td}>{row.reportingFragileCount}</td>
                      <td style={S.td}>
                        <span style={{ ...S.chip, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
                          {row.authorityStatus}
                        </span>
                      </td>
                      <td style={S.td}>{row.evidenceFreshPct}%</td>
                      <td style={S.td}>{row.teacherLoadScore}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 900 }}>{row.deploymentRecommendation}</div>
                        <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>{row.recommendedAction}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ ...S.card, ...S.sectionPad, marginTop: 14 }}>
          <div style={S.sectionTitle}>Student Triage Table</div>
          <div style={S.sectionHelp}>
            Work learner by learner from the highest operational and authority priority downward.
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Student</th>
                  <th style={S.th}>Attention</th>
                  <th style={S.th}>Forecast</th>
                  <th style={S.th}>Evidence 30d</th>
                  <th style={S.th}>Momentum</th>
                  <th style={S.th}>Interventions</th>
                  <th style={S.th}>Authority Score</th>
                  <th style={S.th}>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((row) => {
                  const att = attentionTone(row.attentionStatus);
                  const ft = forecastTone(row.forecastRisk);
                  return (
                    <tr key={row.studentId}>
                      <td style={S.td}>
                        <button type="button" style={S.linkBtn} onClick={() => openQuickView(row.studentId)}>
                          {row.studentName}
                        </button>
                        <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
                          {row.isILP ? "ILP" : "—"}
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.chip, background: att.bg, borderColor: att.bd, color: att.fg }}>
                          {row.attentionStatus}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.chip, background: ft.bg, borderColor: ft.bd, color: ft.fg }}>
                          {row.forecastRisk}
                        </span>
                      </td>
                      <td style={S.td}>{row.evidenceCount30d}</td>
                      <td style={S.td}>
                        {row.evidenceMomentumDelta >= 0 ? "+" : ""}
                        {row.evidenceMomentumDelta}
                      </td>
                      <td style={S.td}>
                        {row.openInterventions} / overdue {row.overdueReviews}
                      </td>
                      <td style={S.td}>{row.authorityReadinessScore}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 900 }}>{row.recommendedAction}</div>
                        <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>{row.nextAction}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <StudentQuickViewDrawer
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          studentId={quickViewStudentId}
          returnTo="/admin/command-centre"
        />
      </main>
    </div>
  );
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
    maxWidth: 1680,
    margin: "0 auto",
    padding: 22,
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 24,
    background: "linear-gradient(135deg, rgba(17,24,39,0.08), rgba(37,99,235,0.10))",
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

  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  topBar: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(8, minmax(135px, 1fr))",
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

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
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

  textarea: {
    width: "100%",
    minHeight: 220,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#0f172a",
    fontWeight: 700,
    lineHeight: 1.5,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  } as React.CSSProperties,

  linkBtn: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: "#2563eb",
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "left",
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

  empty: {
    border: "1px dashed #cbd5e1",
    borderRadius: 14,
    background: "#f8fafc",
    padding: 12,
    color: "#64748b",
    fontWeight: 900,
  } as React.CSSProperties,
};