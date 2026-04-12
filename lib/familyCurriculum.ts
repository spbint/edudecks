import type { CurriculumPreferences } from "@/lib/familySettings";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

export type LearnerOutcomeStatusKey =
  | "not_introduced"
  | "planned"
  | "in_progress"
  | "assessed"
  | "secure"
  | "needs_review";

export type LearnerCurriculumProfileRow = {
  id: string;
  student_id: string;
  framework_id: string;
  level_id: string;
  jurisdiction: string | null;
  reporting_mode: string | null;
  is_active: boolean;
  started_on: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CurriculumFrameworkSummary = {
  id: string;
  code: string;
  name: string;
  country: string;
  jurisdiction: string | null;
  version: string;
};

export type CurriculumLevelSummary = {
  id: string;
  framework_id: string;
  level_code: string;
  level_label: string;
  level_type: string;
  sort_order: number;
};

export type CurriculumOutcomeRow = {
  id: string;
  code: string;
  short_label: string;
  full_text: string;
  learning_area_id: string;
  strand_id: string;
  status: LearnerOutcomeStatusKey;
};

export type CurriculumStrandGroup = {
  id: string;
  code: string;
  name: string;
  outcomes: CurriculumOutcomeRow[];
};

export type CurriculumLearningAreaGroup = {
  id: string;
  code: string;
  name: string;
  strands: CurriculumStrandGroup[];
  counts: Record<LearnerOutcomeStatusKey, number>;
};

export type LearnerCurriculumPageData = {
  learnerProfile: LearnerCurriculumProfileRow | null;
  framework: CurriculumFrameworkSummary | null;
  level: CurriculumLevelSummary | null;
  statusCounts: Record<LearnerOutcomeStatusKey, number>;
  areas: CurriculumLearningAreaGroup[];
  totalOutcomes: number;
  trackedOutcomeCount: number;
};

const EMPTY_COUNTS: Record<LearnerOutcomeStatusKey, number> = {
  not_introduced: 0,
  planned: 0,
  in_progress: 0,
  assessed: 0,
  secure: 0,
  needs_review: 0,
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value: unknown): LearnerOutcomeStatusKey {
  const key = safe(value).toLowerCase();
  if (key === "planned") return "planned";
  if (key === "in_progress") return "in_progress";
  if (key === "assessed") return "assessed";
  if (key === "secure") return "secure";
  if (key === "needs_review") return "needs_review";
  return "not_introduced";
}

async function maybeSingle<T>(query: PromiseLike<{ data: T | null; error: unknown }>) {
  const response = await query;
  if (response.error) {
    throw response.error;
  }
  return response.data ?? null;
}

export async function loadActiveLearnerCurriculumProfile(
  studentId: string,
): Promise<LearnerCurriculumProfileRow | null> {
  if (!hasSupabaseEnv || !safe(studentId)) return null;

  return maybeSingle(
    supabase
      .from("learner_curriculum_profiles")
      .select(
        "id,student_id,framework_id,level_id,jurisdiction,reporting_mode,is_active,started_on,created_at,updated_at",
      )
      .eq("student_id", studentId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

async function loadFrameworkSummary(
  frameworkId: string,
): Promise<CurriculumFrameworkSummary | null> {
  if (!safe(frameworkId)) return null;

  return maybeSingle(
    supabase
      .from("curriculum_frameworks")
      .select("id,code,name,country,jurisdiction,version")
      .eq("id", frameworkId)
      .maybeSingle(),
  );
}

async function loadLevelSummary(
  levelId: string,
): Promise<CurriculumLevelSummary | null> {
  if (!safe(levelId)) return null;

  return maybeSingle(
    supabase
      .from("curriculum_levels")
      .select("id,framework_id,level_code,level_label,level_type,sort_order")
      .eq("id", levelId)
      .maybeSingle(),
  );
}

export async function loadLearnerCurriculumPageData(input: {
  studentId: string;
  familyPreferences: CurriculumPreferences;
}): Promise<LearnerCurriculumPageData | null> {
  if (!hasSupabaseEnv || !safe(input.studentId)) return null;

  const learnerProfile = await loadActiveLearnerCurriculumProfile(input.studentId);
  const frameworkId =
    safe(learnerProfile?.framework_id) || safe(input.familyPreferences.framework_id);
  const levelId =
    safe(learnerProfile?.level_id) || safe(input.familyPreferences.level_id);

  if (!frameworkId || !levelId) {
    return {
      learnerProfile,
      framework: null,
      level: null,
      statusCounts: { ...EMPTY_COUNTS },
      areas: [],
      totalOutcomes: 0,
      trackedOutcomeCount: 0,
    };
  }

  const [framework, level, areasResponse, strandsResponse, outcomesResponse] =
    await Promise.all([
      loadFrameworkSummary(frameworkId),
      loadLevelSummary(levelId),
      supabase
        .from("curriculum_learning_areas")
        .select("id,code,name,sort_order")
        .eq("framework_id", frameworkId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("curriculum_strands")
        .select("id,learning_area_id,code,name,sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("curriculum_outcomes")
        .select("id,code,short_label,full_text,learning_area_id,strand_id,sort_order")
        .eq("framework_id", frameworkId)
        .eq("level_id", levelId)
        .order("sort_order", { ascending: true })
        .order("code", { ascending: true }),
    ]);

  if (areasResponse.error) throw areasResponse.error;
  if (strandsResponse.error) throw strandsResponse.error;
  if (outcomesResponse.error) throw outcomesResponse.error;

  const areas = (areasResponse.data ?? []) as Array<{
    id: string;
    code?: string | null;
    name?: string | null;
  }>;
  const areaIds = areas.map((area) => safe(area.id)).filter(Boolean);
  const strands = ((strandsResponse.data ?? []) as Array<{
    id: string;
    learning_area_id?: string | null;
    code?: string | null;
    name?: string | null;
  }>).filter((strand) => areaIds.includes(safe(strand.learning_area_id)));
  const outcomes = (outcomesResponse.data ?? []) as Array<{
    id: string;
    code?: string | null;
    short_label?: string | null;
    full_text?: string | null;
    learning_area_id?: string | null;
    strand_id?: string | null;
  }>;

  const outcomeIds = outcomes.map((outcome) => safe(outcome.id)).filter(Boolean);
  let trackedOutcomeCount = 0;
  const statusMap = new Map<string, LearnerOutcomeStatusKey>();

  if (outcomeIds.length) {
    const statusesResponse = await supabase
      .from("learner_outcome_status")
      .select("outcome_id,status")
      .eq("student_id", input.studentId)
      .in("outcome_id", outcomeIds);

    if (statusesResponse.error) {
      throw statusesResponse.error;
    }

    const statuses = (statusesResponse.data ?? []) as Array<{
      outcome_id?: string | null;
      status?: string | null;
    }>;

    trackedOutcomeCount = statuses.length;
    for (const row of statuses) {
      statusMap.set(safe(row.outcome_id), normalizeStatus(row.status));
    }
  }

  const statusCounts = { ...EMPTY_COUNTS };

  const groupedAreas: CurriculumLearningAreaGroup[] = areas.map((area) => {
    const areaId = safe(area.id);
    const areaCounts = { ...EMPTY_COUNTS };
    const groupedStrands = strands
      .filter((strand) => safe(strand.learning_area_id) === areaId)
      .map((strand) => {
        const strandId = safe(strand.id);
        const groupedOutcomes = outcomes
          .filter(
            (outcome) =>
              safe(outcome.learning_area_id) === areaId &&
              safe(outcome.strand_id) === strandId,
          )
          .map((outcome) => {
            const status = statusMap.get(safe(outcome.id)) ?? "not_introduced";
            areaCounts[status] += 1;
            statusCounts[status] += 1;

            return {
              id: safe(outcome.id),
              code: safe(outcome.code),
              short_label: safe(outcome.short_label),
              full_text: safe(outcome.full_text),
              learning_area_id: areaId,
              strand_id: strandId,
              status,
            } satisfies CurriculumOutcomeRow;
          });

        return {
          id: strandId,
          code: safe(strand.code),
          name: safe(strand.name) || "Unnamed strand",
          outcomes: groupedOutcomes,
        } satisfies CurriculumStrandGroup;
      })
      .filter((strand) => strand.outcomes.length > 0);

    return {
      id: areaId,
      code: safe(area.code),
      name: safe(area.name) || "Unnamed learning area",
      strands: groupedStrands,
      counts: areaCounts,
    } satisfies CurriculumLearningAreaGroup;
  });

  return {
    learnerProfile,
    framework,
    level,
    statusCounts,
    areas: groupedAreas.filter((area) => area.strands.length > 0),
    totalOutcomes: outcomes.length,
    trackedOutcomeCount,
  };
}

export async function ensureLearnerCurriculumProfile(input: {
  studentId: string;
  frameworkId: string;
  levelId: string;
  jurisdiction?: string | null;
  reportingMode?: string | null;
}): Promise<void> {
  if (!safe(input.studentId) || !safe(input.frameworkId) || !safe(input.levelId)) {
    throw new Error("Student, framework, and level are required.");
  }

  const deactivateResponse = await supabase
    .from("learner_curriculum_profiles")
    .update({ is_active: false })
    .eq("student_id", input.studentId)
    .eq("is_active", true);

  if (deactivateResponse.error) {
    throw deactivateResponse.error;
  }

  const upsertResponse = await supabase
    .from("learner_curriculum_profiles")
    .upsert(
      {
        student_id: input.studentId,
        framework_id: input.frameworkId,
        level_id: input.levelId,
        jurisdiction: input.jurisdiction ?? null,
        reporting_mode: input.reportingMode ?? "family_progress",
        is_active: true,
      },
      { onConflict: "student_id,framework_id,level_id" },
    );

  if (upsertResponse.error) {
    throw upsertResponse.error;
  }
}

export async function updateLearnerOutcomeStatus(input: {
  studentId: string;
  outcomeId: string;
  status: LearnerOutcomeStatusKey;
  frameworkId: string;
  levelId: string;
  jurisdiction?: string | null;
}): Promise<void> {
  await ensureLearnerCurriculumProfile({
    studentId: input.studentId,
    frameworkId: input.frameworkId,
    levelId: input.levelId,
    jurisdiction: input.jurisdiction ?? null,
  });

  const response = await supabase
    .from("learner_outcome_status")
    .upsert(
      {
        student_id: input.studentId,
        outcome_id: input.outcomeId,
        status: input.status,
      },
      { onConflict: "student_id,outcome_id" },
    );

  if (response.error) {
    throw response.error;
  }
}
