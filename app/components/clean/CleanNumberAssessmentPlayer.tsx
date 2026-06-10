"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanContentIssueReportButton, {
  type ContentIssueReportContext,
} from "@/app/components/clean/CleanContentIssueReportButton";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import {
  isStep2NumberWordActivity,
  isStep3NumeralActivity,
  isStep4CountingObjectsActivity,
  isStep5CountingObjectsActivity,
  isStep6CompareGroupsActivity,
  isStep7OrderNumbersActivity,
  isStep8PartWholeActivity,
  isStep9ObjectStoryActivity,
  isStep10EqualSharingActivity,
  isStep11CountingSequenceActivity,
  isStep12ReadWriteOrderActivity,
  isStep13SkipCountingActivity,
  isStep16RenameTwoDigitActivity,
  isStep17AddSubtractWithin20Activity,
  isStep18SupportedAddSubtractActivity,
  isStep19EqualGroupsArraysActivity,
  isStep20HalvesQuartersSharingActivity,
  isStep21LargeNumberCompareActivity,
  isStep22HundredsTensOnesActivity,
  isStep23PartitionRegroupActivity,
  isStep24ZeroPlaceholderActivity,
  isStep25PlaceValueAddSubtractActivity,
  isStep26MultiplicationFactsActivity,
  isStep27ArraysGroupingKnownFactsActivity,
  isStep28EstimateReasonablenessActivity,
  isStep29UnitSimpleFractionsActivity,
  isStep30PracticalMoneyActivity,
  isStep31ExtendedPlaceValueActivity,
  isStep32RoundEstimateLargerNumbersActivity,
  isStep33DecimalPlaceValueActivity,
  isStep34CompareOrderDecimalsActivity,
  isStep35EquivalentFractionsActivity,
  isStep36FractionAddSubtractActivity,
  isStep37EfficientStrategiesActivity,
  isStep38RemaindersContextActivity,
  isStep39FractionDecimalPercentActivity,
  isStep40FinancialModellingActivity,
  isStep41FlexibleNumberFormsActivity,
  isStep42NegativeNumberLineActivity,
  isStep44PowersRootsActivity,
  isStep45RatioRatesActivity,
  isStep46ProportionalReasoningActivity,
  isStep48EstimationBoundsActivity,
  parseEarlyNumberVisualDescription,
  renderStep2WorksheetOptionCard,
  renderStep2WorksheetPromptVisual,
  renderStep3WorksheetOptionCard,
  renderStep3WorksheetPromptVisual,
  renderStep4WorksheetOptionCard,
  renderStep4WorksheetPromptVisual,
  renderStep6WorksheetOptionCard,
  renderStep6WorksheetPromptVisual,
  renderStep7WorksheetOptionCard,
  renderStep7WorksheetPromptVisual,
  renderStep8WorksheetOptionCard,
  renderStep8WorksheetPromptVisual,
  renderStep9WorksheetOptionCard,
  renderStep9WorksheetPromptVisual,
  renderStep10WorksheetOptionCard,
  renderStep10WorksheetPromptVisual,
  renderStep11WorksheetOptionCard,
  renderStep11WorksheetPromptVisual,
  renderStep12WorksheetOptionCard,
  renderStep12WorksheetPromptVisual,
  renderStep13WorksheetOptionCard,
  renderStep13WorksheetPromptVisual,
  renderStep16WorksheetOptionCard,
  renderStep16WorksheetPromptVisual,
  renderStep17WorksheetOptionCard,
  renderStep17WorksheetPromptVisual,
  renderStep18WorksheetOptionCard,
  renderStep18WorksheetPromptVisual,
  renderStep19WorksheetOptionCard,
  renderStep19WorksheetPromptVisual,
  renderStep20WorksheetOptionCard,
  renderStep20WorksheetPromptVisual,
  renderStep21WorksheetOptionCard,
  renderStep21WorksheetPromptVisual,
  renderStep22WorksheetOptionCard,
  renderStep22WorksheetPromptVisual,
  renderStep23WorksheetOptionCard,
  renderStep23WorksheetPromptVisual,
  renderStep24WorksheetOptionCard,
  renderStep24WorksheetPromptVisual,
  renderStep25WorksheetOptionCard,
  renderStep25WorksheetPromptVisual,
  renderStep26WorksheetOptionCard,
  renderStep26WorksheetPromptVisual,
  renderStep27WorksheetOptionCard,
  renderStep27WorksheetPromptVisual,
  renderStep28WorksheetOptionCard,
  renderStep28WorksheetPromptVisual,
  renderStep29WorksheetOptionCard,
  renderStep29WorksheetPromptVisual,
  renderStep30WorksheetOptionCard,
  renderStep30WorksheetPromptVisual,
  renderStep31WorksheetOptionCard,
  renderStep31WorksheetPromptVisual,
  renderStep32WorksheetOptionCard,
  renderStep32WorksheetPromptVisual,
  renderStep33WorksheetOptionCard,
  renderStep33WorksheetPromptVisual,
  renderStep34WorksheetOptionCard,
  renderStep34WorksheetPromptVisual,
  renderStep35WorksheetOptionCard,
  renderStep35WorksheetPromptVisual,
  renderStep36WorksheetOptionCard,
  renderStep36WorksheetPromptVisual,
  renderStep37WorksheetOptionCard,
  renderStep37WorksheetPromptVisual,
  renderStep38WorksheetOptionCard,
  renderStep38WorksheetPromptVisual,
  renderStep39WorksheetOptionCard,
  renderStep39WorksheetPromptVisual,
  renderStep40WorksheetOptionCard,
  renderStep40WorksheetPromptVisual,
  renderStep41WorksheetOptionCard,
  renderStep41WorksheetPromptVisual,
  renderStep42WorksheetOptionCard,
  renderStep42WorksheetPromptVisual,
  renderStep44WorksheetOptionCard,
  renderStep44WorksheetPromptVisual,
  renderStep45WorksheetOptionCard,
  renderStep45WorksheetPromptVisual,
  renderStep46WorksheetOptionCard,
  renderStep46WorksheetPromptVisual,
  renderStep48WorksheetOptionCard,
  renderStep48WorksheetPromptVisual,
} from "@/app/components/clean/math/EarlyNumberWorksheetVisuals";
import {
  createAssessmentAttempt,
  createAssessmentAttemptResponses,
} from "@/lib/clean/assessments/attemptClient";
import {
  NUMBER_ASSESSMENT_BANKS,
  getNumberAssessmentBankByKey,
  type NumberAssessmentBankItem,
  type NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  getNumberAssessmentAlignmentForPathwayStep,
} from "@/lib/clean/assessments/numberPathwayAssessmentAlignment";
import {
  getStepAssessmentForPathwayStep,
  getStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/stepAssessmentRegistry";
import {
  getStepPracticeForPathwayStep,
} from "@/lib/clean/practice/stepPracticeRegistry";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentStatus,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type {
  AssessmentAttemptLocalResult,
  CleanAssessmentAttemptSnapshot,
  CreateCleanAssessmentAttemptResponseInput,
} from "@/lib/clean/assessments/attemptTypes";
import type {
  NumberAssessmentItemDifficulty,
} from "@/lib/clean/assessments/numberApproximationAssessmentItems";
import { NUMBER_APPROXIMATION_PRACTICE_MODULE } from "@/lib/clean/practice/numberApproximationPracticeModules";
import { NUMBER_ADDITIVE_STRATEGIES_PRACTICE_MODULE } from "@/lib/clean/practice/numberAdditiveStrategiesPracticeModules";
import { NUMBER_IRRATIONAL_REAL_PRACTICE_MODULE } from "@/lib/clean/practice/numberIrrationalRealPracticeModules";
import { NUMBER_INTEGERS_COORDINATES_PROPERTIES_PRACTICE_MODULE } from "@/lib/clean/practice/numberIntegersCoordinatesPropertiesPracticeModules";
import { NUMBER_PERCENT_RATIO_FINANCE_PRACTICE_MODULE } from "@/lib/clean/practice/numberPercentRatioFinancePracticeModules";
import { NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE } from "@/lib/clean/practice/numberPlaceValueOperationsPracticeModules";
import { NUMBER_FRACTIONS_FOUNDATIONS_PRACTICE_MODULE } from "@/lib/clean/practice/numberFractionsFoundationsPracticeModules";
import { NUMBER_DECIMALS_FOUNDATIONS_PRACTICE_MODULE } from "@/lib/clean/practice/numberDecimalsFoundationsPracticeModules";
import { NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PRACTICE_MODULE } from "@/lib/clean/practice/numberMultiplicationDivisionFluencyPracticeModules";
import { NUMBER_MONEY_PRACTICAL_CONTEXTS_PRACTICE_MODULE } from "@/lib/clean/practice/numberMoneyPracticalContextsPracticeModules";
import { NUMBER_PATTERNS_EARLY_ALGEBRA_PRACTICE_MODULE } from "@/lib/clean/practice/numberPatternsEarlyAlgebraPracticeModules";
import { NUMBER_TIME_ELAPSED_FOUNDATIONS_PRACTICE_MODULE } from "@/lib/clean/practice/numberTimeElapsedFoundationsPracticeModules";
import { NUMBER_POWERS_ROOTS_PRACTICE_MODULE } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import { NUMBER_RATIONAL_OPERATIONS_PRACTICE_MODULE } from "@/lib/clean/practice/numberRationalOperationsPracticeModules";
import { NUMBER_SURDS_EXACT_PRACTICE_MODULE } from "@/lib/clean/practice/numberSurdsExactPracticeModules";
import { NUMBER_TERMINATING_RECURRING_RATIONAL_PRACTICE_MODULE } from "@/lib/clean/practice/numberTerminatingRecurringRationalPracticeModules";
import type { Learner } from "@/lib/clean/learners/types";

type LocalAssessmentResult = AssessmentAttemptLocalResult;

type LocalAssessmentResponse = {
  itemId: string;
  response: string;
  submitted: boolean;
  result: LocalAssessmentResult;
  submittedAt: string | null;
};

type SubElementMasteryJudgement =
  | "Needs support"
  | "Developing"
  | "Consolidating"
  | "Secure";

type LocalSubElementMastery = {
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  totalCount: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  reviewNeededCount: number;
  unansweredCount: number;
  judgement: SubElementMasteryJudgement;
  suggestedPracticeFocus: string;
};

type TargetedPracticeRecommendationStatus = "available" | "coming_next";

type LocalTargetedPracticeRecommendation = {
  subElementKey: string;
  subElementTitle: string;
  judgement: SubElementMasteryJudgement;
  correctCount: number;
  totalCount: number;
  subjectKey: string;
  strandKey: string;
  stageKey: string;
  pathwayStepId: string;
  stepKey: string;
  progressionBandKey: string;
  progressionStepKey: string;
  practiceModuleId: string | null;
  practiceModuleTitle: string | null;
  practiceSectionId: string | null;
  practiceSectionTitle: string | null;
  message: string;
  status: TargetedPracticeRecommendationStatus;
};

type LocalAdaptiveInsightSummary = {
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  notSureCount: number;
  reviewNeededCount: number;
  unansweredCount: number;
  enteredButUncheckedCount: number;
  subElementMastery: LocalSubElementMastery[];
  targetedPracticeRecommendation: LocalTargetedPracticeRecommendation | null;
  topMisconceptionTargets: Array<{ code: string; label: string; count: number }>;
  topPracticeRecommendations: Array<{ recommendation: string; count: number }>;
  suggestedFocusAreas: string[];
  suggestedNextStep: string;
  parentJudgementPrompt: string;
};

type ParentJudgement =
  | "secure"
  | "developing"
  | "needs_support"
  | "not_enough_evidence_yet";

type AssessmentAttemptSaveState = "idle" | "saving" | "saved" | "failed";

type AssessmentSessionMode = "launcher" | "active" | "summary";

const NOT_SURE_RESPONSE = "__not_sure__";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  display: "grid",
  gap: 18,
};

const sessionShellStyle: React.CSSProperties = {
  border: "1px solid #dbe4f0",
  borderRadius: 24,
  background: "#ffffff",
  overflow: "hidden",
  boxShadow: "0 22px 54px rgba(15,23,42,0.10)",
};

const sessionHeaderStyle: React.CSSProperties = {
  padding: "14px 16px",
  display: "grid",
  gap: 10,
  borderBottom: "1px solid #e2e8f0",
  background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
};

const sessionBodyStyle: React.CSSProperties = {
  padding: 16,
  display: "grid",
  gap: 14,
};

const workspaceLayoutStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  alignItems: "flex-start",
};

const workspaceCardStyle: React.CSSProperties = {
  flex: "1.6 1 600px",
  minWidth: 0,
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: "clamp(18px, 3vw, 26px)",
  boxShadow: "0 14px 32px rgba(15,23,42,0.06)",
  display: "grid",
  gap: 18,
};

const supportColumnStyle: React.CSSProperties = {
  flex: "0.85 1 300px",
  minWidth: "min(100%, 280px)",
  display: "grid",
  gap: 12,
};

const actionBarStyle: React.CSSProperties = {
  borderTop: "1px solid #e2e8f0",
  padding: "12px 16px",
  background: "#fcfdff",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#f8fafc",
  padding: 14,
  display: "grid",
  gap: 8,
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 16,
  background: "#f8fbff",
  padding: 14,
  display: "grid",
  gap: 6,
};

const POWERS_ROOTS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "perfect-square-roots": {
    sectionId: "fluency",
    sectionTitle: "Fluency",
  },
  "exponent-notation": {
    sectionId: "understanding",
    sectionTitle: "Understanding",
  },
  "powers-of-ten-and-prime-powers": {
    sectionId: "problem-solving",
    sectionTitle: "Problem Solving",
  },
  "exponent-laws": {
    sectionId: "reasoning",
    sectionTitle: "Reasoning",
  },
};

const APPROXIMATION_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "rounding-and-truncation": {
    sectionId: "rounding-and-truncation",
    sectionTitle: "Rounding and truncation",
  },
  "estimation-with-operations": {
    sectionId: "estimation-with-operations",
    sectionTitle: "Estimation with operations",
  },
  "exact-vs-estimated-comparison": {
    sectionId: "exact-vs-estimated-comparison",
    sectionTitle: "Exact versus estimated comparison",
  },
  "error-and-repeated-approximation": {
    sectionId: "error-and-repeated-approximation",
    sectionTitle: "Error and repeated approximation",
  },
};

const IRRATIONAL_REAL_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "rational-irrational-classification": {
    sectionId: "rational-irrational-classification",
    sectionTitle: "Rational and irrational classification",
  },
  "pi-and-exact-form": {
    sectionId: "pi-and-exact-form",
    sectionTitle: "Pi and exact form",
  },
  "square-root-estimation": {
    sectionId: "square-root-estimation",
    sectionTitle: "Square-root estimation",
  },
  "real-number-position-and-comparison": {
    sectionId: "real-number-position-and-comparison",
    sectionTitle: "Real-number position and comparison",
  },
};

const SURDS_EXACT_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "surd-notation-and-fractional-powers": {
    sectionId: "surd-notation-and-fractional-powers",
    sectionTitle: "Surd notation and fractional powers",
  },
  "surd-simplification": {
    sectionId: "surd-simplification",
    sectionTitle: "Surd simplification",
  },
  "surd-operations": {
    sectionId: "surd-operations",
    sectionTitle: "Surd operations",
  },
  "rationalising-denominators-and-exact-form": {
    sectionId: "rationalising-denominators-and-exact-form",
    sectionTitle: "Rationalising denominators and exact form",
  },
};

const RATIONAL_OPERATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "equivalent-rational-representations": {
    sectionId: "equivalent-rational-representations",
    sectionTitle: "Equivalent rational representations",
  },
  "fraction-and-decimal-operations": {
    sectionId: "fraction-and-decimal-operations",
    sectionTitle: "Fraction and decimal operations",
  },
  "rational-number-comparison": {
    sectionId: "rational-number-comparison",
    sectionTitle: "Rational number comparison",
  },
  "rational-operations-in-context": {
    sectionId: "rational-operations-in-context",
    sectionTitle: "Rational operations in context",
  },
};

const TERMINATING_RECURRING_RATIONAL_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "terminating-decimal-representations": {
    sectionId: "terminating-decimal-representations",
    sectionTitle: "Terminating decimal representations",
  },
  "recurring-decimal-representations": {
    sectionId: "recurring-decimal-representations",
    sectionTitle: "Recurring decimal representations",
  },
  "fraction-decimal-conversions": {
    sectionId: "fraction-decimal-conversions",
    sectionTitle: "Fraction and decimal conversions",
  },
  "rational-irrational-decimal-boundary": {
    sectionId: "rational-irrational-decimal-boundary",
    sectionTitle: "Rational and irrational decimal boundary",
  },
};

const PERCENT_RATIO_FINANCE_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "percentage-of-quantities": {
    sectionId: "percentage-of-quantities",
    sectionTitle: "Percentage of quantities",
  },
  "ratio-sharing-and-scaling": {
    sectionId: "ratio-sharing-and-scaling",
    sectionTitle: "Ratio sharing and scaling",
  },
  "discounts-profit-and-financial-change": {
    sectionId: "discounts-profit-and-financial-change",
    sectionTitle: "Discounts, profit and financial change",
  },
  "percentage-error-and-financial-modelling": {
    sectionId: "percentage-error-and-financial-modelling",
    sectionTitle: "Percentage error and financial modelling",
  },
};

const INTEGERS_COORDINATES_PROPERTIES_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "integer-ordering-and-operations": {
    sectionId: "integer-ordering-and-operations",
    sectionTitle: "Integer ordering and operations",
  },
  "coordinates-and-integer-position": {
    sectionId: "coordinates-and-integer-position",
    sectionTitle: "Coordinates and integer position",
  },
  "factors-multiples-and-divisibility": {
    sectionId: "factors-multiples-and-divisibility",
    sectionTitle: "Factors, multiples and divisibility",
  },
  "primes-composites-and-number-properties": {
    sectionId: "primes-composites-and-number-properties",
    sectionTitle: "Primes, composites and number properties",
  },
};

const PLACE_VALUE_OPERATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "place-value-and-number-structure": {
    sectionId: "place-value-and-number-structure",
    sectionTitle: "Place value and number structure",
  },
  "comparing-ordering-and-rounding": {
    sectionId: "comparing-ordering-and-rounding",
    sectionTitle: "Comparing, ordering and rounding",
  },
  "addition-and-subtraction-strategies": {
    sectionId: "addition-and-subtraction-strategies",
    sectionTitle: "Addition and subtraction strategies",
  },
  "multiplication-and-division-foundations": {
    sectionId: "multiplication-and-division-foundations",
    sectionTitle: "Multiplication and division foundations",
  },
};

const FRACTIONS_FOUNDATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "fraction-meaning-and-representation": {
    sectionId: "fraction-meaning-and-representation",
    sectionTitle: "Fraction meaning and representation",
  },
  "equivalent-fractions": {
    sectionId: "equivalent-fractions",
    sectionTitle: "Equivalent fractions",
  },
  "comparing-and-ordering-fractions": {
    sectionId: "comparing-and-ordering-fractions",
    sectionTitle: "Comparing and ordering fractions",
  },
  "fraction-problem-solving-foundations": {
    sectionId: "fraction-problem-solving-foundations",
    sectionTitle: "Fraction problem-solving foundations",
  },
};

const DECIMALS_FOUNDATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "decimal-place-value": {
    sectionId: "decimal-place-value",
    sectionTitle: "Decimal place value",
  },
  "fraction-decimal-connections": {
    sectionId: "fraction-decimal-connections",
    sectionTitle: "Fraction and decimal connections",
  },
  "comparing-ordering-and-rounding-decimals": {
    sectionId: "comparing-ordering-and-rounding-decimals",
    sectionTitle: "Comparing, ordering and rounding decimals",
  },
  "decimal-problem-solving-foundations": {
    sectionId: "decimal-problem-solving-foundations",
    sectionTitle: "Decimal problem-solving foundations",
  },
};

const ADDITIVE_STRATEGIES_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "mental-addition-strategies": {
    sectionId: "mental-addition-strategies",
    sectionTitle: "Mental addition strategies",
  },
  "mental-subtraction-strategies": {
    sectionId: "mental-subtraction-strategies",
    sectionTitle: "Mental subtraction strategies",
  },
  "written-addition-and-subtraction": {
    sectionId: "written-addition-and-subtraction",
    sectionTitle: "Written addition and subtraction",
  },
  "additive-problem-solving": {
    sectionId: "additive-problem-solving",
    sectionTitle: "Additive problem solving",
  },
};

const MULTIPLICATION_DIVISION_FLUENCY_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "multiplication-facts-and-arrays": {
    sectionId: "multiplication-facts-and-arrays",
    sectionTitle: "Multiplication facts and arrays",
  },
  "division-facts-and-equal-groups": {
    sectionId: "division-facts-and-equal-groups",
    sectionTitle: "Division facts and equal groups",
  },
  "fact-families-and-inverse-relationships": {
    sectionId: "fact-families-and-inverse-relationships",
    sectionTitle: "Fact families and inverse relationships",
  },
  "multiplicative-problem-solving": {
    sectionId: "multiplicative-problem-solving",
    sectionTitle: "Multiplicative problem solving",
  },
};

const PATTERNS_EARLY_ALGEBRA_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "skip-counting-and-number-sequences": {
    sectionId: "skip-counting-and-number-sequences",
    sectionTitle: "Skip-counting and number sequences",
  },
  "growing-and-shrinking-patterns": {
    sectionId: "growing-and-shrinking-patterns",
    sectionTitle: "Growing and shrinking patterns",
  },
  "input-output-rules-and-tables": {
    sectionId: "input-output-rules-and-tables",
    sectionTitle: "Input-output rules and tables",
  },
  "missing-numbers-and-simple-equations": {
    sectionId: "missing-numbers-and-simple-equations",
    sectionTitle: "Missing numbers and simple equations",
  },
};

const MONEY_PRACTICAL_CONTEXTS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "money-values-and-equivalent-amounts": {
    sectionId: "money-values-and-equivalent-amounts",
    sectionTitle: "Money values and equivalent amounts",
  },
  "money-calculations-and-change": {
    sectionId: "money-calculations-and-change",
    sectionTitle: "Money calculations and change",
  },
  "practical-measurement-and-time-contexts": {
    sectionId: "practical-measurement-and-time-contexts",
    sectionTitle: "Practical measurement and time contexts",
  },
  "estimation-budgeting-and-reasonableness": {
    sectionId: "estimation-budgeting-and-reasonableness",
    sectionTitle: "Estimation, budgeting and reasonableness",
  },
};

const TIME_ELAPSED_FOUNDATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT: Record<
  string,
  { sectionId: string; sectionTitle: string }
> = {
  "reading-and-representing-time": {
    sectionId: "reading-and-representing-time",
    sectionTitle: "Reading and representing time",
  },
  "elapsed-time-and-duration": {
    sectionId: "elapsed-time-and-duration",
    sectionTitle: "Elapsed time and duration",
  },
  "timetables-and-daily-schedules": {
    sectionId: "timetables-and-daily-schedules",
    sectionTitle: "Timetables and daily schedules",
  },
  "calendars-and-multi-step-time-contexts": {
    sectionId: "calendars-and-multi-step-time-contexts",
    sectionTitle: "Calendars and multi-step time contexts",
  },
};

