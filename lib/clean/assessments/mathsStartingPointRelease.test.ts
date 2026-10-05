import { describe, expect, it } from "vitest";
import {
  MATHS_STARTING_POINT_RELEASE,
  assertMathsStartingPointPersistenceEnabled,
  assertMathsStartingPointStaffPreviewSafety,
} from "./mathsStartingPointRelease";

describe("Maths starting-point release gate", () => {
  it("keeps the clean candidate staff-only and read-only", () => {
    expect(MATHS_STARTING_POINT_RELEASE).toMatchObject({
      phase: "staff-preview",
      customerVisible: false,
      persistenceEnabled: false,
      evidenceWriteEnabled: false,
      pathwayMutationEnabled: false,
      customerNavigationEnabled: false,
      hostedAcceptanceApproved: false,
      mobileAcceptanceApproved: false,
    });
    expect(assertMathsStartingPointStaffPreviewSafety()).toBe(true);
    expect(() => assertMathsStartingPointPersistenceEnabled()).toThrow(
      /persistence is disabled/i,
    );
  });
});


it("allows a future persistence smoke while the feature remains staff-only", () => {
  const source = "export const MATHS_STARTING_POINT_RELEASE = Object.freeze({\n  version: \"v1\",\n  phase: \"staff-preview\" as const,\n  customerVisible: false,\n  persistenceEnabled: false,\n  evidenceWriteEnabled: false,\n  pathwayMutationEnabled: false,\n  customerNavigationEnabled: false,\n  hostedAcceptanceApproved: false,\n  mobileAcceptanceApproved: false,\n});\n\nexport function assertMathsStartingPointStaffPreviewSafety() {\n  if (MATHS_STARTING_POINT_RELEASE.customerVisible) {\n    throw new Error(\"Maths starting-point v1 is not approved for customer visibility.\");\n  }\n  if (MATHS_STARTING_POINT_RELEASE.evidenceWriteEnabled) {\n    throw new Error(\"Maths starting-point v1 evidence writes are not approved.\");\n  }\n  if (MATHS_STARTING_POINT_RELEASE.pathwayMutationEnabled) {\n    throw new Error(\"Maths starting-point v1 pathway mutation is not approved.\");\n  }\n  if (MATHS_STARTING_POINT_RELEASE.customerNavigationEnabled) {\n    throw new Error(\"Maths starting-point v1 customer navigation is not approved.\");\n  }\n  if (\n    MATHS_STARTING_POINT_RELEASE.persistenceEnabled &&\n    MATHS_STARTING_POINT_RELEASE.customerVisible\n  ) {\n    throw new Error(\n      \"Maths starting-point persistence cannot be enabled while customer visibility is active in staff-preview phase.\",\n    );\n  }\n  return true;\n}\n\nexport function assertMathsStartingPointPersistenceEnabled() {\n  if (!MATHS_STARTING_POINT_RELEASE.persistenceEnabled) {\n    throw new Error(\n      \"Maths starting-point persistence is disabled until the reviewed migration is explicitly approved and applied.\",\n    );\n  }\n  return true;\n}\n";
  expect(source).not.toContain(
    'throw new Error("Maths starting-point v1 persistence is not approved.")',
  );
  expect(source).toContain(
    "persistence cannot be enabled while customer visibility is active",
  );
});
