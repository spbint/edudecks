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
import {
  createStudentProfileSnapshot,
  deleteSnapshot,
  listStudentProfileSnapshots,
  updateSnapshotStatus,
  type SnapshotStatus,
} from "@/lib/studentProfileSnapshots";

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
  visibility?: string | null;
  is_deleted?: boolean | null;
  attachment_urls?: string[] | string | null;
  image_url?: string | null;
  photo_url?: string | null;
  file_url?: string | null;
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
  note?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [k: string]: any;
};

type AreaProfileRow = {
  label: string;
  evidenceCount: number;
  freshCount: number;
  latest: string | null;
  strengthScore: number;
  readiness: "Strong" | "Watch" | "Gap";
};

type TimelineItem = {
  id: string;
  date: string | null;
  kind: "Evidence" | "Intervention";
  title: string;
  text: string;
};

type CurationFlags = {
  reportRole?: "core" | "appendix";
  portfolioPinned?: boolean;
  conferencePinned?: boolean;
  exemplar?: boolean;
  weak?: boolean;
  needsRewrite?: boolean;
};

type CurationMap = Record<string, CurationFlags>;

type Priority = "high" | "medium" | "low";

type NextAction = {
  label: string;
  reason: string;
  priority: Priority;
  href?: string;
};

type ScoreCard = {
  evidenceQuality: number;
  reportingReadiness: number;
  authorityReadiness: number;
  trajectoryForecast: number;
  supportEffectiveness: number;
  conferenceReadiness: number;
};

type SnapshotRow = {
  id: string;
  student_id: string;
  class_id?: string | null;
  snapshot_title: string;
  attention_status?: string | null;
  next_action?: string | null;
  momentum?: string | null;
  evidence_quality: number;
  reporting_readiness: number;
  authority_readiness: number;
  trajectory_forecast: number;
  support_effectiveness: number;
  conference_readiness: number;
  total_evidence: number;
  evidence_30d: number;
  open_interventions_count: number;
  overdue_reviews_count: number;
  last_evidence_at?: string | null;
  strong_areas: string[];
  watch_areas: string[];
  next_actions: any[];
  score_card_json: Record<string, any>;
  reporting_summary_json: Record<string, any>;
  conference_brief_json: Record<string, any>;
  curation_json: Record<string, any>;
  selected_evidence_ids: string[];
  snapshot_json: Record<string, any>;
  status: SnapshotStatus;
  created_at: string;
  updated_at: string;
};

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */

const CURATION_KEY_PREFIX = "edudecks_student_profile_curation_v1:";

