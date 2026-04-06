"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import FlowStep from "@/app/components/FlowStep";
import UpgradeHint from "@/app/components/UpgradeHint";
import useIsMobile from "@/app/components/useIsMobile";
import {
  DEFAULT_FAMILY_PROFILE,
  loadFamilyProfile,
  type FamilyProfileRow,
} from "@/lib/familySettings";
import {
  marketLabel,
  modeLabel,
  periodLabel,
  saveReportDraft,
  loadReportDraftById,
  type PreferredMarket,
  type PeriodMode,
  type ReportMode,
  type SelectionMetaMap,
} from "@/lib/reportDrafts";
import { isPremiumActive } from "@/lib/premiumConfig";
import { getDisplayName, getEvidenceText, safeText } from "@/lib/system";

type StudentRow = {
  id: string;
  class_id?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  last_name?: string | null;
  year_level?: number | null;
  yearLabel?: string | null;
  source?: "db" | "seed";
  [k: string]: any;
};

type EvidenceRow = {
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
  attachment_urls?: string[] | string | null;
  image_url?: string | null;
  photo_url?: string | null;
  file_url?: string | null;
  audio_url?: string | null;
  is_deleted?: boolean | null;
  [k: string]: any;
};

type ReportSelectionMeta = SelectionMetaMap;
type PresetKey = "family-summary" | "authority-pack" | "term-review";
type CoverageStatus = "strong" | "developing" | "attention";
type ReadinessTone = "success" | "info" | "warning" | "danger";
type BuilderStage = {
  label: string;
  stepLabel: string;
  detail: string;
};

type BuilderValueSignal = {
  valueText: string;
  conversionText: string;
  primaryIntent: string;
  secondaryIntent: string;
};

const AREA_OPTIONS = [
  "Literacy",
  "Numeracy",
  "Science",
  "Humanities",
  "The Arts",
  "Health & PE",
  "Technologies",
  "Languages",
];

const PRESET_OPTIONS: {
  key: PresetKey;
  title: string;
  mode: ReportMode;
  period: PeriodMode;
  tone: "primary" | "secondary" | "premium";
  description: string;
}[] = [
  {
    key: "family-summary",
    title: "Family summary",
    mode: "family-summary",
    period: "term",
    tone: "primary",
    description:
      "A calm, parent-safe summary built around representative evidence.",
  },
  {
    key: "authority-pack",
    title: "Authority pack",
    mode: "authority-ready",
    period: "year",
    tone: "premium",
    description:
      "A stronger submission posture with readiness notes and appendix support.",
  },
  {
    key: "term-review",
    title: "Term review",
    mode: "progress-review",
    period: "term",
    tone: "secondary",
    description:
      "A shorter reflective review focused on what has moved forward this term.",
  },
];

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const CHILDREN_KEY = "edudecks_children_seed_v1";
const REPORTS_HIGHLIGHT_EVIDENCE_KEY = "edudecks_reports_highlight_evidence_id";

function safe(v: unknown) {
  return safeText(typeof v === "string" ? v : String(v ?? ""));
}

function clip(v: string | null | undefined, max = 140) {
  const s = safe(v);
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function studentName(student?: StudentRow | null) {
  return getDisplayName(student, "Selected child");
}

function firstNameOf(student?: StudentRow | null) {
  return safe(student?.preferred_name || student?.first_name) || "your child";
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return (
    msg.includes("does not exist") &&
    (msg.includes("relation") || msg.includes("column"))
  );
}

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();

  if (
    x.includes("liter") ||
    x.includes("reading") ||
    x.includes("writing") ||
    x.includes("english")
  ) {
    return "Literacy";
  }
  if (x.includes("math") || x.includes("num")) return "Numeracy";
  if (x.includes("science")) return "Science";
  if (
    x.includes("history") ||
    x.includes("geography") ||
    x.includes("human") ||
    x.includes("hass")
  ) {
    return "Humanities";
  }
  if (x.includes("art") || x.includes("music") || x.includes("drama")) {
    return "The Arts";
  }
  if (
    x.includes("health") ||
    x.includes("physical") ||
    x.includes("pe") ||
    x.includes("wellbeing")
  ) {
    return "Health & PE";
  }
  if (x.includes("tech")) return "Technologies";
  if (x.includes("language")) return "Languages";
  return "Other";
}

function hasMedia(row: EvidenceRow) {
  return Boolean(
    safe(row.image_url) ||
      safe(row.photo_url) ||
      safe(row.file_url) ||
      safe(row.audio_url) ||
      (Array.isArray(row.attachment_urls) && row.attachment_urls.length > 0) ||
      safe(row.attachment_urls)
  );
}

function evidenceText(row: EvidenceRow) {
  return getEvidenceText(row);
}

function evidenceScore(row: EvidenceRow) {
  let score = 0;
  const text = evidenceText(row);

  if (safe(row.title)) score += 2;
  if (safe(row.learning_area)) score += 2;
  if (safe(row.evidence_type)) score += 1;
  if (text.length >= 180) score += 4;
  else if (text.length >= 90) score += 3;
  else if (text.length >= 35) score += 2;
  else if (text.length > 0) score += 1;
  if (hasMedia(row)) score += 2;

  return score;
}

function scoreTone(score: number): "success" | "info" | "warning" {
  if (score >= 8) return "success";
  if (score >= 5) return "info";
  return "warning";
}

function shortDate(value?: string | null) {
  const s = safe(value);
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s.slice(0, 10);
    return d.toLocaleDateString();
  } catch {
    return s.slice(0, 10);
  }
}

function buildSelectedEvidenceIds(meta: ReportSelectionMeta): string[] {
  return Object.keys(meta).filter((id) => meta[id]);
}

function buildAutoSelection(rows: EvidenceRow[], count = 4): ReportSelectionMeta {
  const ids = [...rows]
    .sort((a, b) => evidenceScore(b) - evidenceScore(a))
    .slice(0, count)
    .map((row) => row.id);

  const next: ReportSelectionMeta = {};
  ids.forEach((id, index) => {
    next[id] = {
      role: index < 3 ? "core" : "appendix",
      required: index < 2,
    };
  });
  return next;
}

function detectPreset(mode: ReportMode, period: PeriodMode): PresetKey {
  if (safe(mode).toLowerCase() === "authority-ready") return "authority-pack";
  if (safe(mode).toLowerCase() === "progress-review") return "term-review";
  return "family-summary";
}

function getCoverageStatus(count: number): CoverageStatus {
  if (count >= 3) return "strong";
  if (count >= 1) return "developing";
  return "attention";
}

function coverageStatusLabel(status: CoverageStatus) {
  if (status === "strong") return "Strong";
  if (status === "developing") return "Developing";
  return "Needs evidence";
}

function coverageTone(status: CoverageStatus): ReadinessTone {
  if (status === "strong") return "success";
  if (status === "developing") return "info";
  return "warning";
}

function interpretReadiness(score: number): {
  label: string;
  tone: ReadinessTone;
  message: string;
  action: string;
} {
  if (score >= 85) {
    return {
      label: "Ready",
      tone: "success",
      message:
        "This report is in a strong position. It has enough structure and evidence to save confidently and move into output.",
      action: "You are ready to save this draft and open the report output.",
    };
  }

  if (score >= 65) {
    return {
      label: "Developing",
      tone: "info",
      message:
        "This report is close. A little more balance, evidence selection, or a short note will make it feel much stronger.",
      action: "Strengthen one or two weak areas, then save the draft.",
    };
  }

  if (score >= 45) {
    return {
      label: "Early",
      tone: "warning",
      message:
        "The report structure is taking shape, but it still needs stronger evidence anchors before it will feel calm and defensible.",
      action: "Select stronger evidence and broaden the coverage mix slightly.",
    };
  }

  return {
    label: "Not ready",
    tone: "danger",
    message:
      "This report still needs its basic foundations. Start with a child, evidence, and a clearer area mix.",
    action: "Choose a child and select evidence to start building a real draft object.",
  };
}

