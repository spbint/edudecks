import { describe, expect, it } from "vitest";
import {
  MATHS_STARTING_POINT_RELEASE,
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
    });
    expect(assertMathsStartingPointStaffPreviewSafety()).toBe(true);
  });
});
