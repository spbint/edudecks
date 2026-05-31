import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import {
  NUMBER_ASSESSMENT_BANKS,
  getNumberAssessmentBankByKey,
  type NumberAssessmentBankConfig,
  type NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";

export type NumberPathwayAssessmentAlignmentContext = {
  subjectKey?: string | null;
  strandKey?: string | null;
  stageKey?: string | null;
  pathwayStepId?: string | null;
  stepKey?: string | null;
  openStep?: string | null;
  progressionBandKey?: string | null;
  itemBankKey?: string | null;
};

export type NumberPathwayAssessmentAlignment = {
  bank: NumberAssessmentBankConfig;
  subElementKeys: string[];
  matchType: "direct" | "explicit" | "keyword";
  matchedBy: string;
  sourcePathwayStepId: string;
  sourceStepKey: string;
};

export type NumberAutoCheckStatus =
  | "Secure"
  | "Consolidating"
  | "Developing"
  | "Needs support"
  | "Not checked yet";

export type NumberPathwayRevealGroupKey =
  | "needsPolish"
  | "currentLearningZone"
  | "secureHistory"
  | "laterPathway";

export type NumberPathwayRevealStepInput = {
  id: number | string;
  title: string;
  stageKey: string;
  stageTitle: string;
  stepKey: string;
  pathwayStepId: string;
};

export type NumberPathwayRevealStep = NumberPathwayRevealStepInput & {
  order: number;
  alignment: NumberPathwayAssessmentAlignment | null;
  autoCheck: ReturnType<typeof getAutoCheckStatusForPathwayStep>;
  group: NumberPathwayRevealGroupKey;
};

export type NumberPathwayRevealGroups = {
  hasSavedAttempts: boolean;
  highestSecureOrder: number;
  currentLearningZoneStartOrder: number;
  needsPolish: NumberPathwayRevealStep[];
  currentLearningZone: NumberPathwayRevealStep[];
  secureHistory: NumberPathwayRevealStep[];
  laterPathway: NumberPathwayRevealStep[];
};

type BankAlignmentTarget = {
  bankKey: NumberAssessmentBankKey;
  subElementKeys?: string[];
};

const NUMBER_STRAND_KEY = "number-and-place-value";

const EXPLICIT_STEP_ALIGNMENT: Record<string, BankAlignmentTarget> = {
  "recognise-small-quantities-without-counting": {
    bankKey: "place-value-and-whole-number-operations",
  },
  "understand-negative-numbers-and-number-lines": {
    bankKey: "integers-coordinates-number-properties",
    subElementKeys: ["integer-ordering-and-operations"],
  },
  "apply-estimation-rounding-and-bounds": {
    bankKey: "approximation-estimation-error",
    subElementKeys: [
      "rounding-and-truncation",
      "estimation-with-operations",
      "error-and-repeated-approximation",
    ],
  },
};

const KEYWORD_ALIGNMENT_RULES: Array<{
  pattern: RegExp;
  target: BankAlignmentTarget;
  matchedBy: string;
}> = [
  {
    pattern: /\b(surd|surds|exact-form|exact form|rationalis)/,
    target: { bankKey: "surds-and-exact-form" },
    matchedBy: "surds/exact form keyword",
  },
  {
    pattern: /\b(irrational|real-number|real-numbers|real number|real numbers)\b/,
    target: { bankKey: "irrational-and-real-numbers" },
    matchedBy: "real/irrational keyword",
  },
  {
    pattern: /\b(terminating|recurring)\b/,
    target: { bankKey: "terminating-recurring-rational-representations" },
    matchedBy: "terminating/recurring decimal keyword",
  },
  {
    pattern: /\b(percent|percentage|ratio|proportional|proportion|rate|rates|finance|financial|discount|profit)\b/,
    target: {
      bankKey: "percentages-ratio-financial-modelling",
      subElementKeys: ["ratio-sharing-and-scaling"],
    },
    matchedBy: "percent/ratio/finance keyword",
  },
  {
    pattern: /\b(power|powers|root|roots|exponent|exponents|index|indices)\b/,
    target: { bankKey: "powers-roots-exponent-notation" },
    matchedBy: "powers/roots/exponents keyword",
  },
  {
    pattern: /\b(rational|rational-number|rational-numbers)\b/,
    target: { bankKey: "rational-numbers-and-operations" },
    matchedBy: "rational operations keyword",
  },
  {
    pattern: /\b(integer|integers|negative|coordinate|coordinates|factor|factors|multiple|multiples|prime|primes|composite|composites|divisib)\b/,
    target: { bankKey: "integers-coordinates-number-properties" },
    matchedBy: "integers/coordinates/properties keyword",
  },
  {
    pattern: /\b(time|elapsed|duration|timetable|timetables|calendar|calendars|schedule|clock)\b/,
    target: { bankKey: "time-and-elapsed-time-foundations" },
    matchedBy: "time context keyword",
  },
  {
    pattern: /\b(money|price|prices|budget|budgeting|receipt|receipts|change|cash|cost)\b/,
    target: { bankKey: "money-and-practical-number-contexts" },
    matchedBy: "money context keyword",
  },
  {
    pattern: /\b(pattern|patterns|sequence|sequences|input-output|input output|table|tables|algebraic|equation|equations)\b/,
    target: { bankKey: "number-patterns-and-early-algebraic-thinking" },
    matchedBy: "patterns/early algebra keyword",
  },
  {
    pattern: /\b(decimal|decimals|hundredth|hundredths|tenth|tenths)\b/,
    target: { bankKey: "decimals-foundations" },
    matchedBy: "decimal foundations keyword",
  },
  {
    pattern: /\b(fraction|fractions|numerator|denominator|equivalent-fraction|equivalent fractions)\b/,
    target: { bankKey: "fractions-foundations" },
    matchedBy: "fraction foundations keyword",
  },
  {
    pattern: /\b(multiplication|multiply|division|divide|quotient|arrays|array|equal-groups|equal groups|fact-family|fact families)\b/,
    target: { bankKey: "multiplication-division-fluency" },
    matchedBy: "multiplication/division keyword",
  },
  {
    pattern: /\b(additive|addition|subtraction|subtract|regroup|regrouping|renaming|compensation)\b/,
    target: { bankKey: "additive-strategies-and-problem-solving" },
    matchedBy: "additive strategies keyword",
  },
  {
    pattern: /\b(place-value|place value|whole-number|whole number|partition|partitioning)\b/,
    target: { bankKey: "place-value-and-whole-number-operations" },
    matchedBy: "place value keyword",
  },
];

const AUTO_CHECK_STATUS_RANK: Record<NumberAutoCheckStatus, number> = {
  "Needs support": 0,
  Developing: 1,
  Consolidating: 2,
  Secure: 3,
  "Not checked yet": -1,
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalize(value: unknown) {
  return safe(value).toLowerCase();
}

function extractStepKeyFromPathwayStepId(pathwayStepId: string) {
  const parts = pathwayStepId.split("::").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) || "";
}

function getSearchText(context: NumberPathwayAssessmentAlignmentContext) {
  return [
    context.stepKey,
    context.openStep,
    context.pathwayStepId,
    extractStepKeyFromPathwayStepId(safe(context.pathwayStepId)),
  ]
    .map(normalize)
    .filter(Boolean)
    .join(" ");
}

function getValidSubElementKeys(bank: NumberAssessmentBankConfig) {
  return new Set(bank.items.map((item) => item.subElementKey).filter(Boolean));
}

function createAlignment(
  target: BankAlignmentTarget,
  matchType: NumberPathwayAssessmentAlignment["matchType"],
  matchedBy: string,
  sourcePathwayStepId = "",
  sourceStepKey = "",
) {
  const bank = getNumberAssessmentBankByKey(target.bankKey);
  if (!bank) return null;

  const validSubElementKeys = getValidSubElementKeys(bank);
  const subElementKeys = (target.subElementKeys ?? []).filter((key) =>
    validSubElementKeys.has(key),
  );

  return {
    bank,
    subElementKeys,
    matchType,
    matchedBy,
    sourcePathwayStepId: safe(sourcePathwayStepId),
    sourceStepKey: safe(sourceStepKey),
  };
}

export function getNumberAssessmentAlignmentForPathwayStep(
  context: NumberPathwayAssessmentAlignmentContext,
): NumberPathwayAssessmentAlignment | null {
  const subjectKey = normalize(context.subjectKey);
  const strandKey = normalize(context.strandKey);

  if (subjectKey && subjectKey !== "mathematics") {
    return null;
  }

  if (strandKey && strandKey !== NUMBER_STRAND_KEY) {
    return null;
  }

  const itemBankKey = safe(context.itemBankKey);
  const progressionBandKey = safe(context.progressionBandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepKey = safe(context.stepKey);
  const openStep = safe(context.openStep);

  const directMatch = NUMBER_ASSESSMENT_BANKS.find((bank) => {
    if (itemBankKey && bank.itemBankKey === itemBankKey) return true;
    if (progressionBandKey && bank.progressionBandKey === progressionBandKey) return true;
    if (pathwayStepId && bank.pathwayStepId === pathwayStepId) return true;
    if (stepKey && bank.stepKey === stepKey) return true;
    return Boolean(
      openStep &&
        openStep !== "1" &&
        [bank.key, bank.stepKey, bank.progressionBandKey, bank.pathwayStepId].includes(openStep),
    );
  });

  if (directMatch) {
    return {
      bank: directMatch,
      subElementKeys: [],
      matchType: "direct",
      matchedBy: "bank metadata",
      sourcePathwayStepId: pathwayStepId,
      sourceStepKey: stepKey,
    };
  }

  const candidateStepKeys = [
    stepKey,
    openStep,
    extractStepKeyFromPathwayStepId(pathwayStepId),
  ]
    .map(normalize)
    .filter(Boolean);

  for (const candidate of candidateStepKeys) {
    const explicitTarget = EXPLICIT_STEP_ALIGNMENT[candidate];
    if (explicitTarget) {
      return createAlignment(
        explicitTarget,
        "explicit",
        candidate,
        pathwayStepId,
        stepKey || candidate,
      );
    }
  }

  const searchText = getSearchText(context);
  if (!searchText) return null;

  for (const rule of KEYWORD_ALIGNMENT_RULES) {
    if (rule.pattern.test(searchText)) {
      return createAlignment(rule.target, "keyword", rule.matchedBy, pathwayStepId, stepKey);
    }
  }

  return null;
}

export function getNumberAssessmentBankForPathwayStep(
  context: NumberPathwayAssessmentAlignmentContext,
) {
  return getNumberAssessmentAlignmentForPathwayStep(context)?.bank ?? null;
}

export function getNumberAssessmentLinkForPathwayStep(
  context: NumberPathwayAssessmentAlignmentContext,
  options: {
    learnerId?: string | null;
    returnTo?: string | null;
  } = {},
) {
  const alignment = getNumberAssessmentAlignmentForPathwayStep(context);
  if (!alignment) return null;

  const params = new URLSearchParams();
  params.set("source", "my-pathways");
  params.set("openStep", safe(context.stepKey) || alignment.bank.stepKey);
  params.set("subjectKey", safe(context.subjectKey) || alignment.bank.subjectKey);
  params.set("strandKey", safe(context.strandKey) || alignment.bank.strandKey);
  params.set("stageKey", safe(context.stageKey) || alignment.bank.stageKey);

  if (safe(context.pathwayStepId)) {
    params.set("pathwayStepId", safe(context.pathwayStepId));
  }

  if (safe(context.stepKey)) {
    params.set("stepKey", safe(context.stepKey));
  }

  if (safe(options.returnTo)) {
    params.set("returnTo", safe(options.returnTo));
  }

  if (safe(options.learnerId)) {
    params.set("learnerId", safe(options.learnerId));
  }

  params.set("progressionBandKey", alignment.bank.progressionBandKey);
  params.set("itemBankKey", alignment.bank.itemBankKey);

  if (alignment.subElementKeys.length === 1) {
    params.set("sourceSubElement", alignment.subElementKeys[0]);
  }

  return `/assessments/number?${params.toString()}`;
}

function getAttemptTime(attempt: CleanAssessmentAttempt) {
  return Date.parse(attempt.completedAt || attempt.updatedAt || attempt.createdAt || "");
}

function getPrototypeMetadata(attempt: CleanAssessmentAttempt) {
  return attempt.summarySnapshot.prototypeMetadata &&
    typeof attempt.summarySnapshot.prototypeMetadata === "object" &&
    !Array.isArray(attempt.summarySnapshot.prototypeMetadata)
    ? (attempt.summarySnapshot.prototypeMetadata as Record<string, unknown>)
    : null;
}

function hasExactStepAssessmentMetadata(attempt: CleanAssessmentAttempt) {
  const prototypeMetadata = getPrototypeMetadata(attempt);
  return Boolean(safe(prototypeMetadata?.stepAssessmentKey));
}

function isBroadFamilyAttemptForAlignment(
  attempt: CleanAssessmentAttempt,
  alignment: NumberPathwayAssessmentAlignment,
) {
  if (hasExactStepAssessmentMetadata(attempt)) return false;

  return (
    attempt.itemBankKey === alignment.bank.itemBankKey ||
    attempt.progressionBandKey === alignment.bank.progressionBandKey ||
    attempt.pathwayStepId === alignment.bank.pathwayStepId ||
    attempt.stepKey === alignment.bank.stepKey
  );
}

function getLatestRelevantAttempt(
  attempts: CleanAssessmentAttempt[],
  alignment: NumberPathwayAssessmentAlignment | null,
) {
  if (!alignment) return null;

  return (
    attempts
      .filter(
        (attempt) =>
          (alignment.sourcePathwayStepId &&
            attempt.pathwayStepId === alignment.sourcePathwayStepId) ||
          (alignment.sourceStepKey && attempt.stepKey === alignment.sourceStepKey),
      )
      .sort((left, right) => getAttemptTime(right) - getAttemptTime(left))[0] ??
    attempts
      .filter((attempt) => isBroadFamilyAttemptForAlignment(attempt, alignment))
      .sort((left, right) => getAttemptTime(right) - getAttemptTime(left))[0] ?? null
  );
}

function getSubElementStatusesFromSnapshot(
  snapshot: Record<string, unknown>,
  subElementKeys: string[],
) {
  const mastery = Array.isArray(snapshot.subElementMastery)
    ? snapshot.subElementMastery
    : [];

  return mastery
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const key = safe(candidate.subElementKey);
      const judgement = safe(candidate.judgement) as NumberAutoCheckStatus;

      if (!subElementKeys.includes(key) || !(judgement in AUTO_CHECK_STATUS_RANK)) {
        return null;
      }

      return judgement;
    })
    .filter((status): status is NumberAutoCheckStatus => Boolean(status));
}

