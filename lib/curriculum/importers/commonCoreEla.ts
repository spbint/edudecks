"use server";

import { supabase } from "@/lib/supabaseClient";
import {
  CurriculumLevel,
  CurriculumStandard,
  FrameworkType,
  LevelType,
  SubjectScope,
} from "@/lib/curriculum/types";

type StandardSeed = {
  official_code: string;
  title: string;
  description?: string | null;
  short_code?: string;
  subject_code?: string;
  strand_code?: string;
  level_official_label?: string;
  normalized_grade_label?: string;
  normalized_grade_sort?: number;
  discipline_context?: string;
  source_order?: number;
  metadata?: Record<string, unknown>;
  is_anchor?: boolean;
};

type StrandSeed = {
  code: string;
  name: string;
  description?: string;
  subject_code?: string;
  parent_code?: string;
  sort_order?: number;
};

type LevelSeed = {
  official_label: string;
  normalized_label: string;
  normalized_sort: number;
  level_type: LevelType;
  is_band: boolean;
  metadata?: Record<string, unknown>;
};

type StrandPayload = {
  framework_id: string;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
  metadata: Record<string, unknown>;
  subject_id?: string;
};

type StandardPayload = {
  framework_id: string;
  official_code: string;
  title: string;
  description?: string | null;
  is_anchor: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  short_code?: string;
  subject_id?: string;
  strand_id?: string;
  level_id?: string;
  official_grade_label?: string;
  normalized_grade_label?: string;
  normalized_grade_sort?: number;
  discipline_context?: string;
  source_order?: number;
};

const FRAMEWORK_CODE = "common-core";
const COUNTRY_CODE = "us";

const SUBJECT_SEEDS = [
  { code: "ela", name: "English Language Arts", sort_order: 100 },
  { code: "ela-history", name: "Literacy in History/Social Studies", sort_order: 200 },
  { code: "ela-science", name: "Literacy in Science and Technical Subjects", sort_order: 300 },
];

const LEVEL_SEEDS: LevelSeed[] = [
  { official_label: "K", normalized_label: "Kindergarten", normalized_sort: 0, level_type: "grade" as LevelType, is_band: false },
  { official_label: "1", normalized_label: "Grade 1", normalized_sort: 1, level_type: "grade" as LevelType, is_band: false },
  { official_label: "2", normalized_label: "Grade 2", normalized_sort: 2, level_type: "grade" as LevelType, is_band: false },
  { official_label: "3", normalized_label: "Grade 3", normalized_sort: 3, level_type: "grade" as LevelType, is_band: false },
  { official_label: "4", normalized_label: "Grade 4", normalized_sort: 4, level_type: "grade" as LevelType, is_band: false },
  { official_label: "5", normalized_label: "Grade 5", normalized_sort: 5, level_type: "grade" as LevelType, is_band: false },
  { official_label: "6", normalized_label: "Grade 6", normalized_sort: 6, level_type: "grade" as LevelType, is_band: false },
  { official_label: "7", normalized_label: "Grade 7", normalized_sort: 7, level_type: "grade" as LevelType, is_band: false },
  { official_label: "8", normalized_label: "Grade 8", normalized_sort: 8, level_type: "grade" as LevelType, is_band: false },
  {
    official_label: "9-10",
    normalized_label: "Grades 9-10",
    normalized_sort: 9,
    level_type: "band" as LevelType,
    is_band: true,
  },
  {
    official_label: "11-12",
    normalized_label: "Grades 11-12",
    normalized_sort: 11,
    level_type: "band" as LevelType,
    is_band: true,
  },
];

const STRAND_SEEDS: StrandSeed[] = [
  { code: "ANCHOR-READING", name: "Reading Anchor Standards", description: "College and Career Readiness anchor standards for Reading." },
  { code: "ANCHOR-WRITING", name: "Writing Anchor Standards", description: "College and Career Readiness anchor standards for Writing." },
  { code: "ANCHOR-SPEAKING", name: "Speaking and Listening Anchor Standards", description: "College and Career Readiness anchor standards for Speaking and Listening." },
  { code: "ANCHOR-LANGUAGE", name: "Language Anchor Standards", description: "College and Career Readiness anchor standards for Language." },
  { code: "READ-LITERATURE", name: "Reading: Literature", description: "", subject_code: "ela" },
  { code: "READ-INFORMATION", name: "Reading: Informational Text", description: "", subject_code: "ela" },
  { code: "READ-FOUNDATIONAL", name: "Reading: Foundational Skills", description: "", subject_code: "ela" },
  { code: "WRITING", name: "Writing", subject_code: "ela" },
  { code: "SPEAKING", name: "Speaking and Listening", subject_code: "ela" },
  { code: "LANGUAGE", name: "Language", subject_code: "ela" },
  { code: "READ-HISTORY", name: "Reading for Literacy in History/Social Studies", subject_code: "ela-history" },
  { code: "READ-SCIENCE", name: "Reading for Literacy in Science and Technical Subjects", subject_code: "ela-science" },
];

