import type { AdaptiveProgressionAnchorSet } from "./adaptiveProgressionRouting";

export type FractionEvidenceMode =
  | "hybrid-practical"
  | "trusted-visual-review"
  | "direct-digital";

export type FractionAnchor = {
  pLevel: number;
  role: "lower" | "initial" | "upper";
  evidenceMode: FractionEvidenceMode;
  sourcePages: number[];
  sourceConstructs: string[];
};

export type FractionAnchorSet =
  AdaptiveProgressionAnchorSet<"interpreting-fractions"> & {
    label: "Interpreting fractions";
    anchors: [FractionAnchor, FractionAnchor, FractionAnchor];
  };

export const FRACTION_ANCHOR_SET: FractionAnchorSet = {
  key: "interpreting-fractions",
  label: "Interpreting fractions",
  minP: 1,
  maxP: 9,
  lowerP: 3,
  initialP: 6,
  upperP: 9,
  anchors: [
    {
      pLevel: 3,
      role: "lower",
      evidenceMode: "trusted-visual-review",
      sourcePages: [8],
      sourceConstructs: [
        "accumulate fractional parts",
        "interpret symbolic fractions using part-whole knowledge",
        "use halves, quarters and eighths in measurement situations",
      ],
    },
    {
      pLevel: 6,
      role: "initial",
      evidenceMode: "trusted-visual-review",
      sourcePages: [9],
      sourceConstructs: [
        "connect fractions with division",
        "justify fraction locations on a number line",
        "connect benchmark fractions with decimal equivalents",
      ],
    },
    {
      pLevel: 9,
      role: "upper",
      evidenceMode: "direct-digital",
      sourcePages: [9],
      sourceConstructs: [
        "use a fraction as a ratio to compare two sets",
        "interpret part-to-whole and part-to-part fractional relationships proportionally",
      ],
    },
  ],
};

export function getFractionEvidenceMode(
  pLevel: number,
): FractionEvidenceMode {
  if (pLevel <= 2) return "hybrid-practical";
  if (pLevel <= 6) return "trusted-visual-review";
  return "direct-digital";
}

export const FRACTION_SOURCE = {
  title: "QCAA Numeracy general capability — Sequence of numeracy progressions",
  element: "Number sense and algebra",
  subElement: "Interpreting fractions",
  pages: [8, 9],
  version: "Australian Curriculum v9.0 · March 2024",
} as const;
