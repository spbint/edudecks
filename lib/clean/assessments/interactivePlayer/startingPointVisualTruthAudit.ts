import type {
  CurrencyTokenStimulus,
  MyLearnaAssessmentItem,
  PlaceValueBlocksStimulus,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  AUSTRALIAN_COIN_SPECIFICATIONS,
  isAustralianCoinDenomination,
  type AustralianCoinDenomination,
} from "@/lib/clean/assessments/visualTemplates/trustedMathAssetSpecifications";
import {
  classifyStartingPointDevelopmentalAccessibility,
  getStartingPointPresentationCopy,
  type StartingPointPresentationStimulus,
  type StartingPointStimulusCoverage,
} from "./startingPointDevelopmentalAccessibility";
import type { StartingPointPlayerModel } from "./startingPointPlayerContract";
import {
  getStartingPointRendererQaItems,
  type StartingPointRendererQaItem,
} from "./startingPointRendererCoverage";

export type StartingPointVisualTruthSignature =
  | {
      kind: "counter-set";
      quantity: number;
      arrangement: string;
      seed: number;
    }
  | {
      kind: "place-value";
      thousands: number;
      hundreds: number;
      tens: number;
      ones: number;
      representedValue: number;
    }
  | {
      kind: "counter-groups";
      groups: number[];
      action: "display" | "combine" | "remove" | "share";
      removeCount: number;
      remainingCount: number;
      recipientCount: number;
    }
  | {
      kind: "closed-groups";
      groups: number[];
      groupCount: number;
      objectLabel: "counters" | "markers" | "objects";
      totalCount: number;
    }
  | {
      kind: "currency-repeat";
      denomination: AustralianCoinDenomination;
      count: number;
      totalCents: number;
    }
  | {
      kind: "currency";
      denominations: AustralianCoinDenomination[];
      totalCents: number;
    };

export type StartingPointVisualTruthAuditEntry = StartingPointRendererQaItem & {
  classification: Exclude<StartingPointStimulusCoverage, "text-or-symbol-sufficient">;
  learnerPrompt: string;
  truthSignature: StartingPointVisualTruthSignature;
  expectedTruth: string;
  promptStimulusResponseCoherence: "resolved";
  answerSafety: "resolved";
  auditResult: "pass";
};

export type StartingPointTextOnlyCandidateResolution = {
  itemId: string;
  reason:
    | "symbol-language-only"
    | "fully-specified-word-problem"
    | "fully-specified-symbolic-collection"
    | "zero-concept-does-not-require-visible-objects";
};

const COIN_CENTS: Readonly<Record<AustralianCoinDenomination, number>> = {
  "5c": 5,
  "10c": 10,
  "20c": 20,
  "50c": 50,
  "$1": 100,
  "$2": 200,
};

const MAX_RENDERED_COUNTERS = 20;
const MAX_RENDERED_CANONICAL_COINS = 8;

const VISUAL_REFERENCE_PATTERN =
  /\b(shown|shows?|picture|collection|counters?|coins?|blocks?|groups?|objects?|share|shared|sharing|taken? away|remove(?:d|s|al)?|diagram)\b/i;

const TEXT_ONLY_CANDIDATE_RESOLUTIONS: Readonly<
  Record<string, StartingPointTextOnlyCandidateResolution["reason"]>