const ANCHOR_STANDARDS: StandardSeed[] = [
  {
    official_code: "CCSS.ELA-LITERACY.CCRA.R.1",
    title: "Read closely to determine what the text says explicitly and to make logical inferences.",
    description:
      "Demonstrate the ability to analyze complex texts by reading carefully and citing textual evidence.",
    strand_code: "ANCHOR-READING",
    normalized_grade_label: "College and Career Readiness",
    is_anchor: true,
  },
  {
    official_code: "CCSS.ELA-LITERACY.CCRA.W.1",
    title: "Write arguments to support claims with clear reasons and relevant evidence.",
    description:
      "Develop claims with reasoning, evidence, and clear explanations while organizing ideas logically.",
    strand_code: "ANCHOR-WRITING",
    normalized_grade_label: "College and Career Readiness",
    is_anchor: true,
  },
  {
    official_code: "CCSS.ELA-LITERACY.CCRA.SL.1",
    title: "Prepare for and participate effectively in a range of conversations.",
    description:
      "Demonstrate communication skills by listening actively and expressing ideas clearly.",
    strand_code: "ANCHOR-SPEAKING",
    normalized_grade_label: "College and Career Readiness",
    is_anchor: true,
  },
  {
    official_code: "CCSS.ELA-LITERACY.CCRA.L.1",
    title: "Demonstrate command of the conventions of standard English grammar and usage.",
    description:
      "Use standard English grammar and vocabulary to craft precise communication in preparation for college and careers.",
    strand_code: "ANCHOR-LANGUAGE",
    normalized_grade_label: "College and Career Readiness",
    is_anchor: true,
  },
];

const GRADE_STANDARDS: StandardSeed[] = [
  {
    official_code: "CCSS.ELA-LITERACY.RL.K.1",
    title: "With prompting and support, ask and answer questions about key details in a text.",
    description: "Begin to comprehend texts by asking about characters, settings, and major events.",
    subject_code: "ela",
    strand_code: "READ-LITERATURE",
    level_official_label: "K",
    normalized_grade_label: "Kindergarten",
  },
  {
    official_code: "CCSS.ELA-LITERACY.RL.3.2",
    title: "Recount stories and determine the central message.",
    description: "Identify central ideas and supporting details in literature.",
    subject_code: "ela",
    strand_code: "READ-LITERATURE",
    level_official_label: "3",
    normalized_grade_label: "Grade 3",
  },
  {
    official_code: "CCSS.ELA-LITERACY.W.4.1",
    title: "Write opinion pieces on topics with reasons and information from sources.",
    description: "Support opinions with reasons grounded in grade-appropriate evidence.",
    subject_code: "ela",
    strand_code: "WRITING",
    level_official_label: "4",
    normalized_grade_label: "Grade 4",
  },
  {
    official_code: "CCSS.ELA-LITERACY.SL.5.1",
    title: "Engage effectively in collaborative discussions.",
    description: "Acknowledge others, ask questions, and build on others' ideas during discussions.",
    subject_code: "ela",
    strand_code: "SPEAKING",
    level_official_label: "5",
    normalized_grade_label: "Grade 5",
  },
  {
    official_code: "CCSS.ELA-LITERACY.RI.6.1",
    title: "Cite textual evidence to support analysis of informational texts.",
    description: "Draw evidence from texts to support analysis.",
    subject_code: "ela",
    strand_code: "READ-INFORMATION",
    level_official_label: "6",
    normalized_grade_label: "Grade 6",
  },
  {
    official_code: "CCSS.ELA-LITERACY.W.7.2",
    title: "Write informative/explanatory texts to examine a topic.",
    description: "Introduce a topic clearly and organize ideas and evidence.",
    subject_code: "ela",
    strand_code: "WRITING",
    level_official_label: "7",
    normalized_grade_label: "Grade 7",
  },
  {
    official_code: "CCSS.ELA-LITERACY.L.8.1",
    title: "Demonstrate command of grammar and sentence structure.",
    description: "Use appropriate shifts in language to convey precise meaning.",
    subject_code: "ela",
    strand_code: "LANGUAGE",
    level_official_label: "8",
    normalized_grade_label: "Grade 8",
  },
  {
    official_code: "CCSS.ELA-LITERACY.RL.9-10.1",
    title: "Cite strong and thorough textual evidence to support analysis.",
    description: "Analyze complex literature at grade 9-10 level.",
    subject_code: "ela",
    strand_code: "READ-LITERATURE",
    level_official_label: "9-10",
    normalized_grade_label: "Grades 9-10",
  },
  {
    official_code: "CCSS.ELA-LITERACY.RH.6-8.1",
    title: "Cite specific textual evidence in history/social studies.",
    description: "Support analysis of historical sources with evidence.",
    subject_code: "ela-history",
    strand_code: "READ-HISTORY",
    level_official_label: "6",
    normalized_grade_label: "Grade 6",
    discipline_context: "History/Social Studies",
  },
  {
    official_code: "CCSS.ELA-LITERACY.RH.9-10.2",
    title: "Determine central ideas of primary or secondary sources in history/social studies.",
    description: "Summarize multiple sources and provide supporting evidence.",
    subject_code: "ela-history",
    strand_code: "READ-HISTORY",
    level_official_label: "9-10",
    normalized_grade_label: "Grades 9-10",
    discipline_context: "History/Social Studies",
  },
  {
    official_code: "CCSS.ELA-LITERACY.RST.9-10.2",
    title: "Determine the central ideas or conclusions in science/technical texts.",
    description: "Summarize key findings from technical writing and cite evidence.",
    subject_code: "ela-science",
    strand_code: "READ-SCIENCE",
    level_official_label: "9-10",
    normalized_grade_label: "Grades 9-10",
    discipline_context: "Science/Technical Subjects",
  },
];