const highlightCardStyle: React.CSSProperties = {
  ...helperCardStyle,
  border: "1px solid #bfdbfe",
  background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
  boxShadow: "0 10px 22px rgba(59,130,246,0.08)",
};

const chipBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.2,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#64748b",
  textTransform: "uppercase",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "11px 13px",
  fontSize: 15,
  background: "#ffffff",
  color: "#0f172a",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 140,
  resize: "vertical",
  fontFamily: "inherit",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const disabledButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  color: "#94a3b8",
  cursor: "not-allowed",
  opacity: 0.7,
};

const optionButtonStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  textAlign: "left",
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  padding: "12px 14px",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 15,
  lineHeight: 1.5,
  cursor: "pointer",
};

const progressTrackStyle: React.CSSProperties = {
  width: "100%",
  height: 7,
  borderRadius: 999,
  background: "#e2e8f0",
  overflow: "hidden",
};

const launcherShellStyle: React.CSSProperties = {
  border: "1px solid #dbe4f0",
  borderRadius: 24,
  background: "#ffffff",
  boxShadow: "0 22px 54px rgba(15,23,42,0.10)",
  overflow: "hidden",
};

const launcherHeaderStyle: React.CSSProperties = {
  padding: "clamp(20px, 4vw, 32px)",
  display: "grid",
  gap: 8,
  borderBottom: "1px solid #e2e8f0",
  background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
};

const launcherBodyStyle: React.CSSProperties = {
  padding: "clamp(16px, 4vw, 26px)",
  display: "grid",
  gap: 18,
};

const focusGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 12,
};

const assessmentTopBarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const parentJudgementToneMeta: Record<
  ParentJudgement,
  { border: string; background: string; color: string }
> = {
  secure: {
    border: "#bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
  },
  developing: {
    border: "#fde68a",
    background: "#fffbeb",
    color: "#b45309",
  },
  needs_support: {
    border: "#c7d2fe",
    background: "#eef2ff",
    color: "#4338ca",
  },
  not_enough_evidence_yet: {
    border: "#cbd5e1",
    background: "#f8fafc",
    color: "#475569",
  },
};

function getDifficultyTone(
  difficulty: NumberAssessmentItemDifficulty,
): React.CSSProperties {
  if (difficulty === "foundation") {
    return {
      ...chipBaseStyle,
      border: "1px solid #bfdbfe",
      background: "#eff6ff",
      color: "#1d4ed8",
    };
  }

  if (difficulty === "developing") {
    return {
      ...chipBaseStyle,
      border: "1px solid #fde68a",
      background: "#fffbeb",
      color: "#b45309",
    };
  }

  if (difficulty === "secure") {
    return {
      ...chipBaseStyle,
      border: "1px solid #bbf7d0",
      background: "#f0fdf4",
      color: "#166534",
    };
  }

  return {
    ...chipBaseStyle,
    border: "1px solid #ddd6fe",
    background: "#f5f3ff",
    color: "#6d28d9",
  };
}

function getFormatTone(format: string): React.CSSProperties {
  if (format === "rounding" || format === "estimation") {
    return {
      ...chipBaseStyle,
      border: "1px solid #bfdbfe",
      background: "#f8fbff",
      color: "#1e40af",
    };
  }

  if (format === "truncation" || format === "error_comparison") {
    return {
      ...chipBaseStyle,
      border: "1px solid #cbd5e1",
      background: "#f8fafc",
      color: "#475569",
    };
  }

  if (
    format === "applied_context" ||
    format === "reasonableness" ||
    format === "geometric_reasoning"
  ) {
    return {
      ...chipBaseStyle,
      border: "1px solid #bbf7d0",
      background: "#f0fdf4",
      color: "#166534",
    };
  }

  if (
    format === "classification" ||
    format === "number_line" ||
    format === "exact_form" ||
    format === "real_number_reasoning"
  ) {
    return {
      ...chipBaseStyle,
      border: "1px solid #c7d2fe",
      background: "#eef2ff",
      color: "#4338ca",
    };
  }

  if (
    format === "square_roots" ||
    format === "exponent_notation" ||
    format === "powers_of_ten" ||
    format === "prime_factorisation" ||
    format === "exponent_laws"
  ) {
    return {
      ...chipBaseStyle,
      border: "1px solid #fde68a",
      background: "#fffbeb",
      color: "#b45309",
    };
  }

  if (
    format === "fractional_powers" ||
    format === "surd_equivalence" ||
    format === "surd_simplification" ||
    format === "surd_operations" ||
    format === "multi_step_surd_reasoning" ||
    format === "rationalising" ||
    format === "exact_form_reasoning"
  ) {
    return {
      ...chipBaseStyle,
      border: "1px solid #c7d2fe",
      background: "#eef2ff",
      color: "#4338ca",
    };
  }

  return {
    ...chipBaseStyle,
    border: "1px solid #ddd6fe",
    background: "#f5f3ff",
    color: "#6d28d9",
  };
}

function getResultTone(result: LocalAssessmentResult): React.CSSProperties {
  if (result === "correct") {
    return {
      ...chipBaseStyle,
      border: "1px solid #bbf7d0",
      background: "#f0fdf4",
      color: "#166534",
    };
  }

  if (result === "incorrect") {
    return {
      ...chipBaseStyle,
      border: "1px solid #fde68a",
      background: "#fffbeb",
      color: "#b45309",
    };
  }

  if (result === "review_needed") {
    return {
      ...chipBaseStyle,
      border: "1px solid #c7d2fe",
      background: "#eef2ff",
      color: "#4338ca",
    };
  }

  return {
    ...chipBaseStyle,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#64748b",
  };
}

function createEmptyResponse(itemId: string): LocalAssessmentResponse {
  return {
    itemId,
    response: "",
    submitted: false,
    result: "unanswered",
    submittedAt: null,
  };
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSymbolicValue(value: string) {
  return normalizeValue(value)
    .replace(/[×*]/g, "x")
    .replace(/\s*x\s*/g, "x")
    .replace(/\s+/g, "");
}

function getComparableAnswers(item: NumberAssessmentBankItem) {
  return [item.expectedAnswer, ...(item.acceptableAnswers ?? [])].filter(Boolean);
}

function parseStructuredResponse(responseText: string) {
  const text = responseText.trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function serializeStructuredResponse(value: Record<string, unknown>) {
  return JSON.stringify(value);
}

function getStructuredOptions(item: NumberAssessmentBankItem) {
  if (item.structuredOptions?.length) {
    return item.structuredOptions;
  }

  return (item.options ?? []).map((option) => ({
    id: option,
    label: option,
    value: option,
  }));
}

function getOptionComparisonValues(option: { id: string; label: string; value?: string }) {
  return [option.id, option.label, option.value].filter(Boolean).map((value) =>
    normalizeValue(String(value)),
  );
}

function getCorrectOptionIds(item: NumberAssessmentBankItem) {
  if (item.correctOptionIds?.length) {
    return item.correctOptionIds;
  }

  const acceptable = getComparableAnswers(item).map((value) =>
    normalizeValue(String(value)),
  );

  if (!acceptable.length) {
    return [];
  }

  return getStructuredOptions(item)
    .filter((option) =>
      getOptionComparisonValues(option).some((value) => acceptable.includes(value)),
    )
    .map((option) => option.id);
}

function getSingleCorrectOptionId(
  item: NumberAssessmentBankItem,
  explicitOptionId?: string,
) {
  if (explicitOptionId) {
    return explicitOptionId;
  }

  return getCorrectOptionIds(item)[0] || "";
}

function getStructuredStringArray(
  responseText: string,
  key: string,
) {
  const parsed = parseStructuredResponse(responseText);
  const value = parsed?.[key];
  return Array.isArray(value)
    ? value.map((entry) => String(entry)).filter(Boolean)
    : [];
}

function getStructuredStringMap(responseText: string, key: string) {
  const parsed = parseStructuredResponse(responseText);
  const value = parsed?.[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      String(entryValue ?? ""),
    ]),
  );
}

function setsMatch(left: string[], right: string[]) {
  if (left.length !== right.length) return false;

  const normalizedLeft = [...left].map(normalizeValue).sort();
  const normalizedRight = [...right].map(normalizeValue).sort();

  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function sequencesMatch(left: string[], right: string[]) {
  if (left.length !== right.length) return false;

  return left.every(
    (value, index) => normalizeValue(value) === normalizeValue(right[index] ?? ""),
  );
}

function isOpenResponse(item: NumberAssessmentBankItem) {
  return (
    item.answerType === "worked_response" ||
    item.answerType === "explain_or_justify"
  );
}

function hasEnteredResponse(response: LocalAssessmentResponse) {
  return response.response.trim().length > 0;
}

function isNotSureResponse(responseText: string) {
  return responseText.trim() === NOT_SURE_RESPONSE;
}

function getCheckResult(
  item: NumberAssessmentBankItem,
  responseText: string,
): LocalAssessmentResult {
  const normalizedResponse = normalizeValue(responseText);

  if (isNotSureResponse(responseText)) {
    return "incorrect";
  }

  if (!responseText.trim()) {
    return "unanswered";
  }

  if (isOpenResponse(item)) {
    return "review_needed";
  }

  if (item.answerType === "multi_select") {
    const selectedOptionIds = getStructuredStringArray(
      responseText,
      "selectedOptionIds",
    );
    const correctOptionIds = getCorrectOptionIds(item);

    if (!selectedOptionIds.length) return "unanswered";
    if (!correctOptionIds.length) return "review_needed";

    return setsMatch(selectedOptionIds, correctOptionIds) ? "correct" : "incorrect";
  }

  if (item.answerType === "matching") {
    const matches = getStructuredStringMap(responseText, "matches");
    const pairs = item.matchingPairs ?? [];

    if (!pairs.length) return "review_needed";
    if (!pairs.every((pair) => normalizeValue(matches[pair.prompt] ?? ""))) {
      return "unanswered";
    }

    return pairs.every(
      (pair) =>
        normalizeValue(matches[pair.prompt] ?? "") ===
        normalizeValue(pair.correctMatch),
    )
      ? "correct"
      : "incorrect";
  }

  if (item.answerType === "ordering") {
    const order = getStructuredStringArray(responseText, "order");
    const expectedOrder = item.correctOrder?.length
      ? item.correctOrder
      : item.orderingItems ?? [];

    if (!order.length) return "unanswered";
    if (!expectedOrder.length) return "review_needed";

    return sequencesMatch(order, expectedOrder) ? "correct" : "incorrect";
  }

  if (item.answerType === "classification") {
    const classifications = getStructuredStringMap(responseText, "classifications");
    const classificationItems = item.classificationItems ?? [];

    if (!classificationItems.length) return "review_needed";
    if (
      !classificationItems.every((classificationItem) =>
        normalizeValue(classifications[classificationItem.id] ?? ""),
      )
    ) {
      return "unanswered";
    }

    return classificationItems.every(
      (classificationItem) =>
        classifications[classificationItem.id] ===
        classificationItem.correctCategoryId,
    )
      ? "correct"
      : "incorrect";
  }

  if (item.answerType === "select_correct_working") {
    const parsed = parseStructuredResponse(responseText);
    const selectedOptionId = String(parsed?.selectedOptionId ?? "");
    const correctOptionId = getSingleCorrectOptionId(
      item,
      item.correctWorkingOptionId,
    );

    if (!selectedOptionId) return "unanswered";
    if (!correctOptionId) return "review_needed";

    return selectedOptionId === correctOptionId ? "correct" : "incorrect";
  }

  if (item.answerType === "choose_best_explanation") {
    const parsed = parseStructuredResponse(responseText);
    const selectedOptionId = String(parsed?.selectedOptionId ?? "");
    const correctOptionId = getSingleCorrectOptionId(
      item,
      item.bestExplanationOptionId,
    );

    if (!selectedOptionId) return "unanswered";
    if (!correctOptionId) return "review_needed";

    return selectedOptionId === correctOptionId ? "correct" : "incorrect";
  }

  if (item.answerType === "fill_gap") {
    const parsed = parseStructuredResponse(responseText);
    const gapResponse = String(parsed?.gapResponse ?? "");
    const acceptable = [item.gapAnswer, ...(item.gapAcceptableAnswers ?? [])]
      .filter(Boolean)
      .map((value) => normalizeSymbolicValue(String(value)));

    if (!gapResponse.trim()) return "unanswered";
    if (!acceptable.length) return "review_needed";

    return acceptable.includes(normalizeSymbolicValue(gapResponse))
      ? "correct"
      : "incorrect";
  }

  if (item.answerType === "true_false_correction") {
    const parsed = parseStructuredResponse(responseText);
    const booleanAnswer = parsed?.booleanAnswer;
    const correction = String(parsed?.correction ?? "");

    if (typeof booleanAnswer !== "boolean") return "unanswered";
    if (typeof item.correctBoolean !== "boolean") return "review_needed";

    if (item.correctBoolean === true) {
      return booleanAnswer === true ? "correct" : "incorrect";
    }

    if (booleanAnswer !== false) return "incorrect";
    if (!item.correctCorrection) return "correct";
    if (!correction.trim()) return "unanswered";

    return normalizeValue(correction) === normalizeValue(item.correctCorrection)
      ? "correct"
      : "incorrect";
  }

  const acceptable = [
    item.expectedAnswer,
    ...(item.acceptableAnswers ?? []),
  ]
    .filter(Boolean)
    .map((value) =>
      item.answerType === "short_symbolic"
        ? normalizeSymbolicValue(String(value))
        : normalizeValue(String(value)),
    );

  if (!acceptable.length) {
    return "review_needed";
  }

  const comparableResponse =
    item.answerType === "short_symbolic"
      ? normalizeSymbolicValue(responseText)
      : normalizedResponse;

  if (acceptable.includes(comparableResponse)) {
    return "correct";
  }

  return "incorrect";
}

function getPersistedLocalResult(
  item: NumberAssessmentBankItem,
  response: LocalAssessmentResponse,
): LocalAssessmentResult {
  if (!hasEnteredResponse(response)) {
    return "unanswered";
  }

  if (response.submitted) {
    return response.result;
  }

  if (isOpenResponse(item)) {
    return "review_needed";
  }

  return "review_needed";
}

function getSelectedOptionForSave(
  item: NumberAssessmentBankItem,
  responseText: string,
) {
  const normalizedResponse = responseText.trim();

  if (isNotSureResponse(normalizedResponse)) {
    return null;
  }

  if (item.answerType === "multiple_choice" && normalizedResponse) {
    return normalizedResponse;
  }

  if (
    item.answerType === "select_correct_working" ||
    item.answerType === "choose_best_explanation"
  ) {
    const selectedOptionId = String(
      parseStructuredResponse(responseText)?.selectedOptionId ?? "",
    ).trim();

    return selectedOptionId || null;
  }

  if (item.answerType === "true_false_correction") {
    const parsed = parseStructuredResponse(responseText);
    const booleanAnswer = parsed?.booleanAnswer;
    if (typeof booleanAnswer === "boolean") {
      return booleanAnswer ? "true" : "false";
    }
  }

  return null;
}

function getResultMessage(result: LocalAssessmentResult) {
  if (result === "correct") {
    return "This response matches the expected answer.";
  }
  if (result === "incorrect") {
    return "This may be worth revisiting.";
  }
  if (result === "review_needed") {
    return "This response needs adult review.";
  }
  return "Add a response when you are ready.";
}

function getAssessmentResultMessage(
  result: LocalAssessmentResult,
  responseText: string,
) {
  if (isNotSureResponse(responseText)) {
    return "Not sure saved. This counts as a needs-support signal.";
  }
  if (result === "unanswered") {
    return "Choose an answer or Not sure before moving on.";
  }
  return "Answer saved. You will see the result at the end.";
}

function getResultLabel(result: LocalAssessmentResult) {
  if (result === "review_needed") {
    return "Needs adult review";
  }
  if (result === "correct") {
    return "Correct";
  }
  if (result === "incorrect") {
    return "Check again";
  }
  return "Unanswered";
}

function getFormatLabel(format: string) {
  return format.replace(/_/g, " ");
}

function getStageLabel(stageKey: string) {
  if (stageKey === "foundation-kindergarten") return "Foundation / Kindergarten";
  if (stageKey === "lower-primary") return "Lower Primary";
  if (stageKey === "middle-primary") return "Middle Primary";
  if (stageKey === "upper-primary") return "Upper Primary";
  if (stageKey === "lower-secondary") return "Lower Secondary";
  if (stageKey === "years-9-10-consolidation") return "Years 9-10";
  return stageKey.replace(/-/g, " ");
}

type DotSpec = {
  x: number;
  y: number;
  size?: number;
};

type Step1VisualCard = {
  label?: string;
  dots: DotSpec[];
  dotColor?: string;
  frame?: "plain" | "five";
};

type Step1VisualSpec = {
  caption: string;
  cards: Step1VisualCard[];
};

type GeometryShapeKind =
  | "circle"
  | "square"
  | "triangle"
  | "rectangle"
  | "oval"
  | "pentagon"
  | "hexagon"
  | "box"
  | "sphere";

const DOT_POSITIONS = {
  centre: { x: 50, y: 50 },
  left: { x: 34, y: 50 },
  right: { x: 66, y: 50 },
  top: { x: 50, y: 28 },
  bottomLeft: { x: 34, y: 68 },
  bottomRight: { x: 66, y: 68 },
  topLeft: { x: 28, y: 28 },
  topRight: { x: 72, y: 28 },
  bottomLeftCorner: { x: 28, y: 72 },
  bottomRightCorner: { x: 72, y: 72 },
  row1: { x: 28, y: 50 },
  row2: { x: 50, y: 50 },
  row3: { x: 72, y: 50 },
  row4a: { x: 20, y: 50 },
  row4b: { x: 40, y: 50 },
  row4c: { x: 60, y: 50 },
  row4d: { x: 80, y: 50 },
  row5a: { x: 14, y: 50 },
  row5b: { x: 32, y: 50 },
  row5c: { x: 50, y: 50 },
  row5d: { x: 68, y: 50 },
  row5e: { x: 86, y: 50 },
  spread1: { x: 14, y: 22 },
  spread2: { x: 86, y: 24 },
  spread3: { x: 18, y: 76 },
  spread4: { x: 80, y: 72 },
  spread5: { x: 50, y: 50 },
} satisfies Record<string, DotSpec>;

const triangleThree = [
  DOT_POSITIONS.top,
  DOT_POSITIONS.bottomLeft,
  DOT_POSITIONS.bottomRight,
];
const rowThree = [DOT_POSITIONS.row1, DOT_POSITIONS.row2, DOT_POSITIONS.row3];
const rowFour = [
  DOT_POSITIONS.row4a,
  DOT_POSITIONS.row4b,
  DOT_POSITIONS.row4c,
  DOT_POSITIONS.row4d,
];
const rowFive = [
  DOT_POSITIONS.row5a,
  DOT_POSITIONS.row5b,
  DOT_POSITIONS.row5c,
  DOT_POSITIONS.row5d,
  DOT_POSITIONS.row5e,
];
const squareFour = [
  DOT_POSITIONS.topLeft,
  DOT_POSITIONS.topRight,
  DOT_POSITIONS.bottomLeftCorner,
  DOT_POSITIONS.bottomRightCorner,
];
const diceFive = [...squareFour, DOT_POSITIONS.centre];
const spreadFour = [
  DOT_POSITIONS.spread1,
  DOT_POSITIONS.spread2,
  DOT_POSITIONS.spread3,
  DOT_POSITIONS.spread4,
];
const spreadFive = [...spreadFour, DOT_POSITIONS.spread5];

const STEP_1_VISUALS: Record<string, Step1VisualSpec> = {
  "number-step-1-assess-001": {
    caption: "Quick-look card: three dots.",
    cards: [{ dots: triangleThree }],
  },
  "number-step-1-assess-002": {
    caption: "Dice-style card: one dot near each corner.",
    cards: [{ dots: squareFour }],
  },
  "number-step-1-assess-003": {
    caption: "Choose the card with the same amount as three counters.",
    cards: [
      { label: "2 counters", dots: [DOT_POSITIONS.left, DOT_POSITIONS.right] },
      { label: "3 spread out", dots: [DOT_POSITIONS.spread1, DOT_POSITIONS.spread3, DOT_POSITIONS.spread5] },
      { label: "4 counters", dots: rowFour },
    ],
  },
  "number-step-1-assess-004": {
    caption: "Five counters spread far apart.",
    cards: [{ dots: spreadFive }],
  },
  "number-step-1-assess-005": {
    caption: "Quick-look card: two counters.",
    cards: [{ dots: [DOT_POSITIONS.left, DOT_POSITIONS.right] }],
  },
  "number-step-1-assess-006": {
    caption: "Five-frame card: all five spaces are filled.",
    cards: [{ dots: rowFive, frame: "five" }],
  },
  "number-step-1-assess-007": {
    caption: "Card A shows four counters. Find another four.",
    cards: [
      { label: "Card A", dots: squareFour },
      { label: "Line", dots: rowFour },
      { label: "Triangle", dots: triangleThree },
      { label: "Five", dots: diceFive },
    ],
  },
  "number-step-1-assess-008": {
    caption: "Both cards show three counters, even when size changes.",
    cards: [
      { label: "Card A", dots: rowThree.map((dot) => ({ ...dot, size: 22 })) },
      { label: "Card B", dots: rowThree.map((dot) => ({ ...dot, size: 12 })) },
    ],
  },
  "number-step-1-assess-009": {
    caption: "Quick-look card: one dot.",
    cards: [{ dots: [DOT_POSITIONS.centre] }],
  },
  "number-step-1-assess-010": {
    caption: "Dice-style five: four corners and one middle dot.",
    cards: [{ dots: diceFive }],
  },
  "number-step-1-assess-011": {
    caption: "Find the card with the same number as a row of three.",
    cards: [
      { label: "3 in a row", dots: rowThree },
      { label: "3 triangle", dots: triangleThree },
      { label: "2 spread", dots: [DOT_POSITIONS.spread1, DOT_POSITIONS.spread4] },
      { label: "4 close", dots: rowFour },
    ],
  },
  "number-step-1-assess-012": {
    caption: "Both cards show four counters.",
    cards: [
      { label: "Close", dots: squareFour },
      { label: "Spread", dots: spreadFour },
    ],
  },
};

const GEOMETRY_STEP_1_SHAPE_VISUALS: Record<string, GeometryShapeKind[]> = {
  "geometry-spatial-reasoning-step-1-assess-001": ["circle", "square", "triangle"],
  "geometry-spatial-reasoning-step-1-assess-002": ["triangle", "rectangle", "circle"],
  "geometry-spatial-reasoning-step-1-assess-003": ["circle", "rectangle", "sphere"],
  "geometry-spatial-reasoning-step-1-assess-004": ["square", "triangle", "circle"],
  "geometry-spatial-reasoning-step-1-assess-005": ["rectangle", "sphere", "circle"],
  "geometry-spatial-reasoning-step-1-assess-006": ["triangle", "square"],
  "geometry-spatial-reasoning-step-1-assess-007": ["triangle", "circle"],
  "geometry-spatial-reasoning-step-1-assess-008": ["circle", "square"],
  "geometry-spatial-reasoning-step-1-assess-009": ["square", "triangle", "circle"],
  "geometry-spatial-reasoning-step-1-assess-010": ["square", "circle", "oval"],
  "geometry-spatial-reasoning-step-1-assess-011": ["rectangle", "box"],
  "geometry-spatial-reasoning-step-1-assess-012": ["triangle", "circle", "square"],
};

function normalizeShapeName(value: string): GeometryShapeKind | null {
  const normalised = value.trim().toLowerCase();

  if (normalised.includes("circle") || normalised === "plate" || normalised === "coin") {
    return "circle";
  }
  if (normalised.includes("square")) return "square";
  if (normalised.includes("triangle")) return "triangle";
  if (normalised.includes("rectangle") || normalised === "window" || normalised === "book" || normalised === "door") {
    return "rectangle";
  }
  if (normalised.includes("oval")) return "oval";
  if (normalised.includes("pentagon")) return "pentagon";
  if (normalised.includes("hexagon")) return "hexagon";
  if (normalised.includes("box") || normalised.includes("cereal")) return "box";
  if (normalised.includes("sphere") || normalised === "ball") return "sphere";

  return null;
}

function renderGeometryShape(
  shape: GeometryShapeKind,
  label: string,
  selected = false,
) {
  const commonStyle: React.CSSProperties = {
    width: "min(92px, 38vw)",
    height: 76,
    margin: "0 auto",
    display: "block",
  };
  const stroke = selected ? "#1d4ed8" : "#334155";
  const fill = selected ? "#dbeafe" : "#f8fafc";

  if (shape === "triangle") {
    return (
      <svg viewBox="0 0 100 82" role="img" aria-label={label} style={commonStyle}>
        <polygon points="50,8 90,72 10,72" fill={fill} stroke={stroke} strokeWidth="6" />
      </svg>
    );
  }

  if (shape === "rectangle") {
    return (
      <svg viewBox="0 0 100 82" role="img" aria-label={label} style={commonStyle}>
        <rect x="10" y="18" width="80" height="48" rx="4" fill={fill} stroke={stroke} strokeWidth="6" />
      </svg>
    );
  }

  if (shape === "oval") {
    return (
      <svg viewBox="0 0 100 82" role="img" aria-label={label} style={commonStyle}>
        <ellipse cx="50" cy="41" rx="38" ry="24" fill={fill} stroke={stroke} strokeWidth="6" />
      </svg>
    );
  }

  if (shape === "pentagon") {
    return (
      <svg viewBox="0 0 100 82" role="img" aria-label={label} style={commonStyle}>
        <polygon points="50,7 88,34 73,74 27,74 12,34" fill={fill} stroke={stroke} strokeWidth="6" />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg viewBox="0 0 100 82" role="img" aria-label={label} style={commonStyle}>
        <polygon points="30,10 70,10 92,41 70,72 30,72 8,41" fill={fill} stroke={stroke} strokeWidth="6" />
      </svg>
    );
  }

  if (shape === "box") {
    return (
      <svg viewBox="0 0 100 82" role="img" aria-label={label} style={commonStyle}>
        <polygon points="18,28 50,12 82,28 50,44" fill="#e0f2fe" stroke={stroke} strokeWidth="5" />
        <polygon points="18,28 50,44 50,76 18,58" fill={fill} stroke={stroke} strokeWidth="5" />
        <polygon points="82,28 50,44 50,76 82,58" fill="#dbeafe" stroke={stroke} strokeWidth="5" />
      </svg>
    );
  }

  if (shape === "sphere") {
    return (
      <svg viewBox="0 0 100 82" role="img" aria-label={label} style={commonStyle}>
        <defs>
          <radialGradient id={`sphere-${label.replace(/\W+/g, "-")}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor={fill} />
            <stop offset="100%" stopColor="#93c5fd" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="41" r="31" fill={`url(#sphere-${label.replace(/\W+/g, "-")})`} stroke={stroke} strokeWidth="6" />
      </svg>
    );
  }

  if (shape === "square") {
    return (
      <svg viewBox="0 0 100 82" role="img" aria-label={label} style={commonStyle}>
        <rect x="22" y="13" width="56" height="56" rx="4" fill={fill} stroke={stroke} strokeWidth="6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 82" role="img" aria-label={label} style={commonStyle}>
      <circle cx="50" cy="41" r="30" fill={fill} stroke={stroke} strokeWidth="6" />
    </svg>
  );
}

function renderGeometryShapeVisualCard(
  label: string,
  selected = false,
  shapeOverride?: GeometryShapeKind,
) {
  const shape = shapeOverride ?? normalizeShapeName(label);
  if (!shape) return null;

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        justifyItems: "center",
      }}
    >
      {renderGeometryShape(shape, label, selected)}
      <span
        style={{
          color: selected ? "#1d4ed8" : "#475569",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function renderGeometryShapeVisual(item: NumberAssessmentBankItem) {
  const shapes = GEOMETRY_STEP_1_SHAPE_VISUALS[item.id];
  if (!shapes) return null;

  return (
    <div
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 18,
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 800 }}>
        Shape cards
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        {shapes.map((shape) => (
          <div
            key={`${item.id}-${shape}`}
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 16,
              background: "#ffffff",
              padding: 10,
              minHeight: 112,
              display: "grid",
              placeItems: "center",
            }}
          >
            {renderGeometryShape(shape, shape)}
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatisticsStep1VisualLabels(id: string) {
  if (!id.startsWith("statistics-data-step-1-")) return null;

  const suffix = id.slice(-3);
  const cardsBySuffix: Record<string, string[]> = {
    "001": ["apple", "banana", "ball", "sock"],
    "002": ["blue car", "red cup", "green leaf"],
    "003": ["circle button", "square tile", "triangle flag"],
    "004": ["dog", "bird", "cat", "chair", "spoon"],
    "005": ["pear", "orange", "truck"],
    "006": ["red ball", "red hat", "blue book"],
    "007": ["big button", "small button"],
    "008": ["snacks", "things with wheels", "things that fly"],
    "009": ["red blocks", "blue blocks"],
    "010": ["shells", "stones"],
    "011": ["toy cars", "toy trains"],
    "012": ["leaves", "flowers"],
  };

  return cardsBySuffix[suffix] ?? null;
}

function getObjectColour(label: string) {
  const normalised = label.toLowerCase();
  if (normalised.includes("blue")) return "#2563eb";
  if (normalised.includes("red")) return "#dc2626";
  if (normalised.includes("green") || normalised.includes("leaf")) return "#16a34a";
  if (normalised.includes("orange")) return "#f97316";
  if (normalised.includes("banana") || normalised.includes("yellow")) return "#facc15";
  if (normalised.includes("pear")) return "#84cc16";
  return "#64748b";
}

function renderStatisticsObjectIcon(label: string, selected = false) {
  const normalised = label.toLowerCase();
  const colour = getObjectColour(label);
  const stroke = selected ? "#1d4ed8" : "#334155";
  const commonStyle: React.CSSProperties = {
    width: 48,
    height: 34,
    display: "block",
    margin: "0 auto",
  };

  if (normalised.includes("car") || normalised.includes("truck") || normalised.includes("wheels")) {
    const isTruck = normalised.includes("truck");
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        <rect x="16" y={isTruck ? 30 : 36} width={isTruck ? 78 : 86} height="24" rx="7" fill={colour} stroke={stroke} strokeWidth="4" />
        <rect x={isTruck ? 62 : 34} y={isTruck ? 18 : 24} width={isTruck ? 32 : 42} height="20" rx="5" fill="#dbeafe" stroke={stroke} strokeWidth="4" />
        <circle cx="35" cy="60" r="8" fill="#0f172a" />
        <circle cx="84" cy="60" r="8" fill="#0f172a" />
      </svg>
    );
  }

  if (normalised.includes("cup") || normalised.includes("bowl") || normalised.includes("spoon")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        <path d="M30 26 H76 L70 62 H38 Z" fill={colour} stroke={stroke} strokeWidth="4" />
        <path d="M76 32 H92 C98 32 98 48 90 50 H73" fill="none" stroke={stroke} strokeWidth="4" />
        <path d="M88 18 C102 28 102 48 88 62" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalised.includes("leaf") || normalised.includes("leaves") || normalised.includes("flower") || normalised.includes("tree")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        <path d="M60 62 C22 42 34 14 72 18 C94 36 82 64 60 62 Z" fill={normalised.includes("flower") ? "#f9a8d4" : "#22c55e"} stroke={stroke} strokeWidth="4" />
        <path d="M36 54 C54 44 70 34 88 20" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        {normalised.includes("flower") ? <circle cx="60" cy="40" r="9" fill="#facc15" stroke={stroke} strokeWidth="3" /> : null}
      </svg>
    );
  }

  if (normalised.includes("apple") || normalised.includes("pear") || normalised.includes("orange") || normalised.includes("banana") || normalised.includes("fruit") || normalised.includes("snack") || normalised.includes("sandwich")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        {normalised.includes("banana") ? (
          <path d="M28 48 C48 68 88 66 100 34 C82 50 54 54 34 34" fill="#facc15" stroke={stroke} strokeWidth="4" />
        ) : normalised.includes("sandwich") ? (
          <path d="M24 56 L60 18 L96 56 Z" fill="#fde68a" stroke={stroke} strokeWidth="4" />
        ) : (
          <>
            <circle cx="60" cy="44" r={normalised.includes("pear") ? 25 : 24} fill={colour === "#64748b" ? "#ef4444" : colour} stroke={stroke} strokeWidth="4" />
            <path d="M58 22 C62 14 70 12 78 16" fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
          </>
        )}
      </svg>
    );
  }

  if (normalised.includes("ball") || normalised.includes("toy")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        <circle cx="60" cy="42" r="28" fill={colour === "#64748b" ? "#f97316" : colour} stroke={stroke} strokeWidth="4" />
        <path d="M34 42 H86 M60 14 C48 30 48 54 60 70 M60 14 C72 30 72 54 60 70" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalised.includes("book") || normalised.includes("clothing") || normalised.includes("sock")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        {normalised.includes("sock") || normalised.includes("clothing") ? (
          <path d="M42 16 H68 V48 C74 48 86 52 86 62 C86 70 76 72 66 68 L42 58 Z" fill={colour === "#64748b" ? "#a78bfa" : colour} stroke={stroke} strokeWidth="4" />
        ) : (
          <rect x="32" y="18" width="56" height="48" rx="6" fill={colour} stroke={stroke} strokeWidth="4" />
        )}
      </svg>
    );
  }

  if (normalised.includes("cat") || normalised.includes("dog") || normalised.includes("bird") || normalised.includes("animal")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        <circle cx="60" cy="42" r="25" fill="#fde68a" stroke={stroke} strokeWidth="4" />
        {normalised.includes("bird") ? (
          <path d="M44 42 C58 20 82 26 86 48 C70 42 56 44 44 42 Z" fill="#60a5fa" stroke={stroke} strokeWidth="4" />
        ) : (
          <>
            <path d="M40 24 L48 8 L56 26 M64 26 L76 8 L80 30" fill="#fde68a" stroke={stroke} strokeWidth="4" strokeLinejoin="round" />
            <circle cx="51" cy="40" r="3" fill="#0f172a" />
            <circle cx="69" cy="40" r="3" fill="#0f172a" />
          </>
        )}
      </svg>
    );
  }

  if (normalised.includes("button") || normalised.includes("circle")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        <circle cx="60" cy="42" r={normalised.includes("big") ? 30 : 22} fill={colour === "#64748b" ? "#e2e8f0" : colour} stroke={stroke} strokeWidth="4" />
        <circle cx="52" cy="38" r="4" fill="#ffffff" />
        <circle cx="68" cy="38" r="4" fill="#ffffff" />
        <circle cx="52" cy="52" r="4" fill="#ffffff" />
        <circle cx="68" cy="52" r="4" fill="#ffffff" />
      </svg>
    );
  }

  if (normalised.includes("tile") || normalised.includes("square") || normalised.includes("block")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        <rect x="34" y="18" width="52" height="52" rx="7" fill={colour === "#64748b" ? "#e0f2fe" : colour} stroke={stroke} strokeWidth="4" />
      </svg>
    );
  }

  if (normalised.includes("flag") || normalised.includes("triangle") || normalised.includes("things that fly")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        <path d="M36 12 V70" stroke={stroke} strokeWidth="5" strokeLinecap="round" />
        <path d="M38 14 L92 32 L38 50 Z" fill={colour === "#64748b" ? "#facc15" : colour} stroke={stroke} strokeWidth="4" />
      </svg>
    );
  }

  if (normalised.includes("shell") || normalised.includes("stone")) {
    return (
      <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
        <ellipse cx="60" cy="46" rx="34" ry="22" fill={normalised.includes("shell") ? "#fed7aa" : "#cbd5e1"} stroke={stroke} strokeWidth="4" />
        <path d="M36 46 H84 M46 32 V62 M60 28 V66 M74 34 V60" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 80" role="img" aria-label={label} style={commonStyle}>
      <rect x="22" y="18" width="76" height="46" rx="12" fill="#f8fafc" stroke={stroke} strokeWidth="4" />
      <circle cx="46" cy="41" r="10" fill="#2563eb" />
      <circle cx="74" cy="41" r="10" fill="#22c55e" />
    </svg>
  );
}