function buildBuilderStage(
  selectedStudentId: string,
  selectedEvidenceCount: number,
  draftId: string
): BuilderStage {
  if (!selectedStudentId) {
    return {
      label: "Choose child",
      stepLabel: "Step 1 of 3",
      detail: "Choose the child first so the report can gather the right evidence.",
    };
  }

  if (selectedEvidenceCount === 0) {
    return {
      label: "Choose evidence",
      stepLabel: "Step 2 of 3",
      detail: "Select a few strong pieces so the draft has something real to say.",
    };
  }

  if (!draftId) {
    return {
      label: "Save draft",
      stepLabel: "Step 3 of 3",
      detail: "You are ready to save the first working draft for review.",
    };
  }

  return {
    label: "Review output",
    stepLabel: "Step 3 of 3",
    detail: "Your draft is saved. Review the output before exporting or opening the authority pack.",
  };
}

function buildBuilderValueSignal(
  readinessScore: number,
  draftId: string,
  selectedEvidenceCount: number
): BuilderValueSignal {
  if (!selectedEvidenceCount) {
    return {
      valueText: "Once strong evidence is selected, EduDecks can turn it into a draft you can keep improving instead of rebuilding each time.",
      conversionText: "This is where the product starts saving real admin time.",
      primaryIntent: "reports_select_evidence",
      secondaryIntent: "reports_quick_build",
    };
  }

  if (!draftId) {
    return {
      valueText: "Saving the first draft gives you a reusable report base for output, later edits, and authority-ready work.",
      conversionText: "This is the point where progress starts to feel tangible.",
      primaryIntent: "reports_save_draft",
      secondaryIntent: "reports_open_output",
    };
  }

  if (readinessScore >= 85) {
    return {
      valueText: "You already have a saved report foundation. Reviewing output now helps you share progress with less friction.",
      conversionText: "This is the kind of calm handoff that makes the product feel worth paying for.",
      primaryIntent: "reports_open_output",
      secondaryIntent: "reports_open_authority_next",
    };
  }

  return {
    valueText: "The draft is saved, which means you now have something reusable to strengthen rather than starting over later.",
    conversionText: "Each stronger draft reduces the effort of the next reporting cycle.",
    primaryIntent: "reports_improve_saved_draft",
    secondaryIntent: "reports_open_output",
  };
}

function joinNatural(items: string[]) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function seedStudentName(raw: any, index: number) {
  return getDisplayName(raw, `Child ${index + 1}`);
}

function buildSeedStudents(): StudentRow[] {
  if (typeof window === "undefined") return [];
  const raw = parseJson<any[]>(window.localStorage.getItem(CHILDREN_KEY), []);
  return raw.map((child, index) => ({
    id: safe(child?.id) || `seed-child-${index + 1}`,
    preferred_name: seedStudentName(child, index),
    surname: safe(child?.surname || child?.family_name || child?.last_name) || null,
    yearLabel: safe(child?.yearLabel || child?.year_label),
    source: "seed",
  }));
}

async function loadStudents(): Promise<StudentRow[]> {
  const variants = [
    "id,class_id,preferred_name,first_name,surname,family_name,last_name,year_level",
    "id,class_id,preferred_name,first_name,surname,last_name,year_level",
    "id,class_id,preferred_name,first_name,last_name,year_level",
  ];

  let lastErr: any = null;

  for (const select of variants) {
    const res = await supabase.from("students").select(select);
    if (!res.error) {
      return ((res.data || []) as unknown) as StudentRow[];
    }
    lastErr = res.error;
    if (!isMissingRelationOrColumn(res.error)) break;
  }

  if (lastErr) throw lastErr;
  return [];
}

async function loadEvidence(): Promise<EvidenceRow[]> {
  const variants = [
    "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,attachment_urls,image_url,photo_url,file_url,audio_url,is_deleted",
    "id,student_id,class_id,title,summary,body,note,learning_area,occurred_on,created_at,attachment_urls,image_url,photo_url,file_url,is_deleted",
    "id,student_id,class_id,title,summary,note,learning_area,occurred_on,created_at,is_deleted",
  ];

  let lastErr: any = null;

  for (const select of variants) {
    const res = await supabase
      .from("evidence_entries")
      .select(select)
      .order("occurred_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!res.error) {
      return (((res.data || []) as unknown) as EvidenceRow[]).filter(
        (x) => !x.is_deleted
      );
    }

    lastErr = res.error;
    if (!isMissingRelationOrColumn(res.error)) break;
  }

  if (lastErr) throw lastErr;
  return [];
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f6f8fc",
};

const innerStyle: React.CSSProperties = {
  maxWidth: 1380,
  margin: "0 auto",
  padding: "24px 20px 48px",
};

const stickyStyle: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "rgba(246,248,252,0.96)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid #e5e7eb",
};

const topBarStyle: React.CSSProperties = {
  maxWidth: 1380,
  margin: "0 auto",
  padding: "14px 20px",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#ffffff",
  boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  padding: 18,
};

const softCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  background: "#f8fafc",
  padding: 14,
};

