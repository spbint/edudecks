import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import StartingPointPlayerShowcase from "@/app/components/clean/assessment-starting-point/interactive/StartingPointPlayerShowcase";
import {
  getStartingPointRendererQaEdgeCases,
  getStartingPointRendererQaItems,
  getStartingPointRendererCoverageSummary,
} from "@/lib/clean/assessments/interactivePlayer/startingPointRendererCoverage";
import { NUMBER_OPERATIONS_STARTING_POINT_PRODUCT } from "@/lib/clean/assessments/numberOperationsStartingPointProduct";
import { requireAssessmentLabAccess } from "@/lib/clean/assessments/assessmentLabAccess.server";

export const metadata: Metadata = {
  title: `Full-estate player QA | ${NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.shortDisplayName}`,
  description: `Staff-only full-estate review for ${NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.commercialDisplayName}.`,
  robots: { index: false, follow: false },
};

const SHOWCASE_ROUTE = "/assessments/maths-starting-point/player-showcase";

export default async function MathsStartingPointPlayerShowcasePage() {
  await requireAssessmentLabAccess(SHOWCASE_ROUTE);
  const summary = getStartingPointRendererCoverageSummary();
  return (
    <AssessmentAccessGate mode="lab">
      <StartingPointPlayerShowcase
        items={getStartingPointRendererQaItems()}
        edgeCases={getStartingPointRendererQaEdgeCases()}
        summary={{
          total: summary.totalActiveItems,
          initial: summary.initialPlacementItems,
          fresh: summary.freshRecheckItems,
          alternatives: summary.practicalAlternativeItems,
          routingOnly: summary.routingOnlyEvidenceItems,
        }}
      />
    </AssessmentAccessGate>
  );
}
