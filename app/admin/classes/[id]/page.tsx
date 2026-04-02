"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentQuickOpen from "@/app/admin/components/StudentQuickOpen";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type TabKey =
  | "overview"
  | "students"
  | "evidence"
  | "interventions"
  | "coverage";

type SectionVisibility = {
  nextActions: boolean;
  studentList: boolean;
  evidenceFeed: boolean;
  interventions: boolean;
  coverage: boolean;
};

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
  first_name: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id: string | null;
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
  student_id: string | null;
  class_id: string | null;
  title?: string | null;
  notes?: string | null;
  note?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: any;
  strategy?: string | null;
  kind?: string | null;
  due_on?: string | null;
  next_review_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: any;
};

type StudentProfileOverviewRow = {
  student_id: string;
  class_id: string | null;
  student_name: string | null;
  is_ilp: boolean | null;
  last_evidence_at: string | null;
  open_interventions_count: number | null;
  overdue_reviews_count: number | null;
  evidence_count_30d: number | null;
  attention_status: "Ready" | "Watch" | "Attention" | string | null;
  next_action: string | null;
  [k: string]: any;
};

type ClassHealthRow = {
  class_id: string;
  student_count: number | null;
  ilp_count: number | null;
  evidence_count_30d: number | null;
  students_without_recent_evidence: number | null;
  open_interventions_count: number | null;
  overdue_interventions_count: number | null;
  last_evidence_at: string | null;
  [k: string]: any;
};

type StudentMissionRow = {
  student: StudentRow;
  overview: StudentProfileOverviewRow | null;
  evidence: EvidenceRow[];
  interventions: InterventionRow[];
  studentName: string;
  lastEvidenceDays: number | null;
  evidence30d: number;
  evidencePrev30d: number;
  evidenceMomentumDelta: number;
  openInterventions: number;
  overdueReviews: number;
  dueSoonReviews: number;
  missingAreaCount: number;
  missingAreas: string[];
  narrativeCount: number;
  invisibleRisk: boolean;
  reportingFragile: boolean;
  authorityFragile: boolean;
  forecastRisk: "Stable" | "Watch" | "Escalating";
  heatScore: number;
  recommendedAction:
    | "Capture evidence"
    | "Review intervention"
    | "Prepare report"
    | "Conference needed"
    | "Escalate support"
    | "Monitor";
};

type ActionItem = {
  id: string;
  title: string;
  text: string;
  tone: "good" | "watch" | "danger" | "info";
  studentId?: string;
  href?: string;
};

type ActivityItem = {
  key: string;
  when: string;
  kind: "Evidence" | "Intervention";
  title: string;
  body: string;
  studentId?: string | null;
};

type CoverageAreaRow = {
  area: string;
  totalEntries: number;
  freshEntries: number;
  studentCoveragePct: number;
  gapStudents: number;
  watchStudents: number;
  strongStudents: number;
};

