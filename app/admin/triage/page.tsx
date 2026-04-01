"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import ModeSwitcher from "@/app/admin/components/ModeSwitcher";
import { supabase } from "@/lib/supabaseClient";

/* ───────────────────────── TYPES ───────────────────────── */

type AudienceLens = "teacher" | "leadership" | "homeschool";
type ViewDepth = "simple" | "standard" | "max";
type FocusDeck = "triage" | "coverage" | "reporting" | "support";

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
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  is_ilp?: boolean | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
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
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: string | number | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  review_date?: string | null;
  next_review_on?: string | null;
  due_on?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  note?: string | null;
  notes?: string | null;
  [k: string]: any;
};

type TriageRow = {
  studentId: string;
  studentName: string;
  classId: string | null;
  classLabel: string;
  isILP: boolean;
  totalEvidence: number;
  evidence30d: number;
  lastEvidenceAt: string | null;
  lastEvidenceDays: number | null;
  openPlans: number;
  overdueReviews: number;
  invisibleRisk: boolean;
  freshnessRisk: boolean;
  supportPressure: boolean;
  coverageRisk: boolean;
  reportingRisk: boolean;
  riskBand: "Low" | "Watch" | "High";
  riskScore: number;
  whyNow: string[];
  nextMove: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function num(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function studentName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name || s.first_name);
  const last = safe(s.surname || s.family_name);
  return `${first}${last ? ` ${last}` : ""}`.trim() || "Student";
}

function classLabel(c: ClassRow | null | undefined) {
  if (!c) return "Unassigned";
  const yr = c.year_level ? `Year ${c.year_level}` : "";
  const nm = safe(c.name);
  return [yr, nm].filter(Boolean).join(" • ") || "Class";
}

