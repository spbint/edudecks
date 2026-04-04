"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import useIsMobile from "@/app/components/useIsMobile";

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
  yearLabel?: string | null;
  created_at?: string | null;
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
  visibility?: string | null;
  is_deleted?: boolean | null;
  attachment_urls?: string[] | string | null;
  image_url?: string | null;
  photo_url?: string | null;
  file_url?: string | null;
  audio_url?: string | null;
  curriculum_country?: string | null;
  curriculum_framework?: string | null;
  curriculum_year?: string | null;
  curriculum_subject?: string | null;
  curriculum_strand?: string | null;
  curriculum_skill?: string | null;
  [k: string]: any;
};

type PortfolioStory = {
  headline: string;
  summary: string;
  strengths: string[];
  nextSteps: string[];
  areas: string[];
  confidenceText: string;
};

type NextMove = {
  title: string;
  text: string;
  href: string;
  cta: string;
};

type SampleTag =
  | "Best work"
  | "Progress shown"
  | "Creativity"
  | "Effort"
  | "Reflection"
  | "Milestone";

type TagMap = Record<string, SampleTag[]>;

type ShowcaseItem = {
  item: EvidenceRow;
  score: number;
  reason: string;
};

type ReadinessBand = "Getting started" | "Building" | "Ready to report";

type PortfolioBlockId =
  | "featured_showcase"
  | "learning_feed"
  | "portfolio_summary"
  | "strengths"
  | "next_steps"
  | "learning_balance"
  | "timeline"
  | "grouped_areas"
  | "media_shelf"
  | "milestones"
  | "premium_intelligence"
  | "premium_trends";

type PortfolioBlockConfig = {
  id: PortfolioBlockId;
  label: string;
  description: string;
  enabled: boolean;
  premium?: boolean;
};

type PortfolioLayout = {
  topFeature: "featured_showcase" | "learning_feed" | "portfolio_summary";
  blocks: PortfolioBlockConfig[];
};

/* ──────────────────────────────────────────────────────────────
   CONSTANTS
   ────────────────────────────────────────────────────────────── */

const SAMPLE_TAG_OPTIONS: SampleTag[] = [
  "Best work",
  "Progress shown",
  "Creativity",
  "Effort",
  "Reflection",
  "Milestone",
];

const PORTFOLIO_TAGS_KEY = "edudecks_portfolio_tags_v1";
const PORTFOLIO_LAYOUT_KEY = "edudecks_portfolio_layout_v2";
const PLAN_STORAGE_KEY = "edudecks_plan";
const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const CHILDREN_KEY = "edudecks_children_seed_v1";
const PORTFOLIO_HIGHLIGHT_EVIDENCE_KEY = "edudecks_portfolio_highlight_evidence_id";

