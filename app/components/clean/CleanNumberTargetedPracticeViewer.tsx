"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type React from "react";
import CleanContentIssueReportButton, {
  type ContentIssueReportContext,
} from "@/app/components/clean/CleanContentIssueReportButton";
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
  isStep49CalculationReasonablenessActivity,
  isStep50AlgebraicThinkingActivity,
  isStep51StandardFormActivity,
  isStep53ExactFractionsPiActivity,
  isStep54PercentageChangeActivity,
  isStep55RatioProportionRatesActivity,
  isStep56AlgebraGraphActivity,
  isStep57FinancialModellingActivity,
  isStep58AccuracyRoundingActivity,
  isStep59EfficientStrategyActivity,
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
  renderStep49WorksheetOptionCard,
  renderStep49WorksheetPromptVisual,
  renderStep50WorksheetOptionCard,
  renderStep50WorksheetPromptVisual,
  renderStep51WorksheetOptionCard,
  renderStep51WorksheetPromptVisual,
  renderStep53WorksheetOptionCard,
  renderStep53WorksheetPromptVisual,
  renderStep54WorksheetOptionCard,
  renderStep54WorksheetPromptVisual,
  renderStep55WorksheetOptionCard,
  renderStep55WorksheetPromptVisual,
  renderStep56WorksheetOptionCard,
  renderStep56WorksheetPromptVisual,
  renderStep57WorksheetOptionCard,
  renderStep57WorksheetPromptVisual,
  renderStep58WorksheetOptionCard,
  renderStep58WorksheetPromptVisual,
  renderStep59WorksheetOptionCard,
  renderStep59WorksheetPromptVisual,
} from "@/app/components/clean/math/EarlyNumberWorksheetVisuals";
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
  getStepAssessmentForPathwayStep,
} from "@/lib/clean/assessments/stepAssessmentRegistry";
import {
  getStepPracticeForPathwayStep,
  getStepPracticeTasksForDepth,
} from "@/lib/clean/practice/stepPracticeRegistry";
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

const GEOMETRY_STEP_1_SHAPE_VISUALS: Record<string, GeometryShapeKind[]> = {
  "geometry-spatial-reasoning-step-1-practice-001": ["circle", "square", "triangle"],
  "geometry-spatial-reasoning-step-1-practice-002": ["triangle", "rectangle", "circle"],
  "geometry-spatial-reasoning-step-1-practice-003": ["circle", "rectangle", "sphere"],
  "geometry-spatial-reasoning-step-1-practice-004": ["square", "triangle", "circle"],
  "geometry-spatial-reasoning-step-1-practice-005": ["rectangle", "sphere", "circle"],
  "geometry-spatial-reasoning-step-1-practice-006": ["triangle", "square"],
  "geometry-spatial-reasoning-step-1-practice-007": ["triangle", "circle"],
  "geometry-spatial-reasoning-step-1-practice-008": ["circle", "square"],
  "geometry-spatial-reasoning-step-1-practice-009": ["square", "triangle", "circle"],
  "geometry-spatial-reasoning-step-1-practice-010": ["square", "circle", "oval"],
  "geometry-spatial-reasoning-step-1-practice-011": ["rectangle", "box"],
  "geometry-spatial-reasoning-step-1-practice-012": ["triangle", "circle", "square"],
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
        <circle cx="50" cy="41" r="31" fill={fill} stroke={stroke} strokeWidth="6" />
        <path d="M30 28 C42 18, 62 18, 72 32" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
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

function renderGeometryShapeVisualCard(label: string, selected = false) {
  const shape = normalizeShapeName(label);
  if (!shape) return null;

  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
      {renderGeometryShape(shape, label, selected)}
      <span style={{ color: selected ? "#1d4ed8" : "#475569", fontSize: 13, fontWeight: 800 }}>
        {label}
      </span>
    </div>
  );
}