function shortDate(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return "—";
  return s.slice(0, 10);
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function pickReviewDate(i: InterventionRow) {
  return (
    safe(i.review_due_on) ||
    safe(i.review_due_date) ||
    safe(i.review_date) ||
    safe(i.next_review_on) ||
    safe(i.due_on) ||
    ""
  );
}

function isClosedStatus(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return ["completed", "cancelled", "closed", "resolved", "done", "archived"].includes(s);
}

function riskTone(band: "Low" | "Watch" | "High") {
  if (band === "High") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  if (band === "Watch") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#c2410c" };
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#047857" };
}

function percent(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function containsText(row: TriageRow, q: string) {
  const hay = [
    row.studentName,
    row.classLabel,
    row.riskBand,
    row.nextMove,
    ...row.whyNow,
  ]
    .join(" ")
    .toLowerCase();

  return hay.includes(q.toLowerCase());
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
  } as React.CSSProperties,

  main: {
    flex: 1,
    padding: 28,
    color: "#0f172a",
    maxWidth: 1600,
    width: "100%",
  } as React.CSSProperties,

  hero: {
    background: "linear-gradient(135deg, #ffffff 0%, #eef2ff 45%, #eff6ff 100%)",
    border: "1px solid #dbeafe",
    borderRadius: 22,
    padding: 24,
  } as React.CSSProperties,

  subtle: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  } as React.CSSProperties,

  h1: {
    margin: "8px 0 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.05,
  } as React.CSSProperties,

  sub: {
    marginTop: 10,
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.6,
    maxWidth: 980,
  } as React.CSSProperties,

  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 16,
  } as React.CSSProperties,

  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#2563eb",
    border: "none",
    color: "#fff",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
  } as React.CSSProperties,

  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 900,
    textDecoration: "none",
    cursor: "pointer",
  } as React.CSSProperties,

  controlCard: {
    marginTop: 16,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
  } as React.CSSProperties,

  controlGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 12,
    marginTop: 12,
  } as React.CSSProperties,

  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  } as React.CSSProperties,

  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    outline: "none",
  } as React.CSSProperties,

  segmentRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  segBtn: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
  } as React.CSSProperties,

  segBtnActive: {
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
  } as React.CSSProperties,

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 12,
    marginTop: 16,
  } as React.CSSProperties,

  statCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
  } as React.CSSProperties,

  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  statValue: {
    fontSize: 28,
    fontWeight: 950,
    marginTop: 6,
    color: "#0f172a",
  } as React.CSSProperties,

  statHelp: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.4,
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 16,
    marginTop: 16,
    alignItems: "start",
  } as React.CSSProperties,

  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 16,
    marginTop: 16,
  } as React.CSSProperties,

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
  } as React.CSSProperties,

  title: {
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 8,
  } as React.CSSProperties,

  sectionText: {
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.55,
    fontSize: 14,
    marginBottom: 12,
  } as React.CSSProperties,

  list: {
    display: "grid",
    gap: 10,
  } as React.CSSProperties,

  item: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
  } as React.CSSProperties,

  itemTitle: {
    fontWeight: 900,
    fontSize: 15,
    color: "#0f172a",
  } as React.CSSProperties,

  itemMeta: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.45,
  } as React.CSSProperties,

  chipRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 10,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    fontSize: 12,
    fontWeight: 900,
    color: "#4338ca",
  } as React.CSSProperties,

  empty: {
    background: "#ffffff",
    borderRadius: 14,
    padding: 20,
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 700,
  } as React.CSSProperties,

  tableWrap: {
    overflow: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    minWidth: 980,
  } as React.CSSProperties,

  th: {
    textAlign: "left" as const,
    padding: "12px 12px",
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  } as React.CSSProperties,

  td: {
    padding: "12px 12px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top" as const,
    fontSize: 14,
    color: "#0f172a",
  } as React.CSSProperties,

  pill: (band: "Low" | "Watch" | "High"): React.CSSProperties => {
    const t = riskTone(band);
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "5px 9px",
      borderRadius: 999,
      background: t.bg,
      border: `1px solid ${t.bd}`,
      color: t.fg,
      fontSize: 12,
      fontWeight: 900,
    };
  },
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function TriagePage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [busy, setBusy] = useState(false);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [audience, setAudience] = useState<AudienceLens>("teacher");
  const [viewDepth, setViewDepth] = useState<ViewDepth>("standard");
  const [focusDeck, setFocusDeck] = useState<FocusDeck>("triage");
  const [showOnlyILP, setShowOnlyILP] = useState(false);

  useEffect(() => {
    async function load() {
      setBusy(true);
      try {
        const classQueries = [
          supabase.from("classes").select("id,name,year_level,teacher_name,room").order("year_level", { ascending: true }).order("name"),
          supabase.from("classes").select("id,name,year_level,room").order("year_level", { ascending: true }).order("name"),
          supabase.from("classes").select("id,name").order("name"),
        ];

        let loadedClasses: ClassRow[] = [];
        for (const q of classQueries) {
          const r = await q;
          if (!r.error) {
            loadedClasses = (r.data as ClassRow[]) ?? [];
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        const studentQueries = [
          supabase.from("students").select("id,class_id,preferred_name,first_name,surname,family_name,year_level,is_ilp"),
          supabase.from("students").select("id,class_id,preferred_name,first_name,surname,year_level,is_ilp"),
          supabase.from("students").select("id,class_id,preferred_name,first_name,is_ilp"),
        ];

        let loadedStudents: StudentRow[] = [];
        for (const q of studentQueries) {
          const r = await q;
          if (!r.error) {
            loadedStudents = (r.data as StudentRow[]) ?? [];
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        const evidenceQueries = [
          supabase
            .from("evidence_entries")
            .select("id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,is_deleted")
            .eq("is_deleted", false),
          supabase
            .from("evidence_entries")
            .select("id,student_id,class_id,title,learning_area,occurred_on,created_at"),
        ];

        let loadedEvidence: EvidenceRow[] = [];
        for (const q of evidenceQueries) {
          const r = await q;
          if (!r.error) {
            loadedEvidence = ((r.data as EvidenceRow[]) ?? []).filter((x) => x.is_deleted !== true);
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        const interventionQueries = [
          supabase
            .from("interventions")
            .select("id,student_id,class_id,title,status,priority,tier,review_due_on,review_due_date,review_date,next_review_on,due_on,created_at,updated_at,note,notes")
            .order("created_at", { ascending: false }),
          supabase
            .from("interventions")
            .select("id,student_id,class_id,title,status,due_on,created_at")
            .order("created_at", { ascending: false }),
        ];

        let loadedInterventions: InterventionRow[] = [];
        for (const q of interventionQueries) {
          const r = await q;
          if (!r.error) {
            loadedInterventions = (r.data as InterventionRow[]) ?? [];
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        setClasses(loadedClasses);
        setStudents(loadedStudents);
        setEvidence(loadedEvidence);
        setInterventions(loadedInterventions);
      } catch (e) {
        console.error(e);
      } finally {
        setBusy(false);
      }
    }

    load();
  }, []);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassRow>();
    classes.forEach((c) => map.set(safe(c.id), c));
    return map;
  }, [classes]);

  const triageRows = useMemo<TriageRow[]>(() => {
    const evidenceByStudent: Record<string, EvidenceRow[]> = {};
    evidence.forEach((e) => {
      const id = safe(e.student_id);
      if (!id) return;
      if (!evidenceByStudent[id]) evidenceByStudent[id] = [];
      evidenceByStudent[id].push(e);
    });

    const interventionsByStudent: Record<string, InterventionRow[]> = {};
    interventions.forEach((i) => {
      const id = safe(i.student_id);
      if (!id) return;
      if (!interventionsByStudent[id]) interventionsByStudent[id] = [];
      interventionsByStudent[id].push(i);
    });

    return students
      .map((student) => {
        const sid = safe(student.id);
        const classRow = classMap.get(safe(student.class_id)) || null;
        const studentEvidence = (evidenceByStudent[sid] || []).slice().sort((a, b) => {
          const ad = safe(a.occurred_on || a.created_at);
          const bd = safe(b.occurred_on || b.created_at);
          return bd.localeCompare(ad);
        });

        const studentInterventions = interventionsByStudent[sid] || [];

        const totalEvidence = studentEvidence.length;
        const lastEvidenceAt = studentEvidence[0]
          ? safe(studentEvidence[0].occurred_on || studentEvidence[0].created_at) || null
          : null;
        const lastEvidenceDays = daysSince(lastEvidenceAt);

        const evidence30d = studentEvidence.filter((e) => {
          const d = daysSince(e.occurred_on || e.created_at);
          return d != null && d <= 30;
        }).length;

        const openPlans = studentInterventions.filter((i) => !isClosedStatus(i.status)).length;

        const overdueReviews = studentInterventions.filter((i) => {
          if (isClosedStatus(i.status)) return false;
          const review = pickReviewDate(i);
          const d = daysSince(review);
          if (d == null) return false;
          return d > 0;
        }).length;

        const invisibleRisk = totalEvidence === 0;
        const freshnessRisk = lastEvidenceDays == null || lastEvidenceDays > 30 || evidence30d === 0;
        const supportPressure = openPlans >= 2 || overdueReviews >= 1;
        const coverageRisk = totalEvidence < 2 || evidence30d === 0;
        const reportingRisk = freshnessRisk || coverageRisk || overdueReviews > 0;

        let riskScore = 0;
        if (student.is_ilp) riskScore += 8;
        if (invisibleRisk) riskScore += 35;
        if (freshnessRisk) riskScore += 20;
        if (coverageRisk) riskScore += 12;
        if (openPlans >= 1) riskScore += openPlans * 5;
        if (overdueReviews >= 1) riskScore += overdueReviews * 12;
        if (lastEvidenceDays != null && lastEvidenceDays > 60) riskScore += 10;

        const whyNow: string[] = [];
        if (invisibleRisk) whyNow.push("No evidence recorded");
        if (freshnessRisk) whyNow.push("Fresh evidence is thin");
        if (coverageRisk) whyNow.push("Coverage is weak");
        if (openPlans > 0) whyNow.push(`${openPlans} open support plan${openPlans === 1 ? "" : "s"}`);
        if (overdueReviews > 0) whyNow.push(`${overdueReviews} overdue review${overdueReviews === 1 ? "" : "s"}`);
        if (student.is_ilp) whyNow.push("ILP profile");

        let riskBand: "Low" | "Watch" | "High" = "Low";
        if (riskScore >= 45) riskBand = "High";
        else if (riskScore >= 20) riskBand = "Watch";

        let nextMove = "Maintain evidence flow";
        if (riskBand === "High" && overdueReviews > 0) nextMove = "Clear overdue review and refresh evidence";
        else if (riskBand === "High" && invisibleRisk) nextMove = "Add first evidence and check support needs";
        else if (riskBand === "High") nextMove = "Prioritise this learner today";
        else if (riskBand === "Watch" && freshnessRisk) nextMove = "Add fresh evidence soon";
        else if (riskBand === "Watch") nextMove = "Monitor and tighten coverage";

        return {
          studentId: sid,
          studentName: studentName(student),
          classId: safe(student.class_id) || null,
          classLabel: classLabel(classRow),
          isILP: !!student.is_ilp,
          totalEvidence,
          evidence30d,
          lastEvidenceAt,
          lastEvidenceDays,
          openPlans,
          overdueReviews,
          invisibleRisk,
          freshnessRisk,
          supportPressure,
          coverageRisk,
          reportingRisk,
          riskBand,
          riskScore,
          whyNow,
          nextMove,
        };
      })
      .filter((row) => {
        if (classFilter !== "All" && row.classId !== classFilter) return false;
        if (riskFilter !== "All" && row.riskBand !== riskFilter) return false;
        if (showOnlyILP && !row.isILP) return false;
        if (search && !containsText(row, search)) return false;
        return true;
      })
      .sort((a, b) => {
        const rank = { High: 3, Watch: 2, Low: 1 };
        return (
          rank[b.riskBand] - rank[a.riskBand] ||
          b.riskScore - a.riskScore ||
          a.studentName.localeCompare(b.studentName)
        );
      });
  }, [students, evidence, interventions, classMap, classFilter, riskFilter, showOnlyILP, search]);

  const stats = useMemo(() => {
    const high = triageRows.filter((r) => r.riskBand === "High").length;
    const watch = triageRows.filter((r) => r.riskBand === "Watch").length;
    const invisible = triageRows.filter((r) => r.invisibleRisk).length;
    const overdue = triageRows.reduce((sum, r) => sum + r.overdueReviews, 0);
    const ilp = triageRows.filter((r) => r.isILP).length;
    const evidenceFresh = triageRows.filter((r) => !r.freshnessRisk).length;

    return {
      visibleStudents: triageRows.length,
      high,
      watch,
      invisible,
      overdue,
      ilp,
      freshPct: percent(evidenceFresh, triageRows.length || 1),
    };
  }, [triageRows]);

  const deckRows = useMemo(() => {
    if (focusDeck === "coverage") {
      return triageRows.filter((r) => r.coverageRisk || r.invisibleRisk);
    }
    if (focusDeck === "reporting") {
      return triageRows.filter((r) => r.reportingRisk);
    }
    if (focusDeck === "support") {
      return triageRows.filter((r) => r.supportPressure || r.overdueReviews > 0);
    }
    return triageRows;
  }, [triageRows, focusDeck]);

  const audienceHelp = useMemo(() => {
    if (audience === "leadership") {
      return "Leadership lens emphasises system pressure, weak coverage, overdue reviews, and triage across classes.";
    }
    if (audience === "homeschool") {
      return "Homeschool lens keeps the queue simpler and more evidence / reporting focused rather than overly school-operational.";
    }
    return "Teacher lens emphasises who needs attention next and what action to take today.";
  }, [audience]);

  const topActions = useMemo(() => {
    const actions: string[] = [];

    if (stats.high > 0) actions.push(`${stats.high} learner${stats.high === 1 ? "" : "s"} should be triaged first.`);
    if (stats.overdue > 0) actions.push(`${stats.overdue} overdue review${stats.overdue === 1 ? "" : "s"} need clearing.`);
    if (stats.invisible > 0) actions.push(`${stats.invisible} learner${stats.invisible === 1 ? "" : "s"} have no evidence.`);
    if (stats.freshPct < 70) actions.push(`Evidence freshness is below ideal at ${stats.freshPct}%.`);

    if (!actions.length) actions.push("Queue is stable. Maintain regular evidence flow and support review hygiene.");

    return actions.slice(0, 4);
  }, [stats]);

  const simpleRows = deckRows.slice(0, 12);
  const maxRows = deckRows.slice(0, 20);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <ModeSwitcher mode="school" />

        <section style={S.hero}>
          <div style={S.subtle}>MAX Triage Queue</div>
          <h1 style={S.h1}>Priority Triage Queue</h1>
          <div style={S.sub}>
            A cross-sector triage surface inspired by health and operations systems. It helps teachers, leaders, and homeschool users surface who needs attention next — while still allowing the dashboard to stay simple when needed.
          </div>

          <div style={S.heroActions}>
            <Link href="/admin/command-centre" style={S.btn}>
              Open Teacher Command Centre
            </Link>
            <Link href="/admin/leadership" style={S.btnGhost}>
              Open Leadership
            </Link>
            <button style={S.btnGhost} onClick={() => window.location.reload()}>
              {busy ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        <section style={S.controlCard}>
          <div style={S.title}>Self-selected dashboard controls</div>
          <div style={S.sectionText}>
            {audienceHelp}
          </div>

          <div style={S.controlGrid}>
            <div style={S.field}>
              <div style={S.label}>Search</div>
              <input
                style={S.input}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Student, class, risk..."
              />
            </div>

            <div style={S.field}>
              <div style={S.label}>Class</div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                style={S.input}
              >
                <option value="All">All classes</option>
                {classes.map((c) => (
                  <option key={safe(c.id)} value={safe(c.id)}>
                    {classLabel(c)}
                  </option>
                ))}
              </select>
            </div>

            <div style={S.field}>
              <div style={S.label}>Risk</div>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                style={S.input}
              >
                <option value="All">All risk levels</option>
                <option value="High">High</option>
                <option value="Watch">Watch</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div style={S.field}>
              <div style={S.label}>Audience lens</div>
              <div style={S.segmentRow}>
                {(["teacher", "leadership", "homeschool"] as AudienceLens[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAudience(a)}
                    style={audience === a ? S.segBtnActive : S.segBtn}
                  >
                    {a === "teacher" ? "Teacher" : a === "leadership" ? "Leadership" : "Homeschool"}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.field}>
              <div style={S.label}>View depth</div>
              <div style={S.segmentRow}>
                {(["simple", "standard", "max"] as ViewDepth[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setViewDepth(v)}
                    style={viewDepth === v ? S.segBtnActive : S.segBtn}
                  >
                    {v === "simple" ? "Simple" : v === "standard" ? "Standard" : "MAX"}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.field}>
              <div style={S.label}>Focus deck</div>
              <div style={S.segmentRow}>
                {(["triage", "coverage", "reporting", "support"] as FocusDeck[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFocusDeck(d)}
                    style={focusDeck === d ? S.segBtnActive : S.segBtn}
                  >
                    {d === "triage"
                      ? "Triage"
                      : d === "coverage"
                        ? "Coverage"
                        : d === "reporting"
                          ? "Reporting"
                          : "Support"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ ...S.segmentRow, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setShowOnlyILP((v) => !v)}
              style={showOnlyILP ? S.segBtnActive : S.segBtn}
            >
              {showOnlyILP ? "ILP only: ON" : "ILP only"}
            </button>
          </div>
        </section>

        <div style={S.statGrid}>
          <div style={S.statCard}>
            <div style={S.statLabel}>
              {audience === "leadership" ? "Learners shown" : audience === "homeschool" ? "Children shown" : "Queue size"}
            </div>
            <div style={S.statValue}>{stats.visibleStudents}</div>
            <div style={S.statHelp}>Filtered learners in the current triage view.</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statLabel}>High priority</div>
            <div style={S.statValue}>{stats.high}</div>
            <div style={S.statHelp}>Highest urgency learners in the current queue.</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statLabel}>Watch list</div>
            <div style={S.statValue}>{stats.watch}</div>
            <div style={S.statHelp}>Learners needing closer attention soon.</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statLabel}>
              {audience === "homeschool" ? "No evidence yet" : "Invisible"}
            </div>
            <div style={S.statValue}>{stats.invisible}</div>
            <div style={S.statHelp}>Learners with no evidence currently visible.</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statLabel}>Overdue reviews</div>
            <div style={S.statValue}>{stats.overdue}</div>
            <div style={S.statHelp}>Support reviews that have slipped past due.</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statLabel}>Fresh evidence</div>
            <div style={S.statValue}>{stats.freshPct}%</div>
            <div style={S.statHelp}>Learners without major evidence freshness concern.</div>
          </div>
        </div>

        <div style={S.grid2}>
          <section style={S.card}>
            <div style={S.title}>Priority queue</div>
            <div style={S.sectionText}>
              The queue changes based on the selected audience lens, focus deck, and view depth so the dashboard can stay powerful without always being heavy.
            </div>

            {viewDepth === "simple" ? (
              <div style={S.list}>
                {simpleRows.map((row) => (
                  <div key={row.studentId} style={S.item}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={S.itemTitle}>{row.studentName}</div>
                        <div style={S.itemMeta}>{row.classLabel}</div>
                      </div>
                      <span style={S.pill(row.riskBand)}>{row.riskBand}</span>
                    </div>

                    <div style={S.itemMeta}>
                      {audience === "homeschool"
                        ? `Next move: ${row.nextMove}`
                        : `Why now: ${row.whyNow[0] || row.nextMove}`}
                    </div>

                    <div style={S.chipRow}>
                      {row.isILP ? <span style={S.chip}>ILP</span> : null}
                      <span style={S.chip}>Evidence 30d {row.evidence30d}</span>
                      <span style={S.chip}>Open plans {row.openPlans}</span>
                    </div>
                  </div>
                ))}

                {simpleRows.length === 0 ? <div style={S.empty}>No learners match the current triage filters.</div> : null}
              </div>
            ) : viewDepth === "standard" ? (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Learner</th>
                      <th style={S.th}>Class</th>
                      <th style={S.th}>Risk</th>
                      <th style={S.th}>Evidence</th>
                      <th style={S.th}>Support</th>
                      <th style={S.th}>Next move</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deckRows.map((row) => (
                      <tr key={row.studentId}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 900 }}>{row.studentName}</div>
                          <div style={S.itemMeta}>
                            {row.isILP ? "ILP • " : ""}
                            Last evidence {row.lastEvidenceDays == null ? "—" : `${row.lastEvidenceDays}d ago`}
                          </div>
                        </td>
                        <td style={S.td}>{row.classLabel}</td>
                        <td style={S.td}>
                          <span style={S.pill(row.riskBand)}>{row.riskBand}</span>
                        </td>
                        <td style={S.td}>
                          <div>{row.evidence30d} in 30d</div>
                          <div style={S.itemMeta}>Total {row.totalEvidence}</div>
                        </td>
                        <td style={S.td}>
                          <div>Open {row.openPlans}</div>
                          <div style={S.itemMeta}>Overdue {row.overdueReviews}</div>
                        </td>
                        <td style={S.td}>{row.nextMove}</td>
                      </tr>
                    ))}

                    {deckRows.length === 0 ? (
                      <tr>
                        <td style={S.td} colSpan={6}>
                          <div style={S.empty}>No learners match the current triage filters.</div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={S.list}>
                {maxRows.map((row) => (
                  <div key={row.studentId} style={S.item}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <div>
                        <div style={S.itemTitle}>{row.studentName}</div>
                        <div style={S.itemMeta}>{row.classLabel}</div>
                      </div>
                      <span style={S.pill(row.riskBand)}>{row.riskBand}</span>
                    </div>

                    <div style={S.chipRow}>
                      {row.isILP ? <span style={S.chip}>ILP</span> : null}
                      {row.invisibleRisk ? <span style={S.chip}>Invisible</span> : null}
                      {row.freshnessRisk ? <span style={S.chip}>Freshness risk</span> : null}
                      {row.supportPressure ? <span style={S.chip}>Support pressure</span> : null}
                      {row.reportingRisk ? <span style={S.chip}>Reporting risk</span> : null}
                    </div>

                    <div style={S.itemMeta}>
                      Risk score {row.riskScore} • Evidence 30d {row.evidence30d} • Total evidence {row.totalEvidence} • Open plans {row.openPlans} • Overdue reviews {row.overdueReviews}
                    </div>

                    <div style={{ ...S.itemMeta, marginTop: 8 }}>
                      <strong>Why now:</strong> {row.whyNow.join(" • ") || "No urgent issue surfaced"}
                    </div>

                    <div style={{ ...S.itemMeta, marginTop: 8 }}>
                      <strong>Next move:</strong> {row.nextMove}
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/admin/students/${encodeURIComponent(row.studentId)}`} style={S.btnGhost}>
                        Open learner
                      </Link>
                      <Link href={`/admin/evidence-entry?studentId=${encodeURIComponent(row.studentId)}`} style={S.btnGhost}>
                        Add evidence
                      </Link>
                      <Link href="/admin/interventions" style={S.btnGhost}>
                        Open support plans
                      </Link>
                    </div>
                  </div>
                ))}

                {maxRows.length === 0 ? <div style={S.empty}>No learners match the current triage filters.</div> : null}
              </div>
            )}
          </section>

          <section style={{ display: "grid", gap: 16 }}>
            <section style={S.card}>
              <div style={S.title}>
                {audience === "leadership"
                  ? "System signals"
                  : audience === "homeschool"
                    ? "Reporting signals"
                    : "Today’s signals"}
              </div>
              <div style={S.list}>
                {topActions.map((action, i) => (
                  <div key={i} style={S.item}>
                    <div style={S.itemMeta}>{action}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={S.card}>
              <div style={S.title}>Focus deck summary</div>
              <div style={S.sectionText}>
                Current deck:{" "}
                <strong>
                  {focusDeck === "triage"
                    ? "Triage"
                    : focusDeck === "coverage"
                      ? "Coverage"
                      : focusDeck === "reporting"
                        ? "Reporting"
                        : "Support Load"}
                </strong>
              </div>

              <div style={S.list}>
                <div style={S.item}>
                  <div style={S.itemTitle}>Who is surfaced?</div>
                  <div style={S.itemMeta}>
                    {focusDeck === "triage" && "Highest overall urgency, combining evidence, support, and visibility risk."}
                    {focusDeck === "coverage" && "Learners with weak coverage, thin evidence, or no visible evidence."}
                    {focusDeck === "reporting" && "Learners most likely to weaken report confidence or portfolio defensibility."}
                    {focusDeck === "support" && "Learners with open plan pressure, overdue reviews, or support-load concern."}
                  </div>
                </div>

                <div style={S.item}>
                  <div style={S.itemTitle}>Why this matters</div>
                  <div style={S.itemMeta}>
                    {audience === "teacher" && "Keeps your daily attention targeted rather than scattered."}
                    {audience === "leadership" && "Surfaces operational pressure and blind spots before they spread across the system."}
                    {audience === "homeschool" && "Keeps the dashboard practical by focusing on evidence and reporting readiness rather than school bureaucracy."}
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>

        <div style={S.grid3}>
          <section style={S.card}>
            <div style={S.title}>Why this build matters</div>
            <div style={S.sectionText}>
              This is the first real triage surface in EduDecks: not just data display, but priority ordering. It borrows from health and operations systems while still letting users simplify what they see.
            </div>
          </section>

          <section style={S.card}>
            <div style={S.title}>Simple by design</div>
            <div style={S.sectionText}>
              The same page can run in Simple, Standard, or MAX view depth. That means teachers and homeschooling parents can keep things lighter, while leaders can open deeper operational detail when needed.
            </div>
          </section>

          <section style={S.card}>
            <div style={S.title}>Best next move</div>
            <div style={S.sectionText}>
              The strongest next build is a <strong>System Risk Radar</strong> so this triage queue sits inside a broader operational command layer.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}