/* ──────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
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

function daysSince(v: string | null | undefined) {
  const s = safe(v);
  if (!s) return 999;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return 999;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
}

function studentName(s: StudentRow | null | undefined) {
  if (!s) return "Your child";
  const first = safe(s.preferred_name || s.first_name);
  const last = safe(s.surname || s.family_name || s.last_name);
  const combined = `${first} ${last}`.trim();
  return combined || "Your child";
}

function firstNameOf(s: StudentRow | null | undefined) {
  return safe(s?.preferred_name || s?.first_name) || "your child";
}

function studentYearLabel(s: StudentRow | null | undefined) {
  if (!s) return "";
  if (s.year_level != null && safe(s.year_level)) return `Year ${safe(s.year_level)}`;
  if (safe(s.yearLabel)) return safe(s.yearLabel);
  return "";
}

function guessArea(raw: string | null | undefined) {
  const x = safe(raw).toLowerCase();

  if (x.includes("liter") || x.includes("reading") || x.includes("writing") || x.includes("english")) {
    return "Literacy";
  }
  if (x.includes("num") || x.includes("math")) return "Numeracy";
  if (x.includes("science")) return "Science";
  if (
    x.includes("history") ||
    x.includes("geography") ||
    x.includes("human") ||
    x.includes("hass") ||
    x.includes("social")
  ) {
    return "Humanities";
  }
  if (x.includes("art") || x.includes("music") || x.includes("drama") || x.includes("dance")) {
    return "The Arts";
  }
  if (
    x.includes("health") ||
    x.includes("pe") ||
    x.includes("physical") ||
    x.includes("wellbeing") ||
    x.includes("movement")
  ) {
    return "Health & Movement";
  }
  if (x.includes("tech") || x.includes("digital") || x.includes("design")) return "Technology";
  if (x.includes("language")) return "Languages";
  if (x.includes("faith") || x.includes("bible") || x.includes("values")) return "Faith / Values";
  if (x.includes("life")) return "Life Skills";

  return "Other";
}

function textOfEvidence(e: EvidenceRow) {
  return safe(e.summary || e.body || e.note);
}

function mediaLabel(e: EvidenceRow) {
  if (safe(e.photo_url || e.image_url)) return "Photo";
  if (safe(e.audio_url)) return "Audio";
  if (Array.isArray(e.attachment_urls) && e.attachment_urls.length > 0) return "Attachment";
  if (safe(e.attachment_urls)) return "Attachment";
  if (safe(e.file_url)) return "File";
  return "";
}

function hasVisualMedia(e: EvidenceRow) {
  return !!safe(e.photo_url || e.image_url);
}

function hasAudioMedia(e: EvidenceRow) {
  return !!safe(e.audio_url);
}

function hasAnyMedia(e: EvidenceRow) {
  return !!mediaLabel(e);
}

function evidenceThumb(e: EvidenceRow) {
  return safe(e.photo_url || e.image_url);
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("relation") || msg.includes("column"));
}

function getReadinessBand(evidenceCount: number, areaCount: number, recentCount: number): ReadinessBand {
  if (evidenceCount >= 4 && areaCount >= 2 && recentCount >= 1) return "Ready to report";
  if (evidenceCount >= 2) return "Building";
  return "Getting started";
}

function getPremiumFromStorage() {
  if (typeof window === "undefined") return false;
  return safe(localStorage.getItem(PLAN_STORAGE_KEY)).toLowerCase() === "premium";
}

function countCurriculumLinked(evidence: EvidenceRow[]) {
  return evidence.filter(
    (e) =>
      safe(e.curriculum_country) ||
      safe(e.curriculum_framework) ||
      safe(e.curriculum_year) ||
      safe(e.curriculum_subject) ||
      safe(e.curriculum_strand) ||
      safe(e.curriculum_skill)
  ).length;
}

function scoreShowcaseItem(e: EvidenceRow, tags: SampleTag[]) {
  const textLength = textOfEvidence(e).length;
  const dateAge = daysSince(e.occurred_on || e.created_at);
  const area = guessArea(e.learning_area);
  const media = hasAnyMedia(e) ? 10 : 0;
  const visualBonus = hasVisualMedia(e) ? 12 : 0;
  const tagBonus = tags.length * 6;
  const recency = dateAge <= 14 ? 18 : dateAge <= 30 ? 12 : dateAge <= 60 ? 6 : 0;
  const richness = Math.min(24, Math.floor(textLength / 12));
  const areaBonus = area !== "Other" ? 8 : 0;
  const curriculumBonus =
    safe(e.curriculum_country) ||
    safe(e.curriculum_framework) ||
    safe(e.curriculum_subject) ||
    safe(e.curriculum_skill)
      ? 10
      : 0;

  const score = media + visualBonus + tagBonus + recency + richness + areaBonus + curriculumBonus;

  let reason = "Useful representative example";
  if (tags.includes("Best work")) reason = "Strong showcase piece";
  else if (tags.includes("Progress shown")) reason = "Shows growth over time";
  else if (tags.includes("Milestone")) reason = "Marks an important milestone";
  else if (curriculumBonus > 0) reason = "Curriculum-linked evidence";
  else if (hasVisualMedia(e)) reason = "Visual highlight";
  else if (dateAge <= 14) reason = "Fresh recent learning moment";
  else if (hasAnyMedia(e)) reason = "Media-backed artifact";

  return { score, reason };
}

function buildPortfolioStory(args: {
  student: StudentRow | null;
  evidence: EvidenceRow[];
  readinessBand: ReadinessBand;
}) {
  const { student, evidence, readinessBand } = args;
  const name = studentName(student);
  const first = firstNameOf(student);

  const areas = Array.from(new Set(evidence.map((e) => guessArea(e.learning_area)).filter(Boolean)));
  const recent = evidence.filter((e) => daysSince(e.occurred_on || e.created_at) <= 30);
  const curriculumLinked = countCurriculumLinked(evidence);

  let summary = "";
  let confidenceText = "";

  if (evidence.length === 0) {
    summary = `This portfolio is ready to begin. Start by adding a few learning moments to build ${first}'s learning story over time.`;
    confidenceText = "Once you begin capturing learning, this portfolio will start turning separate moments into a stronger story.";
  } else if (evidence.length < 3) {
    summary = `${name}'s portfolio is beginning to take shape. The moments saved so far are starting to show progress, interests, and early evidence of growth.`;
    confidenceText = "This is a promising beginning. A little more depth will make the portfolio feel stronger and more representative.";
  } else if (areas.length <= 1) {
    summary = `${name}'s portfolio now shows a meaningful body of learning, but it is still concentrated in a narrow part of the learning story. Broadening the portfolio will increase confidence.`;
    confidenceText = "You have enough to work with here. The next lift is breadth across more than one learning area.";
  } else {
    summary = `${name}'s portfolio now shows a growing learning story built from the reflections and moments you’ve captured. It gives a meaningful picture of progress, interests, and development over time.`;
    confidenceText =
      readinessBand === "Ready to report"
        ? "This portfolio has the balance and depth to support confident reporting."
        : "This portfolio is building well and is beginning to feel representative.";
  }

  const strengths: string[] = [];
  if (areas.length > 0) strengths.push(`${first} has learning captured in ${areas.join(", ")}.`);
  if (recent.length >= 2) strengths.push("There are recent learning moments helping keep the portfolio current.");
  if (evidence.length >= 3) strengths.push("The portfolio now has enough depth to show more than isolated moments.");
  if (curriculumLinked > 0) {
    strengths.push(`${curriculumLinked} portfolio item${curriculumLinked === 1 ? "" : "s"} already link to curriculum refinement.`);
  }
  if (strengths.length === 0) strengths.push("This portfolio will become stronger as you add more reflections over time.");

  const nextSteps: string[] = [];
  if (evidence.length < 3) nextSteps.push("Add a few more learning moments to strengthen the portfolio.");
  if (areas.length <= 1 && evidence.length >= 2) nextSteps.push("Add learning from another domain to broaden the story.");
  if (recent.length === 0 && evidence.length > 0) nextSteps.push("Add a recent learning moment to keep the portfolio fresh.");
  if (curriculumLinked === 0 && evidence.length > 0) {
    nextSteps.push("When ready, refine one or two key items with curriculum links for stronger reporting evidence.");
  }
  if (nextSteps.length === 0) {
    nextSteps.push("Keep adding short reflections regularly to build confidence over time.");
    nextSteps.push("Continue curating strong representative pieces using showcase tags.");
  }

  return {
    headline: `${name} — Learning Portfolio`,
    summary,
    strengths,
    nextSteps,
    areas,
    confidenceText,
  };
}

function defaultPortfolioLayout(isPremium: boolean): PortfolioLayout {
  return {
    topFeature: "featured_showcase",
    blocks: [
      { id: "featured_showcase", label: "Featured showcase", description: "Large visual highlights and best representative pieces.", enabled: true },
      { id: "learning_feed", label: "Learning feed", description: "A scrollable stream of recent portfolio moments.", enabled: true },
      { id: "portfolio_summary", label: "Portfolio summary", description: "A concise summary of what the portfolio is saying so far.", enabled: true },
      { id: "strengths", label: "Strengths", description: "What is already strong in the portfolio.", enabled: true },
      { id: "next_steps", label: "Next steps", description: "Helpful next moves to strengthen the portfolio.", enabled: true },
      { id: "learning_balance", label: "Learning balance", description: "A quick visual sense of spread across learning areas.", enabled: true },
      { id: "timeline", label: "Timeline", description: "Recent learning moments shaping the story.", enabled: true },
      { id: "grouped_areas", label: "Grouped learning areas", description: "A grouped view of the evidence already captured.", enabled: true },
      { id: "media_shelf", label: "Media shelf", description: "Latest photos, audio, and files in the portfolio.", enabled: true },
      { id: "milestones", label: "Milestones", description: "Important moments tagged as milestones or best work.", enabled: true },
      {
        id: "premium_intelligence",
        label: "Portfolio intelligence",
        description: "Premium insights about representative evidence and curation.",
        enabled: isPremium,
        premium: true,
      },
      {
        id: "premium_trends",
        label: "Trend snapshot",
        description: "Premium mini-trends on momentum and domain activity.",
        enabled: false,
        premium: true,
      },
    ],
  };
}

function sanitizeLayout(layout: PortfolioLayout | null, isPremium: boolean): PortfolioLayout {
  const fallback = defaultPortfolioLayout(isPremium);
  if (!layout || !Array.isArray(layout.blocks)) return fallback;

  const mergedBlocks: PortfolioBlockConfig[] = [];

  fallback.blocks.forEach((baseBlock) => {
    const found = layout.blocks.find((b) => b.id === baseBlock.id);
    if (!found) {
      mergedBlocks.push(baseBlock);
      return;
    }

    const enabled = baseBlock.premium && !isPremium ? false : !!found.enabled;

    mergedBlocks.push({
      ...baseBlock,
      enabled,
    });
  });

  const validTopFeature =
    layout.topFeature === "learning_feed" ||
    layout.topFeature === "portfolio_summary" ||
    layout.topFeature === "featured_showcase"
      ? layout.topFeature
      : fallback.topFeature;

  return {
    topFeature: validTopFeature,
    blocks: mergedBlocks,
  };
}

function moveBlock(layout: PortfolioLayout, blockId: PortfolioBlockId, direction: "up" | "down") {
  const blocks = [...layout.blocks];
  const index = blocks.findIndex((b) => b.id === blockId);
  if (index === -1) return layout;

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= blocks.length) return layout;

  const tmp = blocks[index];
  blocks[index] = blocks[target];
  blocks[target] = tmp;

  return { ...layout, blocks };
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

/* ──────────────────────────────────────────────────────────────
   STYLES
   ────────────────────────────────────────────────────────────── */

