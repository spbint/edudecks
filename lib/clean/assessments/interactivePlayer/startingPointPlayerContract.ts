import type {
  MyLearnaAssessmentItem,
  MyLearnaAssessmentResponse,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import { scoreAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessScoring";

export type StartingPointInteractionKind =
  | "multiple-choice"
  | "numeric-entry"
  | "counter-counting"
  | "drag-to-order"
  | "place-value"
  | "australian-currency";

export type StartingPointPlayerAnswer = {
  itemId: string;
  itemVersion: number;
  selectedOptionIds: string[];
  responseValue?: string;
};

export type StartingPointPlayerModel = {
  kind: StartingPointInteractionKind;
  itemId: string;
  itemVersion: number;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  stimulus: MyLearnaAssessmentItem["stimulus"];
  allowsMultiple: boolean;
  requiresPracticalAlternative: boolean;
};

export function inferStartingPointInteraction(
  item: MyLearnaAssessmentItem,
): StartingPointInteractionKind {
  if (item.stimulus.type === "currency-tokens") return "australian-currency";
  if (item.stimulus.type === "place-value-blocks") return "place-value";
  if (item.stimulus.type === "counter-set") return "counter-counting";
  if (item.response.type === "ordering") return "drag-to-order";
  if (item.response.type === "short-answer") return "numeric-entry";
  return "multiple-choice";
}

export function adaptAssessmentItemForStartingPointPlayer(
  item: MyLearnaAssessmentItem,
): StartingPointPlayerModel {
  return {
    kind: inferStartingPointInteraction(item),
    itemId: item.id,
    itemVersion: item.version,
    prompt: item.prompt,
    options: (item.response.options || []).map((option) => ({
      id: option.id,
      label: option.label || String(option.value ?? ""),
    })),
    stimulus: item.stimulus,
    allowsMultiple: item.response.type === "multiple-choice",
    requiresPracticalAlternative:
      item.analytics?.tags?.includes("separate-accessible-form-required") ??
      false,
  };
}

export function scoreStartingPointPlayerAnswer(input: {
  item: MyLearnaAssessmentItem;
  answer: StartingPointPlayerAnswer;
  timeSpentSeconds: number;
}): MyLearnaAssessmentResponse {
  if (
    input.answer.itemId !== input.item.id ||
    input.answer.itemVersion !== input.item.version
  ) {
    throw new Error("Interactive response does not match the canonical item version.");
  }

  return scoreAssessmentItem(
    input.item,
    input.answer.selectedOptionIds,
    input.timeSpentSeconds,
    input.answer.responseValue,
  );
}
