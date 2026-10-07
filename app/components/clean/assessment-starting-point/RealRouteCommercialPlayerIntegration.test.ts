import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { adaptAssessmentItemForStartingPointPlayer } from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import {
  getStartingPointRendererCoverageSummary,
  getStartingPointRendererQaItems,
} from "@/lib/clean/assessments/interactivePlayer/startingPointRendererCoverage";
import { MATHS_STARTING_POINT_RELEASE } from "@/lib/clean/assessments/mathsStartingPointRelease";
import { NUMBER_OPERATIONS_STARTING_POINT_PRODUCT } from "@/lib/clean/assessments/numberOperationsStartingPointProduct";
import { NUMBER_OPERATIONS_ASSET_APPROVALS } from "@/lib/clean/assessments/placement/numberOperationsAssetApprovals";
import { getNumberOperationsFreshRecheckCoverage } from "@/lib/clean/assessments/placement/numberOperationsFreshRecheckCoverage";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const pageSource = source(
  "app/(auth)/assessments/maths-starting-point/page.tsx",
);
const workspaceSource = source(
  "app/components/clean/assessment-starting-point/MathsStartingPointWorkspace.tsx",
);
const baselineSource = source(
  "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
);
const anchorSource = source(
  "app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner.tsx",
);
const sequenceSource = source(
  "app/components/clean/assessment-starting-point/AssessmentPlayerV1.tsx",
);
const playerSource = source(
  "app/components/clean/assessment-starting-point/interactive/StartingPointPlayer.tsx",
);
const phaserSource = source(
  "app/components/clean/assessment-starting-point/interactive/PhaserAssessmentStage.tsx",
);
const itemEndpointSource = source(
  "app/api/assessments/maths-starting-point/items/route.ts",
);
const scoreEndpointSource = source(
  "app/api/assessments/maths-starting-point/score/route.ts",
);
const trustedAssetApprovalRecord = source(
  "docs/assessments/trusted-mathematical-asset-remediation.md",
);

describe("real Number & Operations route commercial-player integration", () => {
  it("keeps the real route server protected and uses the existing controlled seam", () => {
    expect(pageSource).toContain("await requireAssessmentLabAccess(STARTING_POINT_ROUTE)");
    expect(pageSource.indexOf("await requireAssessmentLabAccess")).toBeLessThan(
      pageSource.indexOf("<MathsStartingPointWorkspace"),
    );
    expect(workspaceSource).toContain("<AssessmentNumberOperationsBaselineRunner");
    expect(baselineSource).toContain("<AssessmentAnchorPlacementRunner");
    expect(anchorSource).toContain("<AssessmentPlayerV1");
    expect(sequenceSource).toContain("<StartingPointPlayer");
    expect(playerSource).toContain("<PhaserAssessmentStage");
  });

  it("uses Phaser for parent placement without a second visible React answer form", () => {
    expect(sequenceSource).toContain(
      'if (questionRequest || (parentPresentation && mode === "placement"))',
    );
    expect(sequenceSource.indexOf("<StartingPointPlayer")).toBeLessThan(
      sequenceSource.indexOf("const presentationCopy"),
    );
    expect(playerSource).toContain("<details className={styles.accessibleFallback}>");
    expect(playerSource).toContain("Need another way to answer?");
    expect(phaserSource).toContain('data-player-renderer="phaser"');
  });

  it("returns a canonical response to the unchanged deterministic routing boundary", () => {
    expect(playerSource).toContain("scoreStartingPointPlayerAnswer");
    expect(sequenceSource).toContain("onResponse={(response) =>");
    expect(sequenceSource).toContain("onComplete?.(nextResponses)");
    expect(anchorSource).toContain("onComplete={handleInitialComplete}");
    expect(phaserSource).not.toContain("scoreAssessmentItem");
    expect(phaserSource).not.toContain("routeInitialAnchor");
  });

  it("keeps all five continua, coverage classes and approved assets intact", () => {
    expect(
      NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.assessedAreas.map(
        (area) => area.key,
      ),
    ).toEqual([
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
    ]);
    expect(getStartingPointRendererCoverageSummary()).toMatchObject({
      totalActiveItems: 220,
      initialPlacementItems: 120,
      freshRecheckItems: 100,
      practicalAlternativeItems: 18,
      routingOnlyEvidenceItems: 59,
    });
    expect(getNumberOperationsFreshRecheckCoverage()).toMatchObject({
      requiredProgressionLevels: 48,
      coveredProgressionLevels: 48,
      complete: true,
    });
    expect(trustedAssetApprovalRecord).toContain(
      "TRUSTED BASE-TEN ASSETS = APPROVED",
    );
    expect(
      NUMBER_OPERATIONS_ASSET_APPROVALS.find(
        (asset) => asset.id === "australian-currency-schematic-v1",
      )?.status,
    ).toBe("approved");
  });

  it("keeps Phaser payloads answer-safe for every active item", () => {
    for (const { item } of getStartingPointRendererQaItems()) {
      const payload = JSON.stringify(adaptAssessmentItemForStartingPointPlayer(item));
      expect(payload, item.id).not.toContain("correctOptionIds");
      expect(payload, item.id).not.toContain("correctValue");
      expect(payload, item.id).not.toContain("acceptableValues");
      expect(payload, item.id).not.toContain('"feedback"');
    }
    expect(anchorSource).toContain("questionRequest={questionRequest || undefined}");
    expect(sequenceSource).toContain("loadStartingPointQuestion");
    expect(sequenceSource).toContain("itemIndex: currentIndex");
    expect(anchorSource).not.toContain("numberOperationsP0Items");
    expect(itemEndpointSource).toContain("toAnswerSafeStartingPointItem");
    expect(itemEndpointSource).not.toContain("correctOptionIds:");
    expect(itemEndpointSource).not.toContain("correctValue:");
    expect(scoreEndpointSource).toContain("scoreAssessmentItem");
    expect(scoreEndpointSource).not.toContain("correctValue");
  });

  it("preserves learner-scoped browser continuation and every release lock", () => {
    expect(baselineSource).toContain(
      'const learnerStorageSuffix = learnerId ? `:${learnerId}` : ""',
    );
    expect(baselineSource).toContain(
      "`${NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY}${learnerStorageSuffix}${scopeStorageSuffix}`",
    );
    expect(baselineSource).toContain("window.sessionStorage.setItem");
    expect(baselineSource).toContain("MATHS_STARTING_POINT_RELEASE.persistenceEnabled");
    expect(baselineSource).toContain("onPause={() => window.location.assign(pauseHref)}");
    expect(baselineSource).not.toContain("saveNumberOperationsBaseline");
    expect(baselineSource).not.toContain("buildNumberOperationsBaselinePersistenceDraft");
    expect(
      Object.entries(MATHS_STARTING_POINT_RELEASE)
        .filter(([, value]) => typeof value === "boolean")
        .every(([, value]) => value === false),
    ).toBe(true);
  });
});
