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

type ReportPresetKey =
  | "reporting"
  | "conference"
  | "moderation"
  | "parent"
  | "homeschool";

type ReportPreset = {
  key: ReportPresetKey;
  label: string;
  description: string;
  accent: string;
  bg: string;
  border: string;
  text: string;
  filters: {
    showOnlyNotReady: boolean;
    showOnlyAttention: boolean;
    sortMode: "risk" | "name" | "coverage" | "conference";
    maxRows: number;
    audience: "school" | "family" | "authority";
    emphasizeCoverage: boolean;
    emphasizeConference: boolean;
  };
};

type ReportingStudentRow = {
  studentId: string;
  classId: string | null;
  studentName: string;
  isILP: boolean;
  attentionStatus: "Ready" | "Watch" | "Attention";
  nextAction: string;
  evidenceCount30d: number;
  totalEvidenceCount: number;
  openInterventions: number;
  overdueReviews: number;
  lastEvidenceAt: string | null;
  lastEvidenceDays: number | null;
  coverageAreas: string[];
  freshCoverageAreas: string[];
  coveragePct: number;
  narrativeScore: number;
  readinessScore: number;
  reportConfidence:
    | "Export-ready"
    | "Almost ready"
    | "Needs narrative"
    | "Needs evidence"
    | "Needs coverage"
    | "Not ready";
  conferencePriority: number;
};

type AlertRow = {
  id: string;
  text: string;
  tone: "good" | "watch" | "danger" | "info";
};

type DeliverableCard = {
  title: string;
  description: string;
  status: "ready" | "watch" | "planned";
};

type CoverageRow = {
  label: string;
  studentCoveragePct: number;
  freshCoveragePct: number;
  entries: number;
  freshEntries: number;
};

type ConferenceBrief = {
  studentId: string;
  studentName: string;
  strengths: string[];
  concerns: string[];
  action: string;
  confidence: ReportingStudentRow["reportConfidence"];
};

/* ───────────────────────── PRESETS ───────────────────────── */

const REPORT_PRESETS: ReportPreset[] = [
  {
    key: "reporting",
    label: "Reporting Season",
    description: "Evidence gaps, confidence levels, and reporting readiness by student.",
    accent: "#c2410c",
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#9a3412",
    filters: {
      showOnlyNotReady: false,
      showOnlyAttention: false,
      sortMode: "risk",
      maxRows: 16,
      audience: "school",
      emphasizeCoverage: true,
      emphasizeConference: true,
    },
  },
  {
    key: "conference",
    label: "Conference Prep",
    description: "Surface speaking points, parent conversation priorities, and follow-up actions.",
    accent: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    text: "#5b21b6",
    filters: {
      showOnlyNotReady: false,
      showOnlyAttention: false,
      sortMode: "conference",
      maxRows: 12,
      audience: "family",
      emphasizeCoverage: false,
      emphasizeConference: true,
    },
  },
  {
    key: "moderation",
    label: "Moderation",
    description: "Focus on breadth, freshness, and consistency of evidence before moderation.",
    accent: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
    filters: {
      showOnlyNotReady: true,
      showOnlyAttention: false,
      sortMode: "coverage",
      maxRows: 16,
      audience: "school",
      emphasizeCoverage: true,
      emphasizeConference: false,
    },
  },
  {
    key: "parent",
    label: "Parent Summary",
    description: "A calmer family-facing lens for confidence, strengths, and next steps.",
    accent: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
    text: "#0c4a6e",
    filters: {
      showOnlyNotReady: false,
      showOnlyAttention: false,
      sortMode: "name",
      maxRows: 12,
      audience: "family",
      emphasizeCoverage: false,
      emphasizeConference: true,
    },
  },
  {
    key: "homeschool",
    label: "Homeschool Audit",
    description: "Whole-child evidence and portfolio readiness for authority-style reporting.",
    accent: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    text: "#166534",
    filters: {
      showOnlyNotReady: true,
      showOnlyAttention: false,
      sortMode: "coverage",
      maxRows: 16,
      audience: "authority",
      emphasizeCoverage: true,
      emphasizeConference: true,
    },
  },
];