function renderStatisticsSortingVisualCard(label: string, selected = false) {
  return (
    <div style={{ display: "grid", gap: 3, justifyItems: "center" }}>
      {renderStatisticsObjectIcon(label, selected)}
      <span
        style={{
          color: selected ? "#1d4ed8" : "#475569",
          fontSize: 10,
          fontWeight: 800,
          lineHeight: 1.2,
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function renderStatisticsSortingVisual(item: NumberAssessmentBankItem) {
  const labels = getStatisticsStep1VisualLabels(item.id);
  if (!labels) return null;

  return (
    <div
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 12,
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        padding: 8,
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ color: "#1e3a8a", fontSize: 12, fontWeight: 800 }}>
        Sorting cards
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
          gap: 5,
        }}
      >
        {labels.map((label) => (
          <div
            key={`${item.id}-${label}`}
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 10,
              background: "#ffffff",
              padding: 4,
              minHeight: 62,
              maxWidth: 96,
              width: "100%",
              justifySelf: "center",
              display: "grid",
              placeItems: "center",
            }}
          >
            {renderStatisticsSortingVisualCard(label)}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderStep1Visual(itemId: string) {
  const visual = STEP_1_VISUALS[itemId];
  if (!visual) return null;

  return (
    <div
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 18,
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 800 }}>
        {visual.caption}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        {visual.cards.map((card, cardIndex) => (
          <div
            key={`${itemId}-${cardIndex}`}
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 16,
              background: "#ffffff",
              padding: 10,
              display: "grid",
              gap: 8,
            }}
          >
            {card.label ? (
              <div
                style={{
                  color: "#475569",
                  fontSize: 12,
                  fontWeight: 800,
                  textAlign: "center",
                }}
              >
                {card.label}
              </div>
            ) : null}
            <div
              style={{
                position: "relative",
                height: card.frame === "five" ? 74 : 96,
                border: card.frame === "five" ? "2px solid #94a3b8" : "1px solid #e2e8f0",
                borderRadius: card.frame === "five" ? 12 : 14,
                background: "#f8fafc",
                overflow: "hidden",
              }}
            >
              {card.frame === "five"
                ? [20, 40, 60, 80].map((left) => (
                    <span
                      key={left}
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: `${left}%`,
                        top: 0,
                        bottom: 0,
                        borderLeft: "1px solid #cbd5e1",
                      }}
                    />
                  ))
                : null}
              {card.dots.map((dot, dotIndex) => {
                const size = dot.size ?? 18;
                return (
                  <span
                    key={`${dot.x}-${dot.y}-${dotIndex}`}
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: `${dot.x}%`,
                      top: `${dot.y}%`,
                      width: size,
                      height: size,
                      borderRadius: 999,
                      background: card.dotColor ?? "#2563eb",
                      border: "2px solid #1e40af",
                      transform: "translate(-50%, -50%)",
                      boxShadow: "0 5px 12px rgba(37,99,235,0.22)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function dotsForCount(count: number): DotSpec[] {
  if (count <= 0) return [];
  if (count === 1) return [DOT_POSITIONS.centre];
  if (count === 2) return [DOT_POSITIONS.left, DOT_POSITIONS.right];
  if (count === 3) return triangleThree;
  if (count === 4) return squareFour;
  if (count === 5) return diceFive;

  const columns: number = count > 10 ? 5 : count > 6 ? 4 : 3;
  const rows = Math.ceil(count / columns);
  return Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: columns === 1 ? 50 : 18 + (64 / Math.max(1, columns - 1)) * column,
      y: rows === 1 ? 50 : 24 + (52 / Math.max(1, rows - 1)) * row,
      size: count > 12 ? 11 : count > 8 ? 13 : 16,
    };
  });
}

function parseEarlyNumberVisual(description: string | undefined) {
  const raw = String(description || "");
  if (!raw.startsWith("early-number|")) return null;

  const parts = Object.fromEntries(
    raw
      .split("|")
      .slice(1)
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, rest.join("=")];
      }),
  );
  const labels = String(parts.labels || "")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
  const groupCounts = String(parts.groups || "")
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry) && entry >= 0);
  const numberCards = String(parts.numbers || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    caption: String(parts.caption || "Use the visual card."),
    labels,
    groupCounts,
    numberCards,
  };
}

