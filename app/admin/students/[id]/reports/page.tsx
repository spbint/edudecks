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

type Evidence = {
  id: string;
  student_id?: string | null;
  class_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  note?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
  attachment_urls?: string[] | string | null;
  image_url?: string | null;
  photo_url?: string | null;
  file_url?: string | null;
  [k: string]: any;
};

type AttributeLink = {
  evidence_id: string;
  attribute_id: string;
  attributes?:
    | { name?: string | null; domain?: string | null }
    | { name?: string | null; domain?: string | null }[]
    | null;
};

type Intervention = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  start_date?: string | null;
  review_date?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  next_review_on?: string | null;
  due_on?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  note?: string | null;
  notes?: string | null;
  priority?: string | null;
  tier?: string | number | null;
};

type ReportMode = "family-summary" | "progress-review" | "authority-ready";
type ReportTone = "Balanced" | "Warm" | "Direct";
type ReportSectionKey =
  | "overview"
  | "strengths"
  | "evidence"
  | "support"
  | "nextSteps";

type CurationFlags = {
  portfolio?: boolean;
  conference?: boolean;
  report?: boolean;
  exemplar?: boolean;
  weak?: boolean;
};

type CurationMap = Record<string, CurationFlags>;

type ReportEvidenceRow = {
  row: Evidence;
  score: number;
  quality: "Flagship" | "Strong" | "Usable" | "Thin" | "Rewrite";
  reasons: string[];
};

type ReportSummary = {
  totalEvidence: number;
  lastEvidence: string | null;
  openInterventions: Intervention[];
  attributeNames: string[];
  domains: string[];
  breadthCount: number;
  strongEvidenceCount: number;
  reportReadyCount: number;
  weakCount: number;
};

type DeterministicReport = {
  overview: string;
  strengths: string;
  evidence: string;
  support: string;
  nextSteps: string;
  full: string;
};

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */

const CURATION_KEY_PREFIX = "edudecks_student_profile_curation_v1:";

function safe(v: any) {
  return String(v ?? "").trim();
}

function clip(v: string | null | undefined, max = 220) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function shortDate(v: string | null | undefined) {
  return safe(v).slice(0, 10) || "—";
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
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
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

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("does not exist") &&
    (msg.includes("relation") || msg.includes("column"))
  );
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

function dedupe(strings: string[]) {
  return Array.from(new Set(strings.filter(Boolean)));
}

