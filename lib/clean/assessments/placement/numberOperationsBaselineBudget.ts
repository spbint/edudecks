import { NUMBER_OPERATIONS_ANCHOR_SETS } from "./numberOperationsAnchors";

export type NumberOperationsBaselineBudget = {
  areaCount: number;
  minimumQuestions: number;
  maximumQuestions: number;
  bySubElement: Array<{
    key: (typeof NUMBER_OPERATIONS_ANCHOR_SETS)[number]["key"];
    label: string;
    minimumQuestions: number;
    maximumQuestions: number;
  }>;
};

export function getNumberOperationsBaselineBudget(): NumberOperationsBaselineBudget {
  // The executable estate is contract-tested separately. Keeping these validated
  // bounds answer-free prevents the real learner bundle from importing the
  // protected canonical item registry merely to display progress guidance.
  const bySubElement = NUMBER_OPERATIONS_ANCHOR_SETS.map((set) => ({
    key: set.key,
    label: set.label,
    minimumQuestions: 6,
    maximumQuestions: 11,
  }));

  return {
    areaCount: bySubElement.length,
    minimumQuestions: bySubElement.reduce(
      (total, area) => total + area.minimumQuestions,
      0,
    ),
    maximumQuestions: bySubElement.reduce(
      (total, area) => total + area.maximumQuestions,
      0,
    ),
    bySubElement,
  };
}