> = Object.freeze({
  "myl-recheck-add-p06-c-v1": "symbol-language-only",
  "myl-anchor-add-p06-c-v1": "symbol-language-only",
  "myl-recheck-cnt-p04-b-v1": "fully-specified-word-problem",
  "myl-boundary-cnt-p04-c-v1": "fully-specified-word-problem",
  "myl-recheck-cnt-p05-c-v1": "zero-concept-does-not-require-visible-objects",
  "myl-anchor-cnt-p05-c-v1": "zero-concept-does-not-require-visible-objects",
  "myl-search-cnt-p08-b-v1": "fully-specified-word-problem",
  "myl-recheck-mul-p04-b-v1": "fully-specified-symbolic-collection",
  "myl-boundary-mul-p04-b-v1": "fully-specified-word-problem",
  "myl-boundary-mul-p04-c-v1": "symbol-language-only",
  "myl-recheck-mul-p05-b-v1": "fully-specified-symbolic-collection",
  "myl-boundary-mul-p05-b-v1": "fully-specified-word-problem",
  "myl-boundary-mul-p05-c-v1": "fully-specified-symbolic-collection",
  "myl-anchor-mul-p06-b-v1": "fully-specified-word-problem",
  "myl-recheck-mul-p08-a-v1": "fully-specified-word-problem",
  "myl-recheck-mul-p08-b-v1": "fully-specified-symbolic-collection",
  "myl-boundary-mul-p08-a-v1": "fully-specified-word-problem",
  "myl-boundary-mul-p08-c-v1": "fully-specified-symbolic-collection",
  "myl-search-npv-p02-a-v1": "symbol-language-only",
  "myl-anchor-npv-p03-a-v1": "symbol-language-only",
  "myl-boundary-npv-p04-a-v1": "symbol-language-only",
  "myl-boundary-npv-p05-a-v1": "symbol-language-only",
  "myl-confirm-npv-p07-a-v1": "symbol-language-only",
  "myl-boundary-npv-p07-b-v1": "symbol-language-only",
  "myl-recheck-mon-p01-a-v1": "fully-specified-word-problem",
  "myl-recheck-mon-p04-a-v1": "fully-specified-symbolic-collection",
  "myl-boundary-mon-p04-a-v1": "fully-specified-symbolic-collection",
  "myl-boundary-mon-p04-b-v1": "fully-specified-symbolic-collection",
  "myl-recheck-mon-p05-b-v1": "fully-specified-word-problem",
  "myl-recheck-mon-p05-c-v1": "fully-specified-word-problem",
  "myl-anchor-mon-p05-b-v1": "fully-specified-word-problem",
  "myl-anchor-mon-p05-c-v1": "fully-specified-word-problem",
});

