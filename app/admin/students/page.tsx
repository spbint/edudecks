"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import StudentQuickOpen from "@/app/admin/components/StudentQuickOpen";
import { supabase } from "@/lib/supabaseClient";
import {
  buildStudentListPath,
  buildStudentProfilePath,
} from "@/lib/studentRoutes";

/* ───────────────────────── TYPES ───────────────────────── */

type StudentRow = {
  id: string;
  class_id: string | null;
  first_name: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  is_ilp?: boolean | null;
  created_at?: string | null;
  [k: string]: any;
};

type ClassRow = {
  id: string;
  name: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
  room?: string | null;
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
  attachment_url?: string | null;
  file_url?: string | null;
  image_url?: string | null;
  photo_url?: string | null;
  attachment_urls?: string[] | string | null;
  attachments?: any;
  [k: string]: any;
};

type InterventionRow = {
  id: string;
  student_id: string | null;
  class_id?: string | null;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  due_on?: string | null;
  due_at?: string | null;
  review_due_on?: string | null;
  review_due_date?: string | null;
  review_due_at?: string | null;
  next_review_on?: string | null;
  created_at?: string | null;
  note?: string | null;
  notes?: string | null;
  [k: string]: any;
};

type GoalItem = {
  id: string;
  student_id?: string | null;
  text: string;
  done: boolean;
  sort_order?: number;
};

type PortfolioNoteRow = {
  student_id: string;
  cover_note?: string | null;
  reflection?: string | null;
  [k: string]: any;
};

type ViewMode = "simple" | "rich";
type SortMode =
  | "urgency"
  | "name"
  | "class"
  | "freshness"
  | "portfolio"
  | "interventions"
  | "health"
  | "reporting";

type AppMode = "daily" | "reporting";
type DateLens = "all" | "term";

type StudentInsight = {
  student: StudentRow;
  klass: ClassRow | null;
  evidence: EvidenceRow[];
  interventions: InterventionRow[];
  goals: GoalItem[];
  portfolioNote: PortfolioNoteRow | null;

  evidenceCount: number;
  areaCount: number;
  areas: Array<{ label: string; count: number }>;
  strongestArea: string;
  thinArea: string;
  latestEvidenceDate: string | null;
  daysSinceEvidence: number;
  openInterventionCount: number;
  closedInterventionCount: number;
  interventionProgressPct: number;
  goalsDone: number;
  goalsTotal: number;
  portfolioReady: boolean;
  portfolioReadinessLabel: string;
  bestNextAction: string;
  healthScore: number;
  healthLabel: string;
  urgencyScore: number;
  recentEvidence: EvidenceRow[];
  healthReasons: string[];

  hasCoverNote: boolean;
  hasReflection: boolean;
  hasGoals: boolean;
  hasCurrentTermEvidence: boolean;
  thinCoverage: boolean;
  attachmentCount: number;
  narrativeEvidenceCount: number;
  reportConfidenceLabel:
    | "Export-ready"
    | "Almost ready"
    | "Needs narrative"
    | "Needs evidence"
    | "Needs coverage"
    | "Not ready";
  reportingScore: number;
  reportChecklist: Array<{ label: string; done: boolean }>;
};

type WeeklyReviewItem = {
  studentId: string;
  studentName: string;
  className: string;
  reason: string;
  urgencyScore: number;
};

type SavedView = {
  id: string;
  name: string;
  query: string;
  selectedClassId: string;
  showIlpOnly: boolean;
  showWatchlistOnly: boolean;
  showNeedsActionOnly: boolean;
  showPortfolioReadyOnly: boolean;
  showMissingCoverOnly: boolean;
  showMissingReflectionOnly: boolean;
  showNoGoalsOnly: boolean;
  showThinCoverageOnly: boolean;
  viewMode: ViewMode;
  sortMode: SortMode;
  appMode: AppMode;
  dateLens: DateLens;
};

type RecentlyViewedItem = {
  studentId: string;
  studentName: string;
  viewedAt: string;
};

type CompareRow = {
  label: string;
  values: string[];
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("column") || msg.includes("relation"));
}

function studentDisplayName(s: StudentRow | null | undefined) {
  if (!s) return "Student";
  const first = safe(s.preferred_name || s.first_name);
  const sur = safe(s.surname || s.family_name);
  const full = `${first}${sur ? " " + sur : ""}`.trim();
  return full || "Student";
}

function fmtYear(y?: number | null) {
  return y == null ? "" : `Year ${y}`;
}

function isoShort(v: string | null | undefined) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(v).slice(0, 10);
  }
}

function clip(text: string, max = 160) {
  const s = safe(text);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function evidenceDate(e: EvidenceRow) {
  return safe(e.occurred_on) || safe(e.created_at);
}

function toDate(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function daysSince(v: string | null | undefined) {
  const d = toDate(v);
  if (!d) return 999;
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function dateSortValue(v: string | null | undefined) {
  return toDate(v)?.getTime() ?? 0;
}

function pickDueDate(i: InterventionRow) {
  return (
    safe(i.review_due_on) ||
    safe(i.review_due_date) ||
    safe(i.review_due_at) ||
    safe(i.next_review_on) ||
    safe(i.due_on) ||
    safe(i.due_at) ||
    safe(i.created_at)
  );
}

function parseMaybeJsonArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => safe(x)).filter(Boolean);
  const s = safe(v);
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map((x) => safe(x)).filter(Boolean);
  } catch {}
  return [s];
}

function getAttachmentList(item: EvidenceRow): string[] {
  return [
    safe(item.attachment_url),
    safe(item.file_url),
    safe(item.image_url),
    safe(item.photo_url),
    ...parseMaybeJsonArray(item.attachment_urls),
    ...parseMaybeJsonArray(item.attachments),
  ].filter(Boolean);
}

function storageKey(prefix: string) {
  return `students_page_${prefix}`;
}