function renderGeometryPracticeVisual(taskId: string) {
  const shapes = GEOMETRY_STEP_1_SHAPE_VISUALS[taskId];
  if (!shapes) return null;

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
        Shape cards
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 8,
        }}
      >
        {shapes.map((shape) => (
          <div
            key={`${taskId}-${shape}`}
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 14,
              background: "#ffffff",
              padding: 8,
              minHeight: 108,
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

function renderStatisticsPracticeVisual(taskId: string) {
  const labels = getStatisticsStep1VisualLabels(taskId);
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
            key={`${taskId}-${label}`}
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
  const geometryVisual = renderGeometryPracticeVisual(task.id);
  if (geometryVisual) return geometryVisual;

  const statisticsVisual = renderStatisticsPracticeVisual(task.id);
  if (statisticsVisual) return statisticsVisual;

  const step1Visual = renderStep1PracticeVisual(task.id);
  if (step1Visual) return step1Visual;

  const visual = parseEarlyNumberVisual(task.visualSupport?.description);
  if (!visual) return null;

  if (isStep2NumberWordActivity(task.id)) {
    const step2Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep2WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step2Visual,
    });
  }

  if (isStep3NumeralActivity(task.id)) {
    const step3Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep3WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step3Visual,
    });
  }

  if (isStep4CountingObjectsActivity(task.id) || isStep5CountingObjectsActivity(task.id)) {
    const step4Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep4WorksheetPromptVisual({
      visual: step4Visual,
    });
  }

  if (isStep6CompareGroupsActivity(task.id)) {
    const step6Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep6WorksheetPromptVisual({
      visual: step6Visual,
    });
  }

  if (isStep7OrderNumbersActivity(task.id)) {
    const step7Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep7WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step7Visual,
    });
  }

  if (isStep8PartWholeActivity(task.id)) {
    const step8Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep8WorksheetPromptVisual({
      visual: step8Visual,
    });
  }

  if (isStep9ObjectStoryActivity(task.id)) {
    const step9Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep9WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step9Visual,
    });
  }

  if (isStep10EqualSharingActivity(task.id)) {
    const step10Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep10WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step10Visual,
    });
  }

  if (isStep11CountingSequenceActivity(task.id)) {
    const step11Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep11WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step11Visual,
    });
  }

  if (isStep12ReadWriteOrderActivity(task.id)) {
    const step12Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep12WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step12Visual,
    });
  }

  if (isStep13SkipCountingActivity(task.id)) {
    const step13Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep13WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step13Visual,
    });
  }

  if (isStep16RenameTwoDigitActivity(task.id)) {
    const step16Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep16WorksheetPromptVisual({
      visual: step16Visual,
    });
  }

  if (isStep17AddSubtractWithin20Activity(task.id)) {
    const step17Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep17WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step17Visual,
    });
  }

  if (isStep18SupportedAddSubtractActivity(task.id)) {
    const step18Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep18WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step18Visual,
    });
  }

  if (isStep19EqualGroupsArraysActivity(task.id)) {
    const step19Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep19WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step19Visual,
    });
  }

  if (isStep20HalvesQuartersSharingActivity(task.id)) {
    const step20Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep20WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step20Visual,
    });
  }

  if (isStep21LargeNumberCompareActivity(task.id)) {
    const step21Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep21WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step21Visual,
    });
  }

  if (isStep22HundredsTensOnesActivity(task.id)) {
    const step22Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep22WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step22Visual,
    });
  }

  if (isStep23PartitionRegroupActivity(task.id)) {
    const step23Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep23WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step23Visual,
    });
  }

  if (isStep24ZeroPlaceholderActivity(task.id)) {
    const step24Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep24WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step24Visual,
    });
  }

  if (isStep25PlaceValueAddSubtractActivity(task.id)) {
    const step25Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep25WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step25Visual,
    });
  }

  if (isStep26MultiplicationFactsActivity(task.id)) {
    const step26Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep26WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step26Visual,
    });
  }

  if (isStep27ArraysGroupingKnownFactsActivity(task.id)) {
    const step27Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep27WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step27Visual,
    });
  }

  if (isStep28EstimateReasonablenessActivity(task.id)) {
    const step28Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep28WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step28Visual,
    });
  }

  if (isStep29UnitSimpleFractionsActivity(task.id)) {
    const step29Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep29WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step29Visual,
    });
  }

  if (isStep30PracticalMoneyActivity(task.id)) {
    const step30Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep30WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step30Visual,
    });
  }

  if (isStep31ExtendedPlaceValueActivity(task.id)) {
    const step31Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep31WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step31Visual,
    });
  }

  if (isStep32RoundEstimateLargerNumbersActivity(task.id)) {
    const step32Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep32WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step32Visual,
    });
  }

  if (isStep33DecimalPlaceValueActivity(task.id)) {
    const step33Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep33WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step33Visual,
    });
  }

  if (isStep34CompareOrderDecimalsActivity(task.id)) {
    const step34Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep34WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step34Visual,
    });
  }

  if (isStep35EquivalentFractionsActivity(task.id)) {
    const step35Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep35WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step35Visual,
    });
  }

  if (isStep36FractionAddSubtractActivity(task.id)) {
    const step36Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep36WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step36Visual,
    });
  }

  if (isStep37EfficientStrategiesActivity(task.id)) {
    const step37Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep37WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step37Visual,
    });
  }

  if (isStep38RemaindersContextActivity(task.id)) {
    const step38Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep38WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step38Visual,
    });
  }

  if (isStep39FractionDecimalPercentActivity(task.id)) {
    const step39Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep39WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step39Visual,
    });
  }

  if (isStep40FinancialModellingActivity(task.id)) {
    const step40Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep40WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step40Visual,
    });
  }

  if (isStep41FlexibleNumberFormsActivity(task.id)) {
    const step41Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep41WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step41Visual,
    });
  }

  if (isStep42NegativeNumberLineActivity(task.id)) {
    const step42Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep42WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step42Visual,
    });
  }

  if (isStep44PowersRootsActivity(task.id)) {
    const step44Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep44WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step44Visual,
    });
  }

  if (isStep45RatioRatesActivity(task.id)) {
    const step45Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep45WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step45Visual,
    });
  }

  if (isStep46ProportionalReasoningActivity(task.id)) {
    const step46Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep46WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step46Visual,
    });
  }

  if (isStep48EstimationBoundsActivity(task.id)) {
    const step48Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep48WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step48Visual,
    });
  }

  if (isStep49CalculationReasonablenessActivity(task.id)) {
    const step49Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep49WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step49Visual,
    });
  }

  if (isStep50AlgebraicThinkingActivity(task.id)) {
    const step50Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep50WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step50Visual,
    });
  }

  if (isStep51StandardFormActivity(task.id)) {
    const step51Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep51WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step51Visual,
    });
  }

  if (isStep53ExactFractionsPiActivity(task.id)) {
    const step53Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep53WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step53Visual,
    });
  }

  if (isStep54PercentageChangeActivity(task.id)) {
    const step54Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep54WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step54Visual,
    });
  }

  if (isStep55RatioProportionRatesActivity(task.id)) {
    const step55Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep55WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step55Visual,
    });
  }

  if (isStep56AlgebraGraphActivity(task.id)) {
    const step56Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep56WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step56Visual,
    });
  }

  if (isStep57FinancialModellingActivity(task.id)) {
    const step57Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep57WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step57Visual,
    });
  }

  if (isStep58AccuracyRoundingActivity(task.id)) {
    const step58Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep58WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step58Visual,
    });
  }

  if (isStep59EfficientStrategyActivity(task.id)) {
    const step59Visual =
      parseEarlyNumberVisualDescription(task.visualSupport?.description) ?? visual;
    return renderStep59WorksheetPromptVisual({
      prompt: task.prompt,
      visual: step59Visual,
    });
  }

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
  reportContext,
}: {
  task: NumberPracticeTask;
  index: number;
  response: LocalPracticeResponse;
  onChange: (value: string) => void;
  onCheck: () => void;
  reportContext: ContentIssueReportContext;
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
        (() => {
          const step2NumberWordOptions = isStep2NumberWordActivity(task.id);
          const step3NumeralOptions = isStep3NumeralActivity(task.id);
          const step4CountingObjectOptions = isStep4CountingObjectsActivity(task.id);
          const step5CountingObjectOptions = isStep5CountingObjectsActivity(task.id);
          const countingObjectOptions = step4CountingObjectOptions || step5CountingObjectOptions;
          const step6CompareGroupOptions = isStep6CompareGroupsActivity(task.id);
          const step7OrderNumberOptions = isStep7OrderNumbersActivity(task.id);
          const step8PartWholeOptions = isStep8PartWholeActivity(task.id);
          const step9ObjectStoryOptions = isStep9ObjectStoryActivity(task.id);
          const step10EqualSharingOptions = isStep10EqualSharingActivity(task.id);
          const step11CountingSequenceOptions = isStep11CountingSequenceActivity(task.id);
          const step12ReadWriteOrderOptions = isStep12ReadWriteOrderActivity(task.id);
          const step13SkipCountingOptions = isStep13SkipCountingActivity(task.id);
          const step16RenameTwoDigitOptions = isStep16RenameTwoDigitActivity(task.id);
          const step17AddSubtractWithin20Options = isStep17AddSubtractWithin20Activity(task.id);
          const step18SupportedAddSubtractOptions = isStep18SupportedAddSubtractActivity(task.id);
          const step19EqualGroupsArraysOptions = isStep19EqualGroupsArraysActivity(task.id);
          const step20HalvesQuartersSharingOptions = isStep20HalvesQuartersSharingActivity(task.id);
          const step21LargeNumberCompareOptions = isStep21LargeNumberCompareActivity(task.id);
          const step22HundredsTensOnesOptions = isStep22HundredsTensOnesActivity(task.id);
          const step23PartitionRegroupOptions = isStep23PartitionRegroupActivity(task.id);
          const step24ZeroPlaceholderOptions = isStep24ZeroPlaceholderActivity(task.id);
          const step25PlaceValueAddSubtractOptions = isStep25PlaceValueAddSubtractActivity(task.id);
          const step26MultiplicationFactsOptions = isStep26MultiplicationFactsActivity(task.id);
          const step27ArraysGroupingKnownFactsOptions = isStep27ArraysGroupingKnownFactsActivity(task.id);
          const step28EstimateReasonablenessOptions = isStep28EstimateReasonablenessActivity(task.id);
          const step29UnitSimpleFractionsOptions = isStep29UnitSimpleFractionsActivity(task.id);
          const step30PracticalMoneyOptions = isStep30PracticalMoneyActivity(task.id);
          const step31ExtendedPlaceValueOptions = isStep31ExtendedPlaceValueActivity(task.id);
          const step32RoundEstimateLargerNumbersOptions = isStep32RoundEstimateLargerNumbersActivity(task.id);
          const step33DecimalPlaceValueOptions = isStep33DecimalPlaceValueActivity(task.id);
          const step34CompareOrderDecimalsOptions = isStep34CompareOrderDecimalsActivity(task.id);
          const step35EquivalentFractionsOptions = isStep35EquivalentFractionsActivity(task.id);
          const step36FractionAddSubtractOptions = isStep36FractionAddSubtractActivity(task.id);
          const step37EfficientStrategiesOptions = isStep37EfficientStrategiesActivity(task.id);
          const step38RemaindersContextOptions = isStep38RemaindersContextActivity(task.id);
          const step39FractionDecimalPercentOptions = isStep39FractionDecimalPercentActivity(task.id);
          const step40FinancialModellingOptions = isStep40FinancialModellingActivity(task.id);
          const step41FlexibleNumberFormsOptions = isStep41FlexibleNumberFormsActivity(task.id);
          const step42NegativeNumberLineOptions = isStep42NegativeNumberLineActivity(task.id);
          const step44PowersRootsOptions = isStep44PowersRootsActivity(task.id);
          const step45RatioRatesOptions = isStep45RatioRatesActivity(task.id);
          const step46ProportionalReasoningOptions = isStep46ProportionalReasoningActivity(task.id);
          const step48EstimationBoundsOptions = isStep48EstimationBoundsActivity(task.id);
          const step49CalculationReasonablenessOptions = isStep49CalculationReasonablenessActivity(task.id);
          const step50AlgebraicThinkingOptions = isStep50AlgebraicThinkingActivity(task.id);
          const step51StandardFormOptions = isStep51StandardFormActivity(task.id);
          const step53ExactFractionsPiOptions = isStep53ExactFractionsPiActivity(task.id);
          const step54PercentageChangeOptions = isStep54PercentageChangeActivity(task.id);
          const step55RatioProportionRatesOptions = isStep55RatioProportionRatesActivity(task.id);
          const step56AlgebraGraphOptions = isStep56AlgebraGraphActivity(task.id);
          const step57FinancialModellingOptions = isStep57FinancialModellingActivity(task.id);
          const step58AccuracyRoundingOptions = isStep58AccuracyRoundingActivity(task.id);
          const step59EfficientStrategyOptions = isStep59EfficientStrategyActivity(task.id);
          const step2VisualModel = step2NumberWordOptions
            ? parseEarlyNumberVisualDescription(task.visualSupport?.description)
            : null;
          const step3VisualModel = step3NumeralOptions
            ? parseEarlyNumberVisualDescription(task.visualSupport?.description)
            : null;
          const statisticsStep1Options = task.id.startsWith("statistics-data-step-1-");

          return (
        <div
          style={{
            display: "grid",
            gap: 6,
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
                  step48EstimationBoundsOptions ||
                  step49CalculationReasonablenessOptions ||
                  step50AlgebraicThinkingOptions ||
                  step51StandardFormOptions ||
                  step53ExactFractionsPiOptions ||
                  step54PercentageChangeOptions ||
                  step55RatioProportionRatesOptions ||
                  step56AlgebraGraphOptions ||
                  step57FinancialModellingOptions ||
                  step58AccuracyRoundingOptions ||
                  step59EfficientStrategyOptions
                ? "repeat(auto-fit, minmax(132px, 1fr))"
              : undefined,
          }}
        >
          {task.options.map((option) => {
            const isSelected = response.value === option;
            const shapeVisual = task.id.startsWith(
              "geometry-spatial-reasoning-step-1-",
            )
              ? renderGeometryShapeVisualCard(option, isSelected)
              : null;
            const statisticsVisual =
              !shapeVisual && task.id.startsWith("statistics-data-step-1-")
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
            const step49Visual =
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
              !step48Visual &&
              step49CalculationReasonablenessOptions
                ? renderStep49WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step50Visual =
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
              !step48Visual &&
              !step49Visual &&
              step50AlgebraicThinkingOptions
                ? renderStep50WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step51Visual =
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
              !step48Visual &&
              !step49Visual &&
              !step50Visual &&
              step51StandardFormOptions
                ? renderStep51WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step53Visual =
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
              !step48Visual &&
              !step49Visual &&
              !step50Visual &&
              !step51Visual &&
              step53ExactFractionsPiOptions
                ? renderStep53WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step54Visual =
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
              !step48Visual &&
              !step49Visual &&
              !step50Visual &&
              !step51Visual &&
              !step53Visual &&
              step54PercentageChangeOptions
                ? renderStep54WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step55Visual =
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
              !step48Visual &&
              !step49Visual &&
              !step50Visual &&
              !step51Visual &&
              !step53Visual &&
              !step54Visual &&
              step55RatioProportionRatesOptions
                ? renderStep55WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step56Visual =
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
              !step48Visual &&
              !step49Visual &&
              !step50Visual &&
              !step51Visual &&
              !step53Visual &&
              !step54Visual &&
              !step55Visual &&
              step56AlgebraGraphOptions
                ? renderStep56WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step57Visual =
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
              !step48Visual &&
              !step49Visual &&
              !step50Visual &&
              !step51Visual &&
              !step53Visual &&
              !step54Visual &&
              !step55Visual &&
              !step56Visual &&
              step57FinancialModellingOptions
                ? renderStep57WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step58Visual =
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
              !step48Visual &&
              !step49Visual &&
              !step50Visual &&
              !step51Visual &&
              !step53Visual &&
              !step54Visual &&
              !step55Visual &&
              !step56Visual &&
              !step57Visual &&
              step58AccuracyRoundingOptions
                ? renderStep58WorksheetOptionCard({
                    option,
                    selected: isSelected,
                  })
                : null;
            const step59Visual =
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
              !step48Visual &&
              !step49Visual &&
              !step50Visual &&
              !step51Visual &&
              !step53Visual &&
              !step54Visual &&
              !step55Visual &&
              !step56Visual &&
              !step57Visual &&
              !step58Visual &&
              step59EfficientStrategyOptions
                ? renderStep59WorksheetOptionCard({
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
              step48Visual ??
              step49Visual ??
              step50Visual ??
              step51Visual ??
              step53Visual ??
              step54Visual ??
              step55Visual ??
              step56Visual ??
              step57Visual ??
              step58Visual ??
              step59Visual;

            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange(option)}
                style={{
                  border: isSelected ? "1px solid #2563eb" : "1px solid #e2e8f0",
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
                      : 10,
                  background: isSelected ? "#eff6ff" : "#ffffff",
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
                        : "8px 10px",
                  color: "#334155",
                  textAlign: "left",
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
                      : 1.45,
                  cursor: "pointer",
                  font: "inherit",
                  display: "grid",
                  justifyItems:
                    visualOption ? "center" : "stretch",
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
                        ? 68
                        : undefined,
                }}
              >
                {visualOption ?? option}
              </button>
            );
          })}
        </div>
          );
        })()
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
      <div>
        <CleanContentIssueReportButton context={reportContext} />
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
  buildReportContext,
  summaryReportContext,
}: {
  section: NumberPracticeSection;
  responses: LocalPracticeResponseMap;
  onChange: (taskId: string, value: string) => void;
  onCheck: (task: NumberPracticeTask) => void;
  buildReportContext: (
    task: NumberPracticeTask,
    response: LocalPracticeResponse,
    index: number,
  ) => ContentIssueReportContext;
  summaryReportContext: ContentIssueReportContext;
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
      <div>
        <CleanContentIssueReportButton
          label="Report an issue with this practice"
          context={summaryReportContext}
        />
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
        {section.tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            response={responses[task.id] ?? createEmptyResponse()}
            onChange={(value) => onChange(task.id, value)}
            onCheck={() => onCheck(task)}
            reportContext={buildReportContext(
              task,
              responses[task.id] ?? createEmptyResponse(),
              index,
            )}
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
  buildReportContext,
  summaryReportContext,
}: {
  tasks: NumberPracticeTask[];
  responses: LocalPracticeResponseMap;
  onChange: (taskId: string, value: string) => void;
  onCheck: (task: NumberPracticeTask) => void;
  buildReportContext: (
    task: NumberPracticeTask,
    response: LocalPracticeResponse,
    index: number,
  ) => ContentIssueReportContext;
  summaryReportContext: ContentIssueReportContext;
}) {
  const progress = buildProgressSummary(tasks, responses);

  return (
    <section style={cardStyle}>
      <div style={eyebrowStyle}>Mini check</div>
      <div style={quietTextStyle}>
        Try these after practice to see whether the focus is ready for reassessment.
      </div>
      <PracticeProgressSummary label="Mini-check summary" summary={progress} />
      <div style={{ marginTop: 10 }}>
        <CleanContentIssueReportButton
          label="Report an issue with this practice"
          context={summaryReportContext}
        />
      </div>
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
            reportContext={buildReportContext(
              task,
              responses[task.id] ?? createEmptyResponse(),
              index,
            )}
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
  const learnerId = safe(searchParams.get("learnerId"));
  const sourceAssessmentBand = safe(searchParams.get("sourceAssessmentBand"));
  const sourceProgressionStep = safe(
    searchParams.get("sourceProgressionStep"),
  );
  const sourceSubElement = safe(searchParams.get("sourceSubElement"));
  const returnTo = getSafeLocalHref(searchParams.get("returnTo"));
  const exactStepPractice = getStepPracticeForPathwayStep({
    stepPracticeKey: searchParams.get("stepPracticeKey"),
    pathwayStepId,
    stepKey,
    strandKey,
  });
  const exactStepPracticeTasks = exactStepPractice
    ? getStepPracticeTasksForDepth(exactStepPractice, stepPracticeDepth)
    : [];
  const exactStepAssessment = exactStepPractice
    ? getStepAssessmentForPathwayStep({
        pathwayStepId: exactStepPractice.pathwayStepId,
        stepKey: exactStepPractice.stepKey,
        strandKey: exactStepPractice.strandKey,
      })
    : null;
  const exactStepAssessmentHref = exactStepAssessment
    ? `/assessments/number?${new URLSearchParams({
        source: "my-pathways",
        stepAssessmentKey: exactStepAssessment.key,
        subjectKey: exactStepAssessment.subjectKey,
        strandKey: exactStepAssessment.strandKey,
        stageKey: exactStepAssessment.stageKey,
        pathwayStepId: exactStepAssessment.pathwayStepId,
        stepKey: exactStepAssessment.stepKey,
        progressionBandKey: exactStepAssessment.progressionBandKey,
        itemBankKey: exactStepAssessment.parentItemBankKey,
        returnTo: returnTo || "/my-pathways",
        ...(learnerId ? { learnerId } : {}),
      }).toString()}`
    : "";
  const currentStepPracticeTask =
    exactStepPracticeTasks[Math.min(stepPracticeIndex, exactStepPracticeTasks.length - 1)];
  const isLastExactStepPracticeTask =
    exactStepPracticeTasks.length > 0 &&
    stepPracticeIndex >= exactStepPracticeTasks.length - 1;
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

  function buildPracticeIssueContext(
    mode: "practice" | "summary",
    task?: NumberPracticeTask,
    response?: LocalPracticeResponse,
    index?: number,
  ): ContentIssueReportContext {
    const progressTasks = exactStepPractice ? exactStepPracticeTasks : selectedSectionTasks;
    const progress = buildProgressSummary(progressTasks, responses);

    return {
      mode,
      learnerId,
      subjectKey:
        exactStepPractice?.subjectKey ?? practiceModule?.subjectKey ?? subjectKey,
      strandKey:
        exactStepPractice?.strandKey ?? practiceModule?.strandKey ?? strandKey,
      stageKey: exactStepPractice?.stageKey ?? practiceModule?.stageKey ?? stageKey,
      pathwayStepId: exactStepPractice?.pathwayStepId ?? pathwayStepId,
      stepKey: exactStepPractice?.stepKey ?? stepKey,
      stepTitle: exactStepPractice?.title ?? practiceModule?.title ?? null,
      practiceDepth: exactStepPractice ? stepPracticeDepth : null,
      stepPracticeKey: exactStepPractice?.key ?? null,
      parentPracticeModuleKey:
        exactStepPractice?.parentModuleId ?? practiceModule?.id ?? requestedModuleId,
      taskId: task?.id ?? null,
      prompt: task?.prompt ?? null,
      responseType: task?.taskType ?? null,
      selectedAnswer: response?.value ?? null,
      expectedAnswer: task?.expectedAnswer ?? null,
      visualSupport: task?.visualSupport ?? {},
      context: {
        taskTitle: task?.title ?? null,
        taskIndex: typeof index === "number" ? index + 1 : null,
        selectedSectionId: selectedSection?.id ?? null,
        selectedSectionTitle: selectedSection?.title ?? null,
        sourceAssessmentBand,
        sourceProgressionStep,
        sourceSubElement,
        returnTo,
        result: response?.result ?? null,
        checked: response?.checked ?? null,
        summary:
          mode === "summary"
            ? {
                completedCount: progress.completedCount,
                checkedCount: progress.checkedCount,
                correctCount: progress.correctCount,
                needsReviewCount: progress.needsReviewCount,
                totalCount: progress.totalCount,
              }
            : null,
      },
    };
  }

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
          <Link
            href={exactStepAssessmentHref || buildAssessmentHref(sourceContext)}
            style={secondaryButtonStyle}
          >
            Return to assessment
          </Link>
          {returnTo ? (
            <Link href={returnTo} style={secondaryButtonStyle}>
              Return to pathway step
            </Link>
          ) : null}
        </div>

        {exactStepPractice ? (
          <>
            <section style={cardStyle}>
              <div style={eyebrowStyle}>Step-level practice</div>
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
                    reportContext={buildPracticeIssueContext(
                      "practice",
                      currentStepPracticeTask,
                      responses[currentStepPracticeTask.id] ?? createEmptyResponse(),
                      stepPracticeIndex,
                    )}
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
                  {isLastExactStepPracticeTask ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {returnTo ? (
                        <Link href={returnTo} style={buttonStyle}>
                          Return to pathway step
                        </Link>
                      ) : null}
                      {exactStepAssessmentHref ? (
                        <Link href={exactStepAssessmentHref} style={secondaryButtonStyle}>
                          Assess this skill
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setStepPracticeIndex((value) =>
                          Math.min(exactStepPracticeTasks.length - 1, value + 1),
                        )
                      }
                      style={buttonStyle}
                    >
                      Next task
                    </button>
                  )}
                </div>
              </div>
              <div style={{ ...quietTextStyle, marginTop: 8 }}>
                Practice stays local-only. No confidence, evidence, portfolio or reports are updated automatically.
              </div>
              <div style={{ marginTop: 10 }}>
                <CleanContentIssueReportButton
                  label="Report an issue with this practice"
                  context={buildPracticeIssueContext("summary")}
                />
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
                buildReportContext={(task, response, index) =>
                  buildPracticeIssueContext("practice", task, response, index)
                }
                summaryReportContext={buildPracticeIssueContext("summary")}
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
                buildReportContext={(task, response, index) =>
                  buildPracticeIssueContext("practice", task, response, index)
                }
                summaryReportContext={buildPracticeIssueContext("summary")}
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
