"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/app/components/AuthModal";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import useIsMobile from "@/app/components/useIsMobile";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import { familyStyles as S } from "@/lib/theme/familyStyles";
import { listReportDrafts, type ReportDraftRow } from "@/lib/reportDrafts";

/* =========================
   TYPES
========================= */

type ChildRecord = {
  id: string;
  name: string;
  yearLabel: string;
  evidenceCount: number;
  recentAreaCount: number;
  lastUpdated: string | null;
  strongestArea: string;
  nextFocusArea: string;
  status: "getting-started" | "building" | "ready" | "attention";
};

type FamilySettings = {
  defaultChildId?: string;
  autoOpenLastChild?: boolean;
  showAuthorityGuidance?: boolean;
  familyDisplayName?: string;
  preferredMarket?: "au" | "uk" | "us";
  onboardingComplete?: boolean;
  parentName?: string;
};

type FamilyGuidanceState = {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  tone?: "info" | "success" | "warning";
  reason?: string;
  progressNudge?: string;
};

type FamilyJourneyStepKey =
  | "planning"
  | "calendar"
  | "capture"
  | "reports"
  | "portfolio";

type FamilyJourneyStep = {
  key: FamilyJourneyStepKey;
  href: string;
  ribbonLabel: string;
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  reassurance: string;
};

type FamilyJourneyState = {
  current: FamilyJourneyStep;
  next: FamilyJourneyStep | null;
  progressText: string;
  supportTitle: string;
  supportBody: string;
  supportTone: "success" | "info" | "warning";
  secondaryTools: Array<{
    label: string;
    href: string;
    tone?: "primary" | "secondary";
  }>;
};

type LearningStep = {
  current: string;
  next: string;
  action: string;
};

type GuidedAgeBand = "5-6" | "7-8" | "9-10" | "11+";
type GuidedLocation = "au" | "uk" | "us" | "other";
type GuidedLearningStage =
  | "just-getting-started"
  | "building-confidence"
  | "working-steadily"
  | "ready-for-challenge";

type GuidedFamilyProfile = {
  age_band: GuidedAgeBand;
  location: GuidedLocation;
  learning_stage: GuidedLearningStage;
};

type GuidedStartActivity = {
  title: string;
  learningArea: string;
  emphasis: "primary" | "secondary" | "optional";
};

type GuidedStartPlan = {
  focusAreas: string[];
  activities: GuidedStartActivity[];
};

type PendingGuidedStartAction = {
  activity: GuidedStartActivity;
  profile: GuidedFamilyProfile;
};

/* =========================
   CONSTANTS
========================= */

const CHILDREN_KEY = "edudecks_children_seed_v1";
const SETTINGS_KEY = "edudecks_family_settings_v1";
const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";
const PLANNER_BLOCKS_KEY = "edudecks_calendar_blocks_v1";
const FAMILY_PROFILE_KEY = "edudecks_family_profile_v1";
const GUIDED_PENDING_ACTION_KEY = "edudecks_pending_guided_start_action_v1";
const RECENT_EVIDENCE_DAYS = 7;

const FALLBACK_CHILDREN: ChildRecord[] = [
  {
    id: "child-ava",
    name: "Ava",
    yearLabel: "Year 4",
    evidenceCount: 0,
    recentAreaCount: 0,
    lastUpdated: null,
    strongestArea: "—",
    nextFocusArea: "Literacy",
    status: "getting-started",
  },
  {
    id: "child-harvey",
    name: "Harvey",
    yearLabel: "Year 3",
    evidenceCount: 1,
    recentAreaCount: 1,
    lastUpdated: null,
    strongestArea: "Literacy",
    nextFocusArea: "Numeracy",
    status: "building",
  },
  {
    id: "child-jude",
    name: "Jude",
    yearLabel: "Year 5",
    evidenceCount: 3,
    recentAreaCount: 2,
    lastUpdated: null,
    strongestArea: "Humanities",
    nextFocusArea: "Science",
    status: "building",
  },
];

const AREA_SEQUENCE: Record<string, LearningStep> = {
  literacy: {
    current: "early reading and writing evidence",
    next: "blending, fluency, and simple written responses",
    action: "capture one short reading or writing learning moment next",
  },
  numeracy: {
    current: "single-step number understanding",
    next: "multi-step number work and strategy explanation",
    action: "capture a worked example with a short note about the strategy used",
  },
  mathematics: {
    current: "early operations evidence",
    next: "larger numbers, regrouping, and explanation of method",
    action: "add one more maths learning entry showing the next level of difficulty",
  },
  science: {
    current: "observation and recall",
    next: "prediction, explanation, and simple investigation",
    action: "capture a photo and short reflection from a hands-on science task",
  },
  humanities: {
    current: "basic topic engagement",
    next: "comparison, explanation, and source-based thinking",
    action: "add a short summary showing what your child learned and explained",
  },
  default: {
    current: "early learning evidence",
    next: "a slightly more independent next step",
    action: "capture one new learning moment and describe what your child could now do",
  },
};

