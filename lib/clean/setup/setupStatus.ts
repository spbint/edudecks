import type { CleanAcademicYear, CleanLearningPeriod } from "@/lib/clean/terms/types";
import type { FamilyProfile } from "@/lib/clean/family/types";
import type { Learner } from "@/lib/clean/learners/types";

export function isBreakLearningPeriod(
  period: Pick<CleanLearningPeriod, "isBreak" | "periodType">,
) {
  return period.isBreak || period.periodType === "break";
}

export function getTeachingPeriods(periods: CleanLearningPeriod[]) {
  return periods.filter((period) => !isBreakLearningPeriod(period));
}

export function getBreakPeriods(periods: CleanLearningPeriod[]) {
  return periods.filter((period) => isBreakLearningPeriod(period));
}

export function getPeriodForDate(periods: CleanLearningPeriod[], dateValue: string) {
  return (
    periods.find((period) => period.startsOn <= dateValue && period.endsOn >= dateValue) ?? null
  );
}

export function derivePlanningSetupStatus({
  academicYears,
  learningPeriods,
  selectedAcademicYearId,
  today,
}: {
  academicYears: CleanAcademicYear[];
  learningPeriods: CleanLearningPeriod[];
  selectedAcademicYearId?: string | null;
  today: string;
}) {
  const visibleLearningPeriods = selectedAcademicYearId
    ? learningPeriods.filter((period) => period.academicYearId === selectedAcademicYearId)
    : learningPeriods;
  const teachingPeriods = getTeachingPeriods(visibleLearningPeriods);
  const breakPeriods = getBreakPeriods(visibleLearningPeriods);

  return {
    visibleLearningPeriods,
    teachingPeriods,
    breakPeriods,
    hasLearningYear: academicYears.length > 0,
    hasLearningPeriod: teachingPeriods.length > 0,
    hasBreaks: breakPeriods.length > 0,
    activeLearningPeriod: getPeriodForDate(teachingPeriods, today),
    currentBreakPeriod: getPeriodForDate(breakPeriods, today),
    learningPeriodCount: teachingPeriods.length,
    breakCount: breakPeriods.length,
  };
}

export type CleanSetupNextActionType =
  | "create-family-profile"
  | "add-learner"
  | "save-learning-settings"
  | "create-learning-year"
  | "add-teaching-period"
  | "choose-pathway"
  | "continue-pathway"
  | "capture-evidence"
  | "curate-portfolio"
  | "create-report";

export type CleanSetupNextAction = {
  type: CleanSetupNextActionType;
  label: string;
  href: string;
  category: "setup" | "learning" | "progress";
};

export type CleanSetupRecordCounts = {
  learningYears: number;
  teachingPeriods: number;
  breaks: number;
  pathways: number;
  evidence: number;
  portfolioItems: number;
  reports: number;
};

