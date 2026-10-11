import type { AdaptiveProgressionAnchorSet } from "./adaptiveProgressionRouting";

export type MeasurementUnitsEvidenceMode =
  | "hybrid-practical"
  | "direct-digital"
  | "trusted-visual-review";

export type MeasurementUnitsAnchor = {
  pLevel: number;
  role: "lower" | "initial" | "upper";
  evidenceMode: MeasurementUnitsEvidenceMode;
  sourcePages: number[];
  sourceConstructs: string[];
};

export type MeasurementUnitsAnchorSet =
  AdaptiveProgressionAnchorSet<"understanding-units-measurement"> & {
    label: "Understanding units of measurement";
    anchors: [MeasurementUnitsAnchor, MeasurementUnitsAnchor, MeasurementUnitsAnchor];
  };

export const MEASUREMENT_UNITS_ANCHOR_SET: MeasurementUnitsAnchorSet = {
  key: "understanding-units-measurement",
  label: "Understanding units of measurement",
  minP: 1,
  maxP: 10,
  lowerP: 3,
  initialP: 6,
  upperP: 9,
  anchors: [
    {
      pLevel: 3,
      role: "lower",
      evidenceMode: "hybrid-practical",
      sourcePages: [14],
      sourceConstructs: [
        "choose and use appropriate uniform informal units",
        "measure without gaps or overlaps",
        "count informal units to compare measurements",
      ],
    },
    {
      pLevel: 6,
      role: "initial",
      evidenceMode: "trusted-visual-review",
      sourcePages: [15],
      sourceConstructs: [
        "measure and estimate with metric units",
        "interpret unlabelled calibrations on scaled instruments",
        "compare angles to a right angle",
      ],
    },
    {
      pLevel: 9,
      role: "upper",
      evidenceMode: "direct-digital",
      sourcePages: [15],
      sourceConstructs: [
        "use formulas for areas of non-rectangular quadrilaterals",
        "calculate volume and surface area of right prisms",
        "calculate circumference and area of circles using pi",
      ],
    },
  ],
};

export function getMeasurementUnitsEvidenceMode(
  pLevel: number,
): MeasurementUnitsEvidenceMode {
  if (pLevel <= 4) return "hybrid-practical";
  if (pLevel <= 6) return "trusted-visual-review";
  return "direct-digital";
}

export const MEASUREMENT_UNITS_SOURCE = {
  title: "QCAA Numeracy general capability — Sequence of numeracy progressions",
  element: "Measurement and geometry",
  subElement: "Understanding units of measurement",
  pages: [14, 15],
  version: "Australian Curriculum v9.0 · March 2024",
} as const;
