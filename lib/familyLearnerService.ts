import {
  familyYearLevelLabelFromStored,
  familyYearLevelOptionFromStored,
  familyYearLevelToStoredNumber,
} from "@/lib/familyLearnerYearLevel";

const FAMILY_CHILDREN_CACHE_KEY = "edudecks_children_seed_v1";

export type CanonicalLearnerInput = {
  learnerName: string;
  yearLevel?: string | number | null;
  yearBand?: string | null;
  frameworkId?: string | null;
  jurisdictionId?: string | null;
  reportingMode?: string | null;
};

export type CanonicalLearnerRecord = {
  id: string;
  label: string;
  yearLabel: string;
  year_level: number | null;
  year_band: string | null;
  curriculum_framework_id: string | null;
  curriculum_jurisdiction_id: string | null;
  reporting_mode: string | null;
  connectedAt: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function readLocalLearners(): CanonicalLearnerRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FAMILY_CHILDREN_CACHE_KEY);
    const rows = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(rows)) return [];

    return rows
      .map((row): CanonicalLearnerRecord | null => {
        const id = safe(row?.id);
        const label = safe(row?.label || row?.name || row?.preferred_name || row?.first_name);
        if (!id || !label) return null;
        const yearLevel = familyYearLevelToStoredNumber(row?.year_level ?? row?.yearLabel);
        return {
          id,
          label,
          yearLabel: familyYearLevelLabelFromStored(yearLevel),
          year_level: yearLevel,
          year_band: safe(row?.year_band) || null,
          curriculum_framework_id: safe(row?.curriculum_framework_id) || null,
          curriculum_jurisdiction_id: safe(row?.curriculum_jurisdiction_id) || null,
          reporting_mode: safe(row?.reporting_mode) || null,
          connectedAt: safe(row?.connectedAt ?? row?.created_at) || null,
        };
      })
      .filter(Boolean) as CanonicalLearnerRecord[];
  } catch {
    return [];
  }
}

function writeLocalLearners(learners: CanonicalLearnerRecord[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      FAMILY_CHILDREN_CACHE_KEY,
      JSON.stringify(
        learners.map((learner) => ({
          id: learner.id,
          label: learner.label,
          name: learner.label,
          yearLabel: learner.yearLabel,
          year_level: learner.year_level ?? "",
          year_band: learner.year_band ?? "",
          curriculum_framework_id: learner.curriculum_framework_id ?? "",
          curriculum_jurisdiction_id: learner.curriculum_jurisdiction_id ?? "",
          reporting_mode: learner.reporting_mode ?? "",
          connectedAt: learner.connectedAt,
        })),
      ),
    );
  } catch {
    // local cache writes are best-effort
  }
}

function validateLearnerInput(input: CanonicalLearnerInput) {
  const learnerName = safe(input.learnerName);
  if (!learnerName) {
    throw new Error("Add a name before saving.");
  }

  const rawYearLevel = safe(input.yearLevel);
  if (rawYearLevel && !familyYearLevelOptionFromStored(input.yearLevel)) {
    throw new Error("Choose a year level from the list before saving.");
  }

  return {
    learnerName,
    yearLevelNumber: familyYearLevelToStoredNumber(input.yearLevel),
    yearBand: safe(input.yearBand) || null,
    frameworkId: safe(input.frameworkId) || null,
    jurisdictionId: safe(input.jurisdictionId) || null,
    reportingMode: safe(input.reportingMode) || null,
  };
}

export async function resolveCurrentFamilyProfileId(
  userId: string,
  options?: { ensure?: boolean },
) {
  void userId;
  void options;
  return null;
}

export async function createCanonicalFamilyLearner(
  userId: string,
  input: CanonicalLearnerInput,
) {
  void userId;
  const validated = validateLearnerInput(input);
  const record: CanonicalLearnerRecord = {
    id: `local-${Date.now()}`,
    label: validated.learnerName,
    yearLabel: familyYearLevelLabelFromStored(validated.yearLevelNumber),
    year_level: validated.yearLevelNumber,
    year_band: validated.yearBand,
    curriculum_framework_id: validated.frameworkId,
    curriculum_jurisdiction_id: validated.jurisdictionId,
    reporting_mode: validated.reportingMode,
    connectedAt: new Date().toISOString(),
  };

  writeLocalLearners([record, ...readLocalLearners().filter((learner) => learner.id !== record.id)]);
  return record;
}

export async function updateCanonicalFamilyLearner(
  userId: string,
  learnerId: string,
  input: CanonicalLearnerInput,
) {
  void userId;
  const validated = validateLearnerInput(input);
  writeLocalLearners(
    readLocalLearners().map((learner) =>
      learner.id === learnerId
        ? {
            ...learner,
            label: validated.learnerName,
            yearLabel: familyYearLevelLabelFromStored(validated.yearLevelNumber),
            year_level: validated.yearLevelNumber,
            year_band: validated.yearBand,
            curriculum_framework_id: validated.frameworkId,
            curriculum_jurisdiction_id: validated.jurisdictionId,
            reporting_mode: validated.reportingMode,
          }
        : learner,
    ),
  );
}

export async function removeCanonicalFamilyLearner(
  userId: string,
  learnerId: string,
) {
  void userId;
  writeLocalLearners(readLocalLearners().filter((learner) => learner.id !== learnerId));
}
