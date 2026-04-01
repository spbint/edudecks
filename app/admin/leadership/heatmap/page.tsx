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
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  visibility?: string | null;
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

type HeatmapCell = {
  studentId: string;
  area: string;
  count: number;
  freshCount: number;
  lastSeenAt: string | null;
  studentCoverageScore: number;
  status: "Strong" | "Watch" | "Gap";
  riskScore: number;
};

type HeatmapStudentRow = {
  studentId: string;
  classId: string | null;
  studentName: string;
  isILP: boolean;
  attentionStatus: "Ready" | "Watch" | "Attention";
  nextAction: string;
  openInterventions: number;
  overdueReviews: number;
  evidenceCount30d: number;
  evidencePrev30d: number;
  evidenceMomentumDelta: number;
  totalEvidenceCount: number;
  invisibleRisk: boolean;
  authorityFragile: boolean;
  forecastRisk: "Stable" | "Watch" | "Escalating";
  score: number;
  cells: HeatmapCell[];
};

type LeadershipPresetKey =
  | "leadership"
  | "reporting"
  | "invisible"
  | "coverage"
  | "interventions";

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
    sortMode: "risk" | "name" | "coverage" | "interventions" | "forecast";
    maxRows: number;
    emphasizeCoverage: boolean;
    emphasizeReporting: boolean;
  };
};

type HotspotRow = {
  area: string;
  gapCount: number;
  watchCount: number;
  strongCount: number;
  avgCoverage: number;
  momentumPressure: number;
};

type AlertRow = {
  id: string;
  text: string;
  tone: "good" | "watch" | "danger" | "info";
};

type LeadershipActionRow = {
  id: string;
  title: string;
  text: string;
  classId: string | null;
  studentId: string | null;
  priorityScore: number;
  tone: "good" | "watch" | "danger";
  cta: string;
};

type ClassForecastRow = {
  classId: string;
  classLabel: string;
  healthScore: number;
  projectedDeterioration: number;
  reviewLoad14d: number;
  invisibleCount: number;
  authorityRiskCount: number;
  teacherLoadScore: number;
  resourceRecommendation: string;
  leadershipRecommendation: string;
};

type StrategicComparisonRow = {
  classId: string;
  classLabel: string;
  avgRisk: number;
  ilpLoad: number;
  invisibleCount: number;
  attentionCount: number;
  authorityStatus: "Strong" | "Watch" | "Fragile";
  recommendation: string;
};

/* ───────────────────────── PRESETS ───────────────────────── */

