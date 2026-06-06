const AUSTRALIAN_STAGE_LABELS: Record<string, string> = {
  "foundation-kindergarten": "Foundation / Kindergarten",
  "lower-primary": "Lower Primary",
  "middle-primary": "Middle Primary",
  "upper-primary": "Upper Primary",
  "lower-secondary": "Lower Secondary",
  "years-9-10-consolidation": "Years 9–10 / consolidation",
};

const UNITED_STATES_STAGE_LABELS: Record<string, string> = {
  "foundation-kindergarten": "Kindergarten / Early Elementary",
  "lower-primary": "Early Elementary",
  "middle-primary": "Upper Elementary",
  "upper-primary": "Upper Elementary / Early Middle School",
  "lower-secondary": "Middle School",
  "years-9-10-consolidation": "High School Foundations",
};

const UNITED_KINGDOM_STAGE_LABELS: Record<string, string> = {
  "foundation-kindergarten": "Reception / Early Years",
  "lower-primary": "Key Stage 1",
  "middle-primary": "Lower Key Stage 2",
  "upper-primary": "Upper Key Stage 2",
  "lower-secondary": "Key Stage 3",
  "years-9-10-consolidation": "Key Stage 4 foundations",
};

function normaliseRegion(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getRegionalStageLabelSet(regionOrCountry: string | null | undefined) {
  const normalised = normaliseRegion(regionOrCountry);

  if (
    normalised === "us" ||
    normalised === "usa" ||
    normalised === "unitedstates" ||
    normalised === "unitedstatesofamerica"
  ) {
    return UNITED_STATES_STAGE_LABELS;
  }

  if (normalised === "au" || normalised === "australia") {
    return AUSTRALIAN_STAGE_LABELS;
  }

  if (
    normalised === "uk" ||
    normalised === "gb" ||
    normalised === "unitedkingdom" ||
    normalised === "england" ||
    normalised === "scotland" ||
    normalised === "wales" ||
    normalised === "northernireland"
  ) {
    return UNITED_KINGDOM_STAGE_LABELS;
  }

  return null;
}

export function getRegionalStageLabel(
  stageKey: string,
  regionOrCountry: string | null | undefined,
  fallbackLabel?: string | null,
) {
  return getRegionalStageLabelSet(regionOrCountry)?.[stageKey] || fallbackLabel || stageKey;
}