function areaCountsFromEvidence(rows: EvidenceRow[]) {
  const map = new Map<string, number>();
  for (const item of rows) {
    const key = safe(item.learning_area) || "General";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function healthStatus(score: number) {
  if (score >= 80) return "Healthy";
  if (score >= 55) return "Needs attention";
  return "Urgent review";
}

function rowHealthTone(label: string) {
  if (label === "Healthy") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (label === "Needs attention") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
}

function reportTone(label: StudentInsight["reportConfidenceLabel"]) {
  if (label === "Export-ready") return { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" };
  if (label === "Almost ready") return { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" };
  if (label === "Needs narrative") return { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" };
  if (label === "Needs evidence") return { bg: "#fff1f2", bd: "#fecaca", fg: "#9f1239" };
  if (label === "Needs coverage") return { bg: "#f5f3ff", bd: "#ddd6fe", fg: "#6d28d9" };
  return { bg: "#f8fafc", bd: "#cbd5e1", fg: "#475569" };
}

function toggleInRecord(record: Record<string, boolean>, key: string) {
  return { ...record, [key]: !record[key] };
}

function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8;") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTermStart(now = new Date()) {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 1 && month <= 3) return new Date(year, 0, 1);
  if (month >= 4 && month <= 6) return new Date(year, 3, 1);
  if (month >= 7 && month <= 9) return new Date(year, 6, 1);
  return new Date(year, 9, 1);
}

function isOnOrAfter(dateValue: string | null | undefined, cutoff: Date | null) {
  if (!cutoff) return true;
  const d = toDate(dateValue);
  if (!d) return false;
  return d.getTime() >= cutoff.getTime();
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  shell: { display: "flex", minHeight: "100vh", background: "#f6f7fb" } as React.CSSProperties,
  main: { flex: 1, padding: 24, maxWidth: 1600, margin: "0 auto", width: "100%" } as React.CSSProperties,

  hero: {
    border: "1px solid #e8eaf0",
    borderRadius: 22,
    background: "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
    padding: 18,
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
    margin: 0,
    color: "#0f172a",
    lineHeight: 1.05,
  } as React.CSSProperties,

  h2: {
    fontSize: 18,
    fontWeight: 950,
    margin: 0,
    color: "#0f172a",
    lineHeight: 1.1,
  } as React.CSSProperties,

  sub: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 800,
    fontSize: 13,
    lineHeight: 1.45,
  } as React.CSSProperties,

  stickyBar: {
    position: "sticky",
    top: 0,
    zIndex: 7,
    marginTop: 14,
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(10px)",
  } as React.CSSProperties,

  sectionPad: {
    padding: 16,
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  } as React.CSSProperties,

  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1.1fr",
    gap: 12,
    alignItems: "end",
  } as React.CSSProperties,

  grid6: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  grid3: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  card: {
    border: "1px solid #e8eaf0",
    borderRadius: 18,
    background: "#fff",
  } as React.CSSProperties,

  block: {
    border: "1px solid #edf2f7",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
  } as React.CSSProperties,

  statCard: {
    border: "1px solid #eef2f7",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
  } as React.CSSProperties,

  statK: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  statV: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.05,
  } as React.CSSProperties,

  statS: {
    marginTop: 6,
    color: "#475569",
    fontWeight: 800,
    fontSize: 12,
    lineHeight: 1.35,
  } as React.CSSProperties,

  blockTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  blockHelp: {
    marginTop: 6,
    color: "#64748b",
    fontWeight: 800,
    fontSize: 12,
    lineHeight: 1.45,
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

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 800,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
  } as React.CSSProperties,

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 800,
    background: "#fff",
    outline: "none",
    color: "#0f172a",
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
    whiteSpace: "nowrap",
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
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipAccent: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    fontSize: 12,
    fontWeight: 900,
    color: "#4338ca",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  chipSuccess: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    fontSize: 12,
    fontWeight: 900,
    color: "#166534",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  warn: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 12,
    color: "#92400e",
    fontWeight: 900,
  } as React.CSSProperties,

  ok: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    padding: 12,
    color: "#065f46",
    fontWeight: 900,
  } as React.CSSProperties,

  info: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 12,
    color: "#1d4ed8",
    fontWeight: 900,
  } as React.CSSProperties,

  err: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    padding: 12,
    color: "#9f1239",
    fontWeight: 900,
  } as React.CSSProperties,

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    marginTop: 12,
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  } as React.CSSProperties,

  th: {
    textAlign: "left",
    padding: "10px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 0.4,
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  td: {
    padding: "10px 10px",
    borderBottom: "1px solid #eef2f7",
    color: "#0f172a",
    fontWeight: 800,
    verticalAlign: "top",
  } as React.CSSProperties,

  studentRow: {
    background: "#fff",
  } as React.CSSProperties,

  expandedCell: {
    padding: 0,
    background: "#fafbff",
    borderBottom: "1px solid #eef2f7",
  } as React.CSSProperties,

  expandedWrap: {
    padding: 16,
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr",
    gap: 12,
  } as React.CSSProperties,

  item: {
    borderTop: "1px solid #eef2f7",
    paddingTop: 10,
    marginTop: 10,
  } as React.CSSProperties,

  itemTitle: {
    fontWeight: 950,
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 1.3,
  } as React.CSSProperties,

  itemText: {
    marginTop: 8,
    color: "#334155",
    fontWeight: 800,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  } as React.CSSProperties,

  empty: {
    color: "#64748b",
    fontWeight: 900,
  } as React.CSSProperties,

  actionItem: {
    borderRadius: 14,
    padding: 12,
    border: "1px solid #e5e7eb",
    fontWeight: 900,
  } as React.CSSProperties,

  barBg: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
  } as React.CSSProperties,

  barRow: {
    display: "grid",
    gridTemplateColumns: "150px 1fr auto",
    gap: 10,
    alignItems: "center",
  } as React.CSSProperties,

  compareGrid: {
    display: "grid",
    gridTemplateColumns: "180px repeat(3, minmax(0, 1fr))",
    gap: 10,
    alignItems: "stretch",
  } as React.CSSProperties,

  compareCellHead: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  compareCell: {
    border: "1px solid #eef2f7",
    borderRadius: 14,
    padding: 12,
    background: "#fff",
    color: "#334155",
    fontWeight: 800,
  } as React.CSSProperties,
};

/* ───────────────────────── PAGE ───────────────────────── */