function sentenceCase(s: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function joinNatural(items: string[]) {
  const arr = items.filter(Boolean);
  if (arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

function attrNameFromLink(link: AttributeLink) {
  if (Array.isArray(link.attributes)) {
    return safe(link.attributes[0]?.name) || "Attribute";
  }
  return safe(link.attributes?.name) || "Attribute";
}

function attrDomainFromLink(link: AttributeLink) {
  if (Array.isArray(link.attributes)) {
    return safe(link.attributes[0]?.domain) || "General";
  }
  return safe(link.attributes?.domain) || "General";
}

function reviewDate(iv: Intervention) {
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
  return !["completed", "cancelled", "closed", "done", "resolved", "archived"].includes(s);
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

function hasMedia(row: Evidence) {
  const attachments =
    Array.isArray(row.attachment_urls) ? row.attachment_urls.length : safe(row.attachment_urls) ? 1 : 0;

  return Boolean(
    attachments ||
      safe(row.image_url) ||
      safe(row.photo_url) ||
      safe(row.file_url)
  );
}

function qualityTone(label: ReportEvidenceRow["quality"]) {
  if (label === "Rewrite") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  if (label === "Thin") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  if (label === "Usable") return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
  if (label === "Strong") return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  return { bg: "#fffaf0", bd: "#fde68a", fg: "#92400e" };
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

function scoreEvidence(row: Evidence, flags?: CurationFlags): ReportEvidenceRow {
  let score = 0;
  const reasons: string[] = [];

  if (safe(row.title)) {
    score += 12;
    reasons.push("clear title");
  } else {
    reasons.push("missing title");
  }

  if (safe(row.summary)) {
    score += 28;
    reasons.push("summary present");
  } else if (safe(row.body)) {
    score += 18;
    reasons.push("body present");
  } else if (safe(row.note)) {
    score += 14;
    reasons.push("note present");
  } else {
    reasons.push("weak narrative");
  }

  const d = daysSince(row.occurred_on || row.created_at) ?? 999;
  if (d <= 14) {
    score += 20;
    reasons.push("recent");
  } else if (d <= 30) {
    score += 12;
    reasons.push("reasonably recent");
  } else if (d > 60) {
    reasons.push("stale");
  }

  if (safe(row.learning_area)) {
    score += 12;
    reasons.push("tagged area");
  } else {
    reasons.push("missing area tag");
  }

  if (safe(row.evidence_type)) {
    score += 8;
    reasons.push("typed evidence");
  }

  if (hasMedia(row)) {
    score += 10;
    reasons.push("media/supporting file");
  }

  const textLen = Math.max(
    safe(row.summary).length,
    safe(row.body).length,
    safe(row.note).length
  );
  if (textLen >= 120) {
    score += 12;
    reasons.push("strong descriptive depth");
  } else if (textLen >= 50) {
    score += 8;
    reasons.push("usable descriptive depth");
  } else {
    reasons.push("thin description");
  }

  if (flags?.report) {
    score += 8;
    reasons.push("report-selected");
  }
  if (flags?.exemplar) {
    score += 6;
    reasons.push("teacher-promoted exemplar");
  }
  if (flags?.weak) {
    score -= 18;
    reasons.push("flagged weak");
  }

  score = Math.max(0, Math.min(100, score));

  let quality: ReportEvidenceRow["quality"] = "Usable";
  if (score >= 84) quality = "Flagship";
  else if (score >= 68) quality = "Strong";
  else if (score >= 50) quality = "Usable";
  else if (score >= 35) quality = "Thin";
  else quality = "Rewrite";

  return {
    row,
    score,
    quality,
    reasons,
  };
}

function buildDeterministicReport(args: {
  student: Student | null;
  filteredEvidence: Evidence[];
  strongestEvidence: ReportEvidenceRow[];
  summary: ReportSummary;
  tone: ReportTone;
  mode: ReportMode;
  focusArea: string;
}): DeterministicReport {
  const { student, filteredEvidence, strongestEvidence, summary, tone, mode, focusArea } = args;

  const name = nameOf(student);
  const first = safe(student?.preferred_name || student?.first_name) || "The student";

  const areaPhrase =
    focusArea === "All areas"
      ? "across the curriculum"
      : `in ${focusArea}`;

  const topStrengths = summary.attributeNames.slice(0, 5);
  const topDomains = summary.domains.slice(0, 4);

  const evidenceObservations = strongestEvidence.slice(0, 3).map((item) => {
    const e = item.row;
    const title = safe(e.title);
    const summaryText = safe(e.summary || e.body || e.note);
    const area = safe(e.learning_area);
    if (title && summaryText) {
      return `${title} (${area || "General"}): ${clip(summaryText, 130)}`;
    }
    if (title) return `${title} (${area || "General"})`;
    if (summaryText) return `${area || "General"}: ${clip(summaryText, 130)}`;
    return "";
  }).filter(Boolean);

  let overview = `${name} has demonstrated learning growth ${areaPhrase}.`;
  if (tone === "Warm") overview = `${name} has shown encouraging learning growth ${areaPhrase}.`;
  if (tone === "Direct") overview = `${name}'s current evidence ${areaPhrase} shows the following reporting profile.`;

  if (mode === "authority-ready") {
    overview += ` This draft is shaped toward a more formal evidence-based reporting posture.`;
  }
  if (mode === "progress-review") {
    overview += ` This draft focuses on current momentum, progress visibility, and next steps.`;
  }

  let strengths = "";
  if (topStrengths.length) {
    strengths =
      tone === "Direct"
        ? `${first} is showing evidence in ${joinNatural(topStrengths)}.`
        : `${first} is showing developing strengths in ${joinNatural(topStrengths)}.`;
  } else if (topDomains.length) {
    strengths = `${first} has evidence recorded across ${joinNatural(topDomains)}.`;
  } else {
    strengths = `${first} has a growing body of evidence available for review.`;
  }

  let evidence = "";
  if (evidenceObservations.length) {
    evidence =
      `Recent evidence highlights include ${evidenceObservations.join("; ")}.`;
  } else {
    evidence =
      `${first} currently has ${summary.totalEvidence} recorded evidence item${
        summary.totalEvidence === 1 ? "" : "s"
      } available for this view.`;
  }

  let support = "";
  if (summary.openInterventions.length) {
    const titles = summary.openInterventions
      .slice(0, 3)
      .map((i) => safe(i.title || "Intervention"))
      .filter(Boolean);

    support =
      `${first} also has ${summary.openInterventions.length} active support intervention${
        summary.openInterventions.length === 1 ? "" : "s"
      } currently in place` +
      (titles.length ? `, including ${joinNatural(titles)}` : "") +
      ".";
  } else {
    support =
      `${first} does not currently have any open interventions recorded in this view.`;
  }

  const nextSteps =
    mode === "authority-ready"
      ? `A sensible next step is to continue gathering precise evidence that clarifies consistency, independence, and application over time, especially where breadth or recency could be strengthened.`
      : mode === "progress-review"
      ? `A helpful next step will be to continue gathering specific evidence that shows recent progress, sustained participation, and application over time.`
      : tone === "Direct"
      ? `A sensible next step is to continue gathering specific evidence that clarifies consistency, independence, and application over time.`
      : `A helpful next step will be to continue gathering specific evidence that shows consistency, independence, and application over time.`;

  const full = [overview, strengths, evidence, support, nextSteps]
    .filter(Boolean)
    .join("\n\n");

  return {
    overview,
    strengths,
    evidence,
    support,
    nextSteps,
    full,
  };
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

export default function StudentReportsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const studentId = String(params?.id ?? "");
  const returnTo = searchParams?.get("returnTo") || "";
  const backHref = buildStudentProfilePath(studentId, returnTo || buildStudentListPath());

  const [student, setStudent] = useState<Student | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [overview, setOverview] = useState<StudentProfileOverviewRow | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [links, setLinks] = useState<AttributeLink[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [focusArea, setFocusArea] = useState("All areas");
  const [tone, setTone] = useState<ReportTone>("Balanced");
  const [mode, setMode] = useState<ReportMode>("family-summary");
  const [sectionFocus, setSectionFocus] = useState<ReportSectionKey>("overview");
  const [editableDraft, setEditableDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [curation, setCuration] = useState<CurationMap>({});

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
          supabase
            .from("students")
            .select("id,preferred_name,first_name,surname,family_name,last_name,year_level,is_ilp,class_id,created_at")
            .eq("id", studentId)
            .maybeSingle(),
          supabase
            .from("students")
            .select("id,preferred_name,first_name,surname,family_name,year_level,is_ilp,class_id,created_at")
            .eq("id", studentId)
            .maybeSingle(),
          supabase
            .from("students")
            .select("id,preferred_name,first_name,surname,year_level,is_ilp,class_id,created_at")
            .eq("id", studentId)
            .maybeSingle(),
          supabase
            .from("students")
            .select("id,preferred_name,first_name,year_level,is_ilp,class_id,created_at")
            .eq("id", studentId)
            .maybeSingle(),
        ];

        let loadedStudent: Student | null = null;
        for (const q of studentQueries) {
          const r = await q;
          if (!r.error) {
            loadedStudent = (r.data as Student | null) ?? null;
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        const { data: ov, error: ovError } = await supabase
          .from("v_student_profile_overview_v1")
          .select("*")
          .eq("student_id", studentId)
          .maybeSingle();

        if (ovError && !isMissingRelationOrColumn(ovError)) throw ovError;

        const evidenceQueries = [
          supabase
            .from("evidence_entries")
            .select("id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,is_deleted,attachment_urls,image_url,photo_url,file_url")
            .eq("student_id", studentId)
            .eq("is_deleted", false)
            .order("occurred_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("evidence_entries")
            .select("id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,is_deleted")
            .eq("student_id", studentId)
            .eq("is_deleted", false)
            .order("occurred_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false }),
        ];

        let loadedEvidence: Evidence[] = [];
        for (const q of evidenceQueries) {
          const r = await q;
          if (!r.error) {
            loadedEvidence = ((r.data as Evidence[]) ?? []).filter((x) => x.is_deleted !== true);
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        const linkQueries = [
          supabase
            .from("evidence_attribute_links")
            .select("evidence_id,attribute_id,attributes(name,domain)"),
          supabase
            .from("evidence_attribute_links")
            .select("evidence_id,attribute_id"),
        ];

        let loadedLinks: AttributeLink[] = [];
        for (const q of linkQueries) {
          const r = await q;
          if (!r.error) {
            loadedLinks = (r.data as AttributeLink[]) ?? [];
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        const interventionQueries = [
          supabase
            .from("interventions")
            .select("id,title,description,status,start_date,review_date,review_due_on,review_due_date,next_review_on,due_on,created_at,updated_at,note,notes,priority,tier")
            .eq("student_id", studentId)
            .order("created_at", { ascending: false }),
          supabase
            .from("interventions")
            .select("id,title,status,created_at")
            .eq("student_id", studentId)
            .order("created_at", { ascending: false }),
        ];

        let loadedInterventions: Intervention[] = [];
        for (const q of interventionQueries) {
          const r = await q;
          if (!r.error) {
            loadedInterventions = (r.data as Intervention[]) ?? [];
            break;
          }
          if (!isMissingRelationOrColumn(r.error)) throw r.error;
        }

        let classData: ClassRow | null = null;
        const classId = safe((ov as any)?.class_id) || safe(loadedStudent?.class_id);

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

        setStudent(loadedStudent);
        setOverview((ov as StudentProfileOverviewRow | null) ?? null);
        setEvidence(loadedEvidence);
        setLinks(loadedLinks);
        setInterventions(loadedInterventions);
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

  const linksByEvidence = useMemo(() => {
    const m: Record<string, AttributeLink[]> = {};
    links.forEach((l) => {
      if (!m[l.evidence_id]) m[l.evidence_id] = [];
      m[l.evidence_id].push(l);
    });
    return m;
  }, [links]);

  const learningAreas = useMemo(() => {
    return ["All areas", ...dedupe(evidence.map((e) => safe(e.learning_area)).filter(Boolean))];
  }, [evidence]);

  const filteredEvidence = useMemo(() => {
    if (focusArea === "All areas") return evidence;
    return evidence.filter((e) => safe(e.learning_area) === focusArea);
  }, [evidence, focusArea]);

  const scoredEvidence = useMemo<ReportEvidenceRow[]>(() => {
    return filteredEvidence
      .map((row) => scoreEvidence(row, curation[row.id]))
      .sort((a, b) => b.score - a.score);
  }, [filteredEvidence, curation]);

  const strongestEvidence = useMemo(() => scoredEvidence.slice(0, 6), [scoredEvidence]);

  const summaryStats = useMemo<ReportSummary>(() => {
    const attributeNames = dedupe(
      filteredEvidence.flatMap((e) => (linksByEvidence[e.id] || []).map(attrNameFromLink))
    );

    const domains = dedupe(
      filteredEvidence.flatMap((e) => (linksByEvidence[e.id] || []).map(attrDomainFromLink))
    );

    const openInterventions = interventions.filter((i) => isOpenIntervention(i.status));
    const breadthCount = dedupe(filteredEvidence.map((e) => guessArea(e.learning_area))).length;
    const strongEvidenceCount = scoredEvidence.filter((x) => x.score >= 68).length;
    const reportReadyCount = scoredEvidence.filter((x) => (curation[x.row.id]?.report || x.score >= 68)).length;
    const weakCount = scoredEvidence.filter((x) => x.quality === "Rewrite" || curation[x.row.id]?.weak).length;

    return {
      totalEvidence: filteredEvidence.length,
      lastEvidence: filteredEvidence[0]?.occurred_on || filteredEvidence[0]?.created_at || null,
      attributeNames,
      domains,
      openInterventions,
      breadthCount,
      strongEvidenceCount,
      reportReadyCount,
      weakCount,
    };
  }, [filteredEvidence, interventions, linksByEvidence, scoredEvidence, curation]);

  const reportReadiness = useMemo(() => {
    const freshCount = filteredEvidence.filter((e) => {
      const d = daysSince(e.occurred_on || e.created_at);
      return d != null && d <= 30;
    }).length;

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Math.min(28, freshCount * 5) +
            Math.min(24, summaryStats.breadthCount * 5) +
            Math.min(24, summaryStats.strongEvidenceCount * 5) +
            Math.min(24, summaryStats.reportReadyCount * 6)
        )
      )
    );
  }, [filteredEvidence, summaryStats]);

  const reportBuild = useMemo(
    () =>
      buildDeterministicReport({
        student,
        filteredEvidence,
        strongestEvidence,
        summary: summaryStats,
        tone,
        mode,
        focusArea,
      }),
    [student, filteredEvidence, strongestEvidence, summaryStats, tone, mode, focusArea]
  );

  useEffect(() => {
    setEditableDraft(reportBuild.full);
  }, [reportBuild.full]);

  const sectionDraft = useMemo(() => {
    if (sectionFocus === "overview") return reportBuild.overview;
    if (sectionFocus === "strengths") return reportBuild.strengths;
    if (sectionFocus === "evidence") return reportBuild.evidence;
    if (sectionFocus === "support") return reportBuild.support;
    return reportBuild.nextSteps;
  }, [reportBuild, sectionFocus]);

  const conferenceReportBridge = useMemo(() => {
    const topAreas = dedupe(strongestEvidence.map((x) => safe(x.row.learning_area)).filter(Boolean)).slice(0, 3);
    const anchorTitles = strongestEvidence
      .slice(0, 3)
      .map((x) => safe(x.row.title || x.row.learning_area || "Evidence"))
      .filter(Boolean);

    return {
      strengths:
        topAreas.length > 0
          ? `${displayName} has visible strengths in ${joinNatural(topAreas)}.`
          : `${displayName} has a developing set of strengths visible across the current evidence base.`,
      anchors:
        anchorTitles.length > 0
          ? `Useful anchor pieces include ${joinNatural(anchorTitles)}.`
          : `The current evidence set still needs stronger anchor pieces for confident discussion.`,
      next:
        summaryStats.weakCount > 0
          ? "Some evidence entries would benefit from rewriting before formal report use."
          : "The current report picture is stable, but one or two stronger representative additions would improve confidence.",
    };
  }, [displayName, strongestEvidence, summaryStats.weakCount]);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(editableDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

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
            Refreshing report surface…
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
            <button style={SS.primaryButton} type="button" onClick={() => setEditableDraft(reportBuild.full)}>
              Reset draft
            </button>
            <button style={SS.secondaryButton} type="button" onClick={copyDraft}>
              {copied ? "Copied" : "Copy draft"}
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
              Student report intelligence
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
              {displayName} — Reports
            </h1>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#475569",
                maxWidth: 820,
              }}
            >
              This surface turns stored evidence, attributes, and support context into a deterministic,
              editable draft that can be refined for family summaries, progress reviews, or authority-ready reports.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip bg={attention.bg} bd={attention.bd} fg={attention.fg}>
                {attention.label}
              </Chip>
              <Chip
                bg={
                  reportReadiness >= 80 ? "#ecfdf5" : reportReadiness >= 55 ? "#fff7ed" : "#fff1f2"
                }
                bd={
                  reportReadiness >= 80 ? "#a7f3d0" : reportReadiness >= 55 ? "#fed7aa" : "#fecdd3"
                }
                fg={
                  reportReadiness >= 80 ? "#166534" : reportReadiness >= 55 ? "#9a3412" : "#be123c"
                }
              >
                Report readiness: {reportReadiness}%
              </Chip>
              <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                Last evidence: {shortDate(summaryStats.lastEvidence)}
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
              Reporting read
            </div>

            <div
              style={{
                fontSize: 18,
                lineHeight: 1.25,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {safe(overview?.next_action) || "Build from strongest evidence anchors"}
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#475569",
              }}
            >
              {reportReadiness >= 80
                ? "This learner has a relatively strong reporting base, with enough usable evidence to draft confidently."
                : reportReadiness >= 55
                ? "This reporting picture is usable, but it would benefit from a few stronger or fresher anchor pieces."
                : "This report view is still fragile. Stronger evidence selection and broader recent coverage would improve confidence."}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <SummaryRow label="Visible evidence" value={String(summaryStats.totalEvidence)} />
              <SummaryRow label="Strong evidence" value={String(summaryStats.strongEvidenceCount)} />
              <SummaryRow label="Report-ready anchors" value={String(summaryStats.reportReadyCount)} />
              <SummaryRow label="Open supports" value={String(summaryStats.openInterventions.length)} />
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
            label="Visible evidence"
            value={String(summaryStats.totalEvidence)}
            helper="Evidence currently in scope for this report view."
            tone="primary"
          />
          <ScoreTile
            label="Report readiness"
            value={`${reportReadiness}%`}
            helper="Confidence that current evidence can support a credible draft."
            tone={reportReadiness >= 80 ? "good" : reportReadiness >= 55 ? "watch" : "danger"}
          />
          <ScoreTile
            label="Breadth"
            value={String(summaryStats.breadthCount)}
            helper="Learning-area spread represented in this report view."
            tone={summaryStats.breadthCount >= 4 ? "good" : "watch"}
          />
          <ScoreTile
            label="Weak / rewrite"
            value={String(summaryStats.weakCount)}
            helper="Evidence items likely needing strengthening before formal use."
            tone={summaryStats.weakCount === 0 ? "good" : summaryStats.weakCount <= 2 ? "watch" : "danger"}
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
          {/* LEFT CONTROLS */}
          <div style={{ display: "grid", gap: 16 }}>
            <SectionCard
              title="Report controls"
              help="Shape the deterministic draft by mode, tone, focus area, and section emphasis."
            >
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="Report mode">
                  <select
                    style={SS.select}
                    value={mode}
                    onChange={(e) => setMode(e.target.value as ReportMode)}
                  >
                    <option value="family-summary">Family summary</option>
                    <option value="progress-review">Progress review</option>
                    <option value="authority-ready">Authority ready</option>
                  </select>
                </Field>

                <Field label="Focus area">
                  <select
                    style={SS.select}
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                  >
                    {learningAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Tone">
                  <select
                    style={SS.select}
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ReportTone)}
                  >
                    <option value="Balanced">Balanced</option>
                    <option value="Warm">Warm</option>
                    <option value="Direct">Direct</option>
                  </select>
                </Field>

                <Field label="Section focus">
                  <select
                    style={SS.select}
                    value={sectionFocus}
                    onChange={(e) => setSectionFocus(e.target.value as ReportSectionKey)}
                  >
                    <option value="overview">Overview</option>
                    <option value="strengths">Strengths</option>
                    <option value="evidence">Evidence</option>
                    <option value="support">Support</option>
                    <option value="nextSteps">Next steps</option>
                  </select>
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              title="Strongest evidence anchors"
              help="The best evidence currently available to carry the report."
            >
              <div style={{ display: "grid", gap: 10 }}>
                {strongestEvidence.length === 0 ? (
                  <div style={SS.softEmpty}>No evidence is currently available for this report view.</div>
                ) : (
                  strongestEvidence.map((item) => {
                    const tone = qualityTone(item.quality);
                    return (
                      <div
                        key={item.row.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          background: "#f8fafc",
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
                            {safe(item.row.title) || safe(item.row.learning_area) || "Evidence entry"}
                          </div>
                          <Chip bg={tone.bg} bd={tone.bd} fg={tone.fg}>
                            {item.quality} • {item.score}
                          </Chip>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                            {guessArea(item.row.learning_area)}
                          </Chip>
                          <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                            {fullDate(item.row.occurred_on || item.row.created_at)}
                          </Chip>
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: "#475569",
                          }}
                        >
                          {clip(item.row.summary, 120) ||
                            clip(item.row.body, 120) ||
                            clip(item.row.note, 120) ||
                            "No summary available."}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Conference / report bridge"
              help="A compact bridge between student conference preparation and formal reporting."
            >
              <div style={{ display: "grid", gap: 10 }}>
                <div style={SS.softNote}>
                  <strong style={{ color: "#0f172a" }}>Strengths to share:</strong>{" "}
                  {conferenceReportBridge.strengths}
                </div>
                <div style={SS.softNote}>
                  <strong style={{ color: "#0f172a" }}>Anchor pieces:</strong>{" "}
                  {conferenceReportBridge.anchors}
                </div>
                <div style={SS.softNote}>
                  <strong style={{ color: "#0f172a" }}>Next move:</strong>{" "}
                  {conferenceReportBridge.next}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* RIGHT CONTENT */}
          <div style={{ display: "grid", gap: 16 }}>
            <SectionCard
              title="Section preview"
              help="A focused view of the current section logic before you work on the full draft."
            >
              <div style={SS.reportBox}>{sectionDraft}</div>
            </SectionCard>

            <SectionCard
              title="Editable draft"
              help="This draft is deterministic and grounded in the stored evidence only. Edit it freely before copying or moving it elsewhere."
              actions={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={SS.primaryButton} type="button" onClick={() => setEditableDraft(reportBuild.full)}>
                    Reset draft
                  </button>
                  <button style={SS.secondaryButton} type="button" onClick={copyDraft}>
                    {copied ? "Copied" : "Copy draft"}
                  </button>
                </div>
              }
            >
              <textarea
                style={SS.textarea}
                value={editableDraft}
                onChange={(e) => setEditableDraft(e.target.value)}
              />

              <div style={SS.info}>
                This surface uses real stored evidence only. It is designed as a safe deterministic report workflow before any later premium AI drafting layers.
              </div>
            </SectionCard>

            <SectionCard
              title="Final preview"
              help="This is how the current draft reads as one continuous report block."
            >
              <div style={SS.reportBox}>{editableDraft}</div>
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
    minHeight: 220,
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
    minHeight: 180,
  },

  info: {
    marginTop: 10,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: 10,
    color: "#475569",
    fontWeight: 600,
    fontSize: 13,
    lineHeight: 1.5,
  },
};