function safe(v: any) {
  return String(v ?? "").trim();
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function nameOf(s: Student | null) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name || s.last_name
  )}`.trim();
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function shortDate(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return "—";
  return s.slice(0, 10);
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

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.max(
    0,
    Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function clip(v: string | null | undefined, max = 140) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
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
    return {
      bg: "#fff1f2",
      bd: "#fecdd3",
      fg: "#be123c",
      label: "Immediate attention",
    };
  }

  if (s === "watch") {
    return {
      bg: "#fff7ed",
      bd: "#fed7aa",
      fg: "#9a3412",
      label: "Watch",
    };
  }

  return {
    bg: "#ecfdf5",
    bd: "#a7f3d0",
    fg: "#166534",
    label: "Ready",
  };
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
    x.includes("behavior") ||
    x.includes("health")
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

function reviewDate(iv: InterventionRow) {
  return (
    safe(iv.review_due_on) ||
    safe(iv.review_due_date) ||
    safe(iv.next_review_on) ||
    safe(iv.due_on) ||
    safe(iv.updated_at) ||
    safe(iv.created_at) ||
    ""
  );
}

function isOpenIntervention(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return !["closed", "done", "resolved", "archived", "completed"].includes(s);
}

function hasMedia(row: EvidenceEntryRow) {
  const attachments = Array.isArray(row.attachment_urls)
    ? row.attachment_urls.length
    : safe(row.attachment_urls)
      ? 1
      : 0;

  return Boolean(
    attachments || safe(row.image_url) || safe(row.photo_url) || safe(row.file_url)
  );
}

function evidenceText(row: EvidenceEntryRow) {
  return (
    clip(row.summary, 180) ||
    clip(row.body, 180) ||
    clip(row.note, 180) ||
    "No summary available."
  );
}

function richTextScore(row: EvidenceEntryRow) {
  const text = [
    safe(row.title),
    safe(row.summary),
    safe(row.body),
    safe(row.note),
  ].join(" ");

  const len = text.length;
  if (len >= 320) return 100;
  if (len >= 200) return 82;
  if (len >= 120) return 68;
  if (len >= 60) return 52;
  if (len > 0) return 35;
  return 12;
}

function qualityBand(score: number): "Strong" | "Usable" | "Thin" | "Weak" {
  if (score >= 78) return "Strong";
  if (score >= 58) return "Usable";
  if (score >= 38) return "Thin";
  return "Weak";
}

function qualityTone(score: number) {
  const band = qualityBand(score);

  if (band === "Strong") {
    return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  }
  if (band === "Usable") {
    return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
  }
  if (band === "Thin") {
    return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  }
  return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
}

function scoreToBand(score: number) {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Watch";
  return "Weak";
}

function trajectoryBand(score: number) {
  if (score >= 78) return "On track";
  if (score >= 58) return "Fragile";
  if (score >= 38) return "Drifting";
  return "Immediate attention";
}

function supportBand(openCount: number, overdueCount: number) {
  if (openCount === 0) return "Stable";
  if (overdueCount >= 2) return "Escalating";
  if (openCount >= 3) return "High";
  return "Active";
}

function conferenceBand(score: number) {
  return score >= 70 ? "Ready" : "Needs prep";
}

function priorityTone(priority: Priority) {
  if (priority === "high") {
    return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  }
  if (priority === "medium") {
    return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  }
  return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function curationStorageKey(studentId: string) {
  return `${CURATION_KEY_PREFIX}${studentId}`;
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

function MetricCard({
  label,
  value,
  helper,
  tone = "primary",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info" | "premium";
}) {
  const palette =
    tone === "success"
      ? { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" }
      : tone === "warning"
        ? { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" }
        : tone === "danger"
          ? { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" }
          : tone === "info"
            ? { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" }
            : tone === "premium"
              ? { bg: "#fffaf0", bd: "#fde68a", fg: "#92400e" }
              : { bg: "#eff6ff", bd: "#bfdbfe", fg: "#2563eb" };

  return (
    <div
      style={{
        background: palette.bg,
        border: `1px solid ${palette.bd}`,
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
          color: palette.fg,
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

function ScoreTile({
  label,
  score,
  helper,
  tone,
}: {
  label: string;
  score: number;
  helper: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info" | "premium";
}) {
  return (
    <MetricCard
      label={label}
      value={`${score}%`}
      helper={helper}
      tone={tone}
    />
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
        {actions ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px minmax(0, 1fr)",
        gap: 10,
        alignItems: "start",
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
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "#334155",
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function SignalRow({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#f8fafc",
        padding: 12,
        display: "grid",
        gap: 4,
      }}
    >
      <div style={SS.overline}>{label}</div>
      <div
        style={{
          fontSize: 16,
          lineHeight: 1.3,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
      <div style={SS.smallText}>{note}</div>
    </div>
  );
}

function MiniStat({
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
        borderRadius: 14,
        background: "#f8fafc",
        padding: 12,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 13, color: "#475569" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */

export default function StudentProfilePage() {
  return (
    <Suspense fallback={null}>
      <StudentProfilePageContent />
    </Suspense>
  );
}

function StudentProfilePageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const studentId = String(params?.id ?? "");
  const returnTo = searchParams?.get("returnTo") || "";
  const canonicalHref = buildStudentProfilePath(studentId, returnTo || null);
  const backHref = returnTo || buildStudentListPath();

  const [student, setStudent] = useState<Student | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [overview, setOverview] = useState<StudentProfileOverviewRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceEntryRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [curation, setCuration] = useState<CurationMap>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);

  /* ──────────────────────────────────────────────────────────
     LOAD PROFILE DATA
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

        const evidenceQueries = [
          "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,is_deleted,attachment_urls,image_url,photo_url,file_url",
          "id,student_id,class_id,title,summary,body,note,learning_area,occurred_on,created_at,is_deleted,attachment_urls,image_url,photo_url,file_url",
          "id,student_id,class_id,title,summary,body,note,learning_area,occurred_on,created_at,is_deleted",
          "id,student_id,class_id,title,summary,body,note,occurred_on,created_at,is_deleted",
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

        const interventionQueries = [
          "id,student_id,class_id,title,status,priority,tier,due_on,review_due_on,review_due_date,next_review_on,note,notes,created_at,updated_at",
          "id,student_id,class_id,title,status,priority,tier,due_on,review_due_date,next_review_on,note,notes,created_at,updated_at",
          "id,student_id,class_id,title,status,priority,tier,due_on,note,notes,created_at,updated_at",
        ];

        let interventionRows: InterventionRow[] = [];

        for (const sel of interventionQueries) {
          const { data, error } = await supabase
            .from("interventions")
            .select(sel)
            .eq("student_id", studentId)
            .order("created_at", { ascending: false });

          if (!error) {
            interventionRows = ((data as any[]) ?? []) as InterventionRow[];
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
        setEvidence(evidenceRows);
        setInterventions(interventionRows);
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
     LOAD / SAVE CURATION STATE
     ────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!studentId || typeof window === "undefined") return;
    const stored = safeJsonParse<CurationMap>(
      localStorage.getItem(curationStorageKey(studentId)),
      {}
    );
    setCuration(stored);
  }, [studentId]);

  useEffect(() => {
    if (!studentId || typeof window === "undefined") return;
    localStorage.setItem(curationStorageKey(studentId), JSON.stringify(curation));
  }, [studentId, curation]);

  function patchCuration(evidenceId: string, patch: Partial<CurationFlags>) {
    setCuration((prev) => ({
      ...prev,
      [evidenceId]: {
        ...(prev[evidenceId] || {}),
        ...patch,
      },
    }));
  }

  function toggleCurationFlag(evidenceId: string, key: keyof CurationFlags) {
    setCuration((prev) => ({
      ...prev,
      [evidenceId]: {
        ...(prev[evidenceId] || {}),
        [key]: !prev[evidenceId]?.[key],
      },
    }));
  }

  /* ──────────────────────────────────────────────────────────
     DERIVED STATE
     ────────────────────────────────────────────────────────── */

  const displayName = useMemo(() => {
    return safe(overview?.student_name) || nameOf(student);
  }, [overview, student]);

  const tone = useMemo(
    () => attentionTone(overview?.attention_status),
    [overview?.attention_status]
  );

  const openInterventions = useMemo(() => {
    return interventions.filter((x) => isOpenIntervention(x.status));
  }, [interventions]);

  const overdueReviews = useMemo(() => {
    return openInterventions.filter((x) => {
      const ds = daysSince(reviewDate(x));
      return ds != null && ds > 0;
    });
  }, [openInterventions]);

  const lastEvidenceDate = useMemo(() => {
    return (
      safe(overview?.last_evidence_at) ||
      safe(evidence[0]?.occurred_on) ||
      safe(evidence[0]?.created_at) ||
      null
    );
  }, [overview?.last_evidence_at, evidence]);

  const lastEvidenceDays = useMemo(
    () => daysSince(lastEvidenceDate),
    [lastEvidenceDate]
  );

  const totalEvidence = evidence.length;
  const evidence30d = Number(overview?.evidence_count_30d ?? 0);

  const momentum = useMemo(() => {
    if ((lastEvidenceDays ?? 999) <= 10 && evidence30d >= 2) return "Improving";
    if ((lastEvidenceDays ?? 999) > 30 || evidence30d === 0) return "Declining";
    return "Stable";
  }, [lastEvidenceDays, evidence30d]);

  const areaProfile = useMemo<AreaProfileRow[]>(() => {
    const labels = [
      "Literacy",
      "Maths",
      "Science",
      "Wellbeing",
      "Humanities",
      "Other",
    ];

    return labels.map((label) => {
      const entries = evidence.filter((e) => guessArea(e.learning_area) === label);
      const fresh = entries.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d <= 30;
      });
      const latest = entries[0]?.occurred_on || entries[0]?.created_at || null;

      let strengthScore =
        Math.min(50, entries.length * 10) +
        Math.min(35, fresh.length * 15) +
        ((daysSince(latest) ?? 999) <= 21 ? 15 : 0);

      strengthScore = clamp(strengthScore);

      let readiness: AreaProfileRow["readiness"] = "Strong";
      if (entries.length === 0) readiness = "Gap";
      else if (fresh.length === 0 || (daysSince(latest) ?? 999) > 30) readiness = "Watch";

      return {
        label,
        evidenceCount: entries.length,
        freshCount: fresh.length,
        latest,
        strengthScore,
        readiness,
      };
    });
  }, [evidence]);

  const evidenceQualityRows = useMemo(() => {
    return evidence.map((row) => {
      const freshnessDays = daysSince(row.occurred_on || row.created_at);
      const freshnessScore =
        freshnessDays == null
          ? 30
          : freshnessDays <= 7
            ? 100
            : freshnessDays <= 21
              ? 82
              : freshnessDays <= 45
                ? 60
                : freshnessDays <= 75
                  ? 42
                  : 24;

      const areaScore = guessArea(row.learning_area) !== "Other" ? 78 : 48;
      const mediaScore = hasMedia(row) ? 100 : 40;
      const textScore = richTextScore(row);

      let score = Math.round(
        freshnessScore * 0.26 +
          areaScore * 0.16 +
          mediaScore * 0.14 +
          textScore * 0.44
      );

      const flags = curation[row.id] || {};
      if (flags.exemplar) score += 8;
      if (flags.weak) score -= 18;
      if (flags.needsRewrite) score -= 14;

      score = clamp(score);

      return {
        row,
        score,
        band: qualityBand(score),
        flags,
      };
    });
  }, [evidence, curation]);

  const evidenceBuckets = useMemo(() => {
    return evidenceQualityRows.reduce(
      (acc, item) => {
        if (item.band === "Strong") acc.strong += 1;
        else if (item.band === "Usable") acc.usable += 1;
        else if (item.band === "Thin") acc.thin += 1;
        else acc.weak += 1;
        return acc;
      },
      { strong: 0, usable: 0, thin: 0, weak: 0 }
    );
  }, [evidenceQualityRows]);

  const strongestEvidence = useMemo(() => {
    return [...evidenceQualityRows].sort((a, b) => b.score - a.score).slice(0, 3);
  }, [evidenceQualityRows]);

  const selectedForReport = useMemo(() => {
    return evidenceQualityRows.filter((x) => Boolean(x.flags.reportRole)).length;
  }, [evidenceQualityRows]);

  const selectedForConference = useMemo(() => {
    return evidenceQualityRows.filter((x) => x.flags.conferencePinned).length;
  }, [evidenceQualityRows]);

  const selectedForPortfolio = useMemo(() => {
    return evidenceQualityRows.filter((x) => x.flags.portfolioPinned).length;
  }, [evidenceQualityRows]);

  const exemplarCount = useMemo(() => {
    return evidenceQualityRows.filter((x) => x.flags.exemplar).length;
  }, [evidenceQualityRows]);

  const averageEvidenceQuality = useMemo(() => {
    if (!evidenceQualityRows.length) return 0;
    return Math.round(
      evidenceQualityRows.reduce((sum, x) => sum + x.score, 0) / evidenceQualityRows.length
    );
  }, [evidenceQualityRows]);

  const scoreCard = useMemo<ScoreCard>(() => {
    const coverageStrong = areaProfile.filter((x) => x.readiness === "Strong").length;
    const coverageWatch = areaProfile.filter((x) => x.readiness === "Watch").length;
    const coverageGaps = areaProfile.filter((x) => x.readiness === "Gap").length;

    const evidenceQuality = averageEvidenceQuality;

    const reportingReadiness = clamp(
      Math.round(
        averageEvidenceQuality * 0.38 +
          Math.min(100, coverageStrong * 20) * 0.34 +
          Math.min(100, selectedForReport * 18) * 0.18 +
          Math.max(0, 100 - (lastEvidenceDays ?? 45) * 2) * 0.1
      )
    );

    const authorityReadiness = clamp(
      Math.round(
        averageEvidenceQuality * 0.34 +
          Math.min(100, coverageStrong * 18) * 0.3 +
          Math.min(100, totalEvidence * 6) * 0.16 +
          Math.max(0, 100 - coverageGaps * 24) * 0.2
      )
    );

    const trajectoryForecast = clamp(
      Math.round(
        (momentum === "Improving" ? 88 : momentum === "Stable" ? 64 : 36) * 0.42 +
          Math.max(0, 100 - (lastEvidenceDays ?? 45) * 2.2) * 0.28 +
          Math.max(0, 100 - overdueReviews.length * 18) * 0.16 +
          Math.max(0, 100 - coverageWatch * 10 - coverageGaps * 18) * 0.14
      )
    );

    const supportEffectiveness = clamp(
      Math.round(
        (openInterventions.length === 0 ? 80 : 62) * 0.24 +
          Math.max(0, 100 - overdueReviews.length * 22) * 0.42 +
          Math.max(0, 100 - openInterventions.length * 10) * 0.1 +
          Math.max(0, 100 - coverageGaps * 14) * 0.1 +
          Math.max(0, 100 - (lastEvidenceDays ?? 45) * 1.2) * 0.14
      )
    );

    const conferenceReadiness = clamp(
      Math.round(
        reportingReadiness * 0.36 +
          Math.min(100, strongestEvidence.length * 28) * 0.18 +
          Math.min(100, selectedForConference * 20) * 0.14 +
          Math.min(100, selectedForPortfolio * 18) * 0.12 +
          Math.max(0, 100 - coverageGaps * 18) * 0.2
      )
    );

    return {
      evidenceQuality,
      reportingReadiness,
      authorityReadiness,
      trajectoryForecast,
      supportEffectiveness,
      conferenceReadiness,
    };
  }, [
    areaProfile,
    averageEvidenceQuality,
    strongestEvidence.length,
    selectedForConference,
    selectedForPortfolio,
    selectedForReport,
    totalEvidence,
    lastEvidenceDays,
    overdueReviews.length,
    openInterventions.length,
    momentum,
  ]);

  const strengths = useMemo(() => {
    return areaProfile
      .filter((x) => x.readiness === "Strong")
      .sort((a, b) => b.strengthScore - a.strengthScore)
      .slice(0, 3)
      .map((x) => `${x.label} is well represented with ${x.evidenceCount} evidence items.`);
  }, [areaProfile]);

  const watchAreas = useMemo(() => {
    return areaProfile
      .filter((x) => x.readiness !== "Strong")
      .sort((a, b) => a.strengthScore - b.strengthScore)
      .slice(0, 3)
      .map((x) =>
        x.readiness === "Gap"
          ? `${x.label} needs fresh evidence to strengthen coverage.`
          : `${x.label} is present but needs more recent or stronger evidence.`
      );
  }, [areaProfile]);

  const nextActions = useMemo<NextAction[]>(() => {
    const actions: NextAction[] = [];

    if ((lastEvidenceDays ?? 999) > 21) {
      actions.push({
        label: "Capture fresh evidence",
        reason: `Last evidence was ${lastEvidenceDays ?? "a long time"} days ago, so the learner story is becoming dated.`,
        priority: "high",
        href: `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
      });
    }

    if (overdueReviews.length > 0) {
      actions.push({
        label: "Review support plan",
        reason: `${overdueReviews.length} support review${
          overdueReviews.length === 1 ? "" : "s"
        } need follow-up.`,
        priority: "high",
        href: `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
      });
    }

    if (selectedForReport < 3 && evidenceQualityRows.length > 0) {
      actions.push({
        label: "Shortlist stronger report evidence",
        reason: "There are not yet enough clearly selected evidence items for a confident reporting pack.",
        priority: "medium",
        href: `/reports?studentId=${encodeURIComponent(studentId)}`,
      });
    }

    if (areaProfile.some((x) => x.readiness === "Gap")) {
      const firstGap = areaProfile.find((x) => x.readiness === "Gap");
      actions.push({
        label: `Broaden ${firstGap?.label || "coverage"} evidence`,
        reason: "A gap in learning-area coverage makes reporting and conference preparation more fragile.",
        priority: "medium",
        href: `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
      });
    }

    if (selectedForConference < 2 && strongestEvidence.length > 0) {
      actions.push({
        label: "Pin conference anchors",
        reason: "Select a few clear evidence anchors so this profile is ready for conversations with families.",
        priority: "low",
      });
    }

    if (!actions.length) {
      actions.push({
        label: "Maintain current momentum",
        reason: "Evidence freshness, support rhythm, and readiness signals are in a healthy range.",
        priority: "low",
      });
    }

    return actions.slice(0, 4);
  }, [
    areaProfile,
    evidenceQualityRows.length,
    lastEvidenceDays,
    overdueReviews.length,
    returnTo,
    selectedForConference,
    selectedForReport,
    strongestEvidence.length,
    studentId,
  ]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const evidenceItems: TimelineItem[] = evidence.slice(0, 10).map((row) => ({
      id: `e-${row.id}`,
      date: row.occurred_on || row.created_at || null,
      kind: "Evidence",
      title: safe(row.title) || safe(row.learning_area) || "Evidence",
      text: evidenceText(row),
    }));

    const interventionItems: TimelineItem[] = interventions.slice(0, 10).map((row) => ({
      id: `i-${row.id}`,
      date: row.updated_at || row.created_at || null,
      kind: "Intervention",
      title: safe(row.title) || "Support plan",
      text: clip(row.note) || clip(row.notes) || safe(row.status) || "Intervention update.",
    }));

    return [...evidenceItems, ...interventionItems]
      .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
      .slice(0, 12);
  }, [evidence, interventions]);

  const supportSummary = useMemo(() => {
    if (openInterventions.length === 0) {
      return "No active support plans are open right now, which keeps the support load light.";
    }
    if (overdueReviews.length >= 2) {
      return "Support activity is present, but review rhythm is slipping and needs attention.";
    }
    if (overdueReviews.length === 1) {
      return "Support activity is manageable, but one review is ready for follow-up.";
    }
    return "Support plans are active and review rhythm is currently holding.";
  }, [openInterventions.length, overdueReviews.length]);

  const conferenceBrief = useMemo(() => {
    const anchorIds = strongestEvidence.map((x) => x.row.id).slice(0, 2);
    const topConcern =
      watchAreas[0] ||
      "Coverage is broadly healthy, but a few more representative examples would strengthen confidence.";
    const nextStep = nextActions[0]?.label || "Maintain current momentum";

    return {
      strengthsToShare: strengths.length
        ? strengths
        : ["The current evidence base shows steady learner engagement across recent work."],
      priorityConcern: topConcern,
      evidenceAnchorIds: anchorIds,
      suggestedNextStep: nextStep,
      ready: scoreCard.conferenceReadiness >= 70,
    };
  }, [nextActions, scoreCard.conferenceReadiness, strengths, strongestEvidence, watchAreas]);

  const reportingSummary = useMemo(() => {
    const strongAreas = areaProfile.filter((x) => x.readiness === "Strong").map((x) => x.label);
    const thinAreas = areaProfile
      .filter((x) => x.readiness !== "Strong")
      .map((x) => x.label)
      .slice(0, 3);

    return {
      strongAreas,
      thinAreas,
    };
  }, [areaProfile]);

  const nextActionHeadline = useMemo(() => {
    if (safe(overview?.next_action)) return safe(overview?.next_action);
    return nextActions[0]?.label || "Maintain momentum";
  }, [overview?.next_action, nextActions]);

  /* ──────────────────────────────────────────────────────────
     SNAPSHOTS
     ────────────────────────────────────────────────────────── */

  async function refreshSnapshots() {
    if (!studentId) return;

    try {
      const rows = (await listStudentProfileSnapshots(studentId)) as SnapshotRow[];
      setSnapshots(rows || []);
    } catch (e: any) {
      console.error("Failed to load student profile snapshots:", e);
    }
  }

  useEffect(() => {
    refreshSnapshots();
  }, [studentId]);

  async function handleSaveSnapshot() {
    if (!studentId || !student) return;

    setSnapshotBusy(true);
    setSnapshotMessage(null);

    try {
      const selectedEvidenceIds = evidenceQualityRows
        .filter((x) => {
          const f = x.flags || {};
          return Boolean(
            f.reportRole || f.portfolioPinned || f.conferencePinned || f.exemplar
          );
        })
        .map((x) => x.row.id);

      const snapshot = await createStudentProfileSnapshot({
        studentId,
        classId: klass?.id || student?.class_id || null,
        snapshotTitle: `${displayName} — ${new Date().toLocaleDateString()}`,

        attentionStatus: overview?.attention_status || null,
        nextAction: nextActionHeadline,
        momentum,

        evidenceQuality: scoreCard.evidenceQuality,
        reportingReadiness: scoreCard.reportingReadiness,
        authorityReadiness: scoreCard.authorityReadiness,
        trajectoryForecast: scoreCard.trajectoryForecast,
        supportEffectiveness: scoreCard.supportEffectiveness,
        conferenceReadiness: scoreCard.conferenceReadiness,

        totalEvidence,
        evidence30d,
        openInterventionsCount: openInterventions.length,
        overdueReviewsCount: overdueReviews.length,
        lastEvidenceAt: lastEvidenceDate,

        strongAreas: reportingSummary.strongAreas,
        watchAreas: reportingSummary.thinAreas,

        nextActions: nextActions.map((x) => ({
          label: x.label,
          reason: x.reason,
          priority: x.priority,
          href: x.href,
        })),

        scoreCardJson: scoreCard,
        reportingSummaryJson: reportingSummary,
        conferenceBriefJson: conferenceBrief,
        curationJson: curation,
        selectedEvidenceIds,

        snapshotJson: {
          student: {
            id: student.id,
            name: displayName,
            yearLevel: student?.year_level ?? null,
            isIlp: Boolean(overview?.is_ilp || student?.is_ilp),
          },
          class: klass
            ? {
                id: klass.id,
                name: klass.name ?? null,
                teacherName: klass.teacher_name ?? null,
                room: klass.room ?? null,
              }
            : null,
          lastEvidenceDate,
          strengths,
          watchAreas,
          supportSummary,
          evidenceBuckets,
          strongestEvidence: strongestEvidence.map((x) => ({
            id: x.row.id,
            title: x.row.title ?? null,
            learningArea: x.row.learning_area ?? null,
            score: x.score,
            band: x.band,
          })),
        },
        status: "draft",
      });

      setSnapshotMessage(`Snapshot saved: ${snapshot.snapshot_title}`);
      await refreshSnapshots();
    } catch (e: any) {
      setSnapshotMessage(String(e?.message ?? e ?? "Failed to save snapshot."));
    } finally {
      setSnapshotBusy(false);
    }
  }

  async function handleUpdateSnapshotStatus(snapshotId: string, status: SnapshotStatus) {
    try {
      setSnapshotBusy(true);
      setSnapshotMessage(null);
      await updateSnapshotStatus(snapshotId, status);
      setSnapshotMessage(
        status === "final"
          ? "Snapshot finalised."
          : status === "archived"
            ? "Snapshot archived."
            : "Snapshot updated."
      );
      await refreshSnapshots();
    } catch (e: any) {
      setSnapshotMessage(String(e?.message ?? e ?? "Failed to update snapshot."));
    } finally {
      setSnapshotBusy(false);
    }
  }

  async function handleDeleteSnapshot(snapshotId: string) {
    const ok =
      typeof window === "undefined"
        ? true
        : window.confirm("Delete this student profile snapshot?");
    if (!ok) return;

    try {
      setSnapshotBusy(true);
      setSnapshotMessage(null);
      await deleteSnapshot(snapshotId);
      setSnapshotMessage("Snapshot deleted.");
      await refreshSnapshots();
    } catch (e: any) {
      setSnapshotMessage(String(e?.message ?? e ?? "Failed to delete snapshot."));
    } finally {
      setSnapshotBusy(false);
    }
  }

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
            Refreshing student profile…
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

        {snapshotMessage ? (
          <div
            style={{
              marginBottom: 14,
              borderRadius: 12,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              padding: 12,
              color: "#1d4ed8",
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {snapshotMessage}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => router.push(backHref)}
              style={SS.secondaryButton}
            >
              Back to students
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
                  `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
                    returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                  }`
                )
              }
              style={SS.primaryButton}
            >
              Add evidence
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
                    returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                  }`
                )
              }
              style={SS.secondaryButton}
            >
              Open support
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
              Build report
            </button>

            <button
              type="button"
              onClick={handleSaveSnapshot}
              disabled={snapshotBusy}
              style={{
                ...SS.secondaryButton,
                background: snapshotBusy ? "#e2e8f0" : "#ffffff",
                cursor: snapshotBusy ? "not-allowed" : "pointer",
              }}
            >
              {snapshotBusy ? "Saving snapshot…" : "Save snapshot"}
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
              Student development surface
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
              {displayName}
            </h1>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#475569",
                maxWidth: 820,
              }}
            >
              This page brings together evidence quality, reporting readiness, support rhythm,
              conference preparation, and next best moves for one learner.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip bg={tone.bg} bd={tone.bd} fg={tone.fg}>
                {tone.label}
              </Chip>
              <Chip bg="#ecfeff" bd="#a5f3fc" fg="#0c4a6e">
                Trajectory: {trajectoryBand(scoreCard.trajectoryForecast)}
              </Chip>
              <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                Reporting: {scoreToBand(scoreCard.reportingReadiness)}
              </Chip>
              <Chip bg="#fff7ed" bd="#fed7aa" fg="#9a3412">
                Support load: {supportBand(openInterventions.length, overdueReviews.length)}
              </Chip>
              <Chip
                bg={conferenceBrief.ready ? "#ecfdf5" : "#fff7ed"}
                bd={conferenceBrief.ready ? "#a7f3d0" : "#fed7aa"}
                fg={conferenceBrief.ready ? "#166534" : "#9a3412"}
              >
                Conference: {conferenceBand(scoreCard.conferenceReadiness)}
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
              Current posture
            </div>

            <div
              style={{
                fontSize: 18,
                lineHeight: 1.25,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {nextActionHeadline}
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#475569",
              }}
            >
              {nextActions[0]?.reason ||
                "Use the readiness, evidence, and support panels below to sharpen the next move."}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <SummaryRow label="Last evidence" value={shortDate(lastEvidenceDate)} />
              <SummaryRow label="Evidence in last 30 days" value={String(evidence30d)} />
              <SummaryRow label="Open supports" value={`${openInterventions.length} active`} />
              <SummaryRow label="Canonical route" value={canonicalHref} mono />
            </div>
          </div>
        </section>

        {/* Controls / metrics */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <ScoreTile
            label="Evidence quality"
            score={scoreCard.evidenceQuality}
            helper="Strength, freshness, and narrative usefulness of current evidence."
            tone="info"
          />
          <ScoreTile
            label="Reporting readiness"
            score={scoreCard.reportingReadiness}
            helper="How ready this learner is for a confident report draft."
            tone="primary"
          />
          <ScoreTile
            label="Authority readiness"
            score={scoreCard.authorityReadiness}
            helper="Breadth and defensibility for more formal reporting uses."
            tone="premium"
          />
          <ScoreTile
            label="Trajectory forecast"
            score={scoreCard.trajectoryForecast}
            helper="Likely near-term direction based on freshness, breadth, and support rhythm."
            tone={
              scoreCard.trajectoryForecast >= 70
                ? "success"
                : scoreCard.trajectoryForecast >= 50
                  ? "warning"
                  : "danger"
            }
          />
          <ScoreTile
            label="Support effectiveness"
            score={scoreCard.supportEffectiveness}
            helper="A simple guide to whether support load and review rhythm are healthy."
            tone={
              scoreCard.supportEffectiveness >= 70
                ? "success"
                : scoreCard.supportEffectiveness >= 50
                  ? "warning"
                  : "danger"
            }
          />
          <ScoreTile
            label="Conference readiness"
            score={scoreCard.conferenceReadiness}
            helper="How ready this profile is for a parent or student conversation."
            tone={
              scoreCard.conferenceReadiness >= 70
                ? "success"
                : scoreCard.conferenceReadiness >= 50
                  ? "warning"
                  : "danger"
            }
          />
        </section>

        {/* Main working area */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.35fr) minmax(300px, 0.95fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard
              title="Learner signals"
              help="A quick read of freshness, support rhythm, and coverage posture."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <SignalRow label="Momentum" value={momentum} note="Recent evidence pattern" />
                <SignalRow
                  label="Profile confidence"
                  value={`${Math.round(
                    clamp(
                      scoreCard.evidenceQuality * 0.46 +
                        scoreCard.reportingReadiness * 0.34 +
                        scoreCard.supportEffectiveness * 0.2
                    )
                  )}%`}
                  note="Overall strength of this learner view"
                />
                <SignalRow
                  label="Evidence freshness"
                  value={
                    lastEvidenceDays == null
                      ? "No recent date"
                      : `${lastEvidenceDays} day${lastEvidenceDays === 1 ? "" : "s"}`
                  }
                  note="Time since last evidence"
                />
                <SignalRow
                  label="Support load"
                  value={supportBand(openInterventions.length, overdueReviews.length)}
                  note={supportSummary}
                />
                <SignalRow
                  label="Trajectory"
                  value={trajectoryBand(scoreCard.trajectoryForecast)}
                  note="Near-term learner posture"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Strengths and watch areas"
              help="Auto-derived guidance from evidence coverage and quality."
            >
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={SS.overline}>Strengths to notice</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {strengths.length ? (
                      strengths.map((item, idx) => (
                        <div key={idx} style={SS.softNote}>
                          {item}
                        </div>
                      ))
                    ) : (
                      <div style={SS.softEmpty}>
                        Strong areas will appear here as the evidence base grows.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div style={SS.overline}>Watch areas</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {watchAreas.length ? (
                      watchAreas.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            ...SS.softNote,
                            background: "#fff7ed",
                            borderColor: "#fed7aa",
                            color: "#9a3412",
                          }}
                        >
                          {item}
                        </div>
                      ))
                    ) : (
                      <div style={SS.softEmpty}>
                        No obvious coverage watch areas are showing right now.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Next best moves"
              help="Prioritised actions that keep this learner profile useful and current."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {nextActions.map((action, idx) => {
                  const palette = priorityTone(action.priority);
                  return (
                    <div
                      key={`${action.label}-${idx}`}
                      style={{
                        borderRadius: 14,
                        border: `1px solid ${palette.bd}`,
                        background: palette.bg,
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
                        <Chip bg={palette.bg} bd={palette.bd} fg={palette.fg}>
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

          {/* CENTRE COLUMN */}
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard
              title="Evidence spotlight"
              help="The strongest current evidence items for reporting, conference use, or portfolio curation."
            >
              <div style={{ display: "grid", gap: 12 }}>
                {strongestEvidence.length ? (
                  strongestEvidence.map((item) => {
                    const palette = qualityTone(item.score);
                    const row = item.row;
                    return (
                      <div
                        key={row.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 16,
                          background: "#ffffff",
                          padding: 14,
                          display: "grid",
                          gap: 10,
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
                              fontSize: 15,
                              lineHeight: 1.3,
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          >
                            {safe(row.title) || safe(row.learning_area) || "Evidence"}
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Chip bg={palette.bg} bd={palette.bd} fg={palette.fg}>
                              {item.band}
                            </Chip>
                            <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                              {fullDate(row.occurred_on || row.created_at)}
                            </Chip>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                            {guessArea(row.learning_area)}
                          </Chip>
                          {safe(row.learning_area) ? (
                            <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                              {safe(row.learning_area)}
                            </Chip>
                          ) : null}
                          {hasMedia(row) ? (
                            <Chip bg="#ecfeff" bd="#a5f3fc" fg="#0c4a6e">
                              Media attached
                            </Chip>
                          ) : null}
                          {item.flags.exemplar ? (
                            <Chip bg="#fffaf0" bd="#fde68a" fg="#92400e">
                              Exemplar
                            </Chip>
                          ) : null}
                          {item.flags.reportRole ? (
                            <Chip bg="#ecfdf5" bd="#a7f3d0" fg="#166534">
                              Selected for report
                            </Chip>
                          ) : null}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: "#475569",
                          }}
                        >
                          {evidenceText(row)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={SS.softEmpty}>
                    Stronger evidence spotlights will appear here once the learner has more recent or richer records.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent evidence feed"
              help="Use this space to judge evidence quality and curate what belongs in reports, conferences, or portfolios."
              actions={
                <Chip bg="#ecfeff" bd="#a5f3fc" fg="#0c4a6e">
                  {totalEvidence} total
                </Chip>
              }
            >
              <div style={{ display: "grid", gap: 12 }}>
                {evidenceQualityRows.length === 0 ? (
                  <div style={SS.softEmpty}>No evidence recorded yet.</div>
                ) : (
                  evidenceQualityRows.slice(0, 10).map((item) => {
                    const row = item.row;
                    const palette = qualityTone(item.score);
                    const flags = item.flags;

                    return (
                      <div
                        key={row.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 16,
                          background: "#ffffff",
                          padding: 14,
                          display: "grid",
                          gap: 10,
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
                              fontSize: 15,
                              lineHeight: 1.3,
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          >
                            {safe(row.title) || safe(row.learning_area) || "Evidence"}
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Chip bg={palette.bg} bd={palette.bd} fg={palette.fg}>
                              {item.band} • {item.score}%
                            </Chip>
                            <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                              {fullDate(row.occurred_on || row.created_at)}
                            </Chip>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                            {guessArea(row.learning_area)}
                          </Chip>
                          {flags.reportRole ? (
                            <Chip bg="#ecfdf5" bd="#a7f3d0" fg="#166534">
                              {flags.reportRole === "core" ? "Core for report" : "Appendix for report"}
                            </Chip>
                          ) : null}
                          {flags.portfolioPinned ? (
                            <Chip bg="#f5f3ff" bd="#ddd6fe" fg="#6d28d9">
                              Portfolio
                            </Chip>
                          ) : null}
                          {flags.conferencePinned ? (
                            <Chip bg="#ecfeff" bd="#a5f3fc" fg="#0c4a6e">
                              Conference
                            </Chip>
                          ) : null}
                          {flags.needsRewrite ? (
                            <Chip bg="#fff7ed" bd="#fed7aa" fg="#9a3412">
                              Needs rewrite
                            </Chip>
                          ) : null}
                          {flags.weak ? (
                            <Chip bg="#fff1f2" bd="#fecdd3" fg="#be123c">
                              Weak
                            </Chip>
                          ) : null}
                          {flags.exemplar ? (
                            <Chip bg="#fffaf0" bd="#fde68a" fg="#92400e">
                              Exemplar
                            </Chip>
                          ) : null}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: "#475569",
                          }}
                        >
                          {evidenceText(row)}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() =>
                              patchCuration(row.id, {
                                reportRole: flags.reportRole === "core" ? undefined : "core",
                              })
                            }
                            style={SS.miniButton}
                          >
                            {flags.reportRole === "core" ? "Remove core tag" : "Mark core"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              patchCuration(row.id, {
                                reportRole: flags.reportRole === "appendix" ? undefined : "appendix",
                              })
                            }
                            style={SS.miniButton}
                          >
                            {flags.reportRole === "appendix" ? "Remove appendix tag" : "Mark appendix"}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCurationFlag(row.id, "portfolioPinned")}
                            style={SS.miniButton}
                          >
                            {flags.portfolioPinned ? "Unpin portfolio" : "Pin portfolio"}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCurationFlag(row.id, "conferencePinned")}
                            style={SS.miniButton}
                          >
                            {flags.conferencePinned ? "Unpin conference" : "Pin conference"}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCurationFlag(row.id, "exemplar")}
                            style={SS.miniButton}
                          >
                            {flags.exemplar ? "Clear exemplar" : "Mark exemplar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCurationFlag(row.id, "needsRewrite")}
                            style={SS.miniButton}
                          >
                            {flags.needsRewrite ? "Clear rewrite flag" : "Needs rewrite"}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCurationFlag(row.id, "weak")}
                            style={SS.miniButton}
                          >
                            {flags.weak ? "Clear weak flag" : "Mark weak"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Unified timeline"
              help="Combined evidence and support events for quick historical reading."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {timeline.length === 0 ? (
                  <div style={SS.softEmpty}>No student timeline events yet.</div>
                ) : (
                  timeline.map((row) => (
                    <div
                      key={row.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        background: "#ffffff",
                        padding: 12,
                        display: "grid",
                        gap: 8,
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
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {row.title}
                        </div>

                        <Chip
                          bg={row.kind === "Evidence" ? "#eff6ff" : "#fff7ed"}
                          bd={row.kind === "Evidence" ? "#bfdbfe" : "#fed7aa"}
                          fg={row.kind === "Evidence" ? "#2563eb" : "#9a3412"}
                        >
                          {row.kind} • {fullDate(row.date)}
                        </Chip>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: "#475569",
                        }}
                      >
                        {row.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard
              title="Reporting readiness"
              help="A quick bridge from student evidence into report-building confidence."
              actions={
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/reports?studentId=${encodeURIComponent(studentId)}${
                        returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                      }`
                    )
                  }
                  style={SS.primaryButton}
                >
                  Build report
                </button>
              }
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
                  <div style={SS.overline}>Readiness</div>
                  <div
                    style={{
                      fontSize: 28,
                      lineHeight: 1.1,
                      fontWeight: 900,
                      color: "#0f172a",
                    }}
                  >
                    {scoreCard.reportingReadiness}%
                  </div>
                  <div style={SS.smallText}>
                    {scoreToBand(scoreCard.reportingReadiness)} readiness based on evidence quality,
                    breadth, freshness, and selected report anchors.
                  </div>
                </div>

                <div>
                  <div style={SS.overline}>Coverage snapshot</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {reportingSummary.strongAreas.length ? (
                      reportingSummary.strongAreas.slice(0, 4).map((x) => (
                        <Chip key={x} bg="#ecfdf5" bd="#a7f3d0" fg="#166534">
                          {x}
                        </Chip>
                      ))
                    ) : (
                      <Chip bg="#fff7ed" bd="#fed7aa" fg="#9a3412">
                        No strong areas yet
                      </Chip>
                    )}
                  </div>
                </div>

                <div>
                  <div style={SS.overline}>Suggested improvements</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {reportingSummary.thinAreas.length ? (
                      reportingSummary.thinAreas.map((x) => (
                        <div key={x} style={SS.softNote}>
                          Build stronger or fresher evidence in {x}.
                        </div>
                      ))
                    ) : (
                      <div style={SS.softNote}>
                        Coverage is broadly healthy. Focus on selecting the clearest core evidence items.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Portfolio shortlist"
              help="A simple curation bridge from live evidence into showcase and print-ready surfaces."
              actions={
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/admin/students/${studentId}/portfolio${
                        returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
                      }`
                    )
                  }
                  style={SS.secondaryButton}
                >
                  Open portfolio
                </button>
              }
            >
              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat label="Pinned for portfolio" value={String(selectedForPortfolio)} />
                <MiniStat label="Selected for report" value={String(selectedForReport)} />
                <MiniStat label="Pinned for conference" value={String(selectedForConference)} />
                <MiniStat label="Exemplar items" value={String(exemplarCount)} />
              </div>
            </SectionCard>

            <SectionCard
              title="Saved snapshots"
              help="Freeze this student profile at a moment in time for review, conference prep, or reporting."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {snapshots.length === 0 ? (
                  <div style={SS.softEmpty}>
                    No saved snapshots yet. Save one when you want to freeze the current learner picture.
                  </div>
                ) : (
                  snapshots.map((snapshot) => (
                    <div
                      key={snapshot.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        background: "#ffffff",
                        padding: 12,
                        display: "grid",
                        gap: 8,
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
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {snapshot.snapshot_title}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Chip
                            bg={
                              snapshot.status === "final"
                                ? "#ecfdf5"
                                : snapshot.status === "archived"
                                  ? "#f8fafc"
                                  : "#eff6ff"
                            }
                            bd={
                              snapshot.status === "final"
                                ? "#a7f3d0"
                                : snapshot.status === "archived"
                                  ? "#e5e7eb"
                                  : "#bfdbfe"
                            }
                            fg={
                              snapshot.status === "final"
                                ? "#166534"
                                : snapshot.status === "archived"
                                  ? "#475569"
                                  : "#2563eb"
                            }
                          >
                            {snapshot.status}
                          </Chip>

                          <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                            {fullDate(snapshot.created_at)}
                          </Chip>
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <SummaryRow label="Reporting" value={`${snapshot.reporting_readiness}%`} />
                        <SummaryRow label="Conference" value={`${snapshot.conference_readiness}%`} />
                        <SummaryRow label="Trajectory" value={`${snapshot.trajectory_forecast}%`} />
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {snapshot.status !== "final" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateSnapshotStatus(snapshot.id, "final")}
                            style={SS.miniButton}
                          >
                            Finalise
                          </button>
                        ) : null}

                        {snapshot.status !== "archived" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateSnapshotStatus(snapshot.id, "archived")}
                            style={SS.miniButton}
                          >
                            Archive
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(snapshot.id)}
                          style={SS.miniButton}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Conference brief"
              help="A calm, practical summary to help prepare for family conversations."
              actions={
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/admin/students/${studentId}/conference${
                        returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
                      }`
                    )
                  }
                  style={SS.secondaryButton}
                >
                  Open conference view
                </button>
              }
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <div style={SS.overline}>Strengths to mention</div>
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {conferenceBrief.strengthsToShare.map((item, idx) => (
                      <div key={idx} style={SS.softNote}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={SS.overline}>Priority concern</div>
                  <div style={SS.softNote}>{conferenceBrief.priorityConcern}</div>
                </div>

                <div>
                  <div style={SS.overline}>Suggested next step</div>
                  <div style={SS.softNote}>{conferenceBrief.suggestedNextStep}</div>
                </div>

                <div>
                  <div style={SS.overline}>Evidence anchors</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {conferenceBrief.evidenceAnchorIds.length ? (
                      conferenceBrief.evidenceAnchorIds.map((id) => (
                        <Chip key={id} bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                          {id}
                        </Chip>
                      ))
                    ) : (
                      <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                        No anchor items selected yet
                      </Chip>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Area profile"
              help="Quick balance view across common learning domains."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {areaProfile.map((area) => {
                  const palette =
                    area.readiness === "Strong"
                      ? { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" }
                      : area.readiness === "Watch"
                        ? { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" }
                        : { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };

                  return (
                    <div
                      key={area.label}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        background: "#ffffff",
                        padding: 12,
                        display: "grid",
                        gap: 8,
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
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                          {area.label}
                        </div>
                        <Chip bg={palette.bg} bd={palette.bd} fg={palette.fg}>
                          {area.readiness}
                        </Chip>
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <SummaryRow label="Evidence" value={String(area.evidenceCount)} />
                        <SummaryRow label="Fresh" value={String(area.freshCount)} />
                        <SummaryRow label="Latest" value={shortDate(area.latest)} />
                        <SummaryRow label="Strength" value={`${area.strengthScore}%`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Quality mix"
              help="A simple summary of how usable the current evidence base is."
            >
              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat label="Strong" value={String(evidenceBuckets.strong)} />
                <MiniStat label="Usable" value={String(evidenceBuckets.usable)} />
                <MiniStat label="Thin" value={String(evidenceBuckets.thin)} />
                <MiniStat label="Weak" value={String(evidenceBuckets.weak)} />
              </div>
            </SectionCard>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   STYLES
   ────────────────────────────────────────────────────────────── */

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