function wholeNonNegative(value: unknown, label: string, itemId: string) {
  const number = Number(value ?? 0);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${itemId} has invalid ${label} in its visual truth source.`);
  }
  return number;
}

function trustedDenomination(value: string, itemId: string) {
  if (!isAustralianCoinDenomination(value)) {
    throw new Error(`${itemId} uses untrusted currency denomination ${value}.`);
  }
  return value;
}

function presentationTruth(
  stimulus: StartingPointPresentationStimulus,
  itemId: string,
): StartingPointVisualTruthSignature {
  if (stimulus.type === "currency-repeat") {
    const denomination = trustedDenomination(stimulus.denomination, itemId);
    const count = wholeNonNegative(stimulus.count, "currency count", itemId);
    return {
      kind: "currency-repeat",
      denomination,
      count,
      totalCents: count * COIN_CENTS[denomination],
    };
  }

  const groups = stimulus.groups.map((quantity) =>
    wholeNonNegative(quantity, "group quantity", itemId),
  );
  if (groups.length === 0) {
    throw new Error(`${itemId} has no groups in its presentation stimulus.`);
  }
  if (stimulus.type === "closed-groups") {
    return {
      kind: "closed-groups",
      groups,
      groupCount: groups.length,
      objectLabel: stimulus.objectLabel,
      totalCount: groups.reduce((total, quantity) => total + quantity, 0),
    };
  }

  const action = stimulus.action ?? "display";
  const total = groups.reduce((sum, quantity) => sum + quantity, 0);
  const removeCount = action === "remove"
    ? wholeNonNegative(stimulus.removeCount, "remove count", itemId)
    : 0;
  const recipientCount = action === "share"
    ? wholeNonNegative(stimulus.recipientCount, "recipient count", itemId)
    : 0;
  if (removeCount > total) {
    throw new Error(`${itemId} removes more counters than its source collection.`);
  }
  if (action === "share" && recipientCount === 0) {
    throw new Error(`${itemId} has no sharing recipients.`);
  }
  return {
    kind: "counter-groups",
    groups,
    action,
    removeCount,
    remainingCount: total - removeCount,
    recipientCount,
  };
}

function canonicalTruth(
  stimulus: MyLearnaAssessmentItem["stimulus"],
  itemId: string,
): StartingPointVisualTruthSignature {
  if (stimulus.type === "counter-set") {
    const data = stimulus.data as { quantity?: number; arrangement?: string; seed?: number };
    const quantity = wholeNonNegative(data.quantity, "counter quantity", itemId);
    if (quantity > MAX_RENDERED_COUNTERS) {
      throw new Error(`${itemId} exceeds the renderer's ${MAX_RENDERED_COUNTERS}-counter limit.`);
    }
    return {
      kind: "counter-set",
      quantity,
      arrangement: data.arrangement ?? "scattered",
      seed: wholeNonNegative(data.seed ?? 1, "counter seed", itemId),
    };
  }
  if (stimulus.type === "place-value-blocks") {
    const data = stimulus.data as PlaceValueBlocksStimulus;
    const thousands = wholeNonNegative(data.thousands, "thousands", itemId);
    const hundreds = wholeNonNegative(data.hundreds, "hundreds", itemId);
    const tens = wholeNonNegative(data.tens, "tens", itemId);
    const ones = wholeNonNegative(data.ones, "ones", itemId);
    return {
      kind: "place-value",
      thousands,
      hundreds,
      tens,
      ones,
      representedValue: thousands * 1000 + hundreds * 100 + tens * 10 + ones,
    };
  }
  if (stimulus.type === "currency-tokens") {
    const data = stimulus.data as CurrencyTokenStimulus;
    if (data.tokens.length > MAX_RENDERED_CANONICAL_COINS) {
      throw new Error(`${itemId} exceeds the renderer's ${MAX_RENDERED_CANONICAL_COINS}-coin limit.`);
    }
    const denominations = data.tokens.map((token) =>
      trustedDenomination(token.denomination, itemId),
    );
    return {
      kind: "currency",
      denominations,
      totalCents: denominations.reduce(
        (total, denomination) => total + COIN_CENTS[denomination],
        0,
      ),
    };
  }
  throw new Error(`${itemId} has unsupported canonical visual ${stimulus.type}.`);
}

export function deriveStartingPointVisualTruthSignature(
  item: MyLearnaAssessmentItem,
): StartingPointVisualTruthSignature | null {
  const accessibility = classifyStartingPointDevelopmentalAccessibility(item);
  if (accessibility.presentationStimulus) {
    return presentationTruth(accessibility.presentationStimulus, item.id);
  }
  if (accessibility.stimulusCoverage === "canonical-visual") {
    return canonicalTruth(item.stimulus, item.id);
  }
  return null;
}

export function deriveStartingPointPlayerVisualTruthSignature(
  model: StartingPointPlayerModel,
): StartingPointVisualTruthSignature | null {
  if (model.presentationStimulus) {
    return presentationTruth(model.presentationStimulus, model.itemId);
  }
  if (model.stimulus.type !== "none") {
    return canonicalTruth(model.stimulus, model.itemId);
  }
  return null;
}

function normalizeAnswer(value: unknown) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function canonicalCorrectAnswers(item: MyLearnaAssessmentItem) {
  if (item.response.type === "short-answer") {
    return [item.response.correctValue, ...(item.response.acceptableValues ?? [])]
      .filter((value) => value !== undefined)
      .map(normalizeAnswer);
  }
  const correctIds = item.response.correctOptionIds ?? [];
  const options = item.response.options ?? [];
  if (item.response.type === "single-choice" && correctIds.length !== 1) {
    throw new Error(`${item.id} does not have exactly one canonical correct option.`);
  }
  if (item.response.type === "multiple-choice" && correctIds.length === 0) {
    throw new Error(`${item.id} has no canonical correct option set.`);
  }
  if (new Set(correctIds).size !== correctIds.length) {
    throw new Error(`${item.id} repeats a canonical correct option ID.`);
  }
  return correctIds.map((id) => {
    const option = options.find((candidate) => candidate.id === id);
    if (!option) throw new Error(`${item.id} refers to missing correct option ${id}.`);
    return normalizeAnswer(option.value);
  });
}

