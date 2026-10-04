import type { NumberOperationsSubElementAttemptTrace } from "./numberOperationsAttemptTrace";
import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "./numberOperationsPlacementResult";

export const NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY =
  "mylearna:maths-starting-point:number-operations-baseline-draft:v2";

export type NumberOperationsBaselineDraftStatus = "in_progress" | "complete";

export type NumberOperationsBaselineDraft = {
  schema: "mylearna-number-operations-baseline-draft";
  schemaVersion: 2;
  status: NumberOperationsBaselineDraftStatus;
  currentIndex: number;
  resultsByKey: Partial<
    Record<NumberOperationsSubElementKey, NumberOperationsPlacementResult>
  >;
  unresolvedSubElements: NumberOperationsSubElementKey[];
  tracesByKey: Partial<
    Record<NumberOperationsSubElementKey, NumberOperationsSubElementAttemptTrace>
  >;
  startedAt: string;
  completedAt: string | null;
  savedAt: string;
};

const VALID_KEYS = new Set<NumberOperationsSubElementKey>([
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
]);

function validDate(value: string, label: string) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error(`${label} must be a valid datetime.`);
  }
  return parsed;
}

export function buildNumberOperationsBaselineDraft(input: {
  status?: NumberOperationsBaselineDraftStatus;
  currentIndex: number;
  resultsByKey: NumberOperationsBaselineDraft["resultsByKey"];
  unresolvedSubElements: NumberOperationsSubElementKey[];
  tracesByKey: NumberOperationsBaselineDraft["tracesByKey"];
  startedAt: string;
  completedAt?: string | null;
  savedAt?: string;
}): NumberOperationsBaselineDraft {
  if (
    !Number.isInteger(input.currentIndex) ||
    input.currentIndex < 0 ||
    input.currentIndex > 4
  ) {
    throw new Error("currentIndex must be an integer from 0 to 4.");
  }

  const status = input.status ?? "in_progress";
  const startedAt = validDate(input.startedAt, "startedAt");
  const savedAt = validDate(
    input.savedAt || new Date().toISOString(),
    "savedAt",
  );

  let completedAt: Date | null = null;
  if (status === "complete") {
    if (!input.completedAt) {
      throw new Error("completedAt is required for a complete baseline draft.");
    }
    completedAt = validDate(input.completedAt, "completedAt");
    if (completedAt.getTime() < startedAt.getTime()) {
      throw new Error("completedAt cannot be before startedAt.");
    }
  } else if (input.completedAt) {
    throw new Error("An in-progress baseline draft cannot have completedAt.");
  }

  const unresolvedSubElements = Array.from(
    new Set(
      input.unresolvedSubElements.filter((key) => VALID_KEYS.has(key)),
    ),
  );

  return {
    schema: "mylearna-number-operations-baseline-draft",
    schemaVersion: 2,
    status,
    currentIndex: input.currentIndex,
    resultsByKey: { ...input.resultsByKey },
    unresolvedSubElements,
    tracesByKey: { ...input.tracesByKey },
    startedAt: startedAt.toISOString(),
    completedAt: completedAt ? completedAt.toISOString() : null,
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
      parsed.schemaVersion !== 2 ||
      (parsed.status !== "in_progress" && parsed.status !== "complete") ||
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

    if (
      parsed.status === "complete" &&
      typeof parsed.completedAt !== "string"
    ) {
      return null;
    }

    if (
      parsed.status === "in_progress" &&
      parsed.completedAt !== null &&
      parsed.completedAt !== undefined
    ) {
      return null;
    }

    return buildNumberOperationsBaselineDraft({
      status: parsed.status,
      currentIndex: parsed.currentIndex as number,
      resultsByKey: parsed.resultsByKey,
      unresolvedSubElements: parsed.unresolvedSubElements.filter(
        (key): key is NumberOperationsSubElementKey =>
          typeof key === "string" &&
          VALID_KEYS.has(key as NumberOperationsSubElementKey),
      ),
      tracesByKey: parsed.tracesByKey,
      startedAt: parsed.startedAt,
      completedAt:
        parsed.status === "complete" ? parsed.completedAt : null,
      savedAt: parsed.savedAt,
    });
  } catch {
    return null;
  }
}
