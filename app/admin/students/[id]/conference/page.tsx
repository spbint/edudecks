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
  student_id?: string | null;
  class_id?: string | null;
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

type CurationFlags = {
  portfolio?: boolean;
  conference?: boolean;
  report?: boolean;
  exemplar?: boolean;
  weak?: boolean;
};

type CurationMap = Record<string, CurationFlags>;

type EvidenceQuality = {
  row: EvidenceEntryRow;
  score: number;
  label: "Flagship" | "Strong" | "Usable" | "Thin" | "Rewrite";
};

type ConferenceReadiness = {
  score: number;
  label: "Ready" | "Needs prep" | "Fragile";
};

type ConferenceSection = "brief" | "anchors" | "support" | "summary";

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */

const CURATION_KEY_PREFIX = "edudecks_student_profile_curation_v1:";

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 180) {
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
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
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

function hasMedia(row: EvidenceEntryRow) {
  const attachments =
    Array.isArray(row.attachment_urls) ? row.attachment_urls.length : safe(row.attachment_urls) ? 1 : 0;

  return Boolean(
    attachments ||
      safe(row.image_url) ||
      safe(row.photo_url) ||
      safe(row.file_url)
  );
}

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();
  if (x.includes("math")) return "Maths";
  if (x.includes("liter") || x.includes("reading") || x.includes("writing") || x.includes("english")) {
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
    safe(iv.review_date) ||
    safe(iv.next_review_on) ||
    safe(iv.due_on) ||
    safe(iv.updated_at) ||
    safe(iv.created_at) ||
    ""
  );
}

function isOpenIntervention(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  return !["closed", "done", "resolved", "archived", "completed", "cancelled"].includes(s);
}

function scoreEvidence(row: EvidenceEntryRow, flags?: CurationFlags): EvidenceQuality {
  let score = 0;

  if (safe(row.title)) score += 12;
  if (safe(row.summary)) score += 28;
  else if (safe(row.body)) score += 18;
  else if (safe(row.note)) score += 14;

  const d = daysSince(row.occurred_on || row.created_at) ?? 999;
  if (d <= 14) score += 20;
  else if (d <= 30) score += 12;

  if (safe(row.learning_area)) score += 12;
  if (safe(row.evidence_type)) score += 8;
  if (hasMedia(row)) score += 10;

  const textLen = Math.max(
    safe(row.summary).length,
    safe(row.body).length,
    safe(row.note).length
  );
  if (textLen >= 120) score += 12;
  else if (textLen >= 50) score += 8;

  if (flags?.conference) score += 10;
  if (flags?.report) score += 8;
  if (flags?.exemplar) score += 6;
  if (flags?.weak) score -= 18;

  score = Math.max(0, Math.min(100, score));

  let label: EvidenceQuality["label"] = "Usable";
  if (score >= 84) label = "Flagship";
  else if (score >= 68) label = "Strong";
  else if (score >= 50) label = "Usable";
  else if (score >= 35) label = "Thin";
  else label = "Rewrite";

  return { row, score, label };
}

function qualityTone(label: EvidenceQuality["label"]) {
  if (label === "Rewrite") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  if (label === "Thin") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  if (label === "Usable") return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
  if (label === "Strong") return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  return { bg: "#fffaf0", bd: "#fde68a", fg: "#92400e" };
}

