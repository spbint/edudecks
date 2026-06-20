import type {
  ActivityV5,
  ActivityV5FractionSpec,
  ActivityV5Object,
  ActivityV5ResponseState,
} from "@/app/components/clean/activity-player-v5/types";
import type { MathsReviewQuestion } from "@/lib/clean/review/mathsReviewGenerator";

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim().toLowerCase();
  const fraction = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }
  const parsed = Number(text.replace(/,/g, "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function decimalPlaces(value: number) {
  const text = String(value);
  return text.includes(".") ? text.split(".")[1]?.length ?? 0 : 0;
}

function stepFromValue(value: number, rawValue: unknown) {
  const text = String(rawValue ?? "").trim();
  const fraction = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (Number.isFinite(denominator) && denominator > 0) return 1 / denominator;
  }
  const places = decimalPlaces(value);
  if (places >= 2) return 0.01;
  if (places === 1) return 0.1;
  return 1;
}

function uniqueNumbers(values: Array<number | null>) {
  return [...new Set(values.filter((value): value is number => value !== null && Number.isFinite(value)))];
}

function fractionSpec(value: unknown): ActivityV5FractionSpec | null {
  const text = String(value ?? "").trim().toLowerCase();
  const mixed = text.match(/^(-?\d+)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (mixed) {
    const wholeCount = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (Number.isFinite(wholeCount) && Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
      return { wholeCount, numerator, denominator, decimalEquivalent: wholeCount + numerator / denominator };
    }
  }
  const fraction = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0) {
      return { wholeCount: 0, numerator, denominator, decimalEquivalent: numerator / denominator };
    }
  }
  const decimal = numberValue(value);
  if (decimal !== null && decimal > 0 && decimal < 1) {
    const denominator = Math.abs(decimal * 4 - Math.round(decimal * 4)) < 0.001 ? 4 : 10;
    return {
      wholeCount: 0,
      numerator: Math.round(decimal * denominator),
      denominator,
      decimalEquivalent: decimal,
    };
  }
  return null;
}

function isFractionSpec(value: ActivityV5FractionSpec | null): value is ActivityV5FractionSpec {
  return value !== null;
}

function fractionConfig(question: MathsReviewQuestion) {
  const visual = question.visual;
  const parsed = fractionSpec(visual?.promptValue ?? question.answer) ?? fractionSpec(question.answer);
  const denominator = visual?.targetDenominator ?? visual?.denominator ?? parsed?.denominator ?? 0;
  const numerator = visual?.targetNumerator ?? visual?.shadedParts ?? parsed?.numerator ?? 0;
  const wholeCount = visual?.wholeCount ?? parsed?.wholeCount ?? 0;
  if (!denominator || denominator < 1 || numerator < 0 || denominator > 20) return null;

  const totalSelected = wholeCount * denominator + numerator;
  const allowedFractions: ActivityV5FractionSpec[] =
    visual?.allowedFractions ?? question.acceptableAnswers.map(fractionSpec).filter(isFractionSpec);

  return {
    denominator,
    targetDenominator: denominator,
    shadedParts: numerator,
    targetNumerator: numerator,
    wholeCount,
    selectedParts: visual?.selectedParts ?? Array.from({ length: totalSelected }, (_, index) => index),
    allowedFractions,
    equivalentAccepted: visual?.equivalentAccepted ?? question.acceptableAnswers.length > 1,
    decimalEquivalent: visual?.decimalEquivalent ?? parsed?.decimalEquivalent,
    tolerance: typeof visual?.decimalEquivalent === "number" || parsed?.decimalEquivalent !== undefined ? 0.001 : 0,
    labelMode: visual?.labelMode ?? (wholeCount > 0 ? "mixed" : "fraction"),
    promptValue: visual?.promptValue ?? question.answer,
  };
}