const buttonStyle = (primary = false): React.CSSProperties => ({
  minHeight: 42,
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${primary ? "#2563eb" : "#d1d5db"}`,
  background: primary ? "#2563eb" : "#ffffff",
  color: primary ? "#ffffff" : "#0f172a",
  textDecoration: "none",
  fontWeight: 900,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

const pillStyle = (
  tone: ReadinessTone | "primary" | "secondary"
): React.CSSProperties => {
  const map: Record<string, { bg: string; bd: string; fg: string }> = {
    primary: { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" },
    secondary: { bg: "#f8fafc", bd: "#e2e8f0", fg: "#475569" },
    success: { bg: "#f0fdf4", bd: "#bbf7d0", fg: "#166534" },
    info: { bg: "#eff6ff", bd: "#bfdbfe", fg: "#1d4ed8" },
    warning: { bg: "#fffbeb", bd: "#fde68a", fg: "#92400e" },
    danger: { bg: "#fff1f2", bd: "#fecdd3", fg: "#be123c" },
  };
  const t = map[tone];
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: t.bg,
    border: `1px solid ${t.bd}`,
    color: t.fg,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  };
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#64748b",
};

const displayStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 34,
  lineHeight: 1.06,
  fontWeight: 950,
  color: "#0f172a",
};

const bodyStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  lineHeight: 1.7,
  color: "#475569",
};

const smallStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.5,
  color: "#64748b",
};

const h2Style: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 950,
  color: "#0f172a",
  margin: 0,
};

const h3Style: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: "#0f172a",
  margin: 0,
};

const miniStatStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const miniStatLabel: React.CSSProperties = {
  fontSize: 13,
  color: "#64748b",
};

const checkRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: 10,
  alignItems: "center",
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#ffffff",
  fontWeight: 800,
  color: "#334155",
};

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsPageContent />
    </Suspense>
  );
}

function ReportsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const autoSelectedStudentRef = useRef<string>("");

  const [profile, setProfile] = useState<FamilyProfileRow>(DEFAULT_FAMILY_PROFILE);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  const [draftId, setDraftId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reportMode, setReportMode] = useState<ReportMode>("family-summary");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("term");
  const [presetKey, setPresetKey] = useState<PresetKey>("family-summary");
  const [preferredMarket, setPreferredMarket] = useState<PreferredMarket>("au");

  const [includeActionPlan, setIncludeActionPlan] = useState(true);
  const [includeWeeklyPlan, setIncludeWeeklyPlan] = useState(true);
  const [includeAppendix, setIncludeAppendix] = useState(true);
  const [includeReadinessNotes, setIncludeReadinessNotes] = useState(true);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([
    "Literacy",
    "Numeracy",
    "Science",
    "Humanities",
  ]);
  const [selectionMeta, setSelectionMeta] = useState<ReportSelectionMeta>({});
  const [notes, setNotes] = useState("");
  const [highlightEvidenceId, setHighlightEvidenceId] = useState("");

  useEffect(() => {
    setIsPremium(isPremiumActive());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        setLoading(true);
        setError("");

        const [familyProfile, dbStudentRows, evidenceRows] = await Promise.all([
          loadFamilyProfile(),
          loadStudents().catch(() => [] as StudentRow[]),
          loadEvidence(),
        ]);

        const requestedDraftId = safe(searchParams.get("draftId"));
        const requestedStudentId = safe(searchParams.get("studentId"));
        const existingDraft = requestedDraftId
          ? await loadReportDraftById(requestedDraftId)
          : null;

        if (!mounted) return;

        const seedStudents = buildSeedStudents();
        const mergedStudents = dbStudentRows.length > 0 ? dbStudentRows : seedStudents;

        const activeStoredStudent =
          typeof window !== "undefined"
            ? safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY))
            : "";

        const initialMarket =
          ((existingDraft?.preferred_market as PreferredMarket) ||
            safe(familyProfile?.preferred_market) ||
            "au") as PreferredMarket;

        setProfile(familyProfile);
        setStudents(mergedStudents);
        setEvidence(evidenceRows);

        const validRequestedStudent =
          requestedStudentId &&
          mergedStudents.some((student) => student.id === requestedStudentId)
            ? requestedStudentId
            : "";

        const validStoredStudent =
          activeStoredStudent &&
          mergedStudents.some((student) => student.id === activeStoredStudent)
            ? activeStoredStudent
            : "";

        const defaultStudentId =
          safe(existingDraft?.student_id) ||
          validRequestedStudent ||
          validStoredStudent ||
          safe(familyProfile?.default_child_id) ||
          safe(mergedStudents[0]?.id) ||
          "";

        setDraftId(existingDraft?.id || "");
        setSelectedStudentId(defaultStudentId);
        setReportMode(
          (existingDraft?.report_mode ||
            safe(familyProfile?.report_tone_default) ||
            "family-summary") as ReportMode
        );
        setPeriodMode((existingDraft?.period_mode || "term") as PeriodMode);
        setPresetKey(
          existingDraft
            ? detectPreset(existingDraft.report_mode, existingDraft.period_mode)
            : "family-summary"
        );
        setPreferredMarket(initialMarket);
        setIncludeActionPlan(existingDraft?.include_action_plan ?? true);
        setIncludeWeeklyPlan(existingDraft?.include_weekly_plan ?? true);
        setIncludeAppendix(existingDraft?.include_appendix ?? true);
        setIncludeReadinessNotes(
          existingDraft?.include_readiness_notes ??
            Boolean((familyProfile as any)?.show_authority_guidance)
        );
        setSelectedAreas(
          existingDraft?.selected_areas?.length
            ? existingDraft.selected_areas
            : ["Literacy", "Numeracy", "Science", "Humanities"]
        );
        setSelectionMeta(existingDraft?.selection_meta || {});
        setNotes(existingDraft?.notes || "");

        if (typeof window !== "undefined") {
          const storedHighlight = safe(
            window.localStorage.getItem(REPORTS_HIGHLIGHT_EVIDENCE_KEY)
          );
          const queryHighlight = safe(searchParams.get("highlightEvidenceId"));
          const nextHighlight = queryHighlight || storedHighlight || "";
          setHighlightEvidenceId(nextHighlight);

          if (storedHighlight) {
            window.localStorage.removeItem(REPORTS_HIGHLIGHT_EVIDENCE_KEY);
          }
        }

        if (!existingDraft && validStoredStudent) {
          const found =
            mergedStudents.find((student) => student.id === validStoredStudent) || null;
          setMessage(
            `${firstNameOf(found)} is already selected. Next step: choose evidence and save a first draft.`
          );
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(String(err?.message || err || "Failed to load reports builder."));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!safe(selectedStudentId)) return;
    try {
      window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, selectedStudentId);
    } catch {}
  }, [selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const studentEvidence = useMemo(() => {
    const rows = evidence.filter((row) => safe(row.student_id) === selectedStudentId);
    if (!rows.length) return [];
    if (!selectedAreas.length) return rows;

    return rows.filter((row) => {
      const area = guessArea(row.learning_area);
      return selectedAreas.includes(area) || area === "Other";
    });
  }, [evidence, selectedStudentId, selectedAreas]);

  const highlightedEvidence = useMemo(() => {
    if (!highlightEvidenceId) return null;
    return studentEvidence.find((row) => row.id === highlightEvidenceId) || null;
  }, [studentEvidence, highlightEvidenceId]);

  const selectedEvidenceIds = useMemo(
    () => buildSelectedEvidenceIds(selectionMeta),
    [selectionMeta]
  );

  const selectedEvidenceRows = useMemo(() => {
    const selected = new Set(selectedEvidenceIds);
    return studentEvidence.filter((row) => selected.has(row.id));
  }, [studentEvidence, selectedEvidenceIds]);

  const selectedCoreCount = useMemo(
    () =>
      selectedEvidenceIds.filter((id) => selectionMeta[id]?.role !== "appendix")
        .length,
    [selectedEvidenceIds, selectionMeta]
  );

  const selectedAppendixCount = useMemo(
    () =>
      selectedEvidenceIds.filter((id) => selectionMeta[id]?.role === "appendix")
        .length,
    [selectedEvidenceIds, selectionMeta]
  );

  const evidenceCoverageCount = useMemo(() => {
    const set = new Set(
      studentEvidence
        .map((row) => guessArea(row.learning_area))
        .filter((x) => x !== "Other")
    );
    return set.size;
  }, [studentEvidence]);

  const readinessScore = useMemo(() => {
    let score = 25;
    if (selectedStudentId) score += 15;
    if (selectedAreas.length >= 4) score += 15;
    if (selectedEvidenceIds.length >= 4) score += 22;
    else if (selectedEvidenceIds.length >= 2) score += 14;
    else if (selectedEvidenceIds.length >= 1) score += 8;
    if (selectedCoreCount >= 2) score += 6;
    if (includeAppendix && selectedAppendixCount >= 1) score += 4;
    if (includeReadinessNotes) score += 5;
    if (notes.trim().length >= 20) score += 6;
    if (reportMode === "authority-ready") score += 2;
    return Math.min(score, 100);
  }, [
    selectedStudentId,
    selectedAreas.length,
    selectedEvidenceIds.length,
    selectedCoreCount,
    selectedAppendixCount,
    includeAppendix,
    includeReadinessNotes,
    notes,
    reportMode,
  ]);

  const readiness = useMemo(
    () => interpretReadiness(readinessScore),
    [readinessScore]
  );

  const areaStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const lastSeen: Record<string, string> = {};

    AREA_OPTIONS.forEach((area) => {
      counts[area] = 0;
      lastSeen[area] = "";
    });

    studentEvidence.forEach((row) => {
      const area = guessArea(row.learning_area);
      if (!AREA_OPTIONS.includes(area)) return;

      counts[area] = (counts[area] || 0) + 1;

      const rowDate = safe(row.occurred_on || row.created_at);
      if (!lastSeen[area] || rowDate > lastSeen[area]) {
        lastSeen[area] = rowDate;
      }
    });

    return AREA_OPTIONS.map((area) => {
      const count = counts[area] || 0;
      const status = getCoverageStatus(count);
      return {
        area,
        count,
        status,
        statusLabel: coverageStatusLabel(status),
        lastSeen: lastSeen[area],
      };
    });
  }, [studentEvidence]);

  const interpretation = useMemo(() => {
    const strongAreas = areaStats.filter((x) => x.status === "strong").map((x) => x.area);
    const developingAreas = areaStats
      .filter((x) => x.status === "developing")
      .map((x) => x.area);
    const weakAreas = areaStats.filter((x) => x.status === "attention").map((x) => x.area);

    let text = "";

    if (!selectedStudentId) {
      text =
        "Choose a child first so EduDecks can interpret evidence coverage and build a meaningful report position.";
    } else if (!studentEvidence.length) {
      text =
        "There is not enough evidence in the current child and area filter to interpret this report yet. Add evidence or widen the selected areas first.";
    } else if (strongAreas.length) {
      text = `You have built strong evidence in ${joinNatural(strongAreas)}.`;
      if (developingAreas.length) {
        text += ` ${joinNatural(
          developingAreas.slice(0, 2)
        )} is emerging but would benefit from a little more recent evidence.`;
      }
      if (weakAreas.length) {
        text += ` ${joinNatural(
          weakAreas.slice(0, 2)
        )} still need more evidence to make the report feel balanced.`;
      }
    } else if (developingAreas.length) {
      text = `You have early evidence in ${joinNatural(
        developingAreas.slice(0, 3)
      )}, but the report still needs stronger anchors before it will feel settled.`;
      if (weakAreas.length) {
        text += ` ${joinNatural(weakAreas.slice(0, 2))} remain the clearest gaps.`;
      }
    } else {
      text =
        "The report still lacks strong evidence anchors. Start by selecting a few clearer evidence items and broadening the area mix slightly.";
    }

    const strongestFocus =
      strongAreas[0] || developingAreas[0] || selectedAreas[0] || "Literacy";
    const weakestFocus =
      weakAreas[0] || developingAreas[1] || weakAreas[1] || "";

    return {
      strongAreas,
      developingAreas,
      weakAreas,
      strongestFocus,
      weakestFocus,
      text,
    };
  }, [areaStats, selectedStudentId, studentEvidence.length, selectedAreas]);

  const nextBestMove = useMemo(() => {
    if (!selectedStudentId) return "Choose a child to start the report object.";
    if (studentEvidence.length === 0) {
      return "No evidence is available for this child and area filter yet. Add evidence or widen the area filter first.";
    }
    if (selectedEvidenceIds.length < 3) {
      return "Use Auto-select top evidence or choose a few strong pieces so the draft has enough substance to review.";
    }
    if (selectedCoreCount < 2) {
      return "Mark at least two selected items as core so the main report has clear anchors.";
    }
    if (selectedAreas.length < 4) {
      return "Broaden the area mix slightly so the report feels balanced rather than narrow.";
    }
    if (!notes.trim()) {
      return "Add a short family note so the output reads more human and intentional.";
    }
    if (!draftId) {
      return "Save the draft now. The next step after saving is reviewing the output before exporting or opening the authority pack.";
    }
    return "Open output to review the saved draft, then export it or open the authority pack if you need the formal version.";
  }, [
    draftId,
    selectedStudentId,
    studentEvidence.length,
    selectedEvidenceIds.length,
    selectedCoreCount,
    selectedAreas.length,
    notes,
  ]);

  const saveConfidenceText = useMemo(() => {
    if (readinessScore >= 85) {
      return "You are ready to save this draft. After saving, review the output before exporting or opening the authority pack.";
    }
    if (readinessScore >= 65) {
      return "You are close to ready. One or two small improvements will make the saved draft feel much stronger.";
    }
    return "This draft can still be saved now, but it will feel more trustworthy once evidence and balance improve.";
  }, [readinessScore]);

  const builderStage = useMemo(
    () => buildBuilderStage(selectedStudentId, selectedEvidenceIds.length, draftId),
    [draftId, selectedEvidenceIds.length, selectedStudentId]
  );

  const builderValueSignal = useMemo(
    () => buildBuilderValueSignal(readinessScore, draftId, selectedEvidenceIds.length),
    [draftId, readinessScore, selectedEvidenceIds.length]
  );

  const beginnerReportAreas = useMemo(() => {
    if (selectedAreas.length > 0) return selectedAreas.slice(0, 4);

    return Array.from(
      new Set(
        studentEvidence
          .slice(0, 8)
          .map((row) => guessArea(row.learning_area))
          .filter((area) => area && area !== "Other")
      )
    ).slice(0, 4);
  }, [selectedAreas, studentEvidence]);

  const beginnerReadiness = useMemo(() => {
    if (!selectedStudentId) {
      return {
        tone: "warning" as ReadinessTone,
        label: "Choose a child to begin",
        body: "Pick your child first so EduDecks can gather the right learning moments into a simple report.",
        actionLabel: "Choose child below",
        actionHref: "#advanced-reporting-tools",
      };
    }

    if (studentEvidence.length === 0) {
      return {
        tone: "warning" as ReadinessTone,
        label: "Capture one learning moment first",
        body: `There is not enough captured learning for ${firstNameOf(
          selectedStudent
        )} yet. One small learning moment is enough to start a real report.`,
        actionLabel: "Go to Capture",
        actionHref: "/capture",
      };
    }

    if (studentEvidence.length === 1) {
      return {
        tone: "info" as ReadinessTone,
        label: "You can start now, but one more moment would help",
        body: `You already have enough to try a simple first draft for ${firstNameOf(
          selectedStudent
        )}. Adding one more captured moment would make it feel stronger.`,
        actionLabel: "Build my basic report",
        actionHref: "",
      };
    }

    if (draftId) {
      return {
        tone: "success" as ReadinessTone,
        label: "You already have enough to build a clear basic report",
        body: `A saved draft already exists for ${firstNameOf(
          selectedStudent
        )}. You can keep refining it, review the output, or move the strongest parts into portfolio.`,
        actionLabel: "Build my basic report",
        actionHref: "",
      };
    }

    return {
      tone: "success" as ReadinessTone,
      label: "You're ready to build your first report",
      body: `You already have enough captured learning to create a simple first draft for ${firstNameOf(
        selectedStudent
      )}.`,
      actionLabel: "Build my basic report",
      actionHref: "",
    };
  }, [draftId, selectedStudent, selectedStudentId, studentEvidence.length]);

  const beginnerOverview = useMemo(() => {
    if (!selectedStudentId) return "";

    if (notes.trim()) return notes.trim();

    const child = firstNameOf(selectedStudent);
    const areaText = beginnerReportAreas.length
      ? joinNatural(beginnerReportAreas.map((area) => area.toLowerCase()))
      : "recent learning";

    if (draftId) {
      return `${child} is showing steady progress across ${areaText}. This draft pulls recent learning into one calm, reusable summary you can keep improving.`;
    }

    if (selectedEvidenceIds.length > 0 || studentEvidence.length > 0) {
      return `${child} is building confidence through ${areaText}. This basic report brings those learning moments together into a clear first summary.`;
    }

    return `${child}'s captured learning will appear here as a simple first report once the first moments are added.`;
  }, [
    beginnerReportAreas,
    draftId,
    notes,
    selectedEvidenceIds.length,
    selectedStudent,
    selectedStudentId,
    studentEvidence.length,
  ]);

  const beginnerNextStep = useMemo(() => {
    if (draftId) {
      return "Keep the strongest parts of this report in portfolio so your child's learning story stays easy to revisit.";
    }

    if (studentEvidence.length === 0) {
      return "Capture one learning moment, then come back here to turn it into a simple first report.";
    }

    return "Build the basic report first, then keep the strongest parts in portfolio.";
  }, [draftId, studentEvidence.length]);

  const stepOneBadge = selectedStudent ? `Focused on ${firstNameOf(selectedStudent)}` : "Start here";
  const stepTwoBadge =
    selectedEvidenceIds.length > 0
      ? `${selectedEvidenceIds.length} moment${selectedEvidenceIds.length === 1 ? "" : "s"} selected`
      : "Choose the strongest moments";
  const stepThreeBadge = draftId ? "Draft saved" : builderStage.label;
  const stepFourBadge = `${readiness.label} • ${readinessScore}%`;

  useEffect(() => {
    if (!selectedStudentId) return;
    if (!studentEvidence.length) return;
    if (selectedEvidenceIds.length > 0) return;
    if (autoSelectedStudentRef.current === selectedStudentId) return;

    const autoMeta = buildAutoSelection(studentEvidence, 4);
    if (!Object.keys(autoMeta).length) return;

    setSelectionMeta(autoMeta);
    autoSelectedStudentRef.current = selectedStudentId;
    setMessage("Top evidence was selected automatically. Review it, then save the draft when it looks right.");
    setError("");
  }, [selectedStudentId, studentEvidence, selectedEvidenceIds.length]);

  function applyPreset(preset: (typeof PRESET_OPTIONS)[number]) {
    setPresetKey(preset.key);
    setReportMode(preset.mode);
    setPeriodMode(preset.period);
    setIncludeReadinessNotes(preset.mode === "authority-ready");
    setMessage(`Preset applied: ${preset.title}`);
  }

  function toggleArea(area: string) {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((x) => x !== area) : [...prev, area]
    );
  }

  function toggleEvidence(row: EvidenceRow) {
    setSelectionMeta((prev) => {
      const next = { ...prev };
      if (next[row.id]) {
        delete next[row.id];
      } else {
        next[row.id] = { role: "core", required: false };
      }
      return next;
    });
  }

  function setEvidenceRole(id: string, role: "core" | "appendix") {
    setSelectionMeta((prev) => ({
      ...prev,
      [id]: {
        role,
        required: prev[id]?.required ?? false,
      },
    }));
  }

  function toggleEvidenceRequired(id: string) {
    setSelectionMeta((prev) => ({
      ...prev,
      [id]: {
        role: prev[id]?.role || "core",
        required: !prev[id]?.required,
      },
    }));
  }

  function autoSelectTopEvidence() {
    const next = buildAutoSelection(studentEvidence, 4);
    if (!Object.keys(next).length) {
      setError("No evidence is available to auto-select.");
      return;
    }

    setSelectionMeta(next);
    autoSelectedStudentRef.current = selectedStudentId;
    setMessage("Top evidence has been selected. Next step: save the draft or open output when you are ready.");
    setError("");
  }

  function buildDraftTitle() {
    const child = studentName(selectedStudent);
    const mode = modeLabel(reportMode);
    const market = marketLabel(preferredMarket);
    return `${child} — ${mode} — ${market}`;
  }

  async function handleSave(openOutput = false) {
    if (!selectedStudent) {
      setError("Please choose a child before saving this report draft.");
      return;
    }

    const finalSelectedEvidenceIds = buildSelectedEvidenceIds(selectionMeta);

    if (reportMode === "authority-ready" && finalSelectedEvidenceIds.length === 0) {
      setError(
        "Authority-ready drafts need at least one selected evidence item before they can be saved."
      );
      return;
    }

    if (openOutput && finalSelectedEvidenceIds.length === 0) {
      setError(
        "Please select evidence before opening output so the report object is not empty."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const row = await saveReportDraft({
        id: draftId || undefined,
        student_id: selectedStudent.id,
        child_id: selectedStudent.id,
        child_name: studentName(selectedStudent),
        title: buildDraftTitle(),
        preferred_market: preferredMarket,
        report_mode: reportMode,
        period_mode: periodMode,
        include_action_plan: includeActionPlan,
        include_weekly_plan: includeWeeklyPlan,
        include_appendix: includeAppendix,
        include_readiness_notes: includeReadinessNotes,
        selected_areas: selectedAreas,
        selected_evidence_ids: finalSelectedEvidenceIds,
        selection_meta: selectionMeta,
        notes,
        status: "draft",
      });

      setDraftId(row.id);
      setMessage("Saved");

      if (openOutput) {
        router.push(`/reports/output?draftId=${row.id}`);
      } else {
        router.replace(`/reports?draftId=${row.id}`);
      }
    } catch (err: any) {
      setError("Not saved yet");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickBuild() {
    if (!selectedStudentId) {
      setError(
        "Choose a child first, then Quick Build can select evidence automatically."
      );
      return;
    }

    if (studentEvidence.length === 0) {
      setError(
        "There is no evidence available for this child and current area filter."
      );
      return;
    }

    const next = Object.keys(selectionMeta).length
      ? selectionMeta
      : buildAutoSelection(studentEvidence, 4);

    if (!Object.keys(next).length) {
      setError("Quick Build could not find evidence to include.");
      return;
    }

    if (!Object.keys(selectionMeta).length) {
      setSelectionMeta(next);
    }

    const finalSelectedEvidenceIds = buildSelectedEvidenceIds(next);

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const row = await saveReportDraft({
        id: draftId || undefined,
        student_id: selectedStudentId,
        child_id: selectedStudentId,
        child_name: studentName(selectedStudent),
        title: buildDraftTitle(),
        preferred_market: preferredMarket,
        report_mode: reportMode,
        period_mode: periodMode,
        include_action_plan: includeActionPlan,
        include_weekly_plan: includeWeeklyPlan,
        include_appendix: includeAppendix,
        include_readiness_notes: includeReadinessNotes,
        selected_areas: selectedAreas,
        selected_evidence_ids: finalSelectedEvidenceIds,
        selection_meta: next,
        notes,
        status: "draft",
      });

      setDraftId(row.id);
      router.push(`/reports/output?draftId=${row.id}`);
    } catch (err: any) {
      setError(String(err?.message || err || "Quick Build failed."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={innerStyle}>
          <div style={cardStyle}>Loading reports builder…</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={stickyStyle}>
        <div style={topBarStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/family" style={{ color: "#0f172a", fontWeight: 900, textDecoration: "none" }}>
              EduDecks Family
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <span style={{ color: "#0f172a", fontWeight: 900 }}>Reports</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              flexDirection: isMobile ? "column" : "row",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <Link
              href="/reports/library"
              style={{ ...buttonStyle(false), width: isMobile ? "100%" : undefined }}
            >
              Saved drafts
            </Link>
          </div>
        </div>
      </div>

      <div style={innerStyle}>
        {!isPremium && studentEvidence.length >= 2 ? (
          <section
            style={{
              ...cardStyle,
              marginBottom: 18,
              padding: 14,
              background: "#f8fbff",
              borderColor: "#dbeafe",
            }}
          >
            <UpgradeHint
              title="You're building a strong learning record"
              description="Want more flexibility as you grow?"
              ctaLabel="Unlock more control"
              ctaHref="/upgrade"
              variant="subtle"
            />
          </section>
        ) : null}

        {highlightedEvidence ? (
          <section
            style={{
              ...cardStyle,
              marginBottom: 18,
              border: "1px solid #bfdbfe",
              background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
            }}
          >
            <div style={labelStyle}>Fresh evidence ready to use</div>
            <div style={h2Style}>Your latest learning moment is already available in reporting</div>
            <div style={{ ...bodyStyle, maxWidth: 900 }}>
              <strong>{safe(highlightedEvidence.title) || "New learning moment"}</strong>
              {safe(highlightedEvidence.learning_area)
                ? ` in ${guessArea(highlightedEvidence.learning_area)}`
                : ""}
              {" "}has flowed straight into the report builder so you can move from capture into a draft without losing momentum.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <span style={pillStyle("success")}>Freshly captured</span>
              <span style={pillStyle("secondary")}>{guessArea(highlightedEvidence.learning_area)}</span>
              <span style={pillStyle("info")}>
                {shortDate(highlightedEvidence.occurred_on || highlightedEvidence.created_at)}
              </span>
            </div>

            <div style={{ ...softCardStyle, marginTop: 14 }}>
              <div style={smallStyle}>
                {clip(evidenceText(highlightedEvidence), 220) ||
                  "This newly captured item is ready to support the next saved report draft."}
              </div>
            </div>
          </section>
        ) : null}

        <section style={{ ...cardStyle, marginBottom: 18, borderColor: "#bfdbfe", background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
              gap: 24,
            }}
          >
            <div>
              <div style={labelStyle}>Beginner mode</div>
              <div style={displayStyle}>
                Turn captured learning into a calm, clear report
              </div>
              <div style={bodyStyle}>
                Start with a simple summary built from your child's learning moments. You can add more detail later.
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <span style={pillStyle(beginnerReadiness.tone)}>{beginnerReadiness.label}</span>
                <span style={pillStyle("secondary")}>{builderStage.stepLabel}</span>
                <span style={pillStyle("primary")}>{marketLabel(preferredMarket)}</span>
                {selectedStudent ? (
                  <span style={pillStyle("secondary")}>Child: {firstNameOf(selectedStudent)}</span>
                ) : null}
              </div>

              <div style={{ ...smallStyle, marginTop: 10 }}>{beginnerReadiness.body}</div>
              <div style={{ ...smallStyle, marginTop: 8 }}>
                <strong>Why this matters:</strong> A basic report gives you something real to keep, review, and strengthen without needing to learn the deeper reporting tools first.
              </div>
              <div style={{ ...smallStyle, marginTop: 6 }}>{beginnerNextStep}</div>

              <div style={{ height: 18 }} />

              <div
                style={{
                  ...cardStyle,
                  padding: 14,
                  background:
                    readiness.tone === "success"
                      ? "#f0fdf4"
                      : readiness.tone === "info"
                      ? "#eff6ff"
                      : readiness.tone === "warning"
                      ? "#fffbeb"
                      : "#fff1f2",
                  borderColor:
                    readiness.tone === "success"
                      ? "#bbf7d0"
                      : readiness.tone === "info"
                      ? "#bfdbfe"
                      : readiness.tone === "warning"
                      ? "#fde68a"
                      : "#fecdd3",
                }}
              >
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={pillStyle(readiness.tone)}>{readiness.label}</span>
                  <strong style={{ color: "#0f172a", fontSize: 15 }}>
                    Beginner readiness: {readinessScore}%
                  </strong>
                </div>
                <div style={bodyStyle}>{beginnerReadiness.body}</div>
                <div style={{ ...smallStyle, fontWeight: 800 }}>
                  {studentEvidence.length === 0
                    ? "Capture first, then come back here to build the report."
                    : "You do not need to manage the advanced settings first. Start with the simple report path."}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                {studentEvidence.length === 0 ? (
                  <Link
                    href="/capture"
                    style={{ ...buttonStyle(true), width: isMobile ? "100%" : undefined, justifyContent: "center" }}
                  >
                    Capture a learning moment
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleQuickBuild}
                    style={{ ...buttonStyle(true), width: isMobile ? "100%" : undefined }}
                    data-journey-intent="reports_quick_build"
                  >
                    {saving ? "Building…" : "Build my basic report"}
                  </button>
                )}

                {draftId ? (
                  <Link
                    href={`/reports/output?draftId=${draftId}`}
                    style={{ ...buttonStyle(false), width: isMobile ? "100%" : undefined, justifyContent: "center" }}
                  >
                    Review current draft
                  </Link>
                ) : null}

                <Link
                  href="/portfolio"
                  style={{ ...buttonStyle(false), width: isMobile ? "100%" : undefined, justifyContent: "center" }}
                >
                  Open Portfolio
                </Link>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={labelStyle}>Basic report preview</div>
              <div style={h2Style}>{selectedStudent ? studentName(selectedStudent) : "Your child's first report"}</div>
              <div style={{ ...bodyStyle, marginBottom: 12 }}>{beginnerOverview || "Choose a child and capture a few learning moments to see the first report preview take shape."}</div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Overview</span>
                  <strong>{draftId ? "Saved draft ready" : "Basic draft path ready"}</strong>
                </div>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Key strength</span>
                  <strong>{interpretation.strongestFocus || "Still emerging"}</strong>
                </div>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Next step</span>
                  <strong>{interpretation.weakestFocus || "Keep building steadily"}</strong>
                </div>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Areas touched</span>
                  <strong>{beginnerReportAreas.length ? joinNatural(beginnerReportAreas) : "Add evidence first"}</strong>
                </div>
              </div>

              <div style={{ ...softCardStyle, marginTop: 14 }}>
                <div style={labelStyle}>Portfolio next</div>
                <div style={smallStyle}>
                  After the report is built, keep the strongest parts in portfolio so your child's learning story stays easy to revisit.
                </div>
              </div>

              {!isPremium && (draftId || selectedEvidenceIds.length > 0) ? (
                <div style={{ marginTop: 14 }}>
                  <UpgradeHint
                    title="Want to build full reports anytime?"
                    description="Access your report library and generate reports whenever you need."
                    ctaLabel="Unlock Reports"
                    ctaHref="/upgrade"
                    variant="subtle"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {message ? (
          <div style={{ ...cardStyle, marginBottom: 18, borderColor: "#bbf7d0", background: "#f0fdf4" }}>
            <div style={smallStyle}>{message}</div>
          </div>
        ) : null}

        {error ? (
          <div style={{ ...cardStyle, marginBottom: 18, borderColor: "#fecdd3", background: "#fff1f2" }}>
            <div style={smallStyle}>{error}</div>
          </div>
        ) : null}

        <section
          id="advanced-reporting-tools"
          style={{
            ...cardStyle,
            marginBottom: 18,
            borderStyle: "dashed",
            background: "#f8fafc",
          }}
        >
          <div style={labelStyle}>Refine later</div>
          <div style={h2Style}>Advanced reporting tools</div>
          <div style={smallStyle}>
            The controls below are still available when you want deeper drafting, evidence curation, and report settings. Beginner mode above is the simpler free path.
          </div>
        </section>

        <div style={{ display: "grid", gap: 18, marginBottom: 18 }}>
          <FlowStep
            step={1}
            title="Choose who the report is for"
            description="Select your learner"
            helperText="Start with the child you want to build a report for."
            badge={stepOneBadge}
          >
            <section id="report-step-settings" style={cardStyle}>
              <div style={smallStyle}>
                Begin with one learner, then choose the report mode and period that fit what you want to explain.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
                <div style={softCardStyle}>
                  <div style={labelStyle}>Learner</div>
                  <div style={h3Style}>{selectedStudent ? studentName(selectedStudent) : "Choose a learner"}</div>
                </div>
                <div style={softCardStyle}>
                  <div style={labelStyle}>Mode</div>
                  <div style={h3Style}>{modeLabel(reportMode)}</div>
                </div>
                <div style={softCardStyle}>
                  <div style={labelStyle}>Period</div>
                  <div style={h3Style}>{periodLabel(periodMode)}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <button type="button" onClick={() => document.getElementById("report-step-settings")?.scrollIntoView({ behavior: "smooth", block: "start" })} style={buttonStyle(true)}>
                  Open learner and report settings
                </button>
              </div>
            </section>
          </FlowStep>

          <FlowStep
            step={2}
            title="Gather the right learning"
            description="Choose the moments that matter"
            helperText="Use your strongest recent learning moments to build a report that feels clear and trustworthy."
            badge={stepTwoBadge}
          >
            <section style={cardStyle}>
              <div style={smallStyle}>
                Strong learning moments give the report its shape. You can select them yourself or let EduDecks give you a strong first pass.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 12, marginTop: 14 }}>
                <div style={softCardStyle}>
                  <div style={labelStyle}>Evidence selected</div>
                  <div style={h3Style}>{selectedEvidenceIds.length}</div>
                </div>
                <div style={softCardStyle}>
                  <div style={labelStyle}>Core anchors</div>
                  <div style={h3Style}>{selectedCoreCount}</div>
                </div>
                <div style={softCardStyle}>
                  <div style={labelStyle}>Areas in view</div>
                  <div style={h3Style}>{selectedAreas.length}</div>
                </div>
                <div style={softCardStyle}>
                  <div style={labelStyle}>Coverage balance</div>
                  <div style={h3Style}>
                    {interpretation.weakAreas.length === 0
                      ? "Balanced"
                      : interpretation.weakAreas.length <= 2
                      ? "Mostly balanced"
                      : "Still building"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <button type="button" onClick={() => document.getElementById("report-step-evidence")?.scrollIntoView({ behavior: "smooth", block: "start" })} style={buttonStyle(true)}>
                  Choose evidence
                </button>
                <button type="button" onClick={autoSelectTopEvidence} style={buttonStyle(false)}>
                  Auto-select a strong first pass
                </button>
              </div>
            </section>
          </FlowStep>

          <FlowStep
            step={3}
            title="Build the report draft"
            description="Create a clear first version"
            helperText="EduDecks brings your selected learning together into a draft you can review and improve."
            badge={stepThreeBadge}
          >
            <section id="report-step-evidence" style={cardStyle}>
              <div style={bodyStyle}>{builderValueSignal.valueText}</div>
              <div style={{ ...smallStyle, marginTop: 8 }}>{builderValueSignal.conversionText}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => void handleSave(false)}
                  style={buttonStyle(false)}
                  data-journey-intent={builderValueSignal.primaryIntent}
                >
                  {saving ? "Savingâ€¦" : "Save draft"}
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("report-step-draft")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  style={buttonStyle(true)}
                >
                  Review draft controls
                </button>
              </div>
            </section>
          </FlowStep>

          <FlowStep
            step={4}
            title="See how close you are"
            description="Move toward Report Ready"
            helperText="A stronger mix of learning moments makes your report easier to build and easier to share."
            badge={stepFourBadge}
          >
            <section id="report-step-readiness" style={cardStyle}>
              <div style={bodyStyle}>{readiness.message}</div>
              <div style={{ ...smallStyle, marginTop: 8 }}>{readiness.action}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => void handleSave(true)}
                  style={buttonStyle(true)}
                  data-journey-intent={builderValueSignal.secondaryIntent}
                >
                  {saving ? "Buildingâ€¦" : "Open output"}
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("report-step-readiness")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  style={buttonStyle(false)}
                >
                  See readiness details
                </button>
              </div>
            </section>
          </FlowStep>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
            gap: 18,
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <section id="report-step-draft" style={cardStyle}>
              <div style={h2Style}>Preset and report settings</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                  marginTop: 16,
                }}
              >
                {PRESET_OPTIONS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    style={{
                      ...cardStyle,
                      padding: 14,
                      textAlign: "left",
                      cursor: "pointer",
                      borderColor: presetKey === preset.key ? "#2563eb" : "#e5e7eb",
                      boxShadow:
                        presetKey === preset.key
                          ? "0 0 0 2px rgba(37,99,235,0.08)"
                          : "0 10px 30px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div style={h3Style}>{preset.title}</div>
                    <div style={smallStyle}>{preset.description}</div>
                  </button>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(4, minmax(0, 1fr))",
                  gap: 12,
                  marginTop: 18,
                }}
              >
                <div>
                  <div style={labelStyle}>Child</div>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      autoSelectedStudentRef.current = "";
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, e.target.value);
                      }
                    }}
                    style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid #d1d5db", padding: "10px 12px" }}
                  >
                    <option value="">Select child…</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {studentName(student)}
                        {student.year_level != null
                          ? ` — Year ${student.year_level}`
                          : safe(student.yearLabel)
                          ? ` — ${safe(student.yearLabel)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={labelStyle}>Market</div>
                  <select
                    value={preferredMarket}
                    onChange={(e) => setPreferredMarket(e.target.value as PreferredMarket)}
                    style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid #d1d5db", padding: "10px 12px" }}
                  >
                    <option value="au">Australia</option>
                    <option value="uk">United Kingdom</option>
                    <option value="us">United States</option>
                  </select>
                </div>

                <div>
                  <div style={labelStyle}>Mode</div>
                  <select
                    value={reportMode}
                    onChange={(e) => {
                      const nextMode = e.target.value as ReportMode;
                      setReportMode(nextMode);
                      setPresetKey(detectPreset(nextMode, periodMode));
                    }}
                    style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid #d1d5db", padding: "10px 12px" }}
                  >
                    <option value="family-summary">Family summary</option>
                    <option value="authority-ready">Authority ready</option>
                    <option value="progress-review">Progress review</option>
                  </select>
                </div>

                <div>
                  <div style={labelStyle}>Period</div>
                  <select
                    value={periodMode}
                    onChange={(e) => {
                      const nextPeriod = e.target.value as PeriodMode;
                      setPeriodMode(nextPeriod);
                      setPresetKey(detectPreset(reportMode, nextPeriod));
                    }}
                    style={{ width: "100%", minHeight: 44, borderRadius: 12, border: "1px solid #d1d5db", padding: "10px 12px" }}
                  >
                    <option value="term">Term</option>
                    <option value="semester">Semester</option>
                    <option value="year">Year</option>
                    <option value="all">All time</option>
                  </select>
                </div>
              </div>

              <div style={{ height: 14 }} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(4, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <label style={checkRowStyle}>
                  <input
                    type="checkbox"
                    checked={includeActionPlan}
                    onChange={(e) => setIncludeActionPlan(e.target.checked)}
                  />
                  <span>Include action plan</span>
                </label>

                <label style={checkRowStyle}>
                  <input
                    type="checkbox"
                    checked={includeWeeklyPlan}
                    onChange={(e) => setIncludeWeeklyPlan(e.target.checked)}
                  />
                  <span>Include weekly plan</span>
                </label>

                <label style={checkRowStyle}>
                  <input
                    type="checkbox"
                    checked={includeAppendix}
                    onChange={(e) => setIncludeAppendix(e.target.checked)}
                  />
                  <span>Include appendix</span>
                </label>

                <label style={checkRowStyle}>
                  <input
                    type="checkbox"
                    checked={includeReadinessNotes}
                    onChange={(e) => setIncludeReadinessNotes(e.target.checked)}
                  />
                  <span>Include readiness notes</span>
                </label>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={h2Style}>Coverage snapshot</div>
              <div style={smallStyle}>
                Choose the learning areas this saved report object should speak for.
              </div>

              <div style={{ height: 14 }} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {AREA_OPTIONS.map((area) => {
                  const active = selectedAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      style={{
                        ...buttonStyle(active),
                        background: active ? "#2563eb" : "#ffffff",
                        color: active ? "#ffffff" : "#1f2937",
                      }}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>

              <div style={{ height: 14 }} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(4, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {areaStats
                  .filter((item) => selectedAreas.includes(item.area))
                  .map((item) => (
                    <div
                      key={item.area}
                      style={{
                        ...softCardStyle,
                        border:
                          item.status === "strong"
                            ? "1px solid #bbf7d0"
                            : item.status === "developing"
                            ? "1px solid #bfdbfe"
                            : "1px solid #fde68a",
                        background:
                          item.status === "strong"
                            ? "#f0fdf4"
                            : item.status === "developing"
                            ? "#eff6ff"
                            : "#fffbeb",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div style={h3Style}>{item.area}</div>
                        <span style={pillStyle(coverageTone(item.status))}>{item.statusLabel}</span>
                      </div>
                      <div style={smallStyle}>
                        {item.count} evidence item{item.count === 1 ? "" : "s"}
                        {item.lastSeen ? ` · last seen ${shortDate(item.lastSeen)}` : " · no evidence yet"}
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <section style={cardStyle}>
              <div style={h2Style}>What this report currently shows</div>
              <div style={bodyStyle}>{interpretation.text}</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                  gap: 12,
                  marginTop: 14,
                }}
              >
                <div style={softCardStyle}>
                  <div style={labelStyle}>Strongest current focus</div>
                  <div style={h3Style}>{interpretation.strongestFocus || "—"}</div>
                </div>

                <div style={softCardStyle}>
                  <div style={labelStyle}>Weakest current area</div>
                  <div style={h3Style}>{interpretation.weakestFocus || "No major gap yet"}</div>
                </div>

                <div style={softCardStyle}>
                  <div style={labelStyle}>Coverage balance</div>
                  <div style={h3Style}>
                    {interpretation.weakAreas.length === 0
                      ? "Balanced"
                      : interpretation.weakAreas.length <= 2
                      ? "Mostly balanced"
                      : "Unbalanced"}
                  </div>
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={h2Style}>Curate evidence</div>
                  <div style={smallStyle}>
                    Strong evidence is now the centre of the report flow. You can select manually, or let the system choose a strong first pass for you.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={autoSelectTopEvidence} style={buttonStyle(false)}>
                    Auto-select top evidence
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickBuild}
                    style={{
                      ...buttonStyle(false),
                      borderColor: "#bfdbfe",
                      background: "#eff6ff",
                      color: "#2563eb",
                    }}
                  >
                    Quick Build Report
                  </button>
                </div>
              </div>

              <div style={{ height: 14 }} />

              {selectedStudentId ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {studentEvidence.length === 0 ? (
                    <div style={softCardStyle}>
                      <div style={smallStyle}>
                        No evidence was found for the current child and area filter.
                      </div>
                    </div>
                  ) : (
                    studentEvidence.slice(0, 40).map((row) => {
                      const chosen = Boolean(selectionMeta[row.id]);
                      const meta = selectionMeta[row.id];
                      const score = evidenceScore(row);
                      const highlighted = highlightEvidenceId === row.id;

                      return (
                        <div
                          key={row.id}
                          style={{
                            ...softCardStyle,
                            border: highlighted
                              ? "2px solid #2563eb"
                              : chosen
                              ? "1px solid #bfdbfe"
                              : "1px solid #e5e7eb",
                            background: highlighted
                              ? "#eef6ff"
                              : chosen
                              ? "#eff6ff"
                              : "#f8fafc",
                            boxShadow: highlighted
                              ? "0 0 0 3px rgba(37,99,235,0.08)"
                              : undefined,
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: isMobile
                                ? "auto 1fr"
                                : "auto 1fr auto auto",
                              gap: 12,
                              alignItems: "start",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={chosen}
                              onChange={() => toggleEvidence(row)}
                              style={{ marginTop: 4 }}
                            />

                            <div style={{ minWidth: 0 }}>
                              <div style={h3Style}>{safe(row.title) || "Untitled evidence"}</div>
                              <div style={smallStyle}>
                                {guessArea(row.learning_area)} • {shortDate(row.occurred_on || row.created_at)}
                              </div>
                              <div style={{ ...bodyStyle, marginTop: 8 }}>
                                {clip(evidenceText(row), 220) || "No written summary yet."}
                              </div>
                            </div>

                            {!isMobile ? (
                              <span style={pillStyle(scoreTone(score))}>Strength {score}</span>
                            ) : null}

                            <div
                              style={{
                                display: "grid",
                                gap: 8,
                                gridColumn: isMobile ? "1 / -1" : undefined,
                              }}
                            >
                              {isMobile ? (
                                <span style={pillStyle(scoreTone(score))}>Strength {score}</span>
                              ) : null}
                              {chosen ? (
                                <>
                                  <select
                                    value={meta?.role || "core"}
                                    onChange={(e) =>
                                      setEvidenceRole(row.id, e.target.value as "core" | "appendix")
                                    }
                                    style={{
                                      minHeight: 36,
                                      borderRadius: 10,
                                      border: "1px solid #d1d5db",
                                      padding: "8px 10px",
                                      fontWeight: 800,
                                    }}
                                  >
                                    <option value="core">Core</option>
                                    <option value="appendix">Appendix</option>
                                  </select>

                                  <label style={{ ...smallStyle, display: "flex", gap: 8, alignItems: "center" }}>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(meta?.required)}
                                      onChange={() => toggleEvidenceRequired(row.id)}
                                    />
                                    Required
                                  </label>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div style={softCardStyle}>
                  <div style={smallStyle}>Choose a child to begin selecting evidence.</div>
                </div>
              )}
            </section>
          </div>

          <aside style={{ display: "grid", gap: 18 }}>
            <section style={cardStyle}>
              <div style={h2Style}>Draft readiness</div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Child selected</span>
                  <strong>{selectedStudentId ? "Yes" : "No"}</strong>
                </div>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Evidence selected</span>
                  <strong>{selectedEvidenceIds.length}</strong>
                </div>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Core anchors</span>
                  <strong>{selectedCoreCount}</strong>
                </div>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Appendix items</span>
                  <strong>{selectedAppendixCount}</strong>
                </div>
              </div>

              <div style={{ ...softCardStyle, marginTop: 14 }}>
                <div style={labelStyle}>Save guidance</div>
                <div style={smallStyle}>{saveConfidenceText}</div>
                <div style={{ ...smallStyle, marginTop: 8 }}>
                  A saved draft gives you a clearer next step, a reusable report base, and a calmer review flow.
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={h2Style}>Parent note</div>
              <div style={{ ...smallStyle, marginTop: 8 }}>
                Add a short note so the saved report object feels more human and intentional.
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                style={{
                  width: "100%",
                  marginTop: 12,
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  padding: "12px 14px",
                  fontSize: 14,
                  lineHeight: 1.6,
                  resize: "vertical",
                }}
                placeholder="Write a short summary of what feels most important in this report..."
              />
            </section>

            <section style={cardStyle}>
              <div style={h2Style}>Next best move</div>
              <div style={bodyStyle}>{nextBestMove}</div>
              <div style={{ ...smallStyle, marginTop: 8 }}>
                The goal here is not perfection in one sitting. It is getting to a report you can trust and return to.
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => void handleSave(false)}
                  style={buttonStyle(false)}
                  data-journey-intent={builderValueSignal.primaryIntent}
                >
                  {saving ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave(true)}
                  style={buttonStyle(true)}
                  data-journey-intent={builderValueSignal.secondaryIntent}
                >
                  {saving ? "Building…" : "Open output"}
                </button>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={h2Style}>Saved object reference</div>
              <div style={{ ...softCardStyle, marginTop: 12 }}>
                <div style={labelStyle}>Draft ID</div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: 13,
                    color: "#334155",
                    wordBreak: "break-word",
                  }}
                >
                  {draftId || "Not saved yet"}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
