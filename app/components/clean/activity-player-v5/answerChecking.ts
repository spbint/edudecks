import type {
  ActivityV5,
  ActivityV5CheckResult,
  ActivityV5FractionSpec,
  ActivityV5ResponseState,
} from "@/app/components/clean/activity-player-v5/types";

function normaliseList(values?: Array<number | string>) {
  return (values ?? []).map(String).map((value) => value.trim().toLowerCase()).sort();
}

function sameList(a?: Array<number | string>, b?: Array<number | string>) {
  const left = normaliseList(a);
  const right = normaliseList(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function samePlacements(
  actual?: Record<string, string>,
  expected?: Record<string, string>,
) {
  const expectedEntries = Object.entries(expected ?? {});
  if (!expectedEntries.length) return false;
  return expectedEntries.every(([objectId, targetId]) => actual?.[objectId] === targetId);
}

function closeEnough(actual?: number, expected?: number, tolerance = 0) {
  if (typeof actual !== "number" || typeof expected !== "number") return false;
  return Math.abs(actual - expected) <= tolerance;
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function lengthInMillimetres(value?: number, unit?: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (unit === "m") return value * 1000;
  if (unit === "cm") return value * 10;
  return value;
}

function capacityInMillilitres(value?: number, unit?: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (unit === "L" || unit === "l") return value * 1000;
  return value;
}

function massInGrams(value?: number, unit?: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (unit === "kg") return value * 1000;
  return value;
}

function sameRulerValue(
  response: ActivityV5ResponseState,
  correct: ActivityV5["correctState"],
) {
  const actual = response.measuredLength;
  const expected = correct.targetLength ?? correct.measuredLength;
  const actualUnit = response.unit ?? correct.unit;
  const expectedUnit = correct.unit;
  const tolerance = correct.tolerance ?? 0;
  const actualMm = lengthInMillimetres(actual, actualUnit);
  const expectedMm = lengthInMillimetres(expected, expectedUnit);
  if (actualMm !== null && expectedMm !== null && actualUnit !== expectedUnit) {
    return closeEnough(actualMm, expectedMm, lengthInMillimetres(tolerance, expectedUnit) ?? tolerance);
  }
  return closeEnough(actual, expected, tolerance);
}

function sameCapacityValue(
  response: ActivityV5ResponseState,
  correct: ActivityV5["correctState"],
) {
  const actual = response.measuredCapacity;
  const expected = correct.targetCapacity ?? correct.measuredCapacity;
  const actualUnit = response.unit ?? correct.unit;
  const expectedUnit = correct.unit;
  const tolerance = correct.tolerance ?? 0;
  const actualMl = capacityInMillilitres(actual, actualUnit);
  const expectedMl = capacityInMillilitres(expected, expectedUnit);
  if (actualMl !== null && expectedMl !== null && actualUnit !== expectedUnit) {
    return closeEnough(actualMl, expectedMl, capacityInMillilitres(tolerance, expectedUnit) ?? tolerance);
  }
  return closeEnough(actual, expected, tolerance);
}

function sameMassValue(
  response: ActivityV5ResponseState,
  correct: ActivityV5["correctState"],
) {
  const actual = response.measuredMass;
  const expected = correct.targetMass ?? correct.measuredMass;
  const actualUnit = response.unit ?? correct.unit;
  const expectedUnit = correct.unit;
  const tolerance = correct.tolerance ?? 0;
  const actualG = massInGrams(actual, actualUnit);
  const expectedG = massInGrams(expected, expectedUnit);
  if (actualG !== null && expectedG !== null && actualUnit !== expectedUnit) {
    return closeEnough(actualG, expectedG, massInGrams(tolerance, expectedUnit) ?? tolerance);
  }
  return closeEnough(actual, expected, tolerance);
}

function fractionFromState(state: ActivityV5ResponseState): ActivityV5FractionSpec | null {
  const denominator = state.denominator ?? state.targetDenominator;
  const numerator =
    state.shadedParts ??
    state.targetNumerator ??
    (state.selectedParts?.length ? state.selectedParts.length : undefined);

  if (
    typeof numerator !== "number" ||
    typeof denominator !== "number" ||
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return null;
  }

  return {
    numerator,
    denominator,
    wholeCount: state.wholeCount ?? 0,
    decimalEquivalent: state.decimalEquivalent,
  };
}

function fractionValue(fraction: ActivityV5FractionSpec) {
  return (fraction.wholeCount ?? 0) + fraction.numerator / fraction.denominator;
}

function sameFractionExact(actual: ActivityV5FractionSpec, expected: ActivityV5FractionSpec) {
  return (
    (actual.wholeCount ?? 0) === (expected.wholeCount ?? 0) &&
    actual.numerator === expected.numerator &&
    actual.denominator === expected.denominator
  );
}

function sameFractionEquivalent(
  actual: ActivityV5FractionSpec,
  expected: ActivityV5FractionSpec,
  tolerance = 0,
) {
  return closeEnough(fractionValue(actual), fractionValue(expected), tolerance);
}

function sameFractionBarValue(
  response: ActivityV5ResponseState,
  correct: ActivityV5["correctState"],
) {
  const actual = fractionFromState(response);
  const expected = fractionFromState(correct);

  if (!actual || !expected) return false;

  if (correct.allowedFractions?.length) {
    return correct.allowedFractions.some((allowed) =>
      correct.equivalentAccepted
        ? sameFractionEquivalent(actual, allowed, correct.tolerance ?? 0)
        : sameFractionExact(actual, allowed),
    );
  }

  if (typeof correct.decimalEquivalent === "number") {
    return closeEnough(fractionValue(actual), correct.decimalEquivalent, correct.tolerance ?? 0.001);
  }

  return correct.equivalentAccepted
    ? sameFractionEquivalent(actual, expected, correct.tolerance ?? 0)
    : sameFractionExact(actual, expected);
}

function normaliseClockHour(hour?: number) {
  if (typeof hour !== "number" || !Number.isFinite(hour)) return null;
  const wrapped = hour % 12;
  return wrapped === 0 ? 12 : wrapped;
}

function normaliseMinute(minute?: number) {
  if (typeof minute !== "number" || !Number.isFinite(minute)) return null;
  return ((Math.round(minute) % 60) + 60) % 60;
}

function sameClockValue(
  response: ActivityV5ResponseState,
  correct: ActivityV5["correctState"],
) {
  const actualHour = normaliseClockHour(response.hour);
  const expectedHour = normaliseClockHour(correct.targetHour ?? correct.hour);
  const actualMinute = normaliseMinute(response.minute ?? 0);
  const expectedMinute = normaliseMinute(correct.targetMinute ?? correct.minute ?? 0);

  if (actualHour === null || expectedHour === null || actualMinute === null || expectedMinute === null) {
    return false;
  }

  if (correct.allowedMinutes?.length && !correct.allowedMinutes.includes(actualMinute)) {
    return false;
  }

  return actualHour === expectedHour && closeEnough(actualMinute, expectedMinute, correct.tolerance ?? 0);
}

function sameNumberLineValue(
  response: ActivityV5ResponseState,
  correct: ActivityV5["correctState"],
) {
  const actualRaw = response.placedValue ?? response.numberLineValue;
  const expectedRaw = correct.targetValue ?? correct.placedValue ?? correct.numberLineValue;

  if (correct.allowedValues?.length) {
    return correct.allowedValues.some((allowed) => {
      const actual = numericValue(actualRaw);
      const allowedNumber = numericValue(allowed);
      if (actual !== null && allowedNumber !== null) {
        return closeEnough(actual, allowedNumber, correct.tolerance ?? 0);
      }
      return String(actualRaw ?? "").trim() === String(allowed).trim();
    });
  }

  const actual = numericValue(actualRaw);
  const expected = numericValue(expectedRaw);
  if (actual !== null && expected !== null) {
    return closeEnough(actual, expected, correct.tolerance ?? 0);
  }

  return String(actualRaw ?? "").trim() === String(expectedRaw ?? "").trim();
}

function selectedTokenTotal(response: ActivityV5ResponseState, correct: ActivityV5["correctState"]) {
  if (response.moneyTotal !== undefined) return response.moneyTotal;
  if (response.selectedTokens?.length) return response.selectedTokens.reduce((sum, value) => sum + Number(value), 0);
  if (response.selectedTokenIds?.length && correct.tokenValues?.length) {
    return response.selectedTokenIds.reduce((sum, tokenId) => {
      const match = String(tokenId).match(/-?\d+(?:\.\d+)?/g)?.at(-1);
      return sum + Number(match ?? 0);
    }, 0);
  }
  return undefined;
}

function sameMoneyValue(
  response: ActivityV5ResponseState,
  correct: ActivityV5["correctState"],
) {
  if (correct.selectedPriceTagId) return response.selectedPriceTagId === correct.selectedPriceTagId;

  const expectedTotal = correct.targetTotal ?? correct.moneyTotal;
  const actualTotal = selectedTokenTotal(response, correct);
  if (typeof expectedTotal === "number" && typeof actualTotal === "number") {
    return closeEnough(actualTotal, expectedTotal, correct.tolerance ?? 0);
  }

  if (correct.selectedTokens?.length && response.selectedTokens?.length) {
    return sameList(response.selectedTokens, correct.selectedTokens);
  }

  return sameList(response.selectedTokenIds, correct.selectedTokenIds);
}

function expectedSummary(activity: ActivityV5) {
  const correct = activity.correctState;
  switch (activity.interactionType) {
    case "drag_to_place":
      return Object.entries(correct.placements ?? {}).map(([objectId, targetId]) => `${objectId} -> ${targetId}`).join(", ");
    case "click_objects":
      return `Select ${normaliseList(correct.selectedObjectIds).join(", ")}`;
    case "plot_coordinates":
      return `Plot ${normaliseList(correct.plottedCoordinates).join(", ")}`;
    case "rotate_shape":
      return `${correct.orientation ?? 0} degrees`;
    case "flip_reflection":
      return `Complete ${normaliseList(correct.reflectedCells).join(", ")}`;
    case "build_array":
      return `${correct.rows ?? 0} rows of ${correct.columns ?? 0}`;
    case "move_along_route":
      return correct.finalPosition ? `Finish at ${correct.finalPosition}` : `Route ${normaliseList(correct.routePath).join(", ")}`;
    case "interactive_ruler":
      return `${correct.targetLength ?? correct.measuredLength ?? 0} ${correct.unit ?? "units"}`;
    case "interactive_capacity_jug":
      return `${correct.targetCapacity ?? correct.measuredCapacity ?? 0} ${correct.unit ?? "mL"}`;
    case "interactive_mass_scale":
      return `${correct.targetMass ?? correct.measuredMass ?? 0} ${correct.unit ?? "g"}`;
    case "interactive_clock":
      return `${normaliseClockHour(correct.targetHour ?? correct.hour) ?? 0}:${String(normaliseMinute(correct.targetMinute ?? correct.minute ?? 0) ?? 0).padStart(2, "0")}`;
    case "interactive_fraction_bar":
      return `${correct.wholeCount ? `${correct.wholeCount} ` : ""}${correct.targetNumerator ?? correct.shadedParts ?? 0}/${correct.targetDenominator ?? correct.denominator ?? 1}`;
    case "interactive_number_line":
      return String(correct.targetValue ?? correct.placedValue ?? correct.numberLineValue ?? "");
    case "build_place_value":
      return `${correct.hundreds ?? 0} hundreds, ${correct.tens ?? 0} tens, ${correct.ones ?? 0} ones`;
    case "generic_money_model":
      return `${correct.currencySymbol ?? ""}${correct.targetTotal ?? correct.moneyTotal ?? correct.selectedTokens?.join(" + ") ?? correct.selectedPriceTagId ?? 0}`;
    default:
      return "";
  }
}

export function checkActivityV5Answer(
  activity: ActivityV5,
  response: ActivityV5ResponseState,
): ActivityV5CheckResult {
  const correct = activity.correctState;
  let isCorrect = false;

  switch (activity.interactionType) {
    case "drag_to_place":
      isCorrect = samePlacements(response.placements, correct.placements);
      break;
    case "click_objects":
      isCorrect = sameList(response.selectedObjectIds, correct.selectedObjectIds);
      break;
    case "plot_coordinates":
      isCorrect = sameList(response.plottedCoordinates, correct.plottedCoordinates);
      break;
    case "rotate_shape":
      isCorrect = response.orientation === correct.orientation;
      break;
    case "flip_reflection":
      isCorrect = sameList(response.reflectedCells, correct.reflectedCells);
      break;
    case "build_array":
      isCorrect = response.rows === correct.rows && response.columns === correct.columns;
      break;
    case "move_along_route":
      isCorrect = correct.finalPosition
        ? response.finalPosition === correct.finalPosition
        : sameList(response.routePath, correct.routePath);
      break;
    case "interactive_ruler":
      isCorrect = sameRulerValue(response, correct);
      break;
    case "interactive_capacity_jug":
      isCorrect = sameCapacityValue(response, correct);
      break;
    case "interactive_mass_scale":
      isCorrect = sameMassValue(response, correct);
      break;
    case "interactive_clock":
      isCorrect = sameClockValue(response, correct);
      break;
    case "interactive_fraction_bar":
      isCorrect = sameFractionBarValue(response, correct);
      break;
    case "interactive_number_line":
      isCorrect = sameNumberLineValue(response, correct);
      break;
    case "build_place_value":
      isCorrect =
        (response.hundreds ?? 0) === (correct.hundreds ?? 0) &&
        (response.tens ?? 0) === (correct.tens ?? 0) &&
        (response.ones ?? 0) === (correct.ones ?? 0);
      break;
    case "generic_money_model":
      isCorrect = sameMoneyValue(response, correct);
      break;
    default:
      isCorrect = false;
  }

  return {
    correct: isCorrect,
    message: isCorrect ? activity.feedback.correct : activity.feedback.incorrect,
    expectedSummary: expectedSummary(activity),
  };
}

export function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededShuffle<T>(values: T[], seed = "mylearna-v5") {
  const shuffled = [...values];
  let state = stableHash(seed) || 1;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = Math.imul(state ^ (state >>> 15), 2246822519) >>> 0;
    const swapIndex = state % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
