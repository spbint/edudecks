import type { NumberOperationsSubElementKey } from "./numberOperationsPlacementResult";
import {
  getNumberOperationsProgressionPathwayCrosswalkEntry,
  resolveNumberOperationsCrosswalkStep,
} from "./numberOperationsProgressionPathwayCrosswalk";

export type NumberOperationsPathwaysStrandKey =
  | "number-and-place-value"
  | "operations-and-calculation"
  | "financial-and-real-world-mathematics";

export type NumberOperationsPathwaysHandoff = {
  subjectKey: "mathematics";
  strandKey: NumberOperationsPathwaysStrandKey;
  strandLabel: string;
  href: string;
  mappingConfidence: "source-guided-step" | "strand-level";
  pathwayStepId: string | null;
  stepKey: string | null;
  stageKey: string | null;
  stepTitle: string | null;
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
  targetP?: number | null;
  learnerId?: string | null;
}): NumberOperationsPathwaysHandoff {
  const strand = STRAND_BY_SUB_ELEMENT[input.subElementKey];
  const params = new URLSearchParams({
    subjectKey: "mathematics",
    strandKey: strand.key,
  });
  const learnerId = String(input.learnerId ?? "").trim();
  if (learnerId) params.set("learnerId", learnerId);

  const crosswalk =
    input.targetP != null
      ? getNumberOperationsProgressionPathwayCrosswalkEntry(
          input.subElementKey,
          input.targetP,
        )
      : null;
  const resolved = crosswalk
    ? resolveNumberOperationsCrosswalkStep(crosswalk)
    : null;

  if (crosswalk?.confidence === "source-guided-step" && resolved) {
    params.set("stageKey", resolved.stageKey);
    params.set("pathwayStepId", resolved.id);
    params.set("stepKey", resolved.stepKey);
    return {
      subjectKey: "mathematics",
      strandKey: strand.key,
      strandLabel: strand.label,
      href: `/my-pathways?${params.toString()}`,
      mappingConfidence: "source-guided-step",
      pathwayStepId: resolved.id,
      stepKey: resolved.stepKey,
      stageKey: resolved.stageKey,
      stepTitle: resolved.stepTitle,
      note:
        "This is a source-guided next-learning handoff grounded in the QCAA numeracy progression and the current MyLearna Pathways sequence. It is not a claim that the MyLearna step is equivalent to the whole progression level.",
    };
  }

  return {
    subjectKey: "mathematics",
    strandKey: strand.key,
    strandLabel: strand.label,
    href: `/my-pathways?${params.toString()}`,
    mappingConfidence: "strand-level",
    pathwayStepId: null,
    stepKey: null,
    stageKey: null,
    stepTitle: null,
    note:
      "This handoff stays at strand level because a specific next-step mapping is not yet defensible enough. MyLearna does not invent an exact progression-level-to-pathway-step match.",
  };
}
