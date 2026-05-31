"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type React from "react";
import {
  NUMBER_POWERS_ROOTS_PRACTICE_MODULE,
  getNumberPracticeModuleById,
  type NumberPracticeModule,
  type NumberPracticeSection,
  type NumberPracticeTask,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  getNumberApproximationPracticeModuleById,
} from "@/lib/clean/practice/numberApproximationPracticeModules";
import {
  getNumberAdditiveStrategiesPracticeModuleById,
} from "@/lib/clean/practice/numberAdditiveStrategiesPracticeModules";
import {
  getNumberIrrationalRealPracticeModuleById,
} from "@/lib/clean/practice/numberIrrationalRealPracticeModules";
import {
  getNumberIntegersCoordinatesPropertiesPracticeModuleById,
} from "@/lib/clean/practice/numberIntegersCoordinatesPropertiesPracticeModules";
import {
  getNumberPercentRatioFinancePracticeModuleById,
} from "@/lib/clean/practice/numberPercentRatioFinancePracticeModules";
import {
  getNumberPlaceValueOperationsPracticeModuleById,
} from "@/lib/clean/practice/numberPlaceValueOperationsPracticeModules";
import {
  getNumberFractionsFoundationsPracticeModuleById,
} from "@/lib/clean/practice/numberFractionsFoundationsPracticeModules";
import {
  getNumberDecimalsFoundationsPracticeModuleById,
} from "@/lib/clean/practice/numberDecimalsFoundationsPracticeModules";
import {
  getNumberMultiplicationDivisionFluencyPracticeModuleById,
} from "@/lib/clean/practice/numberMultiplicationDivisionFluencyPracticeModules";
import {
  getNumberMoneyPracticalContextsPracticeModuleById,
} from "@/lib/clean/practice/numberMoneyPracticalContextsPracticeModules";
import {
  getNumberPatternsEarlyAlgebraPracticeModuleById,
} from "@/lib/clean/practice/numberPatternsEarlyAlgebraPracticeModules";
import {
  getNumberTimeElapsedFoundationsPracticeModuleById,
} from "@/lib/clean/practice/numberTimeElapsedFoundationsPracticeModules";
import {
  getNumberRationalOperationsPracticeModuleById,
} from "@/lib/clean/practice/numberRationalOperationsPracticeModules";
import {
  getNumberSurdsExactPracticeModuleById,
} from "@/lib/clean/practice/numberSurdsExactPracticeModules";
import {
  getNumberTerminatingRecurringRationalPracticeModuleById,
} from "@/lib/clean/practice/numberTerminatingRecurringRationalPracticeModules";
import { getNumberAssessmentBankByKey } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  getNumberStepPracticeForPathwayStep,
  getNumberStepPracticeTasksForDepth,
} from "@/lib/clean/practice/numberStepPracticeRegistry";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  type NumberStepPracticeDepth,
} from "@/lib/clean/practice/numberStepPracticeTypes";

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

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#ffffff",
  padding: "clamp(18px, 3vw, 24px)",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
};

const highlightCardStyle: React.CSSProperties = {
  ...cardStyle,
  border: "1px solid #bfdbfe",
  background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
};

const compactCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 10,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "#7c8da3",
  textTransform: "uppercase",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.25,
  border: "1px solid #dbeafe",
  background: "#f8fbff",
  color: "#1d4ed8",
};

const softChipStyle: React.CSSProperties = {
  ...chipStyle,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#64748b",
  fontWeight: 600,
};

const bodyTextStyle: React.CSSProperties = {
  color: "#334155",
  lineHeight: 1.75,
  fontWeight: 400,
};

const quietTextStyle: React.CSSProperties = {
  color: "#64748b",
  lineHeight: 1.7,
  fontWeight: 400,
};

type DotSpec = {
  x: number;
  y: number;
  size?: number;
};

type Step1VisualCard = {
  label?: string;
  dots: DotSpec[];
  frame?: "plain" | "five";
};

type Step1VisualSpec = {
  caption: string;
  cards: Step1VisualCard[];
};

