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

type LeadershipPresetKey =
  | "leadership"
  | "reporting"
  | "invisible"
  | "coverage"
  | "interventions"
  | "deployment"
  | "authority";

type LeadershipPreset = {
  key: LeadershipPresetKey;
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
    sortMode: "risk" | "forecast" | "authority" | "load" | "name";
    maxRows: number;
  };
};

type StrategicStudentRow = {
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

  invisibleRisk: boolean;
  authorityFragile: boolean;
  reportingFragile: boolean;

  score: number;
  forecastRisk: "Stable" | "Watch" | "Escalating";
};

type ClassMissionRow = {
  classId: string;
  classLabel: string;
  teacherName: string;

  studentsTotal: number;
  attentionCount: number;
  invisibleCount: number;
  authorityRiskCount: number;
  ilpLoad: number;

  avgRisk: number;
  avgMomentumDelta: number;
  reviewLoad14d: number;
  overdueReviews: number;
  evidenceFreshPct: number;
  healthScore: number;

  projectedDeterioration: number;
  teacherLoadScore: number;
  authorityStatus: "Strong" | "Watch" | "Fragile";

  deploymentRecommendation: string;
  leadershipRecommendation: string;
};

type LeadershipActionRow = {
  id: string;
  title: string;
  text: string;
  classId: string | null;
  studentId: string | null;
  priorityScore: number;
  tone: "good" | "watch" | "danger" | "info";
  cta: string;
};

type ScenarioResult = {
  id: string;
  title: string;
  text: string;
  tone: "good" | "watch" | "danger" | "info";
};

type BenchmarkRow = {
  classId: string;
  classLabel: string;
  benchmarkPosition: "Above" | "Near" | "Below";
  note: string;
};

type AlertRow = {
  id: string;
  text: string;
  tone: "good" | "watch" | "danger" | "info";
};

/* ───────────────────────── PRESETS ───────────────────────── */

const LEADERSHIP_PRESETS: LeadershipPreset[] = [
  {
    key: "leadership",
    label: "Leadership",
    description: "Whole-school strategic mission control.",
    accent: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      sortMode: "risk",
      maxRows: 20,
    },
  },
  {
    key: "reporting",
    label: "Reporting Season",
    description: "Forecast bottlenecks and fragile reporting readiness.",
    accent: "#c2410c",
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#9a3412",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: true,
      sortMode: "forecast",
      maxRows: 20,
    },
  },
  {
    key: "invisible",
    label: "Invisible Students",
    description: "Find learners falling out of the evidence stream.",
    accent: "#7c2d12",
    bg: "#fff7ed",
    border: "#fdba74",
    text: "#9a3412",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: true,
      emphasizeAuthority: false,
      sortMode: "risk",
      maxRows: 20,
    },
  },
  {
    key: "coverage",
    label: "Coverage",
    description: "Surface evidence weakness and curriculum gaps.",
    accent: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    text: "#0c4a6e",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      sortMode: "risk",
      maxRows: 20,
    },
  },
  {
    key: "interventions",
    label: "Interventions",
    description: "Focus on support load, overdue reviews, and escalation risk.",
    accent: "#be123c",
    bg: "#fff1f2",
    border: "#fecdd3",
    text: "#9f1239",
    filters: {
      showOnlyAttention: true,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      sortMode: "load",
      maxRows: 20,
    },
  },
  {
    key: "deployment",
    label: "Deployment",
    description: "Where leadership time and support staff should go first.",
    accent: "#4338ca",
    bg: "#eef2ff",
    border: "#c7d2fe",
    text: "#4338ca",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: false,
      sortMode: "load",
      maxRows: 20,
    },
  },
  {
    key: "authority",
    label: "Authority",
    description: "Compliance posture, documentation fragility, and audit confidence.",
    accent: "#0f766e",
    bg: "#f0fdfa",
    border: "#99f6e4",
    text: "#115e59",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      emphasizeAuthority: true,
      sortMode: "authority",
      maxRows: 20,
    },
  },
];

function getPreset(key: string | null | undefined) {
  return LEADERSHIP_PRESETS.find((p) => p.key === key) ?? LEADERSHIP_PRESETS[0];
}

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 120) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
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

