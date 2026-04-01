"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLeftNav from "@/app/components/AdminLeftNav";
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
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  year_level?: number | null;
  [k: string]: any;
};

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
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
  review_date?: string | null;
  review_due_on?: string | null;
  due_on?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: any;
};

type TriageItem = {
  id: string;
  title: string;
  text: string;
  tone: "low" | "watch" | "high";
  href?: string;
  cta?: string;
};

type PredictiveSignal = {
  id: string;
  title: string;
  text: string;
  tone: "low" | "watch" | "high";
};

type ResourcePressureRow = {
  classId: string;
  classLabel: string;
  teacher: string;
  studentCount: number;
  visiblePct: number;
  overdueReviews: number;
  ilpCount: number;
  pressureScore: number;
  recommendation: string;
};

type AuthoritySummary = {
  readinessPct: number;
  status: "low" | "watch" | "high";
  evidenceCoveragePct: number;
  visibleStudentPct: number;
  overdueReviewCount: number;
  projectedGapCount: number;
  text: string;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("does not exist") &&
    (msg.includes("relation") || msg.includes("column"))
  );
}

function studentName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name
  )}`.trim() || "Student";
}

function classLabel(c: ClassRow | null | undefined) {
  if (!c) return "Class";
  const bits = [c.year_level ? `Year ${c.year_level}` : "", safe(c.name)].filter(Boolean);
  return bits.join(" • ") || "Class";
}

function shortDate(v: string | null | undefined) {
  return safe(v).slice(0, 10) || "—";
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return 999;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function dateOfEvidence(e: EvidenceRow) {
  return safe(e.occurred_on || e.created_at);
}

function isClosedStatus(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return ["completed", "cancelled", "closed", "resolved", "done", "archived"].includes(s);
}

function riskTone(level: "low" | "watch" | "high") {
  if (level === "high") return { bg: "#7f1d1d", bd: "#b91c1c", fg: "#fecaca" };
  if (level === "watch") return { bg: "#78350f", bd: "#d97706", fg: "#fde68a" };
  return { bg: "#14532d", bd: "#16a34a", fg: "#bbf7d0" };
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
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
    maxWidth: 1540,
    width: "100%",
  } as React.CSSProperties,

  hero: {
    background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 50%, #eef2ff 100%)",
    border: "1px solid #dbeafe",
    borderRadius: 22,
    padding: 24,
    marginBottom: 18,
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

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 12,
    marginTop: 18,
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
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginTop: 16,
    alignItems: "start",
  } as React.CSSProperties,

  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: 16,
    marginTop: 16,
    alignItems: "start",
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
    marginBottom: 10,
  } as React.CSSProperties,

  sectionText: {
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: 14,
    marginBottom: 12,
  } as React.CSSProperties,

  launchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: 12,
  } as React.CSSProperties,

  launchCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gap: 10,
  } as React.CSSProperties,

  launchTitle: {
    fontWeight: 900,
    fontSize: 16,
    color: "#0f172a",
  } as React.CSSProperties,

  launchText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 700,
  } as React.CSSProperties,

  launchActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  } as React.CSSProperties,

  smallBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 10px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontWeight: 900,
    textDecoration: "none",
    fontSize: 13,
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
    fontWeight: 850,
    fontSize: 14,
    color: "#0f172a",
  } as React.CSSProperties,

  itemMeta: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
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

  pill: (level: "low" | "watch" | "high"): React.CSSProperties => {
    const t = riskTone(level);
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

  empty: {
    background: "#ffffff",
    borderRadius: 14,
    padding: 20,
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 700,
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function AdminHomePage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      setBusy(true);
      try {
        const classQueries = [
          supabase
            .from("classes")
            .select("id,name,year_level,teacher_name,room")
            .order("year_level", { ascending: true })
            .order("name"),
          supabase
            .from("classes")
            .select("id,name,year_level,room")
            .order("year_level", { ascending: true })
            .order("name"),
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
          supabase
            .from("students")
            .select("id,class_id,preferred_name,first_name,surname,family_name,is_ilp,year_level"),
          supabase
            .from("students")
            .select("id,class_id,preferred_name,first_name,surname,is_ilp,year_level"),
          supabase
            .from("students")
            .select("id,class_id,preferred_name,first_name,is_ilp,year_level"),
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
            .select("id,student_id,class_id,title,learning_area,occurred_on,created_at,is_deleted")
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
            .select("id,student_id,class_id,title,status,review_date,review_due_on,due_on,created_at,updated_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("interventions")
            .select("id,student_id,class_id,title,status,created_at")
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

  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = students.length;
    const totalEvidence = evidence.length;
    const totalILP = students.filter((s) => s.is_ilp).length;

    const invisibleStudents = students.filter(
      (s) => !evidence.some((e) => safe(e.student_id) === safe(s.id))
    ).length;

    const overdueReviews = interventions.filter((i) => {
      const due = safe(i.review_due_on || i.review_date || i.due_on);
      if (!due) return false;
      return new Date(due).getTime() < Date.now() && !isClosedStatus(i.status);
    }).length;

    return {
      totalClasses,
      totalStudents,
      totalEvidence,
      totalILP,
      invisibleStudents,
      overdueReviews,
    };
  }, [classes, students, evidence, interventions]);

  const studentEvidenceMap = useMemo(() => {
    const map = new Map<string, EvidenceRow[]>();
    for (const e of evidence) {
      const sid = safe(e.student_id);
      if (!sid) continue;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(e);
    }
    for (const [sid, rows] of map.entries()) {
      rows.sort((a, b) => dateOfEvidence(b).localeCompare(dateOfEvidence(a)));
      map.set(sid, rows);
    }
    return map;
  }, [evidence]);

  const studentInterventionMap = useMemo(() => {
    const map = new Map<string, InterventionRow[]>();
    for (const i of interventions) {
      const sid = safe(i.student_id);
      if (!sid) continue;
      if (!map.has(sid)) map.set(sid, []);
      map.get(sid)!.push(i);
    }
    return map;
  }, [interventions]);

  const recentEvidence = useMemo(() => {
    return evidence
      .slice()
      .sort((a, b) => dateOfEvidence(b).localeCompare(dateOfEvidence(a)))
      .slice(0, 8);
  }, [evidence]);

  const launchCards = useMemo(() => {
    return [
      {
        title: "School Mode",
        text: "Leadership, class heatmaps, student hubs, interventions, and report workflows.",
        links: [
          { label: "Leadership", href: "/admin/leadership" },
          { label: "Leadership Heatmap", href: "/admin/leadership/heatmap" },
          { label: "Evidence Feed", href: "/admin/evidence-feed" },
        ],
      },
      {
        title: "Family Mode",
        text: "Parent dashboard, homeschool reporting, print centre, and family-friendly evidence views.",
        links: [
          { label: "Parent Dashboard", href: "/admin/parent-dashboard" },
          { label: "Homeschool Reporting", href: "/admin/homeschool-reporting" },
          { label: "Family Print Centre", href: "/admin/family-print-centre" },
        ],
      },
      {
        title: "Capture & Input",
        text: "Fast pathways for adding evidence and driving all downstream analytics and reporting.",
        links: [
          { label: "Add Evidence", href: "/admin/evidence-entry" },
          { label: "Evidence Feed", href: "/admin/evidence-feed" },
        ],
      },
      {
        title: "Outputs & Reports",
        text: "Portfolio, print, and report-generation surfaces for meetings, moderation, and submissions.",
        links: [
          { label: "Reporting", href: "/admin/reporting" },
          { label: "Family Print Centre", href: "/admin/family-print-centre" },
        ],
      },
    ];
  }, []);

  const classHotspots = useMemo(() => {
    return classes
      .map((c) => {
        const classStudents = students.filter((s) => safe(s.class_id) === safe(c.id));
        const classEvidence = evidence.filter((e) => safe(e.class_id) === safe(c.id));
        const visible = new Set(classEvidence.map((e) => safe(e.student_id)).filter(Boolean)).size;
        const coverage = classStudents.length ? Math.round((visible / classStudents.length) * 100) : 0;

        let risk: "low" | "watch" | "high" = "low";
        if (coverage < 40) risk = "high";
        else if (coverage < 70) risk = "watch";

        return {
          klass: c,
          studentCount: classStudents.length,
          evidenceCount: classEvidence.length,
          coverage,
          risk,
        };
      })
      .sort((a, b) => {
        const m = { high: 3, watch: 2, low: 1 };
        return m[b.risk] - m[a.risk] || a.coverage - b.coverage;
      })
      .slice(0, 6);
  }, [classes, students, evidence]);

  const predictiveSignals = useMemo<PredictiveSignal[]>(() => {
    const last30Evidence = evidence.filter((e) => daysSince(dateOfEvidence(e)) <= 30).length;
    const prev30Evidence = evidence.filter((e) => {
      const d = daysSince(dateOfEvidence(e));
      return d > 30 && d <= 60;
    }).length;

    const momentumDelta = last30Evidence - prev30Evidence;

    const projectedReportingGaps = students.filter((s) => {
      const list = studentEvidenceMap.get(safe(s.id)) ?? [];
      const fresh = list.filter((e) => daysSince(dateOfEvidence(e)) <= 30).length;
      return fresh === 0 || list.length < 2;
    }).length;

    const decayStudents = students.filter((s) => {
      const list = studentInterventionMap.get(safe(s.id)) ?? [];
      const active = list.filter((i) => !isClosedStatus(i.status));
      if (active.length === 0) return false;
      const latestEvidenceDays = daysSince(
        studentEvidenceMap.get(safe(s.id))?.[0]
          ? dateOfEvidence(studentEvidenceMap.get(safe(s.id))![0])
          : null
      );
      return latestEvidenceDays > 30;
    }).length;

    const riskTrajectoryStudents = students.filter((s) => {
      const list = studentEvidenceMap.get(safe(s.id)) ?? [];
      const ivs = studentInterventionMap.get(safe(s.id)) ?? [];
      const latestEvidenceDays = daysSince(list[0] ? dateOfEvidence(list[0]) : null);
      const overdue = ivs.filter((i) => {
        const due = safe(i.review_due_on || i.review_date || i.due_on);
        if (!due || isClosedStatus(i.status)) return false;
        return new Date(due).getTime() < Date.now();
      }).length;
      return latestEvidenceDays > 45 || overdue > 0;
    }).length;

    return [
      {
        id: "momentum",
        title: "Evidence momentum",
        text:
          momentumDelta < 0
            ? `Evidence volume is down ${Math.abs(momentumDelta)} compared with the previous 30-day window.`
            : momentumDelta > 0
            ? `Evidence volume is up ${momentumDelta} on the previous 30-day window.`
            : "Evidence volume is flat across the last two 30-day windows.",
        tone: momentumDelta < -5 ? "high" : momentumDelta < 0 ? "watch" : "low",
      },
      {
        id: "reporting-gaps",
        title: "Projected reporting gaps",
        text: `${projectedReportingGaps} students are likely to present weak reporting confidence if no new evidence is added soon.`,
        tone: projectedReportingGaps >= 8 ? "high" : projectedReportingGaps >= 4 ? "watch" : "low",
      },
      {
        id: "intervention-decay",
        title: "Intervention effectiveness decay",
        text: `${decayStudents} students have active support plans but weak recent evidence activity, suggesting support impact may be decaying.`,
        tone: decayStudents >= 6 ? "high" : decayStudents >= 3 ? "watch" : "low",
      },
      {
        id: "risk-trajectory",
        title: "Student risk trajectories",
        text: `${riskTrajectoryStudents} students show combined recency/review signals that could escalate into stronger intervention pressure.`,
        tone: riskTrajectoryStudents >= 8 ? "high" : riskTrajectoryStudents >= 4 ? "watch" : "low",
      },
    ];
  }, [evidence, students, studentEvidenceMap, studentInterventionMap]);

  const triageQueue = useMemo<TriageItem[]>(() => {
    const items: TriageItem[] = [];

    const invisible = students
      .map((s) => ({
        student: s,
        evidenceCount: (studentEvidenceMap.get(safe(s.id)) ?? []).length,
      }))
      .filter((x) => x.evidenceCount === 0)
      .slice(0, 3);

    invisible.forEach((x) => {
      items.push({
        id: `invisible-${safe(x.student.id)}`,
        title: `Capture first evidence for ${studentName(x.student)}`,
        text: "This student has no visible evidence footprint yet. Add at least one evidence item to improve visibility and future reporting confidence.",
        tone: "high",
        href: "/admin/evidence-entry",
        cta: "Add evidence",
      });
    });

    const overdue = interventions
      .filter((i) => {
        const due = safe(i.review_due_on || i.review_date || i.due_on);
        if (!due || isClosedStatus(i.status)) return false;
        return new Date(due).getTime() < Date.now();
      })
      .slice(0, 4);

    overdue.forEach((i) => {
      items.push({
        id: `overdue-${safe(i.id)}`,
        title: safe(i.title) || "Review overdue intervention",
        text: "This intervention is overdue for review and is increasing support pressure.",
        tone: "high",
        href: "/admin/interventions",
        cta: "Open interventions",
      });
    });

    const weakCoverageClasses = classHotspots.filter((c) => c.risk !== "low").slice(0, 3);
    weakCoverageClasses.forEach((c) => {
      items.push({
        id: `class-${safe(c.klass.id)}`,
        title: `${classLabel(c.klass)} needs evidence coverage lift`,
        text: `Coverage is ${c.coverage}%. This class likely needs capture attention before reporting and moderation pressure increases.`,
        tone: c.risk === "high" ? "high" : "watch",
        href: `/admin/classes/${encodeURIComponent(safe(c.klass.id))}`,
        cta: "Open class",
      });
    });

    if (items.length === 0) {
      items.push({
        id: "clear",
        title: "No urgent triage actions today",
        text: "Core admin signals look stable. Maintain evidence freshness and monitor review cadence.",
        tone: "low",
      });
    }

    return items.slice(0, 10);
  }, [students, studentEvidenceMap, interventions, classHotspots]);

  const resourceAllocation = useMemo<ResourcePressureRow[]>(() => {
    return classes
      .map((c) => {
        const classStudents = students.filter((s) => safe(s.class_id) === safe(c.id));
        const classEvidence = evidence.filter((e) => safe(e.class_id) === safe(c.id));
        const classInterventions = interventions.filter((i) => safe(i.class_id) === safe(c.id));

        const visibleStudents = new Set(classEvidence.map((e) => safe(e.student_id)).filter(Boolean)).size;
        const visiblePct = percent(visibleStudents, Math.max(1, classStudents.length));
        const overdueReviews = classInterventions.filter((i) => {
          const due = safe(i.review_due_on || i.review_date || i.due_on);
          if (!due || isClosedStatus(i.status)) return false;
          return new Date(due).getTime() < Date.now();
        }).length;
        const ilpCount = classStudents.filter((s) => s.is_ilp).length;

        const pressureScore =
          (100 - visiblePct) +
          overdueReviews * 12 +
          ilpCount * 5 +
          Math.max(0, classStudents.length - 24) * 2;

        let recommendation = "Maintain current support allocation.";
        if (pressureScore >= 70) {
          recommendation = "Prioritise leadership or staff support, evidence capture, and review follow-up.";
        } else if (pressureScore >= 40) {
          recommendation = "Monitor closely and consider a short-term support boost.";
        }

        return {
          classId: safe(c.id),
          classLabel: classLabel(c),
          teacher: safe(c.teacher_name) || "Unassigned",
          studentCount: classStudents.length,
          visiblePct,
          overdueReviews,
          ilpCount,
          pressureScore,
          recommendation,
        };
      })
      .sort((a, b) => b.pressureScore - a.pressureScore)
      .slice(0, 6);
  }, [classes, students, evidence, interventions]);

  const authoritySummary = useMemo<AuthoritySummary>(() => {
    const visibleStudentPct = percent(
      stats.totalStudents - stats.invisibleStudents,
      Math.max(1, stats.totalStudents)
    );

    const evidenceCoveragePct =
      stats.totalStudents === 0
        ? 0
        : percent(
            students.filter((s) => {
              const list = studentEvidenceMap.get(safe(s.id)) ?? [];
              return list.length >= 2;
            }).length,
            stats.totalStudents
          );

    const projectedGapCount = students.filter((s) => {
      const list = studentEvidenceMap.get(safe(s.id)) ?? [];
      const fresh = list.filter((e) => daysSince(dateOfEvidence(e)) <= 30).length;
      return list.length < 2 || fresh === 0;
    }).length;

    let readinessPct = Math.round(
      visibleStudentPct * 0.35 +
        evidenceCoveragePct * 0.35 +
        Math.max(0, 100 - stats.overdueReviews * 8) * 0.3
    );

    readinessPct = Math.max(0, Math.min(100, readinessPct));

    let status: "low" | "watch" | "high" = "low";
    let text =
      "Authority-facing readiness looks strong across visibility, evidence depth, and review cadence.";

    if (readinessPct < 55) {
      status = "high";
      text =
        "Authority readiness is fragile. Evidence gaps and overdue reviews are likely to weaken submission confidence.";
    } else if (readinessPct < 75) {
      status = "watch";
      text =
        "Authority readiness is building, but several gaps still need tightening before formal confidence is strong.";
    }

    return {
      readinessPct,
      status,
      evidenceCoveragePct,
      visibleStudentPct,
      overdueReviewCount: stats.overdueReviews,
      projectedGapCount,
      text,
    };
  }, [stats, students, studentEvidenceMap]);

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Unified Landing / Command Home</div>
          <h1 style={S.h1}>MAX Command Home</h1>
          <div style={S.sub}>
            This is the front door for EduDecks. Use it to move quickly between school and family modes,
            monitor platform readiness, and launch the most important workflows from one place.
          </div>

          <div style={S.heroActions}>
            <Link href="/admin/leadership" style={S.btn}>
              Open School Mode
            </Link>
            <Link href="/admin/parent-dashboard" style={S.btnGhost}>
              Open Family Mode
            </Link>
            <button style={S.btnGhost} onClick={() => window.location.reload()}>
              {busy ? "Refreshing..." : "Refresh data"}
            </button>
          </div>

          <div style={S.statGrid}>
            <div style={S.statCard}>
              <div style={S.statLabel}>Classes</div>
              <div style={S.statValue}>{stats.totalClasses}</div>
              <div style={S.statHelp}>Active learning groups</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Students</div>
              <div style={S.statValue}>{stats.totalStudents}</div>
              <div style={S.statHelp}>Visible learners in platform</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Evidence</div>
              <div style={S.statValue}>{stats.totalEvidence}</div>
              <div style={S.statHelp}>Recorded evidence items</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>ILP</div>
              <div style={S.statValue}>{stats.totalILP}</div>
              <div style={S.statHelp}>Students with support profile</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Invisible students</div>
              <div style={S.statValue}>{stats.invisibleStudents}</div>
              <div style={S.statHelp}>No evidence recorded yet</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statLabel}>Overdue reviews</div>
              <div style={S.statValue}>{stats.overdueReviews}</div>
              <div style={S.statHelp}>Support reviews past due</div>
            </div>
          </div>
        </section>

        <section style={S.grid2}>
          <section style={S.card}>
            <div style={S.title}>Predictive signals</div>
            <div style={S.sectionText}>
              Early-warning indicators designed to show where pressure is likely to build next, not just what has already happened.
            </div>

            <div style={S.list}>
              {predictiveSignals.map((signal) => (
                <div key={signal.id} style={S.item}>
                  <div style={S.itemTitle}>{signal.title}</div>
                  <div style={S.itemMeta}>{signal.text}</div>
                  <div style={S.chipRow}>
                    <span style={S.pill(signal.tone)}>
                      {signal.tone === "high" ? "High risk" : signal.tone === "watch" ? "Watch" : "Stable"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={S.card}>
            <div style={S.title}>Authority readiness summary</div>
            <div style={S.sectionText}>
              Whole-system readiness posture for formal reporting and authority-facing submission confidence.
            </div>

            <div style={S.statGrid}>
              <div style={S.statCard}>
                <div style={S.statLabel}>Readiness</div>
                <div style={S.statValue}>{authoritySummary.readinessPct}%</div>
                <div style={S.statHelp}>Overall submission posture</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statLabel}>Visible students</div>
                <div style={S.statValue}>{authoritySummary.visibleStudentPct}%</div>
                <div style={S.statHelp}>Students with evidence visibility</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statLabel}>Coverage depth</div>
                <div style={S.statValue}>{authoritySummary.evidenceCoveragePct}%</div>
                <div style={S.statHelp}>Students with enough evidence depth</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statLabel}>Projected gaps</div>
                <div style={S.statValue}>{authoritySummary.projectedGapCount}</div>
                <div style={S.statHelp}>Students likely needing more evidence</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statLabel}>Review pressure</div>
                <div style={S.statValue}>{authoritySummary.overdueReviewCount}</div>
                <div style={S.statHelp}>Overdue intervention reviews</div>
              </div>

              <div style={S.statCard}>
                <div style={S.statLabel}>Status</div>
                <div style={S.statValue}>
                  {authoritySummary.status === "high"
                    ? "Fragile"
                    : authoritySummary.status === "watch"
                    ? "Building"
                    : "Strong"}
                </div>
                <div style={S.statHelp}>Readiness interpretation</div>
              </div>
            </div>

            <div style={{ ...S.item, marginTop: 12 }}>
              <div style={S.itemMeta}>{authoritySummary.text}</div>
            </div>
          </section>
        </section>

        <section style={S.contentGrid}>
          <section style={S.card}>
            <div style={S.title}>Launch surfaces</div>
            <div style={S.sectionText}>
              Jump directly into the highest-value workflows from the command home.
            </div>

            <div style={S.launchGrid}>
              {launchCards.map((card) => (
                <div key={card.title} style={S.launchCard}>
                  <div style={S.launchTitle}>{card.title}</div>
                  <div style={S.launchText}>{card.text}</div>
                  <div style={S.launchActions}>
                    {card.links.map((link) => (
                      <Link key={link.href} href={link.href} style={S.smallBtn}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={S.card}>
            <div style={S.title}>Triage queue</div>
            <div style={S.sectionText}>
              The highest-priority actions that need attention now.
            </div>

            <div style={S.list}>
              {triageQueue.map((item) => (
                <div key={item.id} style={S.item}>
                  <div style={S.itemTitle}>{item.title}</div>
                  <div style={S.itemMeta}>{item.text}</div>
                  <div style={S.chipRow}>
                    <span style={S.pill(item.tone)}>
                      {item.tone === "high" ? "Urgent" : item.tone === "watch" ? "Watch" : "Stable"}
                    </span>
                    {item.href && item.cta ? (
                      <Link href={item.href} style={S.smallBtn}>
                        {item.cta}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <section style={S.grid2}>
          <section style={S.card}>
            <div style={S.title}>Class hotspots</div>
            <div style={S.sectionText}>
              Classes sorted by evidence coverage risk so leadership can act quickly.
            </div>

            <div style={S.list}>
              {classHotspots.length === 0 ? (
                <div style={S.empty}>No class hotspots available yet.</div>
              ) : (
                classHotspots.map((row) => (
                  <div key={row.klass.id} style={S.item}>
                    <div style={S.itemTitle}>{classLabel(row.klass)}</div>
                    <div style={S.itemMeta}>
                      {row.studentCount} students • {row.evidenceCount} evidence • {row.coverage}% visible
                    </div>
                    <div style={S.chipRow}>
                      <span style={S.pill(row.risk)}>
                        {row.risk === "high" ? "High risk" : row.risk === "watch" ? "Watch" : "Stable"}
                      </span>
                      <Link href={`/admin/classes/${encodeURIComponent(safe(row.klass.id))}`} style={S.smallBtn}>
                        Open class
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section style={S.card}>
            <div style={S.title}>Resource allocation pressure</div>
            <div style={S.sectionText}>
              A simple leadership view of where staffing and support attention may need to go next.
            </div>

            <div style={S.list}>
              {resourceAllocation.length === 0 ? (
                <div style={S.empty}>No resource pressure rows available yet.</div>
              ) : (
                resourceAllocation.map((row) => {
                  const tone: "low" | "watch" | "high" =
                    row.pressureScore >= 70 ? "high" : row.pressureScore >= 40 ? "watch" : "low";

                  return (
                    <div key={row.classId} style={S.item}>
                      <div style={S.itemTitle}>{row.classLabel}</div>
                      <div style={S.itemMeta}>
                        {row.teacher} • {row.studentCount} students • {row.visiblePct}% visible • {row.overdueReviews} overdue reviews
                      </div>
                      <div style={S.itemMeta}>{row.recommendation}</div>
                      <div style={S.chipRow}>
                        <span style={S.pill(tone)}>Pressure {row.pressureScore}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </section>

        <section style={S.card}>
          <div style={S.title}>Recent evidence activity</div>
          <div style={S.sectionText}>
            Recent evidence gives context so the command home stays grounded in real platform activity.
          </div>

          <div style={S.list}>
            {recentEvidence.length === 0 ? (
              <div style={S.empty}>No recent evidence activity available yet.</div>
            ) : (
              recentEvidence.map((row) => {
                const student = students.find((s) => safe(s.id) === safe(row.student_id));
                return (
                  <div key={row.id} style={S.item}>
                    <div style={S.itemTitle}>
                      {safe(row.title) || safe(row.learning_area) || "Evidence item"}
                    </div>
                    <div style={S.itemMeta}>
                      {studentName(student)} • {safe(row.learning_area) || "General"} • {fullDate(dateOfEvidence(row))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function fullDate(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString();
  } catch {
    return s.slice(0, 10);
  }
}