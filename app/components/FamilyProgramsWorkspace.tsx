"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import {
  CurriculumAttachPanel,
  CurriculumTagPills,
} from "@/app/components/curriculum/CurriculumTaggingComponents";
import {
  ProgramGenerationSuccessBanner,
  ProgramGuidedSetupPanel,
  ProgramsGuidedSetupBanner,
  ProgramCalendarAssignmentPanel,
  ProgramEditor,
  ProgramList,
  ProgramSegmentCard,
  type SuggestedProgramPathTerm,
  type SuggestedProgramPathTile,
  BODY,
  H2,
  LABEL,
  META,
} from "@/app/components/programs/ProgramOverviewComponents";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";
import {
  defaultProgram,
  generateProgramIntoCalendar,
  loadFamilyCalendarTemplates,
  loadFamilyPrograms,
  saveFamilyProgram,
  type CalendarTemplate,
  type Program,
  type ProgramSegment,
} from "@/lib/familyPlanningTemplates";
import {
  COUNTRY_OPTIONS,
  frameworkPreset,
  jurisdictionOptionsForCountry,
  presetFromFrameworkSelection,
} from "@/lib/curriculumFrameworks";
import { FAMILY_YEAR_LEVEL_OPTIONS } from "@/lib/familyLearnerYearLevel";

type ProgramSetupDraft = {
  country: string;
  jurisdictionId: string;
  yearLevel: string;
  subjectId: string;
  strandId: string;
  focusId: string;
};

const EMPTY_PROGRAM_SETUP_DRAFT: ProgramSetupDraft = {
  country: "",
  jurisdictionId: "",
  yearLevel: "",
  subjectId: "",
  strandId: "",
  focusId: "",
};

