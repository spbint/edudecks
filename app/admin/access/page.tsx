"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
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
  class_id: string | null;
  first_name: string | null;
  preferred_name: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  is_ilp?: boolean | null;
  created_at?: string | null;
  [k: string]: any;
};

type EvidenceEntryRow = {
  id: string;
  student_id: string | null;
  class_id: string | null;
  title: string | null;
  summary: string | null;
  body: string | null;
  learning_area: string | null;
  occurred_on: string | null;
  created_at: string | null;
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
  due_on?: string | null;
  next_review_on?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  created_at?: string | null;
  [k: string]: any;
};

type ViewKey =
  | "overview"
  | "students"
  | "evidence"
  | "interventions"
  | "coverage";

type WidgetKey =
  | "nextActions"
  | "studentList"
  | "evidenceFeed"
  | "interventionQueue"
  | "coverageMap"
  | "groupBuilder"
  | "classStatus"
  | "evidenceIntake";

/* ───────────────────────────── HELPERS ───────────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function studentDisplayName(s: StudentRow) {
  const first = safe(s.preferred_name) || safe(s.first_name);
  const last = safe(s.surname || s.family_name || s.last_name);
  return `${first}${last ? ` ${last}` : ""}`.trim() || "Student";
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function fmtDateShort(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function getEffectiveDate(e: EvidenceEntryRow) {
  return safe(e.occurred_on) || safe(e.created_at);
}

function daysSince(v: string | null | undefined) {
  if (!v) return 999;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 999;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function isOpenIntervention(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return !(s === "closed" || s === "complete" || s === "completed" || s === "resolved" || s === "archived");
}

function asBool(v: any) {
  return v === true;
}

function severityFromRisk(risk: number) {
  if (risk >= 80) return "high";
  if (risk >= 55) return "medium";
  if (risk >= 30) return "low";
  return "stable";
}

function viewFromSearch(sp: ReturnType<typeof useSearchParams>): ViewKey {
  const raw = (sp.get("view") || sp.get("tab") || "overview").toLowerCase();
  if (
    raw === "overview" ||
    raw === "students" ||
    raw === "evidence" ||
    raw === "interventions" ||
    raw === "coverage"
  ) {
    return raw;
  }
  return "overview";
}

function defaultWidgetPrefs(): Record<WidgetKey, boolean> {
  return {
    nextActions: true,
    studentList: true,
    evidenceFeed: false,
    interventionQueue: true,
    coverageMap: false,
    groupBuilder: false,
    classStatus: true,
    evidenceIntake: true,
  };
}

function readWidgetPrefs(): Record<WidgetKey, boolean> {
  if (typeof window === "undefined") return defaultWidgetPrefs();

  try {
    const raw = window.localStorage.getItem("edudecks:classHubWidgets");
    if (!raw) return defaultWidgetPrefs();

    const parsed = JSON.parse(raw);
    return {
      nextActions: parsed.nextActions !== false,
      studentList: parsed.studentList !== false,
      evidenceFeed: parsed.evidenceFeed === true,
      interventionQueue: parsed.interventionQueue !== false,
      coverageMap: parsed.coverageMap === true,
      groupBuilder: parsed.groupBuilder === true,
      classStatus: parsed.classStatus !== false,
      evidenceIntake: parsed.evidenceIntake !== false,
    };
  } catch {
    return defaultWidgetPrefs();
  }
}

/* ───────────────────────────── STYLES ───────────────────────────── */

