import type { NumberOperationsSubElementAttemptTrace } from "./numberOperationsAttemptTrace";
import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "./numberOperationsPlacementResult";

export const NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY =
  "mylearna:maths-starting-point:number-operations-baseline-draft:v1";

export type NumberOperationsBaselineDraft = {
  schema: "mylearna-number-operations-baseline-draft";
  schemaVersion: 1;
  currentIndex: number;
  resultsByKey: Partial<
    Record<NumberOperationsSubElementKey, NumberOperationsPlacementResult>
  >;
  unresolvedSubElements: NumberOperationsSubElementKey[];
  tracesByKey: Partial<
    Record<NumberOperationsSubElementKey, NumberOperationsSubElementAttemptTrace>
  >;
  startedAt: string;
  savedAt: string;
};

const VALID_KEYS = new Set<NumberOperationsSubElementKey>([
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
]);

export function buildNumberOperationsBaselineDraft(input: {
  currentIndex: number;
  resultsByKey: NumberOperationsBaselineDraft["resultsByKey"];
  unresolvedSubElements: NumberOperationsSubElementKey[];
  tracesByKey: NumberOperationsBaselineDraft["tracesByKey"];
  startedAt: string;
  savedAt?: string;
}): NumberOperationsBaselineDraft {
  if (!Number.isInteger(input.currentIndex) || input.currentIndex < 0 || input.currentIndex > 4) {
    throw new Error("currentIndex must be an integer from 0 to 4.");
  }

  const startedAt = new Date(input.startedAt);
  if (!Number.isFinite(startedAt.getTime())) {
    throw new Error("startedAt must be a valid datetime.");
  }

  const savedAt = new Date(input.savedAt || new Date().toISOString());
  if (!Number.isFinite(savedAt.getTime())) {
    throw new Error("savedAt must be a valid datetime.");
  }

  const unresolvedSubElements = Array.from(
    new Set(
      input.unresolvedSubElements.filter((key) => VALID_KEYS.has(key)),
    ),
  );

  return {
    schema: "mylearna-number-operations-baseline-draft",
    schemaVersion: 1,
    currentIndex: input.currentIndex,
    resultsByKey: { ...input.resultsByKey },
    unresolvedSubElements,
    tracesByKey: { ...input.tracesByKey },
    startedAt: startedAt.toISOString(),
    savedAt: savedAt.toISOString(),
  };
}

export function parseNumberOperationsBaselineDraft(
  raw: string | null | undefined,
): NumberOperationsBaselineDraft | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<NumberOperationsBaselineDraft>;
    if (
      parsed.schema !== "mylearna-number-operations-baseline-draft" ||
      parsed.schemaVersion !== 1 ||
      !Number.isInteger(parsed.currentIndex) ||
      (parsed.currentIndex as number) < 0 ||
      (parsed.currentIndex as number) > 4 ||
      typeof parsed.startedAt !== "string" ||
      typeof parsed.savedAt !== "string" ||
      !parsed.resultsByKey ||
      !parsed.tracesByKey ||
      !Array.isArray(parsed.unresolvedSubElements)
    ) {
      return null;
    }

    return buildNumberOperationsBaselineDraft({
      currentIndex: parsed.currentIndex as number,
      resultsByKey: parsed.resultsByKey,
      unresolvedSubElements: parsed.unresolvedSubElements.filter(
        (key): key is NumberOperationsSubElementKey =>
          typeof key === "string" && VALID_KEYS.has(key as NumberOperationsSubElementKey),
      ),
      tracesByKey: parsed.tracesByKey,
      startedAt: parsed.startedAt,
      savedAt: parsed.savedAt,
    });
  } catch {
    return null;
  }
}
