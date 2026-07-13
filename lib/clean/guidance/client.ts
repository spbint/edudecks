import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import type {
  BuildCleanGuidanceCardsInput,
  CleanGuidanceCard,
  CleanGuidanceState,
  CleanGuidanceStateInput,
  CleanGuidanceStepKey,
} from "@/lib/clean/guidance/types";

type GuidanceStateRow = {
  id: string;
  family_id: string;
  current_step_key?: string | null;
  completed_steps?: unknown;
  dismissed_steps?: unknown;
  is_my_day_ready?: boolean | null;
  notes?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizeBoolean(value: unknown) {
  return value === true;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => safe(item)).filter(Boolean)
    : [];
}

function normalizeStepKey(value: unknown): CleanGuidanceStepKey | null {
  const step = safe(value) as CleanGuidanceStepKey;
  return step || null;
}

function toCleanGuidanceState(row: GuidanceStateRow): CleanGuidanceState {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    currentStepKey: normalizeStepKey(row.current_step_key),
    completedSteps: normalizeStringArray(row.completed_steps),
    dismissedSteps: normalizeStringArray(row.dismissed_steps),
    isMyDayReady: normalizeBoolean(row.is_my_day_ready),
    notes: normalizeNullString(row.notes),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

export function buildCleanGuidanceCards(
  input: BuildCleanGuidanceCardsInput,
): CleanGuidanceCard[] {
  const openCards: Omit<CleanGuidanceCard, "status">[] = [];

  if (!input.hasFamilyProfile) {
    openCards.push({
      key: "family-profile",
      title: "Set up your family",
      description: "Create your family profile first so everything else has a home.",
      actionLabel: "Open My Profile",
      actionHref: "/my-profile",
    });
  }

  if (input.hasFamilyProfile && input.learnerCount === 0) {
    openCards.push({
      key: "learners",
      title: "Add learners",
      description: "Add each child before planning the year, the week, or today.",
      actionLabel: "Add learners",
      actionHref: "/my-profile",
    });
  }

  if (input.learnerCount > 0 && !input.hasJurisdictionProfile) {
    openCards.push({
      key: "jurisdiction",
      title: "Set country, state and reporting context",
      description:
        "This helps MyLearna shape portfolios and reports for your location.",
      actionLabel: "Open My Settings",
      actionHref: "/my-settings",
    });
  }

  if (input.hasJurisdictionProfile && !input.hasAcademicYear) {
    openCards.push({
      key: "academic-year",
      title: "Set your learning year",
      description: "Add the year first so My Calendar knows the bigger date window to plan inside.",
      actionLabel: "Open My Calendar",
      actionHref: "/my-calendar",
    });
  }

  if (input.hasAcademicYear && !input.hasLearningPeriods) {
    openCards.push({
      key: "learning-periods",
      title: "Add your term dates",
      description: "Set your learning terms and breaks so My Calendar knows when to plan.",
      actionLabel: "Set learning periods",
      actionHref: "/my-calendar",
    });
  }

  if (input.hasLearningPeriods && !input.hasMasterTemplate) {
    openCards.push({
      key: "master-template",
      title: "Create a master week",
      description: "Set up a reusable week that you can later pour into This week when you need it.",
      actionLabel: "Build master week",
      actionHref: "/my-calendar",
    });
  }

  if (input.hasMasterTemplate && !input.hasEvidence) {
    openCards.push({
      key: "pathways",
      title: "Open My Pathways",
      description:
        "Use guided pathway steps to see what comes next before you capture evidence.",
      actionLabel: "Open My Pathways",
      actionHref: "/my-pathways",
    });
  }

  if ((input.hasMasterTemplate || input.hasPrograms) && !input.hasCurrentWeekItems) {
    openCards.push({
      key: "generate-week",
      title: "Plan this week",
      description:
        "Place a few learning blocks into this week so My Day has something useful to run.",
      actionLabel: "Open My Calendar",
      actionHref: "/my-calendar",
    });
  }

  if (input.hasTodayItems && !input.hasEvidence) {
    openCards.push({
      key: "capture",
      title: "Capture today",
      description:
        "Use one of today's planned blocks as the anchor for your first learning note.",
      actionLabel: "Open My Capture",
      actionHref: "/my-capture",
    });
  }

  if (input.hasEvidence && !input.hasPortfolioHighlights) {
    openCards.push({
      key: "portfolio",
      title: "Choose portfolio highlights",
      description: "Turn your strongest evidence into shareable highlights.",
      actionLabel: "Open My Portfolio",
      actionHref: "/my-portfolio",
    });
  }

  if (
    input.learnerCount > 0 &&
    (input.hasEvidence || input.hasPortfolioHighlights) &&
    !input.hasReports
  ) {
    openCards.push({
      key: "reports",
      title: "Prepare a report",
      description: input.hasPortfolioHighlights
        ? "You already have portfolio highlights. Start a report and bring those notes into sections."
        : "Once you have evidence, you can start shaping a report for the learner.",
      actionLabel: "Open My Reports",
      actionHref: "/my-reports",
    });
  }

  return openCards.map((card, index) => ({
    ...card,
    status: index === 0 ? "next" : "available",
  }));
}

export async function loadCleanGuidanceState(familyId: string) {
  const response = await supabase
    .from("guidance_states")
    .select(
      "id,family_id,current_step_key,completed_steps,dismissed_steps,is_my_day_ready,notes,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .maybeSingle();

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load the clean guidance state just now.",
      ),
    );
  }

  return response.data ? toCleanGuidanceState(response.data as GuidanceStateRow) : null;
}

export async function upsertCleanGuidanceState(
  familyId: string,
  input: CleanGuidanceStateInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before saving guidance state.");
  }

  const response = await supabase
    .from("guidance_states")
    .upsert(
      {
        family_id: familyId,
        current_step_key: normalizeNullString(input.currentStepKey),
        completed_steps: input.completedSteps ?? [],
        dismissed_steps: input.dismissedSteps ?? [],
        is_my_day_ready: input.isMyDayReady === true,
        notes: normalizeNullString(input.notes),
        created_by_user_id: currentUserId,
      },
      { onConflict: "family_id" },
    )
    .select(
      "id,family_id,current_step_key,completed_steps,dismissed_steps,is_my_day_ready,notes,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to save the clean guidance state.",
      ),
    );
  }

  return toCleanGuidanceState(response.data as GuidanceStateRow);
}
