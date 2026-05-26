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

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  background: "#ffffff",
  padding: "clamp(18px, 3vw, 24px)",
  boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 10,
};

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 18,
  background: "#f8fbff",
  padding: 16,
  display: "grid",
  gap: 8,
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
  padding: "12px 14px",
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
  textAlign: "left",
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  padding: "14px 16px",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 15,
  lineHeight: 1.5,
  cursor: "pointer",
};

const progressTrackStyle: React.CSSProperties = {
  width: "100%",
  height: 10,
  borderRadius: 999,
  background: "#e2e8f0",
  overflow: "hidden",
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

function getCheckResult(
  item: NumberAssessmentItem,
  responseText: string,
): LocalAssessmentResult {
  const normalizedResponse = normalizeValue(responseText);

  if (!normalizedResponse) {
    return "unanswered";
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

  if (
    item.answerType === "worked_response" ||
    item.answerType === "explain_or_justify"
  ) {
    return "review_needed";
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

function getFormatLabel(format: NumberAssessmentItemFormat) {
  return format.replace(/_/g, " ");
}

export default function CleanNumberAssessmentPlayer() {
  const items = NUMBER_APPROXIMATION_ASSESSMENT_ITEMS;
  const totalItems = items.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [responses, setResponses] = useState<
    Record<string, LocalAssessmentResponse>
  >({});

  const currentItem = items[currentIndex];
  const currentResponse =
    responses[currentItem.id] ?? createEmptyResponse(currentItem.id);
  const currentProgress = ((currentIndex + 1) / totalItems) * 100;

  const summary = useMemo(() => {
    const responseList = items.map(
      (item) => responses[item.id] ?? createEmptyResponse(item.id),
    );

    const attemptedItems = responseList.filter(
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

    const mostCommonMisconceptions = Array.from(misconceptionCounts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 3);

    const practiceFocuses = Array.from(recommendationCounts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 3);

    return {
      attemptedItems,
      correctCount,
      incorrectCount,
      reviewNeededCount,
      mostCommonMisconceptions,
      practiceFocuses,
    };
  }, [items, responses]);

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
    setResponses({});
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={eyebrowStyle}>Assessment prototype</div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(28px, 4vw, 38px)",
                    lineHeight: 1.08,
                    color: "#0f172a",
                  }}
                >
                  Number assessment prototype: Approximation, estimation and error
                </h1>
                <p
                  style={{
                    margin: 0,
                    maxWidth: 760,
                    color: "#475569",
                    lineHeight: 1.7,
                    fontSize: 15,
                  }}
                >
                  A local-only assessment flow for testing rounding, truncation,
                  estimation, exact vs approximate values, and error reasoning.
                </p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={getDifficultyTone("foundation")}>Years 7-10</span>
                <span style={getFormatTone("applied_context")}>Number</span>
                <span style={getFormatTone("repeated_calculation")}>
                  Local preview
                </span>
                <span style={getResultTone("review_needed")}>No results saved</span>
              </div>
            </div>
          </div>
        </section>

        {showSummary ? (
          <section style={cardStyle}>
            <div style={{ display: "grid", gap: 18 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={eyebrowStyle}>Prototype summary</div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "clamp(24px, 4vw, 32px)",
                    color: "#0f172a",
                  }}
                >
                  Assessment summary - local preview
                </h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  This prototype does not save results yet. It is testing the
                  assessment flow and recommendation model.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                }}
              >
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Total items</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
                    {totalItems}
                  </div>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Attempted</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
                    {summary.attemptedItems}
                  </div>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Correct</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#166534" }}>
                    {summary.correctCount}
                  </div>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Incorrect</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#b45309" }}>
                    {summary.incorrectCount}
                  </div>
                </div>
                <div style={compactCardStyle}>
                  <div style={eyebrowStyle}>Review needed</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#4338ca" }}>
                    {summary.reviewNeededCount}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
                <div style={helperCardStyle}>
                  <div style={eyebrowStyle}>Misconception signals</div>
                  {summary.mostCommonMisconceptions.length ? (
                    summary.mostCommonMisconceptions.map(([code, count]) => (
                      <div key={code} style={{ color: "#0f172a", lineHeight: 1.6 }}>
                        <strong>{count}x</strong> {code}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      No recurring misconception signals were detected in this local
                      run.
                    </div>
                  )}
                </div>

                <div style={helperCardStyle}>
                  <div style={eyebrowStyle}>Suggested practice focus</div>
                  {summary.practiceFocuses.length ? (
                    summary.practiceFocuses.map(([recommendation, count]) => (
                      <div
                        key={recommendation}
                        style={{ color: "#0f172a", lineHeight: 1.6 }}
                      >
                        <strong>{count}x</strong> {recommendation}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      No practice focus was generated yet. Submit a few items to test
                      the recommendation model.
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  justifyContent: "space-between",
                }}
              >
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
          </section>
        ) : (
          <section style={cardStyle}>
            <div style={{ display: "grid", gap: 18 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={eyebrowStyle}>
                    Approximation, estimation and error
                  </div>
                  <h2 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>
                    Item {currentIndex + 1} of {totalItems}
                  </h2>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={getDifficultyTone(currentItem.difficulty)}>
                    {currentItem.difficulty}
                  </span>
                  <span style={getFormatTone(currentItem.format)}>
                    {getFormatLabel(currentItem.format)}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={progressTrackStyle}>
                  <div
                    style={{
                      width: `${currentProgress}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg, #60a5fa, #34d399)",
                    }}
                  />
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  Progress reflects the current item in this 12-item preview.
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={eyebrowStyle}>Question</div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 24,
                    color: "#0f172a",
                    lineHeight: 1.2,
                  }}
                >
                  {currentItem.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "#334155",
                    fontSize: 16,
                    lineHeight: 1.8,
                  }}
                >
                  {currentItem.prompt}
                </p>
              </div>

              {currentItem.visualSupport &&
              (currentItem.visualSupport.type !== "none" ||
                currentItem.visualSupport.description) ? (
                <div style={helperCardStyle}>
                  <div style={eyebrowStyle}>Visual/context support</div>
                  <div style={{ color: "#0f172a", lineHeight: 1.6 }}>
                    {currentItem.visualSupport.description ||
                      `Future support type: ${currentItem.visualSupport.type}`}
                  </div>
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 12 }}>
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
                              ? "1px solid #1d4ed8"
                              : optionButtonStyle.border,
                            background: isSelected ? "#eff6ff" : "#ffffff",
                            boxShadow: isSelected
                              ? "0 8px 18px rgba(59,130,246,0.10)"
                              : "none",
                          }}
                        >
                          {option}
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
                  <textarea
                    value={currentResponse.response}
                    onChange={(event) =>
                      updateResponse(currentItem.id, event.target.value)
                    }
                    placeholder="Write the response here. Adult review may still be helpful."
                    style={textareaStyle}
                  />
                )}

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span style={chipBaseStyle}>Answer type: {currentItem.answerType}</span>
                  <span style={chipBaseStyle}>
                    Step focus: {currentItem.progressionStepKey}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  justifyContent: "space-between",
                }}
              >
                <button
                  type="button"
                  onClick={submitCurrentItem}
                  style={buttonStyle}
                >
                  Check response
                </button>
                <button
                  type="button"
                  onClick={resetPreview}
                  style={secondaryButtonStyle}
                >
                  Reset preview
                </button>
              </div>

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
                    <div style={eyebrowStyle}>Local feedback</div>
                    <span style={getResultTone(currentResponse.result)}>
                      {currentResponse.result.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div style={{ color: "#0f172a", lineHeight: 1.6 }}>
                    {getResultMessage(currentResponse.result)}
                  </div>

                  {currentItem.expectedAnswer ? (
                    <div style={{ color: "#334155", lineHeight: 1.6 }}>
                      <strong>Expected answer:</strong> {currentItem.expectedAnswer}
                    </div>
                  ) : null}

                  {currentItem.workedSolution ? (
                    <div style={{ color: "#334155", lineHeight: 1.6 }}>
                      <strong>Worked solution:</strong> {currentItem.workedSolution}
                    </div>
                  ) : null}

                  {currentItem.markingGuide ? (
                    <div style={{ color: "#334155", lineHeight: 1.6 }}>
                      <strong>Marking guide:</strong> {currentItem.markingGuide}
                    </div>
                  ) : null}

                  <div style={{ color: "#334155", lineHeight: 1.6 }}>
                    <strong>Misconception targets:</strong>{" "}
                    {currentItem.misconceptionTargets.join(", ")}
                  </div>

                  <div style={{ color: "#334155", lineHeight: 1.6 }}>
                    <strong>Diagnostic note:</strong>{" "}
                    {currentItem.adaptiveRoute.diagnosticNote}
                  </div>

                  <div style={{ color: "#334155", lineHeight: 1.6 }}>
                    <strong>Practice recommendation:</strong>{" "}
                    {currentItem.adaptiveRoute.practiceRecommendation}
                  </div>
                </div>
              ) : null}

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  justifyContent: "space-between",
                }}
              >
                <button
                  type="button"
                  onClick={goBack}
                  disabled={currentIndex === 0}
                  style={currentIndex === 0 ? disabledButtonStyle : secondaryButtonStyle}
                >
                  Back
                </button>

                <button type="button" onClick={goNext} style={buttonStyle}>
                  {currentIndex === totalItems - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
