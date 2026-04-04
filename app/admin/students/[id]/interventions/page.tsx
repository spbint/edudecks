"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentHubNav from "@/app/admin/components/StudentHubNav";
import { supabase } from "@/lib/supabaseClient";
import {
  buildStudentListPath,
  buildStudentProfilePath,
} from "@/lib/studentRoutes";

/* ──────────────────────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────────────────────── */

type Student = {
  id: string;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  year_level?: number | null;
  is_ilp?: boolean | null;
  class_id?: string | null;
  created_at?: string | null;
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
  student_id: string | null;
  class_id: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  note?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type InterventionRow = {
  id: string;
  student_id: string | null;
  class_id: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  tier?: string | number | null;
  start_date?: string | null;
  due_on?: string | null;
  review_date?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  note?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: any;
};

type SupportBand = "Stable" | "Needs review" | "Escalating" | "Closure candidate";

type InterventionCardModel = {
  row: InterventionRow;
  reviewDate: string | null;
  startDate: string | null;
  overdue: boolean;
  active: boolean;
  daysSinceReview: number | null;
  evidenceSinceStart: EvidenceEntryRow[];
  evidenceSinceReview: EvidenceEntryRow[];
  evidenceMomentum: "Strong" | "Some" | "Thin";
  supportBand: SupportBand;
  supportReason: string;
};

type NextAction = {
  label: string;
  reason: string;
  priority: "high" | "medium" | "low";
  href?: string;
};

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 180) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function nameOf(s: Student | null) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name || s.last_name
  )}`.trim();
}

function shortDate(v: string | null | undefined) {
  const s = safe(v);
  return s ? s.slice(0, 10) : "—";
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

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("does not exist") &&
    (msg.includes("relation") || msg.includes("column"))
  );
}

function attentionTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (s === "attention") {
    return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c", label: "Immediate attention" };
  }
  if (s === "watch") {
    return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412", label: "Watch" };
  }
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534", label: "Ready" };
}

function isOpenIntervention(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return !["closed", "done", "resolved", "archived", "completed", "cancelled"].includes(s);
}

function reviewDate(iv: InterventionRow) {
  return (
    safe(iv.review_due_on) ||
    safe(iv.review_due_date) ||
    safe(iv.review_date) ||
    safe(iv.next_review_on) ||
    safe(iv.due_on) ||
    safe(iv.updated_at) ||
    safe(iv.created_at) ||
    ""
  );
}

function startDate(iv: InterventionRow) {
  return safe(iv.start_date) || safe(iv.created_at) || "";
}

function statusTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (["completed", "closed", "resolved", "done"].includes(s)) {
    return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
  }
  if (["paused"].includes(s)) {
    return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  }
  if (["cancelled", "archived"].includes(s)) {
    return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  }
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
}

function bandTone(band: SupportBand) {
  if (band === "Escalating") {
    return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  }
  if (band === "Needs review") {
    return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  }
  if (band === "Closure candidate") {
    return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
  }
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
}

function priorityTone(priority: NextAction["priority"]) {
  if (priority === "high") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  if (priority === "medium") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
}

function signalTone(kind: "primary" | "success" | "warning" | "danger" | "info" | "premium") {
  if (kind === "success") return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  if (kind === "warning") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  if (kind === "danger") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  if (kind === "info") return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
  if (kind === "premium") return { bg: "#fffaf0", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#2563eb" };
}

function supportBandForRow(
  row: InterventionRow,
  evidenceSinceStart: EvidenceEntryRow[],
  evidenceSinceReview: EvidenceEntryRow[]
): { band: SupportBand; reason: string; overdue: boolean; daysSinceReview: number | null } {
  const active = isOpenIntervention(row.status);
  const rd = reviewDate(row);
  const dsr = daysSince(rd);
  const overdue = active && dsr != null && dsr > 0;

  if (!active) {
    return {
      band: "Closure candidate",
      reason: "This support item is no longer active and may be ready for archival or historical reference.",
      overdue,
      daysSinceReview: dsr,
    };
  }

  if (overdue && evidenceSinceReview.length === 0) {
    return {
      band: "Escalating",
      reason: "Review is overdue and there is no fresh evidence after the last review point.",
      overdue,
      daysSinceReview: dsr,
    };
  }

  if (overdue) {
    return {
      band: "Needs review",
      reason: "Review timing has slipped and this support plan should be revisited soon.",
      overdue,
      daysSinceReview: dsr,
    };
  }

  if (evidenceSinceStart.length >= 3 && evidenceSinceReview.length >= 1) {
    return {
      band: "Closure candidate",
      reason: "There is visible evidence movement after support began, so this may be ready for closure or tapering.",
      overdue,
      daysSinceReview: dsr,
    };
  }

  if (evidenceSinceStart.length === 0) {
    return {
      band: "Needs review",
      reason: "There is little or no visible evidence since the support plan began, making impact hard to judge.",
      overdue,
      daysSinceReview: dsr,
    };
  }

  return {
    band: "Stable",
    reason: "The support plan is active and there is at least some visible evidence alongside it.",
    overdue,
    daysSinceReview: dsr,
  };
}

function compareDateDesc(a?: string | null, b?: string | null) {
  return new Date(b || "").getTime() - new Date(a || "").getTime();
}

/* ──────────────────────────────────────────────────────────────
   SMALL COMPONENTS
   ────────────────────────────────────────────────────────────── */

function Chip({
  children,
  bg = "#ffffff",
  bd = "#d1d5db",
  fg = "#1f2937",
}: {
  children: React.ReactNode;
  bg?: string;
  bd?: string;
  fg?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 800,
        background: bg,
        border: `1px solid ${bd}`,
        color: fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SectionCard({
  title,
  help,
  actions,
  children,
}: {
  title: string;
  help?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 20,
        boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.25,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {title}
          </div>
          {help ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                lineHeight: 1.5,
                color: "#64748b",
              }}
            >
              {help}
            </div>
          ) : null}
        </div>
        {actions ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ScoreTile({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "primary" | "success" | "warning" | "danger" | "info" | "premium";
}) {
  const p = signalTone(tone);
  return (
    <div
      style={{
        background: p.bg,
        border: `1px solid ${p.bd}`,
        borderRadius: 18,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.2,
          fontWeight: 800,
          letterSpacing: 1.05,
          textTransform: "uppercase",
          color: p.fg,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          lineHeight: 1.1,
          fontWeight: 900,
          color: "#0f172a",
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "#475569",
        }}
      >
        {helper}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */

export default function StudentInterventionsPage() {
  return (
    <Suspense fallback={null}>
      <StudentInterventionsPageContent />
    </Suspense>
  );
}

function StudentInterventionsPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const studentId = String(params?.id ?? "");
  const returnTo = searchParams?.get("returnTo") || "";
  const backHref = buildStudentProfilePath(studentId, returnTo || buildStudentListPath());

  const [student, setStudent] = useState<Student | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [overview, setOverview] = useState<StudentProfileOverviewRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* ──────────────────────────────────────────────────────────
     LOAD DATA
     ────────────────────────────────────────────────────────── */

  useEffect(() => {
    async function load() {
      if (!studentId) return;

      setBusy(true);
      setErr(null);

      try {
        const studentQueries = [
          "id,preferred_name,first_name,surname,family_name,last_name,year_level,is_ilp,class_id,created_at",
          "id,preferred_name,first_name,surname,family_name,year_level,is_ilp,class_id,created_at",
          "id,preferred_name,first_name,surname,year_level,is_ilp,class_id,created_at",
          "id,preferred_name,first_name,year_level,is_ilp,class_id,created_at",
        ];

        let studentData: Student | null = null;

        for (const sel of studentQueries) {
          const { data, error } = await supabase
            .from("students")
            .select(sel)
            .eq("id", studentId)
            .maybeSingle();

          if (!error) {
            studentData = (data as Student | null) ?? null;
            break;
          }
          if (!isMissingRelationOrColumn(error)) throw error;
        }

        const { data: ov, error: ovError } = await supabase
          .from("v_student_profile_overview_v1")
          .select("*")
          .eq("student_id", studentId)
          .maybeSingle();

        if (ovError && !isMissingRelationOrColumn(ovError)) throw ovError;

        const interventionQueries = [
          "id,student_id,class_id,title,description,status,priority,tier,start_date,due_on,review_date,review_due_on,review_due_date,next_review_on,note,notes,created_at,updated_at",
          "id,student_id,class_id,title,status,priority,tier,start_date,due_on,review_due_on,review_due_date,next_review_on,note,notes,created_at,updated_at",
          "id,student_id,class_id,title,status,created_at,updated_at",
        ];

        let interventionRows: InterventionRow[] = [];

        for (const sel of interventionQueries) {
          const { data, error } = await supabase
            .from("interventions")
            .select(sel)
            .eq("student_id", studentId)
            .order("updated_at", { ascending: false })
            .order("created_at", { ascending: false });

          if (!error) {
            interventionRows = ((data as any[]) ?? []) as InterventionRow[];
            break;
          }
          if (!isMissingRelationOrColumn(error)) throw error;
        }

        const evidenceQueries = [
          "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,is_deleted",
          "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,is_deleted",
        ];

        let evidenceRows: EvidenceEntryRow[] = [];

        for (const sel of evidenceQueries) {
          const { data, error } = await supabase
            .from("evidence_entries")
            .select(sel)
            .eq("student_id", studentId)
            .eq("is_deleted", false)
            .order("occurred_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

          if (!error) {
            evidenceRows = ((data as any[]) ?? []) as EvidenceEntryRow[];
            break;
          }
          if (!isMissingRelationOrColumn(error)) throw error;
        }

        let classData: ClassRow | null = null;
        const classId = safe((ov as any)?.class_id) || safe(studentData?.class_id);

        if (classId) {
          const classQueries = [
            "id,name,teacher_name,room,year_level",
            "id,name,room,year_level",
            "id,name,year_level",
          ];

          for (const sel of classQueries) {
            const { data, error } = await supabase
              .from("classes")
              .select(sel)
              .eq("id", classId)
              .maybeSingle();

            if (!error) {
              classData = (data as ClassRow | null) ?? null;
              break;
            }
            if (!isMissingRelationOrColumn(error)) throw error;
          }
        }

        setStudent(studentData);
        setOverview((ov as StudentProfileOverviewRow | null) ?? null);
        setInterventions(interventionRows);
        setEvidence(evidenceRows);
        setKlass(classData);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      } finally {
        setBusy(false);
      }
    }

    load();
  }, [studentId]);

  /* ──────────────────────────────────────────────────────────
     DERIVED STATE
     ────────────────────────────────────────────────────────── */

  const displayName = useMemo(() => {
    return safe(overview?.student_name) || nameOf(student);
  }, [overview, student]);

  const attention = useMemo(
    () => attentionTone(overview?.attention_status),
    [overview?.attention_status]
  );

  const cardModels = useMemo<InterventionCardModel[]>(() => {
    return interventions.map((row) => {
      const sDate = startDate(row);
      const rDate = reviewDate(row);

      const evidenceSinceStart = evidence
        .filter((ev) => {
          if (!safe(sDate)) return false;
          const eventDate = safe(ev.occurred_on) || safe(ev.created_at);
          return safe(eventDate) && new Date(eventDate) >= new Date(sDate);
        })
        .sort((a, b) => compareDateDesc(a.occurred_on || a.created_at, b.occurred_on || b.created_at));

      const evidenceSinceReview = evidence
        .filter((ev) => {
          if (!safe(rDate)) return false;
          const eventDate = safe(ev.occurred_on) || safe(ev.created_at);
          return safe(eventDate) && new Date(eventDate) >= new Date(rDate);
        })
        .sort((a, b) => compareDateDesc(a.occurred_on || a.created_at, b.occurred_on || b.created_at));

      const supportInfo = supportBandForRow(row, evidenceSinceStart, evidenceSinceReview);

      const evidenceMomentum =
        evidenceSinceStart.length >= 3
          ? "Strong"
          : evidenceSinceStart.length >= 1
          ? "Some"
          : "Thin";

      return {
        row,
        reviewDate: safe(rDate) || null,
        startDate: safe(sDate) || null,
        overdue: supportInfo.overdue,
        active: isOpenIntervention(row.status),
        daysSinceReview: supportInfo.daysSinceReview,
        evidenceSinceStart,
        evidenceSinceReview,
        evidenceMomentum,
        supportBand: supportInfo.band,
        supportReason: supportInfo.reason,
      };
    });
  }, [evidence, interventions]);

  const activeCount = useMemo(() => cardModels.filter((x) => x.active).length, [cardModels]);

  const overdueCount = useMemo(() => cardModels.filter((x) => x.overdue).length, [cardModels]);

  const escalatingCount = useMemo(
    () => cardModels.filter((x) => x.supportBand === "Escalating").length,
    [cardModels]
  );

  const closureCandidates = useMemo(
    () => cardModels.filter((x) => x.supportBand === "Closure candidate").length,
    [cardModels]
  );

  const overallSupportEffectiveness = useMemo(() => {
    if (!cardModels.length) return 0;

    const score = Math.round(
      cardModels.reduce((sum, x) => {
        const base =
          x.supportBand === "Stable"
            ? 78
            : x.supportBand === "Needs review"
            ? 48
            : x.supportBand === "Escalating"
            ? 24
            : 72;
        return sum + base;
      }, 0) / cardModels.length
    );

    return score;
  }, [cardModels]);

  const supportStory = useMemo(() => {
    if (!cardModels.length) {
      return "There are no structured support plans for this learner yet.";
    }
    if (escalatingCount > 0) {
      return "At least one support plan is escalating because review pressure and visible evidence are not lining up well.";
    }
    if (overdueCount > 0) {
      return "Support is active, but some review rhythm is slipping and needs attention.";
    }
    if (closureCandidates > 0) {
      return "Some support plans look mature enough to consider closure or tapering.";
    }
    return "Support is active and broadly stable, with at least some evidence visibility alongside it.";
  }, [cardModels.length, closureCandidates, escalatingCount, overdueCount]);

  const nextActions = useMemo<NextAction[]>(() => {
    const actions: NextAction[] = [];

    if (escalatingCount > 0) {
      actions.push({
        label: "Review escalating support",
        reason: `${escalatingCount} support plan${
          escalatingCount === 1 ? "" : "s"
        } appear to be escalating and need an immediate decision.`,
        priority: "high",
        href: `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
      });
    }

    if (overdueCount > 0) {
      actions.push({
        label: "Resolve overdue reviews",
        reason: `${overdueCount} review${
          overdueCount === 1 ? "" : "s"
        } are overdue, weakening the reliability of the support story.`,
        priority: "high",
        href: `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
      });
    }

    if (activeCount > 0 && evidence.length === 0) {
      actions.push({
        label: "Add evidence linked to support",
        reason: "Support plans exist, but there is no visible evidence to judge impact.",
        priority: "medium",
        href: `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
      });
    }

    if (closureCandidates > 0) {
      actions.push({
        label: "Check closure candidates",
        reason: `${closureCandidates} support plan${
          closureCandidates === 1 ? "" : "s"
        } may be ready for closure, tapering, or historical archiving.`,
        priority: "medium",
        href: `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
      });
    }

    if (!actions.length) {
      actions.push({
        label: "Maintain support rhythm",
        reason: "The current support picture looks steady. Keep reviews current and continue collecting evidence alongside interventions.",
        priority: "low",
      });
    }

    return actions.slice(0, 4);
  }, [activeCount, closureCandidates, escalatingCount, evidence.length, overdueCount, returnTo, studentId]);

  /* ──────────────────────────────────────────────────────────
     RENDER
     ────────────────────────────────────────────────────────── */

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f6f8fc",
        color: "#1f2937",
        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <AdminLeftNav />

      <main
        style={{
          flex: 1,
          padding: 24,
          maxWidth: 1380,
        }}
      >
        <StudentHubNav studentId={studentId} />

        {busy ? (
          <div
            style={{
              marginBottom: 14,
              borderRadius: 12,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              padding: 12,
              color: "#1d4ed8",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            Refreshing student support view…
          </div>
        ) : null}

        {err ? (
          <div
            style={{
              marginBottom: 14,
              borderRadius: 12,
              border: "1px solid #fecdd3",
              background: "#fff1f2",
              padding: 12,
              color: "#be123c",
              fontWeight: 800,
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {err}
          </div>
        ) : null}

        {/* Sticky top shell */}
        <section
          style={{
            position: "sticky",
            top: 12,
            zIndex: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(14px)",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: "12px 14px",
            boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => router.push(backHref)}
              style={SS.secondaryButton}
            >
              Back to profile
            </button>
            {klass?.name ? <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">{klass.name}</Chip> : null}
            {fmtYear(student?.year_level ?? klass?.year_level) ? (
              <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                {fmtYear(student?.year_level ?? klass?.year_level)}
              </Chip>
            ) : null}
            {safe(klass?.teacher_name) ? (
              <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                {safe(klass?.teacher_name)}
              </Chip>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
                    returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                  }`
                )
              }
              style={SS.primaryButton}
            >
              Open support workflow
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
                    returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                  }`
                )
              }
              style={SS.secondaryButton}
            >
              Add linked evidence
            </button>
          </div>
        </section>

        {/* Hero summary band */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.95fr)",
            gap: 18,
            background:
              "linear-gradient(135deg, rgba(79,124,240,0.08) 0%, rgba(139,124,246,0.08) 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: 26,
            padding: "28px 24px",
            boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Student support intelligence
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 34,
                lineHeight: 1.1,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {displayName} — Interventions
            </h1>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#475569",
                maxWidth: 820,
              }}
            >
              This page interprets active support plans, review pressure, and visible evidence movement so
              staff can decide what needs follow-up, what is stable, and what may be ready to close.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip bg={attention.bg} bd={attention.bd} fg={attention.fg}>
                {attention.label}
              </Chip>
              <Chip
                bg={
                  overallSupportEffectiveness >= 70
                    ? "#ecfdf5"
                    : overallSupportEffectiveness >= 50
                    ? "#fff7ed"
                    : "#fff1f2"
                }
                bd={
                  overallSupportEffectiveness >= 70
                    ? "#a7f3d0"
                    : overallSupportEffectiveness >= 50
                    ? "#fed7aa"
                    : "#fecdd3"
                }
                fg={
                  overallSupportEffectiveness >= 70
                    ? "#166534"
                    : overallSupportEffectiveness >= 50
                    ? "#9a3412"
                    : "#be123c"
                }
              >
                Support effectiveness: {overallSupportEffectiveness}%
              </Chip>
              {(overview?.is_ilp || student?.is_ilp) ? (
                <Chip bg="#f5f3ff" bd="#ddd6fe" fg="#6d28d9">
                  ILP
                </Chip>
              ) : null}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.84)",
              border: "1px solid #dbeafe",
              borderRadius: 20,
              padding: 18,
              boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
              display: "grid",
              alignContent: "start",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1.05,
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Support reading
            </div>

            <div
              style={{
                fontSize: 18,
                lineHeight: 1.25,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {safe(overview?.next_action) || nextActions[0]?.label || "Maintain support rhythm"}
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#475569",
              }}
            >
              {supportStory}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <SummaryRow label="Total supports" value={String(cardModels.length)} />
              <SummaryRow label="Active supports" value={String(activeCount)} />
              <SummaryRow label="Overdue reviews" value={String(overdueCount)} />
              <SummaryRow label="Escalating items" value={String(escalatingCount)} />
            </div>
          </div>
        </section>

        {/* Score row */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <ScoreTile
            label="Total supports"
            value={String(cardModels.length)}
            helper="All visible support plans linked to this learner."
            tone="primary"
          />
          <ScoreTile
            label="Active"
            value={String(activeCount)}
            helper="Support plans currently open and requiring some degree of attention."
            tone={activeCount === 0 ? "info" : "success"}
          />
          <ScoreTile
            label="Overdue reviews"
            value={String(overdueCount)}
            helper="Open plans whose review timing has slipped."
            tone={overdueCount === 0 ? "success" : overdueCount <= 2 ? "warning" : "danger"}
          />
          <ScoreTile
            label="Escalating"
            value={String(escalatingCount)}
            helper="Support plans with weak evidence movement and/or overdue review pressure."
            tone={escalatingCount === 0 ? "success" : "danger"}
          />
          <ScoreTile
            label="Closure candidates"
            value={String(closureCandidates)}
            helper="Support plans that may be ready for tapering or closure."
            tone={closureCandidates === 0 ? "info" : "premium"}
          />
        </section>

        {/* Main grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(300px, 0.92fr) minmax(0, 1.35fr) minmax(300px, 0.95fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          {/* LEFT */}
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard
              title="Support intelligence"
              help="A quick interpretation of the current support picture for this learner."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <InterpretationRow
                  label="Review rhythm"
                  value={
                    overdueCount === 0
                      ? "Holding"
                      : overdueCount === 1
                      ? "One review needs follow-up"
                      : "Multiple reviews need follow-up"
                  }
                />
                <InterpretationRow
                  label="Evidence visibility"
                  value={
                    evidence.length === 0
                      ? "No linked evidence visible"
                      : evidence.length <= 2
                      ? "Light evidence visibility"
                      : "Usable evidence visibility"
                  }
                />
                <InterpretationRow
                  label="Support posture"
                  value={
                    escalatingCount > 0
                      ? "Escalating"
                      : closureCandidates > 0
                      ? "Mixed, with closure candidates"
                      : activeCount > 0
                      ? "Active and mostly stable"
                      : "No active support load"
                  }
                />
                <InterpretationRow
                  label="Decision confidence"
                  value={
                    overallSupportEffectiveness >= 70
                      ? "Stronger"
                      : overallSupportEffectiveness >= 50
                      ? "Moderate"
                      : "Weak"
                  }
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Next actions"
              help="Recommended moves based on review timing, evidence visibility, and support load."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {nextActions.map((action, idx) => {
                  const p = priorityTone(action.priority);
                  return (
                    <div
                      key={`${action.label}-${idx}`}
                      style={{
                        borderRadius: 14,
                        border: `1px solid ${p.bd}`,
                        background: p.bg,
                        padding: 14,
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {action.label}
                        </div>
                        <Chip bg={p.bg} bd={p.bd} fg={p.fg}>
                          {action.priority}
                        </Chip>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "#475569",
                        }}
                      >
                        {action.reason}
                      </div>

                      {action.href ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => router.push(action.href!)}
                            style={SS.miniButton}
                          >
                            Open
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* CENTRE */}
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard
              title="Support plans"
              help="Each support card shows status, review pressure, evidence movement, and a suggested interpretation."
            >
              <div style={{ display: "grid", gap: 12 }}>
                {cardModels.length === 0 ? (
                  <div style={SS.softEmpty}>
                    No support plans are recorded for this learner yet.
                  </div>
                ) : (
                  cardModels.map((model) => {
                    const row = model.row;
                    const statusP = statusTone(row.status);
                    const bandP = bandTone(model.supportBand);

                    return (
                      <div
                        key={row.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 16,
                          background: "#ffffff",
                          padding: 16,
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 16,
                              lineHeight: 1.3,
                              fontWeight: 900,
                              color: "#0f172a",
                            }}
                          >
                            {safe(row.title) || "Intervention"}
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Chip bg={statusP.bg} bd={statusP.bd} fg={statusP.fg}>
                              {safe(row.status) || "Unknown"}
                            </Chip>
                            <Chip bg={bandP.bg} bd={bandP.bd} fg={bandP.fg}>
                              {model.supportBand}
                            </Chip>
                            {safe(row.priority) ? (
                              <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                                Priority: {safe(row.priority)}
                              </Chip>
                            ) : null}
                            {safe(row.tier) ? (
                              <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                                Tier: {safe(row.tier)}
                              </Chip>
                            ) : null}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                            Start: {shortDate(model.startDate)}
                          </Chip>
                          <Chip
                            bg={model.overdue ? "#fff1f2" : "#f8fafc"}
                            bd={model.overdue ? "#fecdd3" : "#e5e7eb"}
                            fg={model.overdue ? "#be123c" : "#475569"}
                          >
                            Review: {shortDate(model.reviewDate)}
                          </Chip>
                          <Chip bg="#ecfeff" bd="#a5f3fc" fg="#0c4a6e">
                            Evidence since start: {model.evidenceSinceStart.length}
                          </Chip>
                          <Chip
                            bg={
                              model.evidenceMomentum === "Strong"
                                ? "#ecfdf5"
                                : model.evidenceMomentum === "Some"
                                ? "#fff7ed"
                                : "#fff1f2"
                            }
                            bd={
                              model.evidenceMomentum === "Strong"
                                ? "#a7f3d0"
                                : model.evidenceMomentum === "Some"
                                ? "#fed7aa"
                                : "#fecdd3"
                            }
                            fg={
                              model.evidenceMomentum === "Strong"
                                ? "#166534"
                                : model.evidenceMomentum === "Some"
                                ? "#9a3412"
                                : "#be123c"
                            }
                          >
                            Momentum: {model.evidenceMomentum}
                          </Chip>
                        </div>

                        {clip(row.description) || clip(row.note) || clip(row.notes) ? (
                          <div
                            style={{
                              fontSize: 13,
                              lineHeight: 1.6,
                              color: "#475569",
                            }}
                          >
                            {clip(row.description, 260) ||
                              clip(row.note, 260) ||
                              clip(row.notes, 260)}
                          </div>
                        ) : null}

                        <div
                          style={{
                            borderRadius: 12,
                            border: `1px solid ${bandP.bd}`,
                            background: bandP.bg,
                            padding: 12,
                            color: "#475569",
                            fontSize: 13,
                            lineHeight: 1.55,
                          }}
                        >
                          <strong style={{ color: "#0f172a" }}>Support read:</strong>{" "}
                          {model.supportReason}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                            gap: 10,
                          }}
                        >
                          <MiniMetric
                            label="Since start"
                            value={String(model.evidenceSinceStart.length)}
                            help="evidence items"
                          />
                          <MiniMetric
                            label="Since review"
                            value={String(model.evidenceSinceReview.length)}
                            help="evidence items"
                          />
                          <MiniMetric
                            label="Review pressure"
                            value={
                              model.daysSinceReview == null
                                ? "—"
                                : `${model.daysSinceReview}d`
                            }
                            help="since review point"
                          />
                        </div>

                        <div style={{ display: "grid", gap: 8 }}>
                          <div style={SS.overline}>Recent linked evidence</div>
                          {model.evidenceSinceStart.length ? (
                            model.evidenceSinceStart.slice(0, 3).map((ev) => (
                              <div
                                key={ev.id}
                                style={{
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 12,
                                  background: "#f8fafc",
                                  padding: 10,
                                  display: "grid",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 800,
                                    color: "#0f172a",
                                  }}
                                >
                                  {safe(ev.title) || safe(ev.learning_area) || "Evidence"}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#64748b",
                                  }}
                                >
                                  {fullDate(ev.occurred_on || ev.created_at)}
                                  {safe(ev.learning_area) ? ` • ${safe(ev.learning_area)}` : ""}
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                    color: "#475569",
                                  }}
                                >
                                  {clip(ev.summary, 120) ||
                                    clip(ev.body, 120) ||
                                    clip(ev.note, 120) ||
                                    "Evidence recorded."}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={SS.softEmpty}>
                              No visible evidence has been recorded since this support item began.
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
                                  returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                                }`
                              )
                            }
                            style={SS.miniButton}
                          >
                            Review now
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
                                  returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                                }`
                              )
                            }
                            style={SS.miniButton}
                          >
                            Add linked evidence
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>
          </div>

          {/* RIGHT */}
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard
              title="Support effectiveness"
              help="A quick summary of how the current support picture feels overall."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                    padding: 16,
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={SS.overline}>Overall effect</div>
                  <div
                    style={{
                      fontSize: 28,
                      lineHeight: 1.1,
                      fontWeight: 900,
                      color: "#0f172a",
                    }}
                  >
                    {overallSupportEffectiveness}%
                  </div>
                  <div style={SS.smallText}>
                    This is a simple interpretive signal based on activity, review timing, and visible evidence movement.
                  </div>
                </div>

                <div style={SS.softNote}>{supportStory}</div>
              </div>
            </SectionCard>

            <SectionCard
              title="Workflow bridges"
              help="Move directly from support review into the wider student workflow."
            >
              <div style={{ display: "grid", gap: 10 }}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
                        returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                      }`
                    )
                  }
                  style={SS.primaryButton}
                >
                  Add linked evidence
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/reports?studentId=${encodeURIComponent(studentId)}${
                        returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                      }`
                    )
                  }
                  style={SS.secondaryButton}
                >
                  Open report builder
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/admin/students/${studentId}/timeline${
                        returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
                      }`
                    )
                  }
                  style={SS.secondaryButton}
                >
                  Open timeline
                </button>
              </div>
            </SectionCard>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PRESENTATIONAL HELPERS
   ────────────────────────────────────────────────────────────── */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        paddingTop: 8,
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: "#64748b",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "#0f172a",
          fontWeight: 800,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function InterpretationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#f8fafc",
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.2,
          fontWeight: 800,
          letterSpacing: 1.05,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.45,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#f8fafc",
        padding: 10,
        display: "grid",
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.2,
          fontWeight: 800,
          letterSpacing: 1.05,
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          lineHeight: 1.2,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.45,
          color: "#64748b",
        }}
      >
        {help}
      </div>
    </div>
  );
}

const SS: Record<string, React.CSSProperties> = {
  overline: {
    fontSize: 12,
    lineHeight: 1.2,
    fontWeight: 800,
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: "#64748b",
  },

  smallText: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#64748b",
  },

  softNote: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#f8fafc",
    padding: 12,
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.55,
  },

  softEmpty: {
    border: "1px dashed #d1d5db",
    borderRadius: 12,
    background: "#f8fafc",
    padding: 12,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.5,
  },

  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },

  secondaryButton: {
    background: "#ffffff",
    color: "#1f2937",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },

  miniButton: {
    background: "#ffffff",
    color: "#1f2937",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "8px 10px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
};