/* =========================
   HELPERS
========================= */

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function asNumber(v: unknown, fallback = 0) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asDateText(v: unknown): string | null {
  const s = safe(v);
  return s || null;
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

function daysSince(value?: string | null) {
  const s = safe(value);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return Math.max(
    0,
    Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function statusPill(status: ChildRecord["status"]) {
  if (status === "ready") return S.pill("success");
  if (status === "attention") return S.pill("warning");
  if (status === "building") return S.pill("info");
  return S.pill("secondary");
}

function statusLabel(status: ChildRecord["status"]) {
  if (status === "ready") return "Ready to report";
  if (status === "attention") return "Needs attention";
  if (status === "building") return "Building momentum";
  return "Getting started";
}

function calmCheckTone(score: number): "success" | "info" | "warning" {
  if (score >= 75) return "success";
  if (score >= 45) return "info";
  return "warning";
}

function calmCheckText(score: number, childName: string) {
  if (score >= 75) {
    return `${childName} is on track. You have enough current evidence to move calmly toward reporting.`;
  }
  if (score >= 45) {
    return `${childName} is nearly there. One or two stronger learning moments would build confidence quickly.`;
  }
  return `${childName} needs a little more captured learning before this feels fully reassuring. Start small — one entry counts.`;
}

function normalizeChild(raw: any, index: number): ChildRecord {
  const name =
    safe(raw?.name) ||
    safe(raw?.child_name) ||
    safe(raw?.label) ||
    safe(raw?.title) ||
    [
      safe(raw?.preferred_name || raw?.first_name),
      safe(raw?.surname || raw?.family_name || raw?.last_name),
    ]
      .filter(Boolean)
      .join(" ") ||
    `Child ${index + 1}`;

  const yearLabel =
    safe(raw?.yearLabel) ||
    safe(raw?.year_label) ||
    (safe(raw?.year_level) ? `Year ${safe(raw?.year_level)}` : "Year level");

  const evidenceCount = asNumber(
    raw?.evidenceCount ?? raw?.evidence_count ?? raw?.entries ?? raw?.evidence,
    0
  );

  const recentAreaCount = asNumber(
    raw?.recentAreaCount ?? raw?.recent_area_count ?? raw?.coverage ?? 0,
    0
  );

  const lastUpdated =
    asDateText(raw?.lastUpdated) ||
    asDateText(raw?.updated_at) ||
    asDateText(raw?.lastEvidenceAt) ||
    asDateText(raw?.last_evidence_at);

  const strongestArea =
    safe(raw?.strongestArea) ||
    safe(raw?.strongest_area) ||
    safe(raw?.focusArea) ||
    safe(raw?.focus_area) ||
    "Literacy";

  const nextFocusArea =
    safe(raw?.nextFocusArea) ||
    safe(raw?.next_focus_area) ||
    (strongestArea === "—" ? "Literacy" : strongestArea);

  let status: ChildRecord["status"] = "getting-started";
  if (evidenceCount >= 4 && recentAreaCount >= 3) status = "ready";
  else if (evidenceCount >= 1) status = "building";
  if (lastUpdated && (daysSince(lastUpdated) ?? 0) > 30) status = "attention";

  return {
    id: safe(raw?.id) || `child-${index + 1}`,
    name,
    yearLabel,
    evidenceCount,
    recentAreaCount,
    lastUpdated,
    strongestArea,
    nextFocusArea,
    status,
  };
}

function inferLearningStep(area: string): LearningStep {
  const key = safe(area).toLowerCase();
  return AREA_SEQUENCE[key] || AREA_SEQUENCE.default;
}

function buildGuideState(
  child: ChildRecord | null,
  childDraft: ReportDraftRow | null
): FamilyGuidanceState {
  if (!child) {
    return {
      title: "Start by adding your first child",
      body: "Create or import a child profile so EduDecks can guide you through evidence, reports, and next learning steps.",
      primaryLabel: "Add child",
      primaryHref: "/children",
      secondaryLabel: "Open settings",
      secondaryHref: "/settings",
      tone: "info",
      reason: "No child is currently selected.",
      progressNudge:
        "Your first completed setup step unlocks the rest of the journey.",
    };
  }

  const evidenceCount = child.evidenceCount;
  const recentAreaCount = child.recentAreaCount;
  const lastDays = daysSince(child.lastUpdated);
  const selectedEvidenceCount = childDraft?.selected_evidence_ids?.length ?? 0;

  if (evidenceCount === 0) {
    return {
      title: `Start ${child.name}'s first learning entry`,
      body: `${child.name} does not have any saved learning evidence yet. Capture one small learning moment today so the system can begin guiding the next step with more confidence.`,
      primaryLabel: "Capture learning",
      primaryHref: "/capture",
      secondaryLabel: "View portfolio",
      secondaryHref: "/portfolio",
      tone: "warning",
      reason: "No evidence has been captured yet.",
      progressNudge:
        "You’re building a real learning record — one step at a time.",
    };
  }

  if (!childDraft) {
    return {
      title: `Turn ${child.name}'s evidence into a saved draft`,
      body: `${child.name} already has evidence building, but there is no saved report draft yet. The strongest next move is to formalise the learning story into a calm, reusable draft.`,
      primaryLabel: "Create report draft",
      primaryHref: "/reports",
      secondaryLabel: "Capture more evidence",
      secondaryHref: "/capture",
      tone: "info",
      reason: "Evidence exists, but no saved report draft is linked yet.",
      progressNudge:
        "You’re one step away from a reusable report draft.",
    };
  }

  if (selectedEvidenceCount < 3 || recentAreaCount < 2) {
    return {
      title: `Strengthen ${child.name}'s report before moving on`,
      body: `A saved draft exists, but the evidence set is still light. Add one or two stronger pieces across a wider spread of areas before treating it as submission-ready.`,
      primaryLabel: "Capture stronger evidence",
      primaryHref: "/capture",
      secondaryLabel: "Open report",
      secondaryHref: `/reports?draftId=${childDraft.id}`,
      tone: "warning",
      reason: "Draft exists, but coverage and evidence volume are still limited.",
      progressNudge:
        "One more strong piece could move this into ‘ready to report’.",
    };
  }

  if ((lastDays ?? 0) > 21) {
    return {
      title: `Refresh ${child.name}'s recent evidence`,
      body: `The draft is in place, but the latest saved learning evidence is getting older. Add one fresh learning moment so your reporting and authority posture stay current.`,
      primaryLabel: "Add fresh evidence",
      primaryHref: "/capture",
      secondaryLabel: "Open authority pack",
      secondaryHref: `/authority/pack-builder?draftId=${childDraft.id}`,
      tone: "info",
      reason: "The evidence set is useful, but recency is softening confidence.",
      progressNudge:
        "A fresh entry will strengthen confidence and make the next step feel calmer.",
    };
  }

  return {
    title: `${child.name} is ready for the next reporting step`,
    body: `You have enough current evidence and a saved draft for ${child.name}. The strongest next move is to shape the authority pack or review the output before export.`,
    primaryLabel: "Open authority pack",
    primaryHref: `/authority/pack-builder?draftId=${childDraft.id}`,
    secondaryLabel: "Review report output",
    secondaryHref: `/reports/output?draftId=${childDraft.id}`,
    tone: "success",
    reason: "Evidence, recency, and saved draft state are all in a strong place.",
    progressNudge: "You are at the formal reporting stage now.",
  };
}

function hasRecentChildEvidence(children: ChildRecord[], days = RECENT_EVIDENCE_DAYS) {
  return children.some(
    (child) =>
      child.evidenceCount > 0 &&
      child.lastUpdated &&
      (daysSince(child.lastUpdated) ?? days + 1) <= days
  );
}

function countLocalPlannerBlocks() {
  if (typeof window === "undefined") return 0;

  const raw = parseJson<any[]>(window.localStorage.getItem(PLANNER_BLOCKS_KEY), []);
  if (!Array.isArray(raw)) return 0;

  return raw.filter(
    (block) => safe(block?.id) || safe(block?.title) || safe(block?.planned_for)
  ).length;
}

function buildFamilyGuidanceState(
  plannerBlockCount: number,
  totalEvidenceCount: number,
  hasReportDraft: boolean
): FamilyGuidanceState {
  if (plannerBlockCount === 0) {
    return {
    title: "You're on track",
      body: "You've captured learning this week — keep going",
      ctaLabel: "View Portfolio",
      ctaHref: "/portfolio",
    };
  }

  if (plannerBlockCount > 0) {
    return {
      title: "Do this next",
      body: "You planned learning — capture what happened",
      ctaLabel: "Capture",
      ctaHref: "/capture",
    };
  }

  return {
    title: "Start here",
    body: "Plan one small learning moment",
    ctaLabel: "Open Calendar",
    ctaHref: "/calendar",
  };
}

function buildBeginnerGuidanceState(
  plannerBlockCount: number,
  totalEvidenceCount: number,
  hasReportDraft: boolean
): FamilyGuidanceState {
  if (plannerBlockCount === 0) {
    return {
      title: "Start here",
      body: "Plan one small learning moment. One small step is enough to begin.",
      ctaLabel: "Open Calendar",
      ctaHref: "/calendar",
    };
  }

  if (totalEvidenceCount === 0) {
    return {
      title: "Do this next",
      body: "You have a plan. Next, capture what happened so the record starts to take shape.",
      ctaLabel: "Capture",
      ctaHref: "/capture",
      secondaryLabel: "See planning",
      secondaryHref: "/calendar",
    };
  }

  if (!hasReportDraft) {
    return {
      title: "Next step",
      body: "You have captured learning. Turn it into a simple report next, then keep the strongest pieces in portfolio later.",
      ctaLabel: "Build Report",
      ctaHref: "/reports",
      secondaryLabel: "Capture again",
      secondaryHref: "/capture",
    };
  }

  return {
    title: "You're on track",
    body: "Your plan, capture, and report are moving well. Portfolio is there when you want to keep the strongest pieces together.",
    ctaLabel: "Continue Report",
    ctaHref: "/reports",
    secondaryLabel: "Open Portfolio",
    secondaryHref: "/portfolio",
  };
}

function buildJourneyStep(
  key: FamilyJourneyStepKey,
  selectedChild: ChildRecord | null,
  activeGuidedPlan: GuidedStartPlan,
  hasRecentEvidence: boolean
): FamilyJourneyStep {
  const childName = selectedChild?.name || "your child";
  const focusAreas = activeGuidedPlan.focusAreas.length
    ? activeGuidedPlan.focusAreas.join(" and ").toLowerCase()
    : "one gentle learning focus";

  if (key === "planning") {
    return {
      key,
      href: "/planner",
      ribbonLabel: "Planning",
      eyebrow: "Current step",
      title: "Start with one small plan",
      body: `Begin with a simple learning intention for ${childName}. A calm first step is often enough, and ${focusAreas} is a safe place to begin.`,
      primaryLabel: "Start planning",
      primaryHref: "/planner",
      reassurance: "You do not need a full week mapped out today. One plan is enough to begin.",
    };
  }

  if (key === "calendar") {
    return {
      key,
      href: "/calendar",
      ribbonLabel: "Calendar",
      eyebrow: "Current step",
      title: "Place the plan into your week",
      body: `Your next move is to give the plan a gentle place in the week so the journey feels real, visible, and easy to follow.`,
      primaryLabel: "Open calendar",
      primaryHref: "/calendar",
      reassurance: "A simple slot in the week is enough. You can adjust the rhythm later.",
    };
  }

  if (key === "capture") {
    return {
      key,
      href: "/capture",
      ribbonLabel: "Capture",
      eyebrow: "Current step",
      title: "Capture one learning moment",
      body: `Record what happened for ${childName} with one short note, photo, or work sample. This is where the journey starts to become meaningful.`,
      primaryLabel: "Capture this moment",
      primaryHref: "/capture",
      reassurance: "One learning moment is enough to keep momentum moving.",
    };
  }

  if (key === "reports") {
    return {
      key,
      href: "/reports",
      ribbonLabel: "Reports",
      eyebrow: "Current step",
      title: "Turn the moment into a calm summary",
      body: `You already have learning captured. EduDecks can now help shape it into a simple, useful report draft without adding more admin pressure.`,
      primaryLabel: "Build the report",
      primaryHref: "/reports",
      reassurance: "You have enough to move forward. The next step is about shaping, not starting again.",
    };
  }

  return {
    key,
    href: "/portfolio",
    ribbonLabel: "Portfolio",
    eyebrow: "Current step",
    title: "Keep the strongest work in the portfolio",
    body: `Your learning record is taking shape. Save the strongest pieces so ${childName}'s story stays easy to revisit and share over time.`,
    primaryLabel: "Open portfolio",
    primaryHref: "/portfolio",
    reassurance: hasRecentEvidence
      ? "You’re on track. EduDecks is now helping you keep the strongest pieces together."
      : "Your record is in a good place. Portfolio helps you keep the best parts visible.",
  };
}

function buildFamilyJourneyState(params: {
  plannerBlockCount: number;
  totalEvidenceCount: number;
  hasReportDraft: boolean;
  selectedChild: ChildRecord | null;
  activeGuidedPlan: GuidedStartPlan;
  hasRecentEvidence: boolean;
}): FamilyJourneyState {
  const {
    plannerBlockCount,
    totalEvidenceCount,
    hasReportDraft,
    selectedChild,
    activeGuidedPlan,
    hasRecentEvidence,
  } = params;

  const currentKey: FamilyJourneyStepKey =
    plannerBlockCount === 0
      ? "planning"
      : totalEvidenceCount === 0
      ? "calendar"
      : !hasRecentEvidence
      ? "capture"
      : !hasReportDraft
      ? "reports"
      : "portfolio";

  const nextKey: Record<FamilyJourneyStepKey, FamilyJourneyStepKey | null> = {
    planning: "calendar",
    calendar: "capture",
    capture: "reports",
    reports: "portfolio",
    portfolio: null,
  };

  const current = buildJourneyStep(
    currentKey,
    selectedChild,
    activeGuidedPlan,
    hasRecentEvidence
  );
  const next = nextKey[currentKey]
    ? buildJourneyStep(
        nextKey[currentKey] as FamilyJourneyStepKey,
        selectedChild,
        activeGuidedPlan,
        hasRecentEvidence
      )
    : null;

  if (currentKey === "planning") {
    return {
      current,
      next,
      progressText:
        "Planning comes first. Once one small plan is in place, EduDecks will guide you into the week, then into capture and reports.",
      supportTitle: "A calm start is enough",
      supportBody:
        "Begin with one learning intention, not a full system. The ribbon will open the next step when you are ready.",
      supportTone: "info",
      secondaryTools: [
        { label: "Open calendar", href: "/calendar" },
        { label: "Manage children", href: "/children" },
        { label: "View portfolio", href: "/portfolio" },
      ],
    };
  }

  if (currentKey === "calendar") {
    return {
      current,
      next,
      progressText:
        "Your plan exists. The next gentle move is to place it in the week, then capture what happened when the moment arrives.",
      supportTitle: "The week does not need to be full",
      supportBody:
        "A single scheduled learning moment keeps the journey visible and lowers the pressure on everything else.",
      supportTone: "info",
      secondaryTools: [
        { label: "Open planner", href: "/planner" },
        { label: "Quick capture", href: "/capture" },
        { label: "Manage children", href: "/children" },
      ],
    };
  }

  if (currentKey === "capture") {
    return {
      current,
      next,
      progressText:
        "The week is taking shape. Your next best move is to record one real learning moment so the journey can continue into reports.",
      supportTitle: "Capture keeps the journey real",
      supportBody:
        "You do not need a perfect write-up. One short note, photo, or work sample is enough to move forward.",
      supportTone: "info",
      secondaryTools: [
        { label: "Open calendar", href: "/calendar" },
        { label: "Open planner", href: "/planner" },
        { label: "Manage children", href: "/children" },
      ],
    };
  }

  if (!hasReportDraft) {
    return {
      current,
      next,
      progressText:
        "You have moved past setup. EduDecks can now turn what was captured into a calm, reusable report draft.",
      supportTitle: "You already have enough to continue",
      supportBody:
        "This stage is about shaping the record you have, not doing more admin. One clear report draft creates confidence quickly.",
      supportTone: "success",
      secondaryTools: [
        { label: "Capture again", href: "/capture" },
        { label: "Open calendar", href: "/calendar" },
        { label: "Report library", href: "/reports/library" },
      ],
    };
  }

  return {
    current,
    next,
    progressText:
      "You have reached the point where EduDecks is helping you keep the strongest learning together, ready to revisit and build on.",
    supportTitle: "You’re on track",
    supportBody:
      "The plan, capture, and report steps are already doing their job. Portfolio is where that work starts to feel lasting.",
    supportTone: "success",
    secondaryTools: [
      { label: "Continue reports", href: "/reports" },
      { label: "Capture another moment", href: "/capture" },
      { label: "Report library", href: "/reports/library" },
    ],
  };
}

function childActionLabel(child: ChildRecord, childDraft: ReportDraftRow | null) {
  if (child.evidenceCount === 0) return "Start entry";
  if (!childDraft) return "Build draft";
  if (child.evidenceCount < 3) return "Build draft";
  return "Continue";
}

function childActionHref(child: ChildRecord, childDraft: ReportDraftRow | null) {
  if (child.evidenceCount === 0) return "/calendar";
  if (!childDraft) return "/reports";
  return `/reports?draftId=${childDraft.id}`;
}

function estimateTimeSaved(
  child: ChildRecord | null,
  childDraft: ReportDraftRow | null
) {
  let minutes = 0;
  if (child) minutes += Math.min(child.evidenceCount * 7, 35);
  if (childDraft) minutes += 25;
  return Math.round(minutes / 6) / 10;
}

function estimateLearningStreak(child: ChildRecord | null) {
  if (!child) return 0;
  if (child.evidenceCount === 0) return 0;
  if (child.evidenceCount >= 4) return 4;
  if (child.evidenceCount >= 2) return 2;
  return 1;
}

function evidenceQualityHint(
  child: ChildRecord | null,
  childDraft: ReportDraftRow | null
) {
  if (!child) {
    return "A strong piece usually shows what your child attempted, understood, and found tricky.";
  }
  if (child.evidenceCount === 0) {
    return "Start simple: even one photo and one sentence can count as a useful first learning record.";
  }
  if (!childDraft) {
    return "Strong evidence usually includes a clear example plus a short human note about what was understood.";
  }
  return "At this stage, stronger evidence shows progress, confidence, and the likely next step — not just completion.";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function readGuidedFamilyProfile(): GuidedFamilyProfile | null {
  if (typeof window === "undefined") return null;
  const raw = parseJson<Partial<GuidedFamilyProfile> | null>(
    window.localStorage.getItem(FAMILY_PROFILE_KEY),
    null
  );
  if (!raw) return null;

  const ageBand = safe(raw.age_band) as GuidedAgeBand;
  const location = safe(raw.location) as GuidedLocation;
  const learningStage = safe(raw.learning_stage) as GuidedLearningStage;

  if (
    (ageBand === "5-6" || ageBand === "7-8" || ageBand === "9-10" || ageBand === "11+") &&
    (location === "au" || location === "uk" || location === "us" || location === "other") &&
    (learningStage === "just-getting-started" ||
      learningStage === "building-confidence" ||
      learningStage === "working-steadily" ||
      learningStage === "ready-for-challenge")
  ) {
    return {
      age_band: ageBand,
      location,
      learning_stage: learningStage,
    };
  }

  return null;
}

function writeGuidedFamilyProfile(profile: GuidedFamilyProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAMILY_PROFILE_KEY, JSON.stringify(profile));
}

function guidedStageLabel(stage: GuidedLearningStage) {
  if (stage === "just-getting-started") return "Just getting started";
  if (stage === "building-confidence") return "Building confidence";
  if (stage === "working-steadily") return "Working steadily";
  return "Ready for more challenge";
}

function guidedLocationLabel(location: GuidedLocation) {
  if (location === "au") return "Australia";
  if (location === "uk") return "UK";
  if (location === "us") return "US";
  return "Other";
}

function buildGuidedStartPlan(learningStage: GuidedLearningStage | ""): GuidedStartPlan {
  if (learningStage === "just-getting-started") {
    return {
      focusAreas: ["Literacy", "Light Maths"],
      activities: [
        { title: "10 min reading", learningArea: "Literacy", emphasis: "primary" },
        { title: "Simple maths task", learningArea: "Numeracy", emphasis: "secondary" },
        { title: "Outdoor learning", learningArea: "Science", emphasis: "optional" },
      ],
    };
  }

  if (learningStage === "building-confidence") {
    return {
      focusAreas: ["Reading", "Short writing", "Light maths"],
      activities: [
        { title: "10 min reading", learningArea: "Literacy", emphasis: "primary" },
        { title: "Short writing", learningArea: "Literacy", emphasis: "secondary" },
        { title: "Light maths task", learningArea: "Numeracy", emphasis: "optional" },
      ],
    };
  }

  if (learningStage === "working-steadily") {
    return {
      focusAreas: ["Balanced literacy", "Numeracy"],
      activities: [
        { title: "Reading and response", learningArea: "Literacy", emphasis: "primary" },
        { title: "Problem solving maths", learningArea: "Numeracy", emphasis: "secondary" },
        { title: "Creative extension", learningArea: "Creative", emphasis: "optional" },
      ],
    };
  }

  return {
    focusAreas: ["Extended literacy", "Problem solving"],
    activities: [
      { title: "Extended reading", learningArea: "Literacy", emphasis: "primary" },
      { title: "Challenge maths", learningArea: "Numeracy", emphasis: "secondary" },
      { title: "Inquiry task", learningArea: "Inquiry", emphasis: "optional" },
    ],
  };
}

/* =========================
   PAGE
========================= */

export default function FamilyPage() {
  return (
    <Suspense fallback={null}>
      <FamilyPageContent />
    </Suspense>
  );
}

function FamilyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const authMessage = safe(searchParams.get("authMessage"));
  const isPostSignupArrival = Boolean(authMessage);

  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [settings, setSettings] = useState<FamilySettings>({});
  const [drafts, setDrafts] = useState<ReportDraftRow[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [plannerBlockCount, setPlannerBlockCount] = useState(0);
  const [hasRecentEvidence, setHasRecentEvidence] = useState(false);
  const [totalEvidenceCount, setTotalEvidenceCount] = useState(0);
  const [guidedProfile, setGuidedProfile] = useState<GuidedFamilyProfile | null>(null);
  const [guidedDraft, setGuidedDraft] = useState<{
    age_band: GuidedAgeBand | "";
    location: GuidedLocation | "";
    learning_stage: GuidedLearningStage | "";
  }>({
    age_band: "",
    location: "",
    learning_stage: "",
  });
  const [guidedBusy, setGuidedBusy] = useState(false);
  const [guidedMessage, setGuidedMessage] = useState("");
  const [showGuidedStart, setShowGuidedStart] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const storedChildren = parseJson<any[]>(
      typeof window !== "undefined"
        ? window.localStorage.getItem(CHILDREN_KEY)
        : null,
      []
    );

    const normalizedChildren =
      storedChildren.length > 0
        ? storedChildren.map((child, i) => normalizeChild(child, i))
        : FALLBACK_CHILDREN;

    const storedSettings = parseJson<FamilySettings>(
      typeof window !== "undefined"
        ? window.localStorage.getItem(SETTINGS_KEY)
        : null,
      {}
    );
    const storedGuidedProfile = readGuidedFamilyProfile();

    setChildren(normalizedChildren);
    setSettings(storedSettings);
    setGuidedProfile(storedGuidedProfile);
    setShowGuidedStart(!storedGuidedProfile);

    if (storedGuidedProfile) {
      setGuidedDraft(storedGuidedProfile);
    }

    const storedActive =
      typeof window !== "undefined"
        ? safe(window.localStorage.getItem(ACTIVE_STUDENT_ID_KEY))
        : "";

    const preferredId =
      storedActive ||
      safe(storedSettings.defaultChildId) ||
      safe(normalizedChildren[0]?.id);

    setSelectedChildId(preferredId);

    const onboarded = Boolean(storedSettings.onboardingComplete);
    const childName = safe(normalizedChildren[0]?.name);
    const familyName = safe(storedSettings.familyDisplayName);

    if (onboarded) {
      setWelcomeMessage(
        familyName && childName
          ? `Welcome to EduDecks, ${familyName}. ${childName} is ready for the first learning capture.`
          : childName
          ? `${childName} is ready for the first learning capture.`
          : "Your family space is ready."
      );
    }

    if (authMessage) {
      setWelcomeMessage(authMessage);
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    async function hydrateDrafts() {
      try {
        setLoadingDrafts(true);
        const rows = await listReportDrafts();
        if (!mounted) return;
        setDrafts(rows);
      } catch {
        if (!mounted) return;
        setDrafts([]);
      } finally {
        if (mounted) setLoadingDrafts(false);
      }
    }

    void hydrateDrafts();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function hydrateGuidance() {
      const fallbackPlannerBlocks = countLocalPlannerBlocks();
      const fallbackRecentEvidence = hasRecentChildEvidence(children);
      const fallbackEvidenceCount = children.reduce(
        (sum, child) => sum + Math.max(0, child.evidenceCount || 0),
        0
      );

      if (mounted) {
        setPlannerBlockCount(fallbackPlannerBlocks);
        setHasRecentEvidence(fallbackRecentEvidence);
        setTotalEvidenceCount(fallbackEvidenceCount);
      }

      if (!hasSupabaseEnv) return;

      try {
        const authResp = await supabase.auth.getUser();
        const userId = authResp.data.user?.id;
        if (!userId) return;

        const recentCutoff = new Date();
        recentCutoff.setDate(recentCutoff.getDate() - RECENT_EVIDENCE_DAYS);
        const recentCutoffIso = recentCutoff.toISOString();

        const [plannerResp, evidenceResp] = await Promise.all([
          supabase.from("planner_blocks").select("id", { count: "exact", head: true }).eq("user_id", userId),
          supabase
            .from("evidence_entries")
            .select("id, occurred_on, created_at")
            .eq("user_id", userId)
            .or(`occurred_on.gte.${recentCutoffIso.slice(0, 10)},created_at.gte.${recentCutoffIso}`),
        ]);

        if (!mounted) return;

        if (!plannerResp.error && typeof plannerResp.count === "number") {
          setPlannerBlockCount(plannerResp.count);
        }

        if (!evidenceResp.error) {
          setTotalEvidenceCount((evidenceResp.data ?? []).length);
          const nextHasRecentEvidence = (evidenceResp.data ?? []).some((entry) => {
            const stamp = safe(entry?.occurred_on) || safe(entry?.created_at);
            return stamp && (daysSince(stamp) ?? RECENT_EVIDENCE_DAYS + 1) <= RECENT_EVIDENCE_DAYS;
          });
          setHasRecentEvidence(nextHasRecentEvidence);
        }
      } catch {
        if (!mounted) return;
      }
    }

    void hydrateGuidance();

    return () => {
      mounted = false;
    };
  }, [children]);

  const selectedChild = useMemo(() => {
    return children.find((child) => child.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  const selectedChildDraft = useMemo(() => {
    if (!selectedChild) return null;

    const exact =
      drafts.find(
        (draft) =>
          safe(draft.child_id) === selectedChild.id ||
          safe(draft.student_id) === selectedChild.id
      ) || null;

    if (exact) return exact;

    return (
      drafts.find(
        (draft) =>
          safe(draft.child_name).toLowerCase() === safe(selectedChild.name).toLowerCase()
      ) || null
    );
  }, [drafts, selectedChild]);

  const hasCompletedGuidedDraft =
    !!guidedDraft.age_band && !!guidedDraft.location && !!guidedDraft.learning_stage;
  const shouldShowGuidedStart =
    plannerBlockCount === 0 &&
    totalEvidenceCount === 0 &&
    showGuidedStart;
  const shouldShowGuidedStartFallbackCard =
    plannerBlockCount === 0 &&
    totalEvidenceCount === 0 &&
    !!guidedProfile &&
    !showGuidedStart;
  const activeGuidedPlan = useMemo(
    () => buildGuidedStartPlan(guidedProfile?.learning_stage || guidedDraft.learning_stage),
    [guidedDraft.learning_stage, guidedProfile]
  );
  const familyJourney = useMemo(
    () =>
      buildFamilyJourneyState({
        plannerBlockCount,
        totalEvidenceCount,
        hasReportDraft: Boolean(selectedChildDraft),
        selectedChild,
        activeGuidedPlan,
        hasRecentEvidence,
      }),
    [
      activeGuidedPlan,
      hasRecentEvidence,
      plannerBlockCount,
      selectedChild,
      selectedChildDraft,
      totalEvidenceCount,
    ]
  );

  const confidenceSummary = useMemo(() => {
    if (!selectedChild) return 0;
    let score = 0;
    score += Math.min(selectedChild.evidenceCount * 15, 45);
    score += Math.min(selectedChild.recentAreaCount * 10, 30);
    if (selectedChildDraft) score += 15;
    const lastDays = daysSince(selectedChild.lastUpdated);
    if (lastDays != null && lastDays <= 14) score += 10;
    return Math.min(score, 100);
  }, [selectedChild, selectedChildDraft]);

  const timeSavedHours = useMemo(
    () => estimateTimeSaved(selectedChild, selectedChildDraft),
    [selectedChild, selectedChildDraft]
  );

  const learningStreak = useMemo(() => estimateLearningStreak(selectedChild), [selectedChild]);

  const familyDisplayName = safe(settings.familyDisplayName) || "Your family";

  const parentName = safe(settings.parentName);

  async function persistGuidedProfile(profile: GuidedFamilyProfile) {
    writeGuidedFamilyProfile(profile);
    setGuidedProfile(profile);
    setShowGuidedStart(false);
  }

  async function handleGuidedSelection<K extends keyof GuidedFamilyProfile>(
    key: K,
    value: GuidedFamilyProfile[K]
  ) {
    const nextDraft = {
      ...guidedDraft,
      [key]: value,
    };
    setGuidedDraft(nextDraft);
    setGuidedMessage("");
  }

  async function runGuidedActivityTap(
    activity: GuidedStartActivity,
    authenticatedUserId: string | null,
    profile: GuidedFamilyProfile
  ) {
    setGuidedBusy(true);
    setGuidedMessage("");

    const plannedFor = todayIso();
    const block = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `family-guided-${Date.now()}`,
      user_id: null as string | null,
      student_id: selectedChild?.id || null,
      title: activity.title,
      learning_area: activity.learningArea,
      planned_for: plannedFor,
      planned_time: null as string | null,
      note: "Guided start suggestion",
      status: "planned" as const,
    };

    try {
      await persistGuidedProfile(profile);

      if (hasSupabaseEnv && authenticatedUserId) {
        const payload = { ...block, user_id: authenticatedUserId };
        const res = await supabase.from("planner_blocks").insert(payload).select("id").single();

        if (!res.error) {
          setPlannerBlockCount((prev) => prev + 1);
          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem(GUIDED_PENDING_ACTION_KEY);
          }
          router.push(`/calendar?view=week&date=${encodeURIComponent(plannedFor)}`);
          return;
        }
      }

      if (!hasSupabaseEnv) {
        const localBlocks = parseJson<any[]>(
          typeof window !== "undefined"
            ? window.localStorage.getItem(PLANNER_BLOCKS_KEY)
            : null,
          []
        );
        localBlocks.push(block);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(PLANNER_BLOCKS_KEY, JSON.stringify(localBlocks));
          window.sessionStorage.removeItem(GUIDED_PENDING_ACTION_KEY);
        }
        setPlannerBlockCount((prev) => prev + 1);
        router.push(`/calendar?view=week&date=${encodeURIComponent(plannedFor)}`);
        return;
      }

      throw new Error("Something went wrong - try again.");
    } catch (error: any) {
      setGuidedMessage(
        String(error?.message || error || "Something went wrong - try again.")
      );
    } finally {
      setGuidedBusy(false);
    }
  }

  async function handleGuidedActivityTap(activity: GuidedStartActivity) {
    const completeProfile =
      guidedProfile ||
      (hasCompletedGuidedDraft
        ? ({
            age_band: guidedDraft.age_band,
            location: guidedDraft.location,
            learning_stage: guidedDraft.learning_stage,
          } as GuidedFamilyProfile)
        : null);

    if (!completeProfile) {
      setGuidedMessage("Choose the quick start options first.");
      return;
    }

    if (!hasSupabaseEnv) {
      await runGuidedActivityTap(activity, null, completeProfile);
      return;
    }

    const authResp = await supabase.auth.getUser();
    const nextUserId = authResp.data.user?.id || null;

    if (!nextUserId) {
      if (typeof window !== "undefined") {
        const pendingAction: PendingGuidedStartAction = {
          activity,
          profile: completeProfile,
        };
        window.sessionStorage.setItem(
          GUIDED_PENDING_ACTION_KEY,
          JSON.stringify(pendingAction)
        );
      }
      setAuthModalOpen(true);
      return;
    }

    await runGuidedActivityTap(activity, nextUserId, completeProfile);
  }

  useEffect(() => {
    if (!hasSupabaseEnv || typeof window === "undefined") return;

    let cancelled = false;

    async function resumePendingGuidedAction() {
      const pendingRaw = window.sessionStorage.getItem(GUIDED_PENDING_ACTION_KEY);
      if (!pendingRaw) return;

      const pending = parseJson<PendingGuidedStartAction | null>(pendingRaw, null);
      if (!pending?.activity || !pending?.profile) return;

      const authResp = await supabase.auth.getUser();
      const nextUserId = authResp.data.user?.id || null;
      if (!nextUserId || cancelled) return;

      setGuidedDraft(pending.profile);
      setAuthModalOpen(false);
      await runGuidedActivityTap(pending.activity, nextUserId, pending.profile);
    }

    void resumePendingGuidedAction();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Home"
      heroTitle="A calmer way to move through family learning"
      heroText="The Family Home now works as a guided journey. Start with the current step, glance at what comes next, and leave the deeper tools for later."
      hideHeroAside={true}
      workflowCurrentHref="/family"
      workflowHelperText={
        shouldShowGuidedStart
          ? "Planning is the first step. Once one small plan is in place, the ribbon will guide you into calendar, capture, reports, and portfolio."
          : familyJourney.progressText
      }
    >
      <section style={{ ...S.card(), marginBottom: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.15fr) minmax(300px,0.85fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <div style={S.label()}>Family workspace</div>
            <div style={S.h2()}>
              Welcome back,{" "}
              {parentName || familyDisplayName === "Your family"
                ? parentName || selectedChild?.name || "friend"
                : familyDisplayName}
            </div>
            <div style={S.small()}>
              Use this page as your guided starting point. You do not need to
              think like a teacher â€” EduDecks should keep nudging the next
              sensible move.
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={S.label()}>Next step preview</div>
              <div style={S.h2()}>
                {familyJourney.next
                  ? `${familyJourney.next.ribbonLabel} comes next`
                  : "Portfolio keeps the strongest work together"}
              </div>
              <div style={S.body()}>
                {familyJourney.next
                  ? familyJourney.next.body
                  : "Once a report exists, portfolio becomes the calm place where the strongest parts of the story stay visible."}
              </div>

              <div style={{ ...S.small(), marginTop: 8 }}>
                {familyJourney.progressText}
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                {familyJourney.next ? (
                  <Link
                    href={familyJourney.next.primaryHref}
                    style={{ ...S.button(true), width: isMobile ? "100%" : undefined, justifyContent: "center" }}
                  >
                    Preview {familyJourney.next.ribbonLabel}
                  </Link>
                ) : (
                  <Link
                    href="/portfolio"
                    style={{ ...S.button(true), width: isMobile ? "100%" : undefined, justifyContent: "center" }}
                  >
                    Open portfolio
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div style={S.card()}>
            <div style={S.label()}>Support and progress</div>
            <div style={S.h2()}>{familyJourney.supportTitle}</div>
            <div style={S.body()}>{familyJourney.supportBody}</div>

            <div style={{ height: 12 }} />

            <div
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
              }}
            >
              <div style={S.label()}>Evidence quality coaching</div>
              <div style={S.small()}>{evidenceQualityHint(selectedChild, selectedChildDraft)}</div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={S.pill(calmCheckTone(confidenceSummary))}>
                Calm check {confidenceSummary}%
              </span>
              <span style={S.pill(familyJourney.supportTone)}>
                {familyJourney.current.ribbonLabel} is current
              </span>
              <span style={S.pill("secondary")}>{learningStreak} day learning streak</span>
            </div>
          </div>
        </div>
      </section>

      {!isMobile && welcomeMessage ? (
        <WelcomeStatusCard
          message={welcomeMessage}
          postSignup={isPostSignupArrival}
        />
      ) : null}

      <section
        style={{
          ...S.hero(),
          marginBottom: 18,
          padding: isMobile ? "20px 18px" : "28px 24px",
        }}
      >
        {shouldShowGuidedStart ? (
          <>
            <div style={S.label()}>Current step</div>
            {!guidedDraft.age_band ? (
              <>
                <div style={S.h1()}>Start with one small plan</div>
                <div style={S.body()}>Your child is:</div>
                <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                  {[
                    { label: "Age 5–6", value: "5-6" },
                    { label: "Age 7–8", value: "7-8" },
                    { label: "Age 9–10", value: "9-10" },
                    { label: "Age 11+", value: "11+" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        void handleGuidedSelection("age_band", option.value as GuidedAgeBand)
                      }
                      style={{
                        ...S.button(false),
                        width: "100%",
                        justifyContent: "center",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : !guidedDraft.location ? (
              <>
                <div style={S.h1()}>Keep the reporting guidance local</div>
                <div style={S.body()}>
                  We'll use this later for gentle reporting guidance. You do not need to set anything complex now.
                </div>
                <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                  {[
                    { label: "Australia", value: "au" },
                    { label: "UK", value: "uk" },
                    { label: "US", value: "us" },
                    { label: "Other", value: "other" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        void handleGuidedSelection("location", option.value as GuidedLocation)
                      }
                      style={{
                        ...S.button(false),
                        width: "100%",
                        justifyContent: "center",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : !guidedDraft.learning_stage ? (
              <>
                <div style={S.h1()}>Choose the learning starting point</div>
                <div style={S.body()}>
                  You can change this anytime — this just helps us start gently.
                </div>
                <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                  {[
                    {
                      label: "Just getting started",
                      value: "just-getting-started",
                    },
                    {
                      label: "Building confidence",
                      value: "building-confidence",
                    },
                    {
                      label: "Working steadily",
                      value: "working-steadily",
                    },
                    {
                      label: "Ready for more challenge",
                      value: "ready-for-challenge",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        void handleGuidedSelection(
                          "learning_stage",
                          option.value as GuidedLearningStage
                        )
                      }
                      style={{
                        ...S.button(false),
                        width: "100%",
                        justifyContent: "center",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={S.h1()}>Start with one calm plan</div>
                <div style={S.body()}>
                  You’re set for {guidedLocationLabel(guidedDraft.location)} and starting from{" "}
                  {guidedStageLabel(guidedDraft.learning_stage)}. We’ll build this step by step.
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: "1px solid #dbeafe",
                    background: "#f8fbff",
                  }}
                >
                  <div style={S.label()}>Focus this week</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    {activeGuidedPlan.focusAreas.map((focus) => (
                      <span key={focus} style={S.pill("info")}>
                        {focus}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ ...S.label(), marginTop: 16 }}>One good way to begin</div>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {activeGuidedPlan.activities.map((activity) =>
                    activity.emphasis === "primary" ? (
                      <button
                        key={activity.title}
                        type="button"
                        onClick={() => void handleGuidedActivityTap(activity)}
                        disabled={guidedBusy}
                        style={{
                          ...S.button(true),
                          width: "100%",
                          justifyContent: "center",
                          opacity: guidedBusy ? 0.7 : 1,
                        }}
                      >
                        {guidedBusy ? "Adding to calendar..." : activity.title}
                      </button>
                    ) : (
                      <button
                        key={activity.title}
                        type="button"
                        onClick={() => void handleGuidedActivityTap(activity)}
                        disabled={guidedBusy}
                        style={{
                          ...S.button(false),
                          width: "100%",
                          justifyContent: "center",
                          opacity: guidedBusy ? 0.7 : 1,
                        }}
                      >
                        {activity.title}
                      </button>
                    )
                  )}
                </div>

                {guidedMessage ? (
                  <div style={{ ...S.small(), marginTop: 12, color: "#b91c1c" }}>
                    {guidedMessage}
                  </div>
                ) : (
                  <div style={{ ...S.small(), marginTop: 12, color: "#1d4ed8" }}>
                    Planning is enough for now. Calendar comes next, then capture.
                  </div>
                )}
              </>
            )}
          </>
        ) : shouldShowGuidedStartFallbackCard ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: isMobile ? "stretch" : "center",
              flexWrap: "wrap",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <div style={S.label()}>Start here</div>
              <div style={S.h1()}>Plan one small learning moment</div>
              <div style={S.body()}>
                A calm place to begin is {activeGuidedPlan.focusAreas.join(" and ").toLowerCase()}.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                {activeGuidedPlan.focusAreas.map((focus) => (
                  <span key={focus} style={S.pill("info")}>
                    {focus}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                width: isMobile ? "100%" : "auto",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Link
                href="/calendar"
                style={{
                  ...S.button(true),
                  width: isMobile ? "100%" : undefined,
                  justifyContent: "center",
                }}
              >
                Plan today
              </Link>
              <button
                type="button"
                onClick={() => void handleGuidedActivityTap(activeGuidedPlan.activities[0])}
                style={{
                  ...S.button(false),
                  width: isMobile ? "100%" : undefined,
                  justifyContent: "center",
                }}
              >
                Add {activeGuidedPlan.activities[0]?.title || "first activity"}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: isMobile ? "stretch" : "center",
              flexWrap: "wrap",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <div style={S.label()}>{familyJourney.current.eyebrow}</div>
              <div style={S.h1()}>{familyJourney.current.title}</div>
              <div style={S.body()}>{familyJourney.current.body}</div>
              <div style={{ ...S.small(), marginTop: 10, color: "#1d4ed8" }}>
                {familyJourney.current.reassurance}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                width: isMobile ? "100%" : "auto",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Link
                href={familyJourney.current.primaryHref}
                style={{ ...S.button(true), width: isMobile ? "100%" : undefined, justifyContent: "center" }}
              >
                {familyJourney.current.primaryLabel}
              </Link>
              <div style={{ ...S.small(), maxWidth: 280 }}>
                {selectedChild
                  ? `${selectedChild.name} is ready for the ${familyJourney.current.ribbonLabel.toLowerCase()} step.`
                  : "EduDecks will keep this step close by until you are ready to move on."}
              </div>
            </div>
          </div>
        )}
      </section>

      {!shouldShowGuidedStart ? (
        <>
      {isMobile && welcomeMessage ? (
        <WelcomeStatusCard
          message={welcomeMessage}
          postSignup={isPostSignupArrival}
        />
      ) : null}

      <section style={{ ...S.card(), marginBottom: 18, display: "none" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.15fr) minmax(280px,0.85fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <div style={S.label()}>Calm check</div>
            <div style={S.h2()}>
              {selectedChild
                ? `${selectedChild.name} is ${statusLabel(selectedChild.status).toLowerCase()}`
                : "Select a child"}
            </div>
            <div style={S.body()}>
              {selectedChild
                ? calmCheckText(confidenceSummary, selectedChild.name)
                : "Choose a child to see whether the system thinks you are on track."}
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={S.pill(calmCheckTone(confidenceSummary))}>
                Calm check {confidenceSummary}%
              </span>
              <span style={S.pill("secondary")}>{learningStreak} day learning streak</span>
              <span style={S.pill("info")}>~{timeSavedHours.toFixed(1)} hrs saved</span>
            </div>
          </div>

          <div style={S.card()}>
            <div style={S.label()}>Selected child</div>

            <div style={{ marginBottom: 10 }}>
              <select
                value={selectedChild?.id || ""}
                onChange={(e) => {
                  setSelectedChildId(e.target.value);
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, e.target.value);
                  }
                }}
                style={{ ...S.input(220), width: "100%" }}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} — {child.yearLabel}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <MiniStat
                label="Status"
                value={statusLabel(selectedChild?.status || "getting-started")}
              />
              <MiniStat label="Strongest area" value={selectedChild?.strongestArea || "—"} />
              <MiniStat label="Next focus" value={selectedChild?.nextFocusArea || "Literacy"} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...S.card(), marginBottom: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.15fr) minmax(300px,0.85fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div>
            <div style={S.label()}>Family workspace</div>
            <div style={S.h2()}>
              Welcome back,{" "}
              {parentName || familyDisplayName === "Your family"
                ? parentName || selectedChild?.name || "friend"
                : familyDisplayName}
            </div>
            <div style={S.small()}>
              Use this page as your guided starting point. You do not need to
              think like a teacher — EduDecks should keep nudging the next
              sensible move.
            </div>

            <div style={{ height: 14 }} />

            <div
              style={{
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={S.label()}>Next step preview</div>
              <div style={S.h2()}>
                {familyJourney.next
                  ? `${familyJourney.next.ribbonLabel} comes next`
                  : "Portfolio keeps the strongest work together"}
              </div>
              <div style={S.body()}>
                {familyJourney.next
                  ? familyJourney.next.body
                  : "Once a report exists, portfolio becomes the calm place where the strongest parts of the story stay visible."}
              </div>

              <div style={{ ...S.small(), marginTop: 8 }}>
                {familyJourney.progressText}
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                {familyJourney.next ? (
                  <Link
                    href={familyJourney.next.primaryHref}
                    style={{ ...S.button(true), width: isMobile ? "100%" : undefined, justifyContent: "center" }}
                  >
                    Preview {familyJourney.next.ribbonLabel}
                  </Link>
                ) : (
                  <Link
                    href="/portfolio"
                    style={{ ...S.button(true), width: isMobile ? "100%" : undefined, justifyContent: "center" }}
                  >
                    Open portfolio
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div style={S.card()}>
            <div style={S.label()}>Support and progress</div>
            <div style={S.h2()}>{familyJourney.supportTitle}</div>
            <div style={S.body()}>{familyJourney.supportBody}</div>

            <div style={{ height: 12 }} />

            <div
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
              }}
            >
              <div style={S.label()}>Evidence quality coaching</div>
              <div style={S.small()}>{evidenceQualityHint(selectedChild, selectedChildDraft)}</div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span style={S.pill(calmCheckTone(confidenceSummary))}>
                Calm check {confidenceSummary}%
              </span>
              <span style={S.pill(familyJourney.supportTone)}>
                {familyJourney.current.ribbonLabel} is current
              </span>
              <span style={S.pill("secondary")}>{learningStreak} day learning streak</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...S.card(), opacity: 0.97 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={S.h2()}>Family progress</div>
            <div style={S.small()}>
              Keep this as a quieter reference. The guided step above is still
              the main thing to do now.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {familyJourney.secondaryTools.map((tool) => (
              <Link key={`${tool.href}-${tool.label}`} href={tool.href} style={S.button(false)}>
                {tool.label}
              </Link>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {children.map((child) => {
            const childDraft =
              drafts.find(
                (draft) =>
                  safe(draft.child_id) === child.id ||
                  safe(draft.student_id) === child.id ||
                  safe(draft.child_name).toLowerCase() === safe(child.name).toLowerCase()
              ) || null;

            return (
              <div
                key={child.id}
                style={{
                  border: selectedChild?.id === child.id ? "2px solid #4f7cf0" : "1px solid #e5e7eb",
                  background: selectedChild?.id === child.id ? "#f8fbff" : "#ffffff",
                  borderRadius: 16,
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
                    alignItems: "start",
                  }}
                >
                  <div>
                    <div style={S.h3()}>{child.name}</div>
                    <div style={S.small()}>{child.yearLabel}</div>
                  </div>
                  <span style={statusPill(child.status)}>{statusLabel(child.status)}</span>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <SummaryRow label="Evidence" value={String(child.evidenceCount)} />
                  <SummaryRow label="Coverage" value={String(child.recentAreaCount)} />
                  <SummaryRow label="Strongest" value={child.strongestArea || "—"} />
                  <SummaryRow label="Last update" value={shortDate(child.lastUpdated)} />
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#f8fafc",
                  }}
                >
                  <div style={S.label()}>Suggested next move</div>
                  <div style={S.small()}>
                    {child.evidenceCount === 0
                      ? "Start by adding your first learning entry."
                      : childDraft
                      ? child.status === "ready"
                        ? "Open the saved report or authority pack."
                        : "Turn this evidence into a saved report draft."
                      : "Turn this evidence into a first saved report draft."}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChildId(child.id);
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(ACTIVE_STUDENT_ID_KEY, child.id);
                      }
                    }}
                    style={S.button(false)}
                  >
                    Select
                  </button>
                  <Link href={childActionHref(child, childDraft)} style={S.button(true)}>
                    {childActionLabel(child, childDraft)}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...S.small(), marginTop: 14, color: "#1d4ed8" }}>
          {selectedChild
            ? `${selectedChild.name} is moving through ${familyJourney.current.ribbonLabel.toLowerCase()} now. EduDecks will keep the next step visible so the journey stays calm.`
            : "EduDecks will keep the next step visible so the family journey stays calm."}
        </div>

        {loadingDrafts ? (
          <div style={{ marginTop: 14 }}>
            <div style={S.small()}>Loading saved report signals…</div>
          </div>
        ) : null}
      </section>
        </>
      ) : null}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        returnPath="/family"
      />
    </FamilyTopNavShell>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function WelcomeStatusCard({
  message,
  postSignup,
}: {
  message: string;
  postSignup: boolean;
}) {
  return (
    <section
      style={{
        ...S.card(),
        marginBottom: 18,
        border: "1px solid #bfdbfe",
        background: "#eff6ff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div style={S.label()}>{postSignup ? "Progress saved" : "Welcome"}</div>
          <div style={S.h2()}>
            {postSignup ? "Your first guided record is saved." : "You’re on track."}
          </div>
          <div style={{ ...S.body(), color: "#1e3a8a" }}>
            {postSignup
              ? "You’re on track. EduDecks has brought you back to the right place so you can keep building calmly."
              : message}
          </div>
          {postSignup ? (
            <div style={{ ...S.small(), marginTop: 8, color: "#1d4ed8" }}>{message}</div>
          ) : null}
        </div>

        {postSignup ? (
          <Link href="/reports" style={S.button(true)}>
            Continue your record
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
      }}
    >
      <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
      <strong style={{ fontSize: 15, color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px minmax(0,1fr)",
        gap: 8,
        alignItems: "start",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.45,
          color: "#334155",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}