const AU_MATHS_NUMBER_YEAR_PROFILES: Record<number, {
  countRange: string;
  placeValue: string;
  addition: string;
  subtraction: string;
  pattern: string;
  grouping: string;
  fractions: string;
}> = {
  1: {
    countRange: "small collections and two-digit numbers",
    placeValue: "ones, tens, and teen numbers",
    addition: "combine small groups and make ten",
    subtraction: "take away from small collections",
    pattern: "twos, fives, tens, and simple repeats",
    grouping: "equal groups with hands-on materials",
    fractions: "halves, coins, and everyday sharing",
  },
  2: {
    countRange: "two- and three-digit numbers",
    placeValue: "hundreds, tens, and ones",
    addition: "mental addition with place value",
    subtraction: "count back, bridge, and use difference",
    pattern: "skip counting and growing patterns",
    grouping: "arrays, equal groups, and sharing",
    fractions: "halves, quarters, money, and revision",
  },
  3: {
    countRange: "numbers into the thousands",
    placeValue: "thousands, hundreds, tens, and ones",
    addition: "efficient addition strategies",
    subtraction: "efficient subtraction strategies",
    pattern: "skip counting and number patterns",
    grouping: "grouping, sharing, and early multiplication",
    fractions: "simple fractions, money, and revision",
  },
  4: {
    countRange: "larger whole numbers",
    placeValue: "expanded notation and flexible partitioning",
    addition: "multi-step addition problems",
    subtraction: "multi-step subtraction problems",
    pattern: "multiplicative patterns and rules",
    grouping: "multiplication and division connections",
    fractions: "fractions, decimals, money, and revision",
  },
  5: {
    countRange: "large whole numbers and decimals",
    placeValue: "place value across whole numbers and decimals",
    addition: "addition with decimals and estimates",
    subtraction: "subtraction with decimals and estimates",
    pattern: "factors, multiples, and pattern rules",
    grouping: "multiplication, division, and remainders",
    fractions: "fractions, decimals, money, and revision",
  },
  6: {
    countRange: "whole numbers, decimals, and fractions",
    placeValue: "renaming numbers across forms",
    addition: "efficient strategies across number types",
    subtraction: "efficient strategies across number types",
    pattern: "rules, multiples, and generalisations",
    grouping: "multiplication and division with larger numbers",
    fractions: "fractions, decimals, percentages, money, and revision",
  },
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function setupYearLevel(value: unknown) {
  const yearLevel = clean(value);
  return yearLevel && yearLevel !== "Year band not set" ? yearLevel : "";
}

function yearLevelOptionLabel(value: string) {
  if (/^\d+$/.test(value)) return `Year ${value}`;
  if (/^year\s+\d+$/i.test(value)) return value.replace(/^year/i, "Year");
  if (value === "K") return "Kindergarten";
  return value;
}

function yearNumberFromLabel(value: string) {
  const label = clean(value).toLowerCase().replace(/^year\s+/, "");
  const year = Number(label);
  return Number.isInteger(year) && year >= 1 && year <= 6 ? year : null;
}

function buildYearLevelOptions(prefillYearLevel: string) {
  const values = [
    setupYearLevel(prefillYearLevel),
    ...FAMILY_YEAR_LEVEL_OPTIONS,
  ].filter(Boolean);
  return Array.from(new Set(values)).map((value) => ({
    id: value,
    label: yearLevelOptionLabel(value),
  }));
}

function prefilledProgramSetupDraft(input: {
  country?: string | null;
  jurisdictionId?: string | null;
  yearBand?: string | null;
}): ProgramSetupDraft {
  return {
    ...EMPTY_PROGRAM_SETUP_DRAFT,
    country: clean(input.country),
    jurisdictionId: clean(input.jurisdictionId),
    yearLevel: setupYearLevel(input.yearBand),
  };
}

function parentFriendlyOutcomeTitle(label: string) {
  return clean(label).replace(/\.$/, "") || "Curriculum focus";
}

function slugify(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makePathTile(input: {
  year: number;
  term: number;
  week: number;
  title: string;
  description: string;
  curriculumCode?: string | null;
}): SuggestedProgramPathTile {
  return {
    id: `au-year-${input.year}-number-term-${input.term}-week-${input.week}-${slugify(input.title)}`,
    term: input.term,
    week: input.week,
    title: input.title,
    description: input.description,
    curriculumCode: input.curriculumCode || null,
  };
}

function buildAuMathsNumberYearPath(year: number): SuggestedProgramPathTerm[] {
  const profile = AU_MATHS_NUMBER_YEAR_PROFILES[year] ?? AU_MATHS_NUMBER_YEAR_PROFILES[3];
  const terms = [
    {
      term: 1,
      tiles: [
        makePathTile({
          year,
          term: 1,
          week: 1,
          title: "Counting and representing numbers",
          description: `Read, write, make, and explain ${profile.countRange}.`,
          curriculumCode: "AC9M3N01",
        }),
        makePathTile({
          year,
          term: 1,
          week: 3,
          title: "Place value",
          description: `Build confidence with ${profile.placeValue}.`,
          curriculumCode: "AC9M3N01",
        }),
        makePathTile({
          year,
          term: 1,
          week: 6,
          title: "Comparing and ordering",
          description: "Use number lines, benchmarks, and language to compare quantities.",
          curriculumCode: "AC9M3N01",
        }),
        makePathTile({
          year,
          term: 1,
          week: 9,
          title: "Term 1 number review",
          description: "Revisit counting, representation, place value, and ordering.",
          curriculumCode: "AC9M3N01",
        }),
      ],
    },
    {
      term: 2,
      tiles: [
        makePathTile({
          year,
          term: 2,
          week: 1,
          title: "Addition strategies",
          description: `Practise ways to ${profile.addition}.`,
          curriculumCode: "AC9M3N02",
        }),
        makePathTile({
          year,
          term: 2,
          week: 3,
          title: "Subtraction strategies",
          description: `Model and explain how to ${profile.subtraction}.`,
          curriculumCode: "AC9M3N02",
        }),
        makePathTile({
          year,
          term: 2,
          week: 6,
          title: "Choosing an operation",
          description: "Match number stories to addition, subtraction, or comparison.",
          curriculumCode: "AC9M3N02",
        }),
        makePathTile({
          year,
          term: 2,
          week: 9,
          title: "Term 2 strategy review",
          description: "Consolidate facts, strategies, and written explanations.",
          curriculumCode: "AC9M3N02",
        }),
      ],
    },
    {
      term: 3,
      tiles: [
        makePathTile({
          year,
          term: 3,
          week: 1,
          title: "Patterns and skip counting",
          description: `Work with ${profile.pattern}.`,
          curriculumCode: "AC9M3N02",
        }),
        makePathTile({
          year,
          term: 3,
          week: 3,
          title: "Grouping",
          description: `Represent ${profile.grouping}.`,
          curriculumCode: "AC9M3N02",
        }),
        makePathTile({
          year,
          term: 3,
          week: 6,
          title: "Sharing",
          description: "Use fair shares and equal groups to explain division ideas.",
          curriculumCode: "AC9M3N02",
        }),
        makePathTile({
          year,
          term: 3,
          week: 9,
          title: "Term 3 pattern review",
          description: "Connect counting patterns with grouping and sharing.",
          curriculumCode: "AC9M3N02",
        }),
      ],
    },
    {
      term: 4,
      tiles: [
        makePathTile({
          year,
          term: 4,
          week: 1,
          title: "Fractions in context",
          description: `Represent ${profile.fractions}.`,
          curriculumCode: "AC9M3N03",
        }),
        makePathTile({
          year,
          term: 4,
          week: 3,
          title: "Money and number decisions",
          description: "Use prices, totals, change, and estimates in practical contexts.",
          curriculumCode: "AC9M3N03",
        }),
        makePathTile({
          year,
          term: 4,
          week: 6,
          title: "Mixed number problems",
          description: "Choose useful strategies across the year pathway.",
        }),
        makePathTile({
          year,
          term: 4,
          week: 9,
          title: "Year number review",
          description: "Revisit key number skills and prepare the next program move.",
        }),
      ],
    },
  ];

  return terms.map((term) => ({
    id: `au-year-${year}-number-term-${term.term}`,
    term: term.term,
    label: `Term ${term.term}`,
    tiles: term.tiles,
  }));
}

function buildFallbackProgramPathTerms(
  strandOutcomes: Array<{ code: string; label: string }>,
): SuggestedProgramPathTerm[] {
  const tiles = strandOutcomes.map((outcome, index) => ({
    id: outcome.code,
    term: Math.min(Math.floor(index / 4) + 1, 4),
    week: (index % 4) * 2 + 1,
    title: parentFriendlyOutcomeTitle(outcome.label),
    description: "Use this as a focused step in the sequence.",
    curriculumCode: outcome.code,
  }));

  return [1, 2, 3, 4]
    .map((term) => ({
      id: `fallback-term-${term}`,
      term,
      label: `Term ${term}`,
      tiles: tiles.filter((tile) => tile.term === term),
    }))
    .filter((term) => term.tiles.length);
}

function buildSuggestedProgramPathTerms(input: {
  country: string;
  yearLevel: string;
  subjectId?: string | null;
  strandId?: string | null;
  strandOutcomes: Array<{ code: string; label: string }>;
}) {
  const year = yearNumberFromLabel(input.yearLevel);
  if (
    input.country === "au" &&
    year &&
    input.subjectId === "mathematics" &&
    input.strandId === "number"
  ) {
    return buildAuMathsNumberYearPath(year);
  }

  return buildFallbackProgramPathTerms(input.strandOutcomes);
}

function buildDraftProgram(input: {
  familyId: string;
  learnerId?: string | null;
  frameworkId: string;
  jurisdictionId?: string | null;
  periodLabel: string;
  subjectId: string;
  subjectTitle: string;
  strandTitle: string;
  pathTiles: SuggestedProgramPathTile[];
}): Program {
  const subjectTitle = clean(input.subjectTitle) || clean(input.subjectId) || "General";
  const strandTitle = clean(input.strandTitle);
  const selectedOutcomeIds = Array.from(
    new Set(input.pathTiles.map((tile) => clean(tile.curriculumCode)).filter(Boolean)),
  );
  const base = defaultProgram({
    familyId: input.familyId,
    learnerId: input.learnerId || null,
    frameworkId: input.frameworkId,
    jurisdictionId: input.jurisdictionId || null,
    subjectId: subjectTitle,
    periodLabel: input.periodLabel,
  });
  const createdAt = Date.now();

  return {
    ...base,
    title: [subjectTitle, strandTitle].filter(Boolean).join(": ") || "New program",
    subjectId: subjectTitle,
    durationCount: Math.max(input.pathTiles.length, 1),
    segmentType: "sequence",
    curriculumOutcomeIds: selectedOutcomeIds,
    segments: input.pathTiles.map((tile, index) => ({
      id: `segment-${createdAt}-${index + 1}`,
      programId: base.id,
      order: index + 1,
      title: tile.title,
      notes: `Term ${tile.term}, week ${tile.week}: ${tile.description}`,
      curriculumOutcomeIds: clean(tile.curriculumCode) ? [clean(tile.curriculumCode)] : [],
      evidencePrompts: [],
      assessmentIntents: [],
      suggestedPlanBlocks: [],
    })),
  };
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function friendlyProgramsMessage(kind: "load" | "save" | "generate") {
  if (kind === "load") {
    return "My Programs could not load. You can keep shaping a draft here.";
  }
  if (kind === "save") {
    return "Your program could not be saved just yet. Keep editing, then save again.";
  }
  return "Generation is not ready yet. Check learner, slot, segment, and start date.";
}

const DETAIL_CHIP =
  "inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em]";

function detailStatus(input: {
  hasLearner: boolean;
  hasSegments: boolean;
  hasCalendarTemplate: boolean;
  hasSlot: boolean;
  hasStartDate: boolean;
  generationReady: boolean;
}) {
  if (!input.hasLearner) {
    return { label: "Choose learner", tone: "border-slate-200 bg-slate-50 text-slate-600" };
  }
  if (!input.hasSegments) {
    return { label: "Needs segment", tone: "border-amber-200 bg-amber-50 text-amber-700" };
  }
  if (!input.hasCalendarTemplate || !input.hasSlot) {
    return { label: "Needs slot", tone: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  if (!input.hasStartDate) {
    return { label: "Needs date", tone: "border-violet-200 bg-violet-50 text-violet-700" };
  }
  if (input.generationReady) {
    return { label: "Ready", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  return { label: "Draft workspace", tone: "border-slate-200 bg-slate-50 text-slate-600" };
}

function generationGuidance(input: {
  hasLearner: boolean;
  hasSegments: boolean;
  hasCalendarTemplate: boolean;
  hasSlot: boolean;
  hasStartDate: boolean;
}) {
  if (!input.hasLearner) return "Choose a learner";
  if (!input.hasSegments) return "Add at least one segment";
  if (!input.hasCalendarTemplate || !input.hasSlot) return "Choose a calendar slot";
  if (!input.hasStartDate) return "Choose a start date";
  return "Ready. Generate this program into My Calendar.";
}

export default function FamilyProgramsWorkspace() {
  const router = useRouter();
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [templates, setTemplates] = useState<CalendarTemplate[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [editingCurriculumSegmentId, setEditingCurriculumSegmentId] = useState<string | null>(null);
  const [assignmentTemplateId, setAssignmentTemplateId] = useState("");
  const [assignmentSlotId, setAssignmentSlotId] = useState("");
  const [assignmentStartDate, setAssignmentStartDate] = useState(ymd(new Date()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [lastGeneratedCount, setLastGeneratedCount] = useState(0);
  const [showGenerationSuccess, setShowGenerationSuccess] = useState(false);
  const [showNewProgramGuide, setShowNewProgramGuide] = useState(false);
  const [selectedProgramPathTileIds, setSelectedProgramPathTileIds] = useState<string[]>([]);
  const [programSetupDraft, setProgramSetupDraft] =
    useState<ProgramSetupDraft>(EMPTY_PROGRAM_SETUP_DRAFT);

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const learningConfig = resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner);
  const preset = frameworkPreset(
    learningConfig.country === "us" || learningConfig.country === "uk"
      ? learningConfig.country
      : "au",
  );
  const programSetupPreset = useMemo(
    () =>
      presetFromFrameworkSelection({
        country: programSetupDraft.country || learningConfig.country,
        frameworkId: learningConfig.frameworkId,
        jurisdictionId: programSetupDraft.jurisdictionId || learningConfig.jurisdictionId,
      }),
    [
      learningConfig.country,
      learningConfig.frameworkId,
      learningConfig.jurisdictionId,
      programSetupDraft.country,
      programSetupDraft.jurisdictionId,
    ],
  );
  const programSetupCountryOptions = useMemo(
    () => COUNTRY_OPTIONS.map((option) => ({ id: option.id, label: option.label })),
    [],
  );
  const programSetupJurisdictionOptions = useMemo(
    () =>
      jurisdictionOptionsForCountry(programSetupDraft.country || learningConfig.country).map(
        (option) => ({ id: option.id, label: option.label }),
      ),
    [learningConfig.country, programSetupDraft.country],
  );
  const programSetupYearLevelOptions = useMemo(
    () => buildYearLevelOptions(learningConfig.yearBand),
    [learningConfig.yearBand],
  );
  const selectedSetupSubject =
    programSetupPreset.subjects.find((subject) => subject.id === programSetupDraft.subjectId) ??
    null;
  const selectedSetupStrand =
    selectedSetupSubject?.strands.find((strand) => strand.id === programSetupDraft.strandId) ??
    null;
  const programPathTerms = useMemo(
    () =>
      selectedSetupStrand
        ? buildSuggestedProgramPathTerms({
            country: programSetupDraft.country || learningConfig.country,
            yearLevel: programSetupDraft.yearLevel,
            subjectId: selectedSetupSubject?.id,
            strandId: selectedSetupStrand.id,
            strandOutcomes: selectedSetupStrand.outcomes,
          })
        : [],
    [
      learningConfig.country,
      programSetupDraft.country,
      programSetupDraft.yearLevel,
      selectedSetupStrand,
      selectedSetupSubject?.id,
    ],
  );
  const programPathTiles = useMemo(
    () => programPathTerms.flatMap((term) => term.tiles),
    [programPathTerms],
  );
  const selectedProgramPathTiles = useMemo(
    () =>
      programPathTiles.filter((tile) =>
        selectedProgramPathTileIds.includes(tile.id),
      ),
    [programPathTiles, selectedProgramPathTileIds],
  );
  const canCreateProgramDraft = Boolean(
    programSetupDraft.country &&
      programSetupDraft.jurisdictionId &&
      programSetupDraft.yearLevel &&
      selectedSetupSubject &&
      selectedSetupStrand &&
      selectedProgramPathTiles.length,
  );
  const programSetupPrefillLabel =
    programSetupDraft.country || programSetupDraft.jurisdictionId || programSetupDraft.yearLevel
      ? "Prefilled from learner"
      : "";

  useEffect(() => {
    if (showNewProgramGuide) return;
    setSelectedProgramPathTileIds([]);
    setProgramSetupDraft(
      prefilledProgramSetupDraft({
        country: learningConfig.country,
        jurisdictionId: learningConfig.jurisdictionId,
        yearBand: learningConfig.yearBand,
      }),
    );
  }, [
    learningConfig.country,
    learningConfig.jurisdictionId,
    learningConfig.yearBand,
    showNewProgramGuide,
  ]);

  useEffect(() => {
    const validIds = new Set(programPathTiles.map((tile) => tile.id));
    setSelectedProgramPathTileIds((current) =>
      current.filter((tileId) => validIds.has(tileId)),
    );
  }, [programPathTiles]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!workspace.profile.id) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [nextPrograms, nextTemplates] = await Promise.all([
          loadFamilyPrograms({ familyId: workspace.profile.id }),
          loadFamilyCalendarTemplates({ familyId: workspace.profile.id }),
        ]);
        if (!mounted) return;

        const filteredPrograms = nextPrograms.filter(
          (program) => !program.learnerId || program.learnerId === activeLearner?.id,
        );

        setPrograms(filteredPrograms);
        setTemplates(nextTemplates);
        setSelectedProgramId(filteredPrograms[0]?.id || "");
        setAssignmentTemplateId(nextTemplates[0]?.id || "");
      } catch {
        if (!mounted) return;
        setError(friendlyProgramsMessage("load"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [
    activeLearner?.id,
    learningConfig.academicStructureType,
    learningConfig.frameworkId,
    learningConfig.jurisdictionId,
    workspace.profile.id,
  ]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === assignmentTemplateId) ?? null,
    [assignmentTemplateId, templates],
  );
  const selectedSlot = selectedTemplate?.slots.find((slot) => slot.id === assignmentSlotId) ?? null;
  const hasCalendarTemplate = templates.some((template) => template.slots.length > 0);
  const hasLearnerSelected = Boolean(activeLearner?.id);
  const hasProgramSegments = Boolean(selectedProgram?.segments.length);
  const hasCalendarSlot = Boolean(selectedSlot);
  const hasStartDate = Boolean(assignmentStartDate);
  const generationReady = Boolean(
    selectedProgram &&
      assignmentTemplateId &&
      assignmentSlotId &&
      assignmentStartDate &&
      hasCalendarTemplate &&
      hasLearnerSelected &&
      hasProgramSegments,
  );

  const selectedSegment =
    selectedProgram?.segments.find((segment) => segment.id === selectedSegmentId) ?? null;
  const selectedStatus = detailStatus({
    hasLearner: hasLearnerSelected,
    hasSegments: hasProgramSegments,
    hasCalendarTemplate,
    hasSlot: hasCalendarSlot,
    hasStartDate,
    generationReady,
  });
  const currentGuidance = generationGuidance({
    hasLearner: hasLearnerSelected,
    hasSegments: hasProgramSegments,
    hasCalendarTemplate,
    hasSlot: hasCalendarSlot,
    hasStartDate,
  });
  const saveStateLabel = saving
    ? "Saving"
    : workspace.storageMode === "local"
      ? "Saved locally"
      : status
        ? "Saved"
        : "Draft workspace";

  useEffect(() => {
    if (!selectedProgram) {
      setSelectedSegmentId(null);
      return;
    }
    if (!selectedSegmentId || !selectedProgram.segments.some((segment) => segment.id === selectedSegmentId)) {
      setSelectedSegmentId(selectedProgram.segments[0]?.id || null);
    }
    if (selectedProgram.scheduleMapping?.calendarTemplateSlotId) {
      setAssignmentSlotId(selectedProgram.scheduleMapping.calendarTemplateSlotId);
    }
    if (selectedProgram.scheduleMapping?.startDate) {
      setAssignmentStartDate(selectedProgram.scheduleMapping.startDate);
    }
  }, [selectedProgram, selectedSegmentId]);

  useEffect(() => {
    const template = templates.find((item) => item.id === assignmentTemplateId) ?? null;
    if (!template) return;
    if (!assignmentSlotId || !template.slots.some((slot) => slot.id === assignmentSlotId)) {
      setAssignmentSlotId(template.slots[0]?.id || "");
    }
  }, [assignmentSlotId, assignmentTemplateId, templates]);

  function openNewProgramGuide() {
    setSelectedProgramId("");
    setSelectedSegmentId(null);
    setEditingCurriculumSegmentId(null);
    setShowNewProgramGuide(true);
    setStatus("");
    setError("");
    setSelectedProgramPathTileIds([]);
    setProgramSetupDraft(
      prefilledProgramSetupDraft({
        country: learningConfig.country,
        jurisdictionId: learningConfig.jurisdictionId,
        yearBand: learningConfig.yearBand,
      }),
    );
  }

  function handleSelectProgram(programId: string) {
    setSelectedProgramId(programId);
    setShowNewProgramGuide(false);
    setError("");
  }

  function updateProgramSetupDraft(field: keyof ProgramSetupDraft, value: string) {
    if (field !== "focusId") {
      setSelectedProgramPathTileIds([]);
    } else {
      const matchingTile = programPathTiles.find(
        (tile) => clean(tile.curriculumCode) === value,
      );
      if (matchingTile) {
        setSelectedProgramPathTileIds((current) =>
          current.includes(matchingTile.id) ? current : [...current, matchingTile.id],
        );
      }
    }

    setProgramSetupDraft((current) => {
      if (field === "country") {
        return {
          ...EMPTY_PROGRAM_SETUP_DRAFT,
          country: value,
        };
      }
      if (field === "jurisdictionId") {
        return {
          ...current,
          jurisdictionId: value,
          yearLevel: "",
          subjectId: "",
          strandId: "",
          focusId: "",
        };
      }
      if (field === "yearLevel") {
        return {
          ...current,
          yearLevel: value,
          subjectId: "",
          strandId: "",
          focusId: "",
        };
      }
      if (field === "subjectId") {
        return {
          ...current,
          subjectId: value,
          strandId: "",
          focusId: "",
        };
      }
      if (field === "strandId") {
        return {
          ...current,
          strandId: value,
          focusId: "",
        };
      }
      return {
        ...current,
        [field]: value,
      };
    });
  }

  function syncFocusFromSelectedPath(nextTileIds: string[]) {
    const nextFirstCode =
      nextTileIds
        .map((currentTileId) =>
          clean(programPathTiles.find((item) => item.id === currentTileId)?.curriculumCode),
        )
        .find(Boolean) || "";
    setProgramSetupDraft((currentDraft) => ({
      ...currentDraft,
      focusId: nextFirstCode,
    }));
  }

  function toggleProgramPathTile(tileId: string) {
    const tile = programPathTiles.find((item) => item.id === tileId);
    const selected = selectedProgramPathTileIds.includes(tileId);
    const nextTileIds = selected
      ? selectedProgramPathTileIds.filter((currentTileId) => currentTileId !== tileId)
      : [...selectedProgramPathTileIds, tileId];
    const tileCode = clean(tile?.curriculumCode);

    setSelectedProgramPathTileIds(nextTileIds);
    if (!selected && tileCode) {
      setProgramSetupDraft((currentDraft) => ({
        ...currentDraft,
        focusId: tileCode,
      }));
    } else if (selected && programSetupDraft.focusId === tileCode) {
      syncFocusFromSelectedPath(nextTileIds);
    }
  }

  function toggleProgramPathTerm(termId: string) {
    const term = programPathTerms.find((item) => item.id === termId);
    if (!term) return;
    const termTileIds = term.tiles.map((tile) => tile.id);
    const allTermSelected = termTileIds.every((tileId) => selectedProgramPathTileIds.includes(tileId));
    const nextTileIds = allTermSelected
      ? selectedProgramPathTileIds.filter((tileId) => !termTileIds.includes(tileId))
      : Array.from(new Set([...selectedProgramPathTileIds, ...termTileIds]));
    setSelectedProgramPathTileIds(nextTileIds);
    syncFocusFromSelectedPath(nextTileIds);
  }

  function toggleProgramPathYear() {
    const allTileIds = programPathTiles.map((tile) => tile.id);
    const allYearSelected = allTileIds.length > 0 && allTileIds.every((tileId) => selectedProgramPathTileIds.includes(tileId));
    const nextTileIds = allYearSelected ? [] : allTileIds;
    setSelectedProgramPathTileIds(nextTileIds);
    syncFocusFromSelectedPath(nextTileIds);
  }

  function handleCreateProgram() {
    if (!canCreateProgramDraft || !selectedSetupSubject || !selectedSetupStrand) {
      return;
    }

    const next = buildDraftProgram({
      familyId: workspace.profile.id,
      learnerId: activeLearner?.id || null,
      frameworkId: learningConfig.frameworkId,
      jurisdictionId: programSetupDraft.jurisdictionId || learningConfig.jurisdictionId,
      periodLabel: learningConfig.academicStructureType === "semesters" ? "Semester 1" : "Term 1",
      subjectId: selectedSetupSubject.id,
      subjectTitle: selectedSetupSubject.title,
      strandTitle: selectedSetupStrand.title,
      pathTiles: selectedProgramPathTiles,
    });
    setPrograms((current) => [next, ...current]);
    setSelectedProgramId(next.id);
    setSelectedSegmentId(null);
    setShowNewProgramGuide(false);
    setStatus("Draft workspace ready.");
    setError("");
  }

  function updateProgram(nextProgram: Program) {
    setPrograms((current) =>
      current.map((program) => (program.id === nextProgram.id ? nextProgram : program)),
    );
  }

  function updateSegment(nextSegment: ProgramSegment) {
    if (!selectedProgram) return;
    updateProgram({
      ...selectedProgram,
      segments: selectedProgram.segments.map((segment) =>
        segment.id === nextSegment.id ? nextSegment : segment,
      ),
    });
  }

  function addSegment() {
    if (!selectedProgram) return;
    const nextSegment: ProgramSegment = {
      id: `segment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      programId: selectedProgram.id,
      order: selectedProgram.segments.length + 1,
      title: `Segment ${selectedProgram.segments.length + 1}`,
      notes: "",
      curriculumOutcomeIds: [],
      evidencePrompts: [],
      assessmentIntents: [],
      suggestedPlanBlocks: [],
    };
    updateProgram({
      ...selectedProgram,
      segments: [...selectedProgram.segments, nextSegment],
      durationCount: selectedProgram.segments.length + 1,
    });
    setSelectedSegmentId(nextSegment.id);
  }

  async function handleSaveProgram() {
    if (!selectedProgram) return;
    setSaving(true);
    setStatus("");
    setError("");
    try {
      const nextProgram: Program = {
        ...selectedProgram,
        learnerId: activeLearner?.id || selectedProgram.learnerId || null,
        frameworkId: learningConfig.frameworkId,
        jurisdictionId: learningConfig.jurisdictionId,
        scheduleMapping:
          assignmentTemplateId && assignmentSlotId && assignmentStartDate
            ? {
                id: selectedProgram.scheduleMapping?.id || `mapping-${Date.now()}`,
                programId: selectedProgram.id,
                calendarTemplateSlotId: assignmentSlotId,
                placementMode: "sequential",
                startDate: assignmentStartDate,
              }
            : null,
      };
      const saved = await saveFamilyProgram(nextProgram);
      updateProgram(saved);
      setStatus("Program saved.");
    } catch {
      setError(friendlyProgramsMessage("save"));
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!selectedProgram || !activeLearner?.id || !workspace.userId) return;
    const template = templates.find((item) => item.id === assignmentTemplateId) ?? null;
    if (!template || !assignmentSlotId || !assignmentStartDate) return;

    setGenerating(true);
    setStatus("");
    setError("");

    try {
      const nextProgram: Program = {
        ...selectedProgram,
        learnerId: activeLearner.id,
        frameworkId: learningConfig.frameworkId,
        jurisdictionId: learningConfig.jurisdictionId,
        scheduleMapping: {
          id: selectedProgram.scheduleMapping?.id || `mapping-${Date.now()}`,
          programId: selectedProgram.id,
          calendarTemplateSlotId: assignmentSlotId,
          placementMode: "sequential",
          startDate: assignmentStartDate,
        },
      };
      const saved = await saveFamilyProgram(nextProgram);
      updateProgram(saved);
      const generated = await generateProgramIntoCalendar({
        familyProfileId: workspace.profile.id,
        learnerId: activeLearner.id,
        createdByUserId: workspace.userId,
        program: saved,
        template,
        slotId: assignmentSlotId,
        startDate: assignmentStartDate,
      });
      setLastGeneratedCount(generated.length);
      setShowGenerationSuccess(true);
      setStatus(`${generated.length} block${generated.length === 1 ? "" : "s"} generated into My Calendar.`);
    } catch {
      setError(friendlyProgramsMessage("generate"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <FamilyTopNavShell
      subtitle="My Programs"
      heroTitle="My Programs"
      heroText="Build longer learning sequences, then place them into the live week."
      heroAsideTitle="Program planner"
      heroAsideText="Select a program, shape its segments, then place it into My Calendar."
    >
      <div className="grid gap-5 pb-14">
        {showGenerationSuccess ? (
          <ProgramGenerationSuccessBanner
            count={lastGeneratedCount}
            onOpenPlan={() => router.push(`/my-calendar?date=${encodeURIComponent(assignmentStartDate)}`)}
            onStayHere={() => setShowGenerationSuccess(false)}
          />
        ) : null}

        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={workspaceLoading ? "loading" : activeLearner ? "live" : "empty"}
        />

        {!workspaceLoading && !activeLearner ? (
          <ProgramsGuidedSetupBanner
            title="Choose a learner"
            note="Generation unlocks after a learner is selected."
          />
        ) : null}

        {loading ? (
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className={BODY}>Loading programs...</div>
          </section>
        ) : (
          <div id="programs-workspace" className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="xl:sticky xl:top-4 xl:self-start">
              <ProgramList
                programs={programs}
                selectedProgramId={selectedProgram?.id}
                onSelect={handleSelectProgram}
                onCreate={openNewProgramGuide}
              />
            </div>

            {!selectedProgram ? (
              showNewProgramGuide ? (
                <ProgramGuidedSetupPanel
                  draft={programSetupDraft}
                  countryOptions={programSetupCountryOptions}
                  jurisdictionOptions={programSetupJurisdictionOptions}
                  yearLevelOptions={programSetupYearLevelOptions}
                  subjectOptions={programSetupPreset.subjects.map((subject) => ({
                    id: subject.id,
                    label: subject.title,
                  }))}
                  strandOptions={(selectedSetupSubject?.strands || []).map((strand) => ({
                    id: strand.id,
                    label: strand.title,
                  }))}
                  focusOptions={(selectedSetupStrand?.outcomes || []).map((outcome) => ({
                    id: outcome.code,
                    label: `${outcome.code} - ${outcome.label}`,
                  }))}
                  programPathTerms={programPathTerms}
                  selectedProgramPathTileIds={selectedProgramPathTileIds}
                  onChange={updateProgramSetupDraft}
                  onToggleProgramPathTile={toggleProgramPathTile}
                  onToggleProgramPathTerm={toggleProgramPathTerm}
                  onToggleProgramPathYear={toggleProgramPathYear}
                  onCreateDraft={handleCreateProgram}
                  onCancel={() => {
                    setShowNewProgramGuide(false);
                    setError("");
                  }}
                  canCreateDraft={canCreateProgramDraft}
                  prefillLabel={programSetupPrefillLabel}
                />
              ) : (
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                  <div className={LABEL}>Selected program</div>
                  <h2 className="mt-2 text-[24px] font-black leading-tight text-slate-950">
                    No program selected
                  </h2>
                  <p className={`mt-2 ${BODY}`}>Create or select a program.</p>
                </section>
              )
            ) : (
              <section className="grid gap-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid gap-1.5">
                  <div className={LABEL}>Selected program</div>
                  <h2 className="text-[24px] font-black leading-tight text-slate-950">
                    {selectedProgram?.title || "No program selected"}
                  </h2>
                  <div className={META}>
                    {[selectedProgram?.subjectId, selectedProgram?.periodLabel].filter(Boolean).join(" - ") ||
                      "Create or select a program."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`${DETAIL_CHIP} ${selectedStatus.tone}`}>{selectedStatus.label}</span>
                  <span className={`${DETAIL_CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
                    {selectedProgram?.segments.length || 0} segment{selectedProgram?.segments.length === 1 ? "" : "s"}
                  </span>
                  <span className={`${DETAIL_CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
                    {selectedSlot?.label || "No slot"}
                  </span>
                </div>
              </div>

              <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
                <div className="grid gap-5">
                  <ProgramEditor program={selectedProgram} onChange={updateProgram} />

                  <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid gap-1.5">
                        <div className={LABEL}>Segments</div>
                        <h2 className={H2}>Sequence rows</h2>
                      </div>
                      <button
                        type="button"
                        onClick={addSegment}
                        disabled={!selectedProgram}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Add segment
                      </button>
                    </div>

                    <div className="grid gap-3">
                      {(selectedProgram?.segments || []).map((segment) => (
                        <ProgramSegmentCard
                          key={segment.id}
                          segment={segment}
                          hasSlot={hasCalendarSlot}
                          onChange={updateSegment}
                          onAttachCurriculum={setEditingCurriculumSegmentId}
                        />
                      ))}
                      {selectedProgram && !selectedProgram.segments.length ? (
                        <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-5">
                          <div className={H2}>No segments yet</div>
                          <div className={`mt-1 ${META}`}>Add at least one segment</div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </div>

                <div className="grid gap-5">
                  {selectedSegment ? (
                    <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                      <div className="grid gap-1.5">
                        <div className={LABEL}>Curriculum</div>
                        <h2 className={H2}>Linked outcomes</h2>
                      </div>
                      <CurriculumTagPills
                        preset={preset}
                        outcomeIds={selectedSegment.curriculumOutcomeIds}
                        emptyLabel="No linked outcomes yet"
                      />
                      {editingCurriculumSegmentId === selectedSegment.id ? (
                        <CurriculumAttachPanel
                          preset={preset}
                          selectedOutcomeIds={selectedSegment.curriculumOutcomeIds}
                          onApply={(outcomeIds) => {
                            updateSegment({ ...selectedSegment, curriculumOutcomeIds: outcomeIds });
                            setEditingCurriculumSegmentId(null);
                          }}
                          onCancel={() => setEditingCurriculumSegmentId(null)}
                          state="derived"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingCurriculumSegmentId(selectedSegment.id)}
                          className="inline-flex w-fit items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          {selectedSegment.curriculumOutcomeIds.length ? "Edit curriculum" : "Add curriculum"}
                        </button>
                      )}
                    </section>
                  ) : (
                    <section className="rounded-[24px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
                      <div className={LABEL}>Curriculum</div>
                      <h2 className={`mt-2 ${H2}`}>Select a segment</h2>
                    </section>
                  )}

                  <ProgramCalendarAssignmentPanel
                    templates={templates}
                    selectedTemplateId={assignmentTemplateId}
                    selectedSlotId={assignmentSlotId}
                    startDate={assignmentStartDate}
                    onTemplateChange={setAssignmentTemplateId}
                    onSlotChange={setAssignmentSlotId}
                    onStartDateChange={setAssignmentStartDate}
                    onGenerate={() => void handleGenerate()}
                    generating={generating}
                    generationReady={generationReady}
                    hasLearner={hasLearnerSelected}
                    hasSegments={hasProgramSegments}
                  />

                  <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className={LABEL}>Save state</div>
                        <div className={`mt-2 ${H2}`}>Place when ready</div>
                      </div>
                      <span className={`${DETAIL_CHIP} border-slate-200 bg-slate-50 text-slate-600`}>
                        {saveStateLabel}
                      </span>
                    </div>
                    <div className={`mt-3 ${error ? "text-[14px] text-rose-600" : META}`}>
                      {error || status || currentGuidance}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleSaveProgram()}
                        disabled={saving || !selectedProgram}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save program"}
                      </button>
                    </div>
                  </section>
                </div>
              </div>
              </section>
            )}
          </div>
        )}
      </div>
    </FamilyTopNavShell>
  );
}