const LEADERSHIP_PRESETS: LeadershipPreset[] = [
  {
    key: "leadership",
    label: "Leadership",
    description: "Strategic school-wide radar for risk, hotspots, and invisible learners.",
    accent: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      sortMode: "risk",
      maxRows: 30,
      emphasizeCoverage: true,
      emphasizeReporting: false,
    },
  },
  {
    key: "reporting",
    label: "Reporting Season",
    description: "Focus on evidence gaps and readiness risk before reports and conferences.",
    accent: "#c2410c",
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#9a3412",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      sortMode: "forecast",
      maxRows: 30,
      emphasizeCoverage: true,
      emphasizeReporting: true,
    },
  },
  {
    key: "invisible",
    label: "Invisible Students",
    description: "Surface students disappearing from the evidence stream or operating quietly.",
    accent: "#7c2d12",
    bg: "#fff7ed",
    border: "#fdba74",
    text: "#9a3412",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: true,
      sortMode: "risk",
      maxRows: 24,
      emphasizeCoverage: false,
      emphasizeReporting: false,
    },
  },
  {
    key: "coverage",
    label: "Coverage Heat",
    description: "Show curriculum/evidence coverage pressure by student and learning area.",
    accent: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    text: "#0c4a6e",
    filters: {
      showOnlyAttention: false,
      showOnlyInvisibleRisk: false,
      sortMode: "coverage",
      maxRows: 30,
      emphasizeCoverage: true,
      emphasizeReporting: false,
    },
  },
  {
    key: "interventions",
    label: "Intervention Queue",
    description: "Prioritise students with active support load and overdue review pressure.",
    accent: "#be123c",
    bg: "#fff1f2",
    border: "#fecdd3",
    text: "#9f1239",
    filters: {
      showOnlyAttention: true,
      showOnlyInvisibleRisk: false,
      sortMode: "interventions",
      maxRows: 24,
      emphasizeCoverage: false,
      emphasizeReporting: false,
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

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();
  if (x.includes("math")) return "Maths";
  if (x.includes("liter") || x.includes("reading") || x.includes("writing") || x.includes("english")) {
    return "Literacy";
  }
  if (x.includes("science")) return "Science";
  if (x.includes("well") || x.includes("pastoral") || x.includes("social") || x.includes("behaviour") || x.includes("behavior")) {
    return "Wellbeing";
  }
  if (x.includes("human") || x.includes("history") || x.includes("geography") || x.includes("hass")) {
    return "Humanities";
  }
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

function cellTone(status: HeatmapCell["status"]) {
  if (status === "Gap") return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
  if (status === "Watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
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

function authorityTone(status: "Strong" | "Watch" | "Fragile") {
  if (status === "Strong") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (status === "Watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function LeadershipHeatmapPage() {
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
  const [selectedArea, setSelectedArea] = useState("All");
  const [activePresetKey, setActivePresetKey] = useState<LeadershipPresetKey>("leadership");

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
        .limit(12000);

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
        .limit(6000);

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
        ? window.localStorage.getItem("edudecks.leadership.heatmap.preset.v1")
        : null;
    const preset = getPreset(stored);
    setActivePresetKey(preset.key);
    loadAll();
  }, []);

  function applyPreset(key: LeadershipPresetKey) {
    setActivePresetKey(key);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("edudecks.leadership.heatmap.preset.v1", key);
    }
  }

  const activePreset = useMemo(() => getPreset(activePresetKey), [activePresetKey]);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassRow>();
    for (const c of classes) map.set(c.id, c);
    return map;
  }, [classes]);

  const studentMap = useMemo(() => {
    const map = new Map<string, StudentRow>();
    for (const s of students) map.set(s.id, s);
    return map;
  }, [students]);

  const overviewMap = useMemo(() => {
    const map = new Map<string, StudentProfileOverviewRow>();
    for (const r of studentOverviewRows) map.set(r.student_id, r);
    return map;
  }, [studentOverviewRows]);

  const interventionMap = useMemo(() => {
    const map = new Map<string, InterventionRow[]>();
    for (const iv of interventions) {
      const sid = safe(iv.student_id);
      if (!sid) continue;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(iv);
    }
    return map;
  }, [interventions]);

  const evidenceMap = useMemo(() => {
    const map = new Map<string, EvidenceEntryRow[]>();
    for (const e of evidenceEntries) {
      const sid = safe(e.student_id);
      if (!sid) continue;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(e);
    }
    return map;
  }, [evidenceEntries]);

  const areas = useMemo(() => {
    return ["Literacy", "Maths", "Science", "Wellbeing", "Humanities", "Other"];
  }, []);

  const scopedStudentIds = useMemo(() => {
    return students
      .filter((s) => classId === "all" || safe(s.class_id) === classId)
      .map((s) => s.id);
  }, [students, classId]);

  const heatmapRows = useMemo<HeatmapStudentRow[]>(() => {
    const rows = scopedStudentIds.map((studentId) => {
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
      const evidenceCount30 =
        Number(o?.evidence_count_30d ?? 0) ||
        evidenceList.filter((e) => {
          const d = daysSince(e.occurred_on || e.created_at);
          return d != null && d <= 30;
        }).length;

      const evidencePrev30d = evidenceList.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d > 30 && d <= 60;
      }).length;

      const evidenceMomentumDelta = evidenceCount30 - evidencePrev30d;

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

      const areaGapCount = areas.reduce((sum, area) => {
        const count = evidenceList.filter((e) => guessArea(e.learning_area) === area).length;
        return sum + (count === 0 ? 1 : 0);
      }, 0);

      const authorityFragile =
        invisibleRisk || overdueReviews.length > 0 || areaGapCount >= 2 || evidenceCount30 === 0;

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
      if (evidenceCount30 === 0) score += 14;
      if (s?.is_ilp) score += 8;
      if (authorityFragile) score += 10;

      const cells: HeatmapCell[] = areas.map((area) => {
        const areaEntries = evidenceList.filter((e) => guessArea(e.learning_area) === area);
        const freshAreaEntries = areaEntries.filter((e) => {
          const d = daysSince(e.occurred_on || e.created_at);
          return d != null && d <= 30;
        });
        const lastSeenAt = areaEntries[0]?.occurred_on || areaEntries[0]?.created_at || null;

        const studentCoverageScore =
          areaEntries.length === 0
            ? 0
            : Math.min(
                100,
                freshAreaEntries.length * 30 +
                  (lastSeenAt && (daysSince(lastSeenAt) ?? 999) <= 30 ? 40 : 0) +
                  Math.min(areaEntries.length, 3) * 10
              );

        let status: HeatmapCell["status"] = "Strong";
        if (areaEntries.length === 0) status = "Gap";
        else if (freshAreaEntries.length === 0 || (daysSince(lastSeenAt) ?? 999) > 45) status = "Watch";

        let riskScore = 0;
        if (status === "Gap") riskScore += 35;
        if (status === "Watch") riskScore += 18;
        if (attentionStatus === "Attention") riskScore += 10;
        if (invisibleRisk) riskScore += 10;
        if (overdueReviews.length > 0) riskScore += 8;
        if (evidenceMomentumDelta < 0) riskScore += 8;

        return {
          studentId,
          area,
          count: areaEntries.length,
          freshCount: freshAreaEntries.length,
          lastSeenAt,
          studentCoverageScore,
          status,
          riskScore,
        };
      });

      let forecastRisk: HeatmapStudentRow["forecastRisk"] = "Stable";
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
        openInterventions: Number(o?.open_interventions_count ?? activeInterventions.length) || activeInterventions.length,
        overdueReviews: Number(o?.overdue_reviews_count ?? overdueReviews.length) || overdueReviews.length,
        evidenceCount30d: evidenceCount30,
        evidencePrev30d,
        evidenceMomentumDelta,
        totalEvidenceCount,
        invisibleRisk,
        authorityFragile,
        forecastRisk,
        score,
        cells,
      };
    });

    return rows;
  }, [scopedStudentIds, studentMap, overviewMap, evidenceMap, interventionMap, areas]);

  const filteredHeatmapRows = useMemo(() => {
    let rows = [...heatmapRows];

    const q = safe(searchStudent).toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.studentName.toLowerCase().includes(q));
    }

    if (activePreset.filters.showOnlyAttention) {
      rows = rows.filter(
        (r) =>
          r.attentionStatus === "Attention" ||
          r.overdueReviews > 0 ||
          r.openInterventions > 0
      );
    }

    if (activePreset.filters.showOnlyInvisibleRisk) {
      rows = rows.filter((r) => r.invisibleRisk);
    }

    if (selectedArea !== "All") {
      rows = rows.filter((r) =>
        r.cells.some((c) => c.area === selectedArea && (c.count > 0 || c.status !== "Strong"))
      );
    }

    if (activePreset.filters.sortMode === "name") {
      rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
    } else if (activePreset.filters.sortMode === "coverage") {
      rows.sort((a, b) => {
        const aCoverage = a.cells.reduce((sum, c) => sum + c.studentCoverageScore, 0);
        const bCoverage = b.cells.reduce((sum, c) => sum + c.studentCoverageScore, 0);
        return aCoverage - bCoverage;
      });
    } else if (activePreset.filters.sortMode === "interventions") {
      rows.sort(
        (a, b) =>
          b.overdueReviews +
          b.openInterventions -
          (a.overdueReviews + a.openInterventions)
      );
    } else if (activePreset.filters.sortMode === "forecast") {
      const rank = { Escalating: 3, Watch: 2, Stable: 1 };
      rows.sort((a, b) => rank[b.forecastRisk] - rank[a.forecastRisk] || b.score - a.score);
    } else {
      rows.sort((a, b) => b.score - a.score);
    }

    return rows.slice(0, activePreset.filters.maxRows);
  }, [heatmapRows, searchStudent, activePreset, selectedArea]);

  const hotspotRows = useMemo<HotspotRow[]>(() => {
    return areas.map((area) => {
      const areaCells = heatmapRows.map((r) => r.cells.find((c) => c.area === area)).filter(Boolean) as HeatmapCell[];
      const gapCount = areaCells.filter((c) => c.status === "Gap").length;
      const watchCount = areaCells.filter((c) => c.status === "Watch").length;
      const strongCount = areaCells.filter((c) => c.status === "Strong").length;
      const avgCoverage = Math.round(
        areaCells.reduce((sum, c) => sum + c.studentCoverageScore, 0) / Math.max(1, areaCells.length)
      );
      const momentumPressure = heatmapRows.filter((r) => {
        const cell = r.cells.find((c) => c.area === area);
        return !!cell && (cell.status !== "Strong" || r.evidenceMomentumDelta < 0);
      }).length;

      return { area, gapCount, watchCount, strongCount, avgCoverage, momentumPressure };
    });
  }, [areas, heatmapRows]);

  const alerts = useMemo<AlertRow[]>(() => {
    const invisible = heatmapRows.filter((r) => r.invisibleRisk).length;
    const attention = heatmapRows.filter((r) => r.attentionStatus === "Attention").length;
    const overdue = heatmapRows.reduce((sum, r) => sum + r.overdueReviews, 0);
    const escalating = heatmapRows.filter((r) => r.forecastRisk === "Escalating").length;
    const fragile = heatmapRows.filter((r) => r.authorityFragile).length;
    const severeHotspots = hotspotRows.filter((h) => h.gapCount >= 3).length;

    const items: AlertRow[] = [];

    if (attention > 0) {
      items.push({
        id: "attention",
        text: `${attention} students sit in Attention across the current heatmap scope.`,
        tone: "danger",
      });
    }

    if (escalating > 0) {
      items.push({
        id: "escalating",
        text: `${escalating} students are forecast to escalate without intervention.`,
        tone: "danger",
      });
    }

    if (invisible > 0) {
      items.push({
        id: "invisible",
        text: `${invisible} students may be becoming invisible in the evidence stream.`,
        tone: "watch",
      });
    }

    if (fragile > 0) {
      items.push({
        id: "fragile",
        text: `${fragile} students currently present fragile authority / compliance readiness.`,
        tone: "watch",
      });
    }

    if (overdue > 0) {
      items.push({
        id: "overdue",
        text: `${overdue} overdue intervention reviews are influencing leadership risk.`,
        tone: "danger",
      });
    }

    if (severeHotspots > 0) {
      items.push({
        id: "hotspots",
        text: `${severeHotspots} learning areas show cluster-level heat pressure.`,
        tone: activePreset.filters.emphasizeReporting ? "danger" : "info",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "clear",
        text: "No major leadership alerts currently stand out in this scope.",
        tone: "good",
      });
    }

    return items;
  }, [heatmapRows, hotspotRows, activePreset]);

  const classForecastRows = useMemo<ClassForecastRow[]>(() => {
    return classes
      .map((c) => {
        const classStudents = heatmapRows.filter((r) => safe(r.classId) === safe(c.id));
        const classHealth = classHealthRows.find((r) => safe(r.class_id) === safe(c.id));
        const reviewLoad14d = classStudents.reduce((sum, r) => sum + r.overdueReviews, 0) +
          classStudents.filter((r) => r.forecastRisk !== "Stable").length;
        const invisibleCount = classStudents.filter((r) => r.invisibleRisk).length;
        const authorityRiskCount = classStudents.filter((r) => r.authorityFragile).length;
        const projectedDeterioration = classStudents.filter(
          (r) => r.forecastRisk === "Escalating" || r.evidenceMomentumDelta < 0
        ).length;
        const teacherLoadScore =
          invisibleCount * 10 +
          authorityRiskCount * 8 +
          projectedDeterioration * 10 +
          reviewLoad14d * 4;

        let resourceRecommendation = "Maintain current leadership monitoring.";
        if (teacherLoadScore >= 70) {
          resourceRecommendation = "Deploy leadership / support staff time here first.";
        } else if (teacherLoadScore >= 40) {
          resourceRecommendation = "Plan check-in and short-term support boost.";
        }

        let leadershipRecommendation = "Stable class — low immediate intervention need.";
        if (projectedDeterioration >= 4 || authorityRiskCount >= 4) {
          leadershipRecommendation = "Evidence push + support review day needed.";
        } else if (invisibleCount >= 3) {
          leadershipRecommendation = "Teacher check-in needed to restore learner visibility.";
        } else if (reviewLoad14d >= 4) {
          leadershipRecommendation = "Moderation / review support should be prioritised.";
        }

        return {
          classId: c.id,
          classLabel: [safe(c.name), fmtYear(c.year_level), safe(c.room)].filter(Boolean).join(" • ") || "Class",
          healthScore: Math.round(Number(classHealth?.health_score ?? 0)),
          projectedDeterioration,
          reviewLoad14d,
          invisibleCount,
          authorityRiskCount,
          teacherLoadScore,
          resourceRecommendation,
          leadershipRecommendation,
        };
      })
      .sort((a, b) => b.teacherLoadScore - a.teacherLoadScore);
  }, [classes, heatmapRows, classHealthRows]);

  const strategicComparison = useMemo<StrategicComparisonRow[]>(() => {
    return classes
      .map((c) => {
        const classStudents = heatmapRows.filter((r) => safe(r.classId) === safe(c.id));
        const avgRisk = classStudents.length
          ? Math.round(classStudents.reduce((sum, r) => sum + r.score, 0) / classStudents.length)
          : 0;
        const ilpLoad = classStudents.filter((r) => r.isILP).length;
        const invisibleCount = classStudents.filter((r) => r.invisibleRisk).length;
        const attentionCount = classStudents.filter((r) => r.attentionStatus === "Attention").length;

        let authorityStatus: StrategicComparisonRow["authorityStatus"] = "Strong";
        const fragileRate = percent(
          classStudents.filter((r) => r.authorityFragile).length,
          Math.max(1, classStudents.length)
        );
        if (fragileRate >= 40) authorityStatus = "Fragile";
        else if (fragileRate >= 20) authorityStatus = "Watch";

        let recommendation = "Stable comparison position.";
        if (authorityStatus === "Fragile") recommendation = "Highest leadership priority for support and oversight.";
        else if (invisibleCount >= 3) recommendation = "Visibility recovery needed.";
        else if (attentionCount >= 3) recommendation = "Student support clustering needs review.";
        else if (ilpLoad >= 4) recommendation = "Check resource balance and staffing support.";

        return {
          classId: c.id,
          classLabel: [safe(c.name), fmtYear(c.year_level)].filter(Boolean).join(" • ") || "Class",
          avgRisk,
          ilpLoad,
          invisibleCount,
          attentionCount,
          authorityStatus,
          recommendation,
        };
      })
      .sort((a, b) => b.avgRisk - a.avgRisk);
  }, [classes, heatmapRows]);

  const leadershipActions = useMemo<LeadershipActionRow[]>(() => {
    const items: LeadershipActionRow[] = [];

    heatmapRows.forEach((row) => {
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
      }
    });

    classForecastRows.forEach((row) => {
      if (row.teacherLoadScore >= 70) {
        items.push({
          id: `class-${row.classId}-load`,
          title: `${row.classLabel} needs support deployment`,
          text: row.resourceRecommendation,
          classId: row.classId,
          studentId: null,
          priorityScore: row.teacherLoadScore,
          tone: "danger",
          cta: "Open class",
        });
      } else if (row.projectedDeterioration >= 3) {
        items.push({
          id: `class-${row.classId}-deterioration`,
          title: `${row.classLabel} is forecast to deteriorate`,
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
  }, [heatmapRows, classForecastRows]);

  const topClassHealth = useMemo(() => {
    const scoped = classId === "all" ? classHealthRows : classHealthRows.filter((r) => safe(r.class_id) === classId);
    const rows = [...scoped].sort((a, b) => Number(a.health_score ?? 0) - Number(b.health_score ?? 0));
    return rows.slice(0, 5);
  }, [classHealthRows, classId]);

  const summaryMetrics = useMemo(() => {
    const totalStudents = filteredHeatmapRows.length;
    const attentionCount = filteredHeatmapRows.filter((r) => r.attentionStatus === "Attention").length;
    const invisible = filteredHeatmapRows.filter((r) => r.invisibleRisk).length;
    const evidenceFresh = percent(
      filteredHeatmapRows.filter((r) => r.evidenceCount30d > 0).length,
      Math.max(1, filteredHeatmapRows.length)
    );
    const gapCells = filteredHeatmapRows.flatMap((r) => r.cells).filter((c) => c.status === "Gap").length;
    const escalating = filteredHeatmapRows.filter((r) => r.forecastRisk === "Escalating").length;
    const fragile = filteredHeatmapRows.filter((r) => r.authorityFragile).length;

    return {
      totalStudents,
      attentionCount,
      invisible,
      evidenceFresh,
      gapCells,
      escalating,
      fragile,
    };
  }, [filteredHeatmapRows]);

  function exportCsv() {
    const headers = [
      "Student",
      "Class",
      "Attention",
      "Invisible Risk",
      "Forecast Risk",
      "Authority Fragile",
      "Next Action",
      ...areas.flatMap((area) => [
        `${area} Status`,
        `${area} Count`,
        `${area} Fresh`,
        `${area} Last Seen`,
      ]),
    ];

    const lines = [headers.join(",")];

    filteredHeatmapRows.forEach((row) => {
      const cls = classMap.get(safe(row.classId));
      const areaData = areas.flatMap((area) => {
        const c = row.cells.find((x) => x.area === area);
        return [
          csvEscape(c?.status ?? ""),
          csvEscape(c?.count ?? 0),
          csvEscape(c?.freshCount ?? 0),
          csvEscape(isoShort(c?.lastSeenAt ?? "")),
        ];
      });

      lines.push(
        [
          csvEscape(row.studentName),
          csvEscape([safe(cls?.name), fmtYear(cls?.year_level)].filter(Boolean).join(" • ")),
          csvEscape(row.attentionStatus),
          csvEscape(row.invisibleRisk ? "Yes" : "No"),
          csvEscape(row.forecastRisk),
          csvEscape(row.authorityFragile ? "Yes" : "No"),
          csvEscape(row.nextAction),
          ...areaData,
        ].join(",")
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leadership-heatmap-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.row}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={S.subtle}>Leadership Diagnostic Radar</div>
              <div style={S.h1}>Leadership Heatmap — Elite Mission Control</div>
              <div style={S.sub}>
                Strategic oversight of student visibility, coverage, intervention pressure, authority fragility,
                forecast escalation, and class-level deployment priorities.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={S.btn} onClick={() => router.push("/admin/leadership")}>
                Leadership Home
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
                <div style={{ ...S.sectionTitle, color: activePreset.text }}>
                  Saved Views / Leadership Presets
                </div>
                <div style={S.sectionHelp}>
                  Change the working lens of the heatmap without changing page or route.
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
                      minWidth: 176,
                      textAlign: "left",
                    }}
                    title={preset.description}
                  >
                    <div style={{ fontSize: 13, fontWeight: 950 }}>{preset.label}</div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        lineHeight: 1.35,
                        opacity: active ? 0.95 : 0.78,
                        fontWeight: 800,
                      }}
                    >
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 12,
                borderRadius: 14,
                border: `1px solid ${activePreset.border}`,
                background: "#fff",
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 950, color: activePreset.text }}>
                Active lens: {activePreset.label}
              </div>
              <div style={{ marginTop: 6, color: "#475569", fontWeight: 800, lineHeight: 1.45 }}>
                {activePreset.description}
              </div>
              <div style={{ ...S.row, marginTop: 10 }}>
                <span style={S.chipMuted}>sortMode: {activePreset.filters.sortMode}</span>
                <span style={S.chipMuted}>maxRows: {String(activePreset.filters.maxRows)}</span>
                <span style={S.chipMuted}>
                  invisibleOnly: {String(activePreset.filters.showOnlyInvisibleRisk)}
                </span>
                <span style={S.chipMuted}>
                  attentionOnly: {String(activePreset.filters.showOnlyAttention)}
                </span>
              </div>
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
              <label style={S.subtle}>Area filter</label>
              <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} style={S.select}>
                <option value="All">All areas</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
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
              <div style={S.tileS}>Students shown after current preset and filter rules.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Attention</div>
              <div style={S.tileV}>{summaryMetrics.attentionCount}</div>
              <div style={S.tileS}>Students in highest concern band.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Invisible Risk</div>
              <div style={S.tileV}>{summaryMetrics.invisible}</div>
              <div style={S.tileS}>Students with weak visibility in current evidence flow.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Fresh Evidence</div>
              <div style={S.tileV}>{summaryMetrics.evidenceFresh}%</div>
              <div style={S.tileS}>Students with evidence inside the last 30 days.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Gap Cells</div>
              <div style={S.tileV}>{summaryMetrics.gapCells}</div>
              <div style={S.tileS}>Heatmap cells currently sitting at gap level.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Escalating</div>
              <div style={S.tileV}>{summaryMetrics.escalating}</div>
              <div style={S.tileS}>Students forecast to worsen without intervention.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Authority Fragile</div>
              <div style={S.tileV}>{summaryMetrics.fragile}</div>
              <div style={S.tileS}>Students with weak compliance / submission posture.</div>
            </div>
          </div>
        </section>

        {busy ? <div style={S.ok}>Refreshing leadership heatmap data…</div> : null}
        {err ? <div style={S.err}>{err}</div> : null}

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Leadership Alerts</div>
            <div style={S.sectionHelp}>
              Strategic cues that help leaders move from pattern visibility to action.
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
            <div style={S.sectionTitle}>Priority Leadership Queue</div>
            <div style={S.sectionHelp}>
              Top ranked actions for leadership this week, generated from forecast risk, visibility, and support pressure.
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
        </section>

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Class Health Pressure</div>
            <div style={S.sectionHelp}>
              Lowest health-score classes in the current scope, using the class health view where available.
            </div>

            <div style={S.list}>
              {topClassHealth.length === 0 ? (
                <div style={S.empty}>No class health view data is currently available.</div>
              ) : (
                topClassHealth.map((row) => {
                  const cls = classMap.get(safe(row.class_id));
                  return (
                    <div key={safe(row.class_id)} style={S.item}>
                      <div style={{ ...S.row, justifyContent: "space-between" }}>
                        <div style={S.itemTitle}>
                          {[safe(row.class_name || cls?.name), fmtYear(cls?.year_level)].filter(Boolean).join(" • ") || "Class"}
                        </div>
                        <span style={S.chipMuted}>Health {Math.round(Number(row.health_score ?? 0))}</span>
                      </div>
                      <div style={{ ...S.row, marginTop: 8 }}>
                        <span style={S.chipMuted}>students: {Number(row.students_total ?? 0)}</span>
                        <span style={S.chipMuted}>attention: {Number(row.students_attention ?? 0)}</span>
                        <span style={S.chipMuted}>fresh: {Math.round(Number(row.evidence_fresh_pct ?? 0))}%</span>
                        <span style={S.chipMuted}>active supports: {Number(row.active_interventions ?? 0)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Class Forecast & Deployment Guidance</div>
            <div style={S.sectionHelp}>
              Forward-looking view of which classes are likely to deteriorate and where leadership or support staff should be deployed first.
            </div>

            <div style={S.list}>
              {classForecastRows.slice(0, 6).map((row) => (
                <div key={row.classId} style={S.item}>
                  <div style={{ ...S.row, justifyContent: "space-between" }}>
                    <div style={S.itemTitle}>{row.classLabel}</div>
                    <span style={S.chipMuted}>Load {row.teacherLoadScore}</span>
                  </div>
                  <div style={{ ...S.row, marginTop: 8 }}>
                    <span style={S.chipMuted}>deteriorating {row.projectedDeterioration}</span>
                    <span style={S.chipMuted}>review load {row.reviewLoad14d}</span>
                    <span style={S.chipMuted}>invisible {row.invisibleCount}</span>
                    <span style={S.chipMuted}>authority risk {row.authorityRiskCount}</span>
                  </div>
                  <div style={S.itemText}>{row.resourceRecommendation}</div>
                  <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800 }}>
                    {row.leadershipRecommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Area Hotspots</div>
            <div style={S.sectionHelp}>
              Cluster-level heat by learning area across the current scope, including momentum pressure.
            </div>

            <div style={S.list}>
              {hotspotRows.map((row) => (
                <div key={row.area} style={S.item}>
                  <div style={{ ...S.row, justifyContent: "space-between" }}>
                    <div style={S.itemTitle}>{row.area}</div>
                    <span style={S.chipMuted}>avg coverage {row.avgCoverage}%</span>
                  </div>
                  <div style={{ ...S.row, marginTop: 8 }}>
                    <span style={S.chipMuted}>gap: {row.gapCount}</span>
                    <span style={S.chipMuted}>watch: {row.watchCount}</span>
                    <span style={S.chipMuted}>strong: {row.strongCount}</span>
                    <span style={S.chipMuted}>momentum pressure: {row.momentumPressure}</span>
                    <button
                      type="button"
                      style={S.btn}
                      onClick={() => setSelectedArea(row.area)}
                    >
                      Focus area
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Cross-Class Strategic Comparison</div>
            <div style={S.sectionHelp}>
              Compare average risk, ILP load, invisible students, and authority posture across classes.
            </div>

            <div style={S.list}>
              {strategicComparison.slice(0, 8).map((row) => {
                const tone = authorityTone(row.authorityStatus);
                return (
                  <div key={row.classId} style={S.item}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <div style={S.itemTitle}>{row.classLabel}</div>
                      <span style={{ ...S.chip, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
                        {row.authorityStatus}
                      </span>
                    </div>
                    <div style={{ ...S.row, marginTop: 8 }}>
                      <span style={S.chipMuted}>avg risk {row.avgRisk}</span>
                      <span style={S.chipMuted}>ILP {row.ilpLoad}</span>
                      <span style={S.chipMuted}>invisible {row.invisibleCount}</span>
                      <span style={S.chipMuted}>attention {row.attentionCount}</span>
                    </div>
                    <div style={S.itemText}>{row.recommendation}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ ...S.card, ...S.sectionPad, marginTop: 14 }}>
          <div style={S.sectionTitle}>Leadership Heatmap Matrix</div>
          <div style={S.sectionHelp}>
            Each cell reflects visibility and recency pressure by student and learning area, with forecast and authority cues added at student level.
          </div>

          <div style={S.matrixWrap}>
            <div style={S.matrixTable}>
              <div style={S.matrixHeaderName}>Student</div>
              {areas.map((area) => (
                <div key={area} style={S.matrixHeaderCell}>
                  {area}
                </div>
              ))}

              {filteredHeatmapRows.length === 0 ? (
                <div style={{ gridColumn: `1 / span ${areas.length + 1}`, ...S.empty, marginTop: 12 }}>
                  No students match the current leadership preset and filters.
                </div>
              ) : (
                filteredHeatmapRows.map((row) => (
                  <React.Fragment key={row.studentId}>
                    <div style={S.matrixNameCell}>
                      <button
                        type="button"
                        style={S.studentBtn}
                        onClick={() => openQuickView(row.studentId)}
                      >
                        {row.studentName}
                      </button>
                      <div style={{ ...S.row, marginTop: 6 }}>
                        <span
                          style={{
                            ...S.chip,
                            background: attentionTone(row.attentionStatus).bg,
                            borderColor: attentionTone(row.attentionStatus).bd,
                            color: attentionTone(row.attentionStatus).fg,
                          }}
                        >
                          {row.attentionStatus}
                        </span>
                        {row.isILP ? <span style={S.chipMuted}>ILP</span> : null}
                        {row.invisibleRisk ? <span style={S.chipMuted}>Invisible risk</span> : null}
                        <span style={S.chipMuted}>{row.forecastRisk}</span>
                        {row.authorityFragile ? <span style={S.chipMuted}>Authority fragile</span> : null}
                      </div>
                      <div style={{ marginTop: 6, color: "#64748b", fontSize: 12, fontWeight: 800, lineHeight: 1.35 }}>
                        {clip(row.nextAction, 70)}
                      </div>
                    </div>

                    {areas.map((area) => {
                      const cell = row.cells.find((c) => c.area === area)!;
                      const tone = cellTone(cell.status);
                      return (
                        <button
                          key={`${row.studentId}-${area}`}
                          type="button"
                          onClick={() => openQuickView(row.studentId)}
                          style={{
                            ...S.matrixCell,
                            background: tone.bg,
                            borderColor: tone.bd,
                            color: tone.fg,
                          }}
                          title={`${row.studentName} • ${area} • ${cell.status}`}
                        >
                          <div style={{ fontSize: 12, fontWeight: 950 }}>{cell.status}</div>
                          <div style={{ marginTop: 4, fontSize: 11, fontWeight: 800 }}>
                            {cell.count} entries
                          </div>
                          <div style={{ marginTop: 2, fontSize: 11, fontWeight: 800 }}>
                            {cell.freshCount} fresh
                          </div>
                          <div style={{ marginTop: 2, fontSize: 11, fontWeight: 800 }}>
                            {isoShort(cell.lastSeenAt)}
                          </div>
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        </section>

        <StudentQuickViewDrawer
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          studentId={quickViewStudentId}
          returnTo="/admin/leadership/heatmap"
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
    maxWidth: 1660,
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
    gridTemplateColumns: "1fr 1fr 0.9fr auto",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(150px, 1fr))",
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

  studentBtn: {
    border: "none",
    background: "transparent",
    color: "#0f172a",
    fontWeight: 950,
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
  } as React.CSSProperties,

  matrixWrap: {
    marginTop: 12,
    overflowX: "auto",
  } as React.CSSProperties,

  matrixTable: {
    minWidth: 1200,
    display: "grid",
    gridTemplateColumns: "320px repeat(6, minmax(130px, 1fr))",
    gap: 10,
    alignItems: "stretch",
  } as React.CSSProperties,

  matrixHeaderName: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    padding: "8px 4px",
  } as React.CSSProperties,

  matrixHeaderCell: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    padding: "8px 4px",
    textAlign: "center",
  } as React.CSSProperties,

  matrixNameCell: {
    border: "1px solid #e8eaf0",
    borderRadius: 14,
    background: "#fff",
    padding: 12,
  } as React.CSSProperties,

  matrixCell: {
    border: "1px solid #e8eaf0",
    borderRadius: 14,
    padding: 12,
    textAlign: "center",
    cursor: "pointer",
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