export default function StudentsPage() {
  const router = useRouter();
  const studentsReturnTo = buildStudentListPath();

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [portfolioNotes, setPortfolioNotes] = useState<PortfolioNoteRow[]>([]);

  const [query, setQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [showIlpOnly, setShowIlpOnly] = useState(false);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [showNeedsActionOnly, setShowNeedsActionOnly] = useState(false);
  const [showPortfolioReadyOnly, setShowPortfolioReadyOnly] = useState(false);
  const [showMissingCoverOnly, setShowMissingCoverOnly] = useState(false);
  const [showMissingReflectionOnly, setShowMissingReflectionOnly] = useState(false);
  const [showNoGoalsOnly, setShowNoGoalsOnly] = useState(false);
  const [showThinCoverageOnly, setShowThinCoverageOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("rich");
  const [sortMode, setSortMode] = useState<SortMode>("urgency");
  const [appMode, setAppMode] = useState<AppMode>("daily");
  const [dateLens, setDateLens] = useState<DateLens>("all");

  const [watchlist, setWatchlist] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedForCompare, setSelectedForCompare] = useState<Record<string, boolean>>({});
  const [healthExplainFor, setHealthExplainFor] = useState<string | null>(null);

  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [newSavedViewName, setNewSavedViewName] = useState("");
  const [selectedSavedViewId, setSelectedSavedViewId] = useState("");

  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  async function loadStudents() {
    const tries = [
      "id,class_id,first_name,preferred_name,surname,family_name,is_ilp,created_at",
      "id,class_id,first_name,preferred_name,surname,is_ilp,created_at",
      "id,class_id,first_name,preferred_name,family_name,is_ilp,created_at",
      "id,class_id,first_name,preferred_name,is_ilp,created_at",
    ];

    for (const sel of tries) {
      const r = await supabase.from("students").select(sel).order("first_name", { ascending: true }).limit(5000);
      if (!r.error) {
        setStudents((((r.data as any[]) ?? []) as StudentRow[]));
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setStudents([]);
  }

  async function loadClasses() {
    const tries = [
      "id,name,year_level,teacher_name,room",
      "id,name,year_level,room",
      "id,name,year_level",
      "id,name",
    ];

    for (const sel of tries) {
      const r = await supabase.from("classes").select(sel).order("name", { ascending: true }).limit(5000);
      if (!r.error) {
        setClasses((((r.data as any[]) ?? []) as ClassRow[]));
        return;
      }
      if (!isMissingColumnError(r.error)) throw r.error;
    }

    setClasses([]);
  }

  async function loadEvidence() {
    const tries: Array<{ select: string; withDeletedFilter: boolean }> = [
      {
        select:
          "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted,attachment_url,file_url,image_url,photo_url,attachment_urls,attachments",
        withDeletedFilter: true,
      },
      {
        select:
          "id,student_id,class_id,title,summary,body,learning_area,evidence_type,occurred_on,created_at,visibility,attachment_url,file_url,image_url,photo_url,attachment_urls,attachments",
        withDeletedFilter: false,
      },
      {
        select: "id,student_id,class_id,title,summary,body,learning_area,occurred_on,created_at,visibility",
        withDeletedFilter: false,
      },
    ];

    for (const attempt of tries) {
      let q = supabase
        .from("evidence_entries")
        .select(attempt.select)
        .order("occurred_on", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(10000);

      if (attempt.withDeletedFilter) q = q.eq("is_deleted", false);

      const r = await q;

      if (!r.error) {
        let rows = (((r.data as any[]) ?? []) as EvidenceRow[]).slice();
        if (!attempt.withDeletedFilter) rows = rows.filter((x) => x.is_deleted !== true);
        setEvidence(rows);
        return;
      }

      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setEvidence([]);
  }

  async function loadInterventions() {
    const tries = [
      "id,student_id,class_id,title,status,priority,due_on,due_at,review_due_on,review_due_date,review_due_at,next_review_on,created_at,note,notes",
      "id,student_id,class_id,title,status,priority,due_on,due_at,review_due_on,review_due_date,review_due_at,next_review_on,created_at",
      "id,student_id,class_id,title,status,priority,created_at",
    ];

    for (const sel of tries) {
      const r = await supabase.from("interventions").select(sel).order("created_at", { ascending: false }).limit(10000);
      if (!r.error) {
        setInterventions((((r.data as any[]) ?? []) as InterventionRow[]));
        return;
      }

      if (!isMissingRelationOrColumn(r.error)) throw r.error;
    }

    setInterventions([]);
  }

  async function loadGoals() {
    const r = await supabase
      .from("student_goals")
      .select("id,student_id,text,done,sort_order")
      .order("sort_order", { ascending: true })
      .limit(10000);

    if (r.error) {
      if (isMissingRelationOrColumn(r.error)) {
        setGoals([]);
        return;
      }
      throw r.error;
    }

    setGoals((((r.data as any[]) ?? []) as GoalItem[]));
  }

  async function loadPortfolioNotes() {
    const r = await supabase
      .from("student_portfolio_notes")
      .select("student_id,cover_note,reflection")
      .limit(5000);

    if (r.error) {
      if (isMissingRelationOrColumn(r.error)) {
        setPortfolioNotes([]);
        return;
      }
      throw r.error;
    }

    setPortfolioNotes((((r.data as any[]) ?? []) as PortfolioNoteRow[]));
  }

  function loadLocalState() {
    if (typeof window === "undefined") return;

    try {
      const wl = window.localStorage.getItem(storageKey("watchlist"));
      if (wl) setWatchlist(JSON.parse(wl) || {});
    } catch {}

    try {
      const vm = window.localStorage.getItem(storageKey("view_mode"));
      if (vm === "simple" || vm === "rich") setViewMode(vm);
    } catch {}

    try {
      const sm = window.localStorage.getItem(storageKey("sort_mode"));
      if (sm) setSortMode(sm as SortMode);
    } catch {}

    try {
      const am = window.localStorage.getItem(storageKey("app_mode"));
      if (am === "daily" || am === "reporting") setAppMode(am);
    } catch {}

    try {
      const dl = window.localStorage.getItem(storageKey("date_lens"));
      if (dl === "all" || dl === "term") setDateLens(dl);
    } catch {}

    try {
      const sv = window.localStorage.getItem(storageKey("saved_views"));
      if (sv) setSavedViews(JSON.parse(sv) || []);
    } catch {}

    try {
      const rv = window.localStorage.getItem(storageKey("recently_viewed"));
      if (rv) setRecentlyViewed(JSON.parse(rv) || []);
    } catch {}
  }

  async function loadAll() {
    setBusy(true);
    setErr(null);

    try {
      await Promise.all([
        loadStudents(),
        loadClasses(),
        loadEvidence(),
        loadInterventions(),
        loadGoals(),
        loadPortfolioNotes(),
      ]);
      loadLocalState();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey("watchlist"), JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey("view_mode"), viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey("sort_mode"), sortMode);
  }, [sortMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey("app_mode"), appMode);
  }, [appMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey("date_lens"), dateLens);
  }, [dateLens]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey("saved_views"), JSON.stringify(savedViews));
  }, [savedViews]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey("recently_viewed"), JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const classMap = useMemo(() => {
    const map = new Map<string, ClassRow>();
    for (const row of classes) map.set(safe(row.id), row);
    return map;
  }, [classes]);

  const evidenceByStudent = useMemo(() => {
    const map = new Map<string, EvidenceRow[]>();
    for (const item of evidence) {
      const key = safe(item.student_id);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [evidence]);

  const interventionsByStudent = useMemo(() => {
    const map = new Map<string, InterventionRow[]>();
    for (const item of interventions) {
      const key = safe(item.student_id);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [interventions]);

  const goalsByStudent = useMemo(() => {
    const map = new Map<string, GoalItem[]>();
    for (const item of goals) {
      const key = safe(item.student_id);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [goals]);

  const portfolioByStudent = useMemo(() => {
    const map = new Map<string, PortfolioNoteRow>();
    for (const item of portfolioNotes) {
      const key = safe(item.student_id);
      if (!key) continue;
      map.set(key, item);
    }
    return map;
  }, [portfolioNotes]);

  const termCutoff = useMemo(() => (dateLens === "term" ? getTermStart(new Date()) : null), [dateLens]);

  const insights = useMemo<StudentInsight[]>(() => {
    return students.map((student) => {
      const allEvidenceRows = [...(evidenceByStudent.get(safe(student.id)) ?? [])].sort(
        (a, b) => dateSortValue(evidenceDate(b)) - dateSortValue(evidenceDate(a))
      );

      const evidenceRows = termCutoff
        ? allEvidenceRows.filter((x) => isOnOrAfter(evidenceDate(x), termCutoff))
        : allEvidenceRows;

      const interventionRows = [...(interventionsByStudent.get(safe(student.id)) ?? [])];
      const goalRows = [...(goalsByStudent.get(safe(student.id)) ?? [])];
      const portfolioNote = portfolioByStudent.get(safe(student.id)) ?? null;

      const areas = areaCountsFromEvidence(evidenceRows);
      const strongestArea = areas[0]?.label || "—";
      const thinArea = areas.find((x) => x.count <= 1)?.label || "—";

      const latestEvidenceDate = evidenceRows[0] ? evidenceDate(evidenceRows[0]) : null;
      const days = daysSince(latestEvidenceDate);

      const openInterventions = interventionRows.filter((i) => {
        const status = safe(i.status).toLowerCase();
        return status !== "closed" && status !== "complete" && status !== "completed" && status !== "archived";
      });

      const closedInterventions = Math.max(0, interventionRows.length - openInterventions.length);
      const interventionProgressPct = interventionRows.length
        ? Math.round((closedInterventions / interventionRows.length) * 100)
        : 0;

      const goalsDone = goalRows.filter((g) => g.done).length;
      const goalsTotal = goalRows.length;

      const hasCoverNote = safe(portfolioNote?.cover_note).length > 0;
      const hasReflection = safe(portfolioNote?.reflection).length > 0;
      const hasGoals = goalsTotal > 0;
      const hasCurrentTermEvidence = allEvidenceRows.some((x) => isOnOrAfter(evidenceDate(x), getTermStart(new Date())));
      const thinCoverage = areas.length < 3;
      const attachmentCount = evidenceRows.reduce((sum, item) => sum + getAttachmentList(item).length, 0);
      const narrativeEvidenceCount = evidenceRows.filter((x) => safe(x.summary) || safe(x.body)).length;

      const portfolioReady =
        evidenceRows.length > 0 &&
        goalsTotal > 0 &&
        hasCoverNote &&
        hasReflection &&
        areas.length >= 3;

      const portfolioReadinessLabel = portfolioReady
        ? "Ready"
        : evidenceRows.length > 0 && (hasCoverNote || hasReflection)
        ? "Watch"
        : "Incomplete";

      let healthScore = 0;
      const healthReasons: string[] = [];

      if (evidenceRows.length >= 8) {
        healthScore += 20;
        healthReasons.push("Strong evidence volume");
      } else if (evidenceRows.length >= 3) {
        healthScore += 12;
        healthReasons.push("Moderate evidence volume");
      } else if (evidenceRows.length >= 1) {
        healthScore += 6;
        healthReasons.push("Some evidence present");
      } else {
        healthReasons.push("No evidence recorded");
      }

      if (areas.length >= 4) {
        healthScore += 15;
        healthReasons.push("Broad learning-area coverage");
      } else if (areas.length >= 2) {
        healthScore += 8;
        healthReasons.push("Some learning-area breadth");
      } else {
        healthReasons.push("Coverage is narrow");
      }

      if (days <= 21) {
        healthScore += 15;
        healthReasons.push("Evidence is recent");
      } else if (days <= 45) {
        healthScore += 10;
        healthReasons.push("Evidence is reasonably current");
      } else if (days <= 75) {
        healthScore += 4;
        healthReasons.push("Evidence is aging");
      } else {
        healthReasons.push("Evidence is stale");
      }

      if (openInterventions.length === 0) {
        healthScore += 12;
        healthReasons.push("No open support items");
      } else if (openInterventions.length <= 2) {
        healthScore += 6;
        healthReasons.push("Support load is manageable");
      } else {
        healthReasons.push("Support load is elevated");
      }

      if (hasGoals) {
        healthScore += 8;
        healthReasons.push("Goals are set");
      } else {
        healthReasons.push("No goals set");
      }

      if (goalsDone > 0) {
        healthScore += 5;
        healthReasons.push("Some goals completed");
      }

      if (hasCoverNote) {
        healthScore += 8;
        healthReasons.push("Cover note present");
      } else {
        healthReasons.push("Cover note missing");
      }

      if (hasReflection) {
        healthScore += 8;
        healthReasons.push("Reflection present");
      } else {
        healthReasons.push("Reflection missing");
      }

      if (attachmentCount > 0) {
        healthScore += 4;
        healthReasons.push("Attachments present");
      }

      healthScore = Math.min(100, healthScore);

      let bestNextAction = "Maintain regular evidence and review";
      if (!evidenceRows.length) bestNextAction = "Add the first evidence item";
      else if (days > 45) bestNextAction = "Add fresh evidence";
      else if (areas.length < 3) bestNextAction = "Broaden learning areas";
      else if (openInterventions.length > 0) bestNextAction = "Review intervention items";
      else if (!hasGoals) bestNextAction = "Add a goal";
      else if (!hasCoverNote) bestNextAction = "Add portfolio cover note";
      else if (!hasReflection) bestNextAction = "Add portfolio reflection";

      let urgencyScore = 0;
      urgencyScore += Math.min(40, days);
      urgencyScore += openInterventions.length * 8;
      urgencyScore += areas.length < 2 ? 12 : areas.length < 3 ? 6 : 0;
      urgencyScore += !hasGoals ? 6 : 0;
      urgencyScore += !hasCoverNote ? 5 : 0;
      urgencyScore += !hasReflection ? 5 : 0;
      urgencyScore += student.is_ilp ? 6 : 0;

      let reportingScore = 0;
      if (hasCoverNote) reportingScore += 18;
      if (hasReflection) reportingScore += 18;
      if (hasGoals) reportingScore += 12;
      if (evidenceRows.length >= 4) reportingScore += 16;
      else if (evidenceRows.length >= 2) reportingScore += 8;
      if (areas.length >= 4) reportingScore += 16;
      else if (areas.length >= 3) reportingScore += 10;
      if (narrativeEvidenceCount >= 3) reportingScore += 10;
      else if (narrativeEvidenceCount >= 1) reportingScore += 5;
      if (attachmentCount > 0) reportingScore += 5;
      if (days <= 45) reportingScore += 5;

      let reportConfidenceLabel: StudentInsight["reportConfidenceLabel"] = "Not ready";
      if (hasCoverNote && hasReflection && hasGoals && evidenceRows.length >= 4 && areas.length >= 4) {
        reportConfidenceLabel = "Export-ready";
      } else if (hasCoverNote && hasReflection && hasGoals && evidenceRows.length >= 2 && areas.length >= 3) {
        reportConfidenceLabel = "Almost ready";
      } else if (evidenceRows.length >= 2 && areas.length >= 3 && (!hasCoverNote || !hasReflection)) {
        reportConfidenceLabel = "Needs narrative";
      } else if (evidenceRows.length < 2) {
        reportConfidenceLabel = "Needs evidence";
      } else if (areas.length < 3) {
        reportConfidenceLabel = "Needs coverage";
      }

      const reportChecklist = [
        { label: "Cover note", done: hasCoverNote },
        { label: "Reflection", done: hasReflection },
        { label: "Goals", done: hasGoals },
        { label: "Fresh evidence", done: evidenceRows.length >= 2 && days <= 45 },
        { label: "Coverage breadth", done: areas.length >= 3 },
        { label: "Narrative evidence", done: narrativeEvidenceCount >= 2 },
      ];

      return {
        student,
        klass: classMap.get(safe(student.class_id)) ?? null,
        evidence: evidenceRows,
        interventions: interventionRows,
        goals: goalRows,
        portfolioNote,
        evidenceCount: evidenceRows.length,
        areaCount: areas.length,
        areas,
        strongestArea,
        thinArea,
        latestEvidenceDate,
        daysSinceEvidence: days,
        openInterventionCount: openInterventions.length,
        closedInterventionCount: closedInterventions,
        interventionProgressPct,
        goalsDone,
        goalsTotal,
        portfolioReady,
        portfolioReadinessLabel,
        bestNextAction,
        healthScore,
        healthLabel: healthStatus(healthScore),
        urgencyScore,
        recentEvidence: evidenceRows.slice(0, 4),
        healthReasons,
        hasCoverNote,
        hasReflection,
        hasGoals,
        hasCurrentTermEvidence,
        thinCoverage,
        attachmentCount,
        narrativeEvidenceCount,
        reportConfidenceLabel,
        reportingScore,
        reportChecklist,
      };
    });
  }, [
    students,
    classMap,
    evidenceByStudent,
    interventionsByStudent,
    goalsByStudent,
    portfolioByStudent,
    termCutoff,
  ]);

  const insightMap = useMemo(() => {
    const map = new Map<string, StudentInsight>();
    for (const row of insights) map.set(safe(row.student.id), row);
    return map;
  }, [insights]);

  const filteredInsights = useMemo(() => {
    const q = safe(query).toLowerCase();

    let rows = insights.filter((row) => {
      if (selectedClassId !== "all" && safe(row.student.class_id) !== selectedClassId) return false;
      if (showIlpOnly && !row.student.is_ilp) return false;
      if (showWatchlistOnly && !watchlist[safe(row.student.id)]) return false;
      if (showNeedsActionOnly && row.urgencyScore < 25) return false;
      if (showPortfolioReadyOnly && row.reportConfidenceLabel !== "Export-ready" && row.reportConfidenceLabel !== "Almost ready") return false;
      if (showMissingCoverOnly && row.hasCoverNote) return false;
      if (showMissingReflectionOnly && row.hasReflection) return false;
      if (showNoGoalsOnly && row.hasGoals) return false;
      if (showThinCoverageOnly && !row.thinCoverage) return false;

      if (q) {
        const hay = [
          studentDisplayName(row.student),
          safe(row.klass?.name),
          safe(row.bestNextAction),
          safe(row.strongestArea),
          safe(row.thinArea),
          safe(row.healthLabel),
          safe(row.reportConfidenceLabel),
          row.areas.map((x) => x.label).join(" "),
        ]
          .join(" ")
          .toLowerCase();

        if (!hay.includes(q)) return false;
      }

      return true;
    });

    rows = rows.slice().sort((a, b) => {
      const effectiveSort = appMode === "reporting" && sortMode === "urgency" ? "reporting" : sortMode;

      if (effectiveSort === "reporting") {
        const rank = (x: StudentInsight) => {
          const map: Record<StudentInsight["reportConfidenceLabel"], number> = {
            "Export-ready": 5,
            "Almost ready": 4,
            "Needs narrative": 3,
            "Needs coverage": 2,
            "Needs evidence": 1,
            "Not ready": 0,
          };
          return map[x.reportConfidenceLabel];
        };
        return (
          rank(b) - rank(a) ||
          b.reportingScore - a.reportingScore ||
          Number(a.hasReflection) - Number(b.hasReflection) ||
          Number(a.hasCoverNote) - Number(b.hasCoverNote) ||
          b.daysSinceEvidence - a.daysSinceEvidence
        );
      }

      if (effectiveSort === "urgency") return b.urgencyScore - a.urgencyScore || a.bestNextAction.localeCompare(b.bestNextAction);
      if (effectiveSort === "name") return studentDisplayName(a.student).localeCompare(studentDisplayName(b.student));
      if (effectiveSort === "class") return safe(a.klass?.name).localeCompare(safe(b.klass?.name)) || studentDisplayName(a.student).localeCompare(studentDisplayName(b.student));
      if (effectiveSort === "freshness") return b.daysSinceEvidence - a.daysSinceEvidence;
      if (effectiveSort === "portfolio") return b.reportingScore - a.reportingScore;
      if (effectiveSort === "interventions") return b.openInterventionCount - a.openInterventionCount || b.urgencyScore - a.urgencyScore;
      if (effectiveSort === "health") return a.healthScore - b.healthScore;
      return 0;
    });

    return rows;
  }, [
    insights,
    query,
    selectedClassId,
    showIlpOnly,
    showWatchlistOnly,
    showNeedsActionOnly,
    showPortfolioReadyOnly,
    showMissingCoverOnly,
    showMissingReflectionOnly,
    showNoGoalsOnly,
    showThinCoverageOnly,
    watchlist,
    sortMode,
    appMode,
  ]);

  const weeklyReviewQueue = useMemo<WeeklyReviewItem[]>(() => {
    const source = appMode === "reporting"
      ? insights.filter((row) => row.reportConfidenceLabel !== "Export-ready")
      : insights.filter((row) => row.urgencyScore >= 25);

    return source
      .map((row) => {
        let reason = row.bestNextAction;

        if (appMode === "reporting") {
          if (!row.hasCoverNote) reason = "Missing cover note";
          else if (!row.hasReflection) reason = "Missing reflection";
          else if (!row.hasGoals) reason = "No goals set";
          else if (!row.hasCurrentTermEvidence) reason = "No evidence this term";
          else if (row.thinCoverage) reason = "Thin coverage";
          else reason = row.reportConfidenceLabel;
        } else {
          if (row.daysSinceEvidence > 75) reason = "Evidence is stale";
          else if (row.openInterventionCount > 0) reason = "Open intervention items need review";
          else if (!row.portfolioReady) reason = "Portfolio is not yet ready";
        }

        return {
          studentId: safe(row.student.id),
          studentName: studentDisplayName(row.student),
          className: safe(row.klass?.name) || "No class",
          reason,
          urgencyScore: appMode === "reporting" ? 100 - row.reportingScore : row.urgencyScore,
        };
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, 8);
  }, [insights, appMode]);

  const summary = useMemo(() => {
    const stale = insights.filter((x) => x.daysSinceEvidence > 45).length;
    const urgent = insights.filter((x) => x.urgencyScore >= 25).length;
    const ready = insights.filter((x) => x.reportConfidenceLabel === "Export-ready").length;
    const almost = insights.filter((x) => x.reportConfidenceLabel === "Almost ready").length;
    const noCover = insights.filter((x) => !x.hasCoverNote).length;
    const noReflection = insights.filter((x) => !x.hasReflection).length;
    const noGoals = insights.filter((x) => !x.hasGoals).length;
    const thinCoverage = insights.filter((x) => x.thinCoverage).length;
    const ilp = insights.filter((x) => x.student.is_ilp).length;
    const watch = insights.filter((x) => watchlist[safe(x.student.id)]).length;
    return {
      total: insights.length,
      stale,
      urgent,
      ready,
      almost,
      noCover,
      noReflection,
      noGoals,
      thinCoverage,
      ilp,
      watch,
    };
  }, [insights, watchlist]);

  const compareInsights = useMemo(() => {
    return Object.keys(selectedForCompare)
      .filter((id) => selectedForCompare[id])
      .slice(0, 3)
      .map((id) => insightMap.get(id))
      .filter((x): x is StudentInsight => !!x);
  }, [selectedForCompare, insightMap]);

  const compareRows = useMemo<CompareRow[]>(() => {
    if (!compareInsights.length) return [];
    return [
      { label: "Health", values: compareInsights.map((x) => `${x.healthLabel} (${x.healthScore})`) },
      { label: "Report confidence", values: compareInsights.map((x) => `${x.reportConfidenceLabel} (${x.reportingScore})`) },
      { label: "Best next action", values: compareInsights.map((x) => x.bestNextAction) },
      { label: "Days since evidence", values: compareInsights.map((x) => (x.latestEvidenceDate ? `${x.daysSinceEvidence}d` : "—")) },
      { label: "Current lens evidence", values: compareInsights.map((x) => `${x.evidenceCount}`) },
      { label: "Area coverage", values: compareInsights.map((x) => `${x.areaCount} areas`) },
      { label: "Strongest area", values: compareInsights.map((x) => x.strongestArea) },
      { label: "Open interventions", values: compareInsights.map((x) => String(x.openInterventionCount)) },
      { label: "Goals", values: compareInsights.map((x) => `${x.goalsDone}/${x.goalsTotal}`) },
      { label: "Cover note", values: compareInsights.map((x) => (x.hasCoverNote ? "Yes" : "No")) },
      { label: "Reflection", values: compareInsights.map((x) => (x.hasReflection ? "Yes" : "No")) },
    ];
  }, [compareInsights]);

  function toggleWatch(studentId: string) {
    setWatchlist((prev) => toggleInRecord(prev, studentId));
  }

  function toggleExpanded(studentId: string) {
    setExpandedRows((prev) => toggleInRecord(prev, studentId));
  }

  function toggleCompare(studentId: string) {
    setSelectedForCompare((prev) => {
      const next = toggleInRecord(prev, studentId);
      const selectedIds = Object.keys(next).filter((id) => next[id]);
      if (selectedIds.length <= 3) return next;

      const lastThree = selectedIds.slice(-3);
      const trimmed: Record<string, boolean> = {};
      for (const id of lastThree) trimmed[id] = true;
      return trimmed;
    });
  }

  function openStudentProfile(studentId: string) {
    const row = insightMap.get(studentId);
    if (row) {
      const entry: RecentlyViewedItem = {
        studentId,
        studentName: studentDisplayName(row.student),
        viewedAt: new Date().toISOString(),
      };

      setRecentlyViewed((prev) => {
        const next = [entry, ...prev.filter((x) => x.studentId !== studentId)];
        return next.slice(0, 8);
      });
    }

    router.push(buildStudentProfilePath(studentId, studentsReturnTo));
  }

  function openStudentPortfolio(studentId: string) {
    const row = insightMap.get(studentId);
    if (row) {
      const entry: RecentlyViewedItem = {
        studentId,
        studentName: studentDisplayName(row.student),
        viewedAt: new Date().toISOString(),
      };

      setRecentlyViewed((prev) => {
        const next = [entry, ...prev.filter((x) => x.studentId !== studentId)];
        return next.slice(0, 8);
      });
    }

    router.push(
      `/admin/students/${encodeURIComponent(studentId)}/portfolio?returnTo=${encodeURIComponent(
        studentsReturnTo
      )}`
    );
  }

  function saveCurrentView() {
    const name = safe(newSavedViewName);
    if (!name) return;

    const view: SavedView = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      query,
      selectedClassId,
      showIlpOnly,
      showWatchlistOnly,
      showNeedsActionOnly,
      showPortfolioReadyOnly,
      showMissingCoverOnly,
      showMissingReflectionOnly,
      showNoGoalsOnly,
      showThinCoverageOnly,
      viewMode,
      sortMode,
      appMode,
      dateLens,
    };

    setSavedViews((prev) => [view, ...prev.filter((x) => x.name.toLowerCase() !== name.toLowerCase())].slice(0, 20));
    setNewSavedViewName("");
    setSelectedSavedViewId(view.id);
  }

  function applySavedView(id: string) {
    const found = savedViews.find((x) => x.id === id);
    if (!found) return;

    setSelectedSavedViewId(found.id);
    setQuery(found.query);
    setSelectedClassId(found.selectedClassId);
    setShowIlpOnly(found.showIlpOnly);
    setShowWatchlistOnly(found.showWatchlistOnly);
    setShowNeedsActionOnly(found.showNeedsActionOnly);
    setShowPortfolioReadyOnly(found.showPortfolioReadyOnly);
    setShowMissingCoverOnly(found.showMissingCoverOnly);
    setShowMissingReflectionOnly(found.showMissingReflectionOnly);
    setShowNoGoalsOnly(found.showNoGoalsOnly);
    setShowThinCoverageOnly(found.showThinCoverageOnly);
    setViewMode(found.viewMode);
    setSortMode(found.sortMode);
    setAppMode(found.appMode);
    setDateLens(found.dateLens);
  }

  function deleteSavedView(id: string) {
    setSavedViews((prev) => prev.filter((x) => x.id !== id));
    if (selectedSavedViewId === id) setSelectedSavedViewId("");
  }

  function exportSelectedStudents() {
    const selected = Object.keys(selectedForCompare)
      .filter((id) => selectedForCompare[id])
      .map((id) => insightMap.get(id))
      .filter((x): x is StudentInsight => !!x);

    if (!selected.length) return;

    const lines: string[] = [];
    lines.push(appMode === "reporting" ? "Reporting Shortlist — EduDecks" : "Selected Students — EduDecks");
    lines.push("");

    selected.forEach((row) => {
      lines.push(`• ${studentDisplayName(row.student)} — ${appMode === "reporting" ? row.reportConfidenceLabel : row.bestNextAction}`);
      lines.push(`  Class: ${safe(row.klass?.name) || "No class"}`);
      lines.push(`  Health: ${row.healthLabel} (${row.healthScore})`);
      lines.push(`  Report confidence: ${row.reportConfidenceLabel} (${row.reportingScore})`);
      lines.push(`  Latest Evidence: ${isoShort(row.latestEvidenceDate)} (${row.latestEvidenceDate ? `${row.daysSinceEvidence}d` : "—"})`);
      lines.push(`  Coverage: ${row.areaCount} area${row.areaCount === 1 ? "" : "s"}`);
      lines.push(`  Open Interventions: ${row.openInterventionCount}`);
      lines.push(`  Goals: ${row.goalsDone}/${row.goalsTotal}`);
      lines.push(`  Cover note: ${row.hasCoverNote ? "Yes" : "No"}`);
      lines.push(`  Reflection: ${row.hasReflection ? "Yes" : "No"}`);
      lines.push("");
    });
    lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);

    downloadText(
      `${appMode === "reporting" ? "reporting-shortlist" : "student-shortlist"}-${new Date().toISOString().slice(0, 10)}.txt`,
      lines.join("\n"),
      "text/plain;charset=utf-8;"
    );
  }

  return (
    <div style={S.shell}>
      <AdminLeftNav />

      <main style={S.main}>
        <section style={S.hero}>
          <div style={S.subtle}>Students Command Board</div>
          <h1 style={S.h1}>Students</h1>
          <div style={S.sub}>
            {appMode === "reporting"
              ? "Reporting Season Mode prioritises portfolio readiness, missing notes, thin coverage, and export confidence."
              : "Daily Operations Mode prioritises urgency, freshness, support load, and actionability."}
          </div>

          <div style={{ ...S.row, marginTop: 12 }}>
            <button
              style={appMode === "daily" ? S.btnPrimary : S.btn}
              onClick={() => {
                setAppMode("daily");
                if (sortMode === "reporting") setSortMode("urgency");
              }}
            >
              Daily Operations
            </button>
            <button
              style={appMode === "reporting" ? S.btnPrimary : S.btn}
              onClick={() => {
                setAppMode("reporting");
                setSortMode("reporting");
                setDateLens("term");
              }}
            >
              Reporting Season
            </button>
            <span style={S.chipMuted}>Date lens: {dateLens === "term" ? "Current term" : "All time"}</span>
          </div>

          {busy ? <div style={S.ok}>Loading students dashboard…</div> : null}
          {err ? <div style={S.err}>Error: {err}</div> : null}
        </section>

        <section style={S.grid2}>
          <div style={S.block}>
            <div style={S.blockTitle}>Recently viewed</div>
            <div style={S.blockHelp}>
              Quick access to the students you opened most recently.
            </div>

            <div style={{ ...S.row, marginTop: 12 }}>
              {recentlyViewed.length ? (
                recentlyViewed.map((item) => {
                  const recentInsight = insightMap.get(item.studentId);
                  return (
                    <StudentQuickOpen
                      key={item.studentId}
                      studentId={item.studentId}
                      label={item.studentName}
                      ilp={!!recentInsight?.student?.is_ilp}
                      returnTo={studentsReturnTo}
                      fullHref={buildStudentProfilePath(item.studentId, studentsReturnTo)}
                    />
                  );
                })
              ) : (
                <div style={S.empty}>No recently viewed students yet.</div>
              )}
            </div>
          </div>

          <div style={S.block}>
            <div style={S.blockTitle}>Saved views</div>
            <div style={S.blockHelp}>
              Save named filter sets for reporting week, ILP review, homeschool compliance, or your own focus list.
            </div>

            <div style={{ ...S.row, marginTop: 12 }}>
              <input
                style={{ ...S.input, maxWidth: 260 }}
                value={newSavedViewName}
                onChange={(e) => setNewSavedViewName(e.target.value)}
                placeholder="View name..."
              />
              <button style={S.btnPrimary} onClick={saveCurrentView}>
                Save current view
              </button>

              <select
                style={{ ...S.select, maxWidth: 260 }}
                value={selectedSavedViewId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedSavedViewId(id);
                  if (id) applySavedView(id);
                }}
              >
                <option value="">Select saved view</option>
                {savedViews.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>

              {selectedSavedViewId ? (
                <button style={S.btn} onClick={() => deleteSavedView(selectedSavedViewId)}>
                  Delete saved view
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section style={S.stickyBar}>
          <div style={S.sectionPad}>
            <div style={S.controlsGrid}>
              <div>
                <div style={S.subtle}>Search</div>
                <input
                  style={S.input}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search student, class, action, area..."
                />
              </div>

              <div>
                <div style={S.subtle}>Class</div>
                <select
                  style={S.select}
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="all">All classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={safe(c.id)}>
                      {safe(c.name) || "Class"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={S.subtle}>View</div>
                <select
                  style={S.select}
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                >
                  <option value="simple">Simple</option>
                  <option value="rich">Rich</option>
                </select>
              </div>

              <div>
                <div style={S.subtle}>Sort by</div>
                <select
                  style={S.select}
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                >
                  <option value="urgency">Urgency</option>
                  <option value="reporting">Reporting confidence</option>
                  <option value="name">Name</option>
                  <option value="class">Class</option>
                  <option value="freshness">Evidence freshness</option>
                  <option value="portfolio">Portfolio readiness</option>
                  <option value="interventions">Open interventions</option>
                  <option value="health">Health score</option>
                </select>
              </div>

              <div>
                <div style={S.subtle}>Date lens</div>
                <select
                  style={S.select}
                  value={dateLens}
                  onChange={(e) => setDateLens(e.target.value as DateLens)}
                >
                  <option value="all">All time</option>
                  <option value="term">Current term</option>
                </select>
              </div>

              <div>
                <div style={S.subtle}>Quick filters</div>
                <div style={{ ...S.row }}>
                  <button
                    style={showIlpOnly ? S.btnPrimary : S.btn}
                    onClick={() => setShowIlpOnly((v) => !v)}
                  >
                    ILP
                  </button>
                  <button
                    style={showWatchlistOnly ? S.btnPrimary : S.btn}
                    onClick={() => setShowWatchlistOnly((v) => !v)}
                  >
                    Watchlist
                  </button>
                </div>
              </div>
            </div>

            <div style={{ ...S.row, marginTop: 12 }}>
              <button
                style={showNeedsActionOnly ? S.btnPrimary : S.btn}
                onClick={() => setShowNeedsActionOnly((v) => !v)}
              >
                Needs action
              </button>
              <button
                style={showPortfolioReadyOnly ? S.btnPrimary : S.btn}
                onClick={() => setShowPortfolioReadyOnly((v) => !v)}
              >
                Ready
              </button>
              <button
                style={showMissingCoverOnly ? S.btnPrimary : S.btn}
                onClick={() => setShowMissingCoverOnly((v) => !v)}
              >
                Missing cover
              </button>
              <button
                style={showMissingReflectionOnly ? S.btnPrimary : S.btn}
                onClick={() => setShowMissingReflectionOnly((v) => !v)}
              >
                Missing reflection
              </button>
              <button
                style={showNoGoalsOnly ? S.btnPrimary : S.btn}
                onClick={() => setShowNoGoalsOnly((v) => !v)}
              >
                No goals
              </button>
              <button
                style={showThinCoverageOnly ? S.btnPrimary : S.btn}
                onClick={() => setShowThinCoverageOnly((v) => !v)}
              >
                Thin coverage
              </button>
              <button
                style={compareInsights.length >= 1 ? S.btnPrimary : S.btn}
                onClick={exportSelectedStudents}
                disabled={compareInsights.length === 0}
              >
                Export selected
              </button>
            </div>
          </div>
        </section>

        {appMode === "reporting" ? (
          <section style={S.grid6}>
            <div style={S.statCard}>
              <div style={S.statK}>Export-ready</div>
              <div style={S.statV}>{summary.ready}</div>
              <div style={S.statS}>Students likely ready to export.</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statK}>Almost ready</div>
              <div style={S.statV}>{summary.almost}</div>
              <div style={S.statS}>Students close to report-ready.</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statK}>Missing cover note</div>
              <div style={S.statV}>{summary.noCover}</div>
              <div style={S.statS}>Students missing cover note.</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statK}>Missing reflection</div>
              <div style={S.statV}>{summary.noReflection}</div>
              <div style={S.statS}>Students missing reflection.</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statK}>No goals</div>
              <div style={S.statV}>{summary.noGoals}</div>
              <div style={S.statS}>Students without goals.</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statK}>Thin coverage</div>
              <div style={S.statV}>{summary.thinCoverage}</div>
              <div style={S.statS}>Students with narrow evidence breadth.</div>
            </div>
          </section>
        ) : (
          <section style={S.grid6}>
            <div style={S.statCard}>
              <div style={S.statK}>Students</div>
              <div style={S.statV}>{summary.total}</div>
              <div style={S.statS}>All visible learner records.</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statK}>Needs Action</div>
              <div style={S.statV}>{summary.urgent}</div>
              <div style={S.statS}>Students likely needing attention soon.</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statK}>Stale Evidence</div>
              <div style={S.statV}>{summary.stale}</div>
              <div style={S.statS}>Records with evidence older than 45 days.</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statK}>Portfolio Ready</div>
              <div style={S.statV}>{summary.ready}</div>
              <div style={S.statS}>Likely ready for portfolio/report work.</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statK}>ILP</div>
              <div style={S.statV}>{summary.ilp}</div>
              <div style={S.statS}>Students flagged as ILP.</div>
            </div>

            <div style={S.statCard}>
              <div style={S.statK}>Watchlist</div>
              <div style={S.statV}>{summary.watch}</div>
              <div style={S.statS}>Starred students to monitor closely.</div>
            </div>
          </section>
        )}

        <section style={S.grid2}>
          <div style={S.block}>
            <div style={S.blockTitle}>
              {appMode === "reporting" ? "Reporting shortlist" : "Weekly review queue"}
            </div>
            <div style={S.blockHelp}>
              {appMode === "reporting"
                ? "Students most likely to need report-prep attention next."
                : "Students most likely to need attention this week based on freshness, support load, and portfolio completeness."}
            </div>

            {weeklyReviewQueue.length ? (
              weeklyReviewQueue.map((item) => {
                const quickInsight = insightMap.get(item.studentId);

                return (
                  <div key={item.studentId} style={S.item}>
                    <div style={{ ...S.row, justifyContent: "space-between" }}>
                      <StudentQuickOpen
                        studentId={item.studentId}
                        label={item.studentName}
                        ilp={!!quickInsight?.student?.is_ilp}
                        returnTo={studentsReturnTo}
                        fullHref={buildStudentProfilePath(item.studentId, studentsReturnTo)}
                        showFullButton
                      />
                      <span style={S.chipAccent}>
                        {appMode === "reporting" ? "Priority" : `Urgency ${item.urgencyScore}`}
                      </span>
                    </div>
                    <div style={{ ...S.row, marginTop: 8 }}>
                      <span style={S.chipMuted}>{item.className}</span>
                      <span style={S.chipMuted}>{item.reason}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={S.ok}>
                {appMode === "reporting"
                  ? "No strong reporting shortlist surfaced right now."
                  : "No students are strongly surfacing in the weekly review queue right now."}
              </div>
            )}
          </div>

          <div style={S.block}>
            <div style={S.blockTitle}>
              {appMode === "reporting" ? "Reporting mode guide" : "Daily mode guide"}
            </div>
            <div style={S.blockHelp}>
              {appMode === "reporting"
                ? "This mode shifts the page toward export confidence, missing narratives, missing goals, and breadth of evidence."
                : "This mode keeps the page focused on urgency, support load, and fresh operational actions."}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {appMode === "reporting" ? (
                <>
                  <div style={S.chipMuted}>Export-ready = strong report candidate</div>
                  <div style={S.chipMuted}>Almost ready = close, but still needs polish</div>
                  <div style={S.chipMuted}>Needs narrative = notes missing</div>
                  <div style={S.chipMuted}>Needs evidence = insufficient documentation</div>
                  <div style={S.chipMuted}>Needs coverage = too narrow across areas</div>
                </>
              ) : (
                <>
                  <div style={S.chipMuted}>Health score = overall record health</div>
                  <div style={S.chipMuted}>Best next action = one clear recommendation</div>
                  <div style={S.chipMuted}>Watchlist = students to keep front-of-mind</div>
                  <div style={S.chipMuted}>Expand rows = quick detail without leaving the page</div>
                  <div style={S.chipMuted}>Portfolio ready = likely ready for reporting workflow</div>
                </>
              )}
            </div>
          </div>
        </section>

        {compareInsights.length >= 2 ? (
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={S.blockTitle}>Quick compare</div>
              <div style={S.blockHelp}>
                Compare up to three selected students side by side.
              </div>

              <div style={{ ...S.compareGrid, marginTop: 12 }}>
                <div />
                {compareInsights.map((row) => (
                  <div key={safe(row.student.id)} style={S.compareCellHead}>
                    {studentDisplayName(row.student)}
                  </div>
                ))}

                {compareRows.map((row) => (
                  <React.Fragment key={row.label}>
                    <div style={S.compareCellHead}>{row.label}</div>
                    {row.values.map((value, idx) => (
                      <div key={`${row.label}_${idx}`} style={S.compareCell}>
                        {value}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {healthExplainFor ? (
          <section style={S.card}>
            <div style={S.sectionPad}>
              <div style={{ ...S.row, justifyContent: "space-between" }}>
                <div>
                  <div style={S.blockTitle}>Health score explanation</div>
                  <div style={S.blockHelp}>
                    Why this student’s record is currently scored the way it is.
                  </div>
                </div>
                <button style={S.btn} onClick={() => setHealthExplainFor(null)}>
                  Close
                </button>
              </div>

              {insightMap.get(healthExplainFor) ? (
                <div style={{ marginTop: 12 }}>
                  <div style={S.info}>
                    {studentDisplayName(insightMap.get(healthExplainFor)!.student)} —{" "}
                    {insightMap.get(healthExplainFor)!.healthLabel} ({insightMap.get(healthExplainFor)!.healthScore})
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {insightMap.get(healthExplainFor)!.healthReasons.map((reason, idx) => (
                      <div key={`${reason}_${idx}`} style={S.actionItem}>
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={S.empty}>Student explanation unavailable.</div>
              )}
            </div>
          </section>
        ) : null}

        <section style={S.card}>
          <div style={S.sectionPad}>
            <div style={S.blockTitle}>
              {appMode === "reporting" ? "Reporting operations list" : "Student list"}
            </div>
            <div style={S.blockHelp}>
              {appMode === "reporting"
                ? "Scan the whole cohort for report readiness, missing narratives, and export confidence."
                : "Scan the whole cohort, then expand a learner or jump directly into their profile, portfolio, evidence, or intervention workflow."}
            </div>

            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Select</th>
                    <th style={S.th}>Student</th>
                    <th style={S.th}>Health</th>
                    {appMode === "reporting" ? <th style={S.th}>Report confidence</th> : <th style={S.th}>Next action</th>}
                    <th style={S.th}>Days since evidence</th>
                    <th style={S.th}>Open interventions</th>
                    <th style={S.th}>Portfolio</th>
                    {viewMode === "rich" ? (
                      <>
                        <th style={S.th}>Goals</th>
                        <th style={S.th}>Strongest area</th>
                        <th style={S.th}>Thin area</th>
                      </>
                    ) : null}
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInsights.length ? (
                    filteredInsights.map((row) => {
                      const studentId = safe(row.student.id);
                      const tone = rowHealthTone(row.healthLabel);
                      const reportBadge = reportTone(row.reportConfidenceLabel);
                      const isExpanded = !!expandedRows[studentId];
                      const portfolioTone =
                        row.portfolioReadinessLabel === "Ready"
                          ? S.chipSuccess
                          : row.portfolioReadinessLabel === "Watch"
                          ? S.chipAccent
                          : S.chipMuted;

                      return (
                        <React.Fragment key={studentId}>
                          <tr style={S.studentRow}>
                            <td style={S.td}>
                              <input
                                type="checkbox"
                                checked={!!selectedForCompare[studentId]}
                                onChange={() => toggleCompare(studentId)}
                              />
                            </td>

                            <td style={S.td}>
                              <StudentQuickOpen
                                studentId={studentId}
                                label={studentDisplayName(row.student)}
                                ilp={!!row.student.is_ilp}
                                returnTo={studentsReturnTo}
                                fullHref={buildStudentProfilePath(studentId, studentsReturnTo)}
                                showFullButton
                              />
                              <div style={{ marginTop: 6, ...S.row }}>
                                {row.student.is_ilp ? <span style={S.chipAccent}>ILP</span> : null}
                                {watchlist[studentId] ? <span style={S.chipSuccess}>Watching</span> : null}
                              </div>
                            </td>

                            <td style={S.td}>
                              <div style={{ ...S.row }}>
                                <span
                                  style={{
                                    ...S.chip,
                                    background: tone.bg,
                                    border: `1px solid ${tone.bd}`,
                                    color: tone.fg,
                                  }}
                                >
                                  {row.healthLabel}
                                </span>

                                <button
                                  style={S.btn}
                                  onClick={() => setHealthExplainFor(studentId)}
                                >
                                  Why?
                                </button>
                              </div>

                              <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800 }}>
                                Score {row.healthScore}
                              </div>
                            </td>

                            {appMode === "reporting" ? (
                              <td style={S.td}>
                                <span
                                  style={{
                                    ...S.chip,
                                    background: reportBadge.bg,
                                    border: `1px solid ${reportBadge.bd}`,
                                    color: reportBadge.fg,
                                  }}
                                >
                                  {row.reportConfidenceLabel}
                                </span>
                                <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800 }}>
                                  Score {row.reportingScore}
                                </div>
                              </td>
                            ) : (
                              <td style={S.td}>
                                <div>{row.bestNextAction}</div>
                              </td>
                            )}

                            <td style={S.td}>
                              <div>{row.latestEvidenceDate ? `${row.daysSinceEvidence}d` : "—"}</div>
                              <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800 }}>
                                {isoShort(row.latestEvidenceDate)}
                              </div>
                            </td>

                            <td style={S.td}>
                              <div>{row.openInterventionCount}</div>
                              <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800 }}>
                                {row.interventionProgressPct}% closed
                              </div>
                            </td>

                            <td style={S.td}>
                              <span style={portfolioTone}>{row.portfolioReadinessLabel}</span>
                            </td>

                            {viewMode === "rich" ? (
                              <>
                                <td style={S.td}>
                                  {row.goalsDone}/{row.goalsTotal}
                                </td>

                                <td style={S.td}>{row.strongestArea}</td>

                                <td style={S.td}>{row.thinArea}</td>
                              </>
                            ) : null}

                            <td style={S.td}>
                              <div style={{ ...S.row }}>
                                <button style={S.btn} onClick={() => toggleWatch(studentId)}>
                                  {watchlist[studentId] ? "★" : "☆"}
                                </button>

                                <button style={S.btn} onClick={() => toggleExpanded(studentId)}>
                                  {isExpanded ? "Hide" : "Expand"}
                                </button>

                                {appMode === "reporting" ? (
                                  <>
                                    <button
                                      style={S.btnPrimary}
                                      onClick={() => openStudentPortfolio(studentId)}
                                    >
                                      Portfolio
                                    </button>
                                    <button
                                      style={S.btn}
                                      onClick={() => openStudentProfile(studentId)}
                                    >
                                      Hub
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      style={S.btn}
                                      onClick={() => openStudentProfile(studentId)}
                                    >
                                      Profile
                                    </button>

                                    <button
                                      style={S.btn}
                                      onClick={() => openStudentPortfolio(studentId)}
                                    >
                                      Portfolio
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {isExpanded ? (
                            <tr>
                              <td style={S.expandedCell} colSpan={viewMode === "rich" ? 11 : 8}>
                                <div style={S.expandedWrap}>
                                  <div style={S.block}>
                                    <div style={S.blockTitle}>
                                      {appMode === "reporting" ? "Report checklist" : "Recent evidence"}
                                    </div>
                                    <div style={S.blockHelp}>
                                      {appMode === "reporting"
                                        ? "Checklist view for what still needs to be completed before reporting."
                                        : "Quick snapshot of the latest evidence on record."}
                                    </div>

                                    {appMode === "reporting" ? (
                                      row.reportChecklist.map((item, idx) => (
                                        <div key={`${item.label}_${idx}`} style={S.item}>
                                          <div style={{ ...S.row, justifyContent: "space-between" }}>
                                            <div style={S.itemTitle}>{item.label}</div>
                                            {item.done ? (
                                              <span style={S.chipSuccess}>Done</span>
                                            ) : (
                                              <span style={S.chipAccent}>Needed</span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : row.recentEvidence.length ? (
                                      row.recentEvidence.map((item) => (
                                        <div key={item.id} style={S.item}>
                                          <div style={{ ...S.row, justifyContent: "space-between" }}>
                                            <div style={S.itemTitle}>{safe(item.title) || "Evidence entry"}</div>
                                            <span style={S.chip}>{isoShort(evidenceDate(item))}</span>
                                          </div>

                                          <div style={{ ...S.row, marginTop: 8 }}>
                                            <span style={S.chipMuted}>{safe(item.learning_area) || "General"}</span>
                                            {safe(item.evidence_type) ? (
                                              <span style={S.chipMuted}>{safe(item.evidence_type)}</span>
                                            ) : null}
                                          </div>

                                          {safe(item.summary) ? (
                                            <div style={S.itemText}>{clip(safe(item.summary), 120)}</div>
                                          ) : safe(item.body) ? (
                                            <div style={S.itemText}>{clip(safe(item.body), 120)}</div>
                                          ) : null}
                                        </div>
                                      ))
                                    ) : (
                                      <div style={S.empty}>No evidence yet.</div>
                                    )}
                                  </div>

                                  <div style={S.block}>
                                    <div style={S.blockTitle}>Quick indicators</div>
                                    <div style={S.blockHelp}>
                                      Small but high-value student signals.
                                    </div>

                                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                      <div style={S.barRow}>
                                        <div style={{ fontWeight: 900, color: "#0f172a" }}>Area breadth</div>
                                        <div style={S.barBg}>
                                          <div
                                            style={{
                                              width: `${Math.min(100, row.areaCount * 20)}%`,
                                              height: "100%",
                                              background: "#6366f1",
                                            }}
                                          />
                                        </div>
                                        <div style={S.chipMuted}>{row.areaCount}</div>
                                      </div>

                                      <div style={S.barRow}>
                                        <div style={{ fontWeight: 900, color: "#0f172a" }}>Goal progress</div>
                                        <div style={S.barBg}>
                                          <div
                                            style={{
                                              width: `${row.goalsTotal ? Math.round((row.goalsDone / row.goalsTotal) * 100) : 0}%`,
                                              height: "100%",
                                              background: "#22c55e",
                                            }}
                                          />
                                        </div>
                                        <div style={S.chipMuted}>
                                          {row.goalsDone}/{row.goalsTotal}
                                        </div>
                                      </div>

                                      <div style={S.barRow}>
                                        <div style={{ fontWeight: 900, color: "#0f172a" }}>Support progress</div>
                                        <div style={S.barBg}>
                                          <div
                                            style={{
                                              width: `${row.interventionProgressPct}%`,
                                              height: "100%",
                                              background: "#f59e0b",
                                            }}
                                          />
                                        </div>
                                        <div style={S.chipMuted}>{row.interventionProgressPct}%</div>
                                      </div>
                                    </div>

                                    {appMode === "reporting" ? (
                                      <div style={S.info}>
                                        Cover note: {row.hasCoverNote ? "Yes" : "No"} • Reflection: {row.hasReflection ? "Yes" : "No"} • Goals: {row.hasGoals ? "Yes" : "No"}
                                      </div>
                                    ) : (
                                      <div style={S.info}>
                                        Strongest area: {row.strongestArea}
                                        {row.thinArea !== "—" ? ` • Thin area: ${row.thinArea}` : ""}
                                      </div>
                                    )}
                                  </div>

                                  <div style={S.block}>
                                    <div style={S.blockTitle}>Quick actions</div>
                                    <div style={S.blockHelp}>
                                      Jump directly into the most likely next workflow.
                                    </div>

                                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                      {appMode === "reporting" ? (
                                        <>
                                          <button
                                            style={S.btnPrimary}
                                            onClick={() => openStudentPortfolio(studentId)}
                                          >
                                            Open portfolio builder
                                          </button>

                                          <button
                                            style={S.btn}
                                            onClick={() => openStudentProfile(studentId)}
                                          >
                                            Open student hub
                                          </button>

                                          <button
                                            style={S.btn}
                                            onClick={() =>
                                              router.push(
                                                `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
                                                  row.student.class_id
                                                    ? `&classId=${encodeURIComponent(row.student.class_id)}`
                                                    : ""
                                                }&returnTo=${encodeURIComponent(studentsReturnTo)}`
                                              )
                                            }
                                          >
                                            Add evidence
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            style={S.btnPrimary}
                                            onClick={() => openStudentProfile(studentId)}
                                          >
                                            Open student hub
                                          </button>

                                          <button
                                            style={S.btn}
                                            onClick={() => openStudentPortfolio(studentId)}
                                          >
                                            Open portfolio
                                          </button>

                                          <button
                                            style={S.btn}
                                            onClick={() =>
                                              router.push(
                                                `/admin/evidence-entry?studentId=${encodeURIComponent(studentId)}${
                                                  row.student.class_id
                                                    ? `&classId=${encodeURIComponent(row.student.class_id)}`
                                                    : ""
                                                }&returnTo=${encodeURIComponent(studentsReturnTo)}`
                                              )
                                            }
                                          >
                                            Add evidence
                                          </button>

                                          <button
                                            style={S.btn}
                                            onClick={() =>
                                              router.push(
                                                `/admin/evidence-feed?studentId=${encodeURIComponent(studentId)}${
                                                  row.student.class_id
                                                    ? `&classId=${encodeURIComponent(row.student.class_id)}`
                                                    : ""
                                                }&returnTo=${encodeURIComponent(studentsReturnTo)}`
                                              )
                                            }
                                          >
                                            Open evidence feed
                                          </button>

                                          <button
                                            style={S.btn}
                                            onClick={() =>
                                              router.push(
                                                `/admin/interventions?studentId=${encodeURIComponent(studentId)}${
                                                  row.student.class_id
                                                    ? `&classId=${encodeURIComponent(row.student.class_id)}`
                                                    : ""
                                                }&returnTo=${encodeURIComponent(studentsReturnTo)}`
                                              )
                                            }
                                          >
                                            Open interventions
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td style={S.td} colSpan={viewMode === "rich" ? 11 : 8}>
                        No students match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}