function getWeakestStatus(statuses: NumberAutoCheckStatus[]) {
  return statuses.reduce<NumberAutoCheckStatus | null>((weakest, status) => {
    if (!weakest) return status;
    return AUTO_CHECK_STATUS_RANK[status] < AUTO_CHECK_STATUS_RANK[weakest]
      ? status
      : weakest;
  }, null);
}

function getBankLevelStatus(attempt: CleanAssessmentAttempt): NumberAutoCheckStatus {
  const prototypeMetadata = getPrototypeMetadata(attempt);
  const autoCheckStatus = safe(prototypeMetadata?.autoCheckStatus);
  if (autoCheckStatus in AUTO_CHECK_STATUS_RANK) {
    return autoCheckStatus as NumberAutoCheckStatus;
  }

  if (!attempt.itemCount) return "Not checked yet";

  const ratio = attempt.autoCorrectCount / attempt.itemCount;
  if (ratio >= 1) return "Secure";
  if (ratio >= 2 / 3) return "Consolidating";
  if (ratio >= 1 / 3) return "Developing";
  return "Needs support";
}

export function getAutoCheckStatusForPathwayStep(
  attempts: CleanAssessmentAttempt[],
  alignment: NumberPathwayAssessmentAlignment | null,
) {
  const attempt = getLatestRelevantAttempt(attempts, alignment);
  if (!attempt || !alignment) {
    return {
      status: "Not checked yet" as NumberAutoCheckStatus,
      attempt: null,
      scope: "none" as const,
    };
  }

  if (alignment.subElementKeys.length) {
    const subElementStatuses = getSubElementStatusesFromSnapshot(
      attempt.summarySnapshot,
      alignment.subElementKeys,
    );
    const weakestSubElementStatus = getWeakestStatus(subElementStatuses);

    if (weakestSubElementStatus) {
      return {
        status: weakestSubElementStatus,
        attempt,
        scope: "sub-element" as const,
      };
    }
  }

  return {
    status: getBankLevelStatus(attempt),
    attempt,
    scope: "bank" as const,
  };
}

