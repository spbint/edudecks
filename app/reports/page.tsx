"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  DEFAULT_FAMILY_PROFILE,
  loadFamilyProfile,
  type FamilyProfile,
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
import { familyStyles as S } from "@/lib/theme/familyStyles";

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

type StageOption = {
  id: string;
  label: string;
};

type FrameworkOption = {
  id: string;
  label: string;
  description: string;
  stageLabel: string;
  stages: StageOption[];
};

type FrameworkFamily = {
  id: string;
  label: string;
  description: string;
  options: FrameworkOption[];
};

type MarketConfig = {
  market: PreferredMarket;
  label: string;
  familyLabel: string;
  frameworkLabel: string;
  stageLabel: string;
  families: FrameworkFamily[];
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

function safe(v: any) {
  return String(v ?? "").trim();
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
  if (!student) return "Selected child";
  const first = safe(student.preferred_name || student.first_name);
  const last = safe(student.surname || student.family_name || student.last_name);
  const combined = `${first} ${last}`.trim();
  return combined || "Selected child";
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
  return safe(row.summary || row.body || row.note);
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

function makeYearStages(prefix: string, start: number, end: number): StageOption[] {
  const items: StageOption[] = [];
  for (let year = start; year <= end; year += 1) {
    items.push({ id: `${prefix}-${year}`, label: `Year ${year}` });
  }
  return items;
}

function makeGradeStages(prefix: string, labels: string[]): StageOption[] {
  return labels.map((label) => ({
    id: `${prefix}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label,
  }));
}

const AU_YEAR_STAGES = [
  { id: "au-foundation", label: "Foundation" },
  ...makeYearStages("au-year", 1, 10),
];

const UK_KEY_STAGES = [
  { id: "uk-eyfs", label: "EYFS" },
  { id: "uk-ks1", label: "Key Stage 1" },
  { id: "uk-ks2", label: "Key Stage 2" },
  { id: "uk-ks3", label: "Key Stage 3" },
  { id: "uk-ks4", label: "Key Stage 4" },
];

const WALES_STAGES = [
  { id: "wales-ps1", label: "Progression Step 1" },
  { id: "wales-ps2", label: "Progression Step 2" },
  { id: "wales-ps3", label: "Progression Step 3" },
  { id: "wales-ps4", label: "Progression Step 4" },
  { id: "wales-ps5", label: "Progression Step 5" },
];

const SCOTLAND_STAGES = [
  { id: "scotland-early", label: "Early Level" },
  { id: "scotland-first", label: "First Level" },
  { id: "scotland-second", label: "Second Level" },
  { id: "scotland-third", label: "Third Level" },
  { id: "scotland-fourth", label: "Fourth Level" },
];

const NI_STAGES = [
  { id: "ni-foundation", label: "Foundation Stage" },
  { id: "ni-ks1", label: "Key Stage 1" },
  { id: "ni-ks2", label: "Key Stage 2" },
  { id: "ni-ks3", label: "Key Stage 3" },
  { id: "ni-ks4", label: "Key Stage 4" },
];

const US_COMMON_CORE_STAGES = [
  { id: "us-k", label: "Kindergarten" },
  ...makeGradeStages("us-grade", [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
  ]),
  { id: "us-hs", label: "High School Band" },
];

const US_STATE_STAGES = [
  { id: "us-state-k", label: "Kindergarten" },
  ...makeGradeStages("us-state-grade", [
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
  ]),
];

const FLEXIBLE_STAGES = [
  { id: "flex-early-years", label: "Early Years" },
  { id: "flex-lower-primary", label: "Lower Primary" },
  { id: "flex-upper-primary", label: "Upper Primary" },
  { id: "flex-lower-secondary", label: "Lower Secondary" },
  { id: "flex-upper-secondary", label: "Upper Secondary" },
];

const MARKET_CONFIGS: Record<PreferredMarket, MarketConfig> = {
  au: {
    market: "au",
    label: "Australia",
    familyLabel: "Framework family",
    frameworkLabel: "Specific framework",
    stageLabel: "Year level / band",
    families: [
      {
        id: "au-national",
        label: "Australian national pathways",
        description:
          "National curriculum-aligned reporting lenses commonly used across Australia.",
        options: [
          {
            id: "acara-v9",
            label: "Australian Curriculum v9",
            description:
              "General Australian Curriculum-aligned reporting using national achievement pathways.",
            stageLabel: "Year level",
            stages: AU_YEAR_STAGES,
          },
          {
            id: "acara-general-coverage",
            label: "Australian homeschool general coverage",
            description:
              "A lighter Australian homeschool reporting lens focused on balanced evidence and coverage.",
            stageLabel: "Year level",
            stages: AU_YEAR_STAGES,
          },
        ],
      },
      {
        id: "au-state",
        label: "State / territory authority lenses",
        description:
          "Authority-aware pathways for Australian homeschool and reporting contexts.",
        options: [
          {
            id: "nsw-homeschool",
            label: "New South Wales homeschool lens",
            description:
              "A draft posture shaped for NESA-style Australian homeschool reporting expectations.",
            stageLabel: "Year level",
            stages: AU_YEAR_STAGES,
          },
          {
            id: "vic-curriculum",
            label: "Victoria curriculum lens",
            description:
              "A Victorian-aligned reporting view for F–10 style evidence grouping.",
            stageLabel: "Year level",
            stages: AU_YEAR_STAGES,
          },
          {
            id: "qld-homeschool",
            label: "Queensland homeschool lens",
            description:
              "A Queensland-oriented family reporting view with broad curriculum coverage framing.",
            stageLabel: "Year level",
            stages: AU_YEAR_STAGES,
          },
          {
            id: "sa-homeschool",
            label: "South Australia homeschool lens",
            description:
              "A South Australian reporting pathway for family evidence and coverage balance.",
            stageLabel: "Year level",
            stages: AU_YEAR_STAGES,
          },
          {
            id: "tas-homeschool",
            label: "Tasmania homeschool lens",
            description:
              "A Tasmanian reporting pathway for evidence-backed family learning summaries.",
            stageLabel: "Year level",
            stages: AU_YEAR_STAGES,
          },
          {
            id: "wa-homeschool",
            label: "Western Australia homeschool lens",
            description:
              "A Western Australian reporting pathway with evidence, balance, and review structure.",
            stageLabel: "Year level",
            stages: AU_YEAR_STAGES,
          },
        ],
      },
      {
        id: "au-flexible",
        label: "Alternative / flexible pathways",
        description:
          "Useful when families want broad reporting categories without a narrow government lens.",
        options: [
          {
            id: "classical-au",
            label: "Classical education lens",
            description:
              "A broad classical reporting structure for families blending traditional disciplines and portfolio evidence.",
            stageLabel: "Phase",
            stages: FLEXIBLE_STAGES,
          },
          {
            id: "charlotte-mason-au",
            label: "Charlotte Mason-inspired lens",
            description:
              "A gentle, rich, narrative-friendly pathway for families using living books and habit-based learning.",
            stageLabel: "Phase",
            stages: FLEXIBLE_STAGES,
          },
          {
            id: "custom-au",
            label: "Custom flexible framework",
            description:
              "A neutral EduDecks reporting pathway for families who want freedom over strict curriculum mapping.",
            stageLabel: "Phase",
            stages: FLEXIBLE_STAGES,
          },
        ],
      },
    ],
  },
  uk: {
    market: "uk",
    label: "United Kingdom",
    familyLabel: "Framework family",
    frameworkLabel: "Specific framework",
    stageLabel: "Key stage / phase",
    families: [
      {
        id: "uk-national",
        label: "UK national pathways",
        description:
          "National and devolved curriculum pathways across the United Kingdom.",
        options: [
          {
            id: "england-national-curriculum",
            label: "England National Curriculum",
            description:
              "A Key Stage-based reporting lens aligned to England’s National Curriculum structure.",
            stageLabel: "Key stage",
            stages: UK_KEY_STAGES,
          },
          {
            id: "wales-curriculum",
            label: "Curriculum for Wales",
            description:
              "A Wales-aligned pathway using progression steps rather than older key-stage framing.",
            stageLabel: "Progression step",
            stages: WALES_STAGES,
          },
          {
            id: "scotland-cfe",
            label: "Curriculum for Excellence (Scotland)",
            description:
              "A Scottish pathway using Curriculum for Excellence levels and broader capability development.",
            stageLabel: "Level",
            stages: SCOTLAND_STAGES,
          },
          {
            id: "northern-ireland-curriculum",
            label: "Northern Ireland Curriculum",
            description:
              "A Northern Ireland pathway using foundation and key-stage reporting phases.",
            stageLabel: "Key stage",
            stages: NI_STAGES,
          },
        ],
      },
      {
        id: "uk-flexible",
        label: "Alternative / flexible pathways",
        description:
          "Useful for UK families wanting broad, readable portfolio and review outputs.",
        options: [
          {
            id: "uk-home-ed-general",
            label: "UK home education general coverage",
            description:
              "A broad home-education pathway focused on balanced coverage and representative evidence.",
            stageLabel: "Phase",
            stages: FLEXIBLE_STAGES,
          },
          {
            id: "classical-uk",
            label: "Classical education lens",
            description:
              "A classical structure for families using traditional knowledge-rich disciplines and narrative summaries.",
            stageLabel: "Phase",
            stages: FLEXIBLE_STAGES,
          },
          {
            id: "custom-uk",
            label: "Custom flexible framework",
            description:
              "A neutral EduDecks framework for UK families using personalised pathways.",
            stageLabel: "Phase",
            stages: FLEXIBLE_STAGES,
          },
        ],
      },
    ],
  },
  us: {
    market: "us",
    label: "United States",
    familyLabel: "Framework family",
    frameworkLabel: "Specific framework",
    stageLabel: "Grade / band",
    families: [
      {
        id: "us-national",
        label: "US national pathways",
        description:
          "National and multi-state reporting pathways for broad US homeschool and school alignment.",
        options: [
          {
            id: "common-core",
            label: "Common Core",
            description:
              "A Common Core-aligned reporting pathway for English language arts and mathematics coverage.",
            stageLabel: "Grade / band",
            stages: US_COMMON_CORE_STAGES,
          },
          {
            id: "us-general-coverage",
            label: "General US homeschool coverage",
            description:
              "A broad US-friendly pathway focused on evidence balance and family reporting clarity.",
            stageLabel: "Grade / band",
            stages: US_STATE_STAGES,
          },
        ],
      },
      {
        id: "us-state",
        label: "State standards pathways",
        description:
          "Major state-level pathways for families wanting a closer curriculum reference.",
        options: [
          {
            id: "california-standards",
            label: "California standards lens",
            description:
              "A California-oriented reporting pathway for evidence and grade-level framing.",
            stageLabel: "Grade level",
            stages: US_STATE_STAGES,
          },
          {
            id: "texas-teks",
            label: "Texas TEKS lens",
            description:
              "A Texas pathway shaped around TEKS-style grade expectations and structured evidence.",
            stageLabel: "Grade level",
            stages: US_STATE_STAGES,
          },
          {
            id: "florida-best",
            label: "Florida B.E.S.T. lens",
            description:
              "A Florida pathway for evidence-backed reporting aligned to B.E.S.T.-style expectations.",
            stageLabel: "Grade level",
            stages: US_STATE_STAGES,
          },
          {
            id: "new-york-next-gen",
            label: "New York Next Generation lens",
            description:
              "A New York pathway for grade-level reporting with balanced evidence grouping.",
            stageLabel: "Grade level",
            stages: US_STATE_STAGES,
          },
        ],
      },
      {
        id: "us-flexible",
        label: "Alternative / flexible pathways",
        description:
          "Useful for portfolio-heavy US families and personalised homeschool approaches.",
        options: [
          {
            id: "classical-us",
            label: "Classical education lens",
            description:
              "A classical reporting structure for families using traditional disciplines and narrative evidence.",
            stageLabel: "Phase",
            stages: FLEXIBLE_STAGES,
          },
          {
            id: "charlotte-mason-us",
            label: "Charlotte Mason-inspired lens",
            description:
              "A gentle narrative-friendly pathway for living-book and habit-led homeschool documentation.",
            stageLabel: "Phase",
            stages: FLEXIBLE_STAGES,
          },
          {
            id: "custom-us",
            label: "Custom flexible framework",
            description:
              "A neutral EduDecks pathway for US families using customised or mixed curricula.",
            stageLabel: "Phase",
            stages: FLEXIBLE_STAGES,
          },
        ],
      },
    ],
  },
};

function getMarketConfig(market: PreferredMarket): MarketConfig {
  return MARKET_CONFIGS[market] || MARKET_CONFIGS.au;
}

function getFamilyById(config: MarketConfig, familyId: string) {
  return config.families.find((family) => family.id === familyId) || null;
}

function getFirstFamily(config: MarketConfig) {
  return config.families[0] || null;
}

function getFrameworkById(config: MarketConfig, frameworkId: string) {
  for (const family of config.families) {
    const found = family.options.find((option) => option.id === frameworkId);
    if (found) return found;
  }
  return null;
}

function getFamilyForFramework(config: MarketConfig, frameworkId: string) {
  return (
    config.families.find((family) =>
      family.options.some((option) => option.id === frameworkId)
    ) || null
  );
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

function joinNatural(items: string[]) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function buildSeedStudents(): StudentRow[] {
  if (typeof window === "undefined") return [];
  const raw = parseJson<any[]>(window.localStorage.getItem(CHILDREN_KEY), []);
  return raw.map((child, index) => ({
    id: safe(child?.id) || `seed-child-${index + 1}`,
    preferred_name: safe(child?.name) || `Child ${index + 1}`,
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
      return (res.data || []) as StudentRow[];
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
      return ((res.data || []) as EvidenceRow[]).filter((x) => !x.is_deleted);
    }

    lastErr = res.error;
    if (!isMissingRelationOrColumn(res.error)) break;
  }

  if (lastErr) throw lastErr;
  return [];
}

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoSelectedStudentRef = useRef<string>("");

  const [profile, setProfile] = useState<FamilyProfile>(DEFAULT_FAMILY_PROFILE);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [draftId, setDraftId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reportMode, setReportMode] = useState<ReportMode>("family-summary");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("term");
  const [presetKey, setPresetKey] = useState<PresetKey>("family-summary");
  const [preferredMarket, setPreferredMarket] =
    useState<PreferredMarket>("au");

  const [selectedFrameworkFamilyId, setSelectedFrameworkFamilyId] =
    useState("");
  const [selectedFrameworkId, setSelectedFrameworkId] = useState("");
  const [selectedStageId, setSelectedStageId] = useState("");

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

  const marketConfig = useMemo(
    () => getMarketConfig(preferredMarket),
    [preferredMarket]
  );

  const activeFamily = useMemo(() => {
    return (
      getFamilyById(marketConfig, selectedFrameworkFamilyId) ||
      getFamilyForFramework(marketConfig, selectedFrameworkId) ||
      getFirstFamily(marketConfig)
    );
  }, [marketConfig, selectedFrameworkFamilyId, selectedFrameworkId]);

  const activeFramework = useMemo(() => {
    return (
      getFrameworkById(marketConfig, selectedFrameworkId) ||
      activeFamily?.options?.[0] ||
      null
    );
  }, [marketConfig, selectedFrameworkId, activeFamily]);

  const activeStage = useMemo(() => {
    if (!activeFramework) return null;
    return (
      activeFramework.stages.find((stage) => stage.id === selectedStageId) ||
      activeFramework.stages[0] ||
      null
    );
  }, [activeFramework, selectedStageId]);

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
        const mergedStudents =
          dbStudentRows.length > 0
            ? dbStudentRows
            : seedStudents;

        const activeStoredStudent =
          typeof window !== "undefined"
            ? safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY))
            : "";

        const initialMarket =
          (existingDraft?.preferred_market as PreferredMarket) ||
          familyProfile.preferred_market ||
          "au";

        const initialConfig = getMarketConfig(initialMarket);
        const initialFamily =
          getFamilyForFramework(
            initialConfig,
            safe(existingDraft?.framework_id || existingDraft?.framework_key)
          ) || getFirstFamily(initialConfig);
        const initialFramework =
          getFrameworkById(
            initialConfig,
            safe(existingDraft?.framework_id || existingDraft?.framework_key)
          ) ||
          initialFamily?.options?.[0] ||
          null;
        const initialStage =
          initialFramework?.stages?.find(
            (stage) =>
              stage.id === safe(existingDraft?.stage_id || existingDraft?.stage_key)
          ) ||
          initialFramework?.stages?.[0] ||
          null;

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
          existingDraft?.student_id ||
          validRequestedStudent ||
          validStoredStudent ||
          familyProfile.default_child_id ||
          mergedStudents[0]?.id ||
          "";

        setDraftId(existingDraft?.id || "");
        setSelectedStudentId(defaultStudentId);
        setReportMode(
          existingDraft?.report_mode || familyProfile.report_tone_default
        );
        setPeriodMode(existingDraft?.period_mode || "term");
        setPresetKey(
          existingDraft
            ? detectPreset(existingDraft.report_mode, existingDraft.period_mode)
            : "family-summary"
        );
        setPreferredMarket(initialMarket);
        setSelectedFrameworkFamilyId(initialFamily?.id || "");
        setSelectedFrameworkId(initialFramework?.id || "");
        setSelectedStageId(initialStage?.id || "");
        setIncludeActionPlan(existingDraft?.include_action_plan ?? true);
        setIncludeWeeklyPlan(existingDraft?.include_weekly_plan ?? true);
        setIncludeAppendix(existingDraft?.include_appendix ?? true);
        setIncludeReadinessNotes(
          existingDraft?.include_readiness_notes ??
            familyProfile.show_authority_guidance
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

        if (
          !existingDraft &&
          validStoredStudent &&
          firstNameOf(
            mergedStudents.find((student) => student.id === validStoredStudent) || null
          )
        ) {
          setMessage(
            `${firstNameOf(
              mergedStudents.find((student) => student.id === validStoredStudent) || null
            )} is already selected so you can move straight from capture into reporting.`
          );
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(
          String(err?.message || err || "Failed to load reports builder.")
        );
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
    const family =
      getFamilyById(marketConfig, selectedFrameworkFamilyId) ||
      getFirstFamily(marketConfig);

    if (!family) return;

    if (family.id !== selectedFrameworkFamilyId) {
      setSelectedFrameworkFamilyId(family.id);
      return;
    }

    const framework =
      family.options.find((option) => option.id === selectedFrameworkId) ||
      family.options[0];

    if (!framework) return;

    if (framework.id !== selectedFrameworkId) {
      setSelectedFrameworkId(framework.id);
      return;
    }

    const stage =
      framework.stages.find((item) => item.id === selectedStageId) ||
      framework.stages[0];

    if (!stage) return;

    if (stage.id !== selectedStageId) {
      setSelectedStageId(stage.id);
    }
  }, [
    marketConfig,
    selectedFrameworkFamilyId,
    selectedFrameworkId,
    selectedStageId,
  ]);

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
    const rows = evidence.filter(
      (row) => safe(row.student_id) === selectedStudentId
    );
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
    const strongAreas = areaStats
      .filter((x) => x.status === "strong")
      .map((x) => x.area);
    const developingAreas = areaStats
      .filter((x) => x.status === "developing")
      .map((x) => x.area);
    const weakAreas = areaStats
      .filter((x) => x.status === "attention")
      .map((x) => x.area);

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
        text += ` ${joinNatural(
          weakAreas.slice(0, 2)
        )} remain the clearest gaps.`;
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
      return "Use Auto-select top evidence or choose a few strong pieces so the report becomes evidence-backed.";
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
    return "Save the report draft, then open output to review the frozen report object.";
  }, [
    selectedStudentId,
    studentEvidence.length,
    selectedEvidenceIds.length,
    selectedCoreCount,
    selectedAreas.length,
    notes,
  ]);

  const saveConfidenceText = useMemo(() => {
    if (readinessScore >= 85) {
      return "You are ready to save this report draft. It has enough structure and evidence to become a stable output object.";
    }
    if (readinessScore >= 65) {
      return "You are close to ready. One or two small improvements will make this draft much stronger before saving.";
    }
    return "This draft can still be saved now, but it will feel more trustworthy once evidence and balance improve.";
  }, [readinessScore]);

  useEffect(() => {
    if (!selectedStudentId) return;
    if (!studentEvidence.length) return;
    if (selectedEvidenceIds.length > 0) return;
    if (autoSelectedStudentRef.current === selectedStudentId) return;

    const autoMeta = buildAutoSelection(studentEvidence, 4);
    if (!Object.keys(autoMeta).length) return;

    setSelectionMeta(autoMeta);
    autoSelectedStudentRef.current = selectedStudentId;
    setMessage("Top evidence was selected automatically for this child.");
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
    setMessage("Top evidence has been selected.");
    setError("");
  }

  function buildDraftTitle() {
    const child = studentName(selectedStudent);
    const mode = modeLabel(reportMode);
    const framework = activeFramework?.label || "Framework";
    const stage = activeStage?.label ? ` — ${activeStage.label}` : "";
    return `${child} — ${mode} — ${framework}${stage}`;
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
      setMessage(
        `Report draft saved with ${finalSelectedEvidenceIds.length} selected evidence item${
          finalSelectedEvidenceIds.length === 1 ? "" : "s"
        }. This draft is now a stable object for output and authority flows.`
      );

      if (openOutput) {
        router.push(`/reports/output?draftId=${row.id}`);
      } else {
        router.replace(`/reports?draftId=${row.id}`);
      }
    } catch (err: any) {
      setError(String(err?.message || err || "Save failed."));
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
      <main style={S.page()}>
        <div style={S.pageInner()}>
          <div style={S.card()}>Loading reports builder…</div>
        </div>
      </main>
    );
  }

  return (
    <main style={S.page()}>
      <div style={S.stickyTop()}>
        <div style={S.topBar()}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/family"
              style={{ ...S.mutedLink(), fontWeight: 900, color: "#0f172a" }}
            >
              EduDecks Family
            </Link>
            <span style={{ color: "#94a3b8" }}>/</span>
            <span style={{ ...S.mutedLink(), color: "#0f172a" }}>Reports</span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/reports/library" style={S.button(false)}>
              Library
            </Link>
            <button
              type="button"
              onClick={() => void handleSave(false)}
              style={S.button(false)}
            >
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={handleQuickBuild}
              style={{
                ...S.button(false),
                borderColor: "#bfdbfe",
                background: "#eff6ff",
                color: "#2563eb",
              }}
            >
              {saving ? "Building…" : "Quick Build Report"}
            </button>
            <button
              type="button"
              onClick={() => void handleSave(true)}
              style={S.button(true)}
            >
              {saving ? "Building…" : "Build report"}
            </button>
          </div>
        </div>
      </div>

      <div style={S.pageInner()}>
        {highlightedEvidence ? (
          <section
            style={{
              ...S.card(),
              marginBottom: 18,
              border: "1px solid #bfdbfe",
              background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
            }}
          >
            <div style={S.label()}>Fresh evidence ready to use</div>
            <div style={S.h2()}>
              Your latest learning moment is already available in reporting
            </div>
            <div style={{ ...S.body(), marginTop: 8, maxWidth: 900 }}>
              <strong>{safe(highlightedEvidence.title) || "New learning moment"}</strong>
              {safe(highlightedEvidence.learning_area)
                ? ` in ${guessArea(highlightedEvidence.learning_area)}`
                : ""}
              {" "}has flowed straight into the report builder so you can move from capture into a draft without losing momentum.
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 14,
              }}
            >
              <span style={S.pill("success")}>Freshly captured</span>
              <span style={S.pill("secondary")}>
                {guessArea(highlightedEvidence.learning_area)}
              </span>
              <span style={S.pill("info")}>
                {shortDate(highlightedEvidence.occurred_on || highlightedEvidence.created_at)}
              </span>
            </div>

            <div style={{ ...S.softCard(), marginTop: 14 }}>
              <div style={S.small()}>
                {clip(evidenceText(highlightedEvidence), 220) ||
                  "This newly captured item is ready to support the next saved report draft."}
              </div>
            </div>
          </section>
        ) : null}

        <section style={S.hero()}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.25fr) minmax(280px,0.9fr)",
              gap: 24,
            }}
          >
            <div>
              <div style={S.label()}>Guided report builder</div>
              <div style={S.display()}>
                Build once, save once, and use evidence-led drafts that feel calm
                and trustworthy
              </div>
              <div style={S.body()}>
                This builder creates a durable report draft object with saved
                child, market, mode, areas, selected evidence, and report notes.
                Quick Build can choose strong evidence automatically so the
                reporting flow feels faster and more guided.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <span style={S.pill("primary")}>
                  Market: {marketLabel(preferredMarket)}
                </span>
                <span style={S.pill("secondary")}>{modeLabel(reportMode)}</span>
                <span style={S.pill("info")}>{periodLabel(periodMode)}</span>
                {activeFramework ? (
                  <span style={S.pill("secondary")}>{activeFramework.label}</span>
                ) : null}
                {activeStage ? (
                  <span style={S.pill("info")}>{activeStage.label}</span>
                ) : null}
                {draftId ? (
                  <span style={S.pill("success")}>Saved draft active</span>
                ) : null}
                {selectedStudent ? (
                  <span style={S.pill("secondary")}>
                    Child: {firstNameOf(selectedStudent)}
                  </span>
                ) : null}
              </div>

              <div style={{ height: 18 }} />

              <div style={{ ...S.statCard(readiness.tone), display: "grid", gap: 8 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span style={S.pill(readiness.tone)}>{readiness.label}</span>
                  <strong style={{ color: "#0f172a", fontSize: 15 }}>
                    Report readiness: {readinessScore}%
                  </strong>
                </div>
                <div style={S.body()}>{readiness.message}</div>
                <div style={{ ...S.small(), fontWeight: 800 }}>
                  {readiness.action}
                </div>
              </div>
            </div>

            <div style={S.card()}>
              <div style={S.label()}>Selection readiness</div>
              <div style={S.h1()}>{readinessScore}%</div>
              <div style={{ ...S.body(), marginBottom: 12 }}>{readiness.label}</div>

              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "#e2e8f0",
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: `${readinessScore}%`,
                    height: "100%",
                    borderRadius: 999,
                    background:
                      readiness.tone === "success"
                        ? "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)"
                        : readiness.tone === "info"
                        ? "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)"
                        : readiness.tone === "warning"
                        ? "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)"
                        : "linear-gradient(90deg, #f87171 0%, #dc2626 100%)",
                    transition: "width 160ms ease",
                  }}
                />
              </div>

              <div style={S.small()}>{nextBestMove}</div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Areas selected</span>
                  <strong>{selectedAreas.length}</strong>
                </div>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Evidence chosen</span>
                  <strong>{selectedEvidenceIds.length}</strong>
                </div>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Core items</span>
                  <strong>{selectedCoreCount}</strong>
                </div>
                <div style={miniStatStyle}>
                  <span style={miniStatLabel}>Coverage seen</span>
                  <strong>{evidenceCoverageCount}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div style={{ ...S.statCard("success"), marginTop: 18 }}>
            <div style={S.small()}>{message}</div>
          </div>
        ) : null}

        {error ? (
          <div style={{ ...S.statCard("danger"), marginTop: 18 }}>
            <div style={S.small()}>{error}</div>
          </div>
        ) : null}

        <div style={{ height: 18 }} />

        <div style={S.splitMain()}>
          <div style={{ display: "grid", gap: 18 }}>
            <section style={S.card()}>
              <div style={S.h2()}>Preset and report settings</div>

              <div style={S.autoFitCards(220)}>
                {PRESET_OPTIONS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    style={{
                      ...S.statCard(preset.tone),
                      textAlign: "left",
                      cursor: "pointer",
                      border:
                        presetKey === preset.key
                          ? "1px solid #2563eb"
                          : undefined,
                      boxShadow:
                        presetKey === preset.key
                          ? "0 0 0 2px rgba(37,99,235,0.08)"
                          : undefined,
                    }}
                  >
                    <div style={S.h3()}>{preset.title}</div>
                    <div style={S.small()}>{preset.description}</div>
                  </button>
                ))}
              </div>

              <div style={{ height: 18 }} />

              <div style={S.autoFitCards(220)}>
                <div>
                  <div style={S.label()}>Child</div>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      autoSelectedStudentRef.current = "";
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, e.target.value);
                      }
                    }}
                    style={{ ...S.input(220), width: "100%" }}
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
                  <div style={S.label()}>Market</div>
                  <select
                    value={preferredMarket}
                    onChange={(e) =>
                      setPreferredMarket(e.target.value as PreferredMarket)
                    }
                    style={{ ...S.input(180), width: "100%" }}
                  >
                    <option value="au">Australia</option>
                    <option value="uk">United Kingdom</option>
                    <option value="us">United States</option>
                  </select>
                </div>

                <div>
                  <div style={S.label()}>{marketConfig.familyLabel}</div>
                  <select
                    value={selectedFrameworkFamilyId}
                    onChange={(e) => setSelectedFrameworkFamilyId(e.target.value)}
                    style={{ ...S.input(220), width: "100%" }}
                  >
                    {marketConfig.families.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={S.label()}>{marketConfig.frameworkLabel}</div>
                  <select
                    value={selectedFrameworkId}
                    onChange={(e) => setSelectedFrameworkId(e.target.value)}
                    style={{ ...S.input(220), width: "100%" }}
                  >
                    {(activeFamily?.options || []).map((framework) => (
                      <option key={framework.id} value={framework.id}>
                        {framework.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={S.label()}>
                    {activeFramework?.stageLabel || marketConfig.stageLabel}
                  </div>
                  <select
                    value={selectedStageId}
                    onChange={(e) => setSelectedStageId(e.target.value)}
                    style={{ ...S.input(180), width: "100%" }}
                  >
                    {(activeFramework?.stages || []).map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={S.label()}>Mode</div>
                  <select
                    value={reportMode}
                    onChange={(e) => {
                      const nextMode = e.target.value as ReportMode;
                      setReportMode(nextMode);
                      setPresetKey(detectPreset(nextMode, periodMode));
                    }}
                    style={{ ...S.input(180), width: "100%" }}
                  >
                    <option value="family-summary">Family summary</option>
                    <option value="authority-ready">Authority ready</option>
                    <option value="progress-review">Progress review</option>
                  </select>
                </div>

                <div>
                  <div style={S.label()}>Period</div>
                  <select
                    value={periodMode}
                    onChange={(e) => {
                      const nextPeriod = e.target.value as PeriodMode;
                      setPeriodMode(nextPeriod);
                      setPresetKey(detectPreset(reportMode, nextPeriod));
                    }}
                    style={{ ...S.input(180), width: "100%" }}
                  >
                    <option value="term">Term</option>
                    <option value="semester">Semester</option>
                    <option value="year">Year</option>
                    <option value="all">All time</option>
                  </select>
                </div>
              </div>

              <div style={{ height: 14 }} />

              <div style={S.softCard()}>
                <div style={S.h3()}>
                  {activeFramework?.label || "Framework pathway"}
                </div>
                <div style={{ ...S.small(), marginTop: 6 }}>
                  {activeFramework?.description ||
                    "Choose a market and framework pathway to shape the report lens more precisely."}
                </div>
                <div style={{ ...S.small(), marginTop: 10, fontWeight: 800 }}>
                  {activeFramework?.stageLabel || marketConfig.stageLabel}:{" "}
                  {activeStage?.label || "—"}
                </div>
              </div>

              <div style={{ height: 18 }} />

              <div style={S.autoFitCards(240)}>
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

            <section style={S.card()}>
              <div style={S.h2()}>Coverage snapshot</div>
              <div style={S.small()}>
                Choose the learning areas this saved report object should speak
                for.
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
                        ...S.button(active),
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

              <div style={S.autoFitCards(220)}>
                {areaStats
                  .filter((item) => selectedAreas.includes(item.area))
                  .map((item) => (
                    <div
                      key={item.area}
                      style={{
                        ...S.softCard(),
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
                        <div style={S.h3()}>{item.area}</div>
                        <span style={S.pill(coverageTone(item.status))}>
                          {item.statusLabel}
                        </span>
                      </div>
                      <div style={S.small()}>
                        {item.count} evidence item{item.count === 1 ? "" : "s"}
                        {item.lastSeen
                          ? ` · last seen ${shortDate(item.lastSeen)}`
                          : " · no evidence yet"}
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>What this report currently shows</div>
              <div style={S.body()}>{interpretation.text}</div>

              <div style={{ height: 14 }} />

              <div style={S.autoFitCards(220)}>
                <div style={S.softCard()}>
                  <div style={S.label()}>Strongest current focus</div>
                  <div style={S.h3()}>{interpretation.strongestFocus || "—"}</div>
                </div>

                <div style={S.softCard()}>
                  <div style={S.label()}>Weakest current area</div>
                  <div style={S.h3()}>
                    {interpretation.weakestFocus || "No major gap yet"}
                  </div>
                </div>

                <div style={S.softCard()}>
                  <div style={S.label()}>Coverage balance</div>
                  <div style={S.h3()}>
                    {interpretation.weakAreas.length === 0
                      ? "Balanced"
                      : interpretation.weakAreas.length <= 2
                      ? "Mostly balanced"
                      : "Unbalanced"}
                  </div>
                </div>
              </div>
            </section>

            <section style={S.card()}>
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
                  <div style={S.h2()}>Curate evidence</div>
                  <div style={S.small()}>
                    Strong evidence is now the centre of the report flow. You
                    can select manually, or let the system choose a strong first
                    pass for you.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={autoSelectTopEvidence}
                    style={S.button(false)}
                  >
                    Auto-select top evidence
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickBuild}
                    style={{
                      ...S.button(false),
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
                    <div style={S.softCard()}>
                      <div style={S.small()}>
                        No evidence was found for the current child and area
                        filter.
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
                            ...S.softCard(),
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
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              flexWrap: "wrap",
                              alignItems: "start",
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={S.h3()}>
                                {safe(row.title) || "Untitled evidence"}
                              </div>
                              <div style={S.small()}>
                                {guessArea(row.learning_area)} ·{" "}
                                {shortDate(row.occurred_on || row.created_at)}
                              </div>
                              <div style={{ ...S.body(), marginTop: 8 }}>
                                {clip(evidenceText(row), 180) ||
                                  "No written summary yet."}
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={S.pill(scoreTone(score))}>
                                Quality {score}
                              </span>
                              {hasMedia(row) ? (
                                <span style={S.pill("secondary")}>Media</span>
                              ) : null}
                              {highlighted ? (
                                <span style={S.pill("primary")}>Fresh capture</span>
                              ) : null}
                              {chosen ? (
                                <span style={S.pill("success")}>Selected</span>
                              ) : null}
                            </div>
                          </div>

                          <div style={{ height: 12 }} />

                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleEvidence(row)}
                              style={S.button(chosen)}
                            >
                              {chosen ? "Remove from report" : "Select for report"}
                            </button>

                            {chosen ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEvidenceRole(row.id, "core")}
                                  style={S.miniButton()}
                                >
                                  {meta?.role === "core" ? "Core ✓" : "Make core"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setEvidenceRole(row.id, "appendix")
                                  }
                                  style={S.miniButton()}
                                >
                                  {meta?.role === "appendix"
                                    ? "Appendix ✓"
                                    : "Move to appendix"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleEvidenceRequired(row.id)}
                                  style={S.miniButton()}
                                >
                                  {meta?.required
                                    ? "Required ✓"
                                    : "Mark required"}
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div style={S.softCard()}>
                  <div style={S.small()}>
                    Choose a child first, then the report object can be
                    populated with evidence.
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside style={{ display: "grid", gap: 18 }}>
            <section style={S.card()}>
              <div style={S.h2()}>Draft note</div>
              <div style={S.small()}>
                Add a short human note so the output reads calmly and
                intentionally.
              </div>
              <div style={{ height: 12 }} />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write a short summary of what this report should emphasise..."
                style={S.textarea()}
              />
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Current object summary</div>
              <div style={{ display: "grid", gap: 10 }}>
                <SummaryRow label="Child" value={studentName(selectedStudent)} />
                <SummaryRow label="Market" value={marketLabel(preferredMarket)} />
                <SummaryRow
                  label="Framework family"
                  value={activeFamily?.label || "—"}
                />
                <SummaryRow
                  label="Framework"
                  value={activeFramework?.label || "—"}
                />
                <SummaryRow
                  label={activeFramework?.stageLabel || marketConfig.stageLabel}
                  value={activeStage?.label || "—"}
                />
                <SummaryRow label="Mode" value={modeLabel(reportMode)} />
                <SummaryRow label="Period" value={periodLabel(periodMode)} />
                <SummaryRow
                  label="Selected"
                  value={`${selectedEvidenceIds.length} evidence item${
                    selectedEvidenceIds.length === 1 ? "" : "s"
                  }`}
                />
                <SummaryRow
                  label="Draft ID"
                  value={draftId || "Not saved yet"}
                  mono
                />
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Selected evidence snapshot</div>
              <div style={S.small()}>
                {selectedEvidenceIds.length
                  ? `${selectedEvidenceIds.length} items will be written into the saved draft object.`
                  : "No evidence selected yet — use Auto-select or Quick Build to move faster."}
              </div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gap: 10 }}>
                {selectedEvidenceRows.slice(0, 6).map((row) => (
                  <div key={row.id} style={S.softCard()}>
                    <div style={S.h3()}>
                      {safe(row.title) || "Untitled evidence"}
                    </div>
                    <div style={S.small()}>
                      {guessArea(row.learning_area)} ·{" "}
                      {selectionMeta[row.id]?.role || "core"}
                    </div>
                  </div>
                ))}

                {!selectedEvidenceRows.length ? (
                  <div style={S.softCard()}>
                    <div style={S.small()}>
                      No evidence selected yet. Click{" "}
                      <strong>Auto-select top evidence</strong> or{" "}
                      <strong>Quick Build Report</strong> to generate an
                      evidence-backed first draft.
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Save confidence</div>
              <div style={S.body()}>{saveConfidenceText}</div>

              <div style={{ height: 12 }} />

              <div style={{ ...S.statCard(readiness.tone), display: "grid", gap: 6 }}>
                <span style={S.pill(readiness.tone)}>{readiness.label}</span>
                <div style={S.small()}>{readiness.action}</div>
              </div>
            </section>

            <section style={S.card()}>
              <div style={S.h2()}>Next best move</div>
              <div style={S.body()}>{nextBestMove}</div>

              <div style={{ height: 14 }} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void handleSave(false)}
                  style={S.button(false)}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={handleQuickBuild}
                  style={{
                    ...S.button(false),
                    borderColor: "#bfdbfe",
                    background: "#eff6ff",
                    color: "#2563eb",
                  }}
                >
                  Quick Build
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave(true)}
                  style={S.button(true)}
                >
                  Open output
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
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
        gridTemplateColumns: "110px minmax(0,1fr)",
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
          fontFamily: mono
            ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
            : undefined,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

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
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 14px",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  background: "#f8fafc",
  fontSize: 14,
  color: "#1f2937",
};