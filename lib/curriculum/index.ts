"use server";

import { supabase } from "@/lib/supabaseClient";
import {
  CurriculumStandard,
  CurriculumStrand,
  CurriculumSubject,
  CurriculumLevel,
  CurriculumFramework,
} from "@/lib/curriculum/types";

type StandardFilter = {
  frameworkCode?: string;
  subjectCode?: string;
  strandCode?: string;
  officialLevelLabel?: string;
  normalizedGradeLabel?: string;
  normalizedGradeSort?: number;
  disciplineContext?: string;
  isAnchor?: boolean;
  codeSearch?: string;
  keywordSearch?: string;
};

export async function getCurriculumFrameworkByCode(code: string) {
  const { data } = await supabase
    .from("curriculum_frameworks")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  return data as CurriculumFramework | null;
}

export async function listCurriculumSubjects(frameworkId: string) {
  const { data } = await supabase
    .from("curriculum_subjects")
    .select("*")
    .eq("framework_id", frameworkId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as CurriculumSubject[];
}

export async function listCurriculumLevels(frameworkId: string) {
  const { data } = await supabase
    .from("curriculum_levels")
    .select("*")
    .eq("framework_id", frameworkId)
    .order("normalized_sort_order", { ascending: true });
  return (data ?? []) as CurriculumLevel[];
}

export async function listCurriculumStrands(frameworkId: string, subjectCode?: string) {
  const query = supabase
    .from("curriculum_strands")
    .select("*, subject:curriculum_subjects(code)")
    .eq("framework_id", frameworkId)
    .order("sort_order", { ascending: true });
  if (subjectCode) {
    query.eq("subject:curriculum_subjects.code", subjectCode);
  }
  const { data } = await query;
  return (data ?? []) as CurriculumStrand[];
}

export async function listCurriculumStandards(filter: StandardFilter = {}) {
  const query = supabase
    .from("curriculum_standards")
    .select(`
      *,
      subject:curriculum_subjects(code,name),
      strand:curriculum_strands(code,name),
      level:curriculum_levels(normalized_level_label,official_level_label)
    `)
    .order("normalized_grade_sort", { ascending: true })
    .order("source_order", { ascending: true });

  if (filter.frameworkCode) {
    const framework = await getCurriculumFrameworkByCode(filter.frameworkCode);
    if (!framework) return [];
    query.eq("framework_id", framework.id);
  }

  if (filter.subjectCode) {
    query.eq("subject:curriculum_subjects.code", filter.subjectCode);
  }

  if (filter.strandCode) {
    query.eq("strand:curriculum_strands.code", filter.strandCode);
  }

  if (filter.officialLevelLabel) {
    query.eq("official_grade_label", filter.officialLevelLabel);
  }

  if (filter.normalizedGradeLabel) {
    query.eq("normalized_grade_label", filter.normalizedGradeLabel);
  }

  if (filter.normalizedGradeSort !== undefined) {
    query.eq("normalized_grade_sort", filter.normalizedGradeSort);
  }

  if (filter.disciplineContext) {
    query.eq("discipline_context", filter.disciplineContext);
  }

  if (typeof filter.isAnchor === "boolean") {
    query.eq("is_anchor", filter.isAnchor);
  }

  if (filter.codeSearch) {
    query.ilike("official_code", `%${filter.codeSearch}%`);
  }

  if (filter.keywordSearch) {
    query.or(`title.ilike.%${filter.keywordSearch}%,description.ilike.%${filter.keywordSearch}%`);
  }

  const { data } = await query;
  return (data ?? []) as CurriculumStandard[];
}

export async function getCurriculumStandardByCode(code: string) {
  const { data } = await supabase
    .from("curriculum_standards")
    .select("*")
    .eq("official_code", code)
    .maybeSingle();
  return data as CurriculumStandard | null;
}

export async function getAnchorStandardsForStandard(standardId: string) {
  const { data } = await supabase
    .from("curriculum_standard_relationships")
    .select("*, source:curriculum_standards(*)")
    .eq("target_standard_id", standardId)
    .eq("relationship_type", "anchor-to-grade");
  return (data ?? []).map((relation) => relation.source as CurriculumStandard);
}

export async function getStandardsForNormalizedGrade(frameworkCode: string, normalizedGradeLabel: string) {
  return listCurriculumStandards({
    frameworkCode,
    normalizedGradeLabel,
  });
}

export async function getStandardsForOfficialLevel(frameworkCode: string, officialLevelLabel: string) {
  return listCurriculumStandards({
    frameworkCode,
    officialLevelLabel,
  });
}

export async function getStandardsGroupedByStrand(frameworkCode: string, normalizedGradeLabel: string) {
  const standards = await getStandardsForNormalizedGrade(frameworkCode, normalizedGradeLabel);
  const grouped: Record<string, CurriculumStandard[]> = {};
  standards.forEach((standard) => {
    const key = standard.strand_id || "uncategorized";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(standard);
  });
  return grouped;
}

export function buildFriendlyLabel(params: {
  frameworkName?: string;
  subjectName?: string;
  levelLabel?: string;
}) {
  const pieces = [
    params.frameworkName,
    params.subjectName,
    params.levelLabel,
  ].filter(Boolean);
  return pieces.join(" • ");
}