function isSecureEnough(status: NumberAutoCheckStatus) {
  return status === "Secure" || status === "Consolidating";
}

function isWeakAutoCheck(status: NumberAutoCheckStatus) {
  return status === "Developing" || status === "Needs support";
}

export function getNumberPathwayRevealGroups(
  steps: NumberPathwayRevealStepInput[],
  attempts: CleanAssessmentAttempt[],
): NumberPathwayRevealGroups {
  const revealSteps = steps.map((step, index) => {
    const alignment = getNumberAssessmentAlignmentForPathwayStep({
      subjectKey: "mathematics",
      strandKey: NUMBER_STRAND_KEY,
      stageKey: step.stageKey,
      pathwayStepId: step.pathwayStepId,
      stepKey: step.stepKey,
    });
    const autoCheck = getAutoCheckStatusForPathwayStep(attempts, alignment);

    return {
      ...step,
      order: index,
      alignment,
      autoCheck,
      group: "laterPathway" as NumberPathwayRevealGroupKey,
    };
  });

  const hasSavedAttempts = revealSteps.some(
    (step) => step.autoCheck.status !== "Not checked yet",
  );

  const highestSecureOrder = revealSteps.reduce((highest, step) => {
    if (!isSecureEnough(step.autoCheck.status)) return highest;
    return Math.max(highest, step.order);
  }, -1);

  const currentLearningZoneStartOrder = Math.max(0, highestSecureOrder + 1);
  const currentLearningZoneEndOrder = currentLearningZoneStartOrder + 3;

  const grouped = revealSteps.map((step) => {
    let group: NumberPathwayRevealGroupKey = "laterPathway";

    if (
      hasSavedAttempts &&
      highestSecureOrder >= 0 &&
      step.order <= highestSecureOrder &&
      isWeakAutoCheck(step.autoCheck.status)
    ) {
      group = "needsPolish";
    } else if (
      hasSavedAttempts &&
      step.order >= currentLearningZoneStartOrder &&
      step.order <= currentLearningZoneEndOrder
    ) {
      group = "currentLearningZone";
    } else if (
      hasSavedAttempts &&
      step.order <= highestSecureOrder &&
      isSecureEnough(step.autoCheck.status)
    ) {
      group = "secureHistory";
    }

    return {
      ...step,
      group,
    };
  });

  return {
    hasSavedAttempts,
    highestSecureOrder,
    currentLearningZoneStartOrder,
    needsPolish: grouped.filter((step) => step.group === "needsPolish"),
    currentLearningZone: grouped.filter(
      (step) => step.group === "currentLearningZone",
    ),
    secureHistory: grouped.filter((step) => step.group === "secureHistory"),
    laterPathway: grouped.filter((step) => step.group === "laterPathway"),
  };
}
