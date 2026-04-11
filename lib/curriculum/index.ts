import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import type {
  CurriculumCountry as CoreCurriculumCountry,
  CurriculumCrosswalk,
  CurriculumFramework as CoreCurriculumFramework,
  CurriculumLevel as CoreCurriculumLevel,
  CurriculumRegion as CoreCurriculumRegion,
  CurriculumStandard,
  CurriculumStandardRelationship,
  CurriculumStrand,
  CurriculumSubject as CoreCurriculumSubject,
} from "@/lib/curriculum/types";

export type {
  CurriculumCrosswalk,
  CurriculumStandard,
  CurriculumStandardRelationship,
  CurriculumStrand,
};

export type CurriculumCountry = CoreCurriculumCountry;

export type CurriculumRegion = CoreCurriculumRegion;

export type CurriculumFramework = CoreCurriculumFramework & {
  label: string;
  subject_ids: string[];
};

export type CurriculumSubject = CoreCurriculumSubject & {
  label: string;
  framework_ids: string[];
};

export type CurriculumLevel = CoreCurriculumLevel & {
  label: string;
  sort: number;
  framework_ids: string[];
};

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

const FALLBACK_COUNTRIES: CurriculumCountry[] = [
  {
    id: "fallback-us",
    code: "us",
    name: "United States",
    sort_order: 1,
    is_active: true,
    created_at: "",
  },
  {
    id: "fallback-au",
    code: "au",
    name: "Australia",
    sort_order: 2,
    is_active: true,
    created_at: "",
  },
  {
    id: "fallback-uk",
    code: "uk",
    name: "United Kingdom",
    sort_order: 3,
    is_active: true,
    created_at: "",
  },
  {
    id: "fallback-nz",
    code: "nz",
    name: "New Zealand",
    sort_order: 4,
    is_active: true,
    created_at: "",
  },
];

const FALLBACK_REGIONS: CurriculumRegion[] = [];

const FALLBACK_FRAMEWORKS: CurriculumFramework[] = [
  {
    id: "fallback-common-core",
    country_id: "fallback-us",
    region_id: null,
    code: "common-core",
    name: "Common Core State Standards",
    label: "Common Core State Standards",
    framework_type: "national",
    subject_scope: "ela-literacy",
    official_source_url: null,
    version_label: null,
    is_active: true,
    created_at: "",
    subject_ids: ["fallback-subject-ela", "fallback-subject-math"],
  },
  {
    id: "fallback-au-curriculum",
    country_id: "fallback-au",
    region_id: null,
    code: "australian-curriculum",
    name: "Australian Curriculum",
    label: "Australian Curriculum",
    framework_type: "national",
    subject_scope: "general",
    official_source_url: null,
    version_label: null,
    is_active: true,
    created_at: "",
    subject_ids: ["fallback-subject-ela", "fallback-subject-math", "fallback-subject-science"],
  },
  {
    id: "fallback-uk-curriculum",
    country_id: "fallback-uk",
    region_id: null,
    code: "uk-national-curriculum",
    name: "UK National Curriculum",
    label: "UK National Curriculum",
    framework_type: "national",
    subject_scope: "general",
    official_source_url: null,
    version_label: null,
    is_active: true,
    created_at: "",
    subject_ids: ["fallback-subject-ela", "fallback-subject-math", "fallback-subject-science"],
  },
];

