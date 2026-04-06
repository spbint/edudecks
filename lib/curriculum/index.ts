/* eslint-disable max-lines */
/* ============================================================
   Curriculum mapping utilities (lightweight seed data)
============================================================ */

export type CurriculumCountry = {
  id: string;
  name: string;
  region_label: string;
  recommended_framework_id?: string;
};

export type CurriculumRegion = {
  id: string;
  country_id: string;
  name: string;
};

export type CurriculumFramework = {
  id: string;
  country_id: string;
  region_id?: string;
  name: string;
  description: string;
  recommended_for_country?: boolean;
  recommended_for_region?: boolean;
  recommended_level_id?: string;
  subject_ids: string[];
};

export type CurriculumLevel = {
  id: string;
  label: string;
  sort: number;
};

export type CurriculumSubject = {
  id: string;
  label: string;
  framework_ids: string[];
};

const DEMO_COUNTRIES: CurriculumCountry[] = [
  {
    id: "us",
    name: "United States",
    region_label: "State / region",
    recommended_framework_id: "common-core",
  },
];

const DEMO_REGIONS: CurriculumRegion[] = [
  { id: "us-ca", country_id: "us", name: "California" },
  { id: "us-tx", country_id: "us", name: "Texas" },
  { id: "us-fl", country_id: "us", name: "Florida" },
  { id: "us-va", country_id: "us", name: "Virginia" },
];

const DEMO_FRAMEWORKS: CurriculumFramework[] = [
  {
    id: "common-core",
    country_id: "us",
    name: "Common Core State Standards",
    description: "Widely adopted ELA and Mathematics standards for the United States.",
    recommended_for_country: true,
    recommended_level_id: "grade-3",
    subject_ids: ["ela", "math", "science", "humanities"],
  },
  {
    id: "texas-teks",
    country_id: "us",
    region_id: "us-tx",
    name: "Texas Essential Knowledge and Skills (TEKS)",
    description: "Texas-specific standards for Math and ELA.",
    recommended_for_region: true,
    recommended_level_id: "grade-3",
    subject_ids: ["ela", "math"],
  },
  {
    id: "florida-best",
    country_id: "us",
    region_id: "us-fl",
    name: "Florida B.E.S.T.",
    description: "Florida’s benchmark for learning progress.",
    subject_ids: ["ela", "math"],
  },
  {
    id: "virginia-sol",
    country_id: "us",
    region_id: "us-va",
    name: "Virginia Standards of Learning (SOL)",
    description: "Virginia’s learning standards for core subjects.",
    subject_ids: ["ela", "math"],
  },
];

const GRADE_LEVELS: CurriculumLevel[] = [
  { id: "kindergarten", label: "Kindergarten", sort: 0 },
  { id: "grade-1", label: "Grade 1", sort: 1 },
  { id: "grade-2", label: "Grade 2", sort: 2 },
  { id: "grade-3", label: "Grade 3", sort: 3 },
  { id: "grade-4", label: "Grade 4", sort: 4 },
  { id: "grade-5", label: "Grade 5", sort: 5 },
  { id: "grade-6", label: "Grade 6", sort: 6 },
  { id: "grade-7", label: "Grade 7", sort: 7 },
  { id: "grade-8", label: "Grade 8", sort: 8 },
  { id: "grade-9", label: "Grade 9", sort: 9 },
  { id: "grade-10", label: "Grade 10", sort: 10 },
];

const DEMO_SUBJECTS: CurriculumSubject[] = [
  { id: "ela", label: "English Language Arts", framework_ids: ["common-core", "texas-teks", "florida-best", "virginia-sol"] },
  { id: "math", label: "Mathematics", framework_ids: ["common-core", "texas-teks", "florida-best", "virginia-sol"] },
  { id: "science", label: "Science", framework_ids: ["common-core"] },
  { id: "humanities", label: "Humanities / Social Studies", framework_ids: ["common-core"] },
];

export async function loadCurriculumCountries(): Promise<CurriculumCountry[]> {
  return DEMO_COUNTRIES;
}

export async function loadCurriculumRegions(countryId?: string): Promise<CurriculumRegion[]> {
  if (!countryId) return DEMO_REGIONS;
  return DEMO_REGIONS.filter((region) => region.country_id === countryId);
}

export async function loadCurriculumFrameworks(
  countryId?: string,
  regionId?: string
): Promise<CurriculumFramework[]> {
  if (!countryId) return DEMO_FRAMEWORKS;
  return DEMO_FRAMEWORKS.filter((framework) => {
    const matchesCountry = framework.country_id === countryId;
    if (!matchesCountry) return false;
    if (regionId && framework.region_id) {
      return framework.region_id === regionId;
    }
    if (regionId && !framework.region_id) {
      return framework.recommended_for_country ?? true;
    }
    return true;
  });
}

export async function loadCurriculumLevels(): Promise<CurriculumLevel[]> {
  return GRADE_LEVELS;
}

export async function loadCurriculumSubjects(): Promise<CurriculumSubject[]> {
  return DEMO_SUBJECTS;
}

export function getRecommendedFrameworkId(
  countryId?: string | null,
  regionId?: string | null
): string | null {
  if (!countryId) return null;

  if (regionId) {
    const regionFramework = DEMO_FRAMEWORKS.find(
      (framework) =>
        framework.region_id === regionId && framework.recommended_for_region
    );
    if (regionFramework) return regionFramework.id;
  }

  const countryFramework = DEMO_FRAMEWORKS.find(
    (framework) =>
      framework.country_id === countryId && framework.recommended_for_country
  );
  return countryFramework?.id ?? null;
}

export function getRecommendedLevelId(frameworkId?: string | null): string | null {
  if (!frameworkId) return null;
  const framework = DEMO_FRAMEWORKS.find((candidate) => candidate.id === frameworkId);
  return framework?.recommended_level_id ?? null;
}

export function findFrameworkById(id?: string | null): CurriculumFramework | undefined {
  if (!id) return undefined;
  return DEMO_FRAMEWORKS.find((framework) => framework.id === id);
}

export function findLevelLabel(levelId?: string | null): string | undefined {
  if (!levelId) return undefined;
  return GRADE_LEVELS.find((level) => level.id === levelId)?.label;
}

export function findSubjectLabel(subjectId?: string | null): string | undefined {
  if (!subjectId) return undefined;
  return DEMO_SUBJECTS.find((subject) => subject.id === subjectId)?.label;
}
