import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import StartingPointPlayerShowcase from "@/app/components/clean/assessment-starting-point/interactive/StartingPointPlayerShowcase";
import {
  ADDITIVE_P6_ANCHOR_ITEMS,
  ADDITIVE_P9_ANCHOR_ITEMS,
  COUNTING_P2_ANCHOR_ITEMS,
  MONEY_P1_SEARCH_ITEMS,
  MONEY_P2_ANCHOR_ITEMS,
  NPV_P3_ANCHOR_ITEMS,
  NPV_P9_ANCHOR_ITEMS,
} from "@/lib/clean/assessments/placement/numberOperationsP0Items";

export const metadata: Metadata = {
  title: "Starting Point Player Review | MyLearna",
  description: "Staff-only review surface for the MyLearna Maths Starting Point interactive player.",
  robots: { index: false, follow: false },
};

const showcaseItems = [
  { label: "Multiple choice", item: ADDITIVE_P6_ANCHOR_ITEMS[0] },
  { label: "Numeric entry", item: ADDITIVE_P9_ANCHOR_ITEMS[1] },
  { label: "Counter counting", item: COUNTING_P2_ANCHOR_ITEMS[0] },
  { label: "Drag to order", item: NPV_P9_ANCHOR_ITEMS[0] },
  { label: "Place value", item: NPV_P3_ANCHOR_ITEMS[1] },
  {
    label: "Australian currency",
    item: MONEY_P1_SEARCH_ITEMS[1],
    variants: [
      MONEY_P1_SEARCH_ITEMS[1],
      MONEY_P2_ANCHOR_ITEMS[0],
      MONEY_P2_ANCHOR_ITEMS[1],
    ],
  },
];

export default function MathsStartingPointPlayerShowcasePage() {
  return (
    <AssessmentAccessGate mode="lab">
      <StartingPointPlayerShowcase items={showcaseItems} />
    </AssessmentAccessGate>
  );
}
