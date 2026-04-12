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
  evidenceCount: number;
  recentEvidenceTitles: string[];
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
  evidenceCount: number;
};

export type LearnerCurriculumPageData = {
  learnerProfile: LearnerCurriculumProfileRow | null;
  framework: CurriculumFrameworkSummary | null;
  level: CurriculumLevelSummary | null;
  statusCounts: Record<LearnerOutcomeStatusKey, number>;
  areas: CurriculumLearningAreaGroup[];
  totalOutcomes: number;
  trackedOutcomeCount: number;
  evidenceLinkedOutcomeCount: number;
  totalEvidenceLinks: number;
};

export type LinkableCurriculumOutcome = {
  id: string;
  code: string;
  shortLabel: string;
  fullText: string;
  learningAreaName: string;
  strandName: string;
};

export type LearnerCurriculumLinkContext = {
  learnerProfile: LearnerCurriculumProfileRow | null;
  framework: CurriculumFrameworkSummary | null;
  level: CurriculumLevelSummary | null;
  outcomes: LinkableCurriculumOutcome[];
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
      evidenceLinkedOutcomeCount: 0,
      totalEvidenceLinks: 0,
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
  const evidenceCounts = new Map<string, number>();
  const evidenceTitleMap = new Map<string, string[]>();

  if (outcomeIds.length) {
    const [statusesResponse, evidenceLinksResponse] = await Promise.all([
      supabase
        .from("learner_outcome_status")
        .select("outcome_id,status")
        .eq("student_id", input.studentId)
        .in("outcome_id", outcomeIds),
      supabase
        .from("evidence_outcomes")
        .select("outcome_id,evidence_entries!inner(id,title,student_id,is_deleted,occurred_on,created_at)")
        .in("outcome_id", outcomeIds)
        .eq("evidence_entries.student_id", input.studentId)
        .eq("evidence_entries.is_deleted", false),
    ]);

    if (statusesResponse.error) {
      throw statusesResponse.error;
    }
    if (evidenceLinksResponse.error) {
      throw evidenceLinksResponse.error;
    }

    const statuses = (statusesResponse.data ?? []) as Array<{
      outcome_id?: string | null;
      status?: string | null;
    }>;

    trackedOutcomeCount = statuses.length;
    for (const row of statuses) {
      statusMap.set(safe(row.outcome_id), normalizeStatus(row.status));
    }

    const evidenceLinks = (evidenceLinksResponse.data ?? []) as Array<{
      outcome_id?: string | null;
      evidence_entries?:
        | {
            id?: string | null;
            title?: string | null;
            student_id?: string | null;
            is_deleted?: boolean | null;
            occurred_on?: string | null;
            created_at?: string | null;
          }
        | Array<{
            id?: string | null;
            title?: string | null;
            student_id?: string | null;
            is_deleted?: boolean | null;
            occurred_on?: string | null;
            created_at?: string | null;
          }>
        | null;
    }>;

    for (const row of evidenceLinks) {
      const outcomeId = safe(row.outcome_id);
      if (!outcomeId) continue;

      const linkedEntries = Array.isArray(row.evidence_entries)
        ? row.evidence_entries
        : row.evidence_entries
          ? [row.evidence_entries]
          : [];

      for (const entry of linkedEntries) {
        evidenceCounts.set(outcomeId, (evidenceCounts.get(outcomeId) ?? 0) + 1);
        const current = evidenceTitleMap.get(outcomeId) ?? [];
        const nextTitle = safe(entry.title) || "Saved evidence";
        if (!current.includes(nextTitle) && current.length < 3) {
          evidenceTitleMap.set(outcomeId, [...current, nextTitle]);
        } else if (!evidenceTitleMap.has(outcomeId)) {
          evidenceTitleMap.set(outcomeId, current);
        }
      }
    }
  }

  const statusCounts = { ...EMPTY_COUNTS };
  let evidenceLinkedOutcomeCount = 0;
  let totalEvidenceLinks = 0;

  const groupedAreas: CurriculumLearningAreaGroup[] = areas.map((area) => {
    const areaId = safe(area.id);
    const areaCounts = { ...EMPTY_COUNTS };
    let areaEvidenceCount = 0;
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
            const evidenceCount = evidenceCounts.get(safe(outcome.id)) ?? 0;
            areaCounts[status] += 1;
            statusCounts[status] += 1;
            areaEvidenceCount += evidenceCount;
            totalEvidenceLinks += evidenceCount;
            if (evidenceCount > 0) {
              evidenceLinkedOutcomeCount += 1;
            }

            return {
              id: safe(outcome.id),
              code: safe(outcome.code),
              short_label: safe(outcome.short_label),
              full_text: safe(outcome.full_text),
              learning_area_id: areaId,
              strand_id: strandId,
              status,
              evidenceCount,
              recentEvidenceTitles: evidenceTitleMap.get(safe(outcome.id)) ?? [],
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
      evidenceCount: areaEvidenceCount,
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
    evidenceLinkedOutcomeCount,
    totalEvidenceLinks,
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

export async function loadLinkableOutcomesForStudent(input: {
  studentId: string;
  familyPreferences: CurriculumPreferences;
}): Promise<LearnerCurriculumLinkContext | null> {
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
      outcomes: [],
    };
  }

  const [framework, level, areasResponse, strandsResponse, outcomesResponse] =
    await Promise.all([
      loadFrameworkSummary(frameworkId),
      loadLevelSummary(levelId),
      supabase
        .from("curriculum_learning_areas")
        .select("id,name")
        .eq("framework_id", frameworkId),
      supabase
        .from("curriculum_strands")
        .select("id,learning_area_id,name"),
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

  const areas = new Map(
    ((areasResponse.data ?? []) as Array<{ id?: string | null; name?: string | null }>).map(
      (row) => [safe(row.id), safe(row.name) || "Learning area"] as const,
    ),
  );

  const strands = new Map(
    ((strandsResponse.data ?? []) as Array<{ id?: string | null; name?: string | null }>).map(
      (row) => [safe(row.id), safe(row.name) || "Strand"] as const,
    ),
  );

  const outcomes = ((outcomesResponse.data ?? []) as Array<{
    id?: string | null;
    code?: string | null;
    short_label?: string | null;
    full_text?: string | null;
    learning_area_id?: string | null;
    strand_id?: string | null;
  }>).map((row) => ({
    id: safe(row.id),
    code: safe(row.code),
    shortLabel: safe(row.short_label),
    fullText: safe(row.full_text),
    learningAreaName: areas.get(safe(row.learning_area_id)) || "Learning area",
    strandName: strands.get(safe(row.strand_id)) || "Strand",
  }));

  return {
    learnerProfile,
    framework,
    level,
    outcomes: outcomes.filter((row) => row.id),
  };
}