function numberLineConfig(question: MathsReviewQuestion) {
  const visual = question.visual;
  const targetRaw = visual?.targetValue ?? question.answer;
  const target = numberValue(targetRaw);
  if (target === null) return null;

  const values = uniqueNumbers([
    target,
    ...(visual?.values ?? []).map(numberValue),
    ...question.acceptableAnswers.map(numberValue),
  ]);
  const low = Math.min(...values, target);
  const high = Math.max(...values, target);
  const defaultStep = stepFromValue(target, targetRaw);

  let min = Number.isFinite(visual?.min) ? Number(visual?.min) : 0;
  let max = Number.isFinite(visual?.max) ? Number(visual?.max) : 10;
  let step = Number.isFinite(visual?.step) ? Number(visual?.step) : defaultStep;

  if (!Number.isFinite(visual?.min) || !Number.isFinite(visual?.max)) {
    if (low < 0) {
      min = Math.min(-10, Math.floor(low));
      max = Math.max(10, Math.ceil(high));
      step = Math.max(step, max - min > 20 ? 5 : 1);
    } else if (high <= 1 && defaultStep < 1) {
      min = 0;
      max = 1;
      step = defaultStep <= 0.01 ? 0.01 : defaultStep <= 0.1 ? 0.1 : 0.25;
    } else if (high <= 2 && defaultStep < 1) {
      min = 0;
      max = 2;
      step = Math.min(defaultStep, 0.5);
    } else if (high <= 5 && defaultStep < 1) {
      min = 0;
      max = 5;
      step = Math.min(defaultStep, 0.5);
    } else if (high <= 10) {
      min = 0;
      max = 10;
      step = 1;
    } else if (high <= 20) {
      min = 0;
      max = 20;
      step = 1;
    } else if (high <= 100) {
      min = 0;
      max = 100;
      step = 10;
    } else if (high <= 1000) {
      min = 0;
      max = Math.ceil(high / 100) * 100;
      step = 100;
    } else {
      min = Math.floor(low / 1000) * 1000;
      max = Math.ceil(high / 1000) * 1000;
      step = 1000;
    }
  }

  if (target < min) min = Math.floor(target);
  if (target > max) max = Math.ceil(target);
  if (max <= min) max = min + Math.max(step, 1);

  const tolerance = step < 1 ? step / 4 : 0;
  const tickLabels = {
    ...(visual?.tickLabels ?? {}),
    ...(min === 0 && max === 1
      ? {
          "0": "0",
          "0.25": "1/4",
          "0.5": "1/2",
          "0.75": "3/4",
          "1": "1",
        }
      : {}),
  };

  return {
    min,
    max,
    step,
    targetValue: Number(target.toFixed(6)),
    placedValue: Number(target.toFixed(6)),
    numberLineValue: Number(target.toFixed(6)),
    allowedValues: uniqueNumbers([target, ...question.acceptableAnswers.map(numberValue)]),
    tolerance,
    tickLabels,
  };
}

function moneyValue(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  if (text.includes("c") && !text.includes("$")) {
    const cents = numberValue(text);
    return cents === null ? null : cents / 100;
  }
  return numberValue(text);
}

function moneyConfig(question: MathsReviewQuestion) {
  const visual = question.visual;
  const target = moneyValue(visual?.targetTotal ?? visual?.targetValue ?? question.answer);
  if (target === null) return null;
  const tokenValues = visual?.tokenValues ?? [1, 5, 10, 20, 50];
  const selectedTokens = visual?.selectedTokens ?? (tokenValues.includes(target) ? [target] : undefined);
  return {
    currencySymbol: visual?.currencySymbol ?? "",
    currencyCode: visual?.currencyCode ?? "GEN",
    localisationMode: visual?.localisationMode ?? "generic",
    tokenValues,
    selectedTokens,
    selectedTokenIds: selectedTokens?.map((value) => `generic-token-${tokenValues.indexOf(value)}-${value}`),
    targetTotal: target,
    moneyTotal: target,
    priceTags: visual?.priceTags,
    selectedPriceTagId: visual?.selectedPriceTagId,
    itemContext: visual?.itemContext ?? question.bankLabel,
    showNotes: visual?.showNotes ?? true,
    showCoins: visual?.showCoins ?? true,
    allowMultipleTokens: visual?.allowMultipleTokens ?? true,
    tolerance: visual?.tolerance ?? 0.001,
  };
}

