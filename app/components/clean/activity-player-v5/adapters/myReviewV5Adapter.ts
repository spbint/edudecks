import type {
  ActivityV5,
  ActivityV5Object,
  ActivityV5ResponseState,
} from "@/app/components/clean/activity-player-v5/types";
import type { MathsReviewQuestion } from "@/lib/clean/review/mathsReviewGenerator";

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function moneyValue(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  if (text.includes("c") && !text.includes("$")) {
    const cents = numberValue(text);
    return cents === null ? null : cents / 100;
  }
  return numberValue(text);
}

function choiceObjects(question: MathsReviewQuestion): ActivityV5Object[] {
  const labels = question.choices?.length
    ? question.choices
    : question.visual?.labels?.length
      ? question.visual.labels
      : [question.answer];

  return labels.map((label, index) => ({
    id: `choice-${index}-${label}`.replace(/\s+/g, "-").toLowerCase(),
    label,
    type: shapeType(label),
    selectable: true,
  }));
}

function shapeType(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("triangle")) return "triangle";
  if (lower.includes("circle") || lower.includes("sphere")) return "circle";
  if (lower.includes("rectangle")) return "rectangle";
  if (lower.includes("square") || lower.includes("right angle")) return "square";
  if (lower.includes("cube")) return "cube";
  if (lower.includes("cylinder")) return "cylinder";
  return "circle";
}

function selectedChoiceId(question: MathsReviewQuestion) {
  return choiceObjects(question).find((object) => object.label === question.answer)?.id;
}

function feedback(question: MathsReviewQuestion) {
  return {
    correct: "Correct. This is good review practice.",
    incorrect: question.explanation || `Check the model again. The answer is ${question.answer}.`,
    hint: question.visualHint,
  };
}

function base(question: MathsReviewQuestion): Pick<ActivityV5, "id" | "strand" | "step" | "mode" | "prompt" | "instruction" | "feedback" | "supportHint" | "worksheetReference" | "metadata"> {
  return {
    id: question.id,
    strand: "My Review",
    step: question.bankLabel,
    mode: "practise",
    prompt: question.prompt,
    instruction: question.visual?.note ?? question.visualHint ?? "Use the model to answer the review question.",
    feedback: feedback(question),
    supportHint: question.visualHint,
    worksheetReference: "My Review practice-only retrieval question",
    metadata: {
      source: "my-review-v5-adapter",
      bankId: question.bankId,
      bankLabel: question.bankLabel,
      answer: question.answer,
    },
  };
}