const FALLBACK_LEVELS: CurriculumLevel[] = [
  {
    id: "fallback-level-k",
    framework_id: "fallback-common-core",
    official_level_label: "K",
    normalized_level_label: "Kindergarten",
    normalized_sort_order: 0,
    level_type: "grade",
    is_band: false,
    metadata: {},
    created_at: "",
    label: "Kindergarten",
    sort: 0,
    framework_ids: ["fallback-common-core"],
  },
  {
    id: "fallback-level-1",
    framework_id: "fallback-common-core",
    official_level_label: "1",
    normalized_level_label: "Grade 1",
    normalized_sort_order: 1,
    level_type: "grade",
    is_band: false,
    metadata: {},
    created_at: "",
    label: "Grade 1",
    sort: 1,
    framework_ids: ["fallback-common-core", "fallback-au-curriculum", "fallback-uk-curriculum"],
  },
  {
    id: "fallback-level-2",
    framework_id: "fallback-common-core",
    official_level_label: "2",
    normalized_level_label: "Grade 2",
    normalized_sort_order: 2,
    level_type: "grade",
    is_band: false,
    metadata: {},
    created_at: "",
    label: "Grade 2",
    sort: 2,
    framework_ids: ["fallback-common-core", "fallback-au-curriculum", "fallback-uk-curriculum"],
  },
  {
    id: "fallback-level-3",
    framework_id: "fallback-common-core",
    official_level_label: "3",
    normalized_level_label: "Grade 3",
    normalized_sort_order: 3,
    level_type: "grade",
    is_band: false,
    metadata: {},
    created_at: "",
    label: "Grade 3",
    sort: 3,
    framework_ids: ["fallback-common-core", "fallback-au-curriculum", "fallback-uk-curriculum"],
  },
  {
    id: "fallback-level-4",
    framework_id: "fallback-common-core",
    official_level_label: "4",
    normalized_level_label: "Grade 4",
    normalized_sort_order: 4,
    level_type: "grade",
    is_band: false,
    metadata: {},
    created_at: "",
    label: "Grade 4",
    sort: 4,
    framework_ids: ["fallback-common-core", "fallback-au-curriculum", "fallback-uk-curriculum"],
  },
];

const FALLBACK_SUBJECTS: CurriculumSubject[] = [
  {
    id: "fallback-subject-ela",
    framework_id: "fallback-common-core",
    code: "ela",
    name: "English Language Arts",
    label: "English Language Arts",
    sort_order: 100,
    is_active: true,
    metadata: {},
    created_at: "",
    framework_ids: ["fallback-common-core", "fallback-au-curriculum", "fallback-uk-curriculum"],
  },
  {
    id: "fallback-subject-math",
    framework_id: "fallback-common-core",
    code: "mathematics",
    name: "Mathematics",
    label: "Mathematics",
    sort_order: 200,
    is_active: true,
    metadata: {},
    created_at: "",
    framework_ids: ["fallback-common-core", "fallback-au-curriculum", "fallback-uk-curriculum"],
  },
  {
    id: "fallback-subject-science",
    framework_id: "fallback-au-curriculum",
    code: "science",
    name: "Science",
    label: "Science",
    sort_order: 300,
    is_active: true,
    metadata: {},
    created_at: "",
    framework_ids: ["fallback-au-curriculum", "fallback-uk-curriculum"],
  },
];

let cachedCountries: CurriculumCountry[] = FALLBACK_COUNTRIES;
let cachedRegions: CurriculumRegion[] = FALLBACK_REGIONS;
let cachedFrameworks: CurriculumFramework[] = FALLBACK_FRAMEWORKS;
let cachedLevels: CurriculumLevel[] = FALLBACK_LEVELS;
let cachedSubjects: CurriculumSubject[] = FALLBACK_SUBJECTS;

function traceCurriculum(step: string, detail?: unknown) {
  if (typeof console === "undefined") return;
  if (detail === undefined) {
    console.info(`[curriculum] ${step}`);
    return;
  }
  console.info(`[curriculum] ${step}`, detail);
}

