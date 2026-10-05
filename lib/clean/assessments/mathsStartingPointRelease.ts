export const MATHS_STARTING_POINT_RELEASE = Object.freeze({
  version: "v1",
  phase: "staff-preview" as const,
  customerVisible: false,
  persistenceEnabled: false,
  evidenceWriteEnabled: false,
  pathwayMutationEnabled: false,
  customerNavigationEnabled: false,
  hostedAcceptanceApproved: false,
  mobileAcceptanceApproved: false,
});

export function assertMathsStartingPointStaffPreviewSafety() {
  if (MATHS_STARTING_POINT_RELEASE.customerVisible) {
    throw new Error("Maths starting-point v1 is not approved for customer visibility.");
  }
  if (MATHS_STARTING_POINT_RELEASE.persistenceEnabled) {
    throw new Error("Maths starting-point v1 persistence is not approved.");
  }
  if (MATHS_STARTING_POINT_RELEASE.evidenceWriteEnabled) {
    throw new Error("Maths starting-point v1 evidence writes are not approved.");
  }
  if (MATHS_STARTING_POINT_RELEASE.pathwayMutationEnabled) {
    throw new Error("Maths starting-point v1 pathway mutation is not approved.");
  }
  if (MATHS_STARTING_POINT_RELEASE.customerNavigationEnabled) {
    throw new Error("Maths starting-point v1 customer navigation is not approved.");
  }
  return true;
}

export function assertMathsStartingPointPersistenceEnabled() {
  if (!MATHS_STARTING_POINT_RELEASE.persistenceEnabled) {
    throw new Error(
      "Maths starting-point persistence is disabled until the reviewed migration is explicitly approved and applied.",
    );
  }
  return true;
}