export async function seedCommonCoreEla() {
  const country = await ensureCountry(COUNTRY_CODE, "United States");
  const framework = await ensureFramework(country.id);
  const subjects = await ensureSubjects(framework.id);
  const levels = await ensureLevels(framework.id);
  const strands = await ensureStrands(framework.id, subjects);
  const anchorMap = await ensureStandards(framework.id, subjects, levels, strands, ANCHOR_STANDARDS);
  const gradeMap = await ensureStandards(framework.id, subjects, levels, strands, GRADE_STANDARDS);
  await ensureRelationships(framework.id, anchorMap, gradeMap);
}

async function ensureCountry(code: string, name: string) {
  const { data } = await supabase
    .from("curriculum_countries")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (data) return data;

  const { data: inserted } = await supabase
    .from("curriculum_countries")
    .insert({ code, name, sort_order: 1 })
    .select("*")
    .single();

  return inserted;
}

async function ensureFramework(countryId: string) {
  const match = { country_id: countryId, code: FRAMEWORK_CODE };
  const values = {
    name: "Common Core State Standards",
    framework_type: "national" as FrameworkType,
    subject_scope: "ela-literacy" as SubjectScope,
    official_source_url: "https://www.corestandards.org/ELA-Literacy/",
    version_label: "2021",
  };

  return upsert("curriculum_frameworks", match, values);
}

async function ensureSubjects(frameworkId: string) {
  const subjectMap: Record<string, { id: string; name: string }> = {};

  for (const subject of SUBJECT_SEEDS) {
    const values = {
      framework_id: frameworkId,
      name: subject.name,
      sort_order: subject.sort_order,
      metadata: {},
    };
    const row = await upsert("curriculum_subjects", { framework_id: frameworkId, code: subject.code }, values);
    subjectMap[subject.code] = { id: row.id, name: subject.name };
  }

  return subjectMap;
}

async function ensureLevels(frameworkId: string) {
  const levelMap: Record<string, CurriculumLevel> = {};

  for (const level of LEVEL_SEEDS) {
    const values = {
      framework_id: frameworkId,
      normalized_level_label: level.normalized_label,
      normalized_sort_order: level.normalized_sort,
      level_type: level.level_type,
      is_band: level.is_band,
      metadata: level.metadata ?? {},
    };

    const row = await upsert(
      "curriculum_levels",
      { framework_id: frameworkId, official_level_label: level.official_label },
      { ...values, official_level_label: level.official_label }
    );

    levelMap[level.official_label] = row;
  }

  return levelMap;
}

