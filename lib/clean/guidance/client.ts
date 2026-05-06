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
  const cards: CleanGuidanceCard[] = [
    {
      key: "family-profile",
      title: "Set up your family",
      description: "Create the family profile so the clean homeschool system has a home base.",
      actionLabel: "Open My Profile",
      actionHref: "/my-profile",
      status: input.hasFamilyProfile ? "done" : "next",
    },
    {
      key: "learners",
      title: "Add learners",
      description: "Add each child so planning, capture, portfolio, and reports stay family-scoped.",
      actionLabel: "Add learners",
      actionHref: "/my-profile",
      status: input.learnerCount > 0 ? "done" : input.hasFamilyProfile ? "next" : "available",
    },
    {
      key: "jurisdiction",
      title: "Choose country and curriculum",
      description: "Set your homeschool context before planning the year and reporting rhythm.",
      actionLabel: "Review settings",
      actionHref: "/my-settings",
      status:
        input.hasJurisdictionProfile ? "done" : input.learnerCount > 0 ? "next" : "available",
    },
    {
      key: "academic-year",
      title: "Set your learning year",
      description: "Define the academic year before adding terms, breaks, and generated weeks.",
      actionLabel: "Open clean calendar",
      actionHref: "/clean-my-calendar",
      status:
        input.hasAcademicYear ? "done" : input.hasJurisdictionProfile ? "next" : "available",
    },
    {
      key: "learning-periods",
      title: "Add term dates and learning periods",
      description: "Set terms, breaks, or units so generation can skip non-learning days.",
      actionLabel: "Set learning periods",
      actionHref: "/clean-my-calendar",
      status:
        input.hasLearningPeriods ? "done" : input.hasAcademicYear ? "next" : "available",
    },
    {
      key: "master-template",
      title: "Create a weekly rhythm",
      description: "Add a light weekly template only if you want help planning the week.",
      actionLabel: "Build weekly rhythm",
      actionHref: "/clean-my-calendar",
      status:
        input.hasMasterTemplate ? "done" : input.hasLearningPeriods ? "next" : "available",
    },
    {
      key: "programs",
      title: "Add the first program",
      description: "Programs give the generation layer something meaningful to feed into the week.",
      actionLabel: "Open clean programs",
      actionHref: "/clean-my-programs",
      status: input.hasPrograms ? "done" : input.hasMasterTemplate ? "next" : "available",
    },
    {
      key: "generate-week",
      title: "Generate the first week",
      description: "Preview the week from your template and programs before turning it into daily action.",
      actionLabel: "Generate this week",
      actionHref: "/clean-my-calendar",
      status: input.hasCalendarItems ? "done" : input.hasPrograms ? "next" : "available",
    },
    {
      key: "capture",
      title: "Capture the first learning note",
      description: "Start a text-first evidence trail before portfolio and report assembly.",
      actionLabel: "Open clean capture",
      actionHref: "/clean-my-capture",
      status: input.hasEvidence ? "done" : input.hasCalendarItems ? "next" : "available",
    },
    {
      key: "portfolio",
      title: "Choose portfolio highlights",
      description: "Promote meaningful evidence into the portfolio once capture has started.",
      actionLabel: "Open clean portfolio",
      actionHref: "/clean-my-portfolio",
      status:
        input.hasPortfolioHighlights ? "done" : input.hasEvidence ? "next" : "available",
    },
    {
      key: "reports",
      title: "Prepare a report",
      description: "Create the reporting period and report once the family has enough evidence to review.",
      actionLabel: "Open clean reports",
      actionHref: "/clean-my-reports",
      status: input.hasReports ? "done" : input.hasEvidence ? "next" : "available",
    },
  ];

  const firstNext = cards.findIndex((card) => card.status === "next");
  if (firstNext > 0) {
    for (let index = 0; index < firstNext; index += 1) {
      if (cards[index]?.status !== "done") {
        cards[index] = { ...cards[index], status: "available" };
      }
    }
  }

  return cards;
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