function supportBand(row: InterventionRow) {
  const open = isOpenIntervention(row.status);
  const ds = daysSince(reviewDate(row));
  const overdue = open && ds != null && ds > 0;

  if (!open) return { label: "Closed", bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
  if (overdue) return { label: "Needs review", bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  return { label: "Active", bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
}

function printNow() {
  window.print();
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
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${bd}`,
        color: fg,
        fontSize: 12,
        fontWeight: 800,
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

function ScoreTile({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "primary" | "good" | "watch" | "danger";
}) {
  const palette =
    tone === "danger"
      ? { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" }
      : tone === "watch"
      ? { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" }
      : tone === "good"
      ? { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" }
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

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */

export default function StudentConferencePage() {
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

  const [sectionFocus, setSectionFocus] = useState<ConferenceSection>("brief");
  const [notes, setNotes] = useState("");

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
          "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted",
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
          "id,student_id,class_id,title,description,status,priority,tier,start_date,due_on,review_date,review_due_on,review_due_date,next_review_on,note,notes,created_at,updated_at",
          "id,student_id,class_id,title,status,priority,tier,created_at,updated_at",
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

  useEffect(() => {
    if (!studentId || typeof window === "undefined") return;
    const saved = safeJsonParse<CurationMap>(
      localStorage.getItem(curationStorageKey(studentId)),
      {}
    );
    setCuration(saved);
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

  const scoredEvidence = useMemo(() => {
    return evidence
      .map((row) => scoreEvidence(row, curation[row.id]))
      .sort((a, b) => b.score - a.score);
  }, [evidence, curation]);

  const conferenceAnchors = useMemo(() => {
    const explicitlyPinned = scoredEvidence.filter((x) => curation[x.row.id]?.conference);
    if (explicitlyPinned.length > 0) return explicitlyPinned.slice(0, 5);
    return scoredEvidence.filter((x) => x.score >= 68).slice(0, 5);
  }, [scoredEvidence, curation]);

  const openInterventions = useMemo(() => {
    return interventions.filter((x) => isOpenIntervention(x.status));
  }, [interventions]);

  const overdueInterventions = useMemo(() => {
    return openInterventions.filter((x) => {
      const ds = daysSince(reviewDate(x));
      return ds != null && ds > 0;
    });
  }, [openInterventions]);

  const breadthAreas = useMemo(() => {
    return Array.from(
      new Set(
        evidence
          .map((x) => guessArea(x.learning_area))
          .filter(Boolean)
      )
    );
  }, [evidence]);

  const strengthsToShare = useMemo(() => {
    const areas = breadthAreas.slice(0, 3);
    const statements: string[] = [];

    if (areas.length) {
      statements.push(`${displayName} has visible evidence across ${areas.join(", ")}.`);
    }

    if (conferenceAnchors.length >= 2) {
      statements.push("There are enough strong evidence anchors to support a calm, specific conference conversation.");
    }

    if ((overview?.evidence_count_30d ?? 0) >= 2) {
      statements.push("Recent evidence suggests there is current learning visibility rather than only historical records.");
    }

    if (!statements.length) {
      statements.push("There is some useful evidence to discuss, though stronger anchors would improve confidence.");
    }

    return statements;
  }, [breadthAreas, conferenceAnchors.length, displayName, overview?.evidence_count_30d]);

  const concernToDiscuss = useMemo(() => {
    if (overdueInterventions.length > 0) {
      return "Support review timing has slipped, so follow-up planning should be part of the conversation.";
    }

    const weakCount = scoredEvidence.filter((x) => x.label === "Rewrite" || x.label === "Thin").length;
    if (weakCount >= 2) {
      return "Some evidence items are still too thin to carry the full learner story confidently.";
    }

    if (breadthAreas.length < 3) {
      return "The current evidence base may not yet show enough breadth across learning areas.";
    }

    return "The conversation can stay focused on consolidating current strengths and identifying the most helpful next evidence to capture.";
  }, [overdueInterventions.length, scoredEvidence, breadthAreas.length]);

  const nextStep = useMemo(() => {
    if (overdueInterventions.length > 0) {
      return "Agree a follow-up review point for support and confirm what evidence would show progress clearly.";
    }

    if (conferenceAnchors.length < 2) {
      return "Capture one or two stronger representative evidence items before the next reporting checkpoint.";
    }

    return "Use the current evidence anchors to agree on one clear next learning focus and one practical home/school action.";
  }, [overdueInterventions.length, conferenceAnchors.length]);

  const readiness = useMemo<ConferenceReadiness>(() => {
    let score = 0;
    score += Math.min(40, conferenceAnchors.length * 12);
    score += Math.min(25, breadthAreas.length * 6);
    score += Math.min(20, Number(overview?.evidence_count_30d ?? 0) * 5);
    score += overdueInterventions.length > 0 ? 0 : 15;

    score = Math.max(0, Math.min(100, score));

    if (score >= 75) return { score, label: "Ready" };
    if (score >= 50) return { score, label: "Needs prep" };
    return { score, label: "Fragile" };
  }, [conferenceAnchors.length, breadthAreas.length, overview?.evidence_count_30d, overdueInterventions.length]);

  const summaryParagraph = useMemo(() => {
    return [
      `${displayName} has ${conferenceAnchors.length} evidence anchor${conferenceAnchors.length === 1 ? "" : "s"} available for this conversation.`,
      strengthsToShare[0] || "",
      concernToDiscuss,
      nextStep,
    ]
      .filter(Boolean)
      .join(" ");
  }, [conferenceAnchors.length, concernToDiscuss, displayName, nextStep, strengthsToShare]);

  const sectionPreview = useMemo(() => {
    if (sectionFocus === "brief") {
      return `${strengthsToShare.join(" ")} ${concernToDiscuss} ${nextStep}`;
    }
    if (sectionFocus === "anchors") {
      if (!conferenceAnchors.length) return "No strong conference anchors are currently available.";
      return conferenceAnchors
        .map((x) => {
          const e = x.row;
          return `${safe(e.title || e.learning_area || "Evidence")}: ${
            clip(e.summary, 120) || clip(e.body, 120) || clip(e.note, 120) || "Recorded evidence."
          }`;
        })
        .join("\n\n");
    }
    if (sectionFocus === "support") {
      if (!openInterventions.length) return "There are no active support items to review in this conference view.";
      return openInterventions
        .slice(0, 3)
        .map((x) => {
          return `${safe(x.title || "Support plan")} — ${safe(x.status || "Active")} — Review ${shortDate(
            reviewDate(x)
          )}`;
        })
        .join("\n");
    }

    return summaryParagraph;
  }, [sectionFocus, strengthsToShare, concernToDiscuss, nextStep, conferenceAnchors, openInterventions, summaryParagraph]);

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
          maxWidth: 1460,
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
            Refreshing conference page…
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

        {/* Sticky shell */}
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
              style={SS.secondaryButton}
              onClick={() => router.push(backHref)}
              type="button"
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
            <button style={SS.primaryButton} type="button" onClick={printNow}>
              Print conference brief
            </button>
            <button
              style={SS.secondaryButton}
              type="button"
              onClick={() => router.push(`/admin/students/${studentId}/reports`)}
            >
              Open reports
            </button>
          </div>
        </section>

        {/* Hero */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.95fr)",
            gap: 18,
            background:
              "linear-gradient(135deg, rgba(79,124,240,0.08) 0%, rgba(16,185,129,0.08) 100%)",
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
              Student conference command surface
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
              {displayName} — Conference
            </h1>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#475569",
                maxWidth: 820,
              }}
            >
              This page brings together evidence anchors, support context, and talking points so teachers
              can walk into a family meeting with a calm, structured learner story.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip bg={attention.bg} bd={attention.bd} fg={attention.fg}>
                {attention.label}
              </Chip>
              <Chip
                bg={
                  readiness.label === "Ready"
                    ? "#ecfdf5"
                    : readiness.label === "Needs prep"
                    ? "#fff7ed"
                    : "#fff1f2"
                }
                bd={
                  readiness.label === "Ready"
                    ? "#a7f3d0"
                    : readiness.label === "Needs prep"
                    ? "#fed7aa"
                    : "#fecdd3"
                }
                fg={
                  readiness.label === "Ready"
                    ? "#166534"
                    : readiness.label === "Needs prep"
                    ? "#9a3412"
                    : "#be123c"
                }
              >
                Conference readiness: {readiness.score}% • {readiness.label}
              </Chip>
              <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                Anchors: {conferenceAnchors.length}
              </Chip>
              {(student?.is_ilp || overview?.is_ilp) ? (
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
              Meeting read
            </div>

            <div
              style={{
                fontSize: 18,
                lineHeight: 1.25,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {safe(overview?.next_action) || "Use strong evidence anchors and agree one next step"}
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#475569",
              }}
            >
              {summaryParagraph}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <SummaryRow label="Evidence anchors" value={String(conferenceAnchors.length)} />
              <SummaryRow label="Open supports" value={String(openInterventions.length)} />
              <SummaryRow label="Overdue reviews" value={String(overdueInterventions.length)} />
              <SummaryRow label="Breadth areas" value={String(breadthAreas.length)} />
            </div>
          </div>
        </section>

        {/* Score row */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <ScoreTile
            label="Anchors"
            value={String(conferenceAnchors.length)}
            helper="Strong evidence pieces ready to support the conversation."
            tone={conferenceAnchors.length >= 3 ? "good" : conferenceAnchors.length >= 1 ? "watch" : "danger"}
          />
          <ScoreTile
            label="Open supports"
            value={String(openInterventions.length)}
            helper="Active support items that may need to be discussed."
            tone={openInterventions.length === 0 ? "good" : "watch"}
          />
          <ScoreTile
            label="Overdue reviews"
            value={String(overdueInterventions.length)}
            helper="Support plans whose review timing has slipped."
            tone={overdueInterventions.length === 0 ? "good" : "danger"}
          />
          <ScoreTile
            label="Breadth"
            value={String(breadthAreas.length)}
            helper="Learning-area spread visible in the current conference evidence."
            tone={breadthAreas.length >= 3 ? "good" : "watch"}
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* LEFT */}
          <div style={{ display: "grid", gap: 16 }}>
            <SectionCard
              title="Conference controls"
              help="Use this to switch the current conversation focus."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Section preview">
                  <select
                    style={SS.select}
                    value={sectionFocus}
                    onChange={(e) => setSectionFocus(e.target.value as ConferenceSection)}
                  >
                    <option value="brief">Conference brief</option>
                    <option value="anchors">Evidence anchors</option>
                    <option value="support">Support context</option>
                    <option value="summary">Full summary</option>
                  </select>
                </Field>

                <Field label="Meeting notes">
                  <textarea
                    style={SS.textareaSmall}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Capture agreed actions, family questions, or follow-up points..."
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              title="Strengths to share"
              help="Useful opening points for a calm, specific conference conversation."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {strengthsToShare.map((item, idx) => (
                  <div key={idx} style={SS.softNote}>
                    {item}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Concern to discuss"
              help="A single main concern keeps the meeting focused and helpful."
            >
              <div style={SS.softNote}>{concernToDiscuss}</div>
            </SectionCard>

            <SectionCard
              title="Agreed next step"
              help="Aim to leave the meeting with one clear, practical next move."
            >
              <div style={SS.softNote}>{nextStep}</div>
            </SectionCard>
          </div>

          {/* RIGHT */}
          <div style={{ display: "grid", gap: 16 }}>
            <SectionCard
              title="Section preview"
              help="A focused preview of the current conference section."
            >
              <div style={SS.reportBox}>{sectionPreview}</div>
            </SectionCard>

            <SectionCard
              title="Evidence anchors"
              help="These are the strongest pieces to refer to during the conversation."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {conferenceAnchors.length === 0 ? (
                  <div style={SS.softEmpty}>
                    There are no strong conference anchors yet. Pin better evidence from the profile, timeline, or portfolio pages.
                  </div>
                ) : (
                  conferenceAnchors.map((item) => {
                    const tone = qualityTone(item.label);
                    const e = item.row;

                    return (
                      <div
                        key={e.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          background: "#ffffff",
                          padding: 12,
                          display: "grid",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          >
                            {safe(e.title) || safe(e.learning_area) || "Evidence anchor"}
                          </div>
                          <Chip bg={tone.bg} bd={tone.bd} fg={tone.fg}>
                            {item.label} • {item.score}
                          </Chip>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                            {guessArea(e.learning_area)}
                          </Chip>
                          <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                            {fullDate(e.occurred_on || e.created_at)}
                          </Chip>
                          {safe(e.evidence_type) ? (
                            <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                              {safe(e.evidence_type)}
                            </Chip>
                          ) : null}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.55,
                            color: "#475569",
                          }}
                        >
                          {clip(e.summary, 140) ||
                            clip(e.body, 140) ||
                            clip(e.note, 140) ||
                            "Recorded evidence item."}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Support context"
              help="Bring support information into the conference only when it sharpens the learner story."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {openInterventions.length === 0 ? (
                  <div style={SS.softEmpty}>
                    There are no active support items to discuss in this conference view.
                  </div>
                ) : (
                  openInterventions.slice(0, 4).map((row) => {
                    const band = supportBand(row);

                    return (
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
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          >
                            {safe(row.title) || "Support plan"}
                          </div>
                          <Chip bg={band.bg} bd={band.bd} fg={band.fg}>
                            {band.label}
                          </Chip>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {safe(row.status) ? (
                            <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                              {safe(row.status)}
                            </Chip>
                          ) : null}
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
                          <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                            Review: {shortDate(reviewDate(row))}
                          </Chip>
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.55,
                            color: "#475569",
                          }}
                        >
                          {clip(row.description, 140) ||
                            clip(row.note, 140) ||
                            clip(row.notes, 140) ||
                            "Support context available."}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Conference notes"
              help="Use this area during or after the meeting, then copy or print the page."
            >
              <textarea
                style={SS.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Capture agreed actions, family questions, follow-up dates, or next support decisions..."
              />
            </SectionCard>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SUBCOMPONENTS
   ────────────────────────────────────────────────────────────── */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "#64748b",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

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

const SS: Record<string, React.CSSProperties> = {
  primaryButton: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "#2563eb",
    border: "1px solid #2563eb",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },

  secondaryButton: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#1f2937",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#1f2937",
    fontWeight: 700,
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: 180,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#1f2937",
    resize: "vertical",
    lineHeight: 1.55,
    fontSize: 14,
    outline: "none",
  },

  textareaSmall: {
    width: "100%",
    minHeight: 96,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#1f2937",
    resize: "vertical",
    lineHeight: 1.55,
    fontSize: 14,
    outline: "none",
  },

  reportBox: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.7,
    fontSize: 15,
    color: "#1f2937",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    minHeight: 160,
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
};