async function withCurriculumTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = 5000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${ms}ms.`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeCountry(row: CoreCurriculumCountry): CurriculumCountry {
  return row;
}

function normalizeRegion(row: CoreCurriculumRegion): CurriculumRegion {
  return row;
}

function normalizeSubject(row: CoreCurriculumSubject): CurriculumSubject {
  return {
    ...row,
    label: safe(row.name) || safe(row.code) || "Subject",
    framework_ids: [row.framework_id],
  };
}

function normalizeLevel(row: CoreCurriculumLevel): CurriculumLevel {
  return {
    ...row,
    label: safe(row.normalized_level_label || row.official_level_label) || "Level",
    sort: row.normalized_sort_order ?? 0,
    framework_ids: [row.framework_id],
  };
}

function normalizeFramework(
  row: CoreCurriculumFramework,
  subjects: CurriculumSubject[]
): CurriculumFramework {
  return {
    ...row,
    label: safe(row.name) || safe(row.code) || "Framework",
    subject_ids: subjects
      .filter((subject) => subject.framework_ids.includes(row.id))
      .map((subject) => subject.id),
  };
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]) {
  const map = new Map<string, T>();
  for (const item of fallback) map.set(item.id, item);
  for (const item of primary) map.set(item.id, item);
  return Array.from(map.values());
}

async function selectRows<T>(table: string, select: string) {
  if (!hasSupabaseEnv) {
    return [] as T[];
  }
  traceCurriculum("selectRows:start", { table, select });
  const { data, error } = (await withCurriculumTimeout(
    Promise.resolve(supabase.from(table).select(select)),
    `curriculum query ${table}`,
  )) as { data: T[] | null; error: unknown };
  traceCurriculum("selectRows:end", {
    table,
    count: data?.length ?? 0,
    hasError: Boolean(error),
  });
  if (error) throw error;
  return ((data ?? []) as unknown) as T[];
}

async function safeLoad<T>(loader: () => Promise<T[]>, fallback: T[]) {
  try {
    const rows = await loader();
    return rows.length ? rows : fallback;
  } catch {
    return fallback;
  }
}

export async function loadCurriculumCountries() {
  traceCurriculum("loadCurriculumCountries:start");
  const rows = await safeLoad(
    async () =>
      (await selectRows<CoreCurriculumCountry>(
        "curriculum_countries",
        "id,code,name,sort_order,is_active,created_at"
      ))
        .filter((row) => row.is_active !== false)
        .map(normalizeCountry)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    FALLBACK_COUNTRIES
  );

  cachedCountries = mergeById(rows, FALLBACK_COUNTRIES);
  traceCurriculum("loadCurriculumCountries:end", { count: cachedCountries.length });
  return cachedCountries;
}

export async function loadCurriculumRegions() {
  traceCurriculum("loadCurriculumRegions:start");
  const rows = await safeLoad(
    async () =>
      (await selectRows<CoreCurriculumRegion>(
        "curriculum_regions",
        "id,country_id,code,name,region_type,sort_order,is_active,created_at"
      ))
        .filter((row) => row.is_active !== false)
        .map(normalizeRegion)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    FALLBACK_REGIONS
  );

  cachedRegions = mergeById(rows, FALLBACK_REGIONS);
  traceCurriculum("loadCurriculumRegions:end", { count: cachedRegions.length });
  return cachedRegions;
}

export async function loadCurriculumSubjects() {
  traceCurriculum("loadCurriculumSubjects:start");
  const rows = await safeLoad(
    async () =>
      (await selectRows<CoreCurriculumSubject>(
        "curriculum_subjects",
        "id,framework_id,code,name,sort_order,is_active,metadata,created_at"
      ))
        .filter((row) => row.is_active !== false)
        .map(normalizeSubject)
        .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
    FALLBACK_SUBJECTS
  );

  cachedSubjects = mergeById(rows, FALLBACK_SUBJECTS);
  traceCurriculum("loadCurriculumSubjects:end", { count: cachedSubjects.length });
  return cachedSubjects;
}

export async function loadCurriculumLevels() {
  traceCurriculum("loadCurriculumLevels:start");
  const rows = await safeLoad(
    async () =>
      (await selectRows<CoreCurriculumLevel>(
        "curriculum_levels",
        "id,framework_id,official_level_label,normalized_level_label,normalized_sort_order,level_type,is_band,metadata,created_at"
      ))
        .map(normalizeLevel)
        .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label)),
    FALLBACK_LEVELS
  );

  cachedLevels = mergeById(rows, FALLBACK_LEVELS);
  traceCurriculum("loadCurriculumLevels:end", { count: cachedLevels.length });
  return cachedLevels;
}

export async function loadCurriculumFrameworks() {
  traceCurriculum("loadCurriculumFrameworks:start");
  const subjects = await loadCurriculumSubjects();
  const rows = await safeLoad(
    async () =>
      (await selectRows<CoreCurriculumFramework>(
        "curriculum_frameworks",
        "id,country_id,region_id,code,name,framework_type,subject_scope,official_source_url,version_label,is_active,created_at"
      ))
        .filter((row) => row.is_active !== false)
        .map((row) => normalizeFramework(row, subjects))
        .sort((a, b) => a.label.localeCompare(b.label)),
    FALLBACK_FRAMEWORKS
  );

  cachedFrameworks = mergeById(rows, FALLBACK_FRAMEWORKS);
  traceCurriculum("loadCurriculumFrameworks:end", { count: cachedFrameworks.length });
  return cachedFrameworks;
}

export function findCountryLabel(countryId?: string | null) {
  if (!countryId) return "";
  return cachedCountries.find((country) => country.id === countryId)?.name || "";
}

export function findFrameworkById(frameworkId?: string | null) {
  if (!frameworkId) return null;
  return cachedFrameworks.find((framework) => framework.id === frameworkId) ?? null;
}

export function findLevelLabel(levelId?: string | null) {
  if (!levelId) return "";
  const level = cachedLevels.find((item) => item.id === levelId);
  return level?.label || "";
}

export function findSubjectLabel(subjectId?: string | null) {
  if (!subjectId) return "";
  const subject = cachedSubjects.find((item) => item.id === subjectId);
  return subject?.label || "";
}

export function getRecommendedFrameworkId(countryId?: string | null, regionId?: string | null) {
  if (!countryId) return null;

  const exactRegion = cachedFrameworks.find(
    (framework) =>
      framework.country_id === countryId && (framework.region_id ?? null) === (regionId ?? null)
  );
  if (exactRegion) return exactRegion.id;

  const countryWide = cachedFrameworks.find(
    (framework) => framework.country_id === countryId && !framework.region_id
  );
  if (countryWide) return countryWide.id;

  return cachedFrameworks.find((framework) => framework.country_id === countryId)?.id ?? null;
}

export function getRecommendedLevelId(frameworkId?: string | null) {
  if (!frameworkId) return null;

  const scoped = cachedLevels
    .filter((level) => level.framework_ids.includes(frameworkId))
    .sort((a, b) => a.sort - b.sort);
  if (scoped.length) return scoped[0].id;

  return cachedLevels.slice().sort((a, b) => a.sort - b.sort)[0]?.id ?? null;
}

export async function getCurriculumFrameworkByCode(code: string) {
  const { data } = await supabase
    .from("curriculum_frameworks")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  return (data as CoreCurriculumFramework | null) ?? null;
}

export async function listCurriculumSubjects(frameworkId: string) {
  const { data } = await supabase
    .from("curriculum_subjects")
    .select("*")
    .eq("framework_id", frameworkId)
    .order("sort_order", { ascending: true });
  return ((data ?? []) as unknown) as CoreCurriculumSubject[];
}

export async function listCurriculumLevels(frameworkId: string) {
  const { data } = await supabase
    .from("curriculum_levels")
    .select("*")
    .eq("framework_id", frameworkId)
    .order("normalized_sort_order", { ascending: true });
  return ((data ?? []) as unknown) as CoreCurriculumLevel[];
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
  return ((data ?? []) as unknown) as CurriculumStrand[];
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
  return ((data ?? []) as unknown) as CurriculumStandard[];
}

export async function getCurriculumStandardByCode(code: string) {
  const { data } = await supabase
    .from("curriculum_standards")
    .select("*")
    .eq("official_code", code)
    .maybeSingle();
  return (data as CurriculumStandard | null) ?? null;
}

export async function getAnchorStandardsForStandard(standardId: string) {
  const { data } = await supabase
    .from("curriculum_standard_relationships")
    .select("*, source:curriculum_standards(*)")
    .eq("target_standard_id", standardId)
    .eq("relationship_type", "anchor-to-grade");
  return (data ?? []).map((relation) => relation.source as CurriculumStandard);
}

export async function getStandardsForNormalizedGrade(
  frameworkCode: string,
  normalizedGradeLabel: string
) {
  return listCurriculumStandards({
    frameworkCode,
    normalizedGradeLabel,
  });
}

export async function getStandardsForOfficialLevel(
  frameworkCode: string,
  officialLevelLabel: string
) {
  return listCurriculumStandards({
    frameworkCode,
    officialLevelLabel,
  });
}

export async function getStandardsGroupedByStrand(
  frameworkCode: string,
  normalizedGradeLabel: string
) {
  const standards = await getStandardsForNormalizedGrade(frameworkCode, normalizedGradeLabel);
  const grouped: Record<string, CurriculumStandard[]> = {};
  for (const standard of standards) {
    const key = standard.strand_id || "uncategorized";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(standard);
  }
  return grouped;
}

export function buildFriendlyLabel(params: {
  frameworkName?: string;
  subjectName?: string;
  levelLabel?: string;
}) {
  const pieces = [params.frameworkName, params.subjectName, params.levelLabel].filter(Boolean);
  return pieces.join(" • ");
}
