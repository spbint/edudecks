import type { NumberOperationsSubElementKey } from "./numberOperationsPlacementResult";
import { buildNumberOperationsPathwaysHandoff } from "./numberOperationsPathwaysHandoff";

export type NumberOperationsPracticeTarget = {
  kind: "broad-practice-family" | "pathways-review";
  label: string;
  href: string;
  moduleId: string | null;
  mappingConfidence: "broad-family" | "fallback";
  note: string;
};

function practiceHref(input: {
  moduleId: string;
  subElementKey: NumberOperationsSubElementKey;
  targetP: number;
  learnerId?: string | null;
  returnTo: string;
}) {
  const params = new URLSearchParams({
    moduleId: input.moduleId,
    source: "maths-starting-point",
    sourceAssessmentBand: `mylearna-au-numeracy-v9-p${input.targetP}`,
    sourceProgressionStep: `P${input.targetP}`,
    sourceSubElement: input.subElementKey,
    returnTo: input.returnTo,
  });
  const learnerId = String(input.learnerId ?? "").trim();
  if (learnerId) params.set("learnerId", learnerId);
  return `/practice/maths-starting-point?${params.toString()}`;
}

function moduleTarget(
  moduleId: string,
  label: string,
  subElementKey: NumberOperationsSubElementKey,
  targetP: number,
  note: string,
  learnerId: string | null | undefined,
  returnTo: string,
): NumberOperationsPracticeTarget {
  return {
    kind: "broad-practice-family",
    label,
    href: practiceHref({
      moduleId,
      subElementKey,
      targetP,
      learnerId,
      returnTo,
    }),
    moduleId,
    mappingConfidence: "broad-family",
    note,
  };
}

function pathwaysFallback(
  subElementKey: NumberOperationsSubElementKey,
  targetP: number | null,
  note: string,
  learnerId?: string | null,
): NumberOperationsPracticeTarget {
  const handoff = buildNumberOperationsPathwaysHandoff({
    subElementKey,
    targetP,
    learnerId,
  });
  return {
    kind: "pathways-review",
    label: `Review ${handoff.strandLabel} in My Pathways`,
    href: handoff.href,
    moduleId: null,
    mappingConfidence: "fallback",
    note: `${note} ${handoff.note}`,
  };
}

export function getNumberOperationsPracticeTarget(input: {
  subElementKey: NumberOperationsSubElementKey;
  targetP: number | null;
  learnerId?: string | null;
  returnTo?: string;
}): NumberOperationsPracticeTarget {
  const { subElementKey, targetP, learnerId } = input;
  const cleanLearnerId = String(learnerId ?? "").trim();
  const defaultReturnTo = cleanLearnerId
    ? `/assessments/maths-starting-point?${new URLSearchParams({
        learnerId: cleanLearnerId,
      }).toString()}`
    : "/assessments/maths-starting-point";
  const returnTo =
    String(input.returnTo ?? "").trim() || defaultReturnTo;

  if (!targetP) {
    return pathwaysFallback(
      subElementKey,
      targetP,
      "No progression target is available, so MyLearna should not invent a practice-module match.",
      learnerId,
    );
  }

  if (subElementKey === "number-place-value") {
    if (targetP >= 6 && targetP <= 8) {
      return moduleTarget(
        "number-place-value-operations-practice-module-v1",
        "Practise place value and operations",
        subElementKey,
        targetP,
        "This existing module directly covers place value, number structure, comparison, ordering and rounding. It is a broad family match rather than a one-to-one progression-level mapping.",
        learnerId,
        returnTo,
      );
    }
    return pathwaysFallback(
      subElementKey,
      targetP,
      "The existing place-value module is not a clean age/construct match for this progression target, so use My Pathways rather than force-fit the module.",
      learnerId,
    );
  }

  if (subElementKey === "counting-processes") {
    return pathwaysFallback(
      subElementKey,
      targetP,
      "Counting is distributed through step-specific pathway practice rather than one canonical counting module. Exact progression-to-step mapping still needs academic review.",
      learnerId,
    );
  }

  if (subElementKey === "additive-strategies") {
    if (targetP >= 6 && targetP <= 8) {
      return moduleTarget(
        "number-additive-strategies-practice-module-v1",
        "Practise additive strategies",
        subElementKey,
        targetP,
        "The existing additive-strategies module is a direct broad-family match for flexible addition/subtraction strategy development.",
        learnerId,
        returnTo,
      );
    }
    if (targetP >= 9) {
      return moduleTarget(
        "number-rational-operations-practice-module-v1",
        "Practise rational-number operations",
        subElementKey,
        targetP,
        "Later additive progression includes decimal and fraction operations, so the rational-operations module is the closest existing broad-family match.",
        learnerId,
        returnTo,
      );
    }
    return pathwaysFallback(
      subElementKey,
      targetP,
      "The existing additive module does not cleanly represent the earlier observed-strategy progression levels.",
      learnerId,
    );
  }

  if (subElementKey === "multiplicative-strategies") {
    if (targetP >= 5 && targetP <= 8) {
      return moduleTarget(
        "number-multiplication-division-fluency-practice-module-v1",
        "Practise multiplication and division",
        subElementKey,
        targetP,
        "The existing multiplication/division fluency module is a broad-family match for equal groups, facts, division and increasingly flexible multiplicative strategies.",
        learnerId,
        returnTo,
      );
    }
    return pathwaysFallback(
      subElementKey,
      targetP,
      "Later multiplicative progression mixes rational-number operations, factors, exponents and percentages, so one existing module would overstate the match.",
      learnerId,
    );
  }

  if (subElementKey === "understanding-money") {
    if (targetP >= 5 && targetP <= 7) {
      return moduleTarget(
        "number-money-practical-contexts-practice-module-v1",
        "Practise money and practical contexts",
        subElementKey,
        targetP,
        "The existing money module broadly matches counting money, totals, change and multiplicative money contexts.",
        learnerId,
        returnTo,
      );
    }
    if (targetP >= 8) {
      return moduleTarget(
        "number-percent-ratio-finance-practice-module-v1",
        "Practise percent, ratio and finance",
        subElementKey,
        targetP,
        "Later money progression uses discounts, interest, percentage change and financial comparison; the percent/ratio/finance module is the closest existing broad-family match.",
        learnerId,
        returnTo,
      );
    }
    return pathwaysFallback(
      subElementKey,
      targetP,
      "Early money progression depends on denomination recognition and concrete money experiences rather than the current broad practice modules.",
      learnerId,
    );
  }

  return pathwaysFallback(
      subElementKey,
      targetP,
      "No reviewed practice-family mapping exists.",
      learnerId,
  );
}