const UI = {
  card: (): React.CSSProperties => ({
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  }),
  softCard: (): React.CSSProperties => ({
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
  }),
  label: (): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.05,
    textTransform: "uppercase",
    color: "#64748b",
  }),
  h2: (): React.CSSProperties => ({
    fontSize: 18,
    lineHeight: 1.25,
    fontWeight: 900,
    color: "#0f172a",
  }),
  body: (): React.CSSProperties => ({
    fontSize: 14,
    lineHeight: 1.65,
    color: "#475569",
  }),
  input: (): React.CSSProperties => ({
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    color: "#111827",
    background: "#ffffff",
    minWidth: 180,
    outline: "none",
  }),
  button: (primary = false): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 10,
    background: primary ? "#2563eb" : "#ffffff",
    border: `1px solid ${primary ? "#2563eb" : "#d1d5db"}`,
    color: primary ? "#ffffff" : "#1f2937",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    cursor: "pointer",
  }),
  chip: (tone: "blue" | "green" | "amber" | "slate" = "slate"): React.CSSProperties => {
    const map = {
      blue: { bg: "#eff6ff", bd: "#bfdbfe", fg: "#2563eb" },
      green: { bg: "#ecfdf5", bd: "#a7f3d0", fg: "#166534" },
      amber: { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" },
      slate: { bg: "#ffffff", bd: "#d1d5db", fg: "#475569" },
    };
    const t = map[tone];
    return {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      borderRadius: 999,
      background: t.bg,
      border: `1px solid ${t.bd}`,
      fontSize: 12,
      fontWeight: 800,
      color: t.fg,
    };
  },
};

/* ──────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────── */

export default function PortfolioPage() {
  return (
    <Suspense fallback={null}>
      <PortfolioPageContent />
    </Suspense>
  );
}