function timeValue(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  const digital = text.match(/(\d{1,2})\s*:\s*(\d{2})/);
  if (digital) {
    const hour = Number(digital[1]);
    const minute = Number(digital[2]);
    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      return { hour: hour % 12 || 12, minute: ((minute % 60) + 60) % 60 };
    }
  }
  const oclock = text.match(/(\d{1,2})\s*(?:o'clock|oclock|:00)?/);
  if (oclock) {
    const hour = Number(oclock[1]);
    if (Number.isFinite(hour)) return { hour: hour % 12 || 12, minute: 0 };
  }
  return null;
}

function clockConfig(question: MathsReviewQuestion) {
  const visual = question.visual;
  const parsed = timeValue(question.answer) ?? timeValue(question.prompt);
  const hour = visual?.targetHour ?? visual?.hour ?? parsed?.hour;
  const minute = visual?.targetMinute ?? visual?.minute ?? parsed?.minute ?? 0;
  if (!hour || hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  return {
    hour,
    minute,
    targetHour: hour,
    targetMinute: minute,
    allowedMinutes: visual?.allowedMinutes ?? (minute % 5 === 0 ? Array.from({ length: 12 }, (_, index) => index * 5) : Array.from({ length: 60 }, (_, index) => index)),
    clockMode: visual?.clockMode ?? "set",
    labelMode: visual?.labelMode ?? "both",
    eventContext: visual?.eventContext,
    tolerance: 0,
  };
}

function rulerUnit(value: unknown) {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("mm")) return "mm";
  if (text.includes("cm")) return "cm";
  if (text.includes("m")) return "m";
  return "cm";
}

function rulerConfig(question: MathsReviewQuestion) {
  const visual = question.visual;
  const targetLength = numberValue(visual?.targetLength ?? visual?.measuredLength ?? visual?.targetValue ?? question.answer);
  if (targetLength === null || targetLength < 0) return null;
  const unit = rulerUnit(visual?.unit ?? question.prompt);
  const max = Number.isFinite(visual?.max) ? Number(visual?.max) : Math.max(10, Math.ceil(targetLength * 1.15));
  const step = Number.isFinite(visual?.step)
    ? Number(visual?.step)
    : unit === "mm"
      ? 1
      : targetLength % 1 === 0
        ? 1
        : 0.5;
  return {
    unit,
    min: Number.isFinite(visual?.min) ? Number(visual?.min) : 0,
    max,
    step,
    targetLength,
    measuredLength: targetLength,
    tolerance: visual?.tolerance ?? (step < 1 ? step / 2 : 0),
    objectLabel: visual?.objectLabel ?? question.bankLabel,
    objectVisual: visual?.objectVisual ?? "pencil",
    estimate: visual?.estimate,
    showEstimate: visual?.showEstimate ?? false,
    labelMode: visual?.labelMode ?? "both",
  };
}

function capacityUnit(value: unknown) {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("l") && !text.includes("ml")) return "L";
  return "mL";
}

function capacityConfig(question: MathsReviewQuestion) {
  const visual = question.visual;
  const targetCapacity = numberValue(visual?.targetCapacity ?? visual?.measuredCapacity ?? visual?.targetValue ?? question.answer);
  if (targetCapacity === null || targetCapacity < 0) return null;
  const unit = capacityUnit(visual?.unit ?? question.answer ?? question.prompt);
  const max = Number.isFinite(visual?.max) ? Number(visual?.max) : Math.max(unit === "L" ? 2 : 1000, Math.ceil(targetCapacity * 1.15));
  const step = Number.isFinite(visual?.step) ? Number(visual?.step) : unit === "L" ? 0.25 : 50;
  return {
    unit,
    min: Number.isFinite(visual?.min) ? Number(visual?.min) : 0,
    max,
    step,
    targetCapacity,
    measuredCapacity: targetCapacity,
    tolerance: visual?.tolerance ?? (step < 1 ? step / 2 : 0),
    containerLabel: visual?.containerLabel ?? "Measuring jug",
    containerVisual: visual?.containerVisual ?? "jug",
    fillLevel: visual?.fillLevel ?? 0,
    estimate: visual?.estimate,
    showEstimate: visual?.showEstimate ?? false,
    labelMode: visual?.labelMode ?? "both",
    conversionMode: visual?.conversionMode ?? true,
  };
}

function massUnit(value: unknown) {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("kg")) return "kg";
  return "g";
}

