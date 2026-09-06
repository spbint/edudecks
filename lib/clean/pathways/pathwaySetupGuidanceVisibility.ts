type PathwaysSetupGuidanceVisibilityInput = {
  missingSetupItems: readonly string[];
  missingLearnerSetup: boolean;
  hasValidSelectedLearner: boolean;
  hasUsablePathwaysWorkingState: boolean;
};

export function shouldShowPathwaysSetupGuidance({
  missingSetupItems,
  missingLearnerSetup,
  hasValidSelectedLearner,
  hasUsablePathwaysWorkingState,
}: PathwaysSetupGuidanceVisibilityInput) {
  if (!missingSetupItems.length) return false;
  if (missingLearnerSetup) return true;
  if (hasValidSelectedLearner && hasUsablePathwaysWorkingState) return false;
  return true;
}