function PortfolioPageContent() {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const queryStudentId = safe(searchParams?.get("studentId"));
  const queryHighlightId = safe(searchParams?.get("highlightEvidenceId"));

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [allEvidence, setAllEvidence] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tagMap, setTagMap] = useState<TagMap>({});
  const [isPremium, setIsPremium] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [layout, setLayout] = useState<PortfolioLayout>(defaultPortfolioLayout(false));
  const [highlightEvidenceId, setHighlightEvidenceId] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const premium = getPremiumFromStorage();
        setIsPremium(premium);

        const studentQueries = [
          supabase
            .from("students")
            .select("id,preferred_name,first_name,surname,family_name,last_name,year_level,created_at")
            .order("created_at", { ascending: true }),
          supabase
            .from("students")
            .select("id,preferred_name,first_name,surname,family_name,year_level,created_at")
            .order("created_at", { ascending: true }),
          supabase
            .from("students")
            .select("id,preferred_name,first_name,surname,year_level,created_at")
            .order("created_at", { ascending: true }),
          supabase
            .from("students")
            .select("id,preferred_name,first_name,year_level,created_at")
            .order("created_at", { ascending: true }),
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

        const seedStudents = buildSeedStudents();
        const mergedStudents = loadedStudents.length > 0 ? loadedStudents : seedStudents;

        const evidenceQueries = [
          supabase
            .from("evidence_entries")
            .select(
              "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted,attachment_urls,image_url,photo_url,file_url,audio_url,curriculum_country,curriculum_framework,curriculum_year,curriculum_subject,curriculum_strand,curriculum_skill"
            )
            .eq("is_deleted", false)
            .order("occurred_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("evidence_entries")
            .select(
              "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted,attachment_urls,image_url,photo_url,file_url,audio_url"
            )
            .eq("is_deleted", false)
            .order("occurred_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("evidence_entries")
            .select(
              "id,student_id,class_id,title,summary,body,note,learning_area,evidence_type,occurred_on,created_at,visibility,is_deleted"
            )
            .eq("is_deleted", false)
            .order("occurred_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("evidence_entries")
            .select("id,student_id,class_id,title,summary,body,note,learning_area,occurred_on,created_at,is_deleted")
            .eq("is_deleted", false)
            .order("occurred_on", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false }),
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

        setStudents(mergedStudents);
        setAllEvidence(loadedEvidence);

        const storedActiveStudent =
          typeof window !== "undefined"
            ? safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY))
            : "";

        const validQueryStudent =
          queryStudentId && mergedStudents.some((s) => s.id === queryStudentId)
            ? queryStudentId
            : "";

        const validStoredStudent =
          storedActiveStudent && mergedStudents.some((s) => s.id === storedActiveStudent)
            ? storedActiveStudent
            : "";

        setSelectedStudentId(validQueryStudent || validStoredStudent || mergedStudents[0]?.id || "");

        if (typeof window !== "undefined") {
          try {
            const rawTags = localStorage.getItem(PORTFOLIO_TAGS_KEY);
            if (rawTags) setTagMap(JSON.parse(rawTags));
          } catch {}

          try {
            const rawLayout = localStorage.getItem(PORTFOLIO_LAYOUT_KEY);
            if (rawLayout) {
              const parsed = JSON.parse(rawLayout);
              setLayout(sanitizeLayout(parsed, premium));
            } else {
              setLayout(defaultPortfolioLayout(premium));
            }
          } catch {
            setLayout(defaultPortfolioLayout(premium));
          }

          const storedHighlight = safe(
            window.localStorage.getItem(PORTFOLIO_HIGHLIGHT_EVIDENCE_KEY)
          );
          const nextHighlight = queryHighlightId || storedHighlight || "";
          setHighlightEvidenceId(nextHighlight);

          if (storedHighlight) {
            window.localStorage.removeItem(PORTFOLIO_HIGHLIGHT_EVIDENCE_KEY);
          }
        } else {
          setLayout(defaultPortfolioLayout(premium));
        }
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [queryStudentId, queryHighlightId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PORTFOLIO_TAGS_KEY, JSON.stringify(tagMap));
    } catch {}
  }, [tagMap]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PORTFOLIO_LAYOUT_KEY, JSON.stringify(layout));
    } catch {}
  }, [layout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!safe(selectedStudentId)) return;
    try {
      localStorage.setItem(ACTIVE_STUDENT_ID_KEY, selectedStudentId);
    } catch {}
  }, [selectedStudentId]);

  const student = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0] || null,
    [students, selectedStudentId]
  );

  const evidence = useMemo(() => {
    if (!student) return [] as EvidenceRow[];
    return allEvidence.filter((e) => safe(e.student_id) === student.id);
  }, [allEvidence, student]);

  const highlightedEvidence = useMemo(() => {
    if (!highlightEvidenceId) return null;
    return evidence.find((item) => item.id === highlightEvidenceId) || null;
  }, [evidence, highlightEvidenceId]);

  const recentCount = useMemo(
    () => evidence.filter((e) => daysSince(e.occurred_on || e.created_at) <= 30).length,
    [evidence]
  );

  const groupedEvidence = useMemo(() => {
    const groups = new Map<string, EvidenceRow[]>();
    evidence.forEach((item) => {
      const key = guessArea(item.learning_area);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [evidence]);

  const readinessBand = useMemo<ReadinessBand>(() => {
    return getReadinessBand(evidence.length, groupedEvidence.length, recentCount);
  }, [evidence.length, groupedEvidence.length, recentCount]);

  const portfolio = useMemo(() => {
    return buildPortfolioStory({ student, evidence, readinessBand });
  }, [student, evidence, readinessBand]);

  const curriculumLinkedCount = useMemo(() => countCurriculumLinked(evidence), [evidence]);

  const showcaseItems = useMemo<ShowcaseItem[]>(() => {
    return [...evidence]
      .map((item) => {
        const tags = tagMap[item.id] || [];
        const scored = scoreShowcaseItem(item, tags);
        return {
          item,
          score: scored.score,
          reason: scored.reason,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [evidence, tagMap]);

  const timelineItems = useMemo(() => evidence.slice(0, 6), [evidence]);

  const mediaItems = useMemo(
    () => evidence.filter((e) => hasAnyMedia(e)).slice(0, 8),
    [evidence]
  );

  const milestoneItems = useMemo(
    () =>
      evidence.filter((e) => {
        const tags = tagMap[e.id] || [];
        return tags.includes("Milestone") || tags.includes("Best work");
      }).slice(0, 6),
    [evidence, tagMap]
  );

  const nextMove = useMemo<NextMove>(() => {
    if (!student) {
      return {
        title: "Add your first learner",
        text: "Start by adding a child so you can begin collecting learning moments and building a meaningful portfolio.",
        href: "/children",
        cta: "Add learner",
      };
    }

    if (evidence.length === 0) {
      return {
        title: `Start ${firstNameOf(student)}'s portfolio`,
        text: "Add one simple learning moment to begin shaping the story you’ll later use in reports.",
        href: "/capture",
        cta: "Add learning",
      };
    }

    if (evidence.length < 3) {
      return {
        title: "Strengthen the portfolio",
        text: "Add a few more learning moments so the portfolio feels broader and more representative before reporting.",
        href: "/capture",
        cta: "Add more learning",
      };
    }

    if (portfolio.areas.length <= 1) {
      return {
        title: "Broaden the learning story",
        text: "Try adding learning from another domain so the portfolio shows more balance and confidence.",
        href: "/capture",
        cta: "Capture another area",
      };
    }

    return {
      title: "Build a report from this portfolio",
      text: "This portfolio now has enough depth to move confidently into a first report draft.",
      href: `/reports?studentId=${encodeURIComponent(student.id)}`,
      cta: "Build report",
    };
  }, [student, evidence.length, portfolio.areas.length]);

  const areaBreakdown = useMemo(() => {
    return groupedEvidence.map(([area, items]) => ({
      area,
      count: items.length,
    }));
  }, [groupedEvidence]);

  const visibleBlocks = useMemo(() => {
    return layout.blocks.filter((b) => {
      if (b.premium && !isPremium) return false;
      return b.enabled;
    });
  }, [layout.blocks, isPremium]);

  function blockEnabled(id: PortfolioBlockId) {
    return visibleBlocks.some((b) => b.id === id);
  }

  function topFeatureEnabled() {
    if (layout.topFeature === "featured_showcase") return blockEnabled("featured_showcase");
    if (layout.topFeature === "learning_feed") return blockEnabled("learning_feed");
    return blockEnabled("portfolio_summary");
  }

  function toggleSampleTag(evidenceId: string, tag: SampleTag) {
    setTagMap((prev) => {
      const current = prev[evidenceId] || [];
      const exists = current.includes(tag);
      const nextTags = exists ? current.filter((t) => t !== tag) : [...current, tag];
      return {
        ...prev,
        [evidenceId]: nextTags,
      };
    });
  }

  function setBlockEnabled(id: PortfolioBlockId, enabled: boolean) {
    setLayout((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => {
        if (block.id !== id) return block;
        if (block.premium && !isPremium) return { ...block, enabled: false };
        return { ...block, enabled };
      }),
    }));
  }

  function moveLayoutBlock(id: PortfolioBlockId, direction: "up" | "down") {
    setLayout((prev) => moveBlock(prev, id, direction));
  }

  function resetLayout() {
    setLayout(defaultPortfolioLayout(isPremium));
  }

  async function copyPortfolioSummary() {
    const text = [
      portfolio.headline,
      "",
      "Summary",
      portfolio.summary,
      "",
      "Confidence",
      portfolio.confidenceText,
      "",
      "Readiness",
      readinessBand,
      "",
      "Strengths",
      ...portfolio.strengths.map((s) => `• ${s}`),
      "",
      "Next steps",
      ...portfolio.nextSteps.map((s) => `• ${s}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Learning Portfolio"
      heroTitle={student ? `${studentName(student)}'s Learning Story` : "Your family learning portfolio"}
      heroText="A visual, parent-friendly portfolio of growth, milestones, creativity, and progress over time — designed to feel like a celebration of learning, not a report page."
      heroAsideTitle="Portfolio confidence"
      heroAsideText={portfolio.confidenceText || "A strong portfolio turns separate captures into a meaningful picture of growth over time."}
    >
      {err ? (
        <section
          style={{
            ...UI.card(),
            marginBottom: 16,
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#be123c",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          {err}
        </section>
      ) : null}

      {loading ? (
        <section style={UI.card()}>
          <div style={UI.h2()}>Loading portfolio…</div>
          <div style={{ ...UI.body(), marginTop: 8 }}>
            We’re gathering the learning story and strongest showcase items.
          </div>
        </section>
      ) : students.length === 0 ? (
        <section style={UI.card()}>
          <div style={UI.h2()}>No learners added yet</div>
          <div style={{ ...UI.body(), marginTop: 8 }}>
            Add a child first so you can begin capturing learning and building a calm portfolio over time.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link href="/children" style={UI.button(true)}>
              Add learner
            </Link>
            <Link href="/family" style={UI.button(false)}>
              Back to family page
            </Link>
          </div>
        </section>
      ) : (
        <>
          {highlightedEvidence ? (
            <section
              style={{
                ...UI.card(),
                marginBottom: 18,
                border: "1px solid #bfdbfe",
                background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
              }}
            >
              <div style={UI.label()}>Fresh portfolio moment</div>
              <div style={UI.h2()}>Your latest learning capture is now in the portfolio</div>
              <div style={{ ...UI.body(), marginTop: 10, maxWidth: 900 }}>
                <strong>{safe(highlightedEvidence.title) || "New learning moment"}</strong>
                {safe(highlightedEvidence.learning_area)
                  ? ` in ${guessArea(highlightedEvidence.learning_area)}`
                  : ""}
                {" "}has flowed straight into the portfolio and is ready to support future reporting.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                <span style={UI.chip("green")}>Freshly captured</span>
                <span style={UI.chip("blue")}>
                  {guessArea(highlightedEvidence.learning_area)}
                </span>
                <span style={UI.chip("slate")}>
                  {fullDate(highlightedEvidence.occurred_on || highlightedEvidence.created_at)}
                </span>
              </div>

              <div style={{ ...UI.softCard(), marginTop: 14 }}>
                <div style={UI.body()}>
                  {clip(textOfEvidence(highlightedEvidence), 180) ||
                    "This portfolio item is ready to be curated and carried into reporting."}
                </div>
              </div>
            </section>
          ) : null}

          <section
            style={{
              ...UI.card(),
              marginBottom: 18,
              background:
                "linear-gradient(135deg, rgba(79,124,240,0.06) 0%, rgba(16,185,129,0.05) 100%)",
              border: "1px solid #bfdbfe",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "minmax(220px, 300px) minmax(0,1fr)",
                gap: 16,
                alignItems: "end",
              }}
            >
              <div>
                <div style={UI.label()}>Child</div>
                <select
                  value={student?.id || ""}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, e.target.value);
                    }
                  }}
                  style={{ ...UI.input(), width: "100%" }}
                >
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>
                      {studentName(item)}
                      {studentYearLabel(item) ? ` — ${studentYearLabel(item)}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  justifyContent: isMobile ? "stretch" : "flex-end",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <Link
                  href="/capture"
                  style={{ ...UI.button(false), width: isMobile ? "100%" : undefined }}
                >
                  Capture
                </Link>
                <button
                  type="button"
                  onClick={() => setShowCustomize(true)}
                  style={{ ...UI.button(false), width: isMobile ? "100%" : undefined }}
                >
                  Customize
                </button>
                <button
                  type="button"
                  onClick={copyPortfolioSummary}
                  style={{ ...UI.button(false), width: isMobile ? "100%" : undefined }}
                >
                  {copied ? "Copied" : "Copy summary"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ ...UI.button(false), width: isMobile ? "100%" : undefined }}
                >
                  Print / PDF
                </button>
                <Link
                  href={student ? `/reports?studentId=${encodeURIComponent(student.id)}` : "/reports"}
                  style={{ ...UI.button(true), width: isMobile ? "100%" : undefined }}
                >
                  Build report
                </Link>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 12,
                marginTop: 16,
              }}
            >
              <StatCard label="Learning moments" value={String(evidence.length)} />
              <StatCard label="Learning domains" value={String(portfolio.areas.length)} />
              <StatCard label="Recent uploads" value={String(recentCount)} />
              <StatCard label="Showcase picks" value={String(showcaseItems.length)} />
              <StatCard label="Curriculum linked" value={String(curriculumLinkedCount)} />
            </div>
          </section>

          <section
            style={{
              ...UI.card(),
              marginBottom: 18,
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "minmax(0,1.2fr) minmax(260px,0.8fr)",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div>
              <div style={UI.label()}>Best next step</div>
              <div style={{ ...UI.h2(), fontSize: 28 }}>{nextMove.title}</div>
              <div style={{ ...UI.body(), marginTop: 10, maxWidth: 820 }}>{nextMove.text}</div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <Link
                  href={nextMove.href}
                  style={{ ...UI.button(true), width: isMobile ? "100%" : undefined }}
                >
                  {nextMove.cta}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowCustomize(true)}
                  style={{ ...UI.button(false), width: isMobile ? "100%" : undefined }}
                >
                  Customize dashboard
                </button>
              </div>
            </div>

            <div style={UI.softCard()}>
              <div style={UI.label()}>Portfolio readiness</div>
              <div
                style={{
                  ...UI.chip(
                    readinessBand === "Ready to report"
                      ? "green"
                      : readinessBand === "Building"
                      ? "amber"
                      : "blue"
                  ),
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {readinessBand}
              </div>
              <div style={{ ...UI.body(), marginTop: 10 }}>
                {readinessBand === "Getting started"
                  ? "Add a few learning moments to begin the story."
                  : readinessBand === "Building"
                  ? "You have enough to shape the portfolio, but a little more depth or spread will help."
                  : "This portfolio has enough depth and balance to support confident reporting."}
              </div>
            </div>
          </section>

          {topFeatureEnabled() && layout.topFeature === "featured_showcase" && blockEnabled("featured_showcase") ? (
            <FeaturedShowcase
              showcaseItems={showcaseItems}
              tagMap={tagMap}
            />
          ) : null}

          {topFeatureEnabled() && layout.topFeature === "learning_feed" && blockEnabled("learning_feed") ? (
            <section style={{ marginBottom: 18 }}>
              <LearningFeed
                items={timelineItems}
                tagMap={tagMap}
                toggleSampleTag={toggleSampleTag}
                highlightEvidenceId={highlightEvidenceId}
              />
            </section>
          ) : null}

          {topFeatureEnabled() && layout.topFeature === "portfolio_summary" && blockEnabled("portfolio_summary") ? (
            <section style={{ ...UI.card(), marginBottom: 18 }}>
              <div style={UI.label()}>Learning story</div>
              <div style={UI.h2()}>What this portfolio is saying so far</div>
              <div style={{ ...UI.body(), marginTop: 14, fontSize: 15 }}>{portfolio.summary}</div>
            </section>
          ) : null}

          <section
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "minmax(0,1.08fr) minmax(360px,0.92fr)",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 16 }}>
              {blockEnabled("featured_showcase") && layout.topFeature !== "featured_showcase" ? (
                <FeaturedShowcase showcaseItems={showcaseItems} tagMap={tagMap} />
              ) : null}

              {blockEnabled("learning_feed") && layout.topFeature !== "learning_feed" ? (
                <LearningFeed
                  items={timelineItems}
                  tagMap={tagMap}
                  toggleSampleTag={toggleSampleTag}
                  highlightEvidenceId={highlightEvidenceId}
                />
              ) : null}

              {blockEnabled("portfolio_summary") && layout.topFeature !== "portfolio_summary" ? (
                <section style={UI.card()}>
                  <div style={UI.label()}>Learning story</div>
                  <div style={UI.h2()}>What this portfolio is saying so far</div>
                  <div style={{ ...UI.body(), marginTop: 14, fontSize: 15 }}>{portfolio.summary}</div>
                </section>
              ) : null}

              {blockEnabled("strengths") ? (
                <section style={UI.card()}>
                  <div style={UI.label()}>Strengths showing so far</div>
                  <div style={UI.h2()}>What is already strong</div>
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    {portfolio.strengths.map((item, idx) => (
                      <div key={idx} style={UI.softCard()}>
                        <div style={{ ...UI.body(), fontWeight: 700 }}>{item}</div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {blockEnabled("next_steps") ? (
                <section style={UI.card()}>
                  <div style={UI.label()}>Helpful next steps</div>
                  <div style={UI.h2()}>How to strengthen the portfolio</div>
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    {portfolio.nextSteps.map((item, idx) => (
                      <div key={idx} style={UI.softCard()}>
                        <div style={{ ...UI.body(), fontWeight: 700 }}>{item}</div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {blockEnabled("media_shelf") ? (
                <section style={UI.card()}>
                  <div style={UI.label()}>Latest media</div>
                  <div style={UI.h2()}>Visual and audio moments</div>
                  <div style={{ ...UI.body(), marginTop: 8 }}>
                    A quick view of the latest visual, audio, and file-backed items in the portfolio.
                  </div>

                  {mediaItems.length === 0 ? (
                    <div style={{ ...UI.softCard(), marginTop: 14 }}>
                      <div style={UI.body()}>No media-backed portfolio items yet.</div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                        marginTop: 14,
                      }}
                    >
                      {mediaItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                            background: "#f8fafc",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              aspectRatio: "4 / 3",
                              background: evidenceThumb(item)
                                ? `url("${evidenceThumb(item)}") center/cover no-repeat`
                                : "linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#1d4ed8",
                              fontWeight: 900,
                              fontSize: 13,
                            }}
                          >
                            {!evidenceThumb(item) ? mediaLabel(item) || "Media" : null}
                          </div>

                          <div style={{ padding: 12, display: "grid", gap: 6 }}>
                            <div style={{ fontSize: 13, lineHeight: 1.3, fontWeight: 800, color: "#0f172a" }}>
                              {safe(item.title) || "Learning moment"}
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <span style={UI.chip("slate")}>{guessArea(item.learning_area)}</span>
                              {mediaLabel(item) ? <span style={UI.chip("blue")}>{mediaLabel(item)}</span> : null}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                              {fullDate(item.occurred_on || item.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {blockEnabled("learning_balance") ? (
                <section style={UI.card()}>
                  <div style={UI.label()}>Learning balance</div>
                  <div style={UI.h2()}>Visible spread</div>
                  <div style={{ ...UI.body(), marginTop: 8 }}>
                    This is the spread of learning currently visible across the portfolio.
                  </div>

                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    {areaBreakdown.length === 0 ? (
                      <div style={UI.softCard()}>
                        <div style={UI.body()}>No learning areas visible yet.</div>
                      </div>
                    ) : (
                      areaBreakdown.map((row) => (
                        <div key={row.area}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>{row.area}</div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{row.count}</div>
                          </div>
                          <div
                            style={{
                              height: 8,
                              borderRadius: 999,
                              background: "#e5e7eb",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.max(12, Math.round((row.count / Math.max(1, evidence.length)) * 100))}%`,
                                background: "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)",
                                borderRadius: 999,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              ) : null}

              {blockEnabled("milestones") ? (
                <section style={UI.card()}>
                  <div style={UI.label()}>Milestones</div>
                  <div style={UI.h2()}>Important portfolio moments</div>

                  {milestoneItems.length === 0 ? (
                    <div style={{ ...UI.softCard(), marginTop: 14 }}>
                      <div style={UI.body()}>
                        Tag portfolio items as <strong>Milestone</strong> or <strong>Best work</strong> to surface them here.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                      {milestoneItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                            background: "#f8fafc",
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
                            }}
                          >
                            <div style={{ fontSize: 14, lineHeight: 1.3, fontWeight: 800, color: "#0f172a" }}>
                              {safe(item.title) || "Portfolio milestone"}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                              {fullDate(item.occurred_on || item.created_at)}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {(tagMap[item.id] || []).map((tag) => (
                              <span key={tag} style={UI.chip(tag === "Milestone" ? "green" : "blue")}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div style={{ ...UI.body(), fontSize: 13 }}>
                            {clip(textOfEvidence(item), 110) || "Representative milestone moment."}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {blockEnabled("timeline") ? (
                <section style={UI.card()}>
                  <div style={UI.label()}>Portfolio timeline</div>
                  <div style={UI.h2()}>Recent learning moments shaping the story</div>
                  {timelineItems.length === 0 ? (
                    <div style={{ ...UI.softCard(), marginTop: 14 }}>
                      <div style={UI.body()}>No learning moments yet.</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                      {timelineItems.map((item) => (
                        <div
                          key={safe(item.id)}
                          style={{
                            border:
                              item.id === highlightEvidenceId
                                ? "2px solid #2563eb"
                                : "1px solid #e5e7eb",
                            borderRadius: 14,
                            background:
                              item.id === highlightEvidenceId ? "#eef6ff" : "#f8fafc",
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
                            }}
                          >
                            <div style={{ fontSize: 14, lineHeight: 1.3, fontWeight: 800, color: "#0f172a" }}>
                              {safe(item.title) || safe(item.learning_area) || "Learning moment"}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                              {fullDate(item.occurred_on || item.created_at)}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={UI.chip("slate")}>{guessArea(item.learning_area)}</span>
                            {mediaLabel(item) ? <span style={UI.chip("slate")}>{mediaLabel(item)}</span> : null}
                            {safe(item.curriculum_subject) ? (
                              <span style={UI.chip("blue")}>{safe(item.curriculum_subject)}</span>
                            ) : null}
                            {item.id === highlightEvidenceId ? (
                              <span style={UI.chip("green")}>Fresh capture</span>
                            ) : null}
                          </div>

                          <div style={{ ...UI.body(), fontSize: 13 }}>
                            {clip(textOfEvidence(item), 120) || "Learning reflection recorded."}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {blockEnabled("grouped_areas") ? (
                <section style={UI.card()}>
                  <div style={UI.label()}>Portfolio by learning area</div>
                  <div style={UI.h2()}>Grouped evidence view</div>

                  {groupedEvidence.length === 0 ? (
                    <div style={{ ...UI.softCard(), marginTop: 14 }}>
                      <div style={UI.body()}>No learning moments grouped yet.</div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                      {groupedEvidence.map(([area, items]) => (
                        <div
                          key={area}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                            background: "#f8fafc",
                            padding: 12,
                          }}
                        >
                          <div style={{ fontSize: 15, lineHeight: 1.25, fontWeight: 900, color: "#0f172a" }}>
                            {area}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                            {items.length} learning moment{items.length === 1 ? "" : "s"}
                          </div>

                          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                            {items.slice(0, 3).map((item) => (
                              <div
                                key={safe(item.id)}
                                style={{
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 12,
                                  background: "#ffffff",
                                  padding: 10,
                                  display: "grid",
                                  gap: 6,
                                }}
                              >
                                <div style={{ fontSize: 13, lineHeight: 1.3, fontWeight: 800, color: "#0f172a" }}>
                                  {safe(item.title) || "Learning moment"}
                                </div>
                                <div style={{ fontSize: 12, lineHeight: 1.5, color: "#475569" }}>
                                  {clip(textOfEvidence(item), 90) || "Reflection recorded."}
                                </div>

                                {(tagMap[item.id] || []).length > 0 ? (
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {(tagMap[item.id] || []).slice(0, 3).map((tag) => (
                                      <span key={tag} style={UI.chip("slate")}>
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}

                                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                                  {shortDate(item.occurred_on || item.created_at)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {blockEnabled("premium_intelligence") ? (
                <section
                  style={{
                    ...UI.card(),
                    border: "1px solid #bfdbfe",
                    background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
                  }}
                >
                  <div style={UI.label()}>Portfolio intelligence</div>
                  <div style={UI.h2()}>Premium portfolio insights</div>
                  <div style={{ ...UI.body(), marginTop: 10 }}>
                    Premium users can surface stronger representative evidence, spot curriculum-linked items more quickly, and carry more structured evidence forward into reporting.
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 12,
                      marginTop: 16,
                    }}
                  >
                    <div style={UI.softCard()}>
                      <div style={UI.label()}>Curriculum linked</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>
                        {curriculumLinkedCount}
                      </div>
                    </div>
                    <div style={UI.softCard()}>
                      <div style={UI.label()}>Tagged showcase items</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 8 }}>
                        {Object.values(tagMap).reduce((acc, tags) => acc + tags.length, 0)}
                      </div>
                    </div>
                    <div style={UI.softCard()}>
                      <div style={UI.label()}>Portfolio confidence</div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color:
                            readinessBand === "Ready to report"
                              ? "#166534"
                              : readinessBand === "Building"
                              ? "#9a3412"
                              : "#2563eb",
                          marginTop: 8,
                        }}
                      >
                        {readinessBand}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {blockEnabled("premium_trends") ? (
                <section style={UI.card()}>
                  <div style={UI.label()}>Trend snapshot</div>
                  <div style={UI.h2()}>Premium mini trends</div>
                  <div style={{ ...UI.body(), marginTop: 8 }}>
                    A simple visual snapshot of momentum and recent learning activity.
                  </div>

                  <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                    <TrendRow
                      label="Recent momentum"
                      value={recentCount}
                      max={Math.max(3, evidence.length || 1)}
                    />
                    {areaBreakdown.slice(0, 4).map((row) => (
                      <TrendRow
                        key={row.area}
                        label={row.area}
                        value={row.count}
                        max={Math.max(1, evidence.length)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </section>

          {showCustomize ? (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.42)",
                zIndex: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 18,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 860,
                  maxHeight: "88vh",
                  overflowY: "auto",
                  background: "#ffffff",
                  borderRadius: 22,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 30px 80px rgba(15,23,42,0.18)",
                  padding: 24,
                  display: "grid",
                  gap: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "start",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={UI.label()}>Customize portfolio</div>
                    <div style={{ ...UI.h2(), fontSize: 26 }}>Build your own learning story dashboard</div>
                    <div style={{ ...UI.body(), marginTop: 8, maxWidth: 640 }}>
                      Choose what appears on this portfolio, what feels most prominent, and how the learning story is presented. Starter users get a complete default layout. Premium users unlock deeper dashboard blocks.
                    </div>
                  </div>

                  <button type="button" onClick={() => setShowCustomize(false)} style={UI.button(false)}>
                    Close
                  </button>
                </div>

                <section style={UI.softCard()}>
                  <div style={UI.label()}>Top feature</div>
                  <div style={{ ...UI.body(), marginTop: 8 }}>
                    Choose which section should lead the portfolio visually.
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    {[
                      { id: "featured_showcase", label: "Featured showcase" },
                      { id: "learning_feed", label: "Learning feed" },
                      { id: "portfolio_summary", label: "Portfolio summary" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setLayout((prev) => ({
                            ...prev,
                            topFeature: option.id as PortfolioLayout["topFeature"],
                          }))
                        }
                        style={{
                          ...UI.button(layout.topFeature === option.id),
                          borderRadius: 999,
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section style={UI.softCard()}>
                  <div style={UI.label()}>Dashboard blocks</div>
                  <div style={{ ...UI.body(), marginTop: 8 }}>
                    Show, hide, and reorder sections. Premium-only blocks stay hidden unless premium access is active.
                  </div>

                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    {layout.blocks.map((block, index) => {
                      const locked = !!block.premium && !isPremium;
                      return (
                        <div
                          key={block.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 14,
                            background: locked ? "#f8fafc" : "#ffffff",
                            padding: 14,
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "minmax(0,1fr) auto",
                              gap: 12,
                              alignItems: "start",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
                                  {block.label}
                                </div>
                                {block.premium ? (
                                  <span style={UI.chip(locked ? "slate" : "blue")}>
                                    {locked ? "Premium" : "Premium active"}
                                  </span>
                                ) : null}
                              </div>
                              <div style={{ ...UI.body(), fontSize: 13, marginTop: 6 }}>
                                {block.description}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                onClick={() => moveLayoutBlock(block.id, "up")}
                                disabled={index === 0}
                                style={{
                                  ...UI.button(false),
                                  padding: "8px 10px",
                                  opacity: index === 0 ? 0.5 : 1,
                                }}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveLayoutBlock(block.id, "down")}
                                disabled={index === layout.blocks.length - 1}
                                style={{
                                  ...UI.button(false),
                                  padding: "8px 10px",
                                  opacity: index === layout.blocks.length - 1 ? 0.5 : 1,
                                }}
                              >
                                ↓
                              </button>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 13,
                                fontWeight: 800,
                                color: locked ? "#94a3b8" : "#334155",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={locked ? false : block.enabled}
                                disabled={locked}
                                onChange={(e) => setBlockEnabled(block.id, e.target.checked)}
                              />
                              Show this block
                            </label>

                            {locked ? (
                              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                                Unlock this block with premium access.
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                    <button type="button" onClick={resetLayout} style={UI.button(false)}>
                      Reset layout
                    </button>
                    <button type="button" onClick={() => setShowCustomize(false)} style={UI.button(true)}>
                      Done
                    </button>
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </>
      )}
    </FamilyTopNavShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.88)",
        border: "1px solid #dbeafe",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div style={UI.label()}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, lineHeight: 1.05, fontWeight: 900, color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

function TrendRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = `${Math.max(8, Math.round((value / Math.max(1, max)) * 100))}%`;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{value}</div>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width,
            background: "linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)",
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function FeaturedShowcase({
  showcaseItems,
  tagMap,
}: {
  showcaseItems: ShowcaseItem[];
  tagMap: TagMap;
}) {
  if (!showcaseItems.length) return null;

  return (
    <section style={{ ...UI.card(), marginBottom: 18 }}>
      <div style={UI.label()}>Featured showcase</div>
      <div style={UI.h2()}>Your strongest current portfolio pieces</div>
      <div style={{ ...UI.body(), marginTop: 8 }}>
        These are the clearest representative items to carry into reporting, sharing, or authority-ready evidence.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
          marginTop: 16,
        }}
      >
        {showcaseItems.slice(0, 4).map(({ item, reason }) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              background: "#f8fafc",
              overflow: "hidden",
              display: "grid",
            }}
          >
            <div
              style={{
                aspectRatio: "4 / 3",
                background: evidenceThumb(item)
                  ? `url("${evidenceThumb(item)}") center/cover no-repeat`
                  : "linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1d4ed8",
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              {!evidenceThumb(item) ? mediaLabel(item) || guessArea(item.learning_area) : null}
            </div>

            <div style={{ padding: 14, display: "grid", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", lineHeight: 1.3 }}>
                {safe(item.title) || safe(item.learning_area) || "Learning moment"}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={UI.chip("slate")}>{guessArea(item.learning_area)}</span>
                {mediaLabel(item) ? <span style={UI.chip("slate")}>{mediaLabel(item)}</span> : null}
                <span style={UI.chip(reason === "Curriculum-linked evidence" ? "blue" : "green")}>
                  {reason}
                </span>
              </div>

              <div style={{ ...UI.body(), fontSize: 13 }}>
                {clip(textOfEvidence(item), 135) || "Learning reflection recorded."}
              </div>

              {(tagMap[item.id] || []).length > 0 ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(tagMap[item.id] || []).map((tag) => (
                    <span key={tag} style={UI.chip(tag === "Milestone" ? "green" : "blue")}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                {fullDate(item.occurred_on || item.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LearningFeed({
  items,
  tagMap,
  toggleSampleTag,
  highlightEvidenceId,
}: {
  items: EvidenceRow[];
  tagMap: TagMap;
  toggleSampleTag: (evidenceId: string, tag: SampleTag) => void;
  highlightEvidenceId?: string;
}) {
  return (
    <section style={UI.card()}>
      <div style={UI.label()}>Learning feed</div>
      <div style={UI.h2()}>Recent learning moments shaping the story</div>

      {items.length === 0 ? (
        <div style={{ ...UI.softCard(), marginTop: 14 }}>
          <div style={UI.body()}>No learning moments yet.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {items.map((item) => {
            const highlighted = item.id === highlightEvidenceId;
            return (
              <div
                key={safe(item.id)}
                style={{
                  border: highlighted ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  borderRadius: 16,
                  background: highlighted ? "#eef6ff" : "#f8fafc",
                  overflow: "hidden",
                }}
              >
                {evidenceThumb(item) ? (
                  <div
                    style={{
                      aspectRatio: "16 / 7",
                      background: `url("${evidenceThumb(item)}") center/cover no-repeat`,
                    }}
                  />
                ) : null}

                <div style={{ padding: 14, display: "grid", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ fontSize: 15, lineHeight: 1.3, fontWeight: 900, color: "#0f172a" }}>
                      {safe(item.title) || safe(item.learning_area) || "Learning moment"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                      {fullDate(item.occurred_on || item.created_at)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={UI.chip("slate")}>{guessArea(item.learning_area)}</span>
                    {mediaLabel(item) ? <span style={UI.chip("slate")}>{mediaLabel(item)}</span> : null}
                    {highlighted ? <span style={UI.chip("green")}>Fresh capture</span> : null}
                    {(tagMap[item.id] || []).map((tag) => (
                      <span key={tag} style={UI.chip(tag === "Milestone" ? "green" : "blue")}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ ...UI.body(), fontSize: 13 }}>
                    {clip(textOfEvidence(item), 130) || "Learning reflection recorded."}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {SAMPLE_TAG_OPTIONS.map((tag) => {
                      const active = (tagMap[item.id] || []).includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleSampleTag(item.id, tag)}
                          style={{
                            ...UI.button(active),
                            padding: "8px 10px",
                            fontSize: 12,
                            borderRadius: 999,
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
