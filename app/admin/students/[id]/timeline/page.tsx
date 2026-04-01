"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentHubNav from "@/app/admin/components/StudentHubNav";
import { supabase } from "@/lib/supabaseClient";
import {
  buildStudentListPath,
  buildStudentProfilePath,
} from "@/lib/studentRoutes";
import {
  listStudentEvidenceCuration,
  replaceStudentEvidenceCuration,
  type StudentEvidenceCurationMap,
} from "@/lib/studentEvidenceCuration";

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

type TimelineKind = "All" | "Evidence" | "Intervention";
type TimeWindow = "all" | "14" | "30" | "90";

type CurationFlags = {
  reportRole?: "core" | "appendix";
  portfolioPinned?: boolean;
  conferencePinned?: boolean;
  exemplar?: boolean;
  weak?: boolean;
  needsRewrite?: boolean;
};

type CurationMap = Record<string, CurationFlags>;

type TimelinePriority = "highlight" | "watch" | "neutral";

type TimelineItem = {
  id: string;
  sourceId: string;
  date: string | null;
  kind: "Evidence" | "Intervention";
  title: string;
  text: string;
  metaA?: string;
  metaB?: string;
  significance:
    | "Strong evidence"
    | "Usable evidence"
    | "Thin evidence"
    | "Weak evidence"
    | "Critical support"
    | "Support update";
  priority: TimelinePriority;
  searchable: string;
};

type TimelineAction = {
  label: string;
  reason: string;
  priority: "high" | "medium" | "low";
  href?: string;
};

type TimelineSignal = {
  label: string;
  value: string;
  helper: string;
  tone: "success" | "warning" | "danger" | "info" | "primary";
};

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */

