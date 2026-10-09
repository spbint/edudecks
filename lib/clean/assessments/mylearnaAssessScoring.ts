import type {
  MyLearnaAssessmentItem,
  MyLearnaAssessmentResponse,
  MyLearnaAssessmentSummary,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import type { AssessmentViewer, AssessmentProfile } from "@/lib/clean/assessments/assessmentPermissions";
import { isInternalUser } from "@/lib/clean/assessments/assessmentPermissions";

export function canUseAssessmentItem(
  item: MyLearnaAssessmentItem,
  viewer: AssessmentViewer | null,
  profile: AssessmentProfile | null,
  context: "lab" | "customer",
) {
  if (context === "lab" && isInternalUser(viewer, profile)) return true;
  return item.status === "published";
}

function normalizeResponseValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/,/g, "")
    .replace(/[−–]/g, "-")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*%\s*/g, "%")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function parseFractionValue(value: string) {
  const match = value.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  if (!match) return null;

  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator === 0) {
    return null;
  }

  return { numerator, denominator };
}

function parseNumericValue(
  value: string,
  options: { allowCurrency: boolean; allowPercent: boolean },
) {
  let candidate = value;

  if (candidate.startsWith("$")) {
    if (!options.allowCurrency) return null;
    candidate = candidate.slice(1).trim();
  } else if (candidate.includes("$")) {
    return null;
  }

  if (candidate.endsWith("%")) {
    if (!options.allowPercent) return null;
    candidate = candidate.slice(0, -1).trim();
  } else if (candidate.includes("%")) {
    return null;
  }

  if (
    !/^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(
      candidate,
    )
  ) {
    return null;
  }

  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? numeric : null;
}

function shortAnswerEquivalent(
  item: MyLearnaAssessmentItem,
  actualRaw: unknown,
  expectedRaw: unknown,
) {
  const actual = normalizeResponseValue(actualRaw);
  const expected = normalizeResponseValue(expectedRaw);
  if (!actual || !expected) return false;
  if (actual === expected) return true;

  const actualFraction = parseFractionValue(actual);
  const expectedFraction = parseFractionValue(expected);
  if (actualFraction && expectedFraction) {
    return (
      actualFraction.numerator * expectedFraction.denominator ===
      expectedFraction.numerator * actualFraction.denominator
    );
  }

  const prompt = normalizeResponseValue(item.prompt);
  const allowCurrency =
    /(?:\$|\bdollars?\b|\bcents?\b|\bmoney\b|\bcost\b|\bprice\b|\binterest\b|\bprofit\b|\bbalance\b|\bchange\b|\bbill\b|\bpurchase\b|\bsubscription\b)/.test(
      prompt,
    ) ||
    expected.startsWith("$");
  const allowPercent =
    /(?:%|\bpercent(?:age)?\b)/.test(prompt) || expected.endsWith("%");

  const actualNumeric = parseNumericValue(actual, {
    allowCurrency,
    allowPercent,
  });
  const expectedNumeric = parseNumericValue(expected, {
    allowCurrency,
    allowPercent,
  });

  return (
    actualNumeric !== null &&
    expectedNumeric !== null &&
    actualNumeric === expectedNumeric
  );
}

export function scoreAssessmentItem(
  item: MyLearnaAssessmentItem,
  selectedOptionIds: string[],
  timeSpentSeconds?: number,
  responseValue?: string,
): MyLearnaAssessmentResponse {
  let correct = false;

  if (item.response.type === "short-answer") {
    const expectedValues = [
      item.response.correctValue,
      ...(item.response.acceptableValues || []),
    ].filter((value) => value !== undefined && value !== null);
    correct = expectedValues.some((expected) =>
      shortAnswerEquivalent(item, responseValue, expected),
    );
  } else if (item.response.type === "ordering") {
    const expected = [...(item.response.correctOptionIds || [])];
    const actual = [...selectedOptionIds];
    correct =
      expected.length === actual.length &&
      expected.every((optionId, index) => optionId === actual[index]);
  } else {
    const expected = [...(item.response.correctOptionIds || [])].sort();
    const actual = [...selectedOptionIds].sort();
    correct =
      expected.length === actual.length &&
      expected.every((optionId, index) => optionId === actual[index]);
  }

  return {
    itemId: item.id,
    selectedOptionIds,
    ...(responseValue !== undefined ? { responseValue } : {}),
    correct,
    skillId: item.skill.id,
    misconceptionTags: correct ? [] : item.misconceptionTags || [],
    timeSpentSeconds,
  };
}

export function summarizeAssessmentAttempt(
  items: MyLearnaAssessmentItem[],
  responses: MyLearnaAssessmentResponse[],
): MyLearnaAssessmentSummary {
  const responseByItemId = new Map(responses.map((response) => [response.itemId, response]));
  const correctItems = items.filter((item) => responseByItemId.get(item.id)?.correct).length;
  const skillMap = new Map<string, { skillName: string; correct: number; total: number }>();

  items.forEach((item) => {
    const current = skillMap.get(item.skill.id) || {
      skillName: item.skill.name,
      correct: 0,
      total: 0,
    };
    current.total += 1;
    if (responseByItemId.get(item.id)?.correct) {
      current.correct += 1;
    }
    skillMap.set(item.skill.id, current);
  });

  return {
    totalItems: items.length,
    correctItems,
    percentage: items.length ? Math.round((correctItems / items.length) * 100) : 0,
    skillSummaries: Array.from(skillMap.entries()).map(([skillId, summary]) => ({
      skillId,
      skillName: summary.skillName,
      correct: summary.correct,
      total: summary.total,
    })),
    suggestedNextStep:
      correctItems === items.length
        ? "Open the next pathway step when the learner is ready."
        : "Use worksheet evidence and a short practical activity before trying another check-in.",
  };
}
