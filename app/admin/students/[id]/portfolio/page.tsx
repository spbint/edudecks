"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

type StudentRow = {
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

type PortfolioMode = "feed" | "portfolio" | "conference";
type AreaFilter =
  | "All"
  | "Literacy"
  | "Maths"
  | "Science"
  | "Wellbeing"
  | "Humanities"
  | "Other";

type CurationAction =
  | "portfolio"
  | "conference"
  | "report"
  | "exemplar"
  | "weak";

type EvidenceQualityLabel =
  | "Flagship"
  | "Strong"
  | "Usable"
  | "Thin"
  | "Rewrite";

type EvidenceQualityRow = {
  id: string;
  qualityScore: number;
  qualityLabel: EvidenceQualityLabel;
  suggestedAction: string;
  reasons: string[];
  compositionUse: "Flagship" | "Representative" | "Supporting" | "Replace";
};

type RecommendedNextEvidenceRow = {
  area: AreaFilter;
  priorityScore: number;
  urgency: "High" | "Watch" | "Stable";
  title: string;
  text: string;
};

type ForecastRow = {
  confidenceLabel: "Rising" | "Stable" | "Drifting";
  confidenceTone: "good" | "watch" | "danger";
  readiness2w: number;
  readiness4w: number;
  evidenceMomentumDelta: number;
  narrativeStrength: number;
  breadthCount: number;
  advice: string;
};

type DurableSelectionState = Record<
  string,
  {
    portfolio?: boolean;
    conference?: boolean;
    report?: boolean;
    exemplar?: boolean;
    weak?: boolean;
  }
>;

type PortfolioCompositionRow = {
  flagship: EvidenceEntryRow[];
  representative: EvidenceEntryRow[];
  supporting: EvidenceEntryRow[];
  rewrite: EvidenceEntryRow[];
};

type ConferenceBriefRow = {
  strengthsToShare: string[];
  concernToDiscuss: string;
  anchorEvidence: EvidenceEntryRow[];
  nextStep: string;
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

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

function nameOf(s: StudentRow | null) {
  if (!s) return "Student";
  return `${safe(s.preferred_name || s.first_name)} ${safe(
    s.surname || s.family_name || s.last_name
  )}`.trim();
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function attentionTone(status: string | null | undefined) {
  const s = safe(status).toLowerCase();
  if (s === "attention") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c", label: "Immediate attention" };
  if (s === "watch") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412", label: "Watch" };
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534", label: "Ready" };
}

function guessArea(raw: string | null | undefined): AreaFilter {
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

function freshnessLabel(v: string | null | undefined) {
  const d = daysSince(v);
  if (d == null) return "—";
  if (d <= 7) return `${d}d • fresh`;
  if (d <= 21) return `${d}d • recent`;
  return `${d}d • stale`;
}

function areaBarColor(score: number) {
  if (score < 40) return "#ef4444";
  if (score < 70) return "#f59e0b";
  return "#22c55e";
}

function tonePill(kind: "good" | "watch" | "danger") {
  if (kind === "danger") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  if (kind === "watch") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
}

function qualityTone(label: EvidenceQualityLabel) {
  if (label === "Rewrite") return { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" };
  if (label === "Thin") return { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" };
  if (label === "Usable") return { bg: "#ecfeff", bd: "#a5f3fc", fg: "#0c4a6e" };
  if (label === "Strong") return { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" };
  return { bg: "#fffaf0", bd: "#fde68a", fg: "#92400e" };
}

function selectionStorageKey(studentId: string) {
  return `edudecks.studentEvidenceCuration.${studentId}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
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
        border: `1px solid ${bd}`,
        background: bg,
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
          marginTop: 8,
          fontSize: 28,
          fontWeight: 900,
          color: "#0f172a",
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          color: "#475569",
          fontWeight: 500,
          lineHeight: 1.45,
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

export default function StudentEvidenceFeedPage() {
  return (
    <Suspense fallback={null}>
      <StudentEvidenceFeedPageContent />
    </Suspense>
  );
}

function StudentEvidenceFeedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const studentId = safe(searchParams?.get("studentId"));
  const returnTo = safe(searchParams?.get("returnTo"));
  const backHref =
    returnTo ||
    (studentId ? buildStudentProfilePath(studentId, buildStudentListPath()) : buildStudentListPath());

  const [student, setStudent] = useState<StudentRow | null>(null);
  const [klass, setKlass] = useState<ClassRow | null>(null);
  const [overview, setOverview] = useState<StudentProfileOverviewRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceEntryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<PortfolioMode>("feed");
  const [areaFilter, setAreaFilter] = useState<AreaFilter>("All");
  const [searchText, setSearchText] = useState("");
  const [curation, setCuration] = useState<DurableSelectionState>({});

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

        let studentData: StudentRow | null = null;

        for (const sel of studentQueries) {
          const { data, error } = await supabase
            .from("students")
            .select(sel)
            .eq("id", studentId)
            .maybeSingle();

          if (!error) {
            studentData = (data as StudentRow | null) ?? null;
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

        let evRows: EvidenceEntryRow[] = [];

        for (const sel of evidenceQueries) {
          const { data, error } = await supabase
            .from("evidence_entries")
            .select(sel)
            .eq("student_id", studentId)
            .eq("is_deleted", false)
            .order("occurred_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });

          if (!error) {
            evRows = ((data as any[]) ?? []) as EvidenceEntryRow[];
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
        setEvidence(evRows);
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
    const saved = safeParse<DurableSelectionState>(
      window.localStorage.getItem(selectionStorageKey(studentId)),
      {}
    );
    setCuration(saved);
  }, [studentId]);

  function toggleCuration(evidenceId: string, action: CurationAction) {
    setCuration((prev) => {
      const next: DurableSelectionState = {
        ...prev,
        [evidenceId]: {
          ...prev[evidenceId],
          [action]: !prev[evidenceId]?.[action],
        },
      };

      if (typeof window !== "undefined" && studentId) {
        window.localStorage.setItem(selectionStorageKey(studentId), JSON.stringify(next));
      }

      return next;
    });
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

  const filteredEvidence = useMemo(() => {
    const q = safe(searchText).toLowerCase();

    return evidence.filter((row) => {
      const area = guessArea(row.learning_area);
      if (areaFilter !== "All" && area !== areaFilter) return false;

      if (!q) return true;

      return (
        safe(row.title).toLowerCase().includes(q) ||
        safe(row.summary).toLowerCase().includes(q) ||
        safe(row.body).toLowerCase().includes(q) ||
        safe(row.note).toLowerCase().includes(q) ||
        safe(row.learning_area).toLowerCase().includes(q) ||
        safe(row.evidence_type).toLowerCase().includes(q)
      );
    });
  }, [evidence, areaFilter, searchText]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, EvidenceEntryRow[]>();

    filteredEvidence.forEach((row) => {
      const key = shortDate(row.occurred_on || row.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });

    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      items,
    }));
  }, [filteredEvidence]);

  const areaProfile = useMemo(() => {
    const labels: AreaFilter[] = ["Literacy", "Maths", "Science", "Wellbeing", "Humanities", "Other"];

    return labels.map((label) => {
      const entries = evidence.filter((e) => guessArea(e.learning_area) === label);
      const fresh = entries.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d <= 30;
      });
      const latest = entries[0]?.occurred_on || entries[0]?.created_at || null;

      let score =
        Math.min(50, entries.length * 10) +
        Math.min(35, fresh.length * 15) +
        ((daysSince(latest) ?? 999) <= 21 ? 15 : 0);

      score = Math.max(0, Math.min(100, score));

      return {
        label,
        count: entries.length,
        fresh: fresh.length,
        latest,
        score,
      };
    });
  }, [evidence]);

  const qualityMap = useMemo<Record<string, EvidenceQualityRow>>(() => {
    const rows: Record<string, EvidenceQualityRow> = {};

    filteredEvidence.forEach((row) => {
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

      const selected = curation[row.id] || {};
      if (selected.exemplar) {
        score += 6;
        reasons.push("teacher-promoted exemplar");
      }
      if (selected.weak) {
        score -= 18;
        reasons.push("flagged weak");
      }

      score = Math.max(0, Math.min(100, score));

      let qualityLabel: EvidenceQualityLabel = "Usable";
      let suggestedAction = "Keep as supporting evidence.";
      let compositionUse: EvidenceQualityRow["compositionUse"] = "Supporting";

      if (score >= 84) {
        qualityLabel = "Flagship";
        compositionUse = "Flagship";
        suggestedAction =
          "Use this as a showcase anchor in portfolio, conference, or report outputs.";
      } else if (score >= 68) {
        qualityLabel = "Strong";
        compositionUse = "Representative";
        suggestedAction =
          "Strong candidate for representative portfolio coverage and reporting use.";
      } else if (score >= 50) {
        qualityLabel = "Usable";
        compositionUse = "Supporting";
        suggestedAction =
          "Useful evidence, but it would be stronger with richer narrative or media support.";
      } else if (score >= 35) {
        qualityLabel = "Thin";
        compositionUse = "Supporting";
        suggestedAction =
          "Keep only if needed for breadth; strengthen summary before formal use.";
      } else {
        qualityLabel = "Rewrite";
        compositionUse = "Replace";
        suggestedAction =
          "Rewrite or replace before using in portfolio, conference, or reporting artifacts.";
      }

      rows[row.id] = {
        id: row.id,
        qualityScore: score,
        qualityLabel,
        suggestedAction,
        reasons,
        compositionUse,
      };
    });

    return rows;
  }, [filteredEvidence, curation]);

  const curatedFilteredEvidence = useMemo(() => {
    if (mode === "portfolio") {
      return filteredEvidence.filter((row) => curation[row.id]?.portfolio);
    }
    if (mode === "conference") {
      return filteredEvidence.filter(
        (row) => curation[row.id]?.conference || (qualityMap[row.id]?.qualityScore ?? 0) >= 68
      );
    }
    return filteredEvidence;
  }, [mode, filteredEvidence, curation, qualityMap]);

  const portfolioEntries = useMemo(() => {
    return [...filteredEvidence]
      .sort((a, b) => {
        const aq = qualityMap[a.id]?.qualityScore ?? 0;
        const bq = qualityMap[b.id]?.qualityScore ?? 0;
        if (bq !== aq) return bq - aq;
        return (
          new Date(b.occurred_on || b.created_at || "").getTime() -
          new Date(a.occurred_on || a.created_at || "").getTime()
        );
      })
      .slice(0, 12);
  }, [filteredEvidence, qualityMap]);

  const portfolioComposition = useMemo<PortfolioCompositionRow>(() => {
    const sorted = [...filteredEvidence].sort((a, b) => {
      const aq = qualityMap[a.id]?.qualityScore ?? 0;
      const bq = qualityMap[b.id]?.qualityScore ?? 0;
      return bq - aq;
    });

    return {
      flagship: sorted.filter((x) => qualityMap[x.id]?.compositionUse === "Flagship").slice(0, 3),
      representative: sorted
        .filter((x) => qualityMap[x.id]?.compositionUse === "Representative")
        .slice(0, 4),
      supporting: sorted
        .filter((x) => qualityMap[x.id]?.compositionUse === "Supporting")
        .slice(0, 4),
      rewrite: sorted.filter((x) => qualityMap[x.id]?.compositionUse === "Replace").slice(0, 4),
    };
  }, [filteredEvidence, qualityMap]);

  const conferenceBrief = useMemo<ConferenceBriefRow>(() => {
    const strongAreas = areaProfile
      .filter((x) => x.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => `${x.label} is supported by visible recent evidence.`);

    const watchArea =
      areaProfile
        .filter((x) => x.score < 55)
        .sort((a, b) => a.score - b.score)[0]?.label ||
      "breadth";

    const anchorEvidence = [...portfolioEntries]
      .filter((x) => (qualityMap[x.id]?.qualityScore ?? 0) >= 68)
      .slice(0, 3);

    const nextGuidance =
      areaProfile
        .filter((x) => x.score < 55)
        .sort((a, b) => a.score - b.score)[0]?.label || "portfolio balance";

    return {
      strengthsToShare: strongAreas.length
        ? strongAreas
        : ["The portfolio contains some useful evidence, but its strongest areas need clearer anchors."],
      concernToDiscuss: `The main conference concern is ${watchArea.toLowerCase()} coverage or freshness.`,
      anchorEvidence,
      nextStep: `Capture one stronger evidence item in ${nextGuidance.toLowerCase()} to improve confidence quickly.`,
    };
  }, [areaProfile, portfolioEntries, qualityMap]);

  const conferenceHighlights = useMemo(() => {
    return portfolioEntries
      .filter((row) => (qualityMap[row.id]?.qualityScore ?? 0) >= 60)
      .slice(0, 6)
      .map((row) => ({
        id: row.id,
        title: safe(row.title) || safe(row.learning_area) || "Evidence highlight",
        text:
          clip(row.summary, 120) ||
          clip(row.body, 120) ||
          clip(row.note, 120) ||
          "Recorded evidence item.",
        area: guessArea(row.learning_area),
        date: row.occurred_on || row.created_at || null,
        quality: qualityMap[row.id]?.qualityLabel || "Usable",
      }));
  }, [portfolioEntries, qualityMap]);

  const portfolioReadiness = useMemo(() => {
    const fresh = filteredEvidence.filter((row) => {
      const d = daysSince(row.occurred_on || row.created_at);
      return d != null && d <= 30;
    }).length;

    const breadth = areaProfile.filter((x) => x.count > 0).length;
    const narrative = filteredEvidence.filter((x) => safe(x.summary) || safe(x.body) || safe(x.note)).length;
    const strongQuality = filteredEvidence.filter((x) => {
      const q = qualityMap[x.id]?.qualityScore ?? 0;
      return q >= 60;
    }).length;

    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Math.min(28, fresh * 5) +
            Math.min(24, breadth * 5) +
            Math.min(20, narrative * 2) +
            Math.min(28, strongQuality * 4)
        )
      )
    );
  }, [filteredEvidence, areaProfile, qualityMap]);

  const recommendedNextEvidence = useMemo<RecommendedNextEvidenceRow[]>(() => {
    const rows = areaProfile.map((row) => {
      const staleDays = daysSince(row.latest) ?? 999;
      const missing = row.count === 0;
      const thin = row.count > 0 && row.count <= 1;
      const stale = staleDays > 30;

      let priorityScore = 0;
      if (missing) priorityScore += 50;
      if (thin) priorityScore += 25;
      if (stale) priorityScore += 20;
      priorityScore += Math.max(0, 60 - row.score);

      let urgency: "High" | "Watch" | "Stable" = "Stable";
      if (priorityScore >= 70) urgency = "High";
      else if (priorityScore >= 40) urgency = "Watch";

      let text = "Coverage here looks healthy enough for now.";
      if (missing) {
        text = `No evidence is visible in ${row.label}. Capture one strong example with a clear summary and tagged learning area.`;
      } else if (thin && stale) {
        text = `${row.label} is thin and stale. Capture a fresh example with better narrative detail to lift readiness quickly.`;
      } else if (thin) {
        text = `${row.label} is thin. One stronger evidence item here would improve breadth fastest.`;
      } else if (stale) {
        text = `${row.label} exists but has gone stale. Add one recent item to keep the portfolio current.`;
      }

      return {
        area: row.label,
        priorityScore,
        urgency,
        title: `${row.label} next-evidence guidance`,
        text,
      };
    });

    return rows.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
  }, [areaProfile]);

  const forecast = useMemo<ForecastRow>(() => {
    const evidence30d = evidence.filter((row) => {
      const d = daysSince(row.occurred_on || row.created_at);
      return d != null && d <= 30;
    }).length;

    const evidencePrev30d = evidence.filter((row) => {
      const d = daysSince(row.occurred_on || row.created_at);
      return d != null && d > 30 && d <= 60;
    }).length;

    const evidenceMomentumDelta = evidence30d - evidencePrev30d;
    const breadthCount = areaProfile.filter((x) => x.count > 0).length;
    const narrativeStrength = filteredEvidence.filter((x) => {
      const q = qualityMap[x.id]?.qualityScore ?? 0;
      return q >= 60;
    }).length;

    let readiness2w = portfolioReadiness;
    let readiness4w = portfolioReadiness;

    if (evidenceMomentumDelta > 0) {
      readiness2w += 6;
      readiness4w += 10;
    } else if (evidenceMomentumDelta < 0) {
      readiness2w -= 5;
      readiness4w -= 9;
    }

    if (breadthCount < 4) {
      readiness2w -= 4;
      readiness4w -= 6;
    }

    if (narrativeStrength >= 4) {
      readiness2w += 4;
      readiness4w += 7;
    } else if (narrativeStrength <= 1) {
      readiness2w -= 5;
      readiness4w -= 8;
    }

    readiness2w = Math.max(0, Math.min(100, readiness2w));
    readiness4w = Math.max(0, Math.min(100, readiness4w));

    let confidenceLabel: "Rising" | "Stable" | "Drifting" = "Stable";
    let confidenceTone: "good" | "watch" | "danger" = "watch";
    let advice = "Maintain current capture rhythm and keep breadth balanced.";

    if (readiness4w >= portfolioReadiness + 5) {
      confidenceLabel = "Rising";
      confidenceTone = "good";
      advice =
        "Momentum is improving. Keep capturing strong narrative examples and promote flagship entries.";
    } else if (readiness4w <= portfolioReadiness - 5) {
      confidenceLabel = "Drifting";
      confidenceTone = "danger";
      advice =
        "Confidence is drifting. Add fresh evidence soon, especially in thin or stale areas.";
    } else {
      confidenceLabel = "Stable";
      confidenceTone = "watch";
      advice =
        "The portfolio is holding steady, but one or two targeted additions would improve resilience.";
    }

    return {
      confidenceLabel,
      confidenceTone,
      readiness2w,
      readiness4w,
      evidenceMomentumDelta,
      narrativeStrength,
      breadthCount,
      advice,
    };
  }, [evidence, areaProfile, filteredEvidence, portfolioReadiness, qualityMap]);

  const counts = useMemo(() => {
    return {
      portfolio: Object.values(curation).filter((x) => x.portfolio).length,
      conference: Object.values(curation).filter((x) => x.conference).length,
      report: Object.values(curation).filter((x) => x.report).length,
      exemplar: Object.values(curation).filter((x) => x.exemplar).length,
      weak: Object.values(curation).filter((x) => x.weak).length,
    };
  }, [curation]);

  function curationBadges(rowId: string) {
    const current = curation[rowId] || {};
    return {
      portfolio: !!current.portfolio,
      conference: !!current.conference,
      report: !!current.report,
      exemplar: !!current.exemplar,
      weak: !!current.weak,
    };
  }

  const portfolioSummaryText = useMemo(() => {
    if (portfolioReadiness >= 82) {
      return "This portfolio is strong, well-supported, and close to ready for showcase or reporting use.";
    }
    if (portfolioReadiness >= 60) {
      return "The portfolio is developing well, but it would benefit from a little more breadth and one or two stronger anchor pieces.";
    }
    return "The portfolio is still fragile. Fresh evidence and clearer flagship selections would strengthen it quickly.";
  }, [portfolioReadiness]);

  if (!studentId) {
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
        <main style={{ flex: 1, padding: 24, maxWidth: 1280 }}>
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
            No studentId was supplied to the portfolio surface.
          </div>
          <button
            style={SS.secondaryButton}
            onClick={() => router.push(buildStudentListPath())}
          >
            Go to student list
          </button>
        </main>
      </div>
    );
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
          maxWidth: 1480,
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
            Refreshing student portfolio surface…
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
              Back
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
              style={SS.primaryButton}
              onClick={() =>
                router.push(
                  `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
                    returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
                  }`
                )
              }
              type="button"
            >
              + Add Evidence
            </button>

            <Link
              href={buildStudentProfilePath(studentId, returnTo || null)}
              style={{
                ...SS.secondaryButton,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Open Profile
            </Link>
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
              Student portfolio intelligence
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
              This surface helps you move from raw evidence into a composed portfolio, clearer conference anchors,
              and stronger reporting selections.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip bg={tone.bg} bd={tone.bd} fg={tone.fg}>
                {tone.label}
              </Chip>
              <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                Portfolio readiness: {portfolioReadiness}%
              </Chip>
              <Chip bg={tonePill(forecast.confidenceTone).bg} bd={tonePill(forecast.confidenceTone).bd} fg={tonePill(forecast.confidenceTone).fg}>
                Forecast: {forecast.confidenceLabel}
              </Chip>
              <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                Last evidence: {shortDate(
                  overview?.last_evidence_at || evidence[0]?.occurred_on || evidence[0]?.created_at
                )}
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
              Portfolio read
            </div>

            <div
              style={{
                fontSize: 18,
                lineHeight: 1.25,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {safe(overview?.next_action) || "Build stronger portfolio anchors"}
            </div>

            <div
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#475569",
              }}
            >
              {portfolioSummaryText}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <SummaryRow label="Visible evidence" value={String(evidence.length)} />
              <SummaryRow label="Coverage breadth" value={String(areaProfile.filter((x) => x.count > 0).length)} />
              <SummaryRow label="Strong / flagship items" value={String(filteredEvidence.filter((x) => (qualityMap[x.id]?.qualityScore ?? 0) >= 68).length)} />
              <SummaryRow label="Pinned for portfolio" value={String(counts.portfolio)} />
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
            value={String(evidence.length)}
            helper="All visible evidence items available for curation."
            tone="primary"
          />
          <ScoreTile
            label="Portfolio readiness"
            value={`${portfolioReadiness}%`}
            helper="Current confidence that this learner has enough usable evidence for portfolio use."
            tone={portfolioReadiness >= 80 ? "good" : portfolioReadiness >= 55 ? "watch" : "danger"}
          />
          <ScoreTile
            label="Breadth"
            value={String(areaProfile.filter((x) => x.count > 0).length)}
            helper="Learning-area spread represented in the current portfolio."
            tone={areaProfile.filter((x) => x.count > 0).length >= 4 ? "good" : "watch"}
          />
          <ScoreTile
            label="4-week forecast"
            value={`${forecast.readiness4w}%`}
            helper="Projected readiness if current capture rhythm and composition hold."
            tone={forecast.confidenceTone === "good" ? "good" : forecast.confidenceTone === "danger" ? "danger" : "watch"}
          />
        </section>

        {/* Controls */}
        <SectionCard
          title="Portfolio controls"
          help="Switch between feed, composed portfolio view, and conference preparation view."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto",
              gap: 10,
              alignItems: "end",
            }}
          >
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search evidence..."
              style={SS.input}
            />

            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PortfolioMode)}
              style={SS.select}
            >
              <option value="feed">Feed Mode</option>
              <option value="portfolio">Portfolio Mode</option>
              <option value="conference">Conference Mode</option>
            </select>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value as AreaFilter)}
              style={SS.select}
            >
              <option value="All">All Areas</option>
              <option value="Literacy">Literacy</option>
              <option value="Maths">Maths</option>
              <option value="Science">Science</option>
              <option value="Wellbeing">Wellbeing</option>
              <option value="Humanities">Humanities</option>
              <option value="Other">Other</option>
            </select>

            <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
              Showing {curatedFilteredEvidence.length} / {evidence.length}
            </Chip>
          </div>
        </SectionCard>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: 16,
            marginTop: 16,
          }}
        >
          {/* LEFT */}
          <div style={{ display: "grid", gap: 16 }}>
            <SectionCard
              title={
                mode === "feed"
                  ? "Chronological evidence feed"
                  : mode === "portfolio"
                  ? "Portfolio composition"
                  : "Conference preparation"
              }
              help={
                mode === "feed"
                  ? "Raw evidence stream with quality scoring and durable curation actions."
                  : mode === "portfolio"
                  ? "A composed view of the learner portfolio using flagship, representative, supporting, and rewrite groupings."
                  : "Conference view turns evidence into strengths, anchors, and next-step talking points."
              }
            >
              {mode === "feed" ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {groupedByDate.length === 0 ? (
                    <div style={SS.softEmpty}>No evidence matches the current filters.</div>
                  ) : (
                    groupedByDate.map((group) => (
                      <div key={group.date} style={{ display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                            {group.date}
                          </Chip>
                          <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                            {group.items.length} item(s)
                          </Chip>
                        </div>

                        <div style={{ display: "grid", gap: 10 }}>
                          {group.items.map((row) => {
                            const quality = qualityMap[row.id];
                            const qTone = qualityTone(quality?.qualityLabel || "Usable");
                            const flags = curationBadges(row.id);

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
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                  <div
                                    style={{
                                      fontWeight: 900,
                                      color: "#0f172a",
                                      fontSize: 15,
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {safe(row.title) || safe(row.learning_area) || "Evidence"}
                                  </div>
                                  <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                                    {freshnessLabel(row.occurred_on || row.created_at)}
                                  </Chip>
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
                                  {safe(row.evidence_type) ? (
                                    <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                                      {safe(row.evidence_type)}
                                    </Chip>
                                  ) : null}
                                  <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                                    {fullDate(row.occurred_on || row.created_at)}
                                  </Chip>
                                  <Chip bg={qTone.bg} bd={qTone.bd} fg={qTone.fg}>
                                    {quality?.qualityLabel || "Usable"} • {quality?.qualityScore ?? 0}
                                  </Chip>
                                  {hasMedia(row) ? (
                                    <Chip bg="#ecfeff" bd="#a5f3fc" fg="#0c4a6e">
                                      Media attached
                                    </Chip>
                                  ) : null}
                                </div>

                                <div
                                  style={{
                                    color: "#475569",
                                    fontWeight: 500,
                                    lineHeight: 1.55,
                                    fontSize: 14,
                                  }}
                                >
                                  {clip(row.summary, 160) || clip(row.body, 160) || clip(row.note, 160) || "No summary available."}
                                </div>

                                <div
                                  style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 12,
                                    padding: 12,
                                    background: "#f8fafc",
                                    color: "#475569",
                                    fontWeight: 500,
                                    lineHeight: 1.45,
                                    fontSize: 13,
                                  }}
                                >
                                  <strong style={{ color: "#0f172a" }}>Evidence usefulness:</strong>{" "}
                                  {quality?.suggestedAction || "Keep as supporting evidence."}
                                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {(quality?.reasons || []).slice(0, 4).map((r) => (
                                      <Chip key={r} bg="#ffffff" bd="#e5e7eb" fg="#64748b">
                                        {r}
                                      </Chip>
                                    ))}
                                  </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button style={SS.miniButton} onClick={() => toggleCuration(row.id, "portfolio")}>
                                    {flags.portfolio ? "✓ Portfolio" : "Portfolio"}
                                  </button>
                                  <button style={SS.miniButton} onClick={() => toggleCuration(row.id, "conference")}>
                                    {flags.conference ? "✓ Conference" : "Conference"}
                                  </button>
                                  <button style={SS.miniButton} onClick={() => toggleCuration(row.id, "report")}>
                                    {flags.report ? "✓ Report" : "Report"}
                                  </button>
                                  <button style={SS.miniButton} onClick={() => toggleCuration(row.id, "exemplar")}>
                                    {flags.exemplar ? "✓ Exemplar" : "Exemplar"}
                                  </button>
                                  <button style={SS.miniButton} onClick={() => toggleCuration(row.id, "weak")}>
                                    {flags.weak ? "✓ Weak" : "Flag weak"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : mode === "portfolio" ? (
                <div style={{ display: "grid", gap: 14 }}>
                  <PortfolioBucket
                    title="Flagship pieces"
                    help="The clearest standout items that can anchor a polished portfolio."
                    rows={portfolioComposition.flagship}
                    qualityMap={qualityMap}
                  />
                  <PortfolioBucket
                    title="Representative samples"
                    help="Balanced examples that show breadth across the learner story."
                    rows={portfolioComposition.representative}
                    qualityMap={qualityMap}
                  />
                  <PortfolioBucket
                    title="Supporting items"
                    help="Useful background evidence that adds context and depth."
                    rows={portfolioComposition.supporting}
                    qualityMap={qualityMap}
                  />
                  <PortfolioBucket
                    title="Rewrite / replace"
                    help="Items that are likely too thin for strong portfolio use in their current state."
                    rows={portfolioComposition.rewrite}
                    qualityMap={qualityMap}
                  />
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={SS.softNote}>
                    <strong style={{ color: "#0f172a" }}>Strengths to share:</strong>
                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      {conferenceBrief.strengthsToShare.map((item, idx) => (
                        <div key={idx}>{item}</div>
                      ))}
                    </div>
                  </div>

                  <div style={SS.softNote}>
                    <strong style={{ color: "#0f172a" }}>Concern to discuss:</strong>{" "}
                    {conferenceBrief.concernToDiscuss}
                  </div>

                  <div style={SS.softNote}>
                    <strong style={{ color: "#0f172a" }}>Suggested next step:</strong>{" "}
                    {conferenceBrief.nextStep}
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {conferenceHighlights.length === 0 ? (
                      <div style={SS.softEmpty}>No conference highlights match the current filters.</div>
                    ) : (
                      conferenceHighlights.map((row) => (
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
                                fontWeight: 900,
                                color: "#0f172a",
                                fontSize: 15,
                                lineHeight: 1.3,
                              }}
                            >
                              {row.title}
                            </div>
                            <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                              {fullDate(row.date)}
                            </Chip>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <Chip bg="#eff6ff" bd="#bfdbfe" fg="#2563eb">
                              {row.area}
                            </Chip>
                            <Chip
                              bg={qualityTone(row.quality).bg}
                              bd={qualityTone(row.quality).bd}
                              fg={qualityTone(row.quality).fg}
                            >
                              {row.quality}
                            </Chip>
                          </div>

                          <div
                            style={{
                              color: "#475569",
                              fontWeight: 500,
                              lineHeight: 1.55,
                              fontSize: 14,
                            }}
                          >
                            {row.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* RIGHT */}
          <div style={{ display: "grid", gap: 16 }}>
            <SectionCard
              title="Coverage profile"
              help="Evidence breadth and freshness by learning area."
            >
              <div style={{ marginTop: 4 }}>
                {areaProfile.map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr 58px",
                      gap: 10,
                      alignItems: "center",
                      marginTop: 12,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>{row.label}</div>

                    <div
                      style={{
                        width: "100%",
                        height: 12,
                        borderRadius: 999,
                        background: "#e5e7eb",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${row.score}%`,
                          height: "100%",
                          background: areaBarColor(row.score),
                        }}
                      />
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        fontWeight: 900,
                        color: "#0f172a",
                      }}
                    >
                      {row.score}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {areaProfile.map((row) => (
                  <div
                    key={`${row.label}-meta`}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      background: "#f8fafc",
                      padding: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          color: "#0f172a",
                          fontSize: 14,
                        }}
                      >
                        {row.label}
                      </div>
                      <Chip bg="#ffffff" bd="#e5e7eb" fg="#475569">
                        {row.count} entries
                      </Chip>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      <Chip bg="#ffffff" bd="#e5e7eb" fg="#64748b">
                        {row.fresh} fresh
                      </Chip>
                      <Chip bg="#ffffff" bd="#e5e7eb" fg="#64748b">
                        latest {shortDate(row.latest)}
                      </Chip>
                    </div>
                  </div>
                ))}
              </div>

              <div style={SS.softNote}>
                <strong style={{ color: "#0f172a" }}>Portfolio read:</strong> {portfolioSummaryText}
              </div>
            </SectionCard>

            <SectionCard
              title="Composition summary"
              help="A quick read on how this portfolio is currently being shaped."
            >
              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat label="Pinned for portfolio" value={String(counts.portfolio)} />
                <MiniStat label="Pinned for conference" value={String(counts.conference)} />
                <MiniStat label="Pinned for report" value={String(counts.report)} />
                <MiniStat label="Exemplars" value={String(counts.exemplar)} />
                <MiniStat label="Weak / rewrite flags" value={String(counts.weak)} />
              </div>
            </SectionCard>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 16,
          }}
        >
          <SectionCard
            title="Recommended next evidence"
            help="The most useful next captures to improve readiness quickly, based on thin, missing, or stale areas."
          >
            <div style={{ display: "grid", gap: 10 }}>
              {recommendedNextEvidence.map((row) => {
                const tone = tonePill(
                  row.urgency === "High"
                    ? "danger"
                    : row.urgency === "Watch"
                    ? "watch"
                    : "good"
                );

                return (
                  <div
                    key={row.area}
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
                          fontWeight: 900,
                          color: "#0f172a",
                          fontSize: 15,
                          lineHeight: 1.3,
                        }}
                      >
                        {row.title}
                      </div>
                      <Chip bg={tone.bg} bd={tone.bd} fg={tone.fg}>
                        {row.urgency}
                      </Chip>
                    </div>
                    <div
                      style={{
                        color: "#475569",
                        fontWeight: 500,
                        lineHeight: 1.55,
                        fontSize: 14,
                      }}
                    >
                      {row.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Trajectory forecast"
            help="Forward-looking confidence based on evidence momentum, narrative strength, and breadth."
          >
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  background: "#ffffff",
                  padding: 12,
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div
                    style={{
                      fontWeight: 900,
                      color: "#0f172a",
                      fontSize: 15,
                      lineHeight: 1.3,
                    }}
                  >
                    Confidence trajectory
                  </div>
                  <Chip
                    bg={tonePill(forecast.confidenceTone).bg}
                    bd={tonePill(forecast.confidenceTone).bd}
                    fg={tonePill(forecast.confidenceTone).fg}
                  >
                    {forecast.confidenceLabel}
                  </Chip>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                    Readiness now: {portfolioReadiness}%
                  </Chip>
                  <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                    2 weeks: {forecast.readiness2w}%
                  </Chip>
                  <Chip bg="#f8fafc" bd="#e5e7eb" fg="#475569">
                    4 weeks: {forecast.readiness4w}%
                  </Chip>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Chip bg="#ffffff" bd="#e5e7eb" fg="#64748b">
                    Momentum delta: {forecast.evidenceMomentumDelta >= 0 ? "+" : ""}
                    {forecast.evidenceMomentumDelta}
                  </Chip>
                  <Chip bg="#ffffff" bd="#e5e7eb" fg="#64748b">
                    Strong narrative items: {forecast.narrativeStrength}
                  </Chip>
                  <Chip bg="#ffffff" bd="#e5e7eb" fg="#64748b">
                    Breadth count: {forecast.breadthCount}
                  </Chip>
                </div>

                <div style={SS.softNote}>
                  <strong style={{ color: "#0f172a" }}>Forecast advice:</strong> {forecast.advice}
                </div>
              </div>
            </div>
          </SectionCard>
        </section>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   SUBCOMPONENTS
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

function PortfolioBucket({
  title,
  help,
  rows,
  qualityMap,
}: {
  title: string;
  help: string;
  rows: EvidenceEntryRow[];
  qualityMap: Record<string, EvidenceQualityRow>;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        background: "#ffffff",
        padding: 14,
        display: "grid",
        gap: 10,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.3,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            lineHeight: 1.5,
            color: "#64748b",
          }}
        >
          {help}
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={SS.softEmpty}>Nothing is currently sitting in this composition bucket.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((row) => {
            const quality = qualityMap[row.id];
            const tone = qualityTone(quality?.qualityLabel || "Usable");
            return (
              <div
                key={row.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  background: "#f8fafc",
                  padding: 10,
                  display: "grid",
                  gap: 6,
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
                    {safe(row.title) || safe(row.learning_area) || "Evidence"}
                  </div>
                  <Chip bg={tone.bg} bd={tone.bd} fg={tone.fg}>
                    {quality?.qualityLabel || "Usable"}
                  </Chip>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "#475569",
                  }}
                >
                  {clip(row.summary, 120) || clip(row.body, 120) || clip(row.note, 120) || "No summary available."}
                </div>
              </div>
            );
          })}
        </div>
      )}
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

  miniButton: {
    padding: "8px 10px",
    borderRadius: 10,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#1f2937",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#1f2937",
    fontWeight: 700,
    outline: "none",
  },

  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#1f2937",
    fontWeight: 700,
    outline: "none",
  },
};