const CURATION_KEY_PREFIX = "edudecks_student_profile_curation_v1:";

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 160) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
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
  return Math.max(
    0,
    Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
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

function nameOf(s: Student | null) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name || s.last_name
  )}`.trim();
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
  return !["closed", "done", "resolved", "archived", "completed"].includes(s);
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
    x.includes("behaviour") ||
    x.includes("behavior") ||
    x.includes("health") ||
    x.includes("social")
  ) {
    return "Wellbeing";
  }
  if (
    x.includes("history") ||
    x.includes("geography") ||
    x.includes("hass") ||
    x.includes("human")
  ) {
    return "Humanities";
  }
  return "Other";
}

function evidenceText(row: EvidenceEntryRow) {
  return (
    clip(row.summary, 180) ||
    clip(row.body, 180) ||
    clip(row.note, 180) ||
    "Evidence recorded."
  );
}

function richTextScore(row: EvidenceEntryRow) {
  const text = [safe(row.title), safe(row.summary), safe(row.body), safe(row.note)].join(" ");
  const len = text.length;
  if (len >= 320) return 100;
  if (len >= 220) return 82;
  if (len >= 140) return 68;
  if (len >= 80) return 54;
  if (len > 0) return 34;
  return 12;
}

function evidenceQualityScore(row: EvidenceEntryRow, flags?: CurationFlags) {
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

  if (flags?.exemplar) score += 8;
  if (flags?.weak) score -= 18;
  if (flags?.needsRewrite) score -= 14;

  return Math.max(0, Math.min(100, score));
}

function evidenceBand(score: number) {
  if (score >= 78) return "Strong evidence" as const;
  if (score >= 58) return "Usable evidence" as const;
  if (score >= 38) return "Thin evidence" as const;
  return "Weak evidence" as const;
}

function evidencePriority(score: number): TimelinePriority {
  if (score >= 78) return "highlight";
  if (score < 38) return "watch";
  return "neutral";
}

function supportPriority(row: InterventionRow): TimelinePriority {
  const overdue = (() => {
    const d = daysSince(reviewDate(row));
    return d != null && d > 0;
  })();

  const status = safe(row.status).toLowerCase();
  const priority = safe(row.priority).toLowerCase();

  if (overdue || priority.includes("high") || status.includes("urgent")) return "watch";
  return "neutral";
}

function significanceTone(significance: TimelineItem["significance"]) {
  if (significance === "Strong evidence") {
    return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534", dot: "#22c55e" };
  }
  if (significance === "Usable evidence") {
    return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e", dot: "#06b6d4" };
  }
  if (significance === "Thin evidence") {
    return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412", dot: "#f59e0b" };
  }
  if (significance === "Weak evidence") {
    return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c", dot: "#ef4444" };
  }
  if (significance === "Critical support") {
    return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c", dot: "#f97316" };
  }
  return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412", dot: "#fb923c" };
}

function priorityTone(priority: TimelineAction["priority"]) {
  if (priority === "high") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  if (priority === "medium") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
}

function metricTone(tone: TimelineSignal["tone"]) {
  if (tone === "success") return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  if (tone === "warning") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  if (tone === "danger") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  if (tone === "info") return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
  return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#2563eb" };
}

function toDbCurationMap(curation: CurationMap): StudentEvidenceCurationMap {
  const map: StudentEvidenceCurationMap = {};

  Object.entries(curation).forEach(([evidenceId, flags]) => {
    map[evidenceId] = {
      reportRole:
        flags.reportRole === "core" || flags.reportRole === "appendix"
          ? flags.reportRole
          : undefined,
      portfolioPinned: Boolean(flags.portfolioPinned),
      conferencePinned: Boolean(flags.conferencePinned),
      exemplar: Boolean(flags.exemplar),
      weak: Boolean(flags.weak),
      needsRewrite: Boolean(flags.needsRewrite),
    };
  });

  return map;
}

function fromDbCurationMap(curation: StudentEvidenceCurationMap): CurationMap {
  const map: CurationMap = {};

  Object.entries(curation || {}).forEach(([evidenceId, flags]) => {
    map[evidenceId] = {
      reportRole:
        flags.reportRole === "core" || flags.reportRole === "appendix"
          ? flags.reportRole
          : undefined,
      portfolioPinned: Boolean(flags.portfolioPinned),
      conferencePinned: Boolean(flags.conferencePinned),
      exemplar: Boolean(flags.exemplar),
      weak: Boolean(flags.weak),
      needsRewrite: Boolean(flags.needsRewrite),
    };
  });

  return map;
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
          alignItems: "flex-start",
          gap: 12,
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

function SignalCard({ signal }: { signal: TimelineSignal }) {
  const p = metricTone(signal.tone);
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
        {signal.label}
      </div>
      <div
        style={{
          fontSize: 26,
          lineHeight: 1.1,
          fontWeight: 900,
          color: "#0f172a",
          marginBottom: 8,
        }}
      >
        {signal.value}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "#475569",
        }}
      >
        {signal.helper}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */

export default function StudentTimelinePage() {
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
  const [curation, setCuration] = useState<CurationMap>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [curationBusy, setCurationBusy] = useState(false);
  const [curationMessage, setCurationMessage] = useState<string | null>(null);

  const [kindFilter, setKindFilter] = useState<TimelineKind>("All");
  const [windowFilter, setWindowFilter] = useState<TimeWindow>("all");
  const [searchText, setSearchText] = useState("");

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

        const evidenceQueries = [
          "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted,attachment_urls,image_url,photo_url,file_url",
          "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted",
          "id,student_id,class_id,title,summary,body,note,learning_area,occurred_on,created_at,is_deleted",
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
            .order("updated_at", { ascending: false })
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
        setEvidence(((evidenceRows as any[]) ?? []) as EvidenceEntryRow[]);
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
     CURATION STATE
     ────────────────────────────────────────────────────────── */

  useEffect(() => {
    async function loadCuration() {
      if (!studentId) return;

      try {
        const rows = await listStudentEvidenceCuration(studentId);

        if (rows.length > 0) {
          const dbMap: CurationMap = {};
          rows.forEach((row) => {
            dbMap[row.evidence_id] = {
              reportRole:
                row.report_role === "core" || row.report_role === "appendix"
                  ? row.report_role
                  : undefined,
              portfolioPinned: Boolean(row.portfolio_pinned),
              conferencePinned: Boolean(row.conference_pinned),
              exemplar: Boolean(row.exemplar),
              weak: Boolean(row.weak),
              needsRewrite: Boolean(row.needs_rewrite),
            };
          });
          setCuration(dbMap);
          if (typeof window !== "undefined") {
            localStorage.setItem(curationStorageKey(studentId), JSON.stringify(dbMap));
          }
          return;
        }

        if (typeof window !== "undefined") {
          const stored = safeJsonParse<CurationMap>(
            localStorage.getItem(curationStorageKey(studentId)),
            {}
          );
          setCuration(stored);

          if (Object.keys(stored).length > 0) {
            try {
              await replaceStudentEvidenceCuration(studentId, toDbCurationMap(stored));
              setCurationMessage("Existing timeline curation was migrated into saved storage.");
            } catch (migrationError: any) {
              console.error("Failed to migrate timeline curation:", migrationError);
            }
          }
        }
      } catch (e: any) {
        console.error("Failed to load student evidence curation:", e);
        if (typeof window !== "undefined") {
          const stored = safeJsonParse<CurationMap>(
            localStorage.getItem(curationStorageKey(studentId)),
            {}
          );
          setCuration(stored);
        }
      }
    }

    loadCuration();
  }, [studentId]);

  async function saveCuration(next: CurationMap, successMessage?: string) {
    if (!studentId) return;

    setCuration(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(curationStorageKey(studentId), JSON.stringify(next));
    }

    try {
      setCurationBusy(true);
      setCurationMessage(null);
      await replaceStudentEvidenceCuration(studentId, toDbCurationMap(next));
      if (successMessage) {
        setCurationMessage(successMessage);
      }
    } catch (e: any) {
      setCurationMessage(
        String(e?.message ?? e ?? "Failed to save curation changes.")
      );
    } finally {
      setCurationBusy(false);
    }
  }

  function patchCuration(evidenceId: string, patch: Partial<CurationFlags>) {
    const next: CurationMap = {
      ...curation,
      [evidenceId]: {
        ...(curation[evidenceId] || {}),
        ...patch,
      },
    };

    void saveCuration(next, "Timeline curation saved.");
  }

  function toggleCurationFlag(evidenceId: string, key: keyof CurationFlags) {
    const next: CurationMap = {
      ...curation,
      [evidenceId]: {
        ...(curation[evidenceId] || {}),
        [key]: !curation[evidenceId]?.[key],
      },
    };

    void saveCuration(next, "Timeline curation saved.");
  }

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

  const openInterventions = useMemo(() => {
    return interventions.filter((x) => isOpenIntervention(x.status));
  }, [interventions]);

  const overdueReviews = useMemo(() => {
    return openInterventions.filter((x) => {
      const ds = daysSince(reviewDate(x));
      return ds != null && ds > 0;
    });
  }, [openInterventions]);

  const evidenceItems = useMemo<TimelineItem[]>(() => {
    return evidence.map((row) => {
      const flags = curation[row.id] || {};
      const score = evidenceQualityScore(row, flags);
      const significance = evidenceBand(score);

      return {
        id: `e-${row.id}`,
        sourceId: row.id,
        date: row.occurred_on || row.created_at || null,
        kind: "Evidence",
        title: safe(row.title) || safe(row.learning_area) || "Evidence",
        text: evidenceText(row),
        metaA: guessArea(row.learning_area),
        metaB: safe(row.visibility) || safe(row.evidence_type) || "",
        significance,
        priority: evidencePriority(score),
        searchable: [
          safe(row.title),
          safe(row.summary),
          safe(row.body),
          safe(row.note),
          safe(row.learning_area),
          safe(row.evidence_type),
          safe(row.visibility),
        ]
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [curation, evidence]);

  const interventionItems = useMemo<TimelineItem[]>(() => {
    return interventions.map((row) => {
      const critical = supportPriority(row) === "watch";
      return {
        id: `i-${row.id}`,
        sourceId: row.id,
        date: row.updated_at || row.created_at || null,
        kind: "Intervention",
        title: safe(row.title) || "Support plan",
        text:
          clip(row.note, 180) ||
          clip(row.notes, 180) ||
          safe(row.status) ||
          "Intervention update.",
        metaA: safe(row.status) || "Open",
        metaB: safe(reviewDate(row)) ? `Review ${shortDate(reviewDate(row))}` : "",
        significance: critical ? "Critical support" : "Support update",
        priority: critical ? "watch" : "neutral",
        searchable: [
          safe(row.title),
          safe(row.status),
          safe(row.priority),
          safe(row.note),
          safe(row.notes),
          safe(row.tier),
        ]
          .join(" ")
          .toLowerCase(),
      };
    });
  }, [interventions]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    return [...evidenceItems, ...interventionItems].sort(
      (a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
    );
  }, [evidenceItems, interventionItems]);

  const filteredTimeline = useMemo(() => {
    const q = safe(searchText).toLowerCase();

    return timelineItems.filter((item) => {
      if (kindFilter !== "All" && item.kind !== kindFilter) return false;

      if (windowFilter !== "all") {
        const cutoff = daysAgo(Number(windowFilter));
        const d = item.date ? new Date(item.date) : null;
        if (!d || Number.isNaN(d.getTime()) || d < cutoff) return false;
      }

      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        safe(item.metaA).toLowerCase().includes(q) ||
        safe(item.metaB).toLowerCase().includes(q) ||
        item.searchable.includes(q)
      );
    });
  }, [timelineItems, kindFilter, windowFilter, searchText]);

  const groupedTimeline = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();

    filteredTimeline.forEach((item) => {
      const key = shortDate(item.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });

    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [filteredTimeline]);

  const latestTimelineDate = useMemo(() => {
    return filteredTimeline[0]?.date || overview?.last_evidence_at || null;
  }, [filteredTimeline, overview?.last_evidence_at]);

  const evidence30d = Number(overview?.evidence_count_30d ?? 0);

  const momentum = useMemo(() => {
    const d = daysSince(latestTimelineDate);
    if ((d ?? 999) <= 10 && evidence30d >= 2) return "Improving";
    if ((d ?? 999) > 30 || evidence30d === 0) return "Declining";
    return "Stable";
  }, [latestTimelineDate, evidence30d]);

  const highlightedCount = useMemo(() => {
    return filteredTimeline.filter((x) => x.priority === "highlight").length;
  }, [filteredTimeline]);

  const watchCount = useMemo(() => {
    return filteredTimeline.filter((x) => x.priority === "watch").length;
  }, [filteredTimeline]);

  const recentEvidenceCount = useMemo(() => {
    return evidenceItems.filter((x) => {
      const d = daysSince(x.date);
      return d != null && d <= 14;
    }).length;
  }, [evidenceItems]);

  const strongEvidenceCount = useMemo(() => {
    return evidenceItems.filter((x) => x.significance === "Strong evidence").length;
  }, [evidenceItems]);

  const weakEvidenceCount = useMemo(() => {
    return evidenceItems.filter((x) => x.significance === "Weak evidence").length;
  }, [evidenceItems]);

  const timelineSignals = useMemo<TimelineSignal[]>(() => {
    return [
      {
        label: "Timeline events",
        value: String(filteredTimeline.length),
        helper: "Combined evidence and support events in the current filtered view.",
        tone: "primary",
      },
      {
        label: "Recent evidence",
        value: String(recentEvidenceCount),
        helper: "Evidence captured in the most recent 14-day window.",
        tone:
          recentEvidenceCount >= 2
            ? "success"
            : recentEvidenceCount >= 1
              ? "warning"
              : "danger",
      },
      {
        label: "Watch events",
        value: String(watchCount),
        helper: "Events that likely need attention, follow-up, or stronger evidence.",
        tone: watchCount === 0 ? "success" : watchCount <= 2 ? "warning" : "danger",
      },
      {
        label: "Strong evidence",
        value: String(strongEvidenceCount),
        helper: "Evidence items strong enough to anchor reporting, portfolios, or conferences.",
        tone:
          strongEvidenceCount >= 3
            ? "success"
            : strongEvidenceCount >= 1
              ? "info"
              : "warning",
      },
    ];
  }, [filteredTimeline.length, recentEvidenceCount, watchCount, strongEvidenceCount]);

  const narrativeRead = useMemo(() => {
    if (!timelineItems.length) {
      return "This learner does not yet have a visible student story on the timeline. The next best move is to add fresh evidence so the profile becomes usable for reporting and conferences.";
    }

    if (recentEvidenceCount === 0 && openInterventions.length > 0) {
      return "Support activity is visible, but recent evidence is thin. That makes it hard to judge whether support is helping. Capture fresh learning evidence before the profile becomes stale.";
    }

    if (overdueReviews.length > 0 && recentEvidenceCount <= 1) {
      return "The timeline shows both review pressure and thin recent evidence. This learner story is becoming fragile and needs immediate follow-up in both support and evidence capture.";
    }

    if (momentum === "Improving" && strongEvidenceCount >= 2) {
      return "The timeline suggests a healthier learner rhythm: recent evidence is visible, stronger examples are appearing, and the profile is becoming easier to use for report or conference preparation.";
    }

    if (weakEvidenceCount >= 2) {
      return "The timeline is active, but some entries look too thin to carry much reporting weight. Strengthen the evidence base with richer summaries, clearer learning-area tagging, or attached work samples.";
    }

    return "The learner story is present and usable, but it would be stronger with clearer anchors, fresher evidence, and a tighter link between support actions and visible learning movement.";
  }, [
    timelineItems.length,
    recentEvidenceCount,
    openInterventions.length,
    overdueReviews.length,
    momentum,
    strongEvidenceCount,
    weakEvidenceCount,
  ]);

  const timelineActions = useMemo<TimelineAction[]>(() => {
    const actions: TimelineAction[] = [];

    const latestDays = daysSince(latestTimelineDate);

    if ((latestDays ?? 999) > 21) {
      actions.push({
        label: "Capture fresh evidence",
        reason: `The last visible event was ${latestDays ?? "many"} days ago, so the learner story is beginning to date.`,
        priority: "high",
        href: `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
      });
    }

    if (overdueReviews.length > 0) {
      actions.push({
        label: "Resolve overdue support reviews",
        reason: `${overdueReviews.length} active support review${
          overdueReviews.length === 1 ? "" : "s"
        } appear overdue in the timeline.`,
        priority: "high",
        href: `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
          returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
        }`,
      });
    }

    if (strongEvidenceCount < 3 && evidenceItems.length > 0) {
      actions.push({
        label: "Create stronger evidence anchors",
        reason: "The timeline would benefit from more high-value evidence items that can carry reporting and conference conversations.",
        priority: "medium",
      });
    }

    if (weakEvidenceCount >= 2) {
      actions.push({
        label: "Improve weak evidence entries",
        reason: "Several evidence items appear thin or weak, reducing the usefulness of the timeline for later outputs.",
        priority: "medium",
      });
    }

    if (highlightedCount < 2 && evidenceItems.length > 0) {
      actions.push({
        label: "Pin timeline anchors",
        reason: "Select a few standout evidence items for reports, portfolios, or conference use.",
        priority: "low",
      });
    }

    if (!actions.length) {
      actions.push({
        label: "Maintain current rhythm",
        reason: "The timeline is holding together well. Keep evidence fresh and continue using strong items as anchors.",
        priority: "low",
      });
    }

    return actions.slice(0, 5);
  }, [
    latestTimelineDate,
    overdueReviews.length,
    studentId,
    returnTo,
    strongEvidenceCount,
    weakEvidenceCount,
    highlightedCount,
    evidenceItems.length,
  ]);

  const topEvidenceCandidates = useMemo(() => {
    return evidenceItems
      .filter(
        (x) =>
          x.significance === "Strong evidence" || x.significance === "Usable evidence"
      )
      .slice(0, 4);
  }, [evidenceItems]);

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
            Refreshing student timeline…
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

        {curationMessage ? (
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
            {curationMessage}
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
            {curationBusy ? (
              <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                Saving curation…
              </Chip>
            ) : (
              <Chip bg="#ecfdf5" bd="#a7f3d0" fg="#166534">
                Curation saved
              </Chip>
            )}
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
              Open supports
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
              Student timeline intelligence
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
              This page turns the learner timeline into a usable story by highlighting significant
              evidence, surfacing support pressure, and pointing toward the next best move.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip bg={attention.bg} bd={attention.bd} fg={attention.fg}>
                {attention.label}
              </Chip>
              <Chip bg="#ecfeff" bd="#a5f3fc" fg="#0c4a6e">
                Momentum: {momentum}
              </Chip>
              <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                Latest event: {shortDate(latestTimelineDate)}
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
              Timeline reading
            </div>

            <div
              style={{
                fontSize: 18,
                lineHeight: 1.25,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {safe(overview?.next_action) || timelineActions[0]?.label || "Maintain visibility"}
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#475569",
              }}
            >
              {narrativeRead}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <SummaryRow label="Timeline events" value={String(timelineItems.length)} />
              <SummaryRow label="Recent evidence" value={String(recentEvidenceCount)} />
              <SummaryRow label="Open supports" value={String(openInterventions.length)} />
              <SummaryRow label="Overdue reviews" value={String(overdueReviews.length)} />
            </div>
          </div>
        </section>

        {/* Scorecard */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {timelineSignals.map((signal) => (
            <SignalCard key={signal.label} signal={signal} />
          ))}
        </section>

        {/* Main grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(300px, 0.88fr) minmax(0, 1.35fr) minmax(300px, 0.92fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          {/* LEFT */}
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard
              title="Timeline intelligence"
              help="A quick interpretation layer that turns the event log into a usable learner story."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <div style={SS.softNote}>
                  <strong style={{ color: "#0f172a" }}>Narrative read:</strong> {narrativeRead}
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <InterpretationRow
                    label="Evidence rhythm"
                    value={
                      recentEvidenceCount >= 2
                        ? "Healthy recent visibility"
                        : recentEvidenceCount === 1
                          ? "Light recent visibility"
                          : "No recent evidence"
                    }
                  />
                  <InterpretationRow
                    label="Support pressure"
                    value={
                      overdueReviews.length > 1
                        ? "High review pressure"
                        : overdueReviews.length === 1
                          ? "Review follow-up needed"
                          : "Support rhythm holding"
                    }
                  />
                  <InterpretationRow
                    label="Timeline quality"
                    value={
                      strongEvidenceCount >= 3
                        ? "Strong anchors visible"
                        : strongEvidenceCount >= 1
                          ? "Some anchors visible"
                          : "Anchors still weak"
                    }
                  />
                  <InterpretationRow
                    label="Overall posture"
                    value={
                      watchCount > 2
                        ? "Fragile"
                        : momentum === "Improving"
                          ? "Strengthening"
                          : momentum === "Declining"
                            ? "Drifting"
                            : "Stable"
                    }
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Next actions from timeline"
              help="The highest-value moves suggested by the learner story over time."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {timelineActions.map((action, idx) => {
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

            <SectionCard
              title="Timeline anchors"
              help="The strongest current candidates for reporting, conferences, and portfolio curation."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {topEvidenceCandidates.length ? (
                  topEvidenceCandidates.map((item) => {
                    const t = significanceTone(item.significance);
                    const flags = curation[item.sourceId] || {};

                    return (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          padding: 12,
                          background: "#f8fafc",
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
                            {item.title}
                          </div>
                          <Chip bg={t.bg} bd={t.bd} fg={t.fg}>
                            {item.significance}
                          </Chip>
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.55,
                            color: "#475569",
                          }}
                        >
                          {item.text}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() =>
                              patchCuration(item.sourceId, {
                                reportRole:
                                  flags.reportRole === "core" ? undefined : "core",
                              })
                            }
                            style={SS.miniButton}
                          >
                            {flags.reportRole === "core" ? "Remove core" : "Mark core"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCurationFlag(item.sourceId, "portfolioPinned")}
                            style={SS.miniButton}
                          >
                            {flags.portfolioPinned ? "Unpin portfolio" : "Pin portfolio"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCurationFlag(item.sourceId, "conferencePinned")}
                            style={SS.miniButton}
                          >
                            {flags.conferencePinned ? "Unpin conference" : "Pin conference"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={SS.softEmpty}>
                    Stronger anchor items will appear here once the timeline contains richer recent evidence.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          {/* CENTRE */}
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard
              title="Timeline filters"
              help="Narrow the learner story by event type, time window, or keyword."
              actions={
                <Chip bg="#ecfeff" bd="#a5f3fc" fg="#0c4a6e">
                  Showing {filteredTimeline.length} of {timelineItems.length}
                </Chip>
              }
            >
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    style={kindFilter === "All" ? SS.primaryButton : SS.secondaryButton}
                    onClick={() => setKindFilter("All")}
                    type="button"
                  >
                    All
                  </button>
                  <button
                    style={kindFilter === "Evidence" ? SS.primaryButton : SS.secondaryButton}
                    onClick={() => setKindFilter("Evidence")}
                    type="button"
                  >
                    Evidence
                  </button>
                  <button
                    style={
                      kindFilter === "Intervention" ? SS.primaryButton : SS.secondaryButton
                    }
                    onClick={() => setKindFilter("Intervention")}
                    type="button"
                  >
                    Intervention
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["all", "14", "30", "90"] as TimeWindow[]).map((windowKey) => (
                    <button
                      key={windowKey}
                      type="button"
                      onClick={() => setWindowFilter(windowKey)}
                      style={windowFilter === windowKey ? SS.primaryButton : SS.secondaryButton}
                    >
                      {windowKey === "all" ? "All time" : `Last ${windowKey} days`}
                    </button>
                  ))}
                </div>

                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search timeline..."
                  style={{
                    minWidth: 260,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#1f2937",
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Chronological development story"
              help="A combined timeline of evidence and support movement, with stronger weighting for the events that matter most."
            >
              <div style={{ display: "grid", gap: 14 }}>
                {groupedTimeline.length === 0 ? (
                  <div style={SS.softEmpty}>No timeline events match the current filters.</div>
                ) : (
                  groupedTimeline.map((group) => (
                    <div key={group.date} style={{ display: "grid", gap: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                          {group.date}
                        </Chip>
                        <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                          {group.items.length} event{group.items.length === 1 ? "" : "s"}
                        </Chip>
                      </div>

                      <div style={{ display: "grid", gap: 12, position: "relative" }}>
                        {group.items.map((item) => {
                          const tone = significanceTone(item.significance);
                          const evidenceFlags =
                            item.kind === "Evidence" ? curation[item.sourceId] || {} : null;

                          return (
                            <div
                              key={item.id}
                              style={{
                                border:
                                  item.priority === "highlight"
                                    ? `1px solid ${tone.bd}`
                                    : item.priority === "watch"
                                      ? "1px solid #fecdd3"
                                      : "1px solid #e5e7eb",
                                borderRadius: 16,
                                background:
                                  item.priority === "highlight"
                                    ? tone.bg
                                    : item.priority === "watch"
                                      ? "#fffaf0"
                                      : "#ffffff",
                                padding: 14,
                                display: "grid",
                                gap: 10,
                                boxShadow:
                                  item.priority === "highlight"
                                    ? "0 10px 24px rgba(15,23,42,0.05)"
                                    : "none",
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
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: 999,
                                      background: tone.dot,
                                      display: "inline-block",
                                    }}
                                  />
                                  <div
                                    style={{
                                      fontSize: 15,
                                      lineHeight: 1.3,
                                      fontWeight: 800,
                                      color: "#0f172a",
                                    }}
                                  >
                                    {item.title}
                                  </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <Chip bg={tone.bg} bd={tone.bd} fg={tone.fg}>
                                    {item.significance}
                                  </Chip>
                                  <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                                    {item.kind}
                                  </Chip>
                                  <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                                    {fullDate(item.date)}
                                  </Chip>
                                </div>
                              </div>

                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {safe(item.metaA) ? (
                                  <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                                    {safe(item.metaA)}
                                  </Chip>
                                ) : null}
                                {safe(item.metaB) ? (
                                  <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                                    {safe(item.metaB)}
                                  </Chip>
                                ) : null}
                                {evidenceFlags?.reportRole ? (
                                  <Chip bg="#ecfdf5" bd="#a7f3d0" fg="#166534">
                                    {evidenceFlags.reportRole === "core" ? "Core" : "Appendix"}
                                  </Chip>
                                ) : null}
                                {evidenceFlags?.portfolioPinned ? (
                                  <Chip bg="#f5f3ff" bd="#ddd6fe" fg="#6d28d9">
                                    Portfolio
                                  </Chip>
                                ) : null}
                                {evidenceFlags?.conferencePinned ? (
                                  <Chip bg="#ecfeff" bd="#a5f3fc" fg="#0c4a6e">
                                    Conference
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
                                {item.text}
                              </div>

                              {item.kind === "Evidence" ? (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      patchCuration(item.sourceId, {
                                        reportRole:
                                          evidenceFlags?.reportRole === "core"
                                            ? undefined
                                            : "core",
                                      })
                                    }
                                    style={SS.miniButton}
                                  >
                                    {evidenceFlags?.reportRole === "core"
                                      ? "Remove core"
                                      : "Mark core"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleCurationFlag(item.sourceId, "portfolioPinned")
                                    }
                                    style={SS.miniButton}
                                  >
                                    {evidenceFlags?.portfolioPinned
                                      ? "Unpin portfolio"
                                      : "Pin portfolio"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleCurationFlag(item.sourceId, "conferencePinned")
                                    }
                                    style={SS.miniButton}
                                  >
                                    {evidenceFlags?.conferencePinned
                                      ? "Unpin conference"
                                      : "Pin conference"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleCurationFlag(item.sourceId, "exemplar")
                                    }
                                    style={SS.miniButton}
                                  >
                                    {evidenceFlags?.exemplar
                                      ? "Clear exemplar"
                                      : "Mark exemplar"}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>

          {/* RIGHT */}
          <div style={{ display: "grid", gap: 18 }}>
            <SectionCard
              title="Event significance guide"
              help="A quick legend for how the timeline is weighting different events."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {(
                  [
                    "Strong evidence",
                    "Usable evidence",
                    "Thin evidence",
                    "Weak evidence",
                    "Critical support",
                    "Support update",
                  ] as TimelineItem["significance"][]
                ).map((key) => {
                  const t = significanceTone(key);
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                        border: "1px solid #e5e7eb",
                        borderRadius: 12,
                        padding: 10,
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: t.dot,
                            display: "inline-block",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {key}
                        </span>
                      </div>
                      <Chip bg={t.bg} bd={t.bd} fg={t.fg}>
                        weighted
                      </Chip>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Timeline curation summary"
              help="The current bridge from timeline events into reporting, portfolio, and conference workflows."
            >
              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat
                  label="Core report items"
                  value={String(
                    Object.values(curation).filter((x) => x.reportRole === "core").length
                  )}
                />
                <MiniStat
                  label="Portfolio pins"
                  value={String(
                    Object.values(curation).filter((x) => x.portfolioPinned).length
                  )}
                />
                <MiniStat
                  label="Conference pins"
                  value={String(
                    Object.values(curation).filter((x) => x.conferencePinned).length
                  )}
                />
                <MiniStat
                  label="Exemplar items"
                  value={String(Object.values(curation).filter((x) => x.exemplar).length)}
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Workflow bridges"
              help="Use the timeline as a feeder surface into the wider student system."
            >
              <div style={{ display: "grid", gap: 10 }}>
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
                  Open report builder
                </button>

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

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/admin/students/${studentId}${
                        returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
                      }`
                    )
                  }
                  style={SS.secondaryButton}
                >
                  Return to profile
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
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "center",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 12,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "#475569",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          lineHeight: 1.1,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const SS: Record<string, React.CSSProperties> = {
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