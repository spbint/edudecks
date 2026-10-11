import type { AdaptiveProgressionAnchorSet } from "./adaptiveProgressionRouting";

export type ChanceEvidenceMode =
  | "contextual-routing"
  | "direct-digital";

export type ChanceAnchor = {
  pLevel: number;
  role: "lower" | "initial" | "upper";
  evidenceMode: ChanceEvidenceMode;
  sourcePages: number[];
  sourceConstructs: string[];
};

export type ChanceAnchorSet =
  AdaptiveProgressionAnchorSet<"understanding-chance"> & {
    label: "Understanding chance";
    anchors: [ChanceAnchor, ChanceAnchor, ChanceAnchor];
  };

export const CHANCE_ANCHOR_SET: ChanceAnchorSet = {
  key: "understanding-chance",
  label: "Understanding chance",
  minP: 1,
  maxP: 6,
  lowerP: 2,
  initialP: 4,
  upperP: 6,
  anchors: [
    {
      pLevel: 2,
      role: "lower",
      evidenceMode: "direct-digital",
      sourcePages: [19],
      sourceConstructs: [
        "order likelihood using non-quantitative chance language",
        "recognise variation between expected and actual chance results",
      ],
    },
    {
      pLevel: 4,
      role: "initial",
      evidenceMode: "direct-digital",
      sourcePages: [20],
      sourceConstructs: [
        "express theoretical probability as favourable outcomes over total possibilities",
        "represent probabilities from 0 to 1 as fractions, decimals or percentages",
      ],
    },
    {
      pLevel: 6,
      role: "upper",
      evidenceMode: "direct-digital",
      sourcePages: [20],
      sourceConstructs: [
        "reason with and/or/not/at least combinations",
        "solve informal conditional probability problems",
        "evaluate chance claims and acknowledge uncertainty",
      ],
    },
  ],
};

export function getChanceEvidenceMode(pLevel: number): ChanceEvidenceMode {
  return pLevel <= 1 ? "contextual-routing" : "direct-digital";
}

export const CHANCE_SOURCE = {
  title: "QCAA Numeracy general capability — Sequence of numeracy progressions",
  element: "Statistics and probability",
  subElement: "Understanding chance",
  pages: [19, 20],
  version: "Australian Curriculum v9.0 · March 2024",
} as const;