type BenchmarkPosition = "Above" | "Near" | "Below";

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function toDate(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function isoShort(v: string | null | undefined) {
  const d = toDate(v);
  if (!d) return "—";
  return d.toISOString().slice(0, 10);
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function daysSince(v: string | null | undefined) {
  const d = toDate(v);
  if (!d) return null;
  const now = new Date();
  return Math.max(
    0,
    Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function daysUntil(v: string | null | undefined) {
  const d = toDate(v);
  if (!d) return null;
  const now = new Date();
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function dateSortValue(v: string | null | undefined) {
  return toDate(v)?.getTime() ?? 0;
}

function clip(text: string | null | undefined, max = 180) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function evidenceDate(e: EvidenceRow) {
  return safe(e.occurred_on) || safe(e.created_at);
}

function pickReviewDate(i: InterventionRow) {
  return (
    safe(i.review_due_on) ||
    safe(i.review_due_date) ||
    safe(i.next_review_on) ||
    safe(i.due_on) ||
    safe(i.created_at)
  );
}

function percent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function getTabValue(sp: URLSearchParams): TabKey {
  const raw = (sp.get("view") || sp.get("tab") || "overview").toLowerCase();
  if (raw === "students") return "students";
  if (raw === "evidence") return "evidence";
  if (raw === "interventions") return "interventions";
  if (raw === "coverage") return "coverage";
  return "overview";
}

function defaultVisibility(): SectionVisibility {
  return {
    nextActions: true,
    studentList: true,
    evidenceFeed: false,
    interventions: true,
    coverage: false,
  };
}

function studentName(
  s: StudentRow | null | undefined,
  o?: StudentProfileOverviewRow | null
) {
  if (safe(o?.student_name)) return safe(o?.student_name);
  if (!s) return "Student";
  const first = safe(s.preferred_name) || safe(s.first_name);
  const sur = safe(s.surname || s.family_name || s.last_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Student";
}

function statusTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (s === "attention")
    return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
  if (s === "watch") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
}

function interventionStatusTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (["closed", "done", "archived", "completed", "resolved"].includes(s)) {
    return { bg: "#f8fafc", bd: "#e2e8f0", fg: "#475569" };
  }
  if (s === "paused") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  if (s === "review") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
}

function reviewTone(daysLate: number | null) {
  if (daysLate == null)
    return { bg: "#f8fafc", bd: "#e2e8f0", fg: "#64748b", label: "No date" };
  if (daysLate > 0)
    return {
      bg: "#fff1f2",
      bd: "#fecaca",
      fg: "#9f1239",
      label: `${daysLate}d overdue`,
    };
  if (daysLate >= -7)
    return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e", label: "Due soon" };
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534", label: "On track" };
}

function heatTone(score: number) {
  if (score >= 80)
    return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239", label: "Critical" };
  if (score >= 55)
    return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e", label: "Watch" };
  if (score >= 30)
    return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8", label: "Track" };
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534", label: "Stable" };
}

function forecastTone(status: "Stable" | "Watch" | "Escalating") {
  if (status === "Stable")
    return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  if (status === "Watch")
    return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function authorityTone(status: "Strong" | "Watch" | "Fragile") {
  if (status === "Strong")
    return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  if (status === "Watch")
    return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function benchmarkPosition(avgRisk: number): BenchmarkPosition {
  if (avgRisk <= 25) return "Above";
  if (avgRisk <= 45) return "Near";
  return "Below";
}

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();
  if (x.includes("math")) return "Maths";
  if (
    x.includes("liter") ||
    x.includes("reading") ||
    x.includes("writing") ||
    x.includes("english")
  )
    return "Literacy";
  if (x.includes("science")) return "Science";
  if (
    x.includes("well") ||
    x.includes("pastoral") ||
    x.includes("social") ||
    x.includes("behaviour") ||
    x.includes("behavior")
  )
    return "Wellbeing";
  if (
    x.includes("human") ||
    x.includes("history") ||
    x.includes("geography") ||
    x.includes("hass")
  )
    return "Humanities";
  return "Other";
}

function isClosedStatus(status: string | null | undefined) {
  return ["closed", "done", "archived", "completed", "resolved"].includes(
    safe(status).toLowerCase()
  );
}

function isPausedStatus(status: string | null | undefined) {
  return safe(status).toLowerCase() === "paused";
}

function computeHeatScore(args: {
  lastEvidenceDays: number | null;
  openInterventions: number;
  overdueReviews: number;
  isIlp: boolean;
  attentionStatus: string;
  missingAreaCount: number;
  evidenceMomentumDelta: number;
  reportingFragile: boolean;
  authorityFragile: boolean;
}) {
  let score = 0;
  if (args.lastEvidenceDays == null) score += 35;
  else if (args.lastEvidenceDays > 60) score += 30;
  else if (args.lastEvidenceDays > 30) score += 18;
  else if (args.lastEvidenceDays > 14) score += 8;

  score += Math.min(24, args.openInterventions * 6);
  score += Math.min(30, args.overdueReviews * 15);
  if (args.isIlp) score += 8;
  if (safe(args.attentionStatus) === "Attention") score += 16;
  if (safe(args.attentionStatus) === "Watch") score += 8;
  score += Math.min(20, args.missingAreaCount * 5);
  if (args.evidenceMomentumDelta < 0) score += 10;
  if (args.reportingFragile) score += 12;
  if (args.authorityFragile) score += 12;
  return Math.max(0, Math.min(100, score));
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("column") || msg.includes("does not exist");
}

/* ───────────────────────── PAGE ───────────────────────── */

export default function AdminClassHubPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  const classId = safe(params?.id);

  const [tab, setTab] = useState<TabKey>("overview");
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<
    "all" | "attention" | "watch" | "invisible" | "reporting" | "authority"
  >("all");
  const [viewDensity, setViewDensity] = useState<"simple" | "detailed">(
    "detailed"
  );
  const [visibility, setVisibility] =
    useState<SectionVisibility>(defaultVisibility());

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [classOptions, setClassOptions] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [studentOverviewRows, setStudentOverviewRows] = useState<
    StudentProfileOverviewRow[]
  >([]);
  const [classHealth, setClassHealth] = useState<ClassHealthRow | null>(null);

  useEffect(() => {
    setTab(getTabValue(sp));
  }, [sp]);

  async function loadClassOptions() {
    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level,room",
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
        setClassOptions(((r.data as any[]) ?? []) as ClassRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setClassOptions([]);
  }

  async function loadClass() {
    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level,room",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("classes")
        .select(sel)
        .eq("id", classId)
        .maybeSingle();
      if (!r.error) {
        setKlass((r.data as any) ?? null);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setKlass(null);
  }

  async function loadStudents() {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,last_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp",
      "id,class_id,first_name,preferred_name,surname,is_ilp",
      "id,class_id,first_name,preferred_name,is_ilp",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("students")
        .select(sel)
        .eq("class_id", classId);
      if (!r.error) {
        setStudents(((r.data as any[]) ?? []) as StudentRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadEvidence() {
    const tries = [
      "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted",
      "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,is_deleted",
      "id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("evidence_entries")
        .select(sel)
        .eq("class_id", classId)
        .eq("is_deleted", false)
        .limit(12000);

      if (!r.error) {
        setEvidenceEntries(
          ((((r.data as any[]) ?? []) as EvidenceRow[]).sort(
            (a, b) =>
              dateSortValue(evidenceDate(b)) - dateSortValue(evidenceDate(a))
          ))
        );
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setEvidenceEntries([]);
  }

  async function loadInterventions() {
    const tries = [
      "id,student_id,class_id,title,notes,note,status,priority,tier,strategy,kind,due_on,next_review_on,review_due_on,review_due_date,created_at,updated_at",
      "id,student_id,class_id,title,notes,note,status,priority,tier,due_on,next_review_on,review_due_on,review_due_date,created_at",
      "*",
    ];

    for (const sel of tries) {
      const r = await supabase
        .from("interventions")
        .select(sel)
        .eq("class_id", classId)
        .limit(8000);
      if (!r.error) {
        setInterventions(((r.data as any[]) ?? []) as InterventionRow[]);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setInterventions([]);
  }

  async function loadStudentOverview() {
    const r = await supabase
      .from("v_student_profile_overview_v1")
      .select("*")
      .eq("class_id", classId);
    if (r.error) {
      if (isMissingColumnError(r.error)) {
        setStudentOverviewRows([]);
        return;
      }
      throw r.error;
    }
    setStudentOverviewRows(
      ((r.data as any[]) ?? []) as StudentProfileOverviewRow[]
    );
  }

  async function loadClassHealth() {
    const tries = [
      "*",
      "class_id,student_count,ilp_count,evidence_count_30d,students_without_recent_evidence,open_interventions_count,overdue_interventions_count,last_evidence_at",
    ];
    for (const sel of tries) {
      const r = await supabase
        .from("v_class_health_v1")
        .select(sel)
        .eq("class_id", classId)
        .maybeSingle();
      if (!r.error) {
        setClassHealth((r.data as any) ?? null);
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }
    setClassHealth(null);
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);
    try {
      await Promise.all([
        loadClassOptions(),
        loadClass(),
        loadStudents(),
        loadEvidence(),
        loadInterventions(),
        loadStudentOverview(),
        loadClassHealth(),
      ]);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!classId) return;
    loadAll();
  }, [classId]);

  const overviewMap = useMemo(() => {
    const map = new Map<string, StudentProfileOverviewRow>();
    studentOverviewRows.forEach((r) => map.set(r.student_id, r));
    return map;
  }, [studentOverviewRows]);

  const evidenceByStudent = useMemo(() => {
    const map = new Map<string, EvidenceRow[]>();
    evidenceEntries.forEach((e) => {
      const sid = safe(e.student_id);
      if (!sid) return;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(e);
    });
    return map;
  }, [evidenceEntries]);

  const interventionsByStudent = useMemo(() => {
    const map = new Map<string, InterventionRow[]>();
    interventions.forEach((i) => {
      const sid = safe(i.student_id);
      if (!sid) return;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(i);
    });
    return map;
  }, [interventions]);

  const areas = useMemo(
    () => ["Literacy", "Maths", "Science", "Wellbeing", "Humanities", "Other"],
    []
  );

  const missionRows = useMemo<StudentMissionRow[]>(() => {
    return students.map((student) => {
      const overview = overviewMap.get(student.id) ?? null;
      const evidence = (evidenceByStudent.get(student.id) ?? [])
        .slice()
        .sort(
          (a, b) =>
            dateSortValue(evidenceDate(b)) - dateSortValue(evidenceDate(a))
        );
      const studentInterventions = (
        interventionsByStudent.get(student.id) ?? []
      ).slice();

      const activeInterventions = studentInterventions.filter(
        (i) => !isClosedStatus(i.status) && !isPausedStatus(i.status)
      );
      const overdueReviews = activeInterventions.filter((i) => {
        const d = daysSince(pickReviewDate(i));
        return d != null && d > 0;
      }).length;
      const dueSoonReviews = activeInterventions.filter((i) => {
        const d = daysUntil(pickReviewDate(i));
        return d != null && d >= 0 && d <= 14;
      }).length;

      const lastEvidenceDays =
        daysSince(overview?.last_evidence_at) ??
        daysSince(evidenceDate(evidence[0]));

      const evidence30d =
        Number(overview?.evidence_count_30d ?? 0) ||
        evidence.filter((e) => {
          const d = daysSince(evidenceDate(e));
          return d != null && d <= 30;
        }).length;

      const evidencePrev30d = evidence.filter((e) => {
        const d = daysSince(evidenceDate(e));
        return d != null && d > 30 && d <= 60;
      }).length;

      const evidenceMomentumDelta = evidence30d - evidencePrev30d;

      const missingAreas = areas.filter((area) => {
        return (
          evidence.filter((e) => guessArea(e.learning_area) === area).length ===
          0
        );
      });

      const narrativeCount = evidence.filter(
        (e) => safe(e.summary) || safe(e.body)
      ).length;

      const invisibleRisk =
        evidence.length === 0 ||
        lastEvidenceDays == null ||
        lastEvidenceDays > 45;
      const reportingFragile =
        evidence30d === 0 ||
        lastEvidenceDays == null ||
        lastEvidenceDays > 30 ||
        missingAreas.length >= 2;

      const authorityFragile =
        reportingFragile ||
        narrativeCount < 2 ||
        overdueReviews > 0 ||
        invisibleRisk;

      let forecastRisk: StudentMissionRow["forecastRisk"] = "Stable";
      if (
        evidenceMomentumDelta < 0 ||
        dueSoonReviews >= 2 ||
        overdueReviews > 0 ||
        reportingFragile
      ) {
        forecastRisk = "Watch";
      }
      if (
        (safe(overview?.attention_status) === "Attention" &&
          evidenceMomentumDelta < 0) ||
        overdueReviews >= 2 ||
        invisibleRisk
      ) {
        forecastRisk = "Escalating";
      }

      const heatScore = computeHeatScore({
        lastEvidenceDays,
        openInterventions: activeInterventions.length,
        overdueReviews,
        isIlp: !!student.is_ilp,
        attentionStatus: safe(overview?.attention_status),
        missingAreaCount: missingAreas.length,
        evidenceMomentumDelta,
        reportingFragile,
        authorityFragile,
      });

      let recommendedAction: StudentMissionRow["recommendedAction"] = "Monitor";
      if (overdueReviews > 0) recommendedAction = "Review intervention";
      else if (invisibleRisk) recommendedAction = "Capture evidence";
      else if (reportingFragile) recommendedAction = "Prepare report";
      else if (
        forecastRisk === "Escalating" &&
        activeInterventions.length > 0
      )
        recommendedAction = "Escalate support";
      else if (safe(overview?.attention_status) === "Attention")
        recommendedAction = "Conference needed";

      return {
        student,
        overview,
        evidence,
        interventions: studentInterventions,
        studentName: studentName(student, overview),
        lastEvidenceDays,
        evidence30d,
        evidencePrev30d,
        evidenceMomentumDelta,
        openInterventions: activeInterventions.length,
        overdueReviews,
        dueSoonReviews,
        missingAreaCount: missingAreas.length,
        missingAreas,
        narrativeCount,
        invisibleRisk,
        reportingFragile,
        authorityFragile,
        forecastRisk,
        heatScore,
        recommendedAction,
      };
    });
  }, [students, overviewMap, evidenceByStudent, interventionsByStudent, areas]);

  const filteredStudents = useMemo(() => {
    let rows = [...missionRows];

    const q = safe(search).toLowerCase();
    if (q) rows = rows.filter((r) => r.studentName.toLowerCase().includes(q));

    if (studentFilter === "attention")
      rows = rows.filter(
        (r) => safe(r.overview?.attention_status) === "Attention"
      );
    if (studentFilter === "watch")
      rows = rows.filter((r) => safe(r.overview?.attention_status) === "Watch");
    if (studentFilter === "invisible")
      rows = rows.filter((r) => r.invisibleRisk);
    if (studentFilter === "reporting")
      rows = rows.filter((r) => r.reportingFragile);
    if (studentFilter === "authority")
      rows = rows.filter((r) => r.authorityFragile);

    rows.sort((a, b) => b.heatScore - a.heatScore);
    return rows;
  }, [missionRows, search, studentFilter]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const evidenceActivity: ActivityItem[] = evidenceEntries
      .slice(0, 14)
      .map((e) => ({
        key: `e-${e.id}`,
        when: isoShort(evidenceDate(e)),
        kind: "Evidence",
        title: clip(e.title || e.learning_area || "Evidence entry", 80),
        body: clip(
          e.summary || e.body || e.learning_area || "Recent evidence captured.",
          120
        ),
        studentId: e.student_id,
      }));

    const interventionActivity: ActivityItem[] = interventions
      .slice(0, 10)
      .map((i) => ({
        key: `i-${i.id}`,
        when: isoShort(pickReviewDate(i) || i.created_at),
        kind: "Intervention",
        title: clip(i.title || i.strategy || "Support item", 80),
        body: clip(
          i.notes || i.note || i.status || "Recent intervention activity.",
          120
        ),
        studentId: i.student_id,
      }));

    return [...evidenceActivity, ...interventionActivity]
      .sort((a, b) => dateSortValue(b.when) - dateSortValue(a.when))
      .slice(0, 16);
  }, [evidenceEntries, interventions]);

  const actionItems = useMemo<ActionItem[]>(() => {
    const noEvidence30 = missionRows.filter((s) => s.evidence30d === 0).length;
    const overdueReviews = missionRows.filter((s) => s.overdueReviews > 0).length;
    const invisible = missionRows.filter((s) => s.invisibleRisk).length;
    const attention = missionRows.filter(
      (s) => safe(s.overview?.attention_status) === "Attention"
    ).length;
    const reportingFragile = missionRows.filter((s) => s.reportingFragile).length;
    const authorityFragile = missionRows.filter((s) => s.authorityFragile).length;

    const items: ActionItem[] = [];

    if (overdueReviews > 0) {
      items.push({
        id: "overdue-reviews",
        title: "Intervention review load",
        text: `${overdueReviews} students need intervention review.`,
        tone: "danger",
        href: `/admin/interventions?classId=${encodeURIComponent(classId)}`,
      });
    }

    if (noEvidence30 > 0) {
      items.push({
        id: "evidence-gaps",
        title: "Evidence freshness gap",
        text: `${noEvidence30} students have no evidence in the last 30 days.`,
        tone: "danger",
        href: `/admin/evidence-entry?classId=${encodeURIComponent(classId)}`,
      });
    }

    if (attention > 0) {
      items.push({
        id: "attention-students",
        title: "Attention cluster",
        text: `${attention} students currently sit in Attention.`,
        tone: "danger",
      });
    }

    if (invisible > 0) {
      items.push({
        id: "invisible-students",
        title: "Visibility risk",
        text: `${invisible} students may be becoming invisible in the evidence stream.`,
        tone: "watch",
      });
    }

    if (reportingFragile > 0) {
      items.push({
        id: "reporting-fragile",
        title: "Reporting readiness",
        text: `${reportingFragile} students are fragile for reporting readiness.`,
        tone: "watch",
        href: `/admin/reports/readiness`,
      });
    }

    if (authorityFragile > 0) {
      items.push({
        id: "authority-fragile",
        title: "Authority posture",
        text: `${authorityFragile} students show fragile authority/documentation posture.`,
        tone: "watch",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "all-clear",
        title: "All clear",
        text: "No urgent class-hub alerts right now. Maintain evidence freshness and monitor momentum.",
        tone: "good",
      });
    }

    return items.slice(0, 6);
  }, [missionRows, classId]);

  const summary = useMemo(() => {
    const total = missionRows.length;
    const attention = missionRows.filter(
      (s) => safe(s.overview?.attention_status) === "Attention"
    ).length;
    const invisible = missionRows.filter((s) => s.invisibleRisk).length;
    const reportingFragile = missionRows.filter((s) => s.reportingFragile).length;
    const authorityFragile = missionRows.filter((s) => s.authorityFragile).length;
    const overdue = missionRows.reduce((sum, s) => sum + s.overdueReviews, 0);
    const avgRisk = total
      ? Math.round(
          missionRows.reduce((sum, s) => sum + s.heatScore, 0) / total
        )
      : 0;
    const freshPct = percent(
      missionRows.filter((s) => s.evidence30d > 0).length,
      Math.max(1, total)
    );
    const benchmark = benchmarkPosition(avgRisk);
    const authorityStatus: "Strong" | "Watch" | "Fragile" =
      authorityFragile >= Math.max(3, Math.ceil(total * 0.4))
        ? "Fragile"
        : authorityFragile >= Math.max(2, Math.ceil(total * 0.2))
        ? "Watch"
        : "Strong";

    return {
      total,
      attention,
      invisible,
      reportingFragile,
      authorityFragile,
      overdue,
      avgRisk,
      freshPct,
      benchmark,
      authorityStatus,
    };
  }, [missionRows]);

  const coverageRows = useMemo<CoverageAreaRow[]>(() => {
    return areas.map((area) => {
      const areaEntries = evidenceEntries.filter(
        (e) => guessArea(e.learning_area) === area
      );
      const freshEntries = areaEntries.filter((e) => {
        const d = daysSince(evidenceDate(e));
        return d != null && d <= 30;
      });

      let gapStudents = 0;
      let watchStudents = 0;
      let strongStudents = 0;

      missionRows.forEach((s) => {
        const count = s.evidence.filter(
          (e) => guessArea(e.learning_area) === area
        ).length;
        const fresh = s.evidence.filter(
          (e) =>
            guessArea(e.learning_area) === area &&
            (daysSince(evidenceDate(e)) ?? 999) <= 30
        ).length;
        if (count === 0) gapStudents += 1;
        else if (fresh === 0) watchStudents += 1;
        else strongStudents += 1;
      });

      return {
        area,
        totalEntries: areaEntries.length,
        freshEntries: freshEntries.length,
        studentCoveragePct: percent(
          strongStudents + watchStudents,
          Math.max(1, missionRows.length)
        ),
        gapStudents,
        watchStudents,
        strongStudents,
      };
    });
  }, [areas, evidenceEntries, missionRows]);

  const strategicPlan = useMemo(() => {
    const rows: {
      title: string;
      owner: string;
      timing: string;
      rationale: string;
      tone: "good" | "watch" | "danger" | "info";
    }[] = [];

    if (summary.invisible > 0) {
      rows.push({
        title: "Run a class evidence recovery push",
        owner: "Teacher",
        timing: "Next 5 school days",
        rationale: `${summary.invisible} students are slipping from the evidence stream.`,
        tone: "watch",
      });
    }

    if (summary.reportingFragile > 0) {
      rows.push({
        title: "Strengthen reporting evidence",
        owner: "Teacher",
        timing: "This week",
        rationale: `${summary.reportingFragile} students are not yet secure for report writing.`,
        tone: "watch",
      });
    }

    if (summary.overdue > 0) {
      rows.push({
        title: "Clear overdue reviews",
        owner: "Teacher / Support team",
        timing: "Immediately",
        rationale: `${summary.overdue} overdue review signals are driving class pressure.`,
        tone: "danger",
      });
    }

    if (summary.authorityFragile > 0) {
      rows.push({
        title: "Lift documentation confidence",
        owner: "Teacher / Leadership",
        timing: "Before next reporting checkpoint",
        rationale: `${summary.authorityFragile} students have fragile authority/documentation posture.`,
        tone: "danger",
      });
    }

    if (!rows.length) {
      rows.push({
        title: "Maintain current rhythm",
        owner: "Teacher",
        timing: "Ongoing",
        rationale: "The class is broadly stable right now.",
        tone: "good",
      });
    }

    return rows.slice(0, 5);
  }, [summary]);

  const classSwitchLabel = useMemo(() => {
    return (
      [safe(klass?.name), fmtYear(klass?.year_level), safe(klass?.room)]
        .filter(Boolean)
        .join(" • ") || "Class Hub"
    );
  }, [klass]);

  const authorityStatusTone = authorityTone(summary.authorityStatus);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.heroTop}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={S.subtle}>Class Mission Control</div>
              <h1 style={S.h1}>{classSwitchLabel}</h1>
              <div style={S.sub}>
                Premium class hub for day-to-day teacher operations, learner
                trajectory tracking, evidence coverage, support load, and reporting
                / authority readiness.
              </div>
              <div style={{ ...S.row, marginTop: 12 }}>
                <span style={S.chipMuted}>
                  {safe(klass?.teacher_name) || "Teacher unassigned"}
                </span>
                {safe(klass?.room) ? (
                  <span style={S.chipMuted}>Room {safe(klass?.room)}</span>
                ) : null}
                <span
                  style={{
                    ...S.chip,
                    background: authorityStatusTone.bg,
                    borderColor: authorityStatusTone.bd,
                    color: authorityStatusTone.fg,
                  }}
                >
                  Authority {summary.authorityStatus}
                </span>
                <span style={S.chipMuted}>Benchmark {summary.benchmark}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                style={S.btn}
                onClick={() => router.push("/admin/command-centre")}
              >
                Command Centre
              </button>
              <button
                type="button"
                style={S.btn}
                onClick={() =>
                  router.push(
                    `/admin/classes/${encodeURIComponent(classId)}/heatmap`
                  )
                }
              >
                Class Heatmap
              </button>
              <button type="button" style={S.btn} onClick={() => loadAll()}>
                Refresh
              </button>
            </div>
          </div>

          <section style={S.controlsCard}>
            <div style={S.controlsGrid}>
              <div>
                <label style={S.controlLabel}>Switch class</label>
                <select
                  value={classId}
                  onChange={(e) =>
                    router.push(
                      `/admin/classes/${encodeURIComponent(e.target.value)}`
                    )
                  }
                  style={S.select}
                >
                  {classOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {[safe(c.name), fmtYear(c.year_level), safe(c.room)]
                        .filter(Boolean)
                        .join(" • ") || "Class"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={S.controlLabel}>Search student</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find learner..."
                  style={S.input}
                />
              </div>

              <div>
                <label style={S.controlLabel}>Student filter</label>
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value as any)}
                  style={S.select}
                >
                  <option value="all">All students</option>
                  <option value="attention">Attention</option>
                  <option value="watch">Watch</option>
                  <option value="invisible">Invisible risk</option>
                  <option value="reporting">Reporting fragile</option>
                  <option value="authority">Authority fragile</option>
                </select>
              </div>

              <div>
                <label style={S.controlLabel}>Density</label>
                <select
                  value={viewDensity}
                  onChange={(e) => setViewDensity(e.target.value as any)}
                  style={S.select}
                >
                  <option value="simple">Simple</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </div>

            <div style={{ ...S.row, marginTop: 14 }}>
              {(
                ["overview", "students", "evidence", "interventions", "coverage"] as TabKey[]
              ).map((t) => {
                const active = tab === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    style={{
                      ...S.tabBtn,
                      background: active ? "#2563eb" : "#fff",
                      color: active ? "#fff" : "#0f172a",
                      borderColor: active ? "#2563eb" : "#dbe2ea",
                    }}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
          </section>

          <div style={S.metricGrid}>
            <Metric
              title="Students"
              value={summary.total}
              help="Learners in this class."
            />
            <Metric
              title="Average Risk"
              value={summary.avgRisk}
              help="Composite class pressure score."
            />
            <Metric
              title="Fresh Evidence"
              value={`${summary.freshPct}%`}
              help="Students with evidence in 30 days."
            />
            <Metric
              title="Attention"
              value={summary.attention}
              help="Highest concern learners."
            />
            <Metric
              title="Invisible"
              value={summary.invisible}
              help="Learners slipping out of view."
            />
            <Metric
              title="Reporting Fragile"
              value={summary.reportingFragile}
              help="Weak report-readiness."
            />
            <Metric
              title="Authority Fragile"
              value={summary.authorityFragile}
              help="Weak documentation / audit posture."
            />
            <Metric
              title="Overdue Reviews"
              value={summary.overdue}
              help="Support review load across class."
            />
          </div>
        </section>

        {busy ? <div style={S.ok}>Refreshing class hub…</div> : null}
        {err ? <div style={S.err}>{err}</div> : null}

        {tab === "overview" && (
          <>
            <section style={S.mainGrid}>
              <div style={S.leftCol}>
                {visibility.nextActions && (
                  <Card
                    title="Ranked Class Action Queue"
                    help="The most important operational moves for this class right now."
                  >
                    <div style={S.list}>
                      {actionItems.map((item) => (
                        <div
                          key={item.id}
                          style={{ ...S.item, ...toneCard(item.tone) }}
                        >
                          <div style={S.itemTitle}>{item.title}</div>
                          <div style={S.itemText}>{item.text}</div>
                          {item.href ? (
                            <div style={{ marginTop: 8 }}>
                              <button
                                type="button"
                                style={S.btnSmall}
                                onClick={() => router.push(item.href!)}
                              >
                                Open
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card
                  title="Strategic Plan"
                  help="Short operating plan for the class based on current signals."
                >
                  <div style={S.list}>
                    {strategicPlan.map((row) => (
                      <div
                        key={row.title}
                        style={{ ...S.item, ...toneCard(row.tone) }}
                      >
                        <div style={S.itemTitle}>{row.title}</div>
                        <div style={S.itemText}>
                          Owner: {row.owner} • Timing: {row.timing}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            color: "#475569",
                            fontWeight: 800,
                          }}
                        >
                          {row.rationale}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {visibility.studentList && (
                  <Card
                    title="Priority Student Radar"
                    help="Top learner priorities in this class, ordered by pressure and fragility."
                  >
                    <div style={S.studentGrid}>
                      {filteredStudents
                        .slice(0, viewDensity === "simple" ? 8 : 12)
                        .map((row) => {
                          const heat = heatTone(row.heatScore);
                          const att = statusTone(row.overview?.attention_status);
                          const fc = forecastTone(row.forecastRisk);

                          return (
                            <div key={row.student.id} style={S.studentCard}>
                              <div
                                style={{
                                  ...S.row,
                                  justifyContent: "space-between",
                                }}
                              >
                                <div>
                                  <div style={S.studentName}>
                                    {row.studentName}
                                  </div>
                                  <div
                                    style={{
                                      marginTop: 4,
                                      color: "#64748b",
                                      fontSize: 12,
                                    }}
                                  >
                                    {row.student.is_ilp ? "ILP" : "General"} •
                                    Evidence {row.evidence30d} / 30d
                                  </div>
                                </div>
                                <span
                                  style={{
                                    ...S.chip,
                                    background: heat.bg,
                                    borderColor: heat.bd,
                                    color: heat.fg,
                                  }}
                                >
                                  {heat.label}
                                </span>
                              </div>

                              <div style={{ ...S.row, marginTop: 8 }}>
                                <span
                                  style={{
                                    ...S.chip,
                                    background: att.bg,
                                    borderColor: att.bd,
                                    color: att.fg,
                                  }}
                                >
                                  {safe(row.overview?.attention_status) ||
                                    "Ready"}
                                </span>
                                <span
                                  style={{
                                    ...S.chip,
                                    background: fc.bg,
                                    borderColor: fc.bd,
                                    color: fc.fg,
                                  }}
                                >
                                  {row.forecastRisk}
                                </span>
                                {row.authorityFragile ? (
                                  <span style={S.chipMuted}>
                                    Authority fragile
                                  </span>
                                ) : null}
                              </div>

                              {viewDensity === "detailed" ? (
                                <div style={S.studentMeta}>
                                  <div>
                                    Last evidence:{" "}
                                    {row.lastEvidenceDays == null
                                      ? "—"
                                      : `${row.lastEvidenceDays}d ago`}
                                  </div>
                                  <div>
                                    Momentum:{" "}
                                    {row.evidenceMomentumDelta >= 0 ? "+" : ""}
                                    {row.evidenceMomentumDelta}
                                  </div>
                                  <div>
                                    Interventions: {row.openInterventions} /
                                    overdue {row.overdueReviews}
                                  </div>
                                  <div>
                                    Missing areas:{" "}
                                    {row.missingAreas.length
                                      ? row.missingAreas.join(", ")
                                      : "None"}
                                  </div>
                                </div>
                              ) : null}

                              <div style={{ ...S.row, marginTop: 10 }}>
                                <button
                                  type="button"
                                  style={S.btnSmall}
                                  onClick={() =>
                                    router.push(
                                      `/admin/students/${encodeURIComponent(
                                        row.student.id
                                      )}`
                                    )
                                  }
                                >
                                  Open student
                                </button>
                                <StudentQuickOpen
                                  studentId={row.student.id}
                                  label="Quick view"
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                )}
              </div>

              <div style={S.rightCol}>
                {visibility.interventions && (
                  <Card
                    title="Support Queue Snapshot"
                    help="Current intervention and review pressure for the class."
                  >
                    <div style={S.stack}>
                      {missionRows
                        .filter(
                          (r) =>
                            r.openInterventions > 0 || r.overdueReviews > 0
                        )
                        .sort(
                          (a, b) =>
                            b.overdueReviews +
                            b.openInterventions -
                            (a.overdueReviews + a.openInterventions)
                        )
                        .slice(0, 8)
                        .map((row) => (
                          <div key={row.student.id} style={S.sideItem}>
                            <div style={S.sideItemTitle}>{row.studentName}</div>
                            <div style={S.sideItemText}>
                              {row.openInterventions} open •{" "}
                              {row.overdueReviews} overdue •{" "}
                              {row.recommendedAction}
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                )}

                <Card
                  title="Benchmark & Authority Snapshot"
                  help="Quick class posture for internal benchmark and documentation confidence."
                >
                  <div style={S.stack}>
                    <div style={S.sideItem}>
                      <div style={S.sideItemTitle}>Benchmark position</div>
                      <div style={S.sideItemText}>{summary.benchmark}</div>
                    </div>
                    <div style={S.sideItem}>
                      <div style={S.sideItemTitle}>Authority status</div>
                      <div style={S.sideItemText}>{summary.authorityStatus}</div>
                    </div>
                    <div style={S.sideItem}>
                      <div style={S.sideItemTitle}>Class health freshness</div>
                      <div style={S.sideItemText}>
                        {classHealth?.students_without_recent_evidence != null
                          ? `${classHealth.students_without_recent_evidence} students without recent evidence`
                          : `${
                              100 - summary.freshPct
                            }% may need stronger freshness`}
                      </div>
                    </div>
                    <div style={S.sideItem}>
                      <div style={S.sideItemTitle}>
                        Teacher recommendation
                      </div>
                      <div style={S.sideItemText}>
                        {summary.reportingFragile >= 4
                          ? "Run a reporting-focused evidence push."
                          : summary.overdue > 0
                          ? "Clear review load before it compounds."
                          : "Maintain current operating rhythm."}
                      </div>
                    </div>
                  </div>
                </Card>

                {visibility.evidenceFeed && (
                  <Card
                    title="Recent Activity"
                    help="Latest evidence and intervention activity inside this class."
                  >
                    <div style={S.stack}>
                      {recentActivity.map((item) => (
                        <div key={item.key} style={S.sideItem}>
                          <div
                            style={{
                              ...S.row,
                              justifyContent: "space-between",
                            }}
                          >
                            <div style={S.sideItemTitle}>{item.title}</div>
                            <div style={{ color: "#64748b", fontSize: 12 }}>
                              {item.when}
                            </div>
                          </div>
                          <div style={S.sideItemText}>
                            {item.kind} • {item.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </section>
          </>
        )}

        {tab === "students" && (
          <Card
            title="Student Mission Table"
            help="Class-wide learner table with heat, trajectory, and recommended action."
          >
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Student</th>
                    <th style={S.th}>Attention</th>
                    <th style={S.th}>Heat</th>
                    <th style={S.th}>Forecast</th>
                    <th style={S.th}>Evidence 30d</th>
                    <th style={S.th}>Momentum</th>
                    <th style={S.th}>Interventions</th>
                    <th style={S.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((row) => {
                    const att = statusTone(row.overview?.attention_status);
                    const heat = heatTone(row.heatScore);
                    const fc = forecastTone(row.forecastRisk);
                    return (
                      <tr key={row.student.id}>
                        <td style={S.td}>
                          <button
                            type="button"
                            style={S.linkBtn}
                            onClick={() =>
                              router.push(
                                `/admin/students/${encodeURIComponent(
                                  row.student.id
                                )}`
                              )
                            }
                          >
                            {row.studentName}
                          </button>
                        </td>
                        <td style={S.td}>
                          <span
                            style={{
                              ...S.chip,
                              background: att.bg,
                              borderColor: att.bd,
                              color: att.fg,
                            }}
                          >
                            {safe(row.overview?.attention_status) || "Ready"}
                          </span>
                        </td>
                        <td style={S.td}>
                          <span
                            style={{
                              ...S.chip,
                              background: heat.bg,
                              borderColor: heat.bd,
                              color: heat.fg,
                            }}
                          >
                            {row.heatScore}
                          </span>
                        </td>
                        <td style={S.td}>
                          <span
                            style={{
                              ...S.chip,
                              background: fc.bg,
                              borderColor: fc.bd,
                              color: fc.fg,
                            }}
                          >
                            {row.forecastRisk}
                          </span>
                        </td>
                        <td style={S.td}>{row.evidence30d}</td>
                        <td style={S.td}>
                          {row.evidenceMomentumDelta >= 0 ? "+" : ""}
                          {row.evidenceMomentumDelta}
                        </td>
                        <td style={S.td}>
                          {row.openInterventions} / overdue {row.overdueReviews}
                        </td>
                        <td style={S.td}>{row.recommendedAction}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "evidence" && (
          <Card
            title="Class Evidence Feed"
            help="Recent class evidence with quality cues and direct follow-through."
          >
            <div style={S.list}>
              {evidenceEntries.slice(0, 24).map((e) => {
                const sid = safe(e.student_id);
                const row = missionRows.find((m) => m.student.id === sid);
                return (
                  <div key={e.id} style={S.feedItem}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <div>
                        <div style={S.itemTitle}>
                          {clip(
                            e.title || e.learning_area || "Evidence entry",
                            100
                          )}
                        </div>
                        <div style={S.itemMeta}>
                          {row?.studentName || "Student"} •{" "}
                          {guessArea(e.learning_area)} •{" "}
                          {isoShort(evidenceDate(e))}
                        </div>
                      </div>
                      <div style={{ ...S.row }}>
                        {safe(e.summary) || safe(e.body) ? (
                          <span style={S.chipMuted}>Narrative</span>
                        ) : (
                          <span style={S.chipMuted}>Thin</span>
                        )}
                        {row?.authorityFragile ? (
                          <span style={S.chipMuted}>Authority fragile</span>
                        ) : null}
                      </div>
                    </div>
                    <div style={S.itemText}>
                      {clip(
                        e.summary ||
                          e.body ||
                          e.learning_area ||
                          "Evidence captured.",
                        220
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {tab === "interventions" && (
          <Card
            title="Class Intervention Queue"
            help="Review and support load inside the class."
          >
            <div style={S.list}>
              {interventions
                .slice()
                .sort(
                  (a, b) =>
                    dateSortValue(pickReviewDate(a)) -
                    dateSortValue(pickReviewDate(b))
                )
                .slice(0, 24)
                .map((i) => {
                  const reviewDays = daysUntil(pickReviewDate(i));
                  const review = reviewTone(reviewDays);
                  const tone = interventionStatusTone(i.status);
                  const row = missionRows.find(
                    (m) => m.student.id === safe(i.student_id)
                  );
                  return (
                    <div key={i.id} style={S.feedItem}>
                      <div style={{ ...S.row, justifyContent: "space-between" }}>
                        <div>
                          <div style={S.itemTitle}>
                            {clip(i.title || i.strategy || "Support item", 100)}
                          </div>
                          <div style={S.itemMeta}>
                            {row?.studentName || "Student"} •{" "}
                            {safe(i.priority) || "normal"} •{" "}
                            {safe(i.tier) || "tier ?"}
                          </div>
                        </div>
                        <div style={{ ...S.row }}>
                          <span
                            style={{
                              ...S.chip,
                              background: tone.bg,
                              borderColor: tone.bd,
                              color: tone.fg,
                            }}
                          >
                            {safe(i.status) || "open"}
                          </span>
                          <span
                            style={{
                              ...S.chip,
                              background: review.bg,
                              borderColor: review.bd,
                              color: review.fg,
                            }}
                          >
                            {review.label}
                          </span>
                        </div>
                      </div>
                      <div style={S.itemText}>
                        {clip(
                          i.notes ||
                            i.note ||
                            i.strategy ||
                            "Support plan in progress.",
                          220
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}

        {tab === "coverage" && (
          <Card
            title="Coverage & Area Risk"
            help="Learning-area coverage, freshness, and student gap clustering."
          >
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Area</th>
                    <th style={S.th}>Entries</th>
                    <th style={S.th}>Fresh</th>
                    <th style={S.th}>Coverage</th>
                    <th style={S.th}>Gap students</th>
                    <th style={S.th}>Watch students</th>
                    <th style={S.th}>Strong students</th>
                  </tr>
                </thead>
                <tbody>
                  {coverageRows.map((row) => (
                    <tr key={row.area}>
                      <td style={S.td}>{row.area}</td>
                      <td style={S.td}>{row.totalEntries}</td>
                      <td style={S.td}>{row.freshEntries}</td>
                      <td style={S.td}>{row.studentCoveragePct}%</td>
                      <td style={S.td}>{row.gapStudents}</td>
                      <td style={S.td}>{row.watchStudents}</td>
                      <td style={S.td}>{row.strongStudents}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

/* ───────────────────────── UI ───────────────────────── */

function Card({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={S.card}>
      <div style={S.cardPad}>
        <div style={S.cardTitle}>{title}</div>
        {help ? <div style={S.cardHelp}>{help}</div> : null}
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </section>
  );
}

function Metric({
  title,
  value,
  help,
}: {
  title: string;
  value: React.ReactNode;
  help: string;
}) {
  return (
    <div style={S.metricCard}>
      <div style={S.metricK}>{title}</div>
      <div style={S.metricV}>{value}</div>
      <div style={S.metricS}>{help}</div>
    </div>
  );
}

function toneCard(
  tone: "good" | "watch" | "danger" | "info"
): React.CSSProperties {
  if (tone === "danger")
    return { borderColor: "#fecaca", background: "#fff1f2" };
  if (tone === "watch")
    return { borderColor: "#fde68a", background: "#fffbeb" };
  if (tone === "info")
    return { borderColor: "#bfdbfe", background: "#eff6ff" };
  return { borderColor: "#a7f3d0", background: "#ecfdf5" };
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f7fb",
  },

  main: {
    flex: 1,
    maxWidth: 1480,
    width: "100%",
    margin: "0 auto",
    padding: 24,
  },

  hero: {
    background:
      "linear-gradient(135deg, rgba(79,124,240,0.08) 0%, rgba(139,124,246,0.08) 100%)",
    border: "1px solid #d9e2ff",
    borderRadius: 26,
    padding: "28px 24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)",
  },

  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },

  subtle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  h1: {
    margin: "8px 0 0 0",
    fontSize: 38,
    lineHeight: 1.05,
    fontWeight: 950,
    color: "#0f172a",
  },

  sub: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.5,
    maxWidth: 980,
  },

  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    fontSize: 12,
    fontWeight: 800,
  },

  chipMuted: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 12,
    fontWeight: 800,
    color: "#475569",
  },

  btn: {
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },

  btnSmall: {
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "8px 10px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },

  controlsCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 20,
    marginTop: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  },

  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1.2fr 1fr 0.8fr",
    gap: 12,
  },

  controlLabel: {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  input: {
    width: "100%",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    color: "#0f172a",
  },

  select: {
    width: "100%",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    color: "#0f172a",
  },

  tabBtn: {
    borderRadius: 10,
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },

  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
    gap: 12,
    marginTop: 18,
  },

  metricCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  },

  metricK: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  metricV: {
    marginTop: 6,
    fontSize: 28,
    color: "#0f172a",
    fontWeight: 950,
    lineHeight: 1.05,
  },

  metricS: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.35,
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.35fr 0.85fr",
    gap: 16,
    marginTop: 16,
    alignItems: "start",
  },

  leftCol: {
    display: "grid",
    gap: 16,
  },

  rightCol: {
    display: "grid",
    gap: 16,
  },

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  },

  cardPad: {
    padding: 20,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  },

  cardHelp: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.45,
  },

  list: {
    display: "grid",
    gap: 10,
  },

  item: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
  },

  itemTitle: {
    fontWeight: 900,
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 1.35,
  },

  itemText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    lineHeight: 1.45,
  },

  studentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },

  studentCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
  },

  studentName: {
    fontSize: 15,
    fontWeight: 950,
    color: "#0f172a",
  },

  studentMeta: {
    marginTop: 10,
    display: "grid",
    gap: 4,
    color: "#475569",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.4,
  },

  stack: {
    display: "grid",
    gap: 10,
  },

  sideItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
  },

  sideItemTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#0f172a",
  },

  sideItemText: {
    marginTop: 6,
    color: "#475569",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.45,
  },

  tableWrap: {
    marginTop: 8,
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },

  th: {
    textAlign: "left",
    padding: "12px 12px",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "12px 12px",
    fontSize: 13,
    color: "#0f172a",
    fontWeight: 700,
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "top",
  },

  linkBtn: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: "#2563eb",
    fontWeight: 900,
    cursor: "pointer",
    textAlign: "left",
  },

  feedItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
  },

  itemMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
    lineHeight: 1.4,
  },

  ok: {
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid #a7f3d0",
    background: "#ecfdf5",
    padding: 12,
    color: "#065f46",
    fontWeight: 900,
    fontSize: 13,
  },

  err: {
    marginTop: 14,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
    fontSize: 13,
    lineHeight: 1.45,
  },
};