const dot = {
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

const triangleThree = [dot.top, dot.bottomLeft, dot.bottomRight];
const rowThree = [dot.row1, dot.row2, dot.row3];
const rowFour = [dot.row4a, dot.row4b, dot.row4c, dot.row4d];
const rowFive = [dot.row5a, dot.row5b, dot.row5c, dot.row5d, dot.row5e];
const squareFour = [dot.topLeft, dot.topRight, dot.bottomLeftCorner, dot.bottomRightCorner];
const diceFive = [...squareFour, dot.centre];
const spreadFour = [dot.spread1, dot.spread2, dot.spread3, dot.spread4];
const spreadFive = [...spreadFour, dot.spread5];

const STEP_1_PRACTICE_VISUALS: Record<string, Step1VisualSpec> = {
  "number-step-1-practice-001": {
    caption: "Quick-look card: two counters.",
    cards: [{ dots: [dot.left, dot.right] }],
  },
  "number-step-1-practice-002": {
    caption: "Four counters, one near each corner.",
    cards: [{ dots: squareFour }],
  },
  "number-step-1-practice-003": {
    caption: "Find the card with the same amount as three.",
    cards: [
      { label: "3 in a row", dots: rowThree },
      { label: "3 triangle", dots: triangleThree },
      { label: "2 spread", dots: [dot.spread1, dot.spread4] },
      { label: "4 close", dots: rowFour },
    ],
  },
  "number-step-1-practice-004": {
    caption: "Four counters spread far apart.",
    cards: [{ dots: spreadFour }],
  },
  "number-step-1-practice-005": {
    caption: "One counter.",
    cards: [{ dots: [dot.centre] }],
  },
  "number-step-1-practice-006": {
    caption: "A full five-frame shows five.",
    cards: [{ dots: rowFive, frame: "five" }],
  },
  "number-step-1-practice-007": {
    caption: "A line of four and a square of four show the same amount.",
    cards: [
      { label: "Line", dots: rowFour },
      { label: "Square", dots: squareFour },
      { label: "Three", dots: rowThree },
      { label: "Five", dots: spreadFive },
    ],
  },
  "number-step-1-practice-008": {
    caption: "Both cards have two counters, even when size changes.",
    cards: [
      { label: "Card A", dots: [dot.left, dot.right].map((entry) => ({ ...entry, size: 24 })) },
      { label: "Card B", dots: [dot.left, dot.right].map((entry) => ({ ...entry, size: 13 })) },
    ],
  },
  "number-step-1-practice-009": {
    caption: "Three counters in a triangle.",
    cards: [{ dots: triangleThree }],
  },
  "number-step-1-practice-010": {
    caption: "Dice-style five: four corners and one middle.",
    cards: [{ dots: diceFive }],
  },
  "number-step-1-practice-011": {
    caption: "Two counters can be close together or far apart.",
    cards: [
      { label: "Close pair", dots: [dot.left, dot.right] },
      { label: "Spaced pair", dots: [dot.spread1, dot.spread4] },
      { label: "Three", dots: triangleThree },
      { label: "One big", dots: [{ ...dot.centre, size: 26 }] },
    ],
  },
  "number-step-1-practice-012": {
    caption: "Compare the number of counters, not the spaces.",
    cards: [
      { label: "Card A", dots: rowFive },
      { label: "Card B", dots: spreadFour },
    ],
  },
};

function renderStep1PracticeVisual(taskId: string) {
  const visual = STEP_1_PRACTICE_VISUALS[taskId];
  if (!visual) return null;

  return (
    <div
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 16,
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 800 }}>
        {visual.caption}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 8,
        }}
      >
        {visual.cards.map((card, cardIndex) => (
          <div
            key={`${taskId}-${cardIndex}`}
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 14,
              background: "#ffffff",
              padding: 8,
              display: "grid",
              gap: 6,
            }}
          >
            {card.label ? (
              <div style={{ color: "#475569", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
                {card.label}
              </div>
            ) : null}
            <div
              style={{
                position: "relative",
                height: card.frame === "five" ? 70 : 88,
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
              {card.dots.map((entry, dotIndex) => {
                const size = entry.size ?? 17;
                return (
                  <span
                    key={`${entry.x}-${entry.y}-${dotIndex}`}
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: `${entry.x}%`,
                      top: `${entry.y}%`,
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

function dotsForCount(count: number): DotSpec[] {
  if (count <= 0) return [];
  if (count === 1) return [dot.centre];
  if (count === 2) return [dot.left, dot.right];
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

function renderEarlyNumberPracticeVisual(task: NumberPracticeTask) {
  const step1Visual = renderStep1PracticeVisual(task.id);
  if (step1Visual) return step1Visual;

  const visual = parseEarlyNumberVisual(task.visualSupport?.description);
  if (!visual) return null;

  return (
    <div
      style={{
        border: "1px solid #bfdbfe",
        borderRadius: 16,
        background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ color: "#1e3a8a", fontSize: 14, fontWeight: 800 }}>
        {visual.caption}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 8,
        }}
      >
        {visual.numberCards.length
          ? visual.numberCards.map((numberCard) => (
              <div
                key={numberCard}
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  background: "#ffffff",
                  minHeight: 88,
                  display: "grid",
                  placeItems: "center",
                  color: "#1d4ed8",
                  fontSize: 40,
                  fontWeight: 900,
                }}
              >
                {numberCard}
              </div>
            ))
          : visual.groupCounts.map((count, cardIndex) => (
              <div
                key={`${task.id}-${cardIndex}`}
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  background: "#ffffff",
                  padding: 8,
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ color: "#475569", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
                  {visual.labels[cardIndex] || `${count}`}
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 88,
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    background: "#f8fafc",
                    overflow: "hidden",
                  }}
                >
                  {dotsForCount(count).map((entry, dotIndex) => {
                    const size = entry.size ?? 16;
                    return (
                      <span
                        key={`${entry.x}-${entry.y}-${dotIndex}`}
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: `${entry.x}%`,
                          top: `${entry.y}%`,
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

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function getSafeLocalHref(value: unknown) {
  const href = safe(value);

  if (!href || !href.startsWith("/") || href.startsWith("//")) {
    return "";
  }

  return href;
}

type PracticeTaskResult =
  | "not_checked"
  | "correct"
  | "worth_revisiting"
  | "needs_review"
  | "reviewed";

type LocalPracticeResponse = {
  value: string;
  result: PracticeTaskResult;
  checked: boolean;
};

type LocalPracticeResponseMap = Record<string, LocalPracticeResponse>;

function normalizeAnswer(value: unknown) {
  return safe(value).toLowerCase().replace(/\s+/g, " ");
}

function createEmptyResponse(): LocalPracticeResponse {
  return {
    value: "",
    result: "not_checked",
    checked: false,
  };
}

function isAutoCheckableTask(task: NumberPracticeTask) {
  return (
    task.taskType === "multiple_choice" ||
    task.taskType === "short_answer" ||
    task.taskType === "numeric" ||
    (task.taskType === "sort_or_match" &&
      Boolean(task.expectedAnswer || task.acceptableAnswers?.length))
  );
}

function checkPracticeTask(
  task: NumberPracticeTask,
  response: LocalPracticeResponse,
): PracticeTaskResult {
  if (task.taskType === "worked_example") return "reviewed";
  if (task.taskType === "explain") return "needs_review";

  if (!isAutoCheckableTask(task)) {
    return safe(response.value) ? "needs_review" : "not_checked";
  }

  const acceptedAnswers = [task.expectedAnswer, ...(task.acceptableAnswers ?? [])]
    .map((answer) => normalizeAnswer(answer))
    .filter(Boolean);

  if (!safe(response.value)) return "not_checked";
  if (!acceptedAnswers.length) return "needs_review";

  return acceptedAnswers.includes(normalizeAnswer(response.value))
    ? "correct"
    : "worth_revisiting";
}

function getResultLabel(result: PracticeTaskResult) {
  if (result === "correct") return "Correct";
  if (result === "worth_revisiting") return "Worth revisiting";
  if (result === "needs_review") return "Needs review";
  if (result === "reviewed") return "Reviewed";
  return "Not checked";
}

function getResultTone(result: PracticeTaskResult) {
  if (result === "correct") {
    return { border: "#bbf7d0", fill: "#f0fdf4", text: "#166534" };
  }

  if (result === "worth_revisiting") {
    return { border: "#fde68a", fill: "#fffbeb", text: "#92400e" };
  }

  if (result === "needs_review") {
    return { border: "#c7d2fe", fill: "#eef2ff", text: "#4338ca" };
  }

  if (result === "reviewed") {
    return { border: "#bfdbfe", fill: "#eff6ff", text: "#1d4ed8" };
  }

  return { border: "#e2e8f0", fill: "#ffffff", text: "#475569" };
}

function buildProgressSummary(
  tasks: NumberPracticeTask[],
  responses: LocalPracticeResponseMap,
) {
  const taskResponses = tasks.map((task) => responses[task.id] ?? createEmptyResponse());
  const completedCount = taskResponses.filter(
    (response) => response.checked || safe(response.value),
  ).length;
  const checkedCount = taskResponses.filter((response) => response.checked).length;
  const correctCount = taskResponses.filter(
    (response) => response.result === "correct",
  ).length;
  const needsReviewCount = taskResponses.filter(
    (response) =>
      response.result === "needs_review" || response.result === "reviewed",
  ).length;

  return {
    completedCount,
    checkedCount,
    correctCount,
    needsReviewCount,
    totalCount: tasks.length,
  };
}

type SourcePracticeContext = {
  subjectKey: string;
  strandKey: string;
  stageKey: string;
  pathwayStepId: string;
  stepKey: string;
  sourceAssessmentBand: string;
  sourceProgressionStep: string;
  sourceSubElement: string;
  returnTo: string;
};

function buildSectionHref(
  moduleId: string,
  sectionId: string,
  sourceContext: SourcePracticeContext,
) {
  const params = new URLSearchParams({ moduleId, sectionId });

  if (sourceContext.subjectKey) {
    params.set("subjectKey", sourceContext.subjectKey);
  }

  if (sourceContext.strandKey) {
    params.set("strandKey", sourceContext.strandKey);
  }

  if (sourceContext.stageKey) {
    params.set("stageKey", sourceContext.stageKey);
  }

  if (sourceContext.pathwayStepId) {
    params.set("pathwayStepId", sourceContext.pathwayStepId);
  }

  if (sourceContext.stepKey) {
    params.set("stepKey", sourceContext.stepKey);
  }

  if (sourceContext.sourceAssessmentBand) {
    params.set("sourceAssessmentBand", sourceContext.sourceAssessmentBand);
  }

  if (sourceContext.sourceProgressionStep) {
    params.set("sourceProgressionStep", sourceContext.sourceProgressionStep);
  }

  if (sourceContext.sourceSubElement) {
    params.set("sourceSubElement", sourceContext.sourceSubElement);
  }

  if (sourceContext.returnTo) {
    params.set("returnTo", sourceContext.returnTo);
  }

  return `/practice/number-targeted?${params.toString()}`;
}

function buildAssessmentHref(sourceContext: SourcePracticeContext) {
  const params = new URLSearchParams();

  if (sourceContext.subjectKey) {
    params.set("subjectKey", sourceContext.subjectKey);
  }

  if (sourceContext.strandKey) {
    params.set("strandKey", sourceContext.strandKey);
  }

  if (sourceContext.stageKey) {
    params.set("stageKey", sourceContext.stageKey);
  }

  if (sourceContext.pathwayStepId) {
    params.set("pathwayStepId", sourceContext.pathwayStepId);
  }

  if (sourceContext.stepKey) {
    params.set("stepKey", sourceContext.stepKey);
  }

  if (sourceContext.sourceAssessmentBand) {
    params.set("progressionBandKey", sourceContext.sourceAssessmentBand);
  }

  if (sourceContext.returnTo) {
    params.set("returnTo", sourceContext.returnTo);
  }

  const query = params.toString();
  return query ? `/assessments/number?${query}` : "/assessments/number";
}

function findSection(practiceModule: NumberPracticeModule, sectionId: string) {
  return (
    practiceModule.sections.find((section) => section.id === sectionId) || null
  );
}

function getTargetedNumberPracticeModuleById(id: string) {
  return (
    getNumberPracticeModuleById(id) ||
    getNumberApproximationPracticeModuleById(id) ||
    getNumberAdditiveStrategiesPracticeModuleById(id) ||
    getNumberIrrationalRealPracticeModuleById(id) ||
    getNumberIntegersCoordinatesPropertiesPracticeModuleById(id) ||
    getNumberPercentRatioFinancePracticeModuleById(id) ||
    getNumberPlaceValueOperationsPracticeModuleById(id) ||
    getNumberFractionsFoundationsPracticeModuleById(id) ||
    getNumberDecimalsFoundationsPracticeModuleById(id) ||
    getNumberMultiplicationDivisionFluencyPracticeModuleById(id) ||
    getNumberMoneyPracticalContextsPracticeModuleById(id) ||
    getNumberPatternsEarlyAlgebraPracticeModuleById(id) ||
    getNumberTimeElapsedFoundationsPracticeModuleById(id) ||
    getNumberRationalOperationsPracticeModuleById(id) ||
    getNumberSurdsExactPracticeModuleById(id) ||
    getNumberTerminatingRecurringRationalPracticeModuleById(id)
  );
}

function PracticeProgressSummary({
  label,
  summary,
}: {
  label: string;
  summary: ReturnType<typeof buildProgressSummary>;
}) {
  return (
    <div style={compactCardStyle}>
      <div style={eyebrowStyle}>{label}</div>
      <div style={{ color: "#0f172a", fontWeight: 700 }}>
        {summary.completedCount} of {summary.totalCount} tasks completed
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          color: "#64748b",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <span>{summary.checkedCount} checked</span>
        <span>{summary.correctCount} correct</span>
        <span>{summary.needsReviewCount} for review/discussion</span>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  index,
  response,
  onChange,
  onCheck,
}: {
  task: NumberPracticeTask;
  index: number;
  response: LocalPracticeResponse;
  onChange: (value: string) => void;
  onCheck: () => void;
}) {
  const resultTone = getResultTone(response.result);
  const showFeedback = response.checked;

  return (
    <div style={compactCardStyle}>
      <div style={eyebrowStyle}>Task {index + 1}</div>
      <div style={{ color: "#0f172a", fontSize: 17, fontWeight: 700, lineHeight: 1.35 }}>
        {task.title}
      </div>
      <div style={{ ...bodyTextStyle, fontSize: 15 }}>{task.prompt}</div>
      {renderEarlyNumberPracticeVisual(task)}
      {task.taskType === "worked_example" ? (
        <div
          style={{
            border: "1px solid #dbeafe",
            borderRadius: 12,
            background: "#ffffff",
            padding: 12,
            ...quietTextStyle,
          }}
        >
          Read the worked example, then mark it reviewed when it makes sense.
        </div>
      ) : null}
      {task.taskType === "multiple_choice" && task.options?.length ? (
        <div style={{ display: "grid", gap: 6 }}>
          {task.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              style={{
                border:
                  response.value === option
                    ? "1px solid #2563eb"
                    : "1px solid #e2e8f0",
                borderRadius: 10,
                background: response.value === option ? "#eff6ff" : "#ffffff",
                padding: "8px 10px",
                color: "#334155",
                textAlign: "left",
                lineHeight: 1.45,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
      {task.taskType === "short_answer" ||
      task.taskType === "numeric" ||
      task.taskType === "sort_or_match" ? (
        <input
          value={response.value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            task.taskType === "numeric"
              ? "Enter your answer"
              : "Type your response"
          }
          style={{
            width: "100%",
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 14,
            background: "#ffffff",
            color: "#0f172a",
          }}
        />
      ) : null}
      {task.taskType === "explain" ? (
        <textarea
          value={response.value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Write or discuss your explanation"
          style={{
            width: "100%",
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 14,
            background: "#ffffff",
            color: "#0f172a",
            minHeight: 100,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      ) : null}
      <div>
        <button type="button" onClick={onCheck} style={buttonStyle}>
          {task.taskType === "worked_example" ? "Mark reviewed" : "Check response"}
        </button>
      </div>
      {showFeedback ? (
        <div
          style={{
            border: `1px solid ${resultTone.border}`,
            background: resultTone.fill,
            borderRadius: 12,
            padding: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ color: resultTone.text, fontWeight: 800 }}>
            {getResultLabel(response.result)}
          </div>
          {task.expectedAnswer ? (
            <div style={bodyTextStyle}>
              <strong>Expected answer:</strong> {task.expectedAnswer}
            </div>
          ) : null}
          {task.supportPrompt ? (
            <div style={quietTextStyle}>
              <strong>Support:</strong> {task.supportPrompt}
            </div>
          ) : null}
          {task.workedSolution ? (
            <div style={bodyTextStyle}>
              <strong>Worked solution:</strong> {task.workedSolution}
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {task.misconceptionTargets.map((target) => (
          <span key={target} style={softChipStyle}>
            {target}
          </span>
        ))}
      </div>
      {task.relatedAssessmentItemIds?.length ? (
        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
          Related assessment items: {task.relatedAssessmentItemIds.join(", ")}
        </div>
      ) : null}
    </div>
  );
}

function SectionOverview({
  practiceModule,
  sourceContext,
}: {
  practiceModule: NumberPracticeModule;
  sourceContext: SourcePracticeContext;
}) {
  return (
    <div style={cardStyle}>
      <div style={eyebrowStyle}>Choose a practice section</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        {practiceModule.sections.map((section) => (
          <Link
            key={section.id}
            href={buildSectionHref(
              practiceModule.id,
              section.id,
              sourceContext,
            )}
            style={{
              ...compactCardStyle,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ color: "#0f172a", fontWeight: 700, lineHeight: 1.35 }}>
              {section.title}
            </div>
            <div style={quietTextStyle}>
              {section.learnerGoal}
            </div>
            <div style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 14 }}>
              Open section
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SelectedSection({
  section,
  responses,
  onChange,
  onCheck,
}: {
  section: NumberPracticeSection;
  responses: LocalPracticeResponseMap;
  onChange: (taskId: string, value: string) => void;
  onCheck: (task: NumberPracticeTask) => void;
}) {
  const progress = buildProgressSummary(section.tasks, responses);

  return (
    <div style={highlightCardStyle}>
      <div style={eyebrowStyle}>Recommended section</div>
      <h2
        style={{
          margin: 0,
          color: "#0f172a",
          fontSize: "clamp(22px, 4vw, 30px)",
          lineHeight: 1.15,
        }}
      >
        {section.title}
      </h2>
      <div style={{ ...bodyTextStyle, fontSize: 16 }}>
        {section.learnerGoal}
      </div>
      <PracticeProgressSummary label="Practice progress" summary={progress} />
      <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
        {section.tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            response={responses[task.id] ?? createEmptyResponse()}
            onChange={(value) => onChange(task.id, value)}
            onCheck={() => onCheck(task)}
          />
        ))}
      </div>
    </div>
  );
}

function MiniCheckSection({
  tasks,
  responses,
  onChange,
  onCheck,
}: {
  tasks: NumberPracticeTask[];
  responses: LocalPracticeResponseMap;
  onChange: (taskId: string, value: string) => void;
  onCheck: (task: NumberPracticeTask) => void;
}) {
  const progress = buildProgressSummary(tasks, responses);

  return (
    <section style={cardStyle}>
      <div style={eyebrowStyle}>Mini check</div>
      <div style={quietTextStyle}>
        Try these after practice to see whether the focus is ready for reassessment.
      </div>
      <PracticeProgressSummary label="Mini-check summary" summary={progress} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 10,
          marginTop: 12,
        }}
      >
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            response={responses[task.id] ?? createEmptyResponse()}
            onChange={(value) => onChange(task.id, value)}
            onCheck={() => onCheck(task)}
          />
        ))}
      </div>
    </section>
  );
}

export default function CleanNumberTargetedPracticeViewer() {
  const searchParams = useSearchParams();
  const [responses, setResponses] = useState<LocalPracticeResponseMap>({});
  const [stepPracticeDepth, setStepPracticeDepth] =
    useState<NumberStepPracticeDepth>("basic");
  const [stepPracticeIndex, setStepPracticeIndex] = useState(0);
  const requestedModuleId = safe(searchParams.get("moduleId"));
  const requestedSectionId = safe(searchParams.get("sectionId"));
  const subjectKey = safe(searchParams.get("subjectKey"));
  const strandKey = safe(searchParams.get("strandKey"));
  const stageKey = safe(searchParams.get("stageKey"));
  const pathwayStepId = safe(searchParams.get("pathwayStepId"));
  const stepKey = safe(searchParams.get("stepKey"));
  const sourceAssessmentBand = safe(searchParams.get("sourceAssessmentBand"));
  const sourceProgressionStep = safe(
    searchParams.get("sourceProgressionStep"),
  );
  const sourceSubElement = safe(searchParams.get("sourceSubElement"));
  const returnTo = getSafeLocalHref(searchParams.get("returnTo"));
  const exactStepPractice = getNumberStepPracticeForPathwayStep({
    stepPracticeKey: searchParams.get("stepPracticeKey"),
    pathwayStepId,
    stepKey,
  });
  const exactStepPracticeTasks = exactStepPractice
    ? getNumberStepPracticeTasksForDepth(exactStepPractice.key, stepPracticeDepth)
    : [];
  const currentStepPracticeTask =
    exactStepPracticeTasks[Math.min(stepPracticeIndex, exactStepPracticeTasks.length - 1)];
  const sourceContext: SourcePracticeContext = {
    subjectKey,
    strandKey,
    stageKey,
    pathwayStepId,
    stepKey,
    sourceAssessmentBand,
    sourceProgressionStep,
    sourceSubElement,
    returnTo,
  };
  const practiceModule =
    getTargetedNumberPracticeModuleById(requestedModuleId) ||
    (!requestedModuleId ? NUMBER_POWERS_ROOTS_PRACTICE_MODULE : null);
  const selectedSection = practiceModule && requestedSectionId
    ? findSection(practiceModule, requestedSectionId)
    : null;
  const sourceBank = sourceAssessmentBand
    ? getNumberAssessmentBankByKey(
        sourceAssessmentBand as Parameters<typeof getNumberAssessmentBankByKey>[0],
      )
    : null;
  const unsupportedModule = requestedModuleId && !practiceModule;
  const selectedSectionTasks = selectedSection?.tasks ?? [];
  const miniCheckTasks = practiceModule?.miniCheck ?? [];

  function updateTaskResponse(taskId: string, value: string) {
    setResponses((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? createEmptyResponse()),
        value,
        checked: false,
        result: "not_checked",
      },
    }));
  }

  function checkTask(task: NumberPracticeTask) {
    setResponses((current) => {
      const existing = current[task.id] ?? createEmptyResponse();
      const nextResult = checkPracticeTask(task, existing);

      return {
        ...current,
        [task.id]: {
          ...existing,
          checked: nextResult !== "not_checked",
          result: nextResult,
        },
      };
    });
  }

  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link href={buildAssessmentHref(sourceContext)} style={secondaryButtonStyle}>
            Return to assessment
          </Link>
          {returnTo ? (
            <Link href={returnTo} style={secondaryButtonStyle}>
              Return to pathway
            </Link>
          ) : null}
        </div>

        {exactStepPractice ? (
          <>
            <section style={cardStyle}>
              <div style={eyebrowStyle}>Step-level Number practice</div>
              <h1
                style={{
                  margin: "8px 0",
                  color: "#0f172a",
                  fontSize: "clamp(30px, 5vw, 44px)",
                  lineHeight: 1.08,
                  fontWeight: 800,
                }}
              >
                {exactStepPractice.title}
              </h1>
              <div style={{ ...bodyTextStyle, fontSize: 16 }}>
                Practice focus: <strong>{exactStepPractice.title}</strong>
              </div>
              <div style={quietTextStyle}>
                Part of: <strong>{exactStepPractice.parentModuleTitle}</strong>
              </div>
              <div style={{ ...bodyTextStyle, fontSize: 16 }}>
                {exactStepPractice.description}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {NUMBER_STEP_PRACTICE_DEPTH_OPTIONS.map((option) => {
                  const selected = stepPracticeDepth === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setStepPracticeDepth(option.key);
                        setStepPracticeIndex(0);
                        setResponses({});
                      }}
                      style={{
                        border: selected ? "2px solid #1d4ed8" : "1px solid #cbd5e1",
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
            </section>

            <section style={highlightCardStyle}>
              <div style={eyebrowStyle}>Focused practice</div>
              <PracticeProgressSummary
                label="Practice progress"
                summary={buildProgressSummary(exactStepPracticeTasks, responses)}
              />
              <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
                {currentStepPracticeTask ? (
                  <TaskCard
                    key={currentStepPracticeTask.id}
                    task={currentStepPracticeTask}
                    index={stepPracticeIndex}
                    response={
                      responses[currentStepPracticeTask.id] ?? createEmptyResponse()
                    }
                    onChange={(value) =>
                      updateTaskResponse(currentStepPracticeTask.id, value)
                    }
                    onCheck={() => checkTask(currentStepPracticeTask)}
                  />
                ) : null}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setStepPracticeIndex((value) => Math.max(0, value - 1))
                    }
                    disabled={stepPracticeIndex === 0}
                    style={stepPracticeIndex === 0 ? secondaryButtonStyle : secondaryButtonStyle}
                  >
                    Previous
                  </button>
                  <div style={quietTextStyle}>
                    Task {stepPracticeIndex + 1} of {exactStepPracticeTasks.length}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setStepPracticeIndex((value) =>
                        Math.min(exactStepPracticeTasks.length - 1, value + 1),
                      )
                    }
                    disabled={stepPracticeIndex >= exactStepPracticeTasks.length - 1}
                    style={
                      stepPracticeIndex >= exactStepPracticeTasks.length - 1
                        ? secondaryButtonStyle
                        : buttonStyle
                    }
                  >
                    Next task
                  </button>
                </div>
              </div>
              <div style={{ ...quietTextStyle, marginTop: 8 }}>
                Practice stays local-only. No confidence, evidence, portfolio or reports are updated automatically.
              </div>
            </section>
          </>
        ) : (
          <>

        {unsupportedModule ? (
          <div style={cardStyle}>
            <div style={eyebrowStyle}>Practice not connected</div>
            <h1 style={{ margin: "8px 0", color: "#0f172a" }}>
              This practice module is not connected yet.
            </h1>
            <div style={{ color: "#475569", lineHeight: 1.6 }}>
              The assessment recommendation was received, but this practice route only
              supports connected Number practice modules for now.
            </div>
          </div>
        ) : null}

        {practiceModule ? (
          <>
            <section style={cardStyle}>
              <div style={eyebrowStyle}>MyLearna targeted practice</div>
              <h1
                style={{
                  margin: "8px 0",
                  color: "#0f172a",
                  fontSize: "clamp(30px, 5vw, 44px)",
                  lineHeight: 1.08,
                  fontWeight: 800,
                }}
              >
                {practiceModule.title}
              </h1>
              <div style={{ ...bodyTextStyle, fontSize: 16 }}>
                {practiceModule.description}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <span style={chipStyle}>{practiceModule.subjectKey}</span>
                <span style={chipStyle}>{practiceModule.strandKey}</span>
                <span style={chipStyle}>{practiceModule.stageKey}</span>
                <span style={chipStyle}>{practiceModule.progressionBandKey}</span>
              </div>
              {sourceAssessmentBand || sourceSubElement ? (
                <div
                  style={{
                    marginTop: 14,
                    border: "1px solid #dbeafe",
                    borderRadius: 14,
                    background: "#f8fbff",
                    padding: 12,
                    ...bodyTextStyle,
                  }}
                >
                  Recommended from assessment
                  {sourceBank ? `: ${sourceBank.title}` : ""}
                  {sourceSubElement ? `, ${sourceSubElement}` : ""}.
                </div>
              ) : null}
            </section>

            <section style={highlightCardStyle}>
              <div style={eyebrowStyle}>Learn card</div>
              <div
                style={{
                  color: "#0f172a",
                  fontWeight: 600,
                  fontSize: 18,
                  lineHeight: 1.65,
                }}
              >
                {practiceModule.learnCard.bigIdea}
              </div>
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  background: "#ffffff",
                  padding: 14,
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={eyebrowStyle}>Worked example</div>
                <div style={bodyTextStyle}>
                  {practiceModule.learnCard.workedExample}
                </div>
              </div>
              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  background: "#f8fbff",
                  padding: 14,
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={eyebrowStyle}>Parent tip</div>
                <div style={quietTextStyle}>{practiceModule.learnCard.parentTip}</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {practiceModule.learnCard.keyLanguage.map((term) => (
                  <span key={term} style={softChipStyle}>
                    {term}
                  </span>
                ))}
              </div>
            </section>

            {requestedSectionId && !selectedSection ? (
              <div style={cardStyle}>
                <div style={eyebrowStyle}>Section not found</div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  That practice section is not connected yet. Choose another
                  section from the module overview.
                </div>
              </div>
            ) : null}

            {selectedSection ? (
              <SelectedSection
                section={selectedSection}
                responses={responses}
                onChange={updateTaskResponse}
                onCheck={checkTask}
              />
            ) : (
              <SectionOverview
                practiceModule={practiceModule}
                sourceContext={sourceContext}
              />
            )}

            {selectedSectionTasks.length ? (
              <MiniCheckSection
                tasks={miniCheckTasks}
                responses={responses}
                onChange={updateTaskResponse}
                onCheck={checkTask}
              />
            ) : null}
          </>
        ) : null}
          </>
        )}
      </div>
    </main>
  );
}
