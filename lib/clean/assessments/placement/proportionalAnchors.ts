import type { AdaptiveProgressionAnchorSet } from "./adaptiveProgressionRouting";

export type ProportionalEvidenceMode =
  | "trusted-visual-review"
  | "direct-digital";

export type ProportionalAnchor = {
  pLevel: number;
  role: "lower" | "initial" | "upper";
  evidenceMode: ProportionalEvidenceMode;
  sourcePages: number[];
  sourceConstructs: string[];
};

export type ProportionalAnchorSet =
  AdaptiveProgressionAnchorSet<"proportional-thinking"> & {
    label: "Proportional thinking";
    anchors: [ProportionalAnchor, ProportionalAnchor, ProportionalAnchor];
  };

export const PROPORTIONAL_ANCHOR_SET: ProportionalAnchorSet = {
  key: "proportional-thinking",
  label: "Proportional thinking",
  minP: 1,
  maxP: 7,
  lowerP: 2,
  initialP: 4,
  upperP: 6,
  anchors: [
    {
      pLevel: 2,
      role: "lower",
      evidenceMode: "direct-digital",
      sourcePages: [9],
      sourceConstructs: [
        "use fraction-decimal-percentage equivalence fluently",
        "calculate a percentage of a quantity",
        "express one quantity as a percentage of another",
      ],
    },
    {
      pLevel: 4,
      role: "initial",
      evidenceMode: "direct-digital",
      sourcePages: [9],
      sourceConstructs: [
        "scale quantities while maintaining a ratio",
        "use rates to determine how quantities change",
      ],
    },
    {
      pLevel: 6,
      role: "upper",
      evidenceMode: "direct-digital",
      sourcePages: [10],
      sourceConstructs: [
        "apply percentage multipliers for increase and decrease",
        "model direct and inverse proportion",
        "use ratios, rates and scale factors in authentic problems",
      ],
    },
  ],
};

export function getProportionalEvidenceMode(
  pLevel: number,
): ProportionalEvidenceMode {
  return pLevel <= 1 ? "trusted-visual-review" : "direct-digital";
}

export const PROPORTIONAL_SOURCE = {
  title: "QCAA Numeracy general capability — Sequence of numeracy progressions",
  element: "Number sense and algebra",
  subElement: "Proportional thinking",
  pages: [9, 10],
  version: "Australian Curriculum v9.0 · March 2024",
} as const;