async function ensureStrands(
  frameworkId: string,
  subjects: Record<string, { id: string; name: string }>
) {
  const strandMap: Record<string, { id: string; code: string }> = {};

  for (const seed of STRAND_SEEDS) {
    const payload: StrandPayload = {
      framework_id: frameworkId,
      code: seed.code,
      name: seed.name,
      description: seed.description,
      sort_order: seed.sort_order ?? 100,
      metadata: {},
    };
    if (seed.subject_code) {
      payload.subject_id = subjects[seed.subject_code]?.id;
    }

    const row = await upsert("curriculum_strands", { framework_id: frameworkId, code: seed.code }, payload as Record<string, unknown>);
    strandMap[seed.code] = { id: row.id, code: seed.code };
  }

  return strandMap;
}

async function ensureStandards(
  frameworkId: string,
  subjects: Record<string, { id: string }>,
  levels: Record<string, CurriculumLevel>,
  strands: Record<string, { id: string }>,
  standards: StandardSeed[]
) {
  const standardMap = new Map<string, CurriculumStandard>();

  for (const standard of standards) {
    const payload: StandardPayload = {
      framework_id: frameworkId,
      official_code: standard.official_code,
      title: standard.title,
      description: standard.description,
      is_anchor: Boolean(standard.is_anchor),
      is_active: true,
      metadata: standard.metadata ?? {},
    };

    if (standard.short_code) payload.short_code = standard.short_code;
    if (standard.subject_code) payload.subject_id = subjects[standard.subject_code]?.id;
    if (standard.strand_code) payload.strand_id = strands[standard.strand_code]?.id;
    if (standard.level_official_label) {
      const level = levels[standard.level_official_label];
      if (level) {
        payload.level_id = level.id;
        payload.official_grade_label = standard.level_official_label;
        payload.normalized_grade_label = standard.normalized_grade_label ?? level.normalized_level_label;
        payload.normalized_grade_sort = standard.normalized_grade_sort ?? level.normalized_sort_order;
      }
    }
    if (!payload.normalized_grade_label && standard.normalized_grade_label) {
      payload.normalized_grade_label = standard.normalized_grade_label;
    }
    if (standard.discipline_context) payload.discipline_context = standard.discipline_context;
    if (standard.source_order !== undefined) payload.source_order = standard.source_order;

    const row = await upsert("curriculum_standards", { framework_id: frameworkId, official_code: standard.official_code }, payload as Record<string, unknown>);
    standardMap.set(standard.official_code, row);
  }

  return standardMap;
}

async function ensureRelationships(
  frameworkId: string,
  anchorMap: Map<string, CurriculumStandard>,
  gradeMap: Map<string, CurriculumStandard>
) {
  const anchorMapping: Record<string, string> = {
    "READ-LITERATURE": "CCSS.ELA-LITERACY.CCRA.R.1",
    "READ-INFORMATION": "CCSS.ELA-LITERACY.CCRA.R.1",
    "READ-FOUNDATIONAL": "CCSS.ELA-LITERACY.CCRA.R.1",
    WRITING: "CCSS.ELA-LITERACY.CCRA.W.1",
    SPEAKING: "CCSS.ELA-LITERACY.CCRA.SL.1",
    LANGUAGE: "CCSS.ELA-LITERACY.CCRA.L.1",
    "READ-HISTORY": "CCSS.ELA-LITERACY.CCRA.R.1",
    "READ-SCIENCE": "CCSS.ELA-LITERACY.CCRA.R.1",
  };

  for (const [code, standard] of gradeMap) {
    const strandCode = standard.strand_id ? await fetchStrandCode(standard.strand_id) : null;
    const anchorCode = strandCode ? anchorMapping[strandCode] : null;

    if (!anchorCode) continue;
    const anchor = anchorMap.get(anchorCode);
    if (!anchor) continue;

    await upsert("curriculum_standard_relationships", {
      framework_id: frameworkId,
      source_standard_id: anchor.id,
      target_standard_id: standard.id,
    }, {
      relationship_type: "anchor-to-grade",
      metadata: {},
    });
  }
}

async function fetchStrandCode(strandId: string) {
  const { data } = await supabase
    .from("curriculum_strands")
    .select("code")
    .eq("id", strandId)
    .maybeSingle();
  return data?.code ?? null;
}

async function upsert(table: string, match: Record<string, unknown>, values: Record<string, unknown>) {
  const { data } = await supabase.from(table).select("*").match(match).maybeSingle();

  if (data) {
    const { error } = await supabase.from(table).update(values).match(match);
    if (error) {
      throw error;
    }
    return { ...data, ...values };
  }

  const payload = { ...match, ...values };
  const response = await supabase.from(table).insert(payload).select("*").single();
  if (response.error) {
    throw response.error;
  }

  return response.data;
}