function expectedAnswers(
  item: MyLearnaAssessmentItem,
  prompt: string,
  signature: StartingPointVisualTruthSignature,
) {
  if (signature.kind === "counter-set") return [String(signature.quantity)];
  if (signature.kind === "place-value") return [String(signature.representedValue)];
  if (signature.kind === "closed-groups") return [String(signature.totalCount)];
  if (signature.kind === "counter-groups") {
    const total = signature.groups.reduce((sum, quantity) => sum + quantity, 0);
    if (signature.action === "remove") {
      return /what happens/i.test(prompt)
        ? ["it has fewer counters"]
        : [String(signature.remainingCount)];
    }
    if (signature.action === "share") {
      if (total % signature.recipientCount !== 0) {
        throw new Error(`${item.id} has a non-whole sharing result.`);
      }
      return [String(total / signature.recipientCount)];
    }
    if (signature.action === "combine" && /what happens/i.test(prompt)) {
      return ["it has more counters"];
    }
    return [String(total)];
  }
  if (signature.kind === "currency-repeat") {
    return [String(signature.denomination.startsWith("$")
      ? signature.totalCents / 100
      : signature.totalCents)];
  }

  const faceValue = prompt.match(/face value of (one|two) dollars?/i)?.[1];
  if (faceValue) return [faceValue.toLowerCase() === "one" ? "$1" : "$2"];
  const countDenomination = prompt.match(/how many (5c|10c|20c|50c|\$1|\$2) coins/i)?.[1];
  if (countDenomination) {
    return [String(signature.denominations.filter((value) => value === countDenomination).length)];
  }
  if (/least to greatest/i.test(prompt)) {
    return [signature.denominations
      .slice()
      .sort((left, right) => COIN_CENTS[left] - COIN_CENTS[right])
      .join(", ")];
  }
  throw new Error(`${item.id} has no resolved canonical currency response rule.`);
}

function assertPromptStimulusResponseCoherence(
  item: MyLearnaAssessmentItem,
  signature: StartingPointVisualTruthSignature,
) {
  const learnerPrompt = getStartingPointPresentationCopy(item).prompt;
  const expected = expectedAnswers(item, learnerPrompt, signature).map(normalizeAnswer);
  const canonical = canonicalCorrectAnswers(item);
  if (!canonical.some((answer) => expected.includes(answer))) {
    throw new Error(`${item.id} visual truth does not support its canonical answer.`);
  }

  if (item.response.type === "single-choice") {
    const matchingOptions = (item.response.options ?? []).filter((option) =>
      expected.includes(normalizeAnswer(option.value)),
    );
    if (matchingOptions.length !== 1) {
      throw new Error(`${item.id} visual truth makes ${matchingOptions.length} options correct.`);
    }
  }
  return learnerPrompt;
}

export function formatStartingPointVisualTruth(
  signature: StartingPointVisualTruthSignature,
) {
  if (signature.kind === "counter-set") return `${signature.quantity} mathematical counters`;
  if (signature.kind === "place-value") {
    return `${signature.thousands} thousands + ${signature.hundreds} hundreds + ${signature.tens} tens + ${signature.ones} ones = ${signature.representedValue}`;
  }
  if (signature.kind === "closed-groups") {
    return `${signature.groupCount} closed groups [${signature.groups.join(", ")}] = ${signature.totalCount} ${signature.objectLabel}`;
  }
  if (signature.kind === "currency-repeat") {
    return `${signature.count} × ${signature.denomination} = ${signature.totalCents}c`;
  }
  if (signature.kind === "currency") {
    return `coin multiset [${signature.denominations.join(", ")}] = ${signature.totalCents}c`;
  }
  const total = signature.groups.reduce((sum, quantity) => sum + quantity, 0);
  if (signature.action === "remove") {
    return `groups [${signature.groups.join(", ")}], exactly ${signature.removeCount} removed, ${signature.remainingCount} remain`;
  }
  if (signature.action === "share") {
    return `source collection ${total}, exactly ${signature.recipientCount} recipients`;
  }
  return `counter groups [${signature.groups.join(", ")}]${signature.action === "combine" ? " combined" : ""}`;
}

