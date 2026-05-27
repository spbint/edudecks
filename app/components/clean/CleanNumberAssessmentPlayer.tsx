"use client";

import React, { useMemo, useState } from "react";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import {
  NUMBER_APPROXIMATION_ASSESSMENT_ITEMS,
  type NumberAssessmentItem,
  type NumberAssessmentItemDifficulty,
  type NumberAssessmentItemFormat,
} from "@/lib/clean/assessments/numberApproximationAssessmentItems";

type LocalAssessmentResult =
  | "correct"
  | "incorrect"
  | "review_needed"
  | "unanswered";

type LocalAssessmentResponse = {
  itemId: string;
  response: string;
  submitted: boolean;
  result: LocalAssessmentResult;
};

type LocalAdaptiveInsightSummary = {
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  reviewNeededCount: number;
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

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  display: "grid",
  gap: 18,
};

const sessionShellStyle: React.CSSProperties = {
  border: "1px solid #dbe4f0",
  borderRadius: 28,
  background: "#ffffff",
  overflow: "hidden",
  boxShadow: "0 18px 42px rgba(15,23,42,0.08)",
};

const sessionHeaderStyle: React.CSSProperties = {
  padding: "16px 18px 14px",
  display: "grid",
  gap: 12,
  borderBottom: "1px solid #e2e8f0",
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
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
  flex: "1.45 1 560px",
  minWidth: 0,
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  background: "#ffffff",
  padding: "18px 18px 16px",
  boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
  display: "grid",
  gap: 14,
};

const supportColumnStyle: React.CSSProperties = {
  flex: "0.95 1 300px",
  minWidth: "min(100%, 280px)",
  display: "grid",
  gap: 12,
};

