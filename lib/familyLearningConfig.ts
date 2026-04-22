import type { FamilyLearner } from "@/lib/familyWorkspace";
import type {
  AcademicStructureType,
  FamilyCountry,
  FamilyProfileRow,
  ReportingMode,
} from "@/lib/familySettings";
import {
  frameworkOptionById,
  jurisdictionLabelFor,
  presetFromFrameworkSelection,
} from "@/lib/curriculumFrameworks";

export type EffectiveLearnerLearningConfig = {
  country: FamilyCountry;
  frameworkId: string;
  jurisdictionId: string;
  frameworkLabel: string;
  jurisdictionLabel: string;
  reportingMode: ReportingMode;
  academicStructureType: AcademicStructureType;
  cycleCount: number | null;
  weeksPerCycle: number | null;
  yearBand: string;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function resolveEffectiveLearnerLearningConfig(
  profile: FamilyProfileRow,
  learner?: FamilyLearner | null,
): EffectiveLearnerLearningConfig {
  const country = (safe(profile.country) || safe(profile.preferred_market) || "au") as FamilyCountry;
  const frameworkId =
    safe(learner?.curriculum_framework_id) || safe(profile.curriculum_framework_id) || "au-v9";
  const jurisdictionId =
    safe(learner?.curriculum_jurisdiction_id) ||
    safe(profile.curriculum_jurisdiction_id) ||
    "tas";
  const reportingMode = (safe(learner?.reporting_mode) ||
    safe(profile.reporting_mode) ||
    "family-summary") as ReportingMode;
  const yearBand =
    safe(learner?.year_band) ||
    safe(learner?.yearLabel) ||
    "Year band not set";
  const frameworkOption = frameworkOptionById(frameworkId);
  const preset = presetFromFrameworkSelection({
    country,
    frameworkId,
    jurisdictionId,
  });

  return {
    country,
    frameworkId,
    jurisdictionId,
    frameworkLabel: frameworkOption?.label || preset.framework,
    jurisdictionLabel:
      jurisdictionLabelFor(country, jurisdictionId) || preset.jurisdiction,
    reportingMode,
    academicStructureType: profile.academic_structure_type,
    cycleCount: profile.cycle_count,
    weeksPerCycle: profile.weeks_per_cycle,
    yearBand,
  };
}
