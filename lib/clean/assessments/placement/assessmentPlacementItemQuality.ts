import {
  ASSESSMENT_PLACEMENT_ITEM_REGISTRY,
  type AssessmentPlacementItemRegistryEntry,
} from "./assessmentPlacementItemRegistry";
import {
  validatePlacementItem,
  type PlacementItemQualityIssue,
} from "./numberOperationsItemQuality";

export function validateAssessmentPlacementItem(
  entry: AssessmentPlacementItemRegistryEntry,
): PlacementItemQualityIssue[] {
  return validatePlacementItem(entry);
}

export function auditAssessmentPlacementItems() {
  return ASSESSMENT_PLACEMENT_ITEM_REGISTRY.flatMap(
    validateAssessmentPlacementItem,
  );
}
