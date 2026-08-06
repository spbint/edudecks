import type { CleanWorkspaceState } from "@/lib/clean/workspace/types";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import { listCleanPortfolioHighlights } from "@/lib/clean/portfolio/client";
import { listCleanReports } from "@/lib/clean/reports/client";
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import {
  hasAnyPathwayPlacementForLearner,
} from "@/lib/clean/pathways/pathwayPlacement";
import {
  listCleanAcademicYears,
  listCleanLearningPeriods,
} from "@/lib/clean/terms/client";
import {
  listCleanMasterTemplates,
  listCleanTemplateBlocks,
} from "@/lib/clean/templates/client";
import {
  deriveCleanSetupStatus,
  getTeachingPeriods,
  resolveCleanActiveLearner,
  countValidCleanWeeklyBlocks,
  type CleanSetupRecordCounts,
  type CleanSetupStatus,
} from "@/lib/clean/setup/setupStatus";

const ACTIVE_LEARNER_STORAGE_KEY = "mylearna.clean.activeLearnerByFamily.v1";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function readActiveLearnerMap() {
  if (typeof window === "undefined") return {} as Record<string, string>;

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(ACTIVE_LEARNER_STORAGE_KEY) || "{}",
    );
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

export function readRememberedCleanActiveLearnerId(familyId: string | null | undefined) {
  const cleanFamilyId = safe(familyId);
  if (!cleanFamilyId) return null;
  return safe(readActiveLearnerMap()[cleanFamilyId]) || null;
}

export function writeRememberedCleanActiveLearnerId(
  familyId: string | null | undefined,
  learnerId: string | null | undefined,
) {
  if (typeof window === "undefined") return;
  const cleanFamilyId = safe(familyId);
  if (!cleanFamilyId) return;

  const map = readActiveLearnerMap();
  const cleanLearnerId = safe(learnerId);
  if (cleanLearnerId) {
    map[cleanFamilyId] = cleanLearnerId;
  } else {
    delete map[cleanFamilyId];
  }
  window.localStorage.setItem(ACTIVE_LEARNER_STORAGE_KEY, JSON.stringify(map));
}

export function buildEmptyCleanSetupStatus(
  workspace: Pick<CleanWorkspaceState, "profile" | "learners">,
): CleanSetupStatus {
  return deriveCleanSetupStatus({
    profile: workspace.profile,
    learners: workspace.learners,
    activeLearner: resolveCleanActiveLearner({
      learners: workspace.learners,
      defaultLearnerId: workspace.profile?.defaultLearnerId ?? null,
    }),
    counts: {
      learningYears: 0,
      teachingPeriods: 0,
      breaks: 0,
      pathways: 0,
      evidence: 0,
      portfolioItems: 0,
      reports: 0,
      weeklyBlocks: 0,
    },
  });
}

export async function loadCleanSetupStatus(
  workspace: Pick<CleanWorkspaceState, "profile" | "learners">,
  options: {
    routeLearnerId?: string | null;
  } = {},
) {
  const profile = workspace.profile;
  const activeLearner = resolveCleanActiveLearner({
    learners: workspace.learners,
    routeLearnerId: options.routeLearnerId,
    rememberedLearnerId: readRememberedCleanActiveLearnerId(profile?.id),
    defaultLearnerId: profile?.defaultLearnerId ?? null,
  });

  if (!profile) {
    return buildEmptyCleanSetupStatus(workspace);
  }

  const [academicYears, learningPeriods, evidenceEntries, portfolioHighlights, reports, masterTemplates, liveCalendarItems] =
    await Promise.all([
      listCleanAcademicYears(profile.id, { limit: 20 }),
      listCleanLearningPeriods(profile.id, { limit: 100 }),
      listCleanEvidenceEntries(profile.id, {
        learnerId: activeLearner?.id ?? null,
        limit: 1,
      }),
      listCleanPortfolioHighlights(profile.id, {
        learnerId: activeLearner?.id ?? null,
        limit: 1,
      }),
      listCleanReports(profile.id, {
        learnerId: activeLearner?.id ?? null,
        limit: 1,
      }),
      listCleanMasterTemplates(profile.id, { isActive: true, limit: 20 }),
      listCleanCalendarItems(profile.id, { limit: 100 }),
    ]);

  const templateBlocks = (
    await Promise.all(
      masterTemplates.map((template) =>
        listCleanTemplateBlocks(profile.id, template.id),
      ),
    )
  ).flat();

  const hasPathway = activeLearner
    ? hasAnyPathwayPlacementForLearner(activeLearner.id)
    : false;
  const teachingPeriods = getTeachingPeriods(learningPeriods);
  const counts: CleanSetupRecordCounts = {
    learningYears: academicYears.length,
    teachingPeriods: teachingPeriods.length,
    breaks: learningPeriods.length - teachingPeriods.length,
    pathways: hasPathway ? 1 : 0,
    evidence: evidenceEntries.length,
    portfolioItems: portfolioHighlights.length,
    reports: reports.length,
    weeklyBlocks: countValidCleanWeeklyBlocks({
      familyId: profile.id,
      liveWeekBlocks: liveCalendarItems,
      templateBlocks,
    }),
  };

  if (activeLearner) {
    writeRememberedCleanActiveLearnerId(profile.id, activeLearner.id);
  }

  return deriveCleanSetupStatus({
    profile,
    learners: workspace.learners,
    activeLearner,
    counts,
  });
}