function authorityTone(status: "Strong" | "Watch" | "Fragile") {
  if (status === "Strong") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (status === "Watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function forecastTone(status: "Stable" | "Watch" | "Escalating") {
  if (status === "Stable") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (status === "Watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function alertToneStyle(tone: AlertRow["tone"]): React.CSSProperties {
  if (tone === "danger") return { borderColor: "#fecaca", background: "#fff1f2", color: "#9f1239" };
  if (tone === "watch") return { borderColor: "#fde68a", background: "#fffbeb", color: "#92400e" };
  if (tone === "info") return { borderColor: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" };
  return { borderColor: "#bbf7d0", background: "#ecfdf5", color: "#166534" };
}

function benchmarkPosition(avgRisk: number) {
  if (avgRisk <= 25) return "Above" as const;
  if (avgRisk <= 45) return "Near" as const;
  return "Below" as const;
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function LeadershipCommandCentreElitePage() {
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
  const [activePresetKey, setActivePresetKey] = useState<LeadershipPresetKey>("leadership");
  const [scenarioMode, setScenarioMode] = useState<"now" | "no_evidence_week" | "reporting_start" | "reviews_uncleared">("now");

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
        ? window.localStorage.getItem("edudecks.leadership.commandcentre.preset.v1")
        : null;
    const preset = getPreset(stored);
    setActivePresetKey(preset.key);
    loadAll();
  }, []);

  function applyPreset(key: LeadershipPresetKey) {
    setActivePresetKey(key);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("edudecks.leadership.commandcentre.preset.v1", key);
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

  const strategicStudents = useMemo<StrategicStudentRow[]>(() => {
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
        if (!review) return false;
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
        const count = evidenceList.filter((e) => {
          const raw = safe(e.learning_area).toLowerCase();
          if (area === "Maths") return raw.includes("math");
          if (area === "Literacy") return raw.includes("liter") || raw.includes("read") || raw.includes("writ") || raw.includes("english");
          if (area === "Science") return raw.includes("science");
          if (area === "Wellbeing") return raw.includes("well") || raw.includes("social") || raw.includes("behaviour") || raw.includes("behavior") || raw.includes("pastoral");
          if (area === "Humanities") return raw.includes("human") || raw.includes("history") || raw.includes("geography") || raw.includes("hass");
          return !(raw.includes("math") || raw.includes("liter") || raw.includes("read") || raw.includes("writ") || raw.includes("english") || raw.includes("science") || raw.includes("well") || raw.includes("social") || raw.includes("behaviour") || raw.includes("behavior") || raw.includes("pastoral") || raw.includes("human") || raw.includes("history") || raw.includes("geography") || raw.includes("hass"));
        }).length;
        return sum + (count === 0 ? 1 : 0);
      }, 0);

      const authorityFragile =
        invisibleRisk ||
        overdueReviews.length > 0 ||
        missingAreaCount >= 2 ||
        evidenceCount30d === 0 ||
        evidenceList.filter((e) => safe(e.summary) || safe(e.body)).length < 2;

      const reportingFragile =
        evidenceCount30d === 0 ||
        lastEvidenceDays == null ||
        lastEvidenceDays > 30 ||
        missingAreaCount >= 2;

      let score = 0;
      if (attentionStatus === "Attention") score += 40;
      if (attentionStatus === "Watch") score += 20;
      if (invisibleRisk) score += 24;
      if (lastEvidenceDays != null && lastEvidenceDays > 30) score += 12;
      if (lastEvidenceDays != null && lastEvidenceDays > 45) score += 12;
      if (evidenceMomentumDelta < 0) score += 14;
      score += activeInterventions.length * 6;
      score += overdueReviews.length * 12;
      score += dueSoonReviews.length * 6;
      if (evidenceCount30d === 0) score += 14;
      if (s?.is_ilp) score += 8;
      if (authorityFragile) score += 10;

      let forecastRisk: StrategicStudentRow["forecastRisk"] = "Stable";
      if (
        evidenceMomentumDelta < 0 ||
        dueSoonReviews.length >= 2 ||
        overdueReviews.length > 0 ||
        authorityFragile
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

      const nextAction =
        safe(o?.next_action) ||
        (overdueReviews.length > 0
          ? "Review support plan"
          : invisibleRisk
          ? "Capture new evidence"
          : attentionStatus === "Attention"
          ? "Prioritise follow-up"
          : forecastRisk === "Escalating"
          ? "Leadership check-in"
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

        invisibleRisk,
        authorityFragile,
        reportingFragile,

        score,
        forecastRisk,
      };
    });
  }, [scopedStudentIds, studentMap, overviewMap, evidenceMap, interventionMap]);

  const filteredStrategicStudents = useMemo(() => {
    let rows = [...strategicStudents];

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
    } else if (activePreset.filters.sortMode === "authority") {
      rows.sort((a, b) => Number(b.authorityFragile) - Number(a.authorityFragile) || b.score - a.score);
    } else if (activePreset.filters.sortMode === "load") {
      rows.sort((a, b) => b.openInterventions + b.overdueReviews - (a.openInterventions + a.overdueReviews));
    } else if (activePreset.filters.sortMode === "forecast") {
      const rank = { Escalating: 3, Watch: 2, Stable: 1 };
      rows.sort((a, b) => rank[b.forecastRisk] - rank[a.forecastRisk] || b.score - a.score);
    } else {
      rows.sort((a, b) => b.score - a.score);
    }

    return rows.slice(0, activePreset.filters.maxRows);
  }, [strategicStudents, searchStudent, activePreset]);

  const classMissionRows = useMemo<ClassMissionRow[]>(() => {
    return classes
      .filter((c) => classId === "all" || safe(c.id) === classId)
      .map((c) => {
        const classStudents = strategicStudents.filter((r) => safe(r.classId) === safe(c.id));
        const classHealth = classHealthRows.find((r) => safe(r.class_id) === safe(c.id));

        const studentsTotal = classStudents.length;
        const attentionCount = classStudents.filter((r) => r.attentionStatus === "Attention").length;
        const invisibleCount = classStudents.filter((r) => r.invisibleRisk).length;
        const authorityRiskCount = classStudents.filter((r) => r.authorityFragile).length;
        const ilpLoad = classStudents.filter((r) => r.isILP).length;

        const avgRisk = studentsTotal
          ? Math.round(classStudents.reduce((sum, r) => sum + r.score, 0) / studentsTotal)
          : 0;

        const avgMomentumDelta = studentsTotal
          ? Math.round(
              (classStudents.reduce((sum, r) => sum + r.evidenceMomentumDelta, 0) / studentsTotal) * 10
            ) / 10
          : 0;

        const reviewLoad14d = classStudents.reduce((sum, r) => sum + r.dueSoonReviews + r.overdueReviews, 0);
        const overdueReviews = classStudents.reduce((sum, r) => sum + r.overdueReviews, 0);
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
              Math.round(
                100 -
                  attentionCount * 8 -
                  invisibleCount * 7 -
                  overdueReviews * 4 -
                  Math.max(0, 60 - evidenceFreshPct) * 0.5
              )
            )
          );

        const projectedDeterioration = classStudents.filter(
          (r) => r.forecastRisk === "Escalating" || r.evidenceMomentumDelta < 0
        ).length;

        const teacherLoadScore =
          invisibleCount * 10 +
          authorityRiskCount * 8 +
          projectedDeterioration * 10 +
          reviewLoad14d * 4 +
          ilpLoad * 3;

        let authorityStatus: ClassMissionRow["authorityStatus"] = "Strong";
        const fragileRate = percent(authorityRiskCount, Math.max(1, studentsTotal));
        if (fragileRate >= 40) authorityStatus = "Fragile";
        else if (fragileRate >= 20) authorityStatus = "Watch";

        let deploymentRecommendation = "Maintain current leadership monitoring.";
        if (teacherLoadScore >= 70) {
          deploymentRecommendation = "Deploy leadership / support staff time here first.";
        } else if (teacherLoadScore >= 40) {
          deploymentRecommendation = "Plan check-in and short-term support boost.";
        }

        let leadershipRecommendation = "Stable class — low immediate intervention need.";
        if (projectedDeterioration >= 4 || authorityRiskCount >= 4) {
          leadershipRecommendation = "Evidence push + support review day needed.";
        } else if (invisibleCount >= 3) {
          leadershipRecommendation = "Teacher check-in needed to restore learner visibility.";
        } else if (reviewLoad14d >= 4) {
          leadershipRecommendation = "Moderation / review support should be prioritised.";
        } else if (ilpLoad >= 4) {
          leadershipRecommendation = "Resource balance review recommended.";
        }

        return {
          classId: c.id,
          classLabel: [safe(c.name), fmtYear(c.year_level), safe(c.room)].filter(Boolean).join(" • ") || "Class",
          teacherName: safe(c.teacher_name) || "—",
          studentsTotal,
          attentionCount,
          invisibleCount,
          authorityRiskCount,
          ilpLoad,
          avgRisk,
          avgMomentumDelta,
          reviewLoad14d,
          overdueReviews,
          evidenceFreshPct,
          healthScore,
          projectedDeterioration,
          teacherLoadScore,
          authorityStatus,
          deploymentRecommendation,
          leadershipRecommendation,
        };
      })
      .sort((a, b) => b.teacherLoadScore - a.teacherLoadScore);
  }, [classes, classId, strategicStudents, classHealthRows]);

  const leadershipActions = useMemo<LeadershipActionRow[]>(() => {
    const items: LeadershipActionRow[] = [];

    filteredStrategicStudents.forEach((row) => {
      if (row.forecastRisk === "Escalating") {
        items.push({
          id: `student-${row.studentId}-forecast`,
          title: `${row.studentName} needs leadership attention`,
          text: `${row.nextAction}. Forecast risk is escalating and evidence momentum is ${row.evidenceMomentumDelta >= 0 ? "stable/improving" : "declining"}.`,
          classId: row.classId,
          studentId: row.studentId,
          priorityScore: 90 + row.score,
          tone: "danger",
          cta: "Open student",
        });
      } else if (row.invisibleRisk) {
        items.push({
          id: `student-${row.studentId}-invisible`,
          title: `${row.studentName} is becoming invisible`,
          text: `Evidence visibility is weak. Leadership should ensure a fresh evidence capture plan is enacted.`,
          classId: row.classId,
          studentId: row.studentId,
          priorityScore: 70 + row.score,
          tone: "watch",
          cta: "Open student",
        });
      } else if (row.authorityFragile) {
        items.push({
          id: `student-${row.studentId}-authority`,
          title: `${row.studentName} is fragile for authority readiness`,
          text: `Documentation and compliance posture are weak enough to threaten reporting confidence.`,
          classId: row.classId,
          studentId: row.studentId,
          priorityScore: 60 + row.score,
          tone: "watch",
          cta: "Open student",
        });
      }
    });

    classMissionRows.forEach((row) => {
      if (row.teacherLoadScore >= 70) {
        items.push({
          id: `class-${row.classId}-deployment`,
          title: `${row.classLabel} needs support deployment`,
          text: row.deploymentRecommendation,
          classId: row.classId,
          studentId: null,
          priorityScore: row.teacherLoadScore,
          tone: "danger",
          cta: "Open class",
        });
      } else if (row.projectedDeterioration >= 3 || row.authorityRiskCount >= 3) {
        items.push({
          id: `class-${row.classId}-recommendation`,
          title: `${row.classLabel} needs leadership action`,
          text: row.leadershipRecommendation,
          classId: row.classId,
          studentId: null,
          priorityScore: row.teacherLoadScore,
          tone: "watch",
          cta: "Open class",
        });
      }
    });

    return items.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 12);
  }, [filteredStrategicStudents, classMissionRows]);

  const alerts = useMemo<AlertRow[]>(() => {
    const attention = strategicStudents.filter((r) => r.attentionStatus === "Attention").length;
    const invisible = strategicStudents.filter((r) => r.invisibleRisk).length;
    const escalating = strategicStudents.filter((r) => r.forecastRisk === "Escalating").length;
    const fragile = strategicStudents.filter((r) => r.authorityFragile).length;
    const overdue = strategicStudents.reduce((sum, r) => sum + r.overdueReviews, 0);

    const items: AlertRow[] = [];

    if (attention > 0) items.push({ id: "attention", text: `${attention} students are in Attention.`, tone: "danger" });
    if (escalating > 0) items.push({ id: "escalating", text: `${escalating} students are forecast to escalate.`, tone: "danger" });
    if (invisible > 0) items.push({ id: "invisible", text: `${invisible} students are becoming invisible in the evidence stream.`, tone: "watch" });
    if (fragile > 0) items.push({ id: "fragile", text: `${fragile} students are fragile for authority / compliance readiness.`, tone: "watch" });
    if (overdue > 0) items.push({ id: "overdue", text: `${overdue} overdue reviews are influencing school-wide pressure.`, tone: "danger" });

    if (items.length === 0) {
      items.push({ id: "clear", text: "No major executive alerts stand out right now.", tone: "good" });
    }

    return items;
  }, [strategicStudents]);

  const benchmarkRows = useMemo<BenchmarkRow[]>(() => {
    return classMissionRows.map((r) => {
      const pos = benchmarkPosition(r.avgRisk);
      return {
        classId: r.classId,
        classLabel: r.classLabel,
        benchmarkPosition: pos,
        note:
          pos === "Above"
            ? "Operating above benchmark expectations."
            : pos === "Near"
            ? "Near benchmark, but monitor movement."
            : "Below benchmark and likely to need support.",
      };
    });
  }, [classMissionRows]);

  const scenarioResults = useMemo<ScenarioResult[]>(() => {
    const total = strategicStudents.length;
    if (!total) return [];

    if (scenarioMode === "now") {
      const watch = strategicStudents.filter((s) => s.forecastRisk !== "Stable").length;
      return [
        {
          id: "now",
          title: "If leadership acted today",
          text: `${watch} students and ${classMissionRows.filter((c) => c.teacherLoadScore >= 40).length} classes would still need active strategic attention.`,
          tone: watch > 10 ? "danger" : watch > 5 ? "watch" : "good",
        },
      ];
    }

    if (scenarioMode === "no_evidence_week") {
      const projectedFragile = strategicStudents.filter(
        (s) => s.authorityFragile || (s.lastEvidenceDays ?? 0) > 14 || s.evidenceCount30d === 0
      ).length;
      return [
        {
          id: "no_evidence_week",
          title: "If no new evidence is added this week",
          text: `${projectedFragile} students would likely move into or remain in fragile reporting / authority posture.`,
          tone: projectedFragile > total * 0.35 ? "danger" : projectedFragile > total * 0.2 ? "watch" : "good",
        },
      ];
    }

    if (scenarioMode === "reporting_start") {
      const readyClasses = classMissionRows.filter((c) => c.authorityStatus === "Strong" && c.teacherLoadScore < 40).length;
      return [
        {
          id: "reporting_start",
          title: "If reporting season started now",
          text: `${readyClasses} classes look operationally ready, while ${classMissionRows.length - readyClasses} would enter reporting under pressure.`,
          tone: readyClasses >= classMissionRows.length * 0.7 ? "good" : readyClasses >= classMissionRows.length * 0.45 ? "watch" : "danger",
        },
      ];
    }

    const overloaded = classMissionRows.filter((c) => c.reviewLoad14d >= 4 || c.overdueReviews >= 3).length;
    return [
      {
        id: "reviews_uncleared",
        title: "If overdue reviews remain uncleared",
        text: `${overloaded} classes are likely to carry unstable support load into the next cycle.`,
        tone: overloaded >= 3 ? "danger" : overloaded >= 1 ? "watch" : "good",
      },
    ];
  }, [scenarioMode, strategicStudents, classMissionRows]);

  const summaryMetrics = useMemo(() => {
    const totalStudents = filteredStrategicStudents.length;
    const attentionCount = filteredStrategicStudents.filter((r) => r.attentionStatus === "Attention").length;
    const invisible = filteredStrategicStudents.filter((r) => r.invisibleRisk).length;
    const escalating = filteredStrategicStudents.filter((r) => r.forecastRisk === "Escalating").length;
    const fragile = filteredStrategicStudents.filter((r) => r.authorityFragile).length;
    const freshEvidence = percent(
      filteredStrategicStudents.filter((r) => r.evidenceCount30d > 0).length,
      Math.max(1, totalStudents)
    );
    const avgRisk = totalStudents
      ? Math.round(filteredStrategicStudents.reduce((sum, r) => sum + r.score, 0) / totalStudents)
      : 0;
    return {
      totalStudents,
      attentionCount,
      invisible,
      escalating,
      fragile,
      freshEvidence,
      avgRisk,
    };
  }, [filteredStrategicStudents]);

  function exportCsv() {
    const headers = [
      "Student",
      "Class",
      "Attention",
      "Invisible Risk",
      "Forecast Risk",
      "Authority Fragile",
      "Evidence 30d",
      "Evidence Prev30d",
      "Momentum Delta",
      "Open Interventions",
      "Overdue Reviews",
      "Next Action",
    ];

    const lines = [headers.join(",")];

    filteredStrategicStudents.forEach((row) => {
      const cls = classMap.get(safe(row.classId));
      lines.push(
        [
          csvEscape(row.studentName),
          csvEscape([safe(cls?.name), fmtYear(cls?.year_level)].filter(Boolean).join(" • ")),
          csvEscape(row.attentionStatus),
          csvEscape(row.invisibleRisk ? "Yes" : "No"),
          csvEscape(row.forecastRisk),
          csvEscape(row.authorityFragile ? "Yes" : "No"),
          csvEscape(row.evidenceCount30d),
          csvEscape(row.evidencePrev30d),
          csvEscape(row.evidenceMomentumDelta),
          csvEscape(row.openInterventions),
          csvEscape(row.overdueReviews),
          csvEscape(row.nextAction),
        ].join(",")
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leadership-command-centre-elite.csv";
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
              <div style={S.subtle}>Leadership Mission Control</div>
              <div style={S.h1}>Leadership Command Centre Elite</div>
              <div style={S.sub}>
                Whole-school mission control for forecasting deterioration, deploying resources, monitoring authority readiness, and driving leadership action with queue-based oversight.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={S.btn} onClick={() => router.push("/admin/leadership/heatmap")}>
                Open Heatmap
              </button>
              <button type="button" style={S.btn} onClick={() => router.push("/admin/leadership/benchmarks")}>
                Open Benchmarks
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
                <div style={{ ...S.sectionTitle, color: activePreset.text }}>Executive Presets</div>
                <div style={S.sectionHelp}>
                  Switch the command centre into leadership, reporting, deployment, authority, or intervention mode.
                </div>
              </div>

              <button type="button" style={S.btn} onClick={() => applyPreset("leadership")}>
                Reset to Leadership
              </button>
            </div>

            <div style={{ ...S.row, marginTop: 12 }}>
              {LEADERSHIP_PRESETS.map((preset) => {
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
              <select value={scenarioMode} onChange={(e) => setScenarioMode(e.target.value as any)} style={S.select}>
                <option value="now">If we act now</option>
                <option value="no_evidence_week">If no evidence is added this week</option>
                <option value="reporting_start">If reporting started now</option>
                <option value="reviews_uncleared">If overdue reviews remain uncleared</option>
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
              <div style={S.tileS}>Filtered students in current executive scope.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Attention</div>
              <div style={S.tileV}>{summaryMetrics.attentionCount}</div>
              <div style={S.tileS}>Students in the highest concern band.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Invisible</div>
              <div style={S.tileV}>{summaryMetrics.invisible}</div>
              <div style={S.tileS}>Learners falling out of the evidence stream.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Escalating</div>
              <div style={S.tileV}>{summaryMetrics.escalating}</div>
              <div style={S.tileS}>Students forecast to worsen soon.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Authority Fragile</div>
              <div style={S.tileV}>{summaryMetrics.fragile}</div>
              <div style={S.tileS}>Weak compliance / audit readiness.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Fresh Evidence</div>
              <div style={S.tileV}>{summaryMetrics.freshEvidence}%</div>
              <div style={S.tileS}>Students with evidence inside 30 days.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Average Risk</div>
              <div style={S.tileV}>{summaryMetrics.avgRisk}</div>
              <div style={S.tileS}>School-wide executive risk position.</div>
            </div>
          </div>
        </section>

        {busy ? <div style={S.ok}>Refreshing leadership command centre…</div> : null}
        {err ? <div style={S.err}>{err}</div> : null}

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Executive Alerts</div>
            <div style={S.sectionHelp}>
              Top whole-school signals that need leadership awareness today.
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
            <div style={S.sectionTitle}>Scenario Planning</div>
            <div style={S.sectionHelp}>
              Test pressure scenarios to understand how quickly the system could destabilise.
            </div>
            <div style={S.list}>
              {scenarioResults.map((r) => (
                <div key={r.id} style={{ ...S.item, ...alertToneStyle(r.tone) }}>
                  <div style={S.itemTitle}>{r.title}</div>
                  <div style={S.itemText}>{r.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Priority Leadership Queue</div>
            <div style={S.sectionHelp}>
              Ranked actions for leadership this week, driven by forecast, authority fragility, and support pressure.
            </div>
            <div style={S.list}>
              {leadershipActions.length === 0 ? (
                <div style={S.empty}>No immediate leadership actions stand out right now.</div>
              ) : (
                leadershipActions.map((row) => (
                  <div key={row.id} style={{ ...S.item, ...alertToneStyle(row.tone) }}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <div style={S.itemTitle}>{row.title}</div>
                      <span style={S.chipMuted}>Priority {row.priorityScore}</span>
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
            <div style={S.sectionTitle}>Benchmark Positioning</div>
            <div style={S.sectionHelp}>
              Quick comparison of classes against internal benchmark expectations.
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
          <div style={S.sectionTitle}>Class Mission Table</div>
          <div style={S.sectionHelp}>
            Resource deployment, forecast deterioration, authority posture, and teacher load by class.
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Class</th>
                  <th style={S.th}>Teacher</th>
                  <th style={S.th}>Health</th>
                  <th style={S.th}>Avg Risk</th>
                  <th style={S.th}>Momentum</th>
                  <th style={S.th}>Invisible</th>
                  <th style={S.th}>Authority</th>
                  <th style={S.th}>Load</th>
                  <th style={S.th}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {classMissionRows.map((row) => {
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
                      <td style={S.td}>{row.healthScore}</td>
                      <td style={S.td}>{row.avgRisk}</td>
                      <td style={S.td}>
                        {row.avgMomentumDelta >= 0 ? "+" : ""}
                        {row.avgMomentumDelta}
                      </td>
                      <td style={S.td}>{row.invisibleCount}</td>
                      <td style={S.td}>
                        <span style={{ ...S.chip, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
                          {row.authorityStatus}
                        </span>
                      </td>
                      <td style={S.td}>{row.teacherLoadScore}</td>
                      <td style={S.td}>
                        <div style={{ fontWeight: 900 }}>{row.deploymentRecommendation}</div>
                        <div style={{ marginTop: 6, color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>
                          {row.leadershipRecommendation}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ ...S.card, ...S.sectionPad, marginTop: 14 }}>
          <div style={S.sectionTitle}>Priority Student Radar</div>
          <div style={S.sectionHelp}>
            Top learners in the current executive scope, combining attention, forecast risk, support load, and authority fragility.
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
                  <th style={S.th}>Authority</th>
                  <th style={S.th}>Next Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStrategicStudents.map((row) => {
                  const att = attentionTone(row.attentionStatus);
                  const ft = forecastTone(row.forecastRisk);
                  const at = authorityTone(row.authorityFragile ? "Fragile" : "Strong");
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
                      <td style={S.td}>
                        <span style={{ ...S.chip, background: at.bg, borderColor: at.bd, color: at.fg }}>
                          {row.authorityFragile ? "Fragile" : "Strong"}
                        </span>
                      </td>
                      <td style={S.td}>{row.nextAction}</td>
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
          returnTo="/admin/leadership"
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
    gridTemplateColumns: "repeat(7, minmax(145px, 1fr))",
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