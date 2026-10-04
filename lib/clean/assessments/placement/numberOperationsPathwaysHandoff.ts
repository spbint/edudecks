import type { NumberOperationsSubElementKey } from "./numberOperationsPlacementResult";

export type NumberOperationsPathwaysStrandKey =
  | "number-and-place-value"
  | "operations-and-calculation"
  | "financial-and-real-world-mathematics";

export type NumberOperationsPathwaysHandoff = {
  subjectKey: "mathematics";
  strandKey: NumberOperationsPathwaysStrandKey;
  strandLabel: string;
  href: string;
  mappingConfidence: "strand-level";
  note: string;
};

const STRAND_BY_SUB_ELEMENT: Record<
  NumberOperationsSubElementKey,
  { key: NumberOperationsPathwaysStrandKey; label: string }
> = {
  "number-place-value": {
    key: "number-and-place-value",
    label: "Number and place value",
  },
  "counting-processes": {
    key: "number-and-place-value",
    label: "Number and place value",
  },
  "additive-strategies": {
    key: "operations-and-calculation",
    label: "Operations and calculation",
  },
  "multiplicative-strategies": {
    key: "operations-and-calculation",
    label: "Operations and calculation",
  },
  "understanding-money": {
    key: "financial-and-real-world-mathematics",
    label: "Financial and real-world mathematics",
  },
};

export function buildNumberOperationsPathwaysHandoff(input: {
  subElementKey: NumberOperationsSubElementKey;
  learnerId?: string | null;
}): NumberOperationsPathwaysHandoff {
  const strand = STRAND_BY_SUB_ELEMENT[input.subElementKey];
  const params = new URLSearchParams({
    subjectKey: "mathematics",
    strandKey: strand.key,
  });
  const learnerId = String(input.learnerId ?? "").trim();
  if (learnerId) params.set("learnerId", learnerId);

  return {
    subjectKey: "mathematics",
    strandKey: strand.key,
    strandLabel: strand.label,
    href: `/my-pathways?${params.toString()}`,
    mappingConfidence: "strand-level",
    note:
      "This handoff is approved at strand level only. MyLearna does not claim an exact progression-level-to-pathway-step match until that academic mapping is reviewed.",
  };
}