export function getStartingPointVisualTruthInventory(): StartingPointVisualTruthAuditEntry[] {
  return getStartingPointRendererQaItems().flatMap((entry) => {
    const signature = deriveStartingPointVisualTruthSignature(entry.item);
    if (!signature) return [];
    const learnerPrompt = assertPromptStimulusResponseCoherence(entry.item, signature);
    return [{
      ...entry,
      classification: entry.coverage.stimulusCoverage as StartingPointVisualTruthAuditEntry["classification"],
      learnerPrompt,
      truthSignature: signature,
      expectedTruth: formatStartingPointVisualTruth(signature),
      promptStimulusResponseCoherence: "resolved" as const,
      answerSafety: "resolved" as const,
      auditResult: "pass" as const,
    }];
  });
}

export function getStartingPointTextOnlyCandidateAudit() {
  const candidates = getStartingPointRendererQaItems().filter(({ item, coverage }) => {
    if (coverage.stimulusCoverage !== "text-or-symbol-sufficient") return false;
    const text = [
      item.prompt,
      ...(item.response.options ?? []).map((option) => String(option.label ?? option.value)),
    ].join(" ");
    return VISUAL_REFERENCE_PATTERN.test(text);
  });
  const resolutions = candidates.map<StartingPointTextOnlyCandidateResolution>(({ item }) => {
    const reason = TEXT_ONLY_CANDIDATE_RESOLUTIONS[item.id];
    if (!reason) throw new Error(`Text-only visual-reference candidate ${item.id} is unresolved.`);
    return { itemId: item.id, reason };
  });
  const staleResolutions = Object.keys(TEXT_ONLY_CANDIDATE_RESOLUTIONS).filter(
    (itemId) => !candidates.some(({ item }) => item.id === itemId),
  );
  if (staleResolutions.length > 0) {
    throw new Error(`Text-only candidate resolutions are stale: ${staleResolutions.join(", ")}.`);
  }
  return resolutions;
}

export function getStartingPointVisualTruthAuditSummary() {
  const estate = getStartingPointRendererQaItems();
  const visuals = getStartingPointVisualTruthInventory();
  const classificationCounts = new Map<StartingPointStimulusCoverage, number>();
  const familyCounts = new Map<StartingPointVisualTruthSignature["kind"], number>();
  for (const entry of estate) {
    classificationCounts.set(
      entry.coverage.stimulusCoverage,
      (classificationCounts.get(entry.coverage.stimulusCoverage) ?? 0) + 1,
    );
  }
  for (const entry of visuals) {
    familyCounts.set(
      entry.truthSignature.kind,
      (familyCounts.get(entry.truthSignature.kind) ?? 0) + 1,
    );
  }
  return {
    totalActiveItems: estate.length,
    visualItems: visuals.length,
    classificationCounts,
    familyCounts,
    textOnlyCandidateResolutions: getStartingPointTextOnlyCandidateAudit(),
    australianCoinSpecifications: AUSTRALIAN_COIN_SPECIFICATIONS,
    unresolvedItems: [] as string[],
    conclusion: "pass" as const,
  };
}

export function formatStartingPointVisualTruthInventory() {
  const header = [
    "item_id",
    "version",
    "continuum",
    "progression",
    "form",
    "classification",
    "renderer_family",
    "truth_signature",
    "evidence_classification",
    "practical_alternative",
    "audit_result",
  ].join("\t");
  const rows = getStartingPointVisualTruthInventory().map((entry) => [
    entry.item.id,
    entry.item.version,
    entry.coverage.continuum,
    entry.coverage.progressionTarget,
    entry.coverage.form,
    entry.classification,
    entry.coverage.rendererFamily,
    JSON.stringify(entry.truthSignature),
    entry.coverage.evidenceClassification,
    entry.coverage.accessibilityLimited,
    entry.auditResult,
  ].join("\t"));
  return [header, ...rows].join("\n");
}