function massConfig(question: MathsReviewQuestion) {
  const visual = question.visual;
  const targetMass = numberValue(visual?.targetMass ?? visual?.measuredMass ?? visual?.targetValue ?? question.answer);
  if (targetMass === null || targetMass < 0) return null;
  const unit = massUnit(visual?.unit ?? question.answer ?? question.prompt);
  const max = Number.isFinite(visual?.max) ? Number(visual?.max) : Math.max(unit === "kg" ? 5 : 1000, Math.ceil(targetMass * 1.15));
  const step = Number.isFinite(visual?.step) ? Number(visual?.step) : unit === "kg" ? 0.5 : 50;
  return {
    unit,
    min: Number.isFinite(visual?.min) ? Number(visual?.min) : 0,
    max,
    step,
    targetMass,
    measuredMass: targetMass,
    tolerance: visual?.tolerance ?? (step < 1 ? step / 2 : 0),
    objectLabel: visual?.objectLabel ?? "Object",
    objectVisual: visual?.objectVisual ?? "package",
    scaleType: visual?.scaleType ?? "digital",
    estimate: visual?.estimate,
    showEstimate: visual?.showEstimate ?? false,
    labelMode: visual?.labelMode ?? "both",
    conversionMode: visual?.conversionMode ?? true,
  };
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
    const config = numberLineConfig(question);
    if (!config) return null;
    return {
      ...base(question),
      interactionType: "interactive_number_line",
      visualModel: "number_line",
      objects: [],
      targets: [],
      correctState: config,
    };
  }

  if (visual.visualModel === "array_board") {
    const rows = visual.rows ?? 0;
    const columns = visual.columns ?? 0;
    if (!rows || !columns || rows > 12 || columns > 12) return null;
    return {
      ...base(question),
      interactionType: "build_array",
      visualModel: "array_board",
      objects: [],
      targets: [],
      correctState: {
        rows,
        columns,
        targetRows: visual.targetRows ?? rows,
        targetColumns: visual.targetColumns ?? columns,
        total: visual.total ?? rows * columns,
        targetTotal: visual.targetTotal ?? rows * columns,
        arrangementMode: visual.arrangementMode ?? "array",
        allowCommutativeArrays: visual.allowCommutativeArrays ?? true,
        repeatedAdditionSentence: visual.repeatedAdditionSentence,
        multiplicationSentence: visual.multiplicationSentence,
        objectVisual: visual.objectVisual ?? "counter",
      },
    };
  }

  if (visual.visualModel === "equal_groups_board") {
    const groupCount = visual.groupCount ?? visual.targetGroupCount ?? 0;
    const itemsPerGroup = visual.itemsPerGroup ?? visual.targetItemsPerGroup ?? 0;
    if (!groupCount || groupCount > 12 || itemsPerGroup > 24) return null;
    return {
      ...base(question),
      interactionType: "equal_groups",
      visualModel: "equal_groups_board",
      objects: [],
      targets: [],
      correctState: {
        groupCount,
        itemsPerGroup,
        targetGroupCount: visual.targetGroupCount ?? groupCount,
        targetItemsPerGroup: visual.targetItemsPerGroup ?? itemsPerGroup,
        total: visual.total ?? groupCount * itemsPerGroup,
        targetTotal: visual.targetTotal ?? groupCount * itemsPerGroup,
        arrangementMode: visual.arrangementMode ?? "equal_groups",
        repeatedAdditionSentence: visual.repeatedAdditionSentence,
        multiplicationSentence: visual.multiplicationSentence,
        divisionSentence: visual.divisionSentence,
        objectVisual: visual.objectVisual ?? "counter",
      },
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
    const config = fractionConfig(question);
    if (!config) return null;
    return {
      ...base(question),
      interactionType: "interactive_fraction_bar",
      visualModel: "fraction_bar",
      objects: [],
      targets: [],
      correctState: config,
    };
  }

  if (visual.visualModel === "fraction_comparison_board") {
    const leftFraction = visual.leftFraction ?? fractionSpec(visual.leftLabel);
    const rightFraction = visual.rightFraction ?? fractionSpec(visual.rightLabel);
    if (!leftFraction || !rightFraction || !visual.comparisonAnswer) return null;
    return {
      ...base(question),
      interactionType: "fraction_comparison",
      visualModel: "fraction_comparison_board",
      objects: [],
      targets: [],
      correctState: {
        leftFraction,
        rightFraction,
        leftLabel: visual.leftLabel ?? `${leftFraction.numerator}/${leftFraction.denominator}`,
        rightLabel: visual.rightLabel ?? `${rightFraction.numerator}/${rightFraction.denominator}`,
        comparisonAnswer: visual.comparisonAnswer,
      },
    };
  }

  if (visual.visualModel === "ruler_board") {
    const config = rulerConfig(question);
    if (!config) return null;
    return {
      ...base(question),
      interactionType: "interactive_ruler",
      visualModel: "ruler_board",
      objects: [],
      targets: [],
      correctState: config,
    };
  }

  if (visual.visualModel === "capacity_jug") {
    const config = capacityConfig(question);
    if (!config) return null;
    return {
      ...base(question),
      interactionType: "interactive_capacity_jug",
      visualModel: "capacity_jug",
      objects: [],
      targets: [],
      correctState: config,
    };
  }

  if (visual.visualModel === "mass_scale") {
    const config = massConfig(question);
    if (!config) return null;
    return {
      ...base(question),
      interactionType: "interactive_mass_scale",
      visualModel: "mass_scale",
      objects: [],
      targets: [],
      correctState: config,
    };
  }

  if (visual.visualModel === "clock_face") {
    const config = clockConfig(question);
    if (!config) return null;
    return {
      ...base(question),
      interactionType: "interactive_clock",
      visualModel: "clock_face",
      objects: [],
      targets: [],
      correctState: config,
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
    const config = moneyConfig(question);
    if (!config) return null;
    const objects = config.tokenValues.map((value, index) => ({
      id: `generic-token-${index}-${value}`,
      label: `${config.currencySymbol}${value}`,
      value,
      type: value >= 20 ? "note" : "coin",
      selectable: true,
    }));
    return {
      ...base(question),
      interactionType: "generic_money_model",
      visualModel: "money_board",
      objects,
      targets: [],
      correctState: config,
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