function getPreset(key: string | null | undefined) {
  return REPORT_PRESETS.find((p) => p.key === key) ?? REPORT_PRESETS[0];
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

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = safe(s.surname || s.family_name || s.last_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Student";
}

function isClosedStatus(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return ["closed", "done", "resolved", "archived", "completed"].includes(s);
}

function isPausedStatus(status: string | null | undefined) {
  return safe(status).toLowerCase() === "paused";
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

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

function guessArea(raw: string | null | undefined) {
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

function alertToneStyle(tone: AlertRow["tone"]): React.CSSProperties {
  if (tone === "danger") {
    return { borderColor: "#fecaca", background: "#fff1f2", color: "#9f1239" };
  }
  if (tone === "watch") {
    return { borderColor: "#fde68a", background: "#fffbeb", color: "#92400e" };
  }
  if (tone === "info") {
    return { borderColor: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" };
  }
  return { borderColor: "#bbf7d0", background: "#ecfdf5", color: "#166534" };
}

function statusTone(status: ReportingStudentRow["reportConfidence"]) {
  if (status === "Export-ready") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (status === "Almost ready") return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
  if (status === "Needs narrative") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  if (status === "Needs evidence") return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
  if (status === "Needs coverage") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#f8fafc", bd: "#e2e8f0", fg: "#475569" };
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function ReportingCentrePage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentOverviewRows, setStudentOverviewRows] = useState<StudentProfileOverviewRow[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  const [classId, setClassId] = useState("all");
  const [searchStudent, setSearchStudent] = useState("");
  const [activePresetKey, setActivePresetKey] = useState<ReportPresetKey>("reporting");

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
        .limit(3000);

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
        .limit(2500);

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
        ? window.localStorage.getItem("edudecks.reporting.preset.v1")
        : null;
    const preset = getPreset(stored);
    setActivePresetKey(preset.key);
    loadAll();
  }, []);

  function applyPreset(key: ReportPresetKey) {
    setActivePresetKey(key);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("edudecks.reporting.preset.v1", key);
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

  const scopedStudentIds = useMemo(() => {
    return students
      .filter((s) => classId === "all" || safe(s.class_id) === classId)
      .map((s) => s.id);
  }, [students, classId]);

  const reportingRows = useMemo<ReportingStudentRow[]>(() => {
    return scopedStudentIds.map((studentId) => {
      const s = studentMap.get(studentId);
      const o = overviewMap.get(studentId);
      const evidenceList = evidenceMap.get(studentId) ?? [];
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

      const totalEvidenceCount = evidenceList.length;
      const lastEvidenceAt =
        o?.last_evidence_at ||
        evidenceList[0]?.occurred_on ||
        evidenceList[0]?.created_at ||
        null;

      const lastEvidenceDays = daysSince(lastEvidenceAt);

      const evidenceCount30d =
        Number(o?.evidence_count_30d ?? 0) ||
        evidenceList.filter((e) => {
          const d = daysSince(e.occurred_on || e.created_at);
          return d != null && d <= 30;
        }).length;

      const areasPresent = Array.from(
        new Set(evidenceList.map((e) => guessArea(e.learning_area)).filter(Boolean))
      );
      const freshAreasPresent = Array.from(
        new Set(
          evidenceList
            .filter((e) => {
              const d = daysSince(e.occurred_on || e.created_at);
              return d != null && d <= 30;
            })
            .map((e) => guessArea(e.learning_area))
            .filter(Boolean)
        )
      );

      const coveragePct = percent(areasPresent.length, 5);

      const narrativeScore =
        Math.min(40, evidenceList.filter((e) => safe(e.summary) || safe(e.body)).length * 10) +
        (lastEvidenceDays != null && lastEvidenceDays <= 30 ? 15 : 0) +
        Math.min(15, freshAreasPresent.length * 3);

      let readinessScore =
        Math.min(35, totalEvidenceCount * 4) +
        Math.min(20, freshAreasPresent.length * 4) +
        Math.min(20, narrativeScore) +
        (lastEvidenceDays != null && lastEvidenceDays <= 30 ? 10 : 0) -
        overdueReviews.length * 8 -
        (evidenceCount30d === 0 ? 15 : 0);

      readinessScore = Math.max(0, Math.min(100, readinessScore));

      let reportConfidence: ReportingStudentRow["reportConfidence"] = "Not ready";
      if (readinessScore >= 82 && coveragePct >= 60 && narrativeScore >= 22) {
        reportConfidence = "Export-ready";
      } else if (readinessScore >= 68 && coveragePct >= 50) {
        reportConfidence = "Almost ready";
      } else if (totalEvidenceCount === 0 || evidenceCount30d === 0) {
        reportConfidence = "Needs evidence";
      } else if (coveragePct < 40) {
        reportConfidence = "Needs coverage";
      } else if (narrativeScore < 20) {
        reportConfidence = "Needs narrative";
      }

      const attentionStatus =
        safe(o?.attention_status) === "Attention"
          ? "Attention"
          : safe(o?.attention_status) === "Watch"
          ? "Watch"
          : "Ready";

      const conferencePriority =
        overdueReviews.length * 12 +
        (reportConfidence === "Needs evidence" ? 24 : 0) +
        (reportConfidence === "Needs coverage" ? 16 : 0) +
        (attentionStatus === "Attention" ? 14 : 0) +
        (lastEvidenceDays != null && lastEvidenceDays > 30 ? 10 : 0);

      const nextAction =
        safe(o?.next_action) ||
        (reportConfidence === "Needs evidence"
          ? "Capture fresh evidence before writing."
          : reportConfidence === "Needs coverage"
          ? "Broaden evidence across learning areas."
          : reportConfidence === "Needs narrative"
          ? "Strengthen narrative comments and examples."
          : overdueReviews.length > 0
          ? "Resolve overdue support reviews."
          : "Prepare reporting summary.");

      return {
        studentId,
        classId: s?.class_id ?? o?.class_id ?? null,
        studentName: safe(o?.student_name) || studentDisplayName(s),
        isILP: !!(o?.is_ilp ?? s?.is_ilp),
        attentionStatus,
        nextAction,
        evidenceCount30d,
        totalEvidenceCount,
        openInterventions:
          Number(o?.open_interventions_count ?? activeInterventions.length) ||
          activeInterventions.length,
        overdueReviews:
          Number(o?.overdue_reviews_count ?? overdueReviews.length) ||
          overdueReviews.length,
        lastEvidenceAt,
        lastEvidenceDays,
        coverageAreas: areasPresent,
        freshCoverageAreas: freshAreasPresent,
        coveragePct,
        narrativeScore,
        readinessScore,
        reportConfidence,
        conferencePriority,
      };
    });
  }, [scopedStudentIds, studentMap, overviewMap, evidenceMap, interventionMap]);

  const filteredReportingRows = useMemo(() => {
    let rows = [...reportingRows];

    const q = safe(searchStudent).toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.studentName.toLowerCase().includes(q));
    }

    if (activePreset.filters.showOnlyNotReady) {
      rows = rows.filter(
        (r) => r.reportConfidence !== "Export-ready" && r.reportConfidence !== "Almost ready"
      );
    }

    if (activePreset.filters.showOnlyAttention) {
      rows = rows.filter(
        (r) => r.attentionStatus === "Attention" || r.overdueReviews > 0
      );
    }

    if (activePreset.filters.sortMode === "name") {
      rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
    } else if (activePreset.filters.sortMode === "coverage") {
      rows.sort((a, b) => a.coveragePct - b.coveragePct || a.readinessScore - b.readinessScore);
    } else if (activePreset.filters.sortMode === "conference") {
      rows.sort((a, b) => b.conferencePriority - a.conferencePriority);
    } else {
      rows.sort((a, b) => {
        const aRisk = 100 - a.readinessScore + a.overdueReviews * 6;
        const bRisk = 100 - b.readinessScore + b.overdueReviews * 6;
        return bRisk - aRisk;
      });
    }

    return rows.slice(0, activePreset.filters.maxRows);
  }, [reportingRows, activePreset, searchStudent]);

  const alerts = useMemo<AlertRow[]>(() => {
    const needsEvidence = reportingRows.filter((r) => r.reportConfidence === "Needs evidence").length;
    const needsCoverage = reportingRows.filter((r) => r.reportConfidence === "Needs coverage").length;
    const needsNarrative = reportingRows.filter((r) => r.reportConfidence === "Needs narrative").length;
    const overdue = reportingRows.reduce((sum, r) => sum + r.overdueReviews, 0);

    const items: AlertRow[] = [];

    if (needsEvidence > 0) {
      items.push({
        id: "evidence",
        text: `${needsEvidence} students need fresh evidence before confident reporting.`,
        tone: "danger",
      });
    }

    if (needsCoverage > 0) {
      items.push({
        id: "coverage",
        text: `${needsCoverage} students show weak evidence spread across learning areas.`,
        tone: "watch",
      });
    }

    if (needsNarrative > 0) {
      items.push({
        id: "narrative",
        text: `${needsNarrative} students need stronger narrative reporting material.`,
        tone: "info",
      });
    }

    if (overdue > 0) {
      items.push({
        id: "overdue",
        text: `${overdue} overdue reviews may weaken reporting confidence.`,
        tone: "danger",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "clear",
        text: "Reporting surface is calm right now. Maintain freshness and refine final comments.",
        tone: "good",
      });
    }

    return items;
  }, [reportingRows]);

  const summaryMetrics = useMemo(() => {
    const ready = reportingRows.filter((r) => r.reportConfidence === "Export-ready").length;
    const almost = reportingRows.filter((r) => r.reportConfidence === "Almost ready").length;
    const needsAction = reportingRows.filter(
      (r) => r.reportConfidence !== "Export-ready" && r.reportConfidence !== "Almost ready"
    ).length;
    const avgCoverage = Math.round(
      reportingRows.reduce((sum, r) => sum + r.coveragePct, 0) / Math.max(1, reportingRows.length)
    );
    const avgReadiness = Math.round(
      reportingRows.reduce((sum, r) => sum + r.readinessScore, 0) / Math.max(1, reportingRows.length)
    );

    return { ready, almost, needsAction, avgCoverage, avgReadiness };
  }, [reportingRows]);

  const deliverables = useMemo<DeliverableCard[]>(() => {
    return [
      {
        title: "Student narrative summaries",
        description:
          activePreset.filters.audience === "family"
            ? "Calmer parent-facing summaries with strengths and next steps."
            : "Teacher-facing narrative comments supported by evidence freshness and breadth.",
        status: summaryMetrics.avgReadiness >= 75 ? "ready" : summaryMetrics.avgReadiness >= 55 ? "watch" : "planned",
      },
      {
        title: "Conference brief pack",
        description:
          "A fast speaking-point layer for interviews, discussions, and follow-up conversations.",
        status: activePreset.filters.emphasizeConference ? "ready" : "watch",
      },
      {
        title: "Coverage moderation snapshot",
        description:
          "Quick view of where reporting confidence is strong, thin, or under-evidenced.",
        status: activePreset.filters.emphasizeCoverage ? "ready" : "watch",
      },
      {
        title: "Portfolio / export bundle",
        description:
          activePreset.filters.audience === "authority"
            ? "Authority-style bundle with broader whole-child evidence readiness."
            : "Printable/exportable student evidence bundle for school or family use.",
        status: summaryMetrics.ready > 0 ? "watch" : "planned",
      },
    ];
  }, [summaryMetrics, activePreset]);

  const coverageRows = useMemo<CoverageRow[]>(() => {
    const labels = ["Literacy", "Maths", "Science", "Wellbeing", "Humanities", "Other"];

    return labels.map((label) => {
      const entries = evidenceEntries.filter((e) => guessArea(e.learning_area) === label);
      const fresh = entries.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d <= 30;
      });

      const studentsCovered = new Set(
        entries
          .filter((e) => classId === "all" || safe(e.class_id) === classId)
          .map((e) => safe(e.student_id))
          .filter(Boolean)
      ).size;

      const studentsFreshCovered = new Set(
        fresh
          .filter((e) => classId === "all" || safe(e.class_id) === classId)
          .map((e) => safe(e.student_id))
          .filter(Boolean)
      ).size;

      const studentCount = Math.max(
        1,
        students.filter((s) => classId === "all" || safe(s.class_id) === classId).length
      );

      return {
        label,
        studentCoveragePct: percent(studentsCovered, studentCount),
        freshCoveragePct: percent(studentsFreshCovered, studentCount),
        entries: entries.filter((e) => classId === "all" || safe(e.class_id) === classId).length,
        freshEntries: fresh.filter((e) => classId === "all" || safe(e.class_id) === classId).length,
      };
    });
  }, [evidenceEntries, students, classId]);

  const conferenceBriefs = useMemo<ConferenceBrief[]>(() => {
    return filteredReportingRows.slice(0, 6).map((row) => {
      const strengths: string[] = [];
      const concerns: string[] = [];

      if (row.evidenceCount30d >= 2) strengths.push("Recent evidence is active.");
      if (row.coveragePct >= 60) strengths.push("Evidence breadth is healthy.");
      if (row.readinessScore >= 70) strengths.push("Reporting confidence is building well.");

      if (row.reportConfidence === "Needs evidence") concerns.push("Fresh evidence is too thin.");
      if (row.reportConfidence === "Needs coverage") concerns.push("Coverage breadth is narrow.");
      if (row.reportConfidence === "Needs narrative") concerns.push("Narrative examples need strengthening.");
      if (row.overdueReviews > 0) concerns.push("Support review remains overdue.");

      return {
        studentId: row.studentId,
        studentName: row.studentName,
        strengths: strengths.slice(0, 2),
        concerns: concerns.slice(0, 2),
        action: row.nextAction,
        confidence: row.reportConfidence,
      };
    });
  }, [filteredReportingRows]);

  function exportCsv() {
    const headers = [
      "Student",
      "Class",
      "Attention",
      "Confidence",
      "Coverage %",
      "Readiness Score",
      "Evidence 30d",
      "Total Evidence",
      "Open Interventions",
      "Overdue Reviews",
      "Last Evidence",
      "Next Action",
    ];

    const lines = [headers.join(",")];

    filteredReportingRows.forEach((row) => {
      const cls = classMap.get(safe(row.classId));
      lines.push(
        [
          csvEscape(row.studentName),
          csvEscape([safe(cls?.name), fmtYear(cls?.year_level)].filter(Boolean).join(" • ")),
          csvEscape(row.attentionStatus),
          csvEscape(row.reportConfidence),
          csvEscape(row.coveragePct),
          csvEscape(row.readinessScore),
          csvEscape(row.evidenceCount30d),
          csvEscape(row.totalEvidenceCount),
          csvEscape(row.openInterventions),
          csvEscape(row.overdueReviews),
          csvEscape(isoShort(row.lastEvidenceAt)),
          csvEscape(row.nextAction),
        ].join(",")
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporting-centre-export.csv";
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
              <div style={S.subtle}>Reporting Readiness Surface</div>
              <div style={S.h1}>Reporting Centre</div>
              <div style={S.sub}>
                Polished command layer for reporting confidence, conference preparation,
                moderation pressure, and export readiness.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={S.btn} onClick={() => router.push("/admin/command-centre")}>
                Command Centre
              </button>
              <button type="button" style={S.btn} onClick={() => router.push("/admin/leadership/heatmap")}>
                Leadership Heatmap
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
                  Saved Views / Reporting Presets
                </div>
                <div style={S.sectionHelp}>
                  Switch reporting modes instantly without changing route.
                </div>
              </div>

              <button type="button" style={S.btn} onClick={() => applyPreset("reporting")}>
                Reset to Reporting
              </button>
            </div>

            <div style={{ ...S.row, marginTop: 12 }}>
              {REPORT_PRESETS.map((preset) => {
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
                <span style={S.chipMuted}>audience: {activePreset.filters.audience}</span>
                <span style={S.chipMuted}>
                  notReadyOnly: {String(activePreset.filters.showOnlyNotReady)}
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

            <div style={{ display: "flex", alignItems: "end" }}>
              <button type="button" style={S.btn} onClick={loadAll}>
                Refresh
              </button>
            </div>
          </div>

          <div style={S.tiles}>
            <div style={S.tile}>
              <div style={S.tileK}>Export-ready</div>
              <div style={S.tileV}>{summaryMetrics.ready}</div>
              <div style={S.tileS}>Students already strong enough for confident export/report use.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Almost Ready</div>
              <div style={S.tileV}>{summaryMetrics.almost}</div>
              <div style={S.tileS}>Students close to ready with only light polishing needed.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Needs Action</div>
              <div style={S.tileV}>{summaryMetrics.needsAction}</div>
              <div style={S.tileS}>Students requiring evidence, coverage, or narrative improvement.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Avg Coverage</div>
              <div style={S.tileV}>{summaryMetrics.avgCoverage}%</div>
              <div style={S.tileS}>Average breadth of evidence across reporting areas.</div>
            </div>

            <div style={S.tile}>
              <div style={S.tileK}>Avg Readiness</div>
              <div style={S.tileV}>{summaryMetrics.avgReadiness}</div>
              <div style={S.tileS}>Composite readiness score across the current scope.</div>
            </div>
          </div>
        </section>

        {busy ? <div style={S.ok}>Refreshing reporting centre data…</div> : null}
        {err ? <div style={S.err}>{err}</div> : null}

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Reporting Alerts</div>
            <div style={S.sectionHelp}>
              High-signal readiness cues for writing, moderation, and follow-up.
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
            <div style={S.sectionTitle}>Deliverables Queue</div>
            <div style={S.sectionHelp}>
              What the reporting layer is best positioned to generate right now.
            </div>

            <div style={S.list}>
              {deliverables.map((item) => (
                <div key={item.title} style={S.item}>
                  <div style={{ ...S.row, justifyContent: "space-between" }}>
                    <div style={S.itemTitle}>{item.title}</div>
                    <span
                      style={{
                        ...S.chipMuted,
                        color:
                          item.status === "ready"
                            ? "#166534"
                            : item.status === "watch"
                            ? "#92400e"
                            : "#475569",
                      }}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={S.itemText}>{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={S.grid2}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Priority Reporting Queue</div>
            <div style={S.sectionHelp}>
              Students sorted by the active reporting lens rather than one static rule.
            </div>

            <div style={S.list}>
              {filteredReportingRows.length === 0 ? (
                <div style={S.empty}>No students match the current reporting preset and filters.</div>
              ) : (
                filteredReportingRows.map((row) => {
                  const tone = statusTone(row.reportConfidence);
                  const cls = classMap.get(safe(row.classId));

                  return (
                    <div key={row.studentId} style={S.item}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.2fr auto",
                          gap: 10,
                          alignItems: "start",
                        }}
                      >
                        <div>
                          <button
                            type="button"
                            style={S.studentBtn}
                            onClick={() => openQuickView(row.studentId)}
                          >
                            {row.studentName}
                          </button>

                          <div style={{ ...S.row, marginTop: 8 }}>
                            <span
                              style={{
                                ...S.chip,
                                background: tone.bg,
                                borderColor: tone.bd,
                                color: tone.fg,
                              }}
                            >
                              {row.reportConfidence}
                            </span>
                            <span style={S.chipMuted}>
                              {[safe(cls?.name), fmtYear(cls?.year_level)].filter(Boolean).join(" • ") || "Class"}
                            </span>
                            {row.isILP ? <span style={S.chipMuted}>ILP</span> : null}
                          </div>

                          <div style={S.itemText}>{row.nextAction}</div>

                          <div style={{ ...S.row, marginTop: 8 }}>
                            <span style={S.chipMuted}>readiness: {row.readinessScore}</span>
                            <span style={S.chipMuted}>coverage: {row.coveragePct}%</span>
                            <span style={S.chipMuted}>30d evidence: {row.evidenceCount30d}</span>
                            <span style={S.chipMuted}>overdue reviews: {row.overdueReviews}</span>
                            <span style={S.chipMuted}>
                              last evidence: {row.lastEvidenceDays == null ? "—" : `${row.lastEvidenceDays}d`}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            style={S.btn}
                            onClick={() => openQuickView(row.studentId)}
                          >
                            Quick View
                          </button>
                          <button
                            type="button"
                            style={S.btn}
                            onClick={() => router.push("/admin/command-centre")}
                          >
                            Open Command
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>
              {activePreset.filters.emphasizeCoverage ? "Coverage Readiness" : "Coverage Snapshot"}
            </div>
            <div style={S.sectionHelp}>
              Breadth and freshness across common reporting areas.
            </div>

            <div style={S.list}>
              {coverageRows.map((row) => (
                <div key={row.label} style={S.item}>
                  <div style={{ ...S.row, justifyContent: "space-between" }}>
                    <div style={S.itemTitle}>{row.label}</div>
                    <span style={S.chipMuted}>entries {row.entries}</span>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={S.coverageRow}>
                      <div style={S.coverageLabel}>Student coverage</div>
                      <div style={S.barBg}>
                        <div
                          style={{
                            ...S.barFill,
                            width: `${row.studentCoveragePct}%`,
                          }}
                        />
                      </div>
                      <div style={S.coveragePct}>{row.studentCoveragePct}%</div>
                    </div>

                    <div style={{ ...S.coverageRow, marginTop: 8 }}>
                      <div style={S.coverageLabel}>Fresh coverage</div>
                      <div style={S.barBg}>
                        <div
                          style={{
                            ...S.barFill,
                            width: `${row.freshCoveragePct}%`,
                            background: "#2563eb",
                          }}
                        />
                      </div>
                      <div style={S.coveragePct}>{row.freshCoveragePct}%</div>
                    </div>
                  </div>

                  <div style={{ ...S.row, marginTop: 8 }}>
                    <span style={S.chipMuted}>fresh entries: {row.freshEntries}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={S.grid2Equal}>
          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>
              {activePreset.filters.emphasizeConference ? "Conference Brief Cards" : "Brief Cards"}
            </div>
            <div style={S.sectionHelp}>
              Fast speaking points for parent meetings, conferences, and reporting conversations.
            </div>

            <div style={S.list}>
              {conferenceBriefs.length === 0 ? (
                <div style={S.empty}>No conference briefs are available in the current scope.</div>
              ) : (
                conferenceBriefs.map((brief) => (
                  <div key={brief.studentId} style={S.noteBox}>
                    <div style={S.itemTitle}>{brief.studentName}</div>

                    <div style={{ marginTop: 8 }}>
                      <span
                        style={{
                          ...S.chip,
                          background: statusTone(brief.confidence).bg,
                          borderColor: statusTone(brief.confidence).bd,
                          color: statusTone(brief.confidence).fg,
                        }}
                      >
                        {brief.confidence}
                      </span>
                    </div>

                    <div style={{ marginTop: 10, color: "#166534", fontWeight: 900 }}>
                      Strengths
                    </div>
                    <div style={{ marginTop: 4, color: "#475569", fontWeight: 800, lineHeight: 1.45 }}>
                      {brief.strengths.length ? brief.strengths.join(" ") : "No strong strengths surfaced yet."}
                    </div>

                    <div style={{ marginTop: 8, color: "#9f1239", fontWeight: 900 }}>
                      Concerns
                    </div>
                    <div style={{ marginTop: 4, color: "#475569", fontWeight: 800, lineHeight: 1.45 }}>
                      {brief.concerns.length ? brief.concerns.join(" ") : "No major concerns surfaced."}
                    </div>

                    <div style={{ marginTop: 8, color: "#1d4ed8", fontWeight: 900 }}>
                      Next action
                    </div>
                    <div style={{ marginTop: 4, color: "#475569", fontWeight: 800, lineHeight: 1.45 }}>
                      {brief.action}
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        style={S.btn}
                        onClick={() => openQuickView(brief.studentId)}
                      >
                        Open quick view
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ ...S.card, ...S.sectionPad }}>
            <div style={S.sectionTitle}>Reporting Workflow Shortcuts</div>
            <div style={S.sectionHelp}>
              Quick routing between reporting, teaching, and leadership surfaces.
            </div>

            <div style={S.list}>
              <div style={S.item}>
                <div style={S.itemTitle}>Open Command Centre</div>
                <div style={S.itemText}>
                  Return to the teacher action layer for fresh evidence and next-step routing.
                </div>
                <div style={{ marginTop: 8 }}>
                  <button type="button" style={S.btn} onClick={() => router.push("/admin/command-centre")}>
                    Open command centre
                  </button>
                </div>
              </div>

              <div style={S.item}>
                <div style={S.itemTitle}>Open Leadership Heatmap</div>
                <div style={S.itemText}>
                  Switch to the strategic radar view for patterns, visibility, and hotspots.
                </div>
                <div style={{ marginTop: 8 }}>
                  <button type="button" style={S.btn} onClick={() => router.push("/admin/leadership/heatmap")}>
                    Open heatmap
                  </button>
                </div>
              </div>

              <div style={S.item}>
                <div style={S.itemTitle}>Open Evidence Entry</div>
                <div style={S.itemText}>
                  Capture the missing evidence that will lift reporting confidence fastest.
                </div>
                <div style={{ marginTop: 8 }}>
                  <button type="button" style={S.btn} onClick={() => router.push("/admin/evidence-entry")}>
                    Open evidence entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <StudentQuickViewDrawer
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          studentId={quickViewStudentId}
          returnTo="/admin/reporting"
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
    maxWidth: 1560,
    margin: "0 auto",
    padding: 22,
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 24,
    background: "linear-gradient(135deg, rgba(17,24,39,0.08), rgba(234,88,12,0.10))",
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
    gridTemplateColumns: "1fr 1fr auto",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  tiles: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(150px, 1fr))",
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

  grid2Equal: {
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

  coverageRow: {
    display: "grid",
    gridTemplateColumns: "110px 1fr 56px",
    gap: 10,
    alignItems: "center",
  } as React.CSSProperties,

  coverageLabel: {
    fontWeight: 900,
    color: "#475569",
    fontSize: 12,
  } as React.CSSProperties,

  coveragePct: {
    fontWeight: 950,
    color: "#0f172a",
    textAlign: "right",
    fontSize: 12,
  } as React.CSSProperties,

  barBg: {
    width: "100%",
    height: 11,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
  } as React.CSSProperties,

  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "#ea580c",
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

  noteBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    background: "#fafafa",
  } as React.CSSProperties,
};