const actionBarStyle: React.CSSProperties = {
  borderTop: "1px solid #e2e8f0",
  padding: "14px 16px",
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
  height: 8,
  borderRadius: 999,
  background: "#e2e8f0",
  overflow: "hidden",
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

function getFormatTone(format: NumberAssessmentItemFormat): React.CSSProperties {
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

  if (format === "applied_context" || format === "reasonableness") {
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
  };
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isOpenResponse(item: NumberAssessmentItem) {
  return (
    item.answerType === "worked_response" ||
    item.answerType === "explain_or_justify"
  );
}

function getCheckResult(
  item: NumberAssessmentItem,
  responseText: string,
): LocalAssessmentResult {
  const normalizedResponse = normalizeValue(responseText);

  if (!normalizedResponse) {
    return "unanswered";
  }

  if (isOpenResponse(item)) {
    return "review_needed";
  }

  const acceptable = [
    item.expectedAnswer,
    ...(item.acceptableAnswers ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalizeValue(String(value)));

  if (!acceptable.length) {
    return "review_needed";
  }

  if (acceptable.includes(normalizedResponse)) {
    return "correct";
  }

  return "incorrect";
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

function getFormatLabel(format: NumberAssessmentItemFormat) {
  return format.replace(/_/g, " ");
}

function getFocusLabel(item: NumberAssessmentItem) {
  if (item.progressionStepKey === "round-decimals-to-a-required-accuracy") {
    return "Rounding decimals";
  }
  if (item.progressionStepKey === "estimate-sums-and-products-using-rounding") {
    return "Estimating with rounding";
  }
  if (item.progressionStepKey === "compare-exact-and-estimated-results") {
    return "Comparing estimates with exact values";
  }
  if (item.progressionStepKey === "truncate-and-round-values") {
    return "Truncating and rounding";
  }
  if (item.progressionStepKey === "analyse-approximation-error-in-contexts") {
    return "Approximation error in context";
  }
  return "Repeated approximation effects";
}

function getAnswerModeLabel(item: NumberAssessmentItem) {
  if (item.answerType === "multiple_choice") return "Choose one";
  if (item.answerType === "numeric") return "Number answer";
  if (item.answerType === "short_answer") return "Short response";
  if (item.answerType === "worked_response") return "Worked response";
  return "Explain or justify";
}

function getMisconceptionLabel(code: string) {
  if (code === "rounding-place-value-error") {
    return "Rounding and decimal place value";
  }
  if (code === "truncation-vs-rounding-confusion") {
    return "Truncation compared with rounding";
  }
  if (code === "decimal-operation-error") {
    return "Decimal operation error";
  }
  if (code === "estimated-exact-confusion") {
    return "Estimated versus exact values";
  }
  if (code === "unit-conversion-error") {
    return "Units and measurement conversion";
  }
  if (code === "percentage-or-rate-context-error") {
    return "Percentages, rates or financial contexts";
  }
  if (code === "rounding-too-early") {
    return "Rounding too early";
  }
  return "Checking whether an answer is reasonable";
}

function getFocusAreaFromMisconception(code: string) {
  if (code === "rounding-place-value-error") {
    return "Focus on reading decimal places carefully before rounding.";
  }
  if (code === "truncation-vs-rounding-confusion") {
    return "Focus on comparing truncation with rounding on the same decimal values.";
  }
  if (code === "decimal-operation-error") {
    return "Practise using sensible decimal operations after values have been rounded.";
  }
  if (code === "estimated-exact-confusion") {
    return "Review when an estimate should be close to the exact answer and when the difference matters.";
  }
  if (code === "unit-conversion-error") {
    return "Revisit units and measurement language when comparing approximate values.";
  }
  if (code === "percentage-or-rate-context-error") {
    return "Practise choosing reasonable approximations in money, percentage, or rate contexts.";
  }
  if (code === "rounding-too-early") {
    return "Practise when to round in a calculation so early rounding does not change the final result.";
  }
  return "Practise checking whether an answer is reasonable for the context.";
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

function buildAdaptiveInsightSummary(
  items: NumberAssessmentItem[],
  responses: Record<string, LocalAssessmentResponse>,
): LocalAdaptiveInsightSummary {
  const responseList = items.map(
    (item) => responses[item.id] ?? createEmptyResponse(item.id),
  );

  const attemptedCount = responseList.filter(
    (response) => response.submitted || normalizeValue(response.response).length,
  ).length;
  const correctCount = responseList.filter(
    (response) => response.result === "correct",
  ).length;
  const incorrectCount = responseList.filter(
    (response) => response.result === "incorrect",
  ).length;
  const reviewNeededCount = responseList.filter(
    (response) => response.result === "review_needed",
  ).length;

  const targetedItems = items.filter((item) => {
    const response = responses[item.id];
    return (
      response?.result === "incorrect" || response?.result === "review_needed"
    );
  });

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

  const suggestedFocusAreas = topMisconceptionTargets.map((entry) =>
    getFocusAreaFromMisconception(entry.code),
  );

  let suggestedNextStep =
    "Complete a few more items, then review the main practice focus before deciding whether this learning is secure.";

  const topCodes = topMisconceptionTargets.map((entry) => entry.code);

  if (attemptedCount === 0) {
    suggestedNextStep =
      "Start the preview with a few items first, then use the pattern summary to decide the next practice focus.";
  } else if (
    correctCount >= Math.max(8, items.length - 2) &&
    incorrectCount === 0 &&
    reviewNeededCount === 0
  ) {
    suggestedNextStep =
      "This learner appears ready for more complex approximation and error-analysis contexts.";
  } else if (reviewNeededCount >= 2 && incorrectCount === 0 && correctCount >= 4) {
    suggestedNextStep =
      "The closed responses look strong. Review the explanation responses with an adult before moving forward.";
  } else if (
    topCodes.includes("rounding-place-value-error") ||
    topCodes.includes("truncation-vs-rounding-confusion")
  ) {
    suggestedNextStep =
      "Return to practice that compares rounding and truncating the same decimal values before trying repeated approximation problems.";
  } else if (
    topCodes.includes("estimated-exact-confusion") ||
    topCodes.includes("reasonableness-not-checked")
  ) {
    suggestedNextStep =
      "Practise comparing exact answers with estimates and explaining whether the difference matters in context.";
  } else if (topCodes.includes("rounding-too-early")) {
    suggestedNextStep =
      "Revisit calculations where rounding early changes the final result, then retry repeated approximation items.";
  } else if (reviewNeededCount >= 2) {
    suggestedNextStep =
      "Review the explanation responses with an adult before deciding whether this concept is secure.";
  } else if (topPracticeRecommendations[0]) {
    suggestedNextStep = topPracticeRecommendations[0].recommendation;
  }

  return {
    attemptedCount,
    correctCount,
    incorrectCount,
    reviewNeededCount,
    topMisconceptionTargets,
    topPracticeRecommendations,
    suggestedFocusAreas,
    suggestedNextStep,
    parentJudgementPrompt:
      "Based on this preview, how would you judge this learning focus?",
  };
}

export default function CleanNumberAssessmentPlayer() {
  const items = NUMBER_APPROXIMATION_ASSESSMENT_ITEMS;
  const totalItems = items.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [parentJudgement, setParentJudgement] = useState<ParentJudgement | null>(
    null,
  );
  const [responses, setResponses] = useState<
    Record<string, LocalAssessmentResponse>
  >({});

  const currentItem = items[currentIndex];
  const currentResponse =
    responses[currentItem.id] ?? createEmptyResponse(currentItem.id);
  const currentProgress = ((currentIndex + 1) / totalItems) * 100;
  const sessionProgress = showSummary ? 100 : currentProgress;

  const summary = useMemo(
    () => buildAdaptiveInsightSummary(items, responses),
    [items, responses],
  );

  function updateResponse(itemId: string, value: string) {
    setResponses((current) => ({
      ...current,
      [itemId]: {
        itemId,
        response: value,
        submitted: false,
        result: "unanswered",
      },
    }));
  }

  function submitCurrentItem() {
    setResponses((current) => ({
      ...current,
      [currentItem.id]: {
        itemId: currentItem.id,
        response: currentResponse.response,
        submitted: true,
        result: getCheckResult(currentItem, currentResponse.response),
      },
    }));
  }

  function goBack() {
    setShowSummary(false);
    setCurrentIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    if (currentIndex >= totalItems - 1) {
      setShowSummary(true);
      return;
    }
    setCurrentIndex((value) => Math.min(totalItems - 1, value + 1));
  }

  function resetPreview() {
    setCurrentIndex(0);
    setShowSummary(false);
    setParentJudgement(null);
    setResponses({});
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />

        <section style={sessionShellStyle}>
          <div style={sessionHeaderStyle}>
            <div
              style={{
                border: "2px solid #f59e0b",
                background: "#fef3c7",
                color: "#0f172a",
                borderRadius: 18,
                padding: "14px 16px",
                display: "grid",
                gap: 4,
                boxShadow: "0 10px 24px rgba(245,158,11,0.16)",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  lineHeight: 1.2,
                  letterSpacing: "0.01em",
                }}
              >
                DEPLOYMENT CHECK - Assessment Player v6 visible
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  lineHeight: 1.3,
                }}
              >
                Marker: V6-CHECK-2026-05-27
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={eyebrowStyle}>Number assessment</div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(22px, 3.4vw, 30px)",
                    lineHeight: 1.1,
                    color: "#0f172a",
                  }}
                >
                  Approximation, estimation and error
                </h1>
                <p
                  style={{
                    margin: 0,
                    color: "#475569",
                    fontSize: 14,
                    lineHeight: 1.5,
                    maxWidth: 720,
                  }}
                >
                  {showSummary
                    ? "Use this session summary to decide the next practice focus."
                    : "A focused local preview for checking rounding, estimation and error reasoning."}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <span style={getDifficultyTone("foundation")}>Years 7-10</span>
                <span style={getFormatTone("applied_context")}>Local preview</span>
                <span style={getFormatTone("reasonableness")}>Number</span>
                <span style={getResultTone("review_needed")}>No results saved</span>
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
                    ? "Session summary"
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
                  {!showSummary && currentResponse.submitted ? (
                    <span style={getResultTone(currentResponse.result)}>
                      {getResultLabel(currentResponse.result)}
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
                  <div style={eyebrowStyle}>Attempted</div>
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
                  <div style={eyebrowStyle}>Worth revisiting</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#b45309" }}>
                    {summary.incorrectCount}
                  </div>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Needs adult review</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#4338ca" }}>
                    {summary.reviewNeededCount}
                  </div>
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
                          {entry.label} · {entry.count}
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
                  Preview only - not saved yet.
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
                    Current preview judgement:{" "}
                    {getParentJudgementLabel(parentJudgement)}.
                  </div>
                ) : null}
              </div>

              <div style={actionBarStyle}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSummary(false);
                    setCurrentIndex(0);
                  }}
                  style={secondaryButtonStyle}
                >
                  Review answers
                </button>
                <button type="button" onClick={resetPreview} style={buttonStyle}>
                  Restart preview
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={sessionBodyStyle}>
                <div style={workspaceLayoutStyle}>
                  <div style={workspaceCardStyle}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={eyebrowStyle}>Current question</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        <span style={getDifficultyTone(currentItem.difficulty)}>
                          {currentItem.difficulty}
                        </span>
                        <span style={getFormatTone(currentItem.format)}>
                          {getFormatLabel(currentItem.format)}
                        </span>
                      </div>
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

                      {currentItem.answerType === "multiple_choice" ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          {(currentItem.options ?? []).map((option) => {
                            const isSelected = currentResponse.response === option;

                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateResponse(currentItem.id, option)}
                                style={{
                                  ...optionButtonStyle,
                                  border: isSelected
                                    ? "2px solid #1d4ed8"
                                    : optionButtonStyle.border,
                                  background: isSelected ? "#eff6ff" : "#ffffff",
                                  boxShadow: isSelected
                                    ? "0 10px 22px rgba(59,130,246,0.14)"
                                    : "none",
                                }}
                              >
                                <span>{option}</span>
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
                          })}
                        </div>
                      ) : currentItem.answerType === "short_answer" ||
                        currentItem.answerType === "numeric" ? (
                        <input
                          type="text"
                          value={currentResponse.response}
                          onChange={(event) =>
                            updateResponse(currentItem.id, event.target.value)
                          }
                          placeholder={
                            currentItem.answerType === "numeric"
                              ? "Enter a numeric answer"
                              : "Enter a short response"
                          }
                          style={inputStyle}
                        />
                      ) : (
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
                            onChange={(event) =>
                              updateResponse(currentItem.id, event.target.value)
                            }
                            placeholder="Write the response here. The learner can explain in their own words."
                            style={textareaStyle}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <aside style={supportColumnStyle}>
                    {currentItem.visualSupport &&
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
                          <div style={eyebrowStyle}>Feedback</div>
                          <span style={getResultTone(currentResponse.result)}>
                            {getResultLabel(currentResponse.result)}
                          </span>
                        </div>

                        <div style={{ color: "#0f172a", lineHeight: 1.6 }}>
                          {getResultMessage(currentResponse.result)}
                        </div>

                        {currentItem.expectedAnswer && !isOpenResponse(currentItem) ? (
                          <div style={{ color: "#334155", lineHeight: 1.6 }}>
                            <strong>Expected answer:</strong>{" "}
                            {currentItem.expectedAnswer}
                          </div>
                        ) : null}

                        {currentItem.workedSolution ? (
                          <div style={{ color: "#334155", lineHeight: 1.6 }}>
                            <strong>Worked solution:</strong>{" "}
                            {currentItem.workedSolution}
                          </div>
                        ) : null}

                        {currentItem.markingGuide ? (
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

                    {currentResponse.submitted ? (
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

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={submitCurrentItem}
                    style={secondaryButtonStyle}
                  >
                    Check response
                  </button>
                  <button type="button" onClick={goNext} style={buttonStyle}>
                    {currentIndex === totalItems - 1 ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
