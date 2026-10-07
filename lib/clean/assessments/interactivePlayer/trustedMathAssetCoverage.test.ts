import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MATHS_STARTING_POINT_RELEASE } from "@/lib/clean/assessments/mathsStartingPointRelease";
import { NUMBER_OPERATIONS_ASSET_APPROVALS } from "@/lib/clean/assessments/placement/numberOperationsAssetApprovals";
import {
  AUSTRALIAN_COIN_DENOMINATIONS,
  AUSTRALIAN_COIN_SPECIFICATIONS,
  BASE_TEN_MANIPULATIVE_SPEC,
} from "@/lib/clean/assessments/visualTemplates/trustedMathAssetSpecifications";
import { getStartingPointPresentationCopy } from "./startingPointDevelopmentalAccessibility";
import {
  getHistoricalTrustedAssetQaReferences,
  getTrustedMathAssetCoverage,
} from "./trustedMathAssetCoverage";

describe("Starting Point trusted mathematical asset coverage", () => {
  it("locks historical QA references to canonical active item IDs", () => {
    expect(
      getHistoricalTrustedAssetQaReferences().map(({ qaNumber, itemId }) => ({
        qaNumber,
        itemId,
      })),
    ).toEqual([
      { qaNumber: 77, itemId: "myl-recheck-cnt-p07-b-v1" },
      { qaNumber: 79, itemId: "myl-anchor-cnt-p07-b-v1" },
      { qaNumber: 141, itemId: "myl-anchor-npv-p03-b-v1" },
    ]);
  });

  it("covers every active base-ten visual and every active currency stimulus", () => {
    const coverage = getTrustedMathAssetCoverage();
    expect(coverage.activeItems).toHaveLength(220);
    expect(coverage.baseTenVisuals.map((entry) => entry.item.id)).toEqual([
      "myl-recheck-cnt-p07-b-v1",
      "myl-anchor-cnt-p07-b-v1",
      "myl-anchor-npv-p03-b-v1",
    ]);
    expect(coverage.currencyVisuals).toHaveLength(11);
    expect(
      coverage.currencyVisuals.filter(
        (entry) => entry.source === "canonical-stimulus",
      ),
    ).toHaveLength(6);
    expect(
      coverage.currencyVisuals.filter(
        (entry) => entry.source === "presentation-stimulus",
      ),
    ).toHaveLength(5);
    expect(coverage.understandingMoneyItems).toHaveLength(46);
  });

  it("defines one coherent decimal manipulative family", () => {
    expect(BASE_TEN_MANIPULATIVE_SPEC).toMatchObject({
      tenUnits: 10,
      hundredRows: 10,
      hundredColumns: 10,
      thousandRows: 10,
      thousandColumns: 10,
    });
    const approvalRecord = readFileSync(
      join(
        process.cwd(),
        "docs/assessments/trusted-mathematical-asset-remediation.md",
      ),
      "utf8",
    );
    expect(approvalRecord).toContain("TRUSTED BASE-TEN ASSETS = APPROVED");
    for (const component of [
      "unit cube",
      "ten rod",
      "hundred flat",
      "thousand cube",
    ]) {
      expect(approvalRecord).toContain(`- ${component}: approved`);
    }
  });

  it("locks all six Australian coin dimensions and the 12-sided 50c geometry", () => {
    expect(AUSTRALIAN_COIN_DENOMINATIONS).toEqual([
      "5c",
      "10c",
      "20c",
      "50c",
      "$1",
      "$2",
    ]);
    expect(
      AUSTRALIAN_COIN_DENOMINATIONS.map(
        (denomination) =>
          AUSTRALIAN_COIN_SPECIFICATIONS[denomination].diameterMm,
      ),
    ).toEqual([19.41, 23.6, 28.65, 31.65, 25, 20.5]);
    expect(AUSTRALIAN_COIN_SPECIFICATIONS["50c"].sides).toBe(12);
    expect(
      AUSTRALIAN_COIN_DENOMINATIONS.filter(
        (denomination) =>
          AUSTRALIAN_COIN_SPECIFICATIONS[denomination].sides === 12,
      ),
    ).toEqual(["50c"]);
  });

  it("uses coin wording in learner presentation metadata wherever the item depicts coins", () => {
    const coverage = getTrustedMathAssetCoverage();
    const tokenWordedCanonicalItems = coverage.understandingMoneyItems.filter(
      (entry) => /\btoken(s)?\b/i.test(entry.item.prompt),
    );
    expect(tokenWordedCanonicalItems).toHaveLength(9);
    for (const { item } of tokenWordedCanonicalItems) {
      const prompt = getStartingPointPresentationCopy(item).prompt;
      expect(prompt, item.id).toMatch(/\bcoin(s)?\b/i);
      expect(prompt, item.id).not.toMatch(/\btoken(s)?\b/i);
    }
  });

  it("records asset approval while keeping every release gate off", () => {
    expect(NUMBER_OPERATIONS_ASSET_APPROVALS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "australian-currency-schematic-v1",
          status: "approved",
          approvalProvenance: {
            approvalType: "human-visual-review",
            assetFamily: "Australian currency schematic",
            reviewedImplementationSha:
              "7ca0af353a4aef08b60b2462614e56ce24f8a0df",
            reviewResult: "approved",
            reviewDate: "2026-10-07",
          },
        }),
      ]),
    );
    expect(
      Object.entries(MATHS_STARTING_POINT_RELEASE)
        .filter(([, value]) => typeof value === "boolean")
        .map(([key, value]) => [key, value]),
    ).toEqual([
      ["customerVisible", false],
      ["persistenceEnabled", false],
      ["evidenceWriteEnabled", false],
      ["pathwayMutationEnabled", false],
      ["customerNavigationEnabled", false],
      ["hostedAcceptanceApproved", false],
      ["mobileAcceptanceApproved", false],
      ["freshRecheckFormsApproved", false],
    ]);
  });
});