export function myReviewQuestionToActivityV5(question: MathsReviewQuestion): ActivityV5 | null {
  const visual = question.visual;
  if (!visual) return null;

  if (visual.visualModel === "number_line") {
    const target = numberValue(visual.targetValue ?? question.answer);
    if (target === null || target < 0 || target > 10 || !Number.isInteger(target)) return null;
    return {
      ...base(question),
      interactionType: "interactive_number_line",
      visualModel: "number_line",
      objects: [],
      targets: [],
      correctState: { numberLineValue: target },
    };
  }

  if (visual.visualModel === "array_board") {
    const rows = visual.rows ?? 0;
    const columns = visual.columns ?? 0;
    if (!rows || !columns || rows > 8 || columns > 8) return null;
    return {
      ...base(question),
      interactionType: "build_array",
      visualModel: "array_board",
      objects: [],
      targets: [],
      correctState: { rows, columns },
    };
  }

  if (visual.visualModel === "place_value_blocks") {
    const value = numberValue(visual.targetValue);
    if (value === null || value < 0 || value > 999 || !Number.isInteger(value)) return null;
    return {
      ...base(question),
      interactionType: "build_place_value",
      visualModel: "place_value_blocks",
      objects: [],
      targets: [],
      correctState: {
        hundreds: Math.floor(value / 100),
        tens: Math.floor((value % 100) / 10),
        ones: value % 10,
      },
    };
  }

  if (visual.visualModel === "fraction_bar") {
    const denominator = visual.denominator ?? 0;
    const shadedParts = visual.shadedParts ?? 0;
    if (!denominator || !shadedParts) return null;
    return {
      ...base(question),
      interactionType: "interactive_fraction_bar",
      visualModel: "fraction_bar",
      objects: [],
      targets: [],
      correctState: { denominator, shadedParts },
    };
  }

  if (visual.visualModel === "ruler_board") {
    const measuredLength = numberValue(visual.targetValue ?? question.answer);
    if (measuredLength === null || measuredLength < 1 || measuredLength > 10) return null;
    return {
      ...base(question),
      interactionType: "interactive_ruler",
      visualModel: "ruler_board",
      objects: [],
      targets: [],
      correctState: { measuredLength, tolerance: 0 },
    };
  }

  if (visual.visualModel === "clock_face") {
    if (!visual.hour) return null;
    return {
      ...base(question),
      interactionType: "interactive_clock",
      visualModel: "clock_face",
      objects: [],
      targets: [],
      correctState: { hour: visual.hour, minute: visual.minute ?? 0 },
    };
  }

  if (visual.visualModel === "shape_board") {
    const objects = choiceObjects(question);
    const selectedObjectId = selectedChoiceId(question);
    if (!selectedObjectId) return null;
    return {
      ...base(question),
      interactionType: "click_objects",
      visualModel: "shape_board",
      objects,
      targets: [],
      correctState: { selectedObjectIds: [selectedObjectId] },
    };
  }

  if (visual.visualModel === "coordinate_grid") {
    const coordinate = String(visual.targetValue ?? question.answer).toUpperCase();
    if (!/^[A-D][1-4]$/.test(coordinate)) return null;
    return {
      ...base(question),
      interactionType: "plot_coordinates",
      visualModel: "coordinate_grid",
      objects: [],
      targets: [],
      correctState: { plottedCoordinates: [coordinate] },
    };
  }

  if (visual.visualModel === "ten_frame") {
    const count = numberValue(visual.targetValue ?? question.answer);
    if (count === null || count < 0 || count > 10 || !Number.isInteger(count)) return null;
    const objects = Array.from({ length: 10 }, (_, index) => ({
      id: `frame-${index + 1}`,
      label: String(index + 1),
      type: "circle",
      selectable: true,
    }));
    return {
      ...base(question),
      instruction: "Click the filled spaces that match the ten-frame amount.",
      interactionType: "click_objects",
      visualModel: "shape_board",
      objects,
      targets: [],
      correctState: {
        selectedObjectIds: objects.slice(0, count).map((object) => object.id),
      },
    };
  }

  if (visual.visualModel === "money_board") {
    const target = moneyValue(question.answer);
    if (target === null) return null;
    const objects = [
      { id: "token-0-5", label: "0.50", value: 0.5 },
      { id: "token-1", label: "1", value: 1 },
      { id: "token-2", label: "2", value: 2 },
      { id: "token-5", label: "5", value: 5 },
      { id: "token-10", label: "10", value: 10 },
    ];
    return {
      ...base(question),
      interactionType: "generic_money_model",
      visualModel: "money_board",
      objects,
      targets: [],
      correctState: { moneyTotal: target, tolerance: 0.001 },
    };
  }

  return null;
}

export function formatMyReviewV5Response(response: ActivityV5ResponseState) {
  const parts = [
    response.numberLineValue !== undefined ? `number-line:${response.numberLineValue}` : "",
    response.rows && response.columns ? `array:${response.rows}x${response.columns}` : "",
    response.hundreds !== undefined || response.tens !== undefined || response.ones !== undefined
      ? `place-value:${response.hundreds ?? 0}h ${response.tens ?? 0}t ${response.ones ?? 0}o`
      : "",
    response.shadedParts && response.denominator ? `fraction:${response.shadedParts}/${response.denominator}` : "",
    response.measuredLength !== undefined ? `measure:${response.measuredLength}` : "",
    response.hour !== undefined ? `time:${response.hour}:${String(response.minute ?? 0).padStart(2, "0")}` : "",
    response.selectedObjectIds?.length ? `selected:${response.selectedObjectIds.join(",")}` : "",
    response.plottedCoordinates?.length ? `plotted:${response.plottedCoordinates.join(",")}` : "",
    response.moneyTotal !== undefined ? `money:${response.moneyTotal}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join("; ") : JSON.stringify(response);
}
