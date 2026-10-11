"use client";

import React from "react";
import AssessmentAdaptiveSubElementLab from "@/app/components/clean/assessment-lab/AssessmentAdaptiveSubElementLab";
import {
  FRACTION_ANCHOR_SET,
  getFractionEvidenceMode,
} from "@/lib/clean/assessments/placement/fractionAnchors";
import {
  FRACTION_BOUNDARY_CLUSTERS,
  FRACTION_EXECUTABLE_ANCHORS,
  FRACTION_P6_RESERVE_ITEM,
  FRACTION_SEARCH_CLUSTERS,
} from "@/lib/clean/assessments/placement/fractionItems";
import {
  buildFractionCandidateBandResult,
  buildFractionEndpointResult,
} from "@/lib/clean/assessments/placement/fractionPlacementResult";

function key(pLevel: number) {
  return `interpreting-fractions-p${pLevel}`;
}

function anchorItems(pLevel: number) {
  return (
    FRACTION_EXECUTABLE_ANCHORS[
      key(pLevel) as keyof typeof FRACTION_EXECUTABLE_ANCHORS
    ] || null
  );
}

function searchItems(pLevel: number) {
  return (
    FRACTION_SEARCH_CLUSTERS[
      key(pLevel) as keyof typeof FRACTION_SEARCH_CLUSTERS
    ] || null
  );
}

function boundaryItems(pLevel: number) {
  return (
    FRACTION_BOUNDARY_CLUSTERS[
      key(pLevel) as keyof typeof FRACTION_BOUNDARY_CLUSTERS
    ] || null
  );
}

function evidenceWarning(lowerP: number, upperP = lowerP) {
  const modes = Array.from(
    { length: upperP - lowerP + 1 },
    (_, index) => getFractionEvidenceMode(lowerP + index),
  );

  if (modes.includes("hybrid-practical")) {
    return "This band includes physically creating equal fraction parts or repeated halving. Electronic evidence can route the learner, but practical partitioning evidence is required before strengthening the lower-end claim.";
  }

  if (modes.includes("trusted-visual-review")) {
    return "This band depends partly on equal-part or fractional number-line visuals. The deterministic assets are score-bearing and remain subject to hosted phone/tablet/desktop visual review.";
  }

  return undefined;
}

export default function AssessmentFractionsLab() {
  return (
    <AssessmentAdaptiveSubElementLab
      elementLabel="Number sense and algebra"
      title="Interpreting fractions"
      intro="Full P1–P9 adaptive route using P3 / P6 / P9 anchors. Early levels retain practical evidence ceilings; later levels assess fraction magnitude, equivalence, number-line reasoning, operations and proportional fraction relationships."
      anchorSet={FRACTION_ANCHOR_SET}
      anchorCards={[...FRACTION_ANCHOR_SET.anchors]}
      reserveItem={FRACTION_P6_RESERVE_ITEM}
      getAnchorItems={anchorItems}
      getSearchItems={searchItems}
      getBoundaryItems={boundaryItems}
      buildBandResult={({ lowerP, upperP }) =>
        buildFractionCandidateBandResult({ lowerP, upperP })
      }
      buildEndpointResult={(relation, pLevel) =>
        buildFractionEndpointResult({ relation, pLevel })
      }
      evidenceWarning={evidenceWarning}
    />
  );
}