export type CleanSetupStatus = {
  hasFamilyProfile: boolean;
  hasLearner: boolean;
  hasLearningSettings: boolean;
  hasLearningYear: boolean;
  hasTeachingPeriod: boolean;
  hasPathway: boolean;
  hasEvidence: boolean;
  hasPortfolioItem: boolean;
  hasReport: boolean;
  learners: Learner[];
  activeLearnerId: string | null;
  activeLearner: Learner | null;
  familyDisplayName: string;
  counts: CleanSetupRecordCounts;
  nextAction: CleanSetupNextAction;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function getCleanFamilyDisplayName(profile: FamilyProfile | null) {
  return safe(profile?.displayName) || "Your family's learning week";
}

export function getCleanLearnerLabel(learner: Learner | null | undefined) {
  return safe(learner?.preferredName) || safe(learner?.firstName) || "Learner";
}

export function hasCleanLearningSettings(profile: FamilyProfile | null) {
  if (!profile) return false;
  const countryCode = safe(profile.countryCode);
  const curriculumFrameworkId = safe(profile.curriculumFrameworkId);
  const reportingMode = safe(profile.reportingMode);
  const jurisdictionCode = safe(profile.jurisdictionCode);
  const needsJurisdiction =
    countryCode === "AU" || countryCode === "US" || countryCode === "UK";

  return Boolean(
    countryCode &&
      curriculumFrameworkId &&
      reportingMode &&
      (!needsJurisdiction || jurisdictionCode),
  );
}

export function resolveCleanActiveLearner({
  learners,
  routeLearnerId,
  rememberedLearnerId,
  defaultLearnerId,
}: {
  learners: Learner[];
  routeLearnerId?: string | null;
  rememberedLearnerId?: string | null;
  defaultLearnerId?: string | null;
}) {
  const candidates = [routeLearnerId, rememberedLearnerId, defaultLearnerId]
    .map(safe)
    .filter(Boolean);

  for (const candidate of candidates) {
    const learner = learners.find((item) => item.id === candidate);
    if (learner) return learner;
  }

  return learners.length === 1 ? learners[0] : null;
}

export function deriveCleanSetupStatus({
  profile,
  learners,
  activeLearner,
  counts,
}: {
  profile: FamilyProfile | null;
  learners: Learner[];
  activeLearner: Learner | null;
  counts: CleanSetupRecordCounts;
}): CleanSetupStatus {
  const hasFamilyProfile = Boolean(profile);
  const hasLearner = learners.length > 0;
  const hasLearningSettings = hasCleanLearningSettings(profile);
  const hasLearningYear = counts.learningYears > 0;
  const hasTeachingPeriod = counts.teachingPeriods > 0;
  const hasPathway = counts.pathways > 0;
  const hasEvidence = counts.evidence > 0;
  const hasPortfolioItem = counts.portfolioItems > 0;
  const hasReport = counts.reports > 0;
  const activeLearnerLabel = getCleanLearnerLabel(activeLearner);

  let nextAction: CleanSetupNextAction;
  if (!hasFamilyProfile) {
    nextAction = {
      type: "create-family-profile",
      label: "Create family profile",
      href: "/my-profile",
      category: "setup",
    };
  } else if (!hasLearner) {
    nextAction = {
      type: "add-learner",
      label: "Add a learner",
      href: "/my-profile",
      category: "setup",
    };
  } else if (!hasLearningSettings) {
    nextAction = {
      type: "save-learning-settings",
      label: "Save learning settings",
      href: "/my-settings",
      category: "setup",
    };
  } else if (!hasLearningYear) {
    nextAction = {
      type: "create-learning-year",
      label: "Set up your learning year",
      href: "/my-calendar",
      category: "setup",
    };
  } else if (!hasTeachingPeriod) {
    nextAction = {
      type: "add-teaching-period",
      label: "Add your first learning period",
      href: "/my-calendar",
      category: "setup",
    };
  } else if (!hasPathway) {
    nextAction = {
      type: "choose-pathway",
      label: "Choose a starting pathway",
      href: activeLearner ? `/my-pathways?learnerId=${encodeURIComponent(activeLearner.id)}` : "/my-pathways",
      category: "learning",
    };
  } else if (!hasEvidence) {
    nextAction = {
      type: "continue-pathway",
      label: activeLearner ? `Continue ${activeLearnerLabel}'s current pathway` : "Continue current pathway",
      href: activeLearner ? `/my-pathways?learnerId=${encodeURIComponent(activeLearner.id)}` : "/my-pathways",
      category: "learning",
    };
  } else if (!hasPortfolioItem) {
    nextAction = {
      type: "curate-portfolio",
      label: "Choose evidence for portfolio",
      href: "/my-portfolio",
      category: "progress",
    };
  } else if (!hasReport) {
    nextAction = {
      type: "create-report",
      label: "Create a report",
      href: activeLearner ? `/my-reports?learner_id=${encodeURIComponent(activeLearner.id)}` : "/my-reports",
      category: "progress",
    };
  } else {
    nextAction = {
      type: "capture-evidence",
      label: "Add more evidence when learning happens",
      href: activeLearner ? `/my-capture?learnerId=${encodeURIComponent(activeLearner.id)}` : "/my-capture",
      category: "progress",
    };
  }

  return {
    hasFamilyProfile,
    hasLearner,
    hasLearningSettings,
    hasLearningYear,
    hasTeachingPeriod,
    hasPathway,
    hasEvidence,
    hasPortfolioItem,
    hasReport,
    learners,
    activeLearnerId: activeLearner?.id ?? null,
    activeLearner,
    familyDisplayName: getCleanFamilyDisplayName(profile),
    counts,
    nextAction,
  };
}