function renderEarlyNumberVisual(item: NumberAssessmentBankItem) {
  const geometryVisual = renderGeometryShapeVisual(item);
  if (geometryVisual) return geometryVisual;

  const statisticsVisual = renderStatisticsSortingVisual(item);
  if (statisticsVisual) return statisticsVisual;

  const step1Visual = renderStep1Visual(item.id);
  if (step1Visual) return step1Visual;

  const visual = parseEarlyNumberVisual(item.visualSupport?.description);
  if (!visual) return null;

  if (isStep2NumberWordActivity(item.id, item.progressionStepKey)) {
    const step2Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep2WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step2Visual,
    });
  }

  if (isStep3NumeralActivity(item.id, item.progressionStepKey)) {
    const step3Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep3WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step3Visual,
    });
  }

  if (
    isStep4CountingObjectsActivity(item.id, item.progressionStepKey) ||
    isStep5CountingObjectsActivity(item.id, item.progressionStepKey)
  ) {
    const step4Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep4WorksheetPromptVisual({
      visual: step4Visual,
    });
  }

  if (isStep6CompareGroupsActivity(item.id, item.progressionStepKey)) {
    const step6Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep6WorksheetPromptVisual({
      visual: step6Visual,
    });
  }

  if (isStep7OrderNumbersActivity(item.id, item.progressionStepKey)) {
    const step7Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep7WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step7Visual,
    });
  }

  if (isStep8PartWholeActivity(item.id, item.progressionStepKey)) {
    const step8Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep8WorksheetPromptVisual({
      visual: step8Visual,
    });
  }

  if (isStep9ObjectStoryActivity(item.id, item.progressionStepKey)) {
    const step9Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep9WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step9Visual,
    });
  }

  if (isStep10EqualSharingActivity(item.id, item.progressionStepKey)) {
    const step10Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep10WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step10Visual,
    });
  }

  if (isStep11CountingSequenceActivity(item.id, item.progressionStepKey)) {
    const step11Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep11WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step11Visual,
    });
  }

  if (isStep12ReadWriteOrderActivity(item.id, item.progressionStepKey)) {
    const step12Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep12WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step12Visual,
    });
  }

  if (isStep13SkipCountingActivity(item.id, item.progressionStepKey)) {
    const step13Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep13WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step13Visual,
    });
  }

  if (isStep16RenameTwoDigitActivity(item.id, item.progressionStepKey)) {
    const step16Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep16WorksheetPromptVisual({
      visual: step16Visual,
    });
  }

  if (isStep17AddSubtractWithin20Activity(item.id, item.progressionStepKey)) {
    const step17Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep17WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step17Visual,
    });
  }

  if (isStep18SupportedAddSubtractActivity(item.id, item.progressionStepKey)) {
    const step18Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep18WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step18Visual,
    });
  }

  if (isStep19EqualGroupsArraysActivity(item.id, item.progressionStepKey)) {
    const step19Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep19WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step19Visual,
    });
  }

  if (isStep20HalvesQuartersSharingActivity(item.id, item.progressionStepKey)) {
    const step20Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep20WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step20Visual,
    });
  }

  if (isStep21LargeNumberCompareActivity(item.id, item.progressionStepKey)) {
    const step21Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep21WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step21Visual,
    });
  }

  if (isStep22HundredsTensOnesActivity(item.id, item.progressionStepKey)) {
    const step22Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep22WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step22Visual,
    });
  }

  if (isStep23PartitionRegroupActivity(item.id, item.progressionStepKey)) {
    const step23Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep23WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step23Visual,
    });
  }

  if (isStep24ZeroPlaceholderActivity(item.id, item.progressionStepKey)) {
    const step24Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep24WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step24Visual,
    });
  }

  if (isStep25PlaceValueAddSubtractActivity(item.id, item.progressionStepKey)) {
    const step25Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep25WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step25Visual,
    });
  }

  if (isStep26MultiplicationFactsActivity(item.id, item.progressionStepKey)) {
    const step26Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep26WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step26Visual,
    });
  }

  if (isStep27ArraysGroupingKnownFactsActivity(item.id, item.progressionStepKey)) {
    const step27Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep27WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step27Visual,
    });
  }

  if (isStep28EstimateReasonablenessActivity(item.id, item.progressionStepKey)) {
    const step28Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep28WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step28Visual,
    });
  }

  if (isStep29UnitSimpleFractionsActivity(item.id, item.progressionStepKey)) {
    const step29Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep29WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step29Visual,
    });
  }

  if (isStep30PracticalMoneyActivity(item.id, item.progressionStepKey)) {
    const step30Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep30WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step30Visual,
    });
  }

  if (isStep31ExtendedPlaceValueActivity(item.id, item.progressionStepKey)) {
    const step31Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep31WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step31Visual,
    });
  }

  if (isStep32RoundEstimateLargerNumbersActivity(item.id, item.progressionStepKey)) {
    const step32Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep32WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step32Visual,
    });
  }

  if (isStep33DecimalPlaceValueActivity(item.id, item.progressionStepKey)) {
    const step33Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep33WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step33Visual,
    });
  }

  if (isStep34CompareOrderDecimalsActivity(item.id, item.progressionStepKey)) {
    const step34Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep34WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step34Visual,
    });
  }

  if (isStep35EquivalentFractionsActivity(item.id, item.progressionStepKey)) {
    const step35Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep35WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step35Visual,
    });
  }

  if (isStep36FractionAddSubtractActivity(item.id, item.progressionStepKey)) {
    const step36Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep36WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step36Visual,
    });
  }

  if (isStep37EfficientStrategiesActivity(item.id, item.progressionStepKey)) {
    const step37Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep37WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step37Visual,
    });
  }

  if (isStep38RemaindersContextActivity(item.id, item.progressionStepKey)) {
    const step38Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep38WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step38Visual,
    });
  }

  if (isStep39FractionDecimalPercentActivity(item.id, item.progressionStepKey)) {
    const step39Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep39WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step39Visual,
    });
  }

  if (isStep40FinancialModellingActivity(item.id, item.progressionStepKey)) {
    const step40Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep40WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step40Visual,
    });
  }

  if (isStep41FlexibleNumberFormsActivity(item.id, item.progressionStepKey)) {
    const step41Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep41WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step41Visual,
    });
  }

  if (isStep42NegativeNumberLineActivity(item.id, item.progressionStepKey)) {
    const step42Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep42WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step42Visual,
    });
  }

  if (isStep44PowersRootsActivity(item.id, item.progressionStepKey)) {
    const step44Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep44WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step44Visual,
    });
  }

  if (isStep45RatioRatesActivity(item.id, item.progressionStepKey)) {
    const step45Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep45WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step45Visual,
    });
  }

  if (isStep46ProportionalReasoningActivity(item.id, item.progressionStepKey)) {
    const step46Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep46WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step46Visual,
    });
  }

  if (isStep48EstimationBoundsActivity(item.id, item.progressionStepKey)) {
    const step48Visual =
      parseEarlyNumberVisualDescription(item.visualSupport?.description) ?? visual;
    return renderStep48WorksheetPromptVisual({
      prompt: item.prompt,
      visual: step48Visual,
    });
  }

  const cards: Step1VisualCard[] = visual.groupCounts.map((count, index) => ({
    label: visual.labels[index] || `${count}`,
    dots: dotsForCount(count),
    frame: count <= 10 && count > 5 ? "five" : "plain",
  }));

  return (
    <div
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 18,
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 800 }}>
        {visual.caption}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 10,
        }}
      >
        {visual.numberCards.length
          ? visual.numberCards.map((numberCard) => (
              <div
                key={numberCard}
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 16,
                  background: "#ffffff",
                  minHeight: 94,
                  display: "grid",
                  placeItems: "center",
                  color: "#1d4ed8",
                  fontSize: 42,
                  fontWeight: 900,
                }}
              >
                {numberCard}
              </div>
            ))
          : cards.map((card, cardIndex) => (
              <div
                key={`${item.id}-${cardIndex}`}
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 16,
                  background: "#ffffff",
                  padding: 10,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 96,
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    background: "#f8fafc",
                    overflow: "hidden",
                  }}
                >
                  {card.dots.map((dot, dotIndex) => {
                    const size = dot.size ?? 16;
                    return (
                      <span
                        key={`${dot.x}-${dot.y}-${dotIndex}`}
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: `${dot.x}%`,
                          top: `${dot.y}%`,
                          width: size,
                          height: size,
                          borderRadius: 999,
                          background: "#2563eb",
                          border: "2px solid #1e40af",
                          transform: "translate(-50%, -50%)",
                          boxShadow: "0 5px 12px rgba(37,99,235,0.22)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

const FOCUS_LABELS: Record<string, string> = {
  "round-decimals-to-a-required-accuracy": "Rounding decimals",
  "estimate-sums-and-products-using-rounding": "Estimating with rounding",
  "compare-exact-and-estimated-results": "Comparing estimates with exact values",
  "truncate-and-round-values": "Truncating and rounding",
  "analyse-approximation-error-in-contexts": "Approximation error in context",
  "recognise-repeated-approximation-effects": "Repeated approximation effects",
  "recognise-irrational-numbers-including-square-roots-and-pi":
    "Recognising irrational numbers",
  "classify-numbers-as-rational-or-irrational": "Classifying real numbers",
  "identify-statements-about-irrational-numbers":
    "Reasoning about irrational numbers",
  "place-rational-and-irrational-numbers-on-a-number-line":
    "Placing real numbers on a number line",
  "solve-applied-problems-involving-exact-real-number-values":
    "Exact real-number reasoning",
  "connect-perfect-squares-and-square-roots":
    "Connecting squares and square roots",
  "estimate-non-perfect-square-roots": "Estimating non-perfect square roots",
  "represent-natural-numbers-as-products-of-powers":
    "Prime powers and factorisation",
  "use-powers-of-ten-in-expanded-notation": "Powers of 10 and place value",
  "apply-exponent-notation": "Exponent notation",
  "apply-exponent-laws-with-positive-integer-exponents": "Exponent laws",
  "write-fractional-powers-in-surd-form": "Fractional powers and surds",
  "evaluate-fractional-powers": "Evaluating fractional powers",
  "simplify-surds": "Simplifying surds",
  "multiply-surds": "Multiplying surds",
  "add-and-subtract-like-surds": "Combining like surds",
  "simplify-expressions-containing-multiple-surds":
    "Multi-step surd simplification",
  "rationalise-denominators": "Rationalising denominators",
};

function getFocusLabel(item: NumberAssessmentBankItem) {
  return FOCUS_LABELS[item.progressionStepKey] || "Number reasoning";
}

function getAnswerModeLabel(item: NumberAssessmentBankItem) {
  if (item.answerType === "multiple_choice") return "Choose one";
  if (item.answerType === "multi_select") return "Choose all that apply";
  if (item.answerType === "numeric") return "Number answer";
  if (item.answerType === "short_symbolic") return "Symbolic answer";
  if (item.answerType === "short_answer") return "Short response";
  if (item.answerType === "matching") return "Match each row";
  if (item.answerType === "ordering") return "Put in order";
  if (item.answerType === "classification") return "Classify each item";
  if (item.answerType === "select_correct_working") return "Choose working";
  if (item.answerType === "choose_best_explanation") return "Choose explanation";
  if (item.answerType === "fill_gap") return "Fill the gap";
  if (item.answerType === "true_false_correction") return "True/false";
  if (item.answerType === "worked_response") return "Worked response";
  return "Explain or justify";
}

const MISCONCEPTION_LABELS: Record<string, string> = {
  "rounding-place-value-error": "Rounding and decimal place value",
  "truncation-vs-rounding-confusion": "Truncation compared with rounding",
  "decimal-operation-error": "Decimal operation error",
  "estimated-exact-confusion": "Estimated versus exact values",
  "unit-conversion-error": "Units and measurement conversion",
  "percentage-or-rate-context-error": "Percentages, rates or financial contexts",
  "rounding-too-early": "Rounding too early",
  "reasonableness-not-checked": "Checking whether an answer is reasonable",
  "rational-irrational-classification-error":
    "Classifying rational and irrational numbers",
  "square-root-estimation-error": "Estimating square roots",
  "pi-as-rational-error": "Understanding pi as irrational",
  "exact-vs-decimal-form-confusion":
    "Exact form compared with decimal approximation",
  "number-line-placement-error": "Placing real numbers on a number line",
  "area-formula-exact-form-error": "Exact area forms with pi or square roots",
  "surd-simplification-readiness-gap": "Simplifying square-root forms",
  "recurring-decimal-rational-confusion":
    "Recurring decimals as rational numbers",
  "approximation-treated-as-exact": "Approximation treated as exact",
  "real-number-comparison-error": "Comparing rational and irrational values",
  "square-root-perfect-square-confusion":
    "Perfect squares and square roots",
  "exponent-notation-confusion": "Exponent notation",
  "repeated-multiplication-confusion": "Repeated multiplication structure",
  "powers-of-ten-place-value-error": "Powers of 10 and place value",
  "prime-factorisation-exponent-error": "Prime factorisation with powers",
  "exponent-law-multiplication-error":
    "Multiplying powers with the same base",
  "exponent-law-division-error": "Dividing powers with the same base",
  "zero-exponent-confusion": "Zero exponent meaning",
  "base-vs-exponent-confusion": "Base compared with exponent",
  "fractional-index-to-surd-confusion": "Fractional powers and surd notation",
  "fractional-power-evaluation-error": "Evaluating fractional powers",
  "non-perfect-square-factor-error": "Finding square factors in surds",
  "surd-simplification-factor-error": "Simplifying surds",
  "like-surd-combination-error": "Combining like surds",
  "unlike-surd-combination-error": "Distinguishing unlike surds",
  "surd-multiplication-error": "Multiplying surds",
  "rationalising-denominator-error": "Rationalising denominators",
  "exact-form-vs-decimal-error":
    "Exact form compared with decimal approximations",
  "coefficient-surd-distribution-error":
    "Working with coefficients in surd expressions",
};

const FOCUS_AREAS_BY_MISCONCEPTION: Record<string, string> = {
  "rounding-place-value-error":
    "Focus on reading decimal places carefully before rounding.",
  "truncation-vs-rounding-confusion":
    "Focus on comparing truncation with rounding on the same decimal values.",
  "decimal-operation-error":
    "Practise using sensible decimal operations after values have been rounded.",
  "estimated-exact-confusion":
    "Review when an estimate should be close to the exact answer and when the difference matters.",
  "unit-conversion-error":
    "Revisit units and measurement language when comparing approximate values.",
  "percentage-or-rate-context-error":
    "Practise choosing reasonable approximations in money, percentage, or rate contexts.",
  "rounding-too-early":
    "Practise when to round in a calculation so early rounding does not change the final result.",
  "reasonableness-not-checked":
    "Practise checking whether an answer is reasonable for the context.",
  "rational-irrational-classification-error":
    "Revisit how fractions, terminating decimals, recurring decimals, pi, and square roots are classified.",
  "square-root-estimation-error":
    "Practise bracketing square roots between nearby perfect squares before estimating.",
  "pi-as-rational-error":
    "Review why pi is irrational even when it is often written as a decimal approximation.",
  "exact-vs-decimal-form-confusion":
    "Compare when an exact form should be kept and when a decimal approximation is appropriate.",
  "number-line-placement-error":
    "Practise placing real numbers by comparing them with nearby benchmark values on a number line.",
  "area-formula-exact-form-error":
    "Revisit how exact area expressions keep pi or square-root forms without rounding too early.",
  "surd-simplification-readiness-gap":
    "Build confidence rewriting square-root forms before using them in exact calculations.",
  "recurring-decimal-rational-confusion":
    "Review why recurring decimals are rational and can be written as fractions.",
  "approximation-treated-as-exact":
    "Practise distinguishing an exact value from a convenient decimal approximation.",
  "real-number-comparison-error":
    "Practise comparing rational and irrational values using equivalent forms and benchmarks.",
  "square-root-perfect-square-confusion":
    "Practise moving both ways between perfect squares and their square roots.",
  "exponent-notation-confusion":
    "Review how exponent notation records a repeated factor in a compact form.",
  "repeated-multiplication-confusion":
    "Practise identifying the repeated factor and the number of times it appears.",
  "powers-of-ten-place-value-error":
    "Revisit how powers of 10 connect directly to place value.",
  "prime-factorisation-exponent-error":
    "Practise collecting repeated prime factors into powers carefully.",
  "exponent-law-multiplication-error":
    "Review why exponents add when multiplying powers with the same base.",
  "exponent-law-division-error":
    "Review why exponents subtract when dividing powers with the same base.",
  "zero-exponent-confusion":
    "Practise explaining zero exponents through patterns and quotient reasoning.",
  "base-vs-exponent-confusion":
    "Focus on what the base tells us and what the exponent tells us.",
  "fractional-index-to-surd-confusion":
    "Revisit how common fractional indices translate into roots and surd notation.",
  "fractional-power-evaluation-error":
    "Practise reading the denominator as the root and the numerator as the power.",
  "non-perfect-square-factor-error":
    "Practise finding the largest perfect-square factor inside a surd before simplifying.",
  "surd-simplification-factor-error":
    "Review how to factor a surd so the result stays in simplest exact form.",
  "like-surd-combination-error":
    "Practise combining surds only when the radical parts match after simplification.",
  "unlike-surd-combination-error":
    "Review why unlike surds cannot be merged into a single like-surd term.",
  "surd-multiplication-error":
    "Practise multiplying surds first and then simplifying the resulting exact form.",
  "rationalising-denominator-error":
    "Revisit how equivalent fractions remove surds from denominators while keeping the value unchanged.",
  "exact-form-vs-decimal-error":
    "Practise delaying rounding so exact surd forms stay precise for later work.",
  "coefficient-surd-distribution-error":
    "Review how coefficients interact with simplified surd terms in multi-step expressions.",
};

function getMisconceptionLabel(code: string) {
  return MISCONCEPTION_LABELS[code] || "Possible learning focus";
}

function getFocusAreaFromMisconception(code: string) {
  return (
    FOCUS_AREAS_BY_MISCONCEPTION[code] ||
    "Review the main idea behind this response pattern before moving forward."
  );
}

function hasAnyCode(topCodes: string[], targetCodes: string[]) {
  return targetCodes.some((code) => topCodes.includes(code));
}

function getParentJudgementLabel(value: ParentJudgement) {
  if (value === "secure") return "Secure";
  if (value === "developing") return "Developing";
  if (value === "needs_support") return "Needs support";
  return "Not enough evidence yet";
}

function getParentJudgementTone(
  value: ParentJudgement,
  selected: boolean,
): React.CSSProperties {
  const tone = parentJudgementToneMeta[value];

  return {
    ...secondaryButtonStyle,
    border: `1px solid ${tone.border}`,
    background: selected ? tone.background : "#ffffff",
    color: tone.color,
    boxShadow: selected ? "0 8px 18px rgba(15,23,42,0.06)" : "none",
  };
}

function getLearnerLabel(learner: Learner | null) {
  if (!learner) return "";
  return learner.preferredName || learner.firstName;
}

function buildOpenResponseReviewSnapshot(item: NumberAssessmentBankItem) {
  if (!item.openResponseReview) {
    return null;
  }

  return {
    expectedResponse: item.openResponseReview.expectedResponse,
    successCriteria: item.openResponseReview.successCriteria,
    parentReviewPrompts: item.openResponseReview.parentReviewPrompts,
    evidenceNote: item.openResponseReview.evidenceNote ?? null,
  };
}

function buildItemSnapshot(
  item: NumberAssessmentBankItem,
): CleanAssessmentAttemptSnapshot {
  return {
    title: item.title,
    prompt: item.prompt,
    subElementKey: item.subElementKey,
    subElementTitle: item.subElementTitle,
    subElementDescription: item.subElementDescription ?? null,
    answerType: item.answerType,
    format: item.format,
    options: item.options ?? [],
    structuredOptions: item.structuredOptions ?? [],
    correctOptionIds: item.correctOptionIds ?? [],
    matchingPairs: item.matchingPairs ?? [],
    orderingItems: item.orderingItems ?? [],
    correctOrder: item.correctOrder ?? [],
    classificationCategories: item.classificationCategories ?? [],
    classificationItems: item.classificationItems ?? [],
    gapText: item.gapText ?? null,
    gapAnswer: item.gapAnswer ?? null,
    gapAcceptableAnswers: item.gapAcceptableAnswers ?? [],
    trueFalseStatement: item.trueFalseStatement ?? null,
    correctBoolean: item.correctBoolean ?? null,
    correctionOptions: item.correctionOptions ?? [],
    correctCorrection: item.correctCorrection ?? null,
    correctWorkingOptionId: item.correctWorkingOptionId ?? null,
    bestExplanationOptionId: item.bestExplanationOptionId ?? null,
    expectedAnswer: item.expectedAnswer ?? null,
    acceptableAnswers: item.acceptableAnswers ?? [],
    workedSolution: item.workedSolution ?? null,
    markingGuide: item.markingGuide ?? null,
    misconceptionTargets: item.misconceptionTargets,
    adaptiveRoute: item.adaptiveRoute,
    openResponseReview: buildOpenResponseReviewSnapshot(item),
    visualSupport: item.visualSupport ?? null,
  };
}

function getSubElementMasteryJudgement(
  correctCount: number,
  totalCount: number,
): SubElementMasteryJudgement {
  if (totalCount <= 0 || correctCount <= 0) return "Needs support";

  const secureThreshold = totalCount;
  const consolidatingThreshold = Math.max(1, totalCount - 1);
  const developingThreshold = Math.max(1, totalCount - 2);

  if (correctCount >= secureThreshold) return "Secure";
  if (correctCount >= consolidatingThreshold) return "Consolidating";
  if (correctCount >= developingThreshold) return "Developing";
  return "Needs support";
}

function getSubElementMasteryPriority(judgement: SubElementMasteryJudgement) {
  if (judgement === "Needs support") return 0;
  if (judgement === "Developing") return 1;
  if (judgement === "Consolidating") return 2;
  return 3;
}

function buildSubElementMastery(
  itemResponses: Array<{
    item: NumberAssessmentBankItem;
    response: LocalAssessmentResponse;
    persistedResult: LocalAssessmentResult;
  }>,
): LocalSubElementMastery[] {
  const groups = new Map<
    string,
    {
      subElementKey: string;
      subElementTitle: string;
      subElementDescription?: string;
      rows: Array<{
        item: NumberAssessmentBankItem;
        response: LocalAssessmentResponse;
        persistedResult: LocalAssessmentResult;
      }>;
    }
  >();

  itemResponses.forEach((row) => {
    const existing = groups.get(row.item.subElementKey);

    if (existing) {
      existing.rows.push(row);
      return;
    }

    groups.set(row.item.subElementKey, {
      subElementKey: row.item.subElementKey,
      subElementTitle: row.item.subElementTitle,
      subElementDescription: row.item.subElementDescription,
      rows: [row],
    });
  });

  return Array.from(groups.values()).map((group) => {
    const totalCount = group.rows.length;
    const attemptedCount = group.rows.filter(({ response }) =>
      hasEnteredResponse(response),
    ).length;
    const correctCount = group.rows.filter(
      ({ persistedResult }) => persistedResult === "correct",
    ).length;
    const incorrectCount = group.rows.filter(
      ({ persistedResult }) => persistedResult === "incorrect",
    ).length;
    const reviewNeededCount = group.rows.filter(
      ({ persistedResult }) => persistedResult === "review_needed",
    ).length;
    const unansweredCount = group.rows.filter(
      ({ persistedResult }) => persistedResult === "unanswered",
    ).length;
    const judgement = getSubElementMasteryJudgement(correctCount, totalCount);
    const reviewNote = reviewNeededCount
      ? " Judgement may need review because one or more responses need adult review."
      : "";
    const unansweredNote = unansweredCount
      ? " Complete unanswered items to strengthen this judgement."
      : "";

    return {
      subElementKey: group.subElementKey,
      subElementTitle: group.subElementTitle,
      subElementDescription: group.subElementDescription,
      totalCount,
      attemptedCount,
      correctCount,
      incorrectCount,
      reviewNeededCount,
      unansweredCount,
      judgement,
      suggestedPracticeFocus: `${group.subElementTitle}: ${judgement}.${reviewNote}${unansweredNote}`,
    };
  });
}

function getTargetedPracticeMessage(
  recommendation: LocalSubElementMastery,
  allSecure: boolean,
) {
  if (allSecure) {
    return "This learner appears ready for extension or the next Number focus.";
  }

  if (recommendation.judgement === "Needs support") {
    return `Start with targeted practice on ${recommendation.subElementTitle} before reassessing this focus.`;
  }

  if (recommendation.judgement === "Developing") {
    return `Build fluency with ${recommendation.subElementTitle}, then return to the assessment.`;
  }

  return `Use short practice to consolidate ${recommendation.subElementTitle} before reassessing.`;
}

function buildTargetedPracticeRecommendation(
  bankKey: NumberAssessmentBankKey,
  itemResponses: Array<{
    item: NumberAssessmentBankItem;
    response: LocalAssessmentResponse;
    persistedResult: LocalAssessmentResult;
  }>,
  subElementMastery: LocalSubElementMastery[],
): LocalTargetedPracticeRecommendation | null {
  if (!subElementMastery.length) return null;

  const prioritySubElements = subElementMastery
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.judgement !== "Secure")
    .sort(
      (left, right) =>
        getSubElementMasteryPriority(left.entry.judgement) -
          getSubElementMasteryPriority(right.entry.judgement) ||
        left.index - right.index,
    );
  const allSecure = prioritySubElements.length === 0;
  const selected = allSecure
    ? subElementMastery[0]
    : prioritySubElements[0]?.entry;

  if (!selected) return null;

  const firstItemForSubElement = itemResponses.find(
    ({ item }) => item.subElementKey === selected.subElementKey,
  )?.item;
  const selectedBank = getNumberAssessmentBankByKey(bankKey);
  const powersRootsPracticeSection =
    bankKey === "powers-roots-exponent-notation"
      ? POWERS_ROOTS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const approximationPracticeSection =
    bankKey === "approximation-estimation-error"
      ? APPROXIMATION_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const irrationalRealPracticeSection =
    bankKey === "irrational-and-real-numbers"
      ? IRRATIONAL_REAL_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const surdsExactPracticeSection =
    bankKey === "surds-and-exact-form"
      ? SURDS_EXACT_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const rationalOperationsPracticeSection =
    bankKey === "rational-numbers-and-operations"
      ? RATIONAL_OPERATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const terminatingRecurringRationalPracticeSection =
    bankKey === "terminating-recurring-rational-representations"
      ? TERMINATING_RECURRING_RATIONAL_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const percentRatioFinancePracticeSection =
    bankKey === "percentages-ratio-financial-modelling"
      ? PERCENT_RATIO_FINANCE_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const integersCoordinatesPropertiesPracticeSection =
    bankKey === "integers-coordinates-number-properties"
      ? INTEGERS_COORDINATES_PROPERTIES_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const placeValueOperationsPracticeSection =
    bankKey === "place-value-and-whole-number-operations"
      ? PLACE_VALUE_OPERATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const fractionsFoundationsPracticeSection =
    bankKey === "fractions-foundations"
      ? FRACTIONS_FOUNDATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const decimalsFoundationsPracticeSection =
    bankKey === "decimals-foundations"
      ? DECIMALS_FOUNDATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const additiveStrategiesPracticeSection =
    bankKey === "additive-strategies-and-problem-solving"
      ? ADDITIVE_STRATEGIES_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const multiplicationDivisionFluencyPracticeSection =
    bankKey === "multiplication-division-fluency"
      ? MULTIPLICATION_DIVISION_FLUENCY_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const patternsEarlyAlgebraPracticeSection =
    bankKey === "number-patterns-and-early-algebraic-thinking"
      ? PATTERNS_EARLY_ALGEBRA_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const moneyPracticalContextsPracticeSection =
    bankKey === "money-and-practical-number-contexts"
      ? MONEY_PRACTICAL_CONTEXTS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const timeElapsedFoundationsPracticeSection =
    bankKey === "time-and-elapsed-time-foundations"
      ? TIME_ELAPSED_FOUNDATIONS_TARGETED_PRACTICE_SECTION_BY_SUB_ELEMENT[
          selected.subElementKey
        ] ?? null
      : null;
  const mappedPracticeSection =
    powersRootsPracticeSection ||
    approximationPracticeSection ||
    irrationalRealPracticeSection ||
    surdsExactPracticeSection ||
    rationalOperationsPracticeSection ||
    terminatingRecurringRationalPracticeSection ||
    percentRatioFinancePracticeSection ||
    integersCoordinatesPropertiesPracticeSection ||
    placeValueOperationsPracticeSection ||
    additiveStrategiesPracticeSection ||
    fractionsFoundationsPracticeSection ||
    decimalsFoundationsPracticeSection ||
    multiplicationDivisionFluencyPracticeSection ||
    patternsEarlyAlgebraPracticeSection ||
    moneyPracticalContextsPracticeSection ||
    timeElapsedFoundationsPracticeSection;
  const mappedPracticeModule = powersRootsPracticeSection
    ? NUMBER_POWERS_ROOTS_PRACTICE_MODULE
    : approximationPracticeSection
      ? NUMBER_APPROXIMATION_PRACTICE_MODULE
      : irrationalRealPracticeSection
        ? NUMBER_IRRATIONAL_REAL_PRACTICE_MODULE
        : surdsExactPracticeSection
          ? NUMBER_SURDS_EXACT_PRACTICE_MODULE
          : rationalOperationsPracticeSection
          ? NUMBER_RATIONAL_OPERATIONS_PRACTICE_MODULE
          : terminatingRecurringRationalPracticeSection
            ? NUMBER_TERMINATING_RECURRING_RATIONAL_PRACTICE_MODULE
            : percentRatioFinancePracticeSection
              ? NUMBER_PERCENT_RATIO_FINANCE_PRACTICE_MODULE
              : integersCoordinatesPropertiesPracticeSection
                ? NUMBER_INTEGERS_COORDINATES_PROPERTIES_PRACTICE_MODULE
                : placeValueOperationsPracticeSection
                  ? NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE
                  : additiveStrategiesPracticeSection
                    ? NUMBER_ADDITIVE_STRATEGIES_PRACTICE_MODULE
                    : fractionsFoundationsPracticeSection
                      ? NUMBER_FRACTIONS_FOUNDATIONS_PRACTICE_MODULE
                      : decimalsFoundationsPracticeSection
                        ? NUMBER_DECIMALS_FOUNDATIONS_PRACTICE_MODULE
                        : multiplicationDivisionFluencyPracticeSection
                          ? NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PRACTICE_MODULE
                          : patternsEarlyAlgebraPracticeSection
                            ? NUMBER_PATTERNS_EARLY_ALGEBRA_PRACTICE_MODULE
                            : moneyPracticalContextsPracticeSection
                              ? NUMBER_MONEY_PRACTICAL_CONTEXTS_PRACTICE_MODULE
                              : timeElapsedFoundationsPracticeSection
                                ? NUMBER_TIME_ELAPSED_FOUNDATIONS_PRACTICE_MODULE
                                : null;
  const hasMappedPractice = Boolean(mappedPracticeSection && mappedPracticeModule);

  return {
    subElementKey: selected.subElementKey,
    subElementTitle: selected.subElementTitle,
    judgement: selected.judgement,
    correctCount: selected.correctCount,
    totalCount: selected.totalCount,
    subjectKey: selectedBank?.subjectKey ?? "mathematics",
    strandKey: selectedBank?.strandKey ?? "number-and-place-value",
    stageKey: selectedBank?.stageKey ?? "years-9-10-consolidation",
    pathwayStepId: selectedBank?.pathwayStepId ?? "",
    stepKey: selectedBank?.stepKey ?? bankKey,
    progressionBandKey:
      firstItemForSubElement?.progressionBandKey ?? bankKey,
    progressionStepKey: firstItemForSubElement?.progressionStepKey ?? "",
    practiceModuleId: mappedPracticeModule?.id ?? null,
    practiceModuleTitle: mappedPracticeModule?.title ?? null,
    practiceSectionId: mappedPracticeSection?.sectionId ?? null,
    practiceSectionTitle: mappedPracticeSection?.sectionTitle ?? null,
    message: getTargetedPracticeMessage(selected, allSecure),
    status: hasMappedPractice ? "available" : "coming_next",
  };
}

function buildTargetedPracticeHref(
  recommendation: LocalTargetedPracticeRecommendation,
  returnTo?: string,
) {
  if (
    recommendation.status !== "available" ||
    !recommendation.practiceModuleId ||
    !recommendation.practiceSectionId
  ) {
    return "";
  }

  const params = new URLSearchParams({
    moduleId: recommendation.practiceModuleId,
    sectionId: recommendation.practiceSectionId,
    subjectKey: recommendation.subjectKey,
    strandKey: recommendation.strandKey,
    stageKey: recommendation.stageKey,
    pathwayStepId: recommendation.pathwayStepId,
    stepKey: recommendation.stepKey,
    sourceAssessmentBand: recommendation.progressionBandKey,
    sourceProgressionStep: recommendation.progressionStepKey,
    sourceSubElement: recommendation.subElementKey,
  });

  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  return `/practice/number-targeted?${params.toString()}`;
}

function getSafeLocalHref(value: unknown) {
  const href = String(value ?? "").trim();

  if (!href || !href.startsWith("/") || href.startsWith("//")) {
    return "";
  }

  return href;
}

function buildAdaptiveInsightSummary(
  bankKey: NumberAssessmentBankKey,
  items: NumberAssessmentBankItem[],
  responses: Record<string, LocalAssessmentResponse>,
): LocalAdaptiveInsightSummary {
  const itemResponses = items.map((item) => {
    const response = responses[item.id] ?? createEmptyResponse(item.id);
    const persistedResult = getPersistedLocalResult(item, response);

    return {
      item,
      response,
      persistedResult,
    };
  });

  const attemptedCount = itemResponses.filter(({ response }) =>
    hasEnteredResponse(response),
  ).length;
  const correctCount = itemResponses.filter(
    ({ persistedResult }) => persistedResult === "correct",
  ).length;
  const incorrectCount = itemResponses.filter(
    ({ persistedResult }) => persistedResult === "incorrect",
  ).length;
  const notSureCount = itemResponses.filter(({ response }) =>
    isNotSureResponse(response.response),
  ).length;
  const reviewNeededCount = itemResponses.filter(
    ({ persistedResult }) => persistedResult === "review_needed",
  ).length;
  const unansweredCount = itemResponses.filter(
    ({ persistedResult }) => persistedResult === "unanswered",
  ).length;
  const enteredButUncheckedCount = itemResponses.filter(
    ({ response, persistedResult }) =>
      hasEnteredResponse(response) &&
      !response.submitted &&
      persistedResult === "review_needed",
  ).length;
  const subElementMastery = buildSubElementMastery(itemResponses);
  const prioritySubElements = subElementMastery
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.judgement !== "Secure")
    .sort(
      (left, right) =>
        getSubElementMasteryPriority(left.entry.judgement) -
          getSubElementMasteryPriority(right.entry.judgement) ||
        left.index - right.index,
    )
    .map(({ entry }) => entry);
  const targetedPracticeRecommendation = buildTargetedPracticeRecommendation(
    bankKey,
    itemResponses,
    subElementMastery,
  );

  const targetedItems = itemResponses
    .filter(
      ({ persistedResult }) =>
        persistedResult === "incorrect" || persistedResult === "review_needed",
    )
    .map(({ item }) => item);

  const misconceptionCounts = new Map<string, number>();
  const recommendationCounts = new Map<string, number>();

  targetedItems.forEach((item) => {
    item.misconceptionTargets.forEach((code) => {
      misconceptionCounts.set(code, (misconceptionCounts.get(code) ?? 0) + 1);
    });

    const recommendation = item.adaptiveRoute.practiceRecommendation.trim();
    if (recommendation) {
      recommendationCounts.set(
        recommendation,
        (recommendationCounts.get(recommendation) ?? 0) + 1,
      );
    }
  });

  const topMisconceptionTargets = Array.from(misconceptionCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([code, count]) => ({
      code,
      label: getMisconceptionLabel(code),
      count,
    }));

  const topPracticeRecommendations = Array.from(recommendationCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([recommendation, count]) => ({
      recommendation,
      count,
    }));

  const suggestedFocusAreas = prioritySubElements.length
    ? prioritySubElements.map(
        (entry) => `${entry.subElementTitle} - ${entry.judgement}`,
      )
    : topMisconceptionTargets.map((entry) =>
        getFocusAreaFromMisconception(entry.code),
      );

  let suggestedNextStep =
    "Complete a few more items, then review the main practice focus before deciding whether this learning is secure.";

  const topCodes = topMisconceptionTargets.map((entry) => entry.code);

  if (attemptedCount === 0) {
    suggestedNextStep =
      "Start the assessment with a few items first, then use the pattern summary to decide the next practice focus.";
  } else if (
    correctCount >= Math.max(8, items.length - 2) &&
    incorrectCount === 0 &&
    reviewNeededCount === 0
  ) {
    if (bankKey === "powers-roots-exponent-notation") {
      suggestedNextStep =
        "This learner appears ready for more complex work with exponent structure and exact forms.";
    } else if (bankKey === "irrational-and-real-numbers") {
      suggestedNextStep =
        "This learner appears ready for more advanced exact real-number reasoning and surd-based contexts.";
    } else if (bankKey === "surds-and-exact-form") {
      suggestedNextStep =
        "This learner appears ready for more extended work with exact surd manipulation and proof-style reasoning.";
    } else {
      suggestedNextStep =
        "This learner appears ready for more complex approximation and error-analysis contexts.";
    }
  } else if (reviewNeededCount >= 2 && incorrectCount === 0 && correctCount >= 4) {
    suggestedNextStep =
      "The closed responses look strong. Review the explanation responses with an adult before moving forward.";
  } else if (bankKey === "approximation-estimation-error") {
    if (
      hasAnyCode(topCodes, [
        "rounding-place-value-error",
        "truncation-vs-rounding-confusion",
      ])
    ) {
      suggestedNextStep =
        "Return to practice that compares rounding and truncating the same decimal values before trying repeated approximation problems.";
    } else if (
      hasAnyCode(topCodes, [
        "estimated-exact-confusion",
        "reasonableness-not-checked",
      ])
    ) {
      suggestedNextStep =
        "Practise comparing exact answers with estimates and explaining whether the difference matters in context.";
    } else if (topCodes.includes("rounding-too-early")) {
      suggestedNextStep =
        "Revisit calculations where rounding early changes the final result, then retry repeated approximation items.";
    }
  } else if (bankKey === "irrational-and-real-numbers") {
    if (
      hasAnyCode(topCodes, [
        "rational-irrational-classification-error",
        "recurring-decimal-rational-confusion",
        "pi-as-rational-error",
      ])
    ) {
      suggestedNextStep =
        "Return to practice classifying fractions, decimals, square roots and pi as rational or irrational before moving into exact-form problems.";
    } else if (
      hasAnyCode(topCodes, [
        "square-root-estimation-error",
        "number-line-placement-error",
        "real-number-comparison-error",
      ])
    ) {
      suggestedNextStep =
        "Practise bracketing square roots between whole numbers and comparing where rational and irrational values sit on a number line.";
    } else if (
      hasAnyCode(topCodes, [
        "exact-vs-decimal-form-confusion",
        "approximation-treated-as-exact",
        "area-formula-exact-form-error",
      ])
    ) {
      suggestedNextStep =
        "Revisit when a value should stay in exact form and when a decimal approximation is appropriate.";
    }
  } else if (bankKey === "powers-roots-exponent-notation") {
    if (
      hasAnyCode(topCodes, [
        "square-root-perfect-square-confusion",
        "square-root-estimation-error",
      ])
    ) {
      suggestedNextStep =
        "Return to practice connecting perfect squares with square roots and estimating non-perfect roots between whole numbers.";
    } else if (
      hasAnyCode(topCodes, [
        "exponent-notation-confusion",
        "repeated-multiplication-confusion",
        "base-vs-exponent-confusion",
      ])
    ) {
      suggestedNextStep =
        "Practise translating repeated multiplication into exponent form and explaining what the base and exponent each mean.";
    } else if (
      hasAnyCode(topCodes, [
        "powers-of-ten-place-value-error",
        "prime-factorisation-exponent-error",
      ])
    ) {
      suggestedNextStep =
        "Revisit powers of 10 and prime factorisation with powers before moving into more complex exponent work.";
    } else if (
      hasAnyCode(topCodes, [
        "exponent-law-multiplication-error",
        "exponent-law-division-error",
        "zero-exponent-confusion",
      ])
    ) {
      suggestedNextStep =
        "Practise the exponent laws with the same base, including what zero exponents mean, before trying mixed exponent expressions.";
    }
  } else if (bankKey === "surds-and-exact-form") {
    if (
      hasAnyCode(topCodes, [
        "fractional-index-to-surd-confusion",
        "fractional-power-evaluation-error",
      ])
    ) {
      suggestedNextStep =
        "Return to practice connecting fractional powers with surd notation and evaluating fractional powers in the correct order.";
    } else if (
      hasAnyCode(topCodes, [
        "non-perfect-square-factor-error",
        "surd-simplification-factor-error",
        "coefficient-surd-distribution-error",
      ])
    ) {
      suggestedNextStep =
        "Practise simplifying surds by finding square factors and keeping coefficients organised before combining terms.";
    } else if (
      hasAnyCode(topCodes, [
        "like-surd-combination-error",
        "unlike-surd-combination-error",
        "surd-multiplication-error",
      ])
    ) {
      suggestedNextStep =
        "Revisit multiplying surds and simplifying them before deciding which exact surd terms can combine.";
    } else if (topCodes.includes("rationalising-denominator-error")) {
      suggestedNextStep =
        "Practise rationalising simple and conjugate denominators while keeping each step in exact form.";
    } else if (topCodes.includes("exact-form-vs-decimal-error")) {
      suggestedNextStep =
        "Review why exact surd form is often more useful than rounding too early in a calculation.";
    }
  } else if (reviewNeededCount >= 2) {
    suggestedNextStep =
      "Review the explanation responses with an adult before deciding whether this concept is secure.";
  } else if (topPracticeRecommendations[0]) {
    suggestedNextStep = topPracticeRecommendations[0].recommendation;
  }

  const leadingSubElement = prioritySubElements[0];
  if (attemptedCount > 0 && leadingSubElement) {
    if (leadingSubElement.judgement === "Needs support") {
      suggestedNextStep = `Start with targeted practice for ${leadingSubElement.subElementTitle}.`;
    } else if (leadingSubElement.judgement === "Developing") {
      suggestedNextStep = `Build fluency with ${leadingSubElement.subElementTitle} before reassessing.`;
    } else {
      suggestedNextStep = `Use short practice to consolidate ${leadingSubElement.subElementTitle} before reassessing.`;
    }
  } else if (
    attemptedCount > 0 &&
    subElementMastery.length > 0 &&
    subElementMastery.every((entry) => entry.judgement === "Secure")
  ) {
    suggestedNextStep =
      "This learner appears ready to move to the next Number focus.";
  }

  return {
    attemptedCount,
    correctCount,
    incorrectCount,
    notSureCount,
    reviewNeededCount,
    unansweredCount,
    enteredButUncheckedCount,
    subElementMastery,
    targetedPracticeRecommendation,
    topMisconceptionTargets,
    topPracticeRecommendations,
    suggestedFocusAreas,
    suggestedNextStep,
    parentJudgementPrompt:
      "Based on this assessment, how would you judge this learning focus?",
  };
}

function CleanNumberAssessmentPlayerBody() {
  const workspace = useCleanFamilyWorkspace();
  const searchParams = useSearchParams();

  const incomingBank = useMemo(
    () =>
      getNumberAssessmentAlignmentForPathwayStep({
        openStep: searchParams.get("openStep"),
        subjectKey: searchParams.get("subjectKey"),
        strandKey: searchParams.get("strandKey"),
        stageKey: searchParams.get("stageKey"),
        pathwayStepId: searchParams.get("pathwayStepId"),
        progressionBandKey: searchParams.get("progressionBandKey"),
        stepKey: searchParams.get("stepKey"),
        itemBankKey: searchParams.get("itemBankKey"),
      })?.bank ?? null,
    [searchParams],
  );
  const incomingStepAssessment = useMemo(
    () =>
      getStepAssessmentForPathwayStep({
        stepAssessmentKey: searchParams.get("stepAssessmentKey"),
        pathwayStepId: searchParams.get("pathwayStepId"),
        stepKey: searchParams.get("stepKey"),
        strandKey: searchParams.get("strandKey"),
      }),
    [searchParams],
  );
  const hasIncomingNumberContext =
    searchParams.get("subjectKey") === "mathematics" &&
    searchParams.get("strandKey") === "number-and-place-value";
  const incomingLearnerId = String(searchParams.get("learnerId") || "").trim();
  const returnTo = getSafeLocalHref(searchParams.get("returnTo"));

  const [selectedBankKey, setSelectedBankKey] = useState<NumberAssessmentBankKey>(
    (incomingStepAssessment?.strandKey === "number-and-place-value"
      ? incomingStepAssessment.parentBankKey as NumberAssessmentBankKey
      : null) ||
      incomingBank?.key ||
      NUMBER_ASSESSMENT_BANKS[0]?.key ||
      "powers-roots-exponent-notation",
  );
  const [assessmentDepth, setAssessmentDepth] =
    useState<NumberStepAssessmentDepth>("basic");
  const [sessionMode, setSessionMode] =
    useState<AssessmentSessionMode>("launcher");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [parentJudgement, setParentJudgement] = useState<ParentJudgement | null>(
    null,
  );
  const [saveState, setSaveState] = useState<AssessmentAttemptSaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const exactStepAutoSaveStartedRef = useRef(false);
  const saveAssessmentAttemptRef = useRef<(() => Promise<void>) | null>(null);
  const [responses, setResponses] = useState<
    Record<string, LocalAssessmentResponse>
  >({});
  const [sessionStartedAtValue, setSessionStartedAtValue] = useState(() =>
    new Date().toISOString(),
  );

  const selectedBank = useMemo(
    () =>
      getNumberAssessmentBankByKey(selectedBankKey) || NUMBER_ASSESSMENT_BANKS[0],
    [selectedBankKey],
  );
  const activeAssessmentContext = {
    subjectKey: incomingStepAssessment?.subjectKey ?? selectedBank.subjectKey,
    strandKey: incomingStepAssessment?.strandKey ?? selectedBank.strandKey,
    stageKey: incomingStepAssessment?.stageKey ?? selectedBank.stageKey,
    pathwayStepId: incomingStepAssessment?.pathwayStepId ?? selectedBank.pathwayStepId,
    stepKey: incomingStepAssessment?.stepKey ?? selectedBank.stepKey,
    progressionBandKey:
      incomingStepAssessment?.progressionBandKey ?? selectedBank.progressionBandKey,
    itemBankKey: incomingStepAssessment?.parentItemBankKey ?? selectedBank.itemBankKey,
    parentFamilyTitle: incomingStepAssessment?.parentBankTitle ?? selectedBank.title,
    sourceRoute: incomingStepAssessment?.sourceRoute ?? selectedBank.sourceRoute,
  };

  const stepAssessmentItems = incomingStepAssessment
    ? getStepAssessmentItemsForDepth(incomingStepAssessment, assessmentDepth)
    : [];
  const items = incomingStepAssessment ? stepAssessmentItems : selectedBank.items;
  const totalItems = items.length;

  const currentItem = items[currentIndex] || items[0];
  const currentResponse =
    currentItem
      ? responses[currentItem.id] ?? createEmptyResponse(currentItem.id)
      : createEmptyResponse("no-item");
  const currentProgress = ((currentIndex + 1) / totalItems) * 100;
  const sessionProgress = showSummary ? 100 : currentProgress;

  const summary = buildAdaptiveInsightSummary(selectedBank.key, items, responses);
  const targetedPracticeHref = summary.targetedPracticeRecommendation
    ? buildTargetedPracticeHref(summary.targetedPracticeRecommendation, returnTo)
    : "";
  const exactStepPractice = incomingStepAssessment
    ? getStepPracticeForPathwayStep({
        pathwayStepId: incomingStepAssessment.pathwayStepId,
        stepKey: incomingStepAssessment.stepKey,
        strandKey: incomingStepAssessment.strandKey,
      })
    : null;
  const exactStepPracticeHref = exactStepPractice
    ? `/practice/number-targeted?${new URLSearchParams({
        stepPracticeKey: exactStepPractice.key,
        subjectKey: activeAssessmentContext.subjectKey,
        strandKey: activeAssessmentContext.strandKey,
        stageKey: activeAssessmentContext.stageKey,
        pathwayStepId: activeAssessmentContext.pathwayStepId,
        stepKey: activeAssessmentContext.stepKey,
        returnTo: returnTo || "/my-pathways",
      }).toString()}`
    : "";
  const assessmentBankGroups = useMemo(
    () => [
      {
        label: "Year 3-5 Number foundations",
        banks: NUMBER_ASSESSMENT_BANKS.filter(
          (bank) => bank.stageKey === "middle-primary",
        ),
      },
      {
        label: "Years 6-10 Number",
        banks: NUMBER_ASSESSMENT_BANKS.filter(
          (bank) => bank.stageKey !== "middle-primary",
        ),
      },
    ],
    [],
  );
  const selectedLearnerId = useMemo(() => {
    if (!workspace.learners.length) return "";

    if (
      incomingLearnerId &&
      workspace.learners.some((learner) => learner.id === incomingLearnerId)
    ) {
      return incomingLearnerId;
    }

    const defaultLearnerId = workspace.profile?.defaultLearnerId;
    const defaultIsValid = defaultLearnerId
      ? workspace.learners.some((learner) => learner.id === defaultLearnerId)
      : false;

    return defaultIsValid ? defaultLearnerId || "" : workspace.learners[0]?.id || "";
  }, [incomingLearnerId, workspace.learners, workspace.profile?.defaultLearnerId]);
  const selectedLearner = useMemo(
    () => workspace.learners.find((learner) => learner.id === selectedLearnerId) ?? null,
    [selectedLearnerId, workspace.learners],
  );
  const familyId = workspace.profile?.id || "";
  const learnerId = selectedLearner?.id || "";

  function buildAssessmentIssueContext(
    mode: "assessment" | "summary",
    item?: NumberAssessmentBankItem,
    response?: LocalAssessmentResponse,
  ): ContentIssueReportContext {
    return {
      mode,
      learnerId,
      subjectKey: activeAssessmentContext.subjectKey,
      strandKey: activeAssessmentContext.strandKey,
      stageKey: activeAssessmentContext.stageKey,
      pathwayStepId: activeAssessmentContext.pathwayStepId,
      stepKey: activeAssessmentContext.stepKey,
      stepTitle: incomingStepAssessment?.title ?? selectedBank.title,
      assessmentDepth: incomingStepAssessment ? assessmentDepth : null,
      stepAssessmentKey: incomingStepAssessment?.key ?? null,
      parentItemBankKey: activeAssessmentContext.itemBankKey,
      itemId: item?.id ?? null,
      prompt: item?.prompt ?? null,
      responseType: item?.answerType ?? null,
      selectedAnswer: response?.response ?? null,
      expectedAnswer: item?.expectedAnswer ?? null,
      visualSupport: item?.visualSupport ?? {},
      context: {
        bankKey: selectedBank.key,
        bankTitle: selectedBank.title,
        itemTitle: item?.title ?? null,
        itemFormat: item?.format ?? null,
        currentIndex: item ? currentIndex + 1 : null,
        totalItems,
        summary:
          mode === "summary"
            ? {
                attemptedCount: summary.attemptedCount,
                correctCount: summary.correctCount,
                incorrectCount: summary.incorrectCount,
                notSureCount: summary.notSureCount,
                reviewNeededCount: summary.reviewNeededCount,
                unansweredCount: summary.unansweredCount,
                autoCheckStatus: incomingStepAssessment
                  ? getNumberStepAssessmentStatus(summary.correctCount, totalItems)
                  : null,
              }
            : null,
      },
    };
  }
  const canSaveAttempt = Boolean(!workspace.loading && familyId && learnerId);

  let saveBlockedMessage = "";
  if (workspace.loading) {
    saveBlockedMessage = "Checking workspace save availability...";
  } else if (workspace.schemaMissing) {
    saveBlockedMessage =
      "A synced family workspace is required before saving assessment attempts.";
  } else if (workspace.requiresFamilyCreation || !workspace.profile) {
    saveBlockedMessage =
      "This assessment is not connected to a synced family workspace. Switch to a synced family workspace before saving.";
  } else if (!learnerId) {
    saveBlockedMessage =
      "Select a learner before saving this assessment attempt.";
  }

  function resetAssessmentState() {
    setCurrentIndex(0);
    setShowSummary(false);
    setParentJudgement(null);
    setSaveState("idle");
    setSaveMessage("");
    exactStepAutoSaveStartedRef.current = false;
    setResponses({});
    setSessionStartedAtValue(new Date().toISOString());
  }

  function startAssessment(nextBankKey = selectedBankKey) {
    setSelectedBankKey(nextBankKey);
    resetAssessmentState();
    setSessionMode("active");
  }

  function exitAssessment() {
    resetAssessmentState();
    setSessionMode("launcher");
  }

  function chooseAnotherFocus() {
    resetAssessmentState();
    setSessionMode("launcher");
  }

  function updateResponse(itemId: string, value: string) {
    setResponses((current) => ({
      ...current,
      [itemId]: {
        itemId,
        response: value,
        submitted: false,
        result: "unanswered",
        submittedAt: null,
      },
    }));
  }

  function updateStructuredResponse(
    itemId: string,
    value: Record<string, unknown>,
  ) {
    updateResponse(itemId, serializeStructuredResponse(value));
  }

  function getCurrentStructuredResponse() {
    return parseStructuredResponse(currentResponse.response) ?? {};
  }

  function submitCurrentItem() {
    if (!currentItem) {
      return;
    }

    if (incomingStepAssessment && !hasEnteredResponse(currentResponse)) {
      return;
    }

    const submittedAt = new Date().toISOString();
    setResponses((current) => ({
      ...current,
      [currentItem.id]: {
        itemId: currentItem.id,
        response: currentResponse.response,
        submitted: true,
        result: getCheckResult(currentItem, currentResponse.response),
        submittedAt,
      },
    }));
  }

  function markCurrentItemNotSure() {
    if (!currentItem) {
      return;
    }

    const submittedAt = new Date().toISOString();
    setResponses((current) => ({
      ...current,
      [currentItem.id]: {
        itemId: currentItem.id,
        response: NOT_SURE_RESPONSE,
        submitted: true,
        result: "incorrect",
        submittedAt,
      },
    }));
  }

  function renderStructuredOptionButton({
    option,
    isSelected,
    onClick,
  }: {
    option: { id: string; label: string; value?: string };
    isSelected: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        key={option.id}
        type="button"
        onClick={onClick}
        style={{
          ...optionButtonStyle,
          border: isSelected ? "2px solid #1d4ed8" : optionButtonStyle.border,
          background: isSelected ? "#eff6ff" : "#ffffff",
          boxShadow: isSelected ? "0 10px 22px rgba(59,130,246,0.14)" : "none",
        }}
      >
        <span>{option.label}</span>
        {isSelected ? (
          <span
            style={{
              ...chipBaseStyle,
              border: "1px solid #bfdbfe",
              background: "#dbeafe",
              color: "#1d4ed8",
              flexShrink: 0,
            }}
          >
            Selected
          </span>
        ) : null}
      </button>
    );
  }

  function renderResponseControl() {
    const structuredResponse = getCurrentStructuredResponse();

    if (currentItem.answerType === "multiple_choice") {
      const statisticsStep1Options = currentItem.id.startsWith(
        "statistics-data-step-1-",
      );
      const step2NumberWordOptions = isStep2NumberWordActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step3NumeralOptions = isStep3NumeralActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step4CountingObjectOptions = isStep4CountingObjectsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step5CountingObjectOptions = isStep5CountingObjectsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const countingObjectOptions = step4CountingObjectOptions || step5CountingObjectOptions;
      const step6CompareGroupOptions = isStep6CompareGroupsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step7OrderNumberOptions = isStep7OrderNumbersActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step8PartWholeOptions = isStep8PartWholeActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step9ObjectStoryOptions = isStep9ObjectStoryActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step10EqualSharingOptions = isStep10EqualSharingActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step11CountingSequenceOptions = isStep11CountingSequenceActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step12ReadWriteOrderOptions = isStep12ReadWriteOrderActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step13SkipCountingOptions = isStep13SkipCountingActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step16RenameTwoDigitOptions = isStep16RenameTwoDigitActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step17AddSubtractWithin20Options = isStep17AddSubtractWithin20Activity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step18SupportedAddSubtractOptions = isStep18SupportedAddSubtractActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step19EqualGroupsArraysOptions = isStep19EqualGroupsArraysActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step20HalvesQuartersSharingOptions = isStep20HalvesQuartersSharingActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step21LargeNumberCompareOptions = isStep21LargeNumberCompareActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step22HundredsTensOnesOptions = isStep22HundredsTensOnesActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step23PartitionRegroupOptions = isStep23PartitionRegroupActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step24ZeroPlaceholderOptions = isStep24ZeroPlaceholderActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step25PlaceValueAddSubtractOptions = isStep25PlaceValueAddSubtractActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step26MultiplicationFactsOptions = isStep26MultiplicationFactsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step27ArraysGroupingKnownFactsOptions = isStep27ArraysGroupingKnownFactsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step28EstimateReasonablenessOptions = isStep28EstimateReasonablenessActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step29UnitSimpleFractionsOptions = isStep29UnitSimpleFractionsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step30PracticalMoneyOptions = isStep30PracticalMoneyActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step31ExtendedPlaceValueOptions = isStep31ExtendedPlaceValueActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step32RoundEstimateLargerNumbersOptions = isStep32RoundEstimateLargerNumbersActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step33DecimalPlaceValueOptions = isStep33DecimalPlaceValueActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step34CompareOrderDecimalsOptions = isStep34CompareOrderDecimalsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step35EquivalentFractionsOptions = isStep35EquivalentFractionsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step36FractionAddSubtractOptions = isStep36FractionAddSubtractActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step37EfficientStrategiesOptions = isStep37EfficientStrategiesActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step38RemaindersContextOptions = isStep38RemaindersContextActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step39FractionDecimalPercentOptions = isStep39FractionDecimalPercentActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step40FinancialModellingOptions = isStep40FinancialModellingActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step41FlexibleNumberFormsOptions = isStep41FlexibleNumberFormsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step42NegativeNumberLineOptions = isStep42NegativeNumberLineActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step44PowersRootsOptions = isStep44PowersRootsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step45RatioRatesOptions = isStep45RatioRatesActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step46ProportionalReasoningOptions = isStep46ProportionalReasoningActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step48EstimationBoundsOptions = isStep48EstimationBoundsActivity(
        currentItem.id,
        currentItem.progressionStepKey,
      );
      const step2VisualModel = step2NumberWordOptions
        ? parseEarlyNumberVisualDescription(currentItem.visualSupport?.description)
        : null;
      const step3VisualModel = step3NumeralOptions
        ? parseEarlyNumberVisualDescription(currentItem.visualSupport?.description)
        : null;

      return (
        <div
          style={{
            display: "grid",
            gap:
              statisticsStep1Options
                ? 6
                : step2NumberWordOptions ||
                    step3NumeralOptions ||
                    countingObjectOptions ||
                    step6CompareGroupOptions ||
                    step7OrderNumberOptions ||
                    step8PartWholeOptions ||
                    step9ObjectStoryOptions ||
                    step10EqualSharingOptions ||
                    step11CountingSequenceOptions ||
                    step12ReadWriteOrderOptions ||
                    step13SkipCountingOptions ||
                    step16RenameTwoDigitOptions ||
                    step17AddSubtractWithin20Options ||
                    step18SupportedAddSubtractOptions ||
                    step19EqualGroupsArraysOptions ||
                    step20HalvesQuartersSharingOptions ||
                    step21LargeNumberCompareOptions ||
                    step22HundredsTensOnesOptions ||
                    step23PartitionRegroupOptions ||
                    step24ZeroPlaceholderOptions ||
                    step25PlaceValueAddSubtractOptions ||
                    step26MultiplicationFactsOptions ||
                    step27ArraysGroupingKnownFactsOptions ||
                    step28EstimateReasonablenessOptions ||
                    step29UnitSimpleFractionsOptions ||
                    step30PracticalMoneyOptions ||
                    step31ExtendedPlaceValueOptions ||
                    step32RoundEstimateLargerNumbersOptions ||
                    step33DecimalPlaceValueOptions ||
                    step34CompareOrderDecimalsOptions ||
                    step35EquivalentFractionsOptions ||
                    step36FractionAddSubtractOptions ||
                    step37EfficientStrategiesOptions ||
                    step38RemaindersContextOptions ||
                    step39FractionDecimalPercentOptions ||
                    step40FinancialModellingOptions ||
                    step41FlexibleNumberFormsOptions ||
                    step42NegativeNumberLineOptions ||
                    step44PowersRootsOptions ||
                    step45RatioRatesOptions ||
                    step46ProportionalReasoningOptions ||
                    step48EstimationBoundsOptions
                  ? 8
                  : 10,
            gridTemplateColumns: statisticsStep1Options
              ? "repeat(auto-fit, minmax(92px, 1fr))"
              : step2NumberWordOptions ||
                  step3NumeralOptions ||
                  countingObjectOptions ||
                  step6CompareGroupOptions ||
                  step7OrderNumberOptions ||
                  step8PartWholeOptions ||
                  step9ObjectStoryOptions ||
                  step10EqualSharingOptions ||
                  step11CountingSequenceOptions ||
                  step12ReadWriteOrderOptions ||
                  step13SkipCountingOptions ||
                  step16RenameTwoDigitOptions ||
                  step17AddSubtractWithin20Options ||
                  step18SupportedAddSubtractOptions ||
                  step19EqualGroupsArraysOptions ||
                  step20HalvesQuartersSharingOptions ||
                  step21LargeNumberCompareOptions ||
                  step22HundredsTensOnesOptions ||
                  step23PartitionRegroupOptions ||
                  step24ZeroPlaceholderOptions ||
                  step25PlaceValueAddSubtractOptions ||
                  step26MultiplicationFactsOptions ||
                  step27ArraysGroupingKnownFactsOptions ||
                  step28EstimateReasonablenessOptions ||
                  step29UnitSimpleFractionsOptions ||
                  step30PracticalMoneyOptions ||
                  step31ExtendedPlaceValueOptions ||
                  step32RoundEstimateLargerNumbersOptions ||
                  step33DecimalPlaceValueOptions ||
                  step34CompareOrderDecimalsOptions ||
                  step35EquivalentFractionsOptions
                ? "repeat(auto-fit, minmax(132px, 1fr))"
              : undefined,
          }}
        >
          {(currentItem.options ?? []).map((option) => {
            const isSelected = currentResponse.response === option;
            const shapeVisual = currentItem.id.startsWith(
              "geometry-spatial-reasoning-step-1-",
            )
              ? renderGeometryShapeVisualCard(option, isSelected)
              : null;
            const statisticsVisual =
              !shapeVisual &&
              currentItem.id.startsWith("statistics-data-step-1-")
                ? renderStatisticsSortingVisualCard(option, isSelected)
                : null;
            const step2Visual =
              !shapeVisual && !statisticsVisual && step2NumberWordOptions
                ? renderStep2WorksheetOptionCard({
                    option,
                    visual: step2VisualModel,
                    selected: isSelected,
                  })
                : null;
            const step3Visual =
              !shapeVisual && !statisticsVisual && !step2Visual && step3NumeralOptions
                ? renderStep3WorksheetOptionCard({
                    option,
                    visual: step3VisualModel,
                    selected: isSelected,
                  })
                : null;
            const step4Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              countingObjectOptions
                ? renderStep4WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step6Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              step6CompareGroupOptions
                ? renderStep6WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step7Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              step7OrderNumberOptions
                ? renderStep7WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step8Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              step8PartWholeOptions
                ? renderStep8WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step9Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              step9ObjectStoryOptions
                ? renderStep9WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step10Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              step10EqualSharingOptions
                ? renderStep10WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step11Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              step11CountingSequenceOptions
                ? renderStep11WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step12Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              step12ReadWriteOrderOptions
                ? renderStep12WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step13Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              step13SkipCountingOptions
                ? renderStep13WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step16Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              step16RenameTwoDigitOptions
                ? renderStep16WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step17Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              step17AddSubtractWithin20Options
                ? renderStep17WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step18Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              step18SupportedAddSubtractOptions
                ? renderStep18WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step19Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              step19EqualGroupsArraysOptions
                ? renderStep19WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step20Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              step20HalvesQuartersSharingOptions
                ? renderStep20WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step21Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              step21LargeNumberCompareOptions
                ? renderStep21WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step22Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              step22HundredsTensOnesOptions
                ? renderStep22WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step23Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              step23PartitionRegroupOptions
                ? renderStep23WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step24Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              step24ZeroPlaceholderOptions
                ? renderStep24WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step25Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              step25PlaceValueAddSubtractOptions
                ? renderStep25WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step26Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              step26MultiplicationFactsOptions
                ? renderStep26WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step27Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              step27ArraysGroupingKnownFactsOptions
                ? renderStep27WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step28Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              step28EstimateReasonablenessOptions
                ? renderStep28WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step29Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              step29UnitSimpleFractionsOptions
                ? renderStep29WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step30Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              step30PracticalMoneyOptions
                ? renderStep30WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step31Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              step31ExtendedPlaceValueOptions
                ? renderStep31WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step32Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              step32RoundEstimateLargerNumbersOptions
                ? renderStep32WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step33Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              step33DecimalPlaceValueOptions
                ? renderStep33WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step34Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              step34CompareOrderDecimalsOptions
                ? renderStep34WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step35Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              step35EquivalentFractionsOptions
                ? renderStep35WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step36Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              step36FractionAddSubtractOptions
                ? renderStep36WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step37Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              step37EfficientStrategiesOptions
                ? renderStep37WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step38Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              !step37Visual &&
              step38RemaindersContextOptions
                ? renderStep38WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step39Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              !step37Visual &&
              !step38Visual &&
              step39FractionDecimalPercentOptions
                ? renderStep39WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step40Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              !step37Visual &&
              !step38Visual &&
              !step39Visual &&
              step40FinancialModellingOptions
                ? renderStep40WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step41Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              !step37Visual &&
              !step38Visual &&
              !step39Visual &&
              !step40Visual &&
              step41FlexibleNumberFormsOptions
                ? renderStep41WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step42Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              !step37Visual &&
              !step38Visual &&
              !step39Visual &&
              !step40Visual &&
              !step41Visual &&
              step42NegativeNumberLineOptions
                ? renderStep42WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step44Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              !step37Visual &&
              !step38Visual &&
              !step39Visual &&
              !step40Visual &&
              !step41Visual &&
              !step42Visual &&
              step44PowersRootsOptions
                ? renderStep44WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step45Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              !step37Visual &&
              !step38Visual &&
              !step39Visual &&
              !step40Visual &&
              !step41Visual &&
              !step42Visual &&
              !step44Visual &&
              step45RatioRatesOptions
                ? renderStep45WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step46Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              !step37Visual &&
              !step38Visual &&
              !step39Visual &&
              !step40Visual &&
              !step41Visual &&
              !step42Visual &&
              !step44Visual &&
              !step45Visual &&
              step46ProportionalReasoningOptions
                ? renderStep46WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step48Visual =
              !shapeVisual &&
              !statisticsVisual &&
              !step2Visual &&
              !step3Visual &&
              !step4Visual &&
              !step6Visual &&
              !step7Visual &&
              !step8Visual &&
              !step9Visual &&
              !step10Visual &&
              !step11Visual &&
              !step12Visual &&
              !step13Visual &&
              !step16Visual &&
              !step17Visual &&
              !step18Visual &&
              !step19Visual &&
              !step20Visual &&
              !step21Visual &&
              !step22Visual &&
              !step23Visual &&
              !step24Visual &&
              !step25Visual &&
              !step26Visual &&
              !step27Visual &&
              !step28Visual &&
              !step29Visual &&
              !step30Visual &&
              !step31Visual &&
              !step32Visual &&
              !step33Visual &&
              !step34Visual &&
              !step35Visual &&
              !step36Visual &&
              !step37Visual &&
              !step38Visual &&
              !step39Visual &&
              !step40Visual &&
              !step41Visual &&
              !step42Visual &&
              !step44Visual &&
              !step45Visual &&
              !step46Visual &&
              step48EstimationBoundsOptions
                ? renderStep48WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const visualOption =
              shapeVisual ??
              statisticsVisual ??
              step2Visual ??
              step3Visual ??
              step4Visual ??
              step6Visual ??
              step7Visual ??
              step8Visual ??
              step9Visual ??
              step10Visual ??
              step11Visual ??
              step12Visual ??
              step13Visual ??
              step16Visual ??
              step17Visual ??
              step18Visual ??
              step19Visual ??
              step20Visual ??
              step21Visual ??
              step22Visual ??
              step23Visual ??
              step24Visual ??
              step25Visual ??
              step26Visual ??
              step27Visual ??
              step28Visual ??
              step29Visual ??
              step30Visual ??
              step31Visual ??
              step32Visual ??
              step33Visual ??
              step34Visual ??
              step35Visual ??
              step36Visual ??
              step37Visual ??
              step38Visual ??
              step39Visual ??
              step40Visual ??
              step41Visual ??
              step42Visual ??
              step44Visual ??
              step45Visual ??
              step46Visual ??
              step48Visual;

            return (
              <button
                key={option}
                type="button"
                onClick={() => updateResponse(currentItem.id, option)}
                style={{
                  ...optionButtonStyle,
                  border: isSelected ? "2px solid #1d4ed8" : optionButtonStyle.border,
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  boxShadow: isSelected
                    ? "0 10px 22px rgba(59,130,246,0.14)"
                    : "none",
                  alignItems:
                    visualOption
                      ? "center"
                      : optionButtonStyle.alignItems,
                  justifyContent:
                    visualOption ? "center" : undefined,
                  minHeight:
                    step2Visual ||
                    step3Visual ||
                    step4Visual ||
                    step6Visual ||
                    step7Visual ||
                    step8Visual ||
                    step9Visual ||
                    step10Visual ||
                    step11Visual ||
                    step12Visual ||
                    step13Visual ||
                    step16Visual ||
                    step17Visual ||
                    step18Visual ||
                    step19Visual ||
                    step20Visual ||
                    step21Visual ||
                    step22Visual ||
                    step23Visual ||
                    step24Visual ||
                    step25Visual ||
                    step26Visual ||
                    step27Visual ||
                    step28Visual ||
                    step29Visual ||
                    step30Visual ||
                    step31Visual ||
                    step32Visual ||
                    step33Visual ||
                    step34Visual ||
                    step35Visual ||
                    step36Visual ||
                    step37Visual ||
                    step38Visual ||
                    step39Visual ||
                    step40Visual ||
                    step41Visual ||
                    step42Visual ||
                    step44Visual ||
                    step45Visual ||
                    step46Visual ||
                    step48Visual
                      ? 150
                      : statisticsVisual
                        ? 70
                        : undefined,
                  padding:
                    step2Visual ||
                    step3Visual ||
                    step4Visual ||
                    step6Visual ||
                    step7Visual ||
                    step8Visual ||
                    step9Visual ||
                    step10Visual ||
                    step11Visual ||
                    step12Visual ||
                    step13Visual ||
                    step16Visual ||
                    step17Visual ||
                    step18Visual ||
                    step19Visual ||
                    step20Visual ||
                    step21Visual ||
                    step22Visual ||
                    step23Visual ||
                    step24Visual ||
                    step25Visual ||
                    step26Visual ||
                    step27Visual ||
                    step28Visual ||
                    step29Visual ||
                    step30Visual ||
                    step31Visual ||
                    step32Visual ||
                    step33Visual ||
                    step34Visual ||
                    step35Visual ||
                    step36Visual ||
                    step37Visual ||
                    step38Visual ||
                    step39Visual ||
                    step40Visual ||
                    step41Visual ||
                    step42Visual ||
                    step44Visual ||
                    step45Visual ||
                    step46Visual ||
                    step48Visual
                    ? 4
                    : statisticsVisual
                      ? "6px 4px"
                      : optionButtonStyle.padding,
                  borderRadius:
                    step2Visual ||
                    step3Visual ||
                    step4Visual ||
                    step6Visual ||
                    step7Visual ||
                    step8Visual ||
                    step9Visual ||
                    step10Visual ||
                    step11Visual ||
                    step12Visual ||
                    step13Visual ||
                    step16Visual ||
                    step17Visual ||
                    step18Visual ||
                    step19Visual ||
                    step20Visual ||
                    step21Visual ||
                    step22Visual ||
                    step23Visual ||
                    step24Visual ||
                    step25Visual ||
                    step26Visual ||
                    step27Visual ||
                    step28Visual ||
                    step29Visual ||
                    step30Visual ||
                    step31Visual ||
                    step32Visual ||
                    step33Visual ||
                    step34Visual ||
                    step35Visual ||
                    step36Visual ||
                    step37Visual ||
                    step38Visual ||
                    step39Visual ||
                    step40Visual ||
                    step41Visual ||
                    step42Visual ||
                    step44Visual ||
                    step45Visual ||
                    step46Visual ||
                    step48Visual
                    ? 18
                    : statisticsVisual
                      ? 12
                      : optionButtonStyle.borderRadius,
                  lineHeight:
                    statisticsVisual ||
                    step2Visual ||
                    step3Visual ||
                    step4Visual ||
                    step6Visual ||
                    step7Visual ||
                    step8Visual ||
                    step9Visual ||
                    step10Visual ||
                    step11Visual ||
                    step12Visual ||
                    step13Visual ||
                    step16Visual ||
                    step17Visual ||
                    step18Visual ||
                    step19Visual ||
                    step20Visual ||
                    step21Visual ||
                    step22Visual ||
                    step23Visual ||
                    step24Visual ||
                    step25Visual ||
                    step26Visual ||
                    step27Visual ||
                    step28Visual ||
                    step29Visual ||
                    step30Visual ||
                    step31Visual ||
                    step32Visual ||
                    step33Visual ||
                    step34Visual ||
                    step35Visual ||
                    step36Visual ||
                    step37Visual ||
                    step38Visual ||
                    step39Visual ||
                    step40Visual ||
                    step41Visual ||
                    step42Visual ||
                    step44Visual ||
                    step45Visual ||
                    step46Visual ||
                    step48Visual
                      ? 1.15
                      : optionButtonStyle.lineHeight,
                  position:
                    statisticsVisual ||
                    step2Visual ||
                    step3Visual ||
                    step4Visual ||
                    step6Visual ||
                    step7Visual ||
                    step8Visual ||
                    step9Visual ||
                    step10Visual ||
                    step11Visual ||
                    step12Visual ||
                    step13Visual ||
                    step16Visual ||
                    step17Visual ||
                    step18Visual ||
                    step19Visual ||
                    step20Visual ||
                    step21Visual ||
                    step22Visual ||
                    step23Visual ||
                    step24Visual ||
                    step25Visual ||
                    step26Visual ||
                    step27Visual ||
                    step28Visual ||
                    step29Visual ||
                    step30Visual ||
                    step31Visual ||
                    step32Visual ||
                    step33Visual ||
                    step34Visual ||
                    step35Visual ||
                    step36Visual ||
                    step37Visual ||
                    step38Visual ||
                    step39Visual ||
                    step40Visual ||
                    step41Visual ||
                    step42Visual ||
                    step44Visual ||
                    step45Visual ||
                    step46Visual ||
                    step48Visual
                      ? "relative"
                      : undefined,
                }}
              >
                {visualOption ?? <span>{option}</span>}
                {(statisticsVisual ||
                  step2Visual ||
                  step3Visual ||
                  step4Visual ||
                  step6Visual ||
                  step7Visual ||
                  step8Visual ||
                  step9Visual ||
                  step10Visual ||
                  step11Visual ||
                  step12Visual ||
                  step13Visual ||
                  step16Visual ||
                  step17Visual ||
                  step18Visual ||
                  step19Visual ||
                  step20Visual ||
                  step21Visual ||
                  step22Visual ||
                  step23Visual ||
                  step24Visual ||
                  step25Visual ||
                  step26Visual ||
                  step27Visual ||
                  step28Visual ||
                  step29Visual ||
                  step30Visual ||
                  step31Visual ||
                  step32Visual ||
                  step33Visual ||
                  step34Visual ||
                  step35Visual ||
                  step36Visual ||
                  step37Visual ||
                  step38Visual ||
                  step39Visual ||
                  step40Visual ||
                  step41Visual ||
                  step42Visual ||
                  step44Visual ||
                  step45Visual ||
                  step46Visual ||
                  step48Visual) &&
                isSelected ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      border: "1px solid #bfdbfe",
                      background: "#dbeafe",
                      color: "#1d4ed8",
                      borderRadius: 999,
                      padding: "2px 5px",
                      fontSize: 9,
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    Selected
                  </span>
                ) : isSelected ? (
                  <span
                    style={{
                      ...chipBaseStyle,
                      border: "1px solid #bfdbfe",
                      background: "#dbeafe",
                      color: "#1d4ed8",
                      flexShrink: 0,
                    }}
                  >
                    Selected
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      );
    }

    if (currentItem.answerType === "multi_select") {
      const selectedOptionIds = Array.isArray(structuredResponse.selectedOptionIds)
        ? structuredResponse.selectedOptionIds.map((value) => String(value))
        : [];

      return (
        <div style={{ display: "grid", gap: 10 }}>
          {getStructuredOptions(currentItem).map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);
            const nextSelectedOptionIds = isSelected
              ? selectedOptionIds.filter((id) => id !== option.id)
              : [...selectedOptionIds, option.id];

            return renderStructuredOptionButton({
              option,
              isSelected,
              onClick: () =>
                updateStructuredResponse(currentItem.id, {
                  selectedOptionIds: nextSelectedOptionIds,
                }),
            });
          })}
        </div>
      );
    }

    if (
      currentItem.answerType === "short_answer" ||
      currentItem.answerType === "numeric" ||
      currentItem.answerType === "short_symbolic"
    ) {
      return (
        <input
          type="text"
          value={currentResponse.response}
          onChange={(event) => updateResponse(currentItem.id, event.target.value)}
          placeholder={
            currentItem.answerType === "numeric"
              ? "Enter a numeric answer"
              : currentItem.answerType === "short_symbolic"
                ? "Enter a symbolic answer"
                : "Enter a short response"
          }
          style={inputStyle}
        />
      );
    }

    if (currentItem.answerType === "matching") {
      const matches =
        structuredResponse.matches &&
        typeof structuredResponse.matches === "object" &&
        !Array.isArray(structuredResponse.matches)
          ? (structuredResponse.matches as Record<string, string>)
          : {};
      const matchOptions =
        currentItem.structuredOptions?.map((option) => option.label) ??
        Array.from(new Set((currentItem.matchingPairs ?? []).map((pair) => pair.correctMatch)));

      return (
        <div style={{ display: "grid", gap: 10 }}>
          {(currentItem.matchingPairs ?? []).map((pair) => (
            <label
              key={pair.prompt}
              style={{ display: "grid", gap: 6, color: "#0f172a", fontWeight: 700 }}
            >
              <span>{pair.prompt}</span>
              <select
                value={matches[pair.prompt] ?? ""}
                onChange={(event) =>
                  updateStructuredResponse(currentItem.id, {
                    matches: {
                      ...matches,
                      [pair.prompt]: event.target.value,
                    },
                  })
                }
                style={inputStyle}
              >
                <option value="">Choose a match</option>
                {matchOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      );
    }

    if (currentItem.answerType === "ordering") {
      const responseOrder = Array.isArray(structuredResponse.order)
        ? structuredResponse.order.map((value) => String(value))
        : [];
      const order = responseOrder.length ? responseOrder : currentItem.orderingItems ?? [];

      function moveItem(index: number, direction: -1 | 1) {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= order.length) return;

        const nextOrder = [...order];
        const current = nextOrder[index];
        nextOrder[index] = nextOrder[nextIndex];
        nextOrder[nextIndex] = current;
        updateStructuredResponse(currentItem.id, { order: nextOrder });
      }

      return (
        <div style={{ display: "grid", gap: 10 }}>
          {order.map((item, index) => (
            <div
              key={`${item}-${index}`}
              style={{
                ...optionButtonStyle,
                cursor: "default",
              }}
            >
              <span>
                {index + 1}. {item}
              </span>
              <span style={{ display: "inline-flex", gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  style={index === 0 ? disabledButtonStyle : secondaryButtonStyle}
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === order.length - 1}
                  style={
                    index === order.length - 1
                      ? disabledButtonStyle
                      : secondaryButtonStyle
                  }
                >
                  Down
                </button>
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (currentItem.answerType === "classification") {
      const classifications =
        structuredResponse.classifications &&
        typeof structuredResponse.classifications === "object" &&
        !Array.isArray(structuredResponse.classifications)
          ? (structuredResponse.classifications as Record<string, string>)
          : {};

      return (
        <div style={{ display: "grid", gap: 10 }}>
          {(currentItem.classificationItems ?? []).map((classificationItem) => (
            <label
              key={classificationItem.id}
              style={{ display: "grid", gap: 6, color: "#0f172a", fontWeight: 700 }}
            >
              <span>{classificationItem.label}</span>
              <select
                value={classifications[classificationItem.id] ?? ""}
                onChange={(event) =>
                  updateStructuredResponse(currentItem.id, {
                    classifications: {
                      ...classifications,
                      [classificationItem.id]: event.target.value,
                    },
                  })
                }
                style={inputStyle}
              >
                <option value="">Choose a category</option>
                {(currentItem.classificationCategories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      );
    }

    if (
      currentItem.answerType === "select_correct_working" ||
      currentItem.answerType === "choose_best_explanation"
    ) {
      const selectedOptionId = String(structuredResponse.selectedOptionId ?? "");

      return (
        <div style={{ display: "grid", gap: 10 }}>
          {getStructuredOptions(currentItem).map((option) =>
            renderStructuredOptionButton({
              option,
              isSelected: selectedOptionId === option.id,
              onClick: () =>
                updateStructuredResponse(currentItem.id, {
                  selectedOptionId: option.id,
                }),
            }),
          )}
        </div>
      );
    }

    if (currentItem.answerType === "fill_gap") {
      return (
        <div style={{ display: "grid", gap: 10 }}>
          {currentItem.gapText ? (
            <div style={{ color: "#334155", lineHeight: 1.6 }}>
              {currentItem.gapText}
            </div>
          ) : null}
          <input
            type="text"
            value={String(structuredResponse.gapResponse ?? "")}
            onChange={(event) =>
              updateStructuredResponse(currentItem.id, {
                gapResponse: event.target.value,
              })
            }
            placeholder="Enter the missing value"
            style={inputStyle}
          />
        </div>
      );
    }

    if (currentItem.answerType === "true_false_correction") {
      const booleanAnswer = structuredResponse.booleanAnswer;
      const correction = String(structuredResponse.correction ?? "");
      const correctionRequired = booleanAnswer === false;

      return (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ color: "#334155", lineHeight: 1.6 }}>
            {currentItem.trueFalseStatement || currentItem.prompt}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { label: "True", value: true },
              { label: "False", value: false },
            ].map((option) => {
              const isSelected = booleanAnswer === option.value;

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() =>
                    updateStructuredResponse(currentItem.id, {
                      booleanAnswer: option.value,
                      correction: option.value ? "" : correction,
                    })
                  }
                  style={{
                    ...secondaryButtonStyle,
                    border: isSelected
                      ? "2px solid #1d4ed8"
                      : secondaryButtonStyle.border,
                    background: isSelected ? "#eff6ff" : "#ffffff",
                    color: isSelected ? "#1d4ed8" : "#0f172a",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {correctionRequired && currentItem.correctionOptions?.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Choose the correction</div>
              {currentItem.correctionOptions.map((option) =>
                renderStructuredOptionButton({
                  option: { id: option, label: option, value: option },
                  isSelected: correction === option,
                  onClick: () =>
                    updateStructuredResponse(currentItem.id, {
                      booleanAnswer,
                      correction: option,
                    }),
                }),
              )}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div
          style={{
            color: "#475569",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          This response can be reviewed by an adult.
        </div>
        <textarea
          value={currentResponse.response}
          onChange={(event) => updateResponse(currentItem.id, event.target.value)}
          placeholder="Write the response here. The learner can explain in their own words."
          style={textareaStyle}
        />
      </div>
    );
  }

  function goBack() {
    setShowSummary(false);
    setCurrentIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    if (!currentItem) {
      return;
    }

    if (incomingStepAssessment && !currentResponse.submitted) {
      if (!hasEnteredResponse(currentResponse)) {
        return;
      }

      const submittedAt = new Date().toISOString();
      setResponses((current) => ({
        ...current,
        [currentItem.id]: {
          itemId: currentItem.id,
          response: currentResponse.response,
          submitted: true,
          result: getCheckResult(currentItem, currentResponse.response),
          submittedAt,
        },
      }));
    }

    if (currentIndex >= totalItems - 1) {
      setShowSummary(true);
      setSessionMode("summary");
      return;
    }
    setCurrentIndex((value) => Math.min(totalItems - 1, value + 1));
  }

  function resetPreview() {
    resetAssessmentState();
    setSessionMode("active");
  }

  async function saveAssessmentAttempt() {
    if (saveState === "saving" || saveState === "saved") {
      return;
    }

    if (!canSaveAttempt) {
      setSaveState("idle");
      return;
    }

    setSaveState("saving");
    setSaveMessage("");

    try {
      const completedAt = new Date().toISOString();
      const summarySnapshot: CleanAssessmentAttemptSnapshot = {
        attemptedCount: summary.attemptedCount,
        correctCount: summary.correctCount,
        incorrectCount: summary.incorrectCount,
        notSureCount: summary.notSureCount,
        reviewNeededCount: summary.reviewNeededCount,
        unansweredCount: summary.unansweredCount,
        enteredButUncheckedCount: summary.enteredButUncheckedCount,
        subElementMastery: summary.subElementMastery,
        targetedPracticeRecommendation: summary.targetedPracticeRecommendation,
        topMisconceptionTargets: summary.topMisconceptionTargets,
        topPracticeRecommendations: summary.topPracticeRecommendations,
        suggestedFocusAreas: summary.suggestedFocusAreas,
        suggestedNextStep: summary.suggestedNextStep,
        parentJudgementPrompt: summary.parentJudgementPrompt,
        parentJudgementPreview: parentJudgement,
        prototypeMetadata: {
          bankKey: selectedBank.key,
          bankTitle: selectedBank.title,
          stepAssessmentKey: incomingStepAssessment?.key ?? null,
          stepAssessmentTitle: incomingStepAssessment?.title ?? null,
          stepTitle: incomingStepAssessment?.title ?? null,
          assessmentDepth: incomingStepAssessment ? assessmentDepth : null,
          itemCount: totalItems,
          autoCheckStatus: incomingStepAssessment
            ? getNumberStepAssessmentStatus(summary.correctCount, totalItems)
            : null,
          parentFamilyTitle: activeAssessmentContext.parentFamilyTitle,
          parentItemBankKey: activeAssessmentContext.itemBankKey,
          strandKey: activeAssessmentContext.strandKey,
          sourceRoute: activeAssessmentContext.sourceRoute,
          pathwayStepIdMode: "temporary-stable-key",
          learnerLabel: getLearnerLabel(selectedLearner) || null,
        },
      };

      const createdAttempt = await createAssessmentAttempt(familyId, {
        learnerId,
        subjectKey: activeAssessmentContext.subjectKey,
        strandKey: activeAssessmentContext.strandKey,
        stageKey: activeAssessmentContext.stageKey,
        pathwayStepId: activeAssessmentContext.pathwayStepId,
        stepKey: activeAssessmentContext.stepKey,
        progressionBandKey: activeAssessmentContext.progressionBandKey,
        itemBankKey: activeAssessmentContext.itemBankKey,
        mode: "diagnostic",
        sourceRoute: activeAssessmentContext.sourceRoute,
        status: "completed",
        itemCount: totalItems,
        attemptedCount: summary.attemptedCount,
        autoCorrectCount: summary.correctCount,
        autoIncorrectCount: summary.incorrectCount,
        reviewNeededCount: summary.reviewNeededCount,
        summarySnapshot,
        startedAt: sessionStartedAtValue,
        completedAt,
      });

      const responseInputs: CreateCleanAssessmentAttemptResponseInput[] = items.map(
        (item, index) => {
          const response = responses[item.id] ?? createEmptyResponse(item.id);
          const normalizedResponse = response.response.trim();
          const responseTextForSave = isNotSureResponse(normalizedResponse)
            ? "Not sure"
            : normalizedResponse || null;

          return {
            itemId: item.id,
            itemOrder: index + 1,
            progressionStepKey: item.progressionStepKey,
            answerType: item.answerType,
            localResult: getPersistedLocalResult(item, response),
            responseText: responseTextForSave,
            selectedOption: getSelectedOptionForSave(item, normalizedResponse),
            itemSnapshot: buildItemSnapshot(item),
            submittedAt: response.submittedAt,
          };
        },
      );

      await createAssessmentAttemptResponses(familyId, {
        learnerId,
        assessmentAttemptId: createdAttempt.id,
        responses: responseInputs,
      });

      setSaveState("saved");
      setSaveMessage(
        "Assessment attempt saved. This saved the attempt history only. It did not update confidence, pathway progress, evidence, or reports.",
      );
    } catch (error) {
      setSaveState("failed");
      setSaveMessage(
        error instanceof Error
          ? `Assessment result could not be saved yet. ${error.message}`
          : "Assessment result could not be saved yet. Please try again before leaving this page.",
      );
    }
  }

  useEffect(() => {
    saveAssessmentAttemptRef.current = saveAssessmentAttempt;
  });

  useEffect(() => {
    if (!incomingStepAssessment || sessionMode !== "summary" || !showSummary) {
      return;
    }

    if (!canSaveAttempt || saveState === "saving" || saveState === "saved") {
      return;
    }

    if (exactStepAutoSaveStartedRef.current) {
      return;
    }

    exactStepAutoSaveStartedRef.current = true;
    const timerId = window.setTimeout(() => {
      void saveAssessmentAttemptRef.current?.();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [
    canSaveAttempt,
    incomingStepAssessment,
    saveState,
    sessionMode,
    showSummary,
  ]);

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        {sessionMode === "launcher" ? <CleanWorkflowRibbon /> : null}

        {sessionMode === "launcher" ? (
          <section style={launcherShellStyle}>
            <div style={launcherHeaderStyle}>
              <div style={eyebrowStyle}>MyLearna Assessment</div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(30px, 5vw, 44px)",
                  lineHeight: 1.05,
                  color: "#0f172a",
                }}
              >
                {incomingStepAssessment ? "Step assessment" : "Number assessment"}
              </h1>
              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  fontSize: 17,
                  lineHeight: 1.65,
                  maxWidth: 720,
                }}
              >
                {incomingStepAssessment
                  ? "Choose a check depth, then enter a focused step-level assessment."
                  : "Choose an assessment focus, then enter a focused session with 12 Number questions and a saveable attempt summary."}
              </p>
            </div>

            <div style={launcherBodyStyle}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={eyebrowStyle}>
                  {incomingStepAssessment
                    ? "Exact pathway step assessment"
                    : "Choose an assessment focus"}
                </div>
                {hasIncomingNumberContext && !incomingStepAssessment ? (
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>
                      {incomingBank
                        ? `No exact step assessment yet. Showing the closest Number assessment family: ${incomingBank.shortTitle}.`
                        : "Choose a Number focus to start an automatically checked assessment."}
                    </strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                      This assessment can save an automatically checked attempt. It does not update
                      confidence, portfolio evidence, reports, curriculum coverage, or pathway
                      progress automatically.
                    </p>
                  </div>
                ) : null}
                {!incomingStepAssessment ? assessmentBankGroups.map((group) => (
                  <div key={group.label} style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        color: "#334155",
                        fontSize: 14,
                        fontWeight: 800,
                        lineHeight: 1.4,
                      }}
                    >
                      {group.label}
                    </div>
                    <div style={focusGridStyle}>
                      {group.banks.map((bank) => {
                        const isSelected = bank.key === selectedBank.key;

                        return (
                          <button
                            key={bank.key}
                            type="button"
                            onClick={() => {
                              setSelectedBankKey(bank.key);
                              resetAssessmentState();
                            }}
                            aria-pressed={isSelected}
                            style={{
                              display: "grid",
                              gap: 8,
                              textAlign: "left",
                              borderRadius: 16,
                              border: isSelected
                                ? "2px solid #1d4ed8"
                                : "1px solid #dbe4f0",
                              background: isSelected ? "#eff6ff" : "#ffffff",
                              padding: 16,
                              cursor: "pointer",
                              boxShadow: isSelected
                                ? "0 14px 28px rgba(59,130,246,0.14)"
                                : "0 8px 20px rgba(15,23,42,0.04)",
                            }}
                          >
                            <span
                              style={{
                                color: isSelected ? "#1d4ed8" : "#0f172a",
                                fontSize: 16,
                                fontWeight: 800,
                              }}
                            >
                              {bank.shortTitle}
                            </span>
                            <span
                              style={{
                                color: "#64748b",
                                fontSize: 13,
                                lineHeight: 1.5,
                              }}
                            >
                              {bank.yearBandLabel} - {bank.items.length} items
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )) : null}
              </div>

              <div
                style={{
                  ...highlightCardStyle,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={eyebrowStyle}>Selected focus</div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      fontSize: "clamp(22px, 3vw, 30px)",
                      lineHeight: 1.15,
                    }}
                  >
                    {incomingStepAssessment?.title ?? selectedBank.title}
                  </h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    {incomingStepAssessment?.description ?? selectedBank.description}
                  </p>
                  {incomingStepAssessment ? (
                    <>
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        Part of: <strong>{incomingStepAssessment.parentBankTitle}</strong>
                      </div>
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        Stage:{" "}
                        <strong>{getStageLabel(incomingStepAssessment.stageKey)}</strong>
                      </div>
                      <div style={eyebrowStyle}>Choose check depth</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS.map((option) => {
                          const selected = assessmentDepth === option.key;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => {
                                setAssessmentDepth(option.key);
                                resetAssessmentState();
                              }}
                              style={{
                                border: selected
                                  ? "2px solid #1d4ed8"
                                  : "1px solid #cbd5e1",
                                background: selected ? "#eff6ff" : "#ffffff",
                                color: selected ? "#1d4ed8" : "#0f172a",
                                borderRadius: 12,
                                padding: "10px 12px",
                                cursor: "pointer",
                                fontWeight: 800,
                              }}
                            >
                              {option.label} - {option.description}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span style={getDifficultyTone("foundation")}>
                      {incomingStepAssessment
                        ? getStageLabel(incomingStepAssessment.stageKey)
                        : selectedBank.yearBandLabel}
                    </span>
                    <span style={getFormatTone("reasonableness")}>
                      {totalItems} {incomingStepAssessment ? "questions" : "items"}
                    </span>
                    <span style={getFormatTone("applied_context")}>
                      Diagnostic attempt
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => startAssessment()}
                  style={{
                    ...buttonStyle,
                    minHeight: 46,
                    whiteSpace: "nowrap",
                  }}
                >
                  Start assessment
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section style={sessionShellStyle}>
            <div style={sessionHeaderStyle}>
              <div style={assessmentTopBarStyle}>
                <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                  <div style={eyebrowStyle}>MyLearna Assessment</div>
                  <div
                    style={{
                      color: "#0f172a",
                      fontSize: "clamp(18px, 3vw, 24px)",
                      fontWeight: 850,
                      lineHeight: 1.15,
                    }}
                  >
                    {incomingStepAssessment?.title ?? selectedBank.title}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <span style={getDifficultyTone("foundation")}>
                    {incomingStepAssessment
                      ? getStageLabel(incomingStepAssessment.stageKey)
                      : selectedBank.yearBandLabel}
                  </span>
                  <span
                    style={{
                      ...chipBaseStyle,
                      border: "1px solid #dbe4f0",
                      background: "#ffffff",
                      color: "#0f172a",
                    }}
                  >
                    {sessionMode === "summary"
                      ? "Summary"
                      : `Item ${currentIndex + 1} of ${totalItems}`}
                  </span>
                  <button
                    type="button"
                    onClick={exitAssessment}
                    style={secondaryButtonStyle}
                  >
                    Exit assessment
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {showSummary
                    ? `Assessment summary - ${
                        incomingStepAssessment?.shortTitle ?? selectedBank.shortTitle
                      }`
                    : `Item ${currentIndex + 1} of ${totalItems}`}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span
                    style={{
                      ...chipBaseStyle,
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      color: "#475569",
                    }}
                  >
                    Attempted {summary.attemptedCount}
                  </span>
                  <span
                    style={
                      saveState === "saved"
                        ? getResultTone("correct")
                        : getResultTone("review_needed")
                    }
                  >
                    {saveState === "saved" ? "Saved" : "Not saved yet"}
                  </span>
                  {!showSummary && currentResponse.submitted ? (
                    <span
                      style={
                        incomingStepAssessment
                          ? {
                              ...chipBaseStyle,
                              border: "1px solid #bfdbfe",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                            }
                          : getResultTone(currentResponse.result)
                      }
                    >
                      {incomingStepAssessment
                        ? "Answer saved"
                        : getResultLabel(currentResponse.result)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div style={progressTrackStyle}>
                <div
                  style={{
                    width: `${sessionProgress}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #60a5fa, #34d399)",
                  }}
                />
              </div>
            </div>
          </div>

          {showSummary ? (
            <div style={sessionBodyStyle}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
                  gap: 10,
                }}
              >
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Total items</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
                    {totalItems}
                  </div>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>
                    {incomingStepAssessment ? "Answered or Not sure" : "Attempted"}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
                    {summary.attemptedCount}
                  </div>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Correct</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#166534" }}>
                    {summary.correctCount}
                  </div>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>
                    {incomingStepAssessment ? "Needs support signal" : "Worth revisiting"}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#b45309" }}>
                    {summary.incorrectCount}
                  </div>
                </div>
                {incomingStepAssessment ? (
                  <div style={compactCardStyle}>
                    <div style={eyebrowStyle}>Not sure</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#b45309" }}>
                      {summary.notSureCount}
                    </div>
                  </div>
                ) : (
                  <div style={compactCardStyle}>
                    <div style={eyebrowStyle}>Needs adult review</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#4338ca" }}>
                      {summary.reviewNeededCount}
                    </div>
                  </div>
                )}
                {incomingStepAssessment && summary.unansweredCount ? (
                  <div style={compactCardStyle}>
                    <div style={eyebrowStyle}>Not enough evidence yet</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#475569" }}>
                      {summary.unansweredCount}
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={highlightCardStyle}>
                <div style={eyebrowStyle}>
                  {incomingStepAssessment ? "Skill check results" : "Sub-element mastery"}
                </div>
                {incomingStepAssessment ? (
                  <div style={{ color: "#334155", lineHeight: 1.6 }}>
                    Auto-check result:{" "}
                    <strong>
                      {summary.unansweredCount
                        ? "Assessment incomplete"
                        : getNumberStepAssessmentStatus(summary.correctCount, totalItems)}
                    </strong>
                    . Confidence has not been changed automatically.
                  </div>
                ) : null}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 10,
                  }}
                >
                  {summary.subElementMastery.map((entry) => {
                    const supportLabels = [
                      entry.reviewNeededCount
                        ? "Review needed"
                        : "",
                      entry.unansweredCount
                        ? `${entry.unansweredCount} unanswered`
                        : "",
                    ].filter(Boolean);

                    return (
                      <div
                        key={entry.subElementKey}
                        style={{
                          ...compactCardStyle,
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            color: "#0f172a",
                            fontWeight: 800,
                            lineHeight: 1.3,
                          }}
                        >
                          {entry.subElementTitle}
                        </div>
                        <div
                          style={{
                            color: "#1e3a8a",
                            fontWeight: 800,
                            lineHeight: 1.4,
                          }}
                        >
                          {entry.correctCount}/{entry.totalCount} correct -{" "}
                          {entry.judgement}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 13 }}>
                          {entry.attemptedCount}/{entry.totalCount} attempted
                        </div>
                        {supportLabels.length ? (
                          <div
                            style={{
                              color: "#92400e",
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {supportLabels.join(" - ")}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {summary.targetedPracticeRecommendation ? (
                <div style={highlightCardStyle}>
                  <div style={eyebrowStyle}>
                    {incomingStepAssessment
                      ? "Suggested practice focus"
                      : "Recommended targeted practice"}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        color: "#0f172a",
                        fontSize: 18,
                        fontWeight: 800,
                        lineHeight: 1.3,
                      }}
                    >
                      {summary.targetedPracticeRecommendation.subElementTitle}
                    </div>
                    <div
                      style={{
                        color: "#1e3a8a",
                        fontWeight: 800,
                        lineHeight: 1.4,
                      }}
                    >
                      {summary.targetedPracticeRecommendation.correctCount}/
                      {summary.targetedPracticeRecommendation.totalCount} correct -{" "}
                      {summary.targetedPracticeRecommendation.judgement}
                    </div>
                    <div style={{ color: "#334155", lineHeight: 1.6 }}>
                      {summary.targetedPracticeRecommendation.message}
                    </div>
                    {summary.targetedPracticeRecommendation.practiceModuleTitle ? (
                      <div style={{ color: "#475569", lineHeight: 1.5 }}>
                        Related practice:{" "}
                        <strong>
                          {summary.targetedPracticeRecommendation.practiceModuleTitle}
                        </strong>
                        {summary.targetedPracticeRecommendation.practiceSectionTitle
                          ? ` - ${summary.targetedPracticeRecommendation.practiceSectionTitle}`
                          : ""}
                      </div>
                    ) : (
                      <div style={{ color: "#475569", lineHeight: 1.5 }}>
                        Practice module coming next for this focus.
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      {targetedPracticeHref ? (
                        <Link
                          href={targetedPracticeHref}
                          style={buttonStyle}
                        >
                          Start targeted practice
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          style={{
                            ...buttonStyle,
                            opacity: 0.62,
                            cursor: "not-allowed",
                          }}
                        >
                          Start targeted practice
                        </button>
                      )}
                      <span style={{ color: "#64748b", fontSize: 13 }}>
                        {summary.targetedPracticeRecommendation.status === "available"
                          ? "Opens the recommended practice section."
                          : "Practice module coming next."}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {incomingStepAssessment && exactStepPracticeHref ? (
                <div style={highlightCardStyle}>
                  <div style={eyebrowStyle}>Practise this skill</div>
                  <div style={{ color: "#0f172a", fontSize: 18, fontWeight: 800 }}>
                    {incomingStepAssessment.title}
                  </div>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Use the matching Step 1 practice to revisit quick-look dot cards
                    and same-quantity arrangements. Practice stays local-only.
                  </div>
                  <div>
                    <Link href={exactStepPracticeHref} style={buttonStyle}>
                      Practise this skill
                    </Link>
                  </div>
                </div>
              ) : null}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "stretch",
                }}
              >
                <div style={{ ...helperCardStyle, flex: "1 1 280px" }}>
                  <div style={eyebrowStyle}>What this may show</div>
                  {summary.topMisconceptionTargets.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {summary.topMisconceptionTargets.map((entry) => (
                        <span
                          key={entry.code}
                          style={{
                            ...chipBaseStyle,
                            border: "1px solid #e2e8f0",
                            background: "#ffffff",
                            color: "#0f172a",
                          }}
                        >
                          {entry.label} - {entry.count}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      No clear learning focus has appeared yet in this session.
                    </div>
                  )}
                </div>

                <div style={{ ...helperCardStyle, flex: "1 1 280px" }}>
                  <div style={eyebrowStyle}>Suggested focus areas</div>
                  {summary.suggestedFocusAreas.length ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      {summary.suggestedFocusAreas.map((focus) => (
                        <div
                          key={focus}
                          style={{ color: "#0f172a", lineHeight: 1.6 }}
                        >
                          {focus}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      Complete more items to build a clearer picture of the next
                      practice focus.
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "stretch",
                }}
              >
                <div style={{ ...helperCardStyle, flex: "1 1 320px" }}>
                  <div style={eyebrowStyle}>Suggested next practice</div>
                  {summary.topPracticeRecommendations.length ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      {summary.topPracticeRecommendations.map((entry) => (
                        <div
                          key={entry.recommendation}
                          style={{ color: "#0f172a", lineHeight: 1.6 }}
                        >
                          <strong>{entry.count}x</strong> {entry.recommendation}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      No suggested next practice yet. Submit a few items first.
                    </div>
                  )}
                </div>

                <div style={{ ...highlightCardStyle, flex: "1 1 360px" }}>
                  <div style={eyebrowStyle}>Suggested next step</div>
                  <div
                    style={{
                      color: "#0f172a",
                      lineHeight: 1.7,
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {summary.suggestedNextStep}
                  </div>
                </div>
              </div>

              <div style={compactCardStyle}>
                <div style={eyebrowStyle}>Parent judgement</div>
                <div style={{ color: "#64748b", lineHeight: 1.5, fontSize: 13 }}>
                  Local judgement only - not saved yet.
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  {summary.parentJudgementPrompt}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(
                    [
                      "secure",
                      "developing",
                      "needs_support",
                      "not_enough_evidence_yet",
                    ] as ParentJudgement[]
                  ).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setParentJudgement(option)}
                      style={getParentJudgementTone(
                        option,
                        parentJudgement === option,
                      )}
                    >
                      {getParentJudgementLabel(option)}
                    </button>
                  ))}
                </div>
                {parentJudgement ? (
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Current local judgement:{" "}
                    {getParentJudgementLabel(parentJudgement)}.
                  </div>
                ) : null}
              </div>

              <div style={helperCardStyle}>
                <div style={eyebrowStyle}>Next decisions</div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  This check is an assessment signal. Use it to inform confidence,
                  practise the recommended focus, or return to the pathway to capture
                  evidence if you want this learning included in the portfolio or reports.
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {returnTo && (!incomingStepAssessment || saveState === "saved") ? (
                    <Link href={returnTo} style={buttonStyle}>
                      Return to pathway step
                    </Link>
                  ) : incomingStepAssessment && returnTo ? (
                    <button type="button" disabled style={disabledButtonStyle}>
                      Return available after save
                    </button>
                  ) : null}
                  {exactStepPracticeHref ? (
                    <Link href={exactStepPracticeHref} style={secondaryButtonStyle}>
                      Practise this skill
                    </Link>
                  ) : null}
                  <Link href="/my-pathways" style={secondaryButtonStyle}>
                    Open My Pathways
                  </Link>
                  <CleanContentIssueReportButton
                    label="Report an issue with this assessment"
                    context={buildAssessmentIssueContext("summary")}
                  />
                </div>
              </div>

              <div style={highlightCardStyle}>
                <div style={eyebrowStyle}>
                  {incomingStepAssessment
                    ? "Assessment save"
                    : "Save assessment attempt"}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <span
                      style={
                        saveState === "saved"
                          ? getResultTone("correct")
                          : saveState === "saving"
                            ? getFormatTone("estimation")
                            : saveState === "failed"
                              ? getResultTone("incorrect")
                              : getResultTone("unanswered")
                      }
                    >
                      {saveState === "saved"
                        ? "Assessment saved"
                        : saveState === "saving"
                          ? "Saving assessment..."
                          : saveState === "failed"
                            ? "Save failed"
                            : incomingStepAssessment
                              ? "Waiting to save"
                              : "Not saved yet"}
                    </span>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      {saveMessage ||
                        saveBlockedMessage ||
                        (incomingStepAssessment
                          ? "This exact step result will save automatically so My Pathways can show the latest auto-check signal."
                          : "Save the completed session so the assessment attempt history can be reviewed later.")}
                    </div>
                    {!incomingStepAssessment && summary.enteredButUncheckedCount > 0 ? (
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        Some responses have been entered but not checked. They
                        will be saved as needing review.
                      </div>
                    ) : null}
                    <details
                      style={{
                        border: "1px solid #dbeafe",
                        borderRadius: 12,
                        background: "#ffffff",
                        padding: "10px 12px",
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "#1e3a8a",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        Save context details
                      </summary>
                      <div
                        style={{
                          marginTop: 8,
                          display: "grid",
                          gap: 6,
                          color: "#334155",
                          lineHeight: 1.6,
                        }}
                      >
                        <div>
                          <strong>Workspace:</strong>{" "}
                          {workspace.loading
                            ? "Checking workspace"
                            : workspace.profile
                              ? "Synced family workspace"
                              : "No synced family workspace"}
                        </div>
                        <div>
                          <strong>Active learner:</strong>{" "}
                          {selectedLearner ? getLearnerLabel(selectedLearner) : "Missing"}
                        </div>
                        <div>
                          <strong>Save status:</strong>{" "}
                          {saveState === "saved"
                            ? "Saved"
                            : saveState === "saving"
                              ? "Saving"
                              : canSaveAttempt
                                ? "Available"
                                : "Blocked"}
                        </div>
                      </div>
                    </details>
                  </div>

                  <button
                    type="button"
                    onClick={() => void saveAssessmentAttempt()}
                    disabled={Boolean(
                      !canSaveAttempt ||
                      saveState === "saving" ||
                      saveState === "saved" ||
                      (incomingStepAssessment && saveState !== "failed"),
                    )}
                    style={
                      !canSaveAttempt ||
                      saveState === "saving" ||
                      saveState === "saved" ||
                      (incomingStepAssessment && saveState !== "failed")
                        ? disabledButtonStyle
                        : buttonStyle
                    }
                  >
                    {saveState === "saved"
                      ? "Attempt saved"
                      : saveState === "saving"
                        ? "Saving attempt..."
                        : incomingStepAssessment && saveState === "failed"
                          ? "Retry save"
                          : incomingStepAssessment
                            ? "Auto-save pending"
                            : "Save assessment attempt"}
                  </button>
                </div>
              </div>

              <div style={actionBarStyle}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSummary(false);
                      setSessionMode("active");
                      setCurrentIndex(0);
                    }}
                    style={secondaryButtonStyle}
                  >
                    Review answers
                  </button>
                  <button
                    type="button"
                    onClick={chooseAnotherFocus}
                    style={secondaryButtonStyle}
                  >
                    Choose another focus
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    onClick={exitAssessment}
                    style={secondaryButtonStyle}
                  >
                    Exit assessment
                  </button>
                  <button type="button" onClick={resetPreview} style={buttonStyle}>
                    Restart assessment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={sessionBodyStyle}>
                <div style={workspaceLayoutStyle}>
                  <div style={workspaceCardStyle}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={eyebrowStyle}>Current question</div>
                      {!incomingStepAssessment ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          <span style={getDifficultyTone(currentItem.difficulty)}>
                            {currentItem.difficulty}
                          </span>
                          <span style={getFormatTone(currentItem.format)}>
                            {getFormatLabel(currentItem.format)}
                          </span>
                        </div>
                      ) : null}
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "clamp(28px, 4vw, 36px)",
                          color: "#0f172a",
                          lineHeight: 1.1,
                        }}
                      >
                        {currentItem.title}
                      </h2>
                      {incomingStepAssessment ? renderEarlyNumberVisual(currentItem) : null}
                      <p
                        style={{
                          margin: 0,
                          color: "#334155",
                          fontSize: 17,
                          lineHeight: 1.75,
                        }}
                      >
                        {currentItem.prompt}
                      </p>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={eyebrowStyle}>Response</div>

                      {renderResponseControl()}
                    </div>
                  </div>

                  <aside style={supportColumnStyle}>
                    {!incomingStepAssessment &&
                    currentItem.visualSupport &&
                    (currentItem.visualSupport.type !== "none" ||
                      currentItem.visualSupport.description) ? (
                      <div style={helperCardStyle}>
                        <div style={eyebrowStyle}>Helpful context</div>
                        <div style={{ color: "#0f172a", lineHeight: 1.6 }}>
                          {currentItem.visualSupport.description ||
                            "Use the context support to compare values before answering."}
                        </div>
                      </div>
                    ) : null}

                    {isOpenResponse(currentItem) &&
                    currentItem.openResponseReview &&
                    !currentResponse.submitted ? (
                      <div style={helperCardStyle}>
                        <div style={eyebrowStyle}>What a strong response includes</div>
                        <div
                          style={{ display: "grid", gap: 6, color: "#334155" }}
                        >
                          {currentItem.openResponseReview.successCriteria
                            .slice(0, 3)
                            .map((criterion) => (
                              <div key={criterion} style={{ lineHeight: 1.6 }}>
                                - {criterion}
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}

                    {!incomingStepAssessment ? (
                    <details
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 16,
                        padding: "10px 12px",
                        background: "#ffffff",
                      }}
                    >
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "#475569",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        More details
                      </summary>
                      <div
                        style={{
                          display: "grid",
                          gap: 6,
                          marginTop: 10,
                          color: "#475569",
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}
                      >
                        <div>
                          <strong>Focus:</strong> {getFocusLabel(currentItem)}
                        </div>
                        <div>
                          <strong>Response mode:</strong>{" "}
                          {getAnswerModeLabel(currentItem)}
                        </div>
                      </div>
                    </details>
                    ) : null}

                    {currentResponse.submitted ? (
                      <div style={compactCardStyle}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <div style={eyebrowStyle}>
                            {incomingStepAssessment ? "Response saved" : "Feedback"}
                          </div>
                          <span
                            style={
                              incomingStepAssessment
                                ? {
                                    ...chipBaseStyle,
                                    border: "1px solid #bfdbfe",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                  }
                                : getResultTone(currentResponse.result)
                            }
                          >
                            {incomingStepAssessment
                              ? "Saved"
                              : getResultLabel(currentResponse.result)}
                          </span>
                        </div>

                        <div style={{ color: "#0f172a", lineHeight: 1.6 }}>
                          {incomingStepAssessment
                            ? getAssessmentResultMessage(
                                currentResponse.result,
                                currentResponse.response,
                              )
                            : getResultMessage(currentResponse.result)}
                        </div>

                        {!incomingStepAssessment &&
                        currentItem.expectedAnswer &&
                        !isOpenResponse(currentItem) ? (
                          <div style={{ color: "#334155", lineHeight: 1.6 }}>
                            <strong>Expected answer:</strong>{" "}
                            {currentItem.expectedAnswer}
                          </div>
                        ) : null}

                        {!incomingStepAssessment && currentItem.workedSolution ? (
                          <div style={{ color: "#334155", lineHeight: 1.6 }}>
                            <strong>Worked solution:</strong>{" "}
                            {currentItem.workedSolution}
                          </div>
                        ) : null}

                        {!incomingStepAssessment && currentItem.markingGuide ? (
                          <div style={{ color: "#334155", lineHeight: 1.6 }}>
                            <strong>Marking guide:</strong>{" "}
                            {currentItem.markingGuide}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {isOpenResponse(currentItem) &&
                    currentItem.openResponseReview &&
                    currentResponse.submitted ? (
                      <div style={helperCardStyle}>
                        <div style={eyebrowStyle}>Adult review guide</div>
                        <div style={{ color: "#334155", lineHeight: 1.6 }}>
                          <strong>Expected response:</strong>{" "}
                          {currentItem.openResponseReview.expectedResponse}
                        </div>
                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ color: "#0f172a", fontWeight: 700 }}>
                            Success criteria
                          </div>
                          {currentItem.openResponseReview.successCriteria.map(
                            (criterion) => (
                              <div
                                key={criterion}
                                style={{ color: "#334155", lineHeight: 1.6 }}
                              >
                                - {criterion}
                              </div>
                            ),
                          )}
                        </div>
                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ color: "#0f172a", fontWeight: 700 }}>
                            Parent review prompts
                          </div>
                          {currentItem.openResponseReview.parentReviewPrompts.map(
                            (prompt) => (
                              <div
                                key={prompt}
                                style={{ color: "#334155", lineHeight: 1.6 }}
                              >
                                - {prompt}
                              </div>
                            ),
                          )}
                        </div>
                        {currentItem.openResponseReview.evidenceNote ? (
                          <div style={{ color: "#334155", lineHeight: 1.6 }}>
                            <strong>Evidence note:</strong>{" "}
                            {currentItem.openResponseReview.evidenceNote}
                          </div>
                        ) : null}
                        {currentItem.openResponseReview.aiReviewPrompt ? (
                          <details
                            style={{
                              border: "1px solid #dbeafe",
                              borderRadius: 12,
                              background: "#ffffff",
                              padding: "10px 12px",
                            }}
                          >
                            <summary
                              style={{
                                cursor: "pointer",
                                color: "#1e3a8a",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              Future AI support
                            </summary>
                            <div
                              style={{
                                marginTop: 8,
                                color: "#334155",
                                lineHeight: 1.6,
                              }}
                            >
                              Future AI review can use the typed response against
                              these success criteria, with the parent confirming the
                              final judgement.
                            </div>
                          </details>
                        ) : null}
                      </div>
                    ) : null}

                    {!incomingStepAssessment && currentResponse.submitted ? (
                      <div style={helperCardStyle}>
                        <div style={eyebrowStyle}>What this checks</div>
                        <div style={{ color: "#334155", lineHeight: 1.6 }}>
                          {currentItem.adaptiveRoute.diagnosticNote}
                        </div>
                        <div style={{ color: "#334155", lineHeight: 1.6 }}>
                          <strong>Possible learning focus:</strong>{" "}
                          {currentItem.misconceptionTargets
                            .map((code) => getMisconceptionLabel(code))
                            .join(", ")}
                        </div>
                        <div style={{ color: "#334155", lineHeight: 1.6 }}>
                          <strong>Suggested next practice:</strong>{" "}
                          {currentItem.adaptiveRoute.practiceRecommendation}
                        </div>
                      </div>
                    ) : null}
                  </aside>
                </div>
              </div>

              <div style={actionBarStyle}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={currentIndex === 0}
                    style={
                      currentIndex === 0 ? disabledButtonStyle : secondaryButtonStyle
                    }
                  >
                    Back
                  </button>
                  {currentItem ? (
                    <CleanContentIssueReportButton
                      context={buildAssessmentIssueContext(
                        "assessment",
                        currentItem,
                        currentResponse,
                      )}
                    />
                  ) : null}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    justifyContent: "flex-end",
                  }}
                >
                  {!incomingStepAssessment ? (
                    <button
                      type="button"
                      onClick={submitCurrentItem}
                      style={secondaryButtonStyle}
                    >
                      Check response
                    </button>
                  ) : null}
                  {incomingStepAssessment ? (
                    (() => {
                      const notSureSelected =
                        currentResponse.response === NOT_SURE_RESPONSE;

                      return (
                        <button
                          type="button"
                          onClick={markCurrentItemNotSure}
                          disabled={notSureSelected}
                          style={
                            notSureSelected
                              ? {
                                  ...secondaryButtonStyle,
                                  border: "2px solid #1d4ed8",
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  cursor: "default",
                                }
                              : secondaryButtonStyle
                          }
                        >
                          {notSureSelected ? "Not sure saved" : "Not sure yet"}
                        </button>
                      );
                    })()
                  ) : null}
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={Boolean(
                      incomingStepAssessment && !hasEnteredResponse(currentResponse),
                    )}
                    style={
                      incomingStepAssessment && !hasEnteredResponse(currentResponse)
                        ? disabledButtonStyle
                        : buttonStyle
                    }
                  >
                    {currentIndex === totalItems - 1 ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </>
          )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function CleanNumberAssessmentPlayer() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanNumberAssessmentPlayerBody />
    </CleanFamilyWorkspaceProvider>
  );
}
