"use client";

import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type HomeSurfaceState,
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import {
  CoverageLegend,
  CoverageSummaryCards,
  CurriculumFrameworkSummaryBar,
  CurriculumMapEmptyState,
  CurriculumNextMoveCard,
  type CoverageStatus,
  type OutcomeCoverageView,
  StrandCoverageCard,
  SubjectCoverageTabs,
  type StrandCoverageView,
  type SubjectCoverageTabData,
} from "@/app/components/curriculum/CurriculumMapOverviewComponents";
import { loadEvidenceEntriesWithVariants } from "@/lib/familyEvidence";
import { loadFamilyCalendarWindow } from "@/lib/familyPlanner";

type EvidenceRow = {
  id: string;
  occurred_on?: string | null;
  created_at?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
};

type FrameworkPreset = {
  framework: string;
  jurisdiction: string;
  subjects: Array<{
    id: string;
    title: string;
    aliases: string[];
    strands: Array<{
      id: string;
      title: string;
      outcomes: Array<{ code: string; label: string }>;
    }>;
  }>;
};

const EVIDENCE_SELECTS = [
  "id,occurred_on,created_at,learning_area,evidence_type",
];

const FRAMEWORK_PRESETS: Record<"au" | "us" | "uk", FrameworkPreset> = {
  au: {
    framework: "Australian Curriculum v9",
    jurisdiction: "Tasmania",
    subjects: [
      {
        id: "mathematics",
        title: "Mathematics",
        aliases: ["mathematics", "maths", "numeracy", "mathematics and numeracy"],
        strands: [
          {
            id: "number",
            title: "Number",
            outcomes: [
              { code: "AC9M3N01", label: "Recognise, represent and order natural numbers." },
              { code: "AC9M3N02", label: "Recall and use addition and subtraction facts." },
              { code: "AC9M3N03", label: "Represent simple fractions in everyday contexts." },
            ],
          },
          {
            id: "measurement",
            title: "Measurement",
            outcomes: [
              { code: "AC9M3M01", label: "Measure, order and compare length, mass and capacity." },
              { code: "AC9M3M02", label: "Tell time to the minute and solve simple elapsed time problems." },
              { code: "AC9M3M03", label: "Use simple metric units in familiar situations." },
            ],
          },
          {
            id: "statistics",
            title: "Statistics and probability",
            outcomes: [
              { code: "AC9M3ST01", label: "Collect, represent and interpret categorical data." },
              { code: "AC9M3ST02", label: "Describe chance events using everyday language." },
            ],
          },
        ],
      },
      {
        id: "english",
        title: "English",
        aliases: ["english", "literacy", "reading", "writing"],
        strands: [
          {
            id: "reading",
            title: "Reading",
            outcomes: [
              { code: "AC9E3LY01", label: "Use comprehension strategies to make meaning from texts." },
              { code: "AC9E3LY02", label: "Discuss ideas, settings and events in shared texts." },
            ],
          },
          {
            id: "writing",
            title: "Writing",
            outcomes: [
              { code: "AC9E3LY03", label: "Create short imaginative and informative texts." },
              { code: "AC9E3LY04", label: "Use sentence-level punctuation and spelling patterns." },
            ],
          },
          {
            id: "speaking",
            title: "Speaking and listening",
            outcomes: [
              { code: "AC9E3LY05", label: "Contribute to classroom discussions and presentations." },
              { code: "AC9E3LY06", label: "Listen for key information and respond thoughtfully." },
            ],
          },
        ],
      },
      {
        id: "science",
        title: "Science",
        aliases: ["science", "inquiry", "stem"],
        strands: [
          {
            id: "understanding",
            title: "Science understanding",
            outcomes: [
              { code: "AC9S3U01", label: "Compare changes in living things, materials and Earth processes." },
              { code: "AC9S3U02", label: "Recognise how forces and energy affect everyday objects." },
            ],
          },
          {
            id: "inquiry",
            title: "Science inquiry",
            outcomes: [
              { code: "AC9S3I01", label: "Ask questions, plan simple investigations and record observations." },
              { code: "AC9S3I02", label: "Use evidence to share explanations and conclusions." },
            ],
          },
        ],
      },
      {
        id: "hass",
        title: "HASS",
        aliases: ["hass", "history", "geography", "social studies"],
        strands: [
          {
            id: "community",
            title: "Community and history",
            outcomes: [
              { code: "AC9H3K01", label: "Describe people, places and events that shape communities." },
              { code: "AC9H3K02", label: "Use simple sources to explore change over time." },
            ],
          },
          {
            id: "geography",
            title: "Places and environments",
            outcomes: [
              { code: "AC9H3G01", label: "Identify features of places and how people care for them." },
              { code: "AC9H3G02", label: "Use simple maps and data to describe local places." },
            ],
          },
        ],
      },
    ],
  },
  us: {
    framework: "Common Core aligned",
    jurisdiction: "California",
    subjects: [
      {
        id: "mathematics",
        title: "Mathematics",
        aliases: ["mathematics", "math", "maths", "numeracy"],
        strands: [
          {
            id: "operations",
            title: "Operations and algebraic thinking",
            outcomes: [
              { code: "CCSS.M.3.OA.1", label: "Interpret products of whole numbers." },
              { code: "CCSS.M.3.OA.2", label: "Interpret whole-number quotients." },
              { code: "CCSS.M.3.OA.7", label: "Fluently multiply and divide within 100." },
            ],
          },
          {
            id: "fractions",
            title: "Number and fractions",
            outcomes: [
              { code: "CCSS.M.3.NF.1", label: "Understand a fraction as part of a whole." },
              { code: "CCSS.M.3.NF.3", label: "Explain equivalent fractions in simple cases." },
            ],
          },
        ],
      },
      {
        id: "english",
        title: "English Language Arts",
        aliases: ["english", "ela", "literacy", "reading", "writing"],
        strands: [
          {
            id: "reading",
            title: "Reading",
            outcomes: [
              { code: "CCSS.ELA.RL.3.1", label: "Ask and answer questions to demonstrate understanding." },
              { code: "CCSS.ELA.RI.3.3", label: "Describe relationships between events and ideas." },
            ],
          },
          {
            id: "writing",
            title: "Writing",
            outcomes: [
              { code: "CCSS.ELA.W.3.2", label: "Write informative texts with facts and details." },
              { code: "CCSS.ELA.W.3.3", label: "Write narratives with event sequences and reflection." },
            ],
          },
        ],
      },
      {
        id: "science",
        title: "Science",
        aliases: ["science", "stem", "inquiry"],
        strands: [
          {
            id: "life",
            title: "Life science",
            outcomes: [
              { code: "NGSS.3-LS1-1", label: "Develop models of life cycles and growth." },
              { code: "NGSS.3-LS4-3", label: "Construct arguments about habitats and survival." },
            ],
          },
          {
            id: "engineering",
            title: "Engineering design",
            outcomes: [
              { code: "NGSS.3-5-ETS1-2", label: "Generate and compare possible solutions to a problem." },
              { code: "NGSS.3-5-ETS1-3", label: "Plan tests to improve a design solution." },
            ],
          },
        ],
      },
    ],
  },
  uk: {
    framework: "National Curriculum",
    jurisdiction: "England",
    subjects: [
      {
        id: "mathematics",
        title: "Mathematics",
        aliases: ["mathematics", "maths", "numeracy"],
        strands: [
          {
            id: "number",
            title: "Number",
            outcomes: [
              { code: "UK.MA.3.N1", label: "Read, write and compare numbers to 1000." },
              { code: "UK.MA.3.N2", label: "Add and subtract mentally and using written methods." },
            ],
          },
          {
            id: "measure",
            title: "Measurement",
            outcomes: [
              { code: "UK.MA.3.M1", label: "Measure, compare and add lengths, mass and volume." },
              { code: "UK.MA.3.M2", label: "Tell and write the time to the minute." },
            ],
          },
        ],
      },
      {
        id: "english",
        title: "English",
        aliases: ["english", "literacy", "reading", "writing"],
        strands: [
          {
            id: "reading",
            title: "Reading",
            outcomes: [
              { code: "UK.EN.3.R1", label: "Develop positive attitudes to reading and understanding." },
              { code: "UK.EN.3.R2", label: "Retrieve and record information from non-fiction." },
            ],
          },
          {
            id: "writing",
            title: "Writing",
            outcomes: [
              { code: "UK.EN.3.W1", label: "Plan and draft narratives and non-fiction." },
              { code: "UK.EN.3.W2", label: "Use paragraphs and accurate punctuation." },
            ],
          },
        ],
      },
      {
        id: "science",
        title: "Science",
        aliases: ["science", "inquiry", "stem"],
        strands: [
          {
            id: "working_scientifically",
            title: "Working scientifically",
            outcomes: [
              { code: "UK.SC.3.WS1", label: "Ask relevant questions and use simple tests." },
              { code: "UK.SC.3.WS2", label: "Gather, record and present findings in different ways." },
            ],
          },
          {
            id: "plants_animals",
            title: "Plants and animals",
            outcomes: [
              { code: "UK.SC.3.B1", label: "Identify plant parts and their functions." },
              { code: "UK.SC.3.B2", label: "Describe nutrition, skeletons and movement in animals." },
            ],
          },
        ],
      },
    ],
  },
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function recentLabel(value?: string | null) {
  const trimmed = safe(value);
  if (!trimmed) return "Not yet";
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  const diffDays = Math.round((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "Today";
  if (diffDays <= 7) return `${diffDays}d ago`;
  return parsed.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function frameworkPreset(market: string): FrameworkPreset {
  if (market === "us") return FRAMEWORK_PRESETS.us;
  if (market === "uk") return FRAMEWORK_PRESETS.uk;
  return FRAMEWORK_PRESETS.au;
}

function normalizeSubjectKey(value: string) {
  return safe(value).toLowerCase();
}

function subjectSignalMap(args: {
  evidenceRows: EvidenceRow[];
  plannerSubjects: string[];
  preset: FrameworkPreset;
}) {
  const evidenceMap = new Map<string, { count: number; recentCount: number; lastTouchedAt?: string | null }>();
  const plannerMap = new Map<string, number>();
  const recentCutoff = Date.now() - 1000 * 60 * 60 * 24 * 30;

  for (const subject of args.preset.subjects) {
    evidenceMap.set(subject.id, { count: 0, recentCount: 0, lastTouchedAt: null });
    plannerMap.set(subject.id, 0);
  }

  args.evidenceRows.forEach((row) => {
    const area = normalizeSubjectKey(safe(row.learning_area));
    const subject = args.preset.subjects.find((item) => item.aliases.some((alias) => area.includes(alias)));
    if (!subject) return;

    const next = evidenceMap.get(subject.id)!;
    next.count += 1;
    const touchedAt = safe(row.occurred_on) || safe(row.created_at) || null;
    if (touchedAt) {
      const parsed = new Date(`${touchedAt}T00:00:00`);
      if (!Number.isNaN(parsed.getTime()) && parsed.getTime() >= recentCutoff) {
        next.recentCount += 1;
      }
      next.lastTouchedAt = touchedAt;
    }
  });

  args.plannerSubjects.forEach((subjectName) => {
    const normalized = normalizeSubjectKey(subjectName);
    const subject = args.preset.subjects.find((item) => item.aliases.some((alias) => normalized.includes(alias)));
    if (!subject) return;
    plannerMap.set(subject.id, (plannerMap.get(subject.id) ?? 0) + 1);
  });

  return { evidenceMap, plannerMap };
}

function deriveOutcomeStatusPlan(args: {
  outcomeCount: number;
  evidenceCount: number;
  recentCount: number;
  planCount: number;
}) {
  const signal = args.evidenceCount * 2 + args.recentCount + args.planCount;
  const understood = signal <= 0 ? 0 : Math.min(args.outcomeCount, Math.floor(signal / 3));
  const inProgress = signal <= 0 ? 0 : Math.min(args.outcomeCount - understood, Math.max(1, args.planCount > 0 ? 1 : 0));
  const needsSupport =
    args.evidenceCount > 0 && args.recentCount === 0 && args.planCount === 0 && args.outcomeCount - understood - inProgress > 0
      ? 1
      : 0;

  return { understood, inProgress, needsSupport };
}

function statusForOutcome(index: number, plan: { understood: number; inProgress: number; needsSupport: number }): CoverageStatus {
  if (index < plan.understood) return "understood";
  if (index < plan.understood + plan.inProgress) return "in_progress";
  if (index < plan.understood + plan.inProgress + plan.needsSupport) return "needs_support";
  return "not_started";
}

export default function FamilyCurriculumMapWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);
  const [plannerSubjects, setPlannerSubjects] = useState<string[]>([]);
  const [loadingCoverage, setLoadingCoverage] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [expandedStrands, setExpandedStrands] = useState<Record<string, string | null>>({});

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);
  const canonicalReady =
    Boolean(workspace.userId) &&
    workspace.storageMode === "database" &&
    Boolean(workspace.profile?.id) &&
    workspace.profile.id !== "local" &&
    Boolean(activeLearner?.id);

  useEffect(() => {
    let mounted = true;

    async function hydrateCurriculum() {
      if (!hasActiveLearner) {
        if (mounted) {
          setEvidenceRows([]);
          setPlannerSubjects([]);
          setLoadingCoverage(false);
        }
        return;
      }

      if (!canonicalReady || !activeLearner?.id) {
        if (mounted) {
          setEvidenceRows([]);
          setPlannerSubjects([]);
          setLoadingCoverage(false);
        }
        return;
      }

      try {
        setLoadingCoverage(true);

        const monday = startOfWeek(new Date());
        const friday = addDays(monday, 4);

        const [evidence, calendarWindow] = await Promise.all([
          loadEvidenceEntriesWithVariants<EvidenceRow>(EVIDENCE_SELECTS, {
            studentId: activeLearner.id,
            limit: 80,
          }),
          loadFamilyCalendarWindow({
            familyProfileId: workspace.profile.id,
            studentId: activeLearner.id,
            dateFrom: ymd(monday),
            dateTo: ymd(friday),
          }).catch(() => ({ dayNotes: {}, blocks: {} })),
        ]);

        if (!mounted) return;

        const weekSubjects = Object.values(calendarWindow.blocks)
          .flat()
          .map((item) => safe(item.subject))
          .filter(Boolean);

        setEvidenceRows(evidence);
        setPlannerSubjects(weekSubjects);
      } finally {
        if (mounted) setLoadingCoverage(false);
      }
    }

    void hydrateCurriculum();

    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, canonicalReady, hasActiveLearner, workspace.profile?.id]);

  const preset = frameworkPreset(workspace.profile.preferred_market);

  useEffect(() => {
    if (!selectedSubjectId || !preset.subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(preset.subjects[0]?.id || "");
    }
  }, [preset, selectedSubjectId]);

  const mapState: HomeSurfaceState = workspaceLoading || loadingCoverage
    ? "loading"
    : !hasLearners || !hasActiveLearner
      ? "empty"
      : canonicalReady
        ? evidenceRows.length || plannerSubjects.length
          ? "live"
          : "empty"
        : "placeholder";

  const learnerSelectorState: HomeSurfaceState = workspaceLoading
    ? "loading"
    : hasLearners
      ? workspace.storageMode === "database"
        ? "derived"
        : "placeholder"
      : "empty";

  const { evidenceMap, plannerMap } = useMemo(
    () => subjectSignalMap({ evidenceRows, plannerSubjects, preset }),
    [evidenceRows, plannerSubjects, preset],
  );

  const subjectViews = useMemo(() => {
    return preset.subjects.map((subject) => {
      const evidenceSignal = evidenceMap.get(subject.id) ?? { count: 0, recentCount: 0, lastTouchedAt: null };
      const planSignal = plannerMap.get(subject.id) ?? 0;

      const strands: StrandCoverageView[] = subject.strands.map((strand) => {
        const plan = deriveOutcomeStatusPlan({
          outcomeCount: strand.outcomes.length,
          evidenceCount: evidenceSignal.count,
          recentCount: evidenceSignal.recentCount,
          planCount: planSignal,
        });

        const counts: Record<CoverageStatus, number> = {
          not_started: 0,
          in_progress: 0,
          understood: 0,
          needs_support: 0,
        };

        const outcomes: OutcomeCoverageView[] = strand.outcomes.map((outcome, index) => {
          const status = statusForOutcome(index, plan);
          counts[status] += 1;

          return {
            id: `${subject.id}-${strand.id}-${outcome.code}`,
            code: outcome.code,
            label: outcome.label,
            status,
            evidenceCount:
              status === "understood"
                ? Math.max(2, evidenceSignal.count)
                : status === "in_progress"
                  ? Math.max(1, Math.min(2, evidenceSignal.count || planSignal))
                  : status === "needs_support"
                    ? Math.max(1, evidenceSignal.count)
                    : 0,
            lastTouchedAt:
              status === "not_started"
                ? null
                : recentLabel(evidenceSignal.lastTouchedAt),
            viewHref: `/my-portfolio?learner=${encodeURIComponent(activeLearner?.id || "")}&subject=${encodeURIComponent(subject.title)}`,
          };
        });

        return {
          id: strand.id,
          title: strand.title,
          counts,
          outcomes,
        };
      });

      const totalCounts = strands.reduce<Record<CoverageStatus, number>>(
        (acc, strand) => {
          acc.not_started += strand.counts.not_started;
          acc.in_progress += strand.counts.in_progress;
          acc.understood += strand.counts.understood;
          acc.needs_support += strand.counts.needs_support;
          return acc;
        },
        { not_started: 0, in_progress: 0, understood: 0, needs_support: 0 },
      );

      return {
        id: subject.id,
        title: subject.title,
        strands,
        counts: totalCounts,
      };
    });
  }, [activeLearner?.id, evidenceMap, plannerMap, preset]);

  const selectedSubject =
    subjectViews.find((subject) => subject.id === selectedSubjectId) ?? subjectViews[0];
  const selectedSubjectKey = selectedSubject?.id || "";

  const summaryCounts = subjectViews.reduce<Record<CoverageStatus, number>>(
    (acc, subject) => {
      acc.not_started += subject.counts.not_started;
      acc.in_progress += subject.counts.in_progress;
      acc.understood += subject.counts.understood;
      acc.needs_support += subject.counts.needs_support;
      return acc;
    },
    { not_started: 0, in_progress: 0, understood: 0, needs_support: 0 },
  );

  const totalOutcomes =
    summaryCounts.not_started +
    summaryCounts.in_progress +
    summaryCounts.understood +
    summaryCounts.needs_support;

  const coverageConfidence =
    mapState === "placeholder"
      ? 62
      : totalOutcomes
        ? Math.round(((summaryCounts.understood + summaryCounts.in_progress * 0.6) / totalOutcomes) * 100)
        : 0;

  const summaryCards = [
    {
      label: "Coverage confidence",
      value: mapState === "loading" ? "" : mapState === "empty" ? "Not yet" : `${coverageConfidence}%`,
      note:
        mapState === "live"
          ? "Coverage becomes clearer as planning and evidence connect"
          : hasActiveLearner
            ? "Coverage confidence will build from tagged blocks and captures"
            : "Choose a learner to begin",
    },
    {
      label: "Understood",
      value: mapState === "loading" ? "" : String(summaryCounts.understood),
      note: "Outcomes that already feel secure",
    },
    {
      label: "In progress",
      value: mapState === "loading" ? "" : String(summaryCounts.in_progress),
      note: "Outcomes currently strengthening",
    },
    {
      label: "Focus areas",
      value: mapState === "loading" ? "" : String(summaryCounts.needs_support + summaryCounts.not_started),
      note: "Outcomes that still need attention",
    },
  ];

  const subjectTabs: SubjectCoverageTabData[] = subjectViews.map((subject) => ({
    id: subject.id,
    title: subject.title,
    counts: subject.counts,
  }));

  useEffect(() => {
    if (!selectedSubject) return;
    setExpandedStrands((prev) => {
      const current = prev[selectedSubjectKey];
      if (current) return prev;
      return { ...prev, [selectedSubjectKey]: selectedSubject.strands[0]?.id || null };
    });
  }, [selectedSubject, selectedSubjectKey]);

  const nextMove =
    !hasActiveLearner
      ? {
          title: "Choose a learner first",
          note: "Once a learner is in focus, Curriculum Map can turn planning and evidence into visible coverage.",
          href: "/profile",
          cta: "Open My Profile",
          state: "empty" as HomeSurfaceState,
        }
      : mapState === "empty"
        ? {
            title: `Tag the first curriculum signal for ${activeLearner?.label || "this learner"}`,
            note: "Start by planning one tagged learning block or capturing one linked learning moment.",
            href: "/my-plan",
            cta: "Open My Plan",
            state: "empty" as HomeSurfaceState,
          }
        : {
            title: `Strengthen ${selectedSubject?.title || "the next subject"} coverage`,
            note:
              summaryCounts.needs_support > 0
                ? `Add one more capture to support ${selectedSubject?.strands.find((strand) => strand.counts.needs_support > 0)?.title || "the next strand"}.`
                : `Plan one learning block for ${selectedSubject?.strands.find((strand) => strand.counts.not_started > 0)?.title || "the next strand"} this week.`,
            href: summaryCounts.needs_support > 0 ? "/capture" : "/my-plan",
            cta: summaryCounts.needs_support > 0 ? "Capture Evidence" : "Open My Plan",
            state: mapState,
          };

  return (
    <FamilyTopNavShell
      subtitle="Curriculum Map"
      heroTitle="Curriculum Map"
      heroText="See what has been covered, what is strengthening, and what to focus on next."
      heroAsideTitle="Coverage Snapshot"
      heroAsideText="Keep curriculum visible without turning planning into admin."
    >
      <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        <CurriculumFrameworkSummaryBar
          framework={preset.framework}
          jurisdiction={preset.jurisdiction}
          yearBand={activeLearner?.yearLabel || "Year band not set"}
          subjectsLabel={preset.subjects.map((subject) => subject.title).slice(0, 4).join(", ")}
          state={mapState}
        />

        <CoverageSummaryCards cards={summaryCards} state={mapState} />

        <SubjectCoverageTabs
          subjects={subjectTabs}
          selectedSubjectId={selectedSubjectKey}
          onSelect={setSelectedSubjectId}
          state={mapState}
        />

        <CoverageLegend />

        {mapState === "empty" && hasActiveLearner ? (
          <CurriculumMapEmptyState learnerName={activeLearner?.label || "this learner"} />
        ) : null}

        <section className="grid gap-4">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Strand coverage
            </div>
            <h2 className="text-[18px] font-bold tracking-tight text-slate-950">
              {selectedSubject?.title || "Coverage"}
            </h2>
          </div>

          <div className="grid gap-4">
            {(selectedSubject?.strands || []).map((strand) => (
              <StrandCoverageCard
                key={strand.id}
                strand={strand}
                expanded={expandedStrands[selectedSubjectKey] === strand.id}
                onToggle={() =>
                  setExpandedStrands((prev) => ({
                    ...prev,
                    [selectedSubjectKey]:
                      prev[selectedSubjectKey] === strand.id ? null : strand.id,
                  }))
                }
                state={mapState}
              />
            ))}
          </div>
        </section>

        <CurriculumNextMoveCard
          title={nextMove.title}
          note={nextMove.note}
          href={nextMove.href}
          cta={nextMove.cta}
          state={nextMove.state}
        />
      </div>
    </FamilyTopNavShell>
  );
}
