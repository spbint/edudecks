import { NUMBER_OPERATIONS_ANCHOR_SETS } from "./numberOperationsAnchors";
import { summarizeNumberOperationsRouteCoverage } from "./numberOperationsRouteCoverage";

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
  const bySubElement = NUMBER_OPERATIONS_ANCHOR_SETS.map((set) => {
    const summary = summarizeNumberOperationsRouteCoverage(set);
    return {
      key: set.key,
      label: set.label,
      minimumQuestions: summary.minQuestions,
      maximumQuestions: summary.maxQuestions,
    };
  });

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