const S = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f6f7fb",
  } as React.CSSProperties,

  main: {
    flex: 1,
    width: "100%",
    maxWidth: 1500,
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
    margin: "8px 0 0 0",
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
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.45fr 1fr",
    gap: 14,
  } as React.CSSProperties,

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  } as React.CSSProperties,

  gridTiles: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(130px, 1fr))",
    gap: 12,
  } as React.CSSProperties,

  tile: {
    border: "1px solid #e8eaf0",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
    minHeight: 88,
  } as React.CSSProperties,

  tileK: {
    fontSize: 12,
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

  btnGhost: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  btnMini: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
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

  stickyTabsWrap: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "rgba(246,247,251,0.92)",
    backdropFilter: "blur(8px)",
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 14,
    borderBottom: "1px solid #eef2f7",
  } as React.CSSProperties,

  tab: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 950,
    cursor: "pointer",
  } as React.CSSProperties,

  tabActive: {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
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

  itemHigh: {
    border: "1px solid #fecaca",
    borderRadius: 14,
    background: "#fff7f7",
    padding: 12,
  } as React.CSSProperties,

  itemMedium: {
    border: "1px solid #fed7aa",
    borderRadius: 14,
    background: "#fffaf5",
    padding: 12,
  } as React.CSSProperties,

  itemLow: {
    border: "1px solid #fde68a",
    borderRadius: 14,
    background: "#fffdf2",
    padding: 12,
  } as React.CSSProperties,

  tableWrap: {
    overflowX: "auto",
    marginTop: 12,
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
  } as React.CSSProperties,

  th: {
    textAlign: "left",
    padding: 12,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 950,
    borderBottom: "1px solid #eef2f7",
    background: "#fff",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  td: {
    padding: 12,
    borderBottom: "1px solid #eef2f7",
    verticalAlign: "top",
  } as React.CSSProperties,

  statBarWrap: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
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
};

function AccessPageFallback() {
  return (
    <div style={S.shell}>
      <AdminLeftNav />
      <main style={S.main}>
        <div style={S.ok}>Loading access page…</div>
      </main>
    </div>
  );
}

function AdminClassHubPageInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const classId = safe((params as any)?.id);
  const activeView = viewFromSearch(searchParams);

  const [cls, setCls] = useState<ClassRow | null>(null);
  const [allClasses, setAllClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [areaFilter, setAreaFilter] = useState("ALL");
  const [onlyIlp, setOnlyIlp] = useState(false);
  const [widgets, setWidgets] = useState<Record<WidgetKey, boolean>>(readWidgetPrefs());

  const nextActionsRef = useRef<HTMLDivElement | null>(null);

  function setView(view: ViewKey) {
    router.replace(`/admin/classes/${classId}?view=${encodeURIComponent(view)}`);
  }

  function toggleWidget(key: WidgetKey) {
    setWidgets((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined") {
        window.localStorage.setItem("edudecks:classHubWidgets", JSON.stringify(next));
      }
      return next;
    });
  }

  function openQuickEvidence(studentId?: string) {
    const qs = new URLSearchParams();
    if (classId) qs.set("classId", classId);
    if (safe(studentId)) qs.set("studentId", safe(studentId));
    router.push(`/admin/evidence-entry?${qs.toString()}`);
  }

  function openInterventionEntry(studentId?: string, suggestedTitle?: string) {
    const qs = new URLSearchParams();
    if (classId) qs.set("classId", classId);
    if (safe(studentId)) qs.set("studentId", safe(studentId));
    if (safe(suggestedTitle)) qs.set("title", safe(suggestedTitle));
    router.push(`/admin/interventions-entry?${qs.toString()}`);
  }

  function openImportPage() {
    router.push("/admin/import");
  }

  function scanWorksheetPlaceholder() {
    setOk("Premium worksheet scan pipeline placeholder noted for future build.");
  }

  async function loadPage() {
    if (!classId) return;

    setBusy(true);
    setErr(null);

    try {
      const classListResp = await supabase
        .from("classes")
        .select("id,name,year_level,teacher_name,room")
        .order("year_level", { ascending: true })
        .order("name", { ascending: true });

      if (classListResp.error && !isMissingRelationOrColumn(classListResp.error)) {
        throw classListResp.error;
      }
      setAllClasses(classListResp.data || []);

      const classResp = await supabase
        .from("classes")
        .select("id,name,year_level,teacher_name,room")
        .eq("id", classId)
        .maybeSingle();

      if (classResp.error && !isMissingRelationOrColumn(classResp.error)) {
        throw classResp.error;
      }
      setCls(classResp.data || null);

      const studentResp = await supabase
        .from("students")
        .select("id,class_id,first_name,preferred_name,surname,family_name,last_name,is_ilp,created_at")
        .eq("class_id", classId)
        .order("preferred_name", { ascending: true });

      if (studentResp.error && !isMissingRelationOrColumn(studentResp.error)) {
        throw studentResp.error;
      }
      const studentRows = studentResp.data || [];
      setStudents(studentRows);

      const evidenceResp = await supabase
        .from("evidence_entries")
        .select("id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility,is_deleted")
        .eq("class_id", classId)
        .eq("is_deleted", false)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(300);

      if (evidenceResp.error && !isMissingRelationOrColumn(evidenceResp.error)) {
        throw evidenceResp.error;
      }
      setEvidence(evidenceResp.data || []);

      const interventionResp = await supabase
        .from("interventions")
        .select("id,student_id,class_id,title,notes,note,status,priority,due_on,next_review_on,review_due_on,review_due_date,created_at")
        .eq("class_id", classId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (interventionResp.error && !isMissingRelationOrColumn(interventionResp.error)) {
        throw interventionResp.error;
      }
      setInterventions(interventionResp.data || []);
    } catch (e: any) {
      setErr(safe(e?.message) || "Could not load the Class Hub.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(null), 1800);
    return () => clearTimeout(t);
  }, [ok]);

  const evidenceByStudent = useMemo(() => {
    const m = new Map<string, EvidenceEntryRow[]>();
    for (const row of evidence) {
      const sid = safe(row.student_id);
      if (!sid) continue;
      if (!m.has(sid)) m.set(sid, []);
      m.get(sid)!.push(row);
    }
    return m;
  }, [evidence]);

  const interventionsByStudent = useMemo(() => {
    const m = new Map<string, InterventionRow[]>();
    for (const row of interventions) {
      const sid = safe(row.student_id);
      if (!sid) continue;
      if (!m.has(sid)) m.set(sid, []);
      m.get(sid)!.push(row);
    }
    return m;
  }, [interventions]);

  const learningAreas = useMemo(() => {
    const vals = Array.from(new Set(evidence.map((e) => safe(e.learning_area)).filter(Boolean)));
    vals.sort((a, b) => a.localeCompare(b));
    return vals;
  }, [evidence]);

  const studentRows = useMemo(() => {
    return students.map((s) => {
      const sid = safe(s.id);
      const ev = (evidenceByStudent.get(sid) || []).slice().sort((a, b) => {
        return getEffectiveDate(b).localeCompare(getEffectiveDate(a));
      });

      const ints = interventionsByStudent.get(sid) || [];
      const openInts = ints.filter((x) => isOpenIntervention(x.status));
      const latest = ev[0];
      const latestDate = getEffectiveDate(latest);
      const days = latest ? daysSince(latestDate) : 999;
      const hasNoEvidence = ev.length === 0;

      let risk = 0;
      if (hasNoEvidence) risk += 55;
      else if (days > 30) risk += 40;
      else if (days > 21) risk += 28;
      else if (days > 14) risk += 16;
      else if (days > 7) risk += 6;

      risk += Math.min(25, openInts.length * 10);
      if (asBool(s.is_ilp)) risk += 15;

      const mathsEvidence = ev.filter((x) => safe(x.learning_area).toLowerCase().includes("math"));
      const literacyEvidence = ev.filter((x) => {
        const a = safe(x.learning_area).toLowerCase();
        return a.includes("english") || a.includes("reading") || a.includes("writing") || a.includes("literacy");
      });

      return {
        student: s,
        evidence: ev,
        interventions: ints,
        openInterventions: openInts,
        latestEvidence: latest,
        latestEvidenceDays: days,
        risk: Math.max(0, Math.min(100, risk)),
        severity: severityFromRisk(risk),
        hasNoEvidence,
        mathsEvidenceCount: mathsEvidence.length,
        literacyEvidenceCount: literacyEvidence.length,
      };
    });
  }, [students, evidenceByStudent, interventionsByStudent]);

  const filteredStudentRows = useMemo(() => {
    return studentRows
      .filter((r) => {
        if (onlyIlp && !asBool(r.student.is_ilp)) return false;
        const hay = `${studentDisplayName(r.student)} ${safe(r.latestEvidence?.title)} ${safe(r.latestEvidence?.learning_area)}`.toLowerCase();
        if (q && !hay.includes(q.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.risk - a.risk || studentDisplayName(a.student).localeCompare(studentDisplayName(b.student)));
  }, [studentRows, q, onlyIlp]);

  const filteredEvidence = useMemo(() => {
    return evidence.filter((e) => {
      if (areaFilter !== "ALL" && safe(e.learning_area) !== areaFilter) return false;
      const student = students.find((s) => safe(s.id) === safe(e.student_id));
      const hay = `${safe(e.title)} ${safe(e.summary)} ${safe(e.body)} ${safe(e.learning_area)} ${student ? studentDisplayName(student) : ""}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      return true;
    });
  }, [evidence, areaFilter, q, students]);

  const openInterventions = useMemo(() => interventions.filter((x) => isOpenIntervention(x.status)), [interventions]);

  const classStatus = useMemo(() => {
    const recentEvidenceStudents = studentRows.filter((r) => !r.hasNoEvidence && r.latestEvidenceDays <= 14).length;
    const total = Math.max(1, studentRows.length);
    const recentPct = Math.round((recentEvidenceStudents / total) * 100);

    if (recentPct >= 80 && openInterventions.length <= Math.max(2, Math.ceil(total * 0.15))) {
      return {
        label: "Stable",
        text: "Most students have recent evidence and intervention load is manageable.",
      };
    }

    if (recentPct >= 55) {
      return {
        label: "Watch",
        text: "The class is broadly on track, but some students need follow-up or fresher evidence.",
      };
    }

    return {
      label: "Attention Required",
      text: "Evidence freshness or intervention load suggests this class needs immediate review.",
      };
  }, [studentRows, openInterventions]);

  const nextActions = useMemo(() => {
    const actions: Array<{ id: string; title: string; detail: string; level: "high" | "medium" | "low" }> = [];

    const noEvidenceStudents = studentRows.filter((r) => r.hasNoEvidence);
    const overdueReview = openInterventions.filter((x) => {
      const d = safe(x.review_due_on || x.review_due_date || x.next_review_on);
      return d && daysSince(d) > 0;
    });
    const staleStudents = studentRows.filter((r) => !r.hasNoEvidence && r.latestEvidenceDays > 21);
    const noMaths = studentRows.filter((r) => r.mathsEvidenceCount === 0);
    const ilpNoEvidence = studentRows.filter((r) => asBool(r.student.is_ilp) && r.hasNoEvidence);

    if (noEvidenceStudents.length) {
      actions.push({
        id: "no-evidence",
        title: "Review students with no evidence",
        detail: `${noEvidenceStudents.length} student${noEvidenceStudents.length === 1 ? "" : "s"} have no recorded evidence in this class.`,
        level: "high",
      });
    }

    if (overdueReview.length) {
      actions.push({
        id: "overdue-review",
        title: "Complete overdue intervention reviews",
        detail: `${overdueReview.length} intervention review${overdueReview.length === 1 ? "" : "s"} are overdue.`,
        level: "high",
      });
    }

    if (ilpNoEvidence.length) {
      actions.push({
        id: "ilp-no-evidence",
        title: "Check ILP students with no recent evidence",
        detail: `${ilpNoEvidence.length} ILP student${ilpNoEvidence.length === 1 ? "" : "s"} have no evidence recorded.`,
        level: "high",
      });
    }

    if (staleStudents.length) {
      actions.push({
        id: "stale",
        title: "Refresh evidence for priority students",
        detail: `${staleStudents.length} student${staleStudents.length === 1 ? "" : "s"} have evidence older than 21 days.`,
        level: "medium",
      });
    }

    if (noMaths.length) {
      actions.push({
        id: "no-maths",
        title: "Strengthen maths evidence coverage",
        detail: `${noMaths.length} student${noMaths.length === 1 ? "" : "s"} have no maths-tagged evidence entries yet.`,
        level: "low",
      });
    }

    return actions;
  }, [studentRows, openInterventions]);

  const suggestedGroups = useMemo(() => {
    const attention = filteredStudentRows.filter((r) => r.risk >= 55).slice(0, 8);
    const mathsGap = filteredStudentRows.filter((r) => r.mathsEvidenceCount === 0).slice(0, 8);
    const extension = filteredStudentRows
      .filter((r) => r.risk < 25 && !r.hasNoEvidence && r.latestEvidenceDays <= 10)
      .slice(0, 8);

    return [
      {
        title: "Priority support group",
        help: "Students needing the most immediate teacher attention.",
        students: attention,
      },
      {
        title: "Maths evidence focus",
        help: "Students who need a fresh maths check-in or quick formative task.",
        students: mathsGap,
      },
      {
        title: "Extension / independent group",
        help: "Students showing current momentum and capacity for challenge.",
        students: extension,
      },
    ];
  }, [filteredStudentRows]);

  const coverageRows = useMemo(() => {
    const areas = learningAreas.length ? learningAreas : ["Mathematics", "English"];
    return students.map((s) => {
      const ev = evidenceByStudent.get(s.id) || [];
      const counts = areas.map((a) => ev.filter((x) => safe(x.learning_area) === a).length);
      return { student: s, counts };
    });
  }, [students, learningAreas, evidenceByStudent]);

  const topPriorityStudents = useMemo(() => filteredStudentRows.slice(0, 5), [filteredStudentRows]);

  const evidenceThisWeek = useMemo(() => {
    return evidence.filter((e) => daysSince(getEffectiveDate(e)) <= 7).length;
  }, [evidence]);

  const studentsWithRecentEvidence = useMemo(() => {
    return studentRows.filter((r) => !r.hasNoEvidence && r.latestEvidenceDays <= 14).length;
  }, [studentRows]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />
      <main style={S.main}>
        <div style={S.hero}>
          <div style={S.subtle}>Class Hub</div>
          <h1 style={S.h1}>{safe(cls?.name) || "Class"}</h1>
          <div style={S.sub}>
            {fmtYear(cls?.year_level)}
            {safe(cls?.teacher_name) ? ` • ${safe(cls?.teacher_name)}` : ""}
            {safe(cls?.room) ? ` • Room ${safe(cls?.room)}` : ""}
          </div>

          <div style={{ ...S.row, marginTop: 14 }}>
            <span style={S.chip}>{students.length} students</span>
            <span style={S.chipMuted}>{studentRows.filter((r) => asBool(r.student.is_ilp)).length} ILP</span>
            <span style={S.chipMuted}>{evidence.length} evidence entries</span>
            <span style={S.chipMuted}>{openInterventions.length} open interventions</span>
            <span style={S.chipMuted}>Status: {classStatus.label}</span>
          </div>

          <div style={{ ...S.row, marginTop: 14 }}>
            <div style={{ minWidth: 240, flex: "0 1 280px" }}>
              <select
                style={S.select}
                value={classId}
                onChange={(e) => router.push(`/admin/classes/${e.target.value}?view=${activeView}`)}
              >
                {allClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {safe(c.name) || "Class"}{c.year_level != null ? ` • Y${c.year_level}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              style={S.btnPrimary}
              onClick={() => nextActionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Review flagged students →
            </button>

            <button style={S.btn} onClick={() => openQuickEvidence()}>
              + Add evidence
            </button>

            <button style={S.btn} onClick={() => openInterventionEntry()}>
              + Create intervention
            </button>

            <button style={S.btnGhost} onClick={openImportPage}>
              Import results
            </button>

            <button style={S.btn} onClick={loadPage}>
              Refresh
            </button>
          </div>
        </div>

        <div style={S.stickyTabsWrap}>
          <div style={S.row}>
            {(["overview", "students", "evidence", "interventions", "coverage"] as ViewKey[]).map((v) => (
              <button
                key={v}
                style={activeView === v ? S.tabActive : S.tab}
                onClick={() => setView(v)}
              >
                {v === "overview" && "Overview"}
                {v === "students" && "Student List"}
                {v === "evidence" && "Evidence Feed"}
                {v === "interventions" && "Interventions"}
                {v === "coverage" && "Coverage"}
              </button>
            ))}

            <div style={{ flex: 1 }} />

            <label style={S.chipMuted}>
              <input
                type="checkbox"
                checked={onlyIlp}
                onChange={(e) => setOnlyIlp(e.target.checked)}
              />
              ILP only
            </label>

            <div style={{ minWidth: 250, flex: "0 1 320px" }}>
              <input
                style={S.input}
                placeholder="Search students, evidence, areas..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {busy ? <div style={S.ok}>Loading Class Hub…</div> : null}
        {ok ? <div style={S.ok}>{ok}</div> : null}
        {err ? <div style={S.err}>{err}</div> : null}

        <div style={{ ...S.card, marginTop: 14 }}>
          <div style={S.sectionPad}>
            <div style={S.subtle}>View options</div>
            <div style={S.sectionHelp}>
              Choose a simpler or richer view. Your selections are remembered on this device.
            </div>

            <div style={{ ...S.row, marginTop: 12 }}>
              <label style={S.chip}><input type="checkbox" checked={widgets.nextActions} onChange={() => toggleWidget("nextActions")} /> Next Actions</label>
              <label style={S.chip}><input type="checkbox" checked={widgets.studentList} onChange={() => toggleWidget("studentList")} /> Student List</label>
              <label style={S.chip}><input type="checkbox" checked={widgets.interventionQueue} onChange={() => toggleWidget("interventionQueue")} /> Interventions</label>
              <label style={S.chip}><input type="checkbox" checked={widgets.classStatus} onChange={() => toggleWidget("classStatus")} /> Class Status</label>
              <label style={S.chip}><input type="checkbox" checked={widgets.evidenceIntake} onChange={() => toggleWidget("evidenceIntake")} /> Evidence Intake</label>
              <label style={S.chip}><input type="checkbox" checked={widgets.evidenceFeed} onChange={() => toggleWidget("evidenceFeed")} /> Evidence Feed</label>
              <label style={S.chip}><input type="checkbox" checked={widgets.coverageMap} onChange={() => toggleWidget("coverageMap")} /> Coverage Map</label>
              <label style={S.chip}><input type="checkbox" checked={widgets.groupBuilder} onChange={() => toggleWidget("groupBuilder")} /> Group Builder</label>
            </div>
          </div>
        </div>

        <div style={{ ...S.gridTiles, marginTop: 14 }}>
          <div style={S.tile}>
            <div style={S.tileK}>Students</div>
            <div style={S.tileV}>{students.length}</div>
            <div style={S.tileS}>Students currently assigned to this class.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>ILP students</div>
            <div style={S.tileV}>{studentRows.filter((r) => asBool(r.student.is_ilp)).length}</div>
            <div style={S.tileS}>Support-aware count for planning and review.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Evidence this week</div>
            <div style={S.tileV}>{evidenceThisWeek}</div>
            <div style={S.tileS}>Entries recorded in the last 7 days.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Recent student coverage</div>
            <div style={S.tileV}>{studentsWithRecentEvidence}</div>
            <div style={S.tileS}>Students with evidence in the last 14 days.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Open interventions</div>
            <div style={S.tileV}>{openInterventions.length}</div>
            <div style={S.tileS}>Active support items still requiring monitoring.</div>
          </div>

          <div style={S.tile}>
            <div style={S.tileK}>Priority students</div>
            <div style={S.tileV}>{studentRows.filter((r) => r.risk >= 55).length}</div>
            <div style={S.tileS}>Students currently flagged for faster follow-up.</div>
          </div>
        </div>

        {activeView === "overview" && (
          <div style={{ ...S.grid2, marginTop: 14 }}>
            <div style={{ display: "grid", gap: 14 }}>
              {widgets.nextActions && (
                <div ref={nextActionsRef} style={S.card}>
                  <div style={S.sectionPad}>
                    <div style={S.sectionTitle}>Next Actions</div>
                    <div style={S.sectionHelp}>
                      These are the highest-value teaching and review moves suggested by current class evidence.
                    </div>

                    <div style={S.list}>
                      {nextActions.length === 0 ? (
                        <div style={S.item}>No urgent actions detected right now.</div>
                      ) : (
                        nextActions.map((a) => (
                          <div
                            key={a.id}
                            style={a.level === "high" ? S.itemHigh : a.level === "medium" ? S.itemMedium : S.itemLow}
                          >
                            <div style={{ fontWeight: 950, color: "#0f172a" }}>{a.title}</div>
                            <div style={{ marginTop: 6, fontSize: 13, color: "#475569", fontWeight: 800 }}>
                              {a.detail}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {widgets.studentList && (
                <div style={S.card}>
                  <div style={S.sectionPad}>
                    <div style={S.sectionTitle}>Students Needing Attention</div>
                    <div style={S.sectionHelp}>
                      Ordered by a simple classroom risk score based on evidence freshness, intervention load, and ILP flag.
                    </div>

                    <div style={S.list}>
                      {topPriorityStudents.length === 0 ? (
                        <div style={S.item}>No students currently stand out as high priority.</div>
                      ) : (
                        topPriorityStudents.map((r) => {
                          const cardStyle =
                            r.severity === "high"
                              ? S.itemHigh
                              : r.severity === "medium"
                              ? S.itemMedium
                              : r.severity === "low"
                              ? S.itemLow
                              : S.item;

                          return (
                            <div key={r.student.id} style={cardStyle}>
                              <div style={{ ...S.row, justifyContent: "space-between" }}>
                                <div style={{ fontWeight: 950, color: "#0f172a" }}>{studentDisplayName(r.student)}</div>
                                <span style={S.chip}>Risk {r.risk}</span>
                              </div>

                              <div style={{ marginTop: 8, ...S.statBarWrap }}>
                                <div
                                  style={{
                                    width: `${r.risk}%`,
                                    height: "100%",
                                    background:
                                      r.severity === "high"
                                        ? "#ef4444"
                                        : r.severity === "medium"
                                        ? "#f97316"
                                        : r.severity === "low"
                                        ? "#eab308"
                                        : "#22c55e",
                                  }}
                                />
                              </div>

                              <div style={{ marginTop: 8, fontSize: 13, color: "#475569", fontWeight: 800 }}>
                                {r.hasNoEvidence
                                  ? "No evidence recorded yet."
                                  : `Latest evidence ${r.latestEvidenceDays} day${r.latestEvidenceDays === 1 ? "" : "s"} ago.`}
                                {r.openInterventions.length ? ` ${r.openInterventions.length} open intervention${r.openInterventions.length === 1 ? "" : "s"}.` : ""}
                                {asBool(r.student.is_ilp) ? " ILP flagged." : ""}
                              </div>

                              <div style={{ ...S.row, marginTop: 10 }}>
                                <button style={S.btnMini} onClick={() => openQuickEvidence(r.student.id)}>
                                  Add evidence
                                </button>
                                <button
                                  style={S.btnMini}
                                  onClick={() => openInterventionEntry(r.student.id, "Support plan / follow-up")}
                                >
                                  Add intervention
                                </button>
                                <button style={S.btnMini} onClick={() => setView("students")}>
                                  Open student list
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {widgets.groupBuilder && (
                <div style={S.card}>
                  <div style={S.sectionPad}>
                    <div style={S.sectionTitle}>Suggested Teaching Groups</div>
                    <div style={S.sectionHelp}>
                      Simple automatic groups to support planning, conferencing, or table rotations.
                    </div>

                    <div style={{ ...S.grid3, marginTop: 12 }}>
                      {suggestedGroups.map((g) => (
                        <div key={g.title} style={S.item}>
                          <div style={{ fontWeight: 950, color: "#0f172a" }}>{g.title}</div>
                          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                            {g.help}
                          </div>

                          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            {g.students.length === 0 ? (
                              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 800 }}>No students currently suggested.</div>
                            ) : (
                              g.students.map((r) => (
                                <div key={`${g.title}-${r.student.id}`} style={S.chipMuted}>
                                  {studentDisplayName(r.student)}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {widgets.classStatus && (
                <div style={S.card}>
                  <div style={S.sectionPad}>
                    <div style={S.sectionTitle}>Class Status</div>
                    <div style={S.sectionHelp}>
                      A single plain-language verdict based on evidence freshness and intervention load.
                    </div>

                    <div style={{ marginTop: 12, ...S.item }}>
                      <div style={{ fontSize: 22, fontWeight: 950, color: "#0f172a" }}>
                        {classStatus.label}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, color: "#475569", fontWeight: 800 }}>
                        {classStatus.text}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {widgets.evidenceIntake && (
                <div style={S.card}>
                  <div style={S.sectionPad}>
                    <div style={S.sectionTitle}>Evidence Intake</div>
                    <div style={S.sectionHelp}>
                      Capture evidence quickly now, while preparing for higher-value import and scan workflows later.
                    </div>

                    <div style={S.list}>
                      <div style={S.item}>
                        <div style={{ fontWeight: 950, color: "#0f172a" }}>Quick evidence entry</div>
                        <div style={{ marginTop: 6, fontSize: 13, color: "#475569", fontWeight: 800 }}>
                          Fast teacher notes, assessment observations, and learning moments.
                        </div>
                        <div style={{ ...S.row, marginTop: 10 }}>
                          <button style={S.btnMini} onClick={() => openQuickEvidence()}>
                            Open quick add
                          </button>
                        </div>
                      </div>

                      <div style={S.item}>
                        <div style={{ fontWeight: 950, color: "#0f172a" }}>Assessment import</div>
                        <div style={{ marginTop: 6, fontSize: 13, color: "#475569", fontWeight: 800 }}>
                          Import structured assessment results and map them into class evidence.
                        </div>
                        <div style={{ ...S.row, marginTop: 10 }}>
                          <button style={S.btnMini} onClick={openImportPage}>
                            Open import page
                          </button>
                        </div>
                      </div>

                      <div style={S.item}>
                        <div style={{ fontWeight: 950, color: "#0f172a" }}>Worksheet scan pipeline</div>
                        <div style={{ marginTop: 6, fontSize: 13, color: "#475569", fontWeight: 800 }}>
                          Premium-ready placeholder for future scan, AI extraction, and teacher verification workflows.
                        </div>
                        <div style={{ ...S.row, marginTop: 10 }}>
                          <button style={S.btnMini} onClick={scanWorksheetPlaceholder}>
                            Mark premium placeholder
                          </button>
                          <span style={S.chipMuted}>Future premium feature</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {widgets.interventionQueue && (
                <div style={S.card}>
                  <div style={S.sectionPad}>
                    <div style={S.sectionTitle}>Intervention Queue</div>
                    <div style={S.sectionHelp}>
                      Active intervention items needing review, follow-up, or next steps.
                    </div>

                    <div style={S.list}>
                      {openInterventions.length === 0 ? (
                        <div style={S.item}>No open interventions right now.</div>
                      ) : (
                        openInterventions.slice(0, 8).map((it) => {
                          const student = students.find((s) => safe(s.id) === safe(it.student_id));
                          const reviewDate = safe(it.review_due_on || it.review_due_date || it.next_review_on);

                          return (
                            <div key={it.id} style={S.item}>
                              <div style={{ fontWeight: 950, color: "#0f172a" }}>
                                {safe(it.title) || "Intervention"}
                              </div>
                              <div style={{ marginTop: 6, fontSize: 13, color: "#475569", fontWeight: 800 }}>
                                {student ? studentDisplayName(student) : "Class-level item"}
                                {safe(it.status) ? ` • ${safe(it.status)}` : ""}
                                {reviewDate ? ` • Review ${fmtDateShort(reviewDate)}` : ""}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {widgets.evidenceFeed && (
                <div style={S.card}>
                  <div style={S.sectionPad}>
                    <div style={S.sectionTitle}>Latest Evidence</div>
                    <div style={S.sectionHelp}>
                      Recent learning observations and assessment entries for this class.
                    </div>

                    <div style={S.list}>
                      {filteredEvidence.slice(0, 8).map((e) => {
                        const student = students.find((s) => safe(s.id) === safe(e.student_id));
                        return (
                          <div key={e.id} style={S.item}>
                            <div style={{ fontWeight: 950, color: "#0f172a" }}>
                              {safe(e.title) || "Evidence entry"}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 13, color: "#475569", fontWeight: 800 }}>
                              {student ? studentDisplayName(student) : "Unknown student"}
                              {safe(e.learning_area) ? ` • ${safe(e.learning_area)}` : ""}
                              {` • ${fmtDateShort(getEffectiveDate(e))}`}
                            </div>
                            {(safe(e.summary) || safe(e.body)) && (
                              <div style={{ marginTop: 8, fontSize: 13, color: "#334155", fontWeight: 800 }}>
                                {safe(e.summary) || safe(e.body)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "students" && (
          <div style={{ ...S.card, marginTop: 14 }}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Student List</div>
              <div style={S.sectionHelp}>
                Ordered by priority so the students most likely to need attention appear first.
              </div>

              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Student</th>
                      <th style={S.th}>Risk</th>
                      <th style={S.th}>Latest Evidence</th>
                      <th style={S.th}>Maths Evidence</th>
                      <th style={S.th}>Open Interventions</th>
                      <th style={S.th}>Flags</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentRows.map((r) => (
                      <tr key={r.student.id}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 950, color: "#0f172a" }}>{studentDisplayName(r.student)}</div>
                        </td>
                        <td style={S.td}>
                          <span style={S.chip}>{r.risk}</span>
                        </td>
                        <td style={S.td}>
                          {r.hasNoEvidence ? "No evidence yet" : `${r.latestEvidenceDays} day${r.latestEvidenceDays === 1 ? "" : "s"} ago`}
                        </td>
                        <td style={S.td}>{r.mathsEvidenceCount}</td>
                        <td style={S.td}>{r.openInterventions.length}</td>
                        <td style={S.td}>
                          <div style={S.row}>
                            {asBool(r.student.is_ilp) ? <span style={S.chipMuted}>ILP</span> : null}
                            {r.hasNoEvidence ? <span style={S.chipMuted}>No evidence</span> : null}
                          </div>
                        </td>
                        <td style={S.td}>
                          <div style={S.row}>
                            <button style={S.btnMini} onClick={() => openQuickEvidence(r.student.id)}>
                              Add evidence
                            </button>
                            <button
                              style={S.btnMini}
                              onClick={() => openInterventionEntry(r.student.id, "Support plan / follow-up")}
                            >
                              Add intervention
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredStudentRows.length === 0 && (
                      <tr>
                        <td style={S.td} colSpan={7}>
                          No students match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === "evidence" && (
          <div style={{ ...S.card, marginTop: 14 }}>
            <div style={S.sectionPad}>
              <div style={{ ...S.row, justifyContent: "space-between" }}>
                <div>
                  <div style={S.sectionTitle}>Evidence Feed</div>
                  <div style={S.sectionHelp}>
                    Recent evidence entries for this class, with student and learning area context.
                  </div>
                </div>

                <div style={{ minWidth: 220 }}>
                  <select
                    style={S.select}
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                  >
                    <option value="ALL">All learning areas</option>
                    {learningAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={S.list}>
                {filteredEvidence.length === 0 ? (
                  <div style={S.item}>No evidence matches the current filters.</div>
                ) : (
                  filteredEvidence.map((e) => {
                    const student = students.find((s) => safe(s.id) === safe(e.student_id));
                    return (
                      <div key={e.id} style={S.item}>
                        <div style={{ ...S.row, justifyContent: "space-between" }}>
                          <div style={{ fontWeight: 950, color: "#0f172a" }}>
                            {safe(e.title) || "Evidence entry"}
                          </div>
                          <span style={S.chipMuted}>{fmtDateShort(getEffectiveDate(e))}</span>
                        </div>

                        <div style={{ marginTop: 6, fontSize: 13, color: "#475569", fontWeight: 800 }}>
                          {student ? studentDisplayName(student) : "Unknown student"}
                          {safe(e.learning_area) ? ` • ${safe(e.learning_area)}` : ""}
                        </div>

                        {(safe(e.summary) || safe(e.body)) && (
                          <div style={{ marginTop: 8, fontSize: 13, color: "#334155", fontWeight: 800, lineHeight: 1.45 }}>
                            {safe(e.summary) || safe(e.body)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === "interventions" && (
          <div style={{ ...S.card, marginTop: 14 }}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Interventions</div>
              <div style={S.sectionHelp}>
                Support items currently attached to this class, ordered by recency.
              </div>

              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Title</th>
                      <th style={S.th}>Student</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Priority</th>
                      <th style={S.th}>Due</th>
                      <th style={S.th}>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interventions.map((it) => {
                      const student = students.find((s) => safe(s.id) === safe(it.student_id));
                      return (
                        <tr key={it.id}>
                          <td style={S.td}>{safe(it.title) || "Intervention"}</td>
                          <td style={S.td}>{student ? studentDisplayName(student) : "Class-level"}</td>
                          <td style={S.td}>{safe(it.status) || "—"}</td>
                          <td style={S.td}>{safe(it.priority) || "—"}</td>
                          <td style={S.td}>{fmtDateShort(it.due_on)}</td>
                          <td style={S.td}>{fmtDateShort(it.review_due_on || it.review_due_date || it.next_review_on)}</td>
                        </tr>
                      );
                    })}

                    {interventions.length === 0 && (
                      <tr>
                        <td style={S.td} colSpan={6}>
                          No interventions found for this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === "coverage" && (
          <div style={{ ...S.card, marginTop: 14 }}>
            <div style={S.sectionPad}>
              <div style={S.sectionTitle}>Coverage Map</div>
              <div style={S.sectionHelp}>
                A quick evidence freshness and coverage view to help spot students or learning areas being missed.
              </div>

              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Student</th>
                      {learningAreas.map((a) => (
                        <th key={a} style={S.th}>
                          {a}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coverageRows.map((row) => (
                      <tr key={row.student.id}>
                        <td style={S.td}>{studentDisplayName(row.student)}</td>
                        {row.counts.map((count, i) => (
                          <td key={`${row.student.id}-${i}`} style={S.td}>
                            <span
                              style={{
                                ...S.chipMuted,
                                background: count === 0 ? "#fff7ed" : count >= 3 ? "#ecfdf5" : "#f8fafc",
                                borderColor: count === 0 ? "#fed7aa" : count >= 3 ? "#a7f3d0" : "#e2e8f0",
                                color: "#0f172a",
                              }}
                            >
                              {count}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}

                    {coverageRows.length === 0 && (
                      <tr>
                        <td style={S.td} colSpan={Math.max(1, learningAreas.length + 1)}>
                          No coverage data available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminClassHubPage() {
  return (
    <Suspense fallback={<AccessPageFallback />}>
      <AdminClassHubPageInner />
    </Suspense>
  );
}