import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
} from "@/lib/clean/assessments/placement/numberOperationsItemRegistry";
import {
  getNumberOperationsFreshRecheckCoverage,
} from "@/lib/clean/assessments/placement/numberOperationsFreshRecheckCoverage";
import {
  getNumberOperationsFreshRecheckItems,
} from "@/lib/clean/assessments/placement/numberOperationsFreshRecheckItems";
import {
  adaptAssessmentItemForStartingPointPlayer,
} from "./startingPointPlayerContract";
import {
  formatStartingPointRendererCoverageMatrix,
  getStartingPointRendererCoverageInventory,
  getStartingPointRendererCoverageSummary,
  getStartingPointRendererQaItems,
  resolveStartingPointRendererCoverage,
} from "./startingPointRendererCoverage";
import {
  classifyStartingPointDevelopmentalAccessibility,
  getStartingPointPresentationCopy,
  getStartingPointReadAloudText,
  hasStartingPointPresentationStimulus,
} from "./startingPointDevelopmentalAccessibility";

describe("Starting Point full-estate renderer coverage", () => {
  const inventory = getStartingPointRendererCoverageInventory();
  const summary = getStartingPointRendererCoverageSummary();

  it("derives the complete active estate from initial and fresh canonical sources", () => {
    expect(summary.totalActiveItems).toBe(220);
    expect(summary.initialPlacementItems).toBe(
      NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.length,
    );
    expect(summary.freshRecheckItems).toBe(
      getNumberOperationsFreshRecheckItems().length,
    );
    expect(new Set(inventory.map((entry) => entry.itemId)).size).toBe(
      inventory.length,
    );
    expect(getNumberOperationsFreshRecheckCoverage()).toMatchObject({
      requiredProgressionLevels: 48,
      coveredProgressionLevels: 48,
      missingProgressionLevels: 0,
      complete: true,
    });
  });

  it("provides canonical item objects for staff QA without a copied registry", () => {
    const qaItems = getStartingPointRendererQaItems();
    expect(qaItems).toHaveLength(inventory.length);
    expect(qaItems.map((entry) => entry.item.id)).toEqual(
      inventory.map((entry) => entry.itemId),
    );
  });

  it("classifies all 220 items for developmental access and read-aloud support", () => {
    expect([...summary.developmentalStageCounts.entries()]).toEqual([
      ["junior-primary-p1", 20],
      ["junior-primary-p2", 20],
      ["junior-primary-p3", 22],
      ["developing-p4-p6", 79],
      ["extending-p7-p10", 79],
    ]);
    expect([...summary.readAloudCounts.entries()]).toEqual([
      ["listen-essential", 20],
      ["listen-recommended", 42],
      ["listen-available", 158],
    ]);
    expect(inventory.every((entry) => entry.developmentalStage && entry.readAloud)).toBe(true);
  });

  it("adds a separate presentation stimulus to junior items that name unseen objects or groups", () => {
    const qaItems = getStartingPointRendererQaItems();
    const remediated = qaItems.filter((entry) => entry.coverage.stimulusCoverage === "presentation-visual");
    expect(remediated).toHaveLength(30);
    expect([...summary.stimulusCoverageCounts.entries()]).toEqual([
      ["presentation-visual", 30],
      ["text-or-symbol-sufficient", 171],
      ["canonical-visual", 19],
    ]);

    const visualLanguage = /\b(counter|counters|collection|group|groups|pack|packs|box|boxes|token|tokens)\b/i;
    const juniorVisualClaims = qaItems.filter(({ item, coverage }) =>
      coverage.developmentalStage.startsWith("junior-primary") && visualLanguage.test(item.prompt),
    );
    for (const { item, coverage } of juniorVisualClaims) {
      expect(coverage.stimulusCoverage, item.id).not.toBe("text-or-symbol-sufficient");
      expect(
        item.stimulus.type !== "none" || hasStartingPointPresentationStimulus(item.id),
        item.id,
      ).toBe(true);
    }
  });

  it("creates answer-safe read-aloud text without visual descriptions or answer keys", () => {
    for (const { item } of getStartingPointRendererQaItems()) {
      const classification = classifyStartingPointDevelopmentalAccessibility(item);
      const readAloudText = getStartingPointReadAloudText(item);
      expect(classification.readAloud).toMatch(/^listen-/);
      expect(readAloudText).toContain(
        getStartingPointPresentationCopy(item).prompt,
      );
      expect(readAloudText).not.toContain("correctOptionIds");
      expect(readAloudText).not.toContain("correctValue");
      expect(readAloudText).not.toContain("altText");
    }
  });

  it("covers every electronic item and explicitly classifies practical evidence", () => {
    const electronic = inventory.filter(
      (entry) => entry.electronicallyRenderable,
    );
    const practical = inventory.filter(
      (entry) => !entry.electronicallyRenderable,
    );
    expect(electronic).toHaveLength(220);
    expect(electronic.every((entry) => entry.rendererFamily !== null)).toBe(true);
    expect(practical).toHaveLength(0);
    expect(summary.practicalAlternativeItems).toBe(18);
    expect(summary.routingOnlyEvidenceItems).toBe(59);
  });

  it("uses only the six accepted renderer families without a generic fallback", () => {
    expect([...summary.rendererCounts.keys()].sort()).toEqual([
      "australian-currency",
      "counter-counting",
      "drag-to-order",
      "multiple-choice",
      "numeric-entry",
      "place-value",
    ]);
    expect(
      inventory.some((entry) =>
        ["generic", "react-form", "unknown"].includes(
          entry.rendererFamily ?? "",
        ),
      ),
    ).toBe(false);
  });

  it("adapts every canonical item without changing IDs, versions or fallback policy", () => {
    const items = [
      ...NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.map(
        (entry) => entry.item,
      ),
      ...getNumberOperationsFreshRecheckItems(),
    ];
    const coverageById = new Map(
      inventory.map((entry) => [entry.itemId, entry]),
    );
    for (const item of items) {
      const coverage = coverageById.get(item.id);
      const model = adaptAssessmentItemForStartingPointPlayer(item);
      expect(coverage).toBeDefined();
      expect(model.itemId).toBe(item.id);
      expect(model.itemVersion).toBe(item.version);
      expect(model.kind).toBe(coverage?.rendererFamily);
      expect(model.requiresPracticalAlternative).toBe(
        coverage?.accessibilityLimited,
      );
    }
  });

  it("locks the canonical item ID and version estate", () => {
    const signature = inventory
      .map((entry) => `${entry.form}:${entry.itemId}@${entry.itemVersion}`)
      .sort()
      .join("\n");
    expect(createHash("sha256").update(signature).digest("hex")).toBe(
      "393af43ef3dee965ea5ba86c4f7e93ba69043b7e38b0f77addae77bd690cb29e",
    );
  });

  it("fails loudly when a future electronic item has no accepted renderer", () => {
    const canonical = NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY[0].item;
    expect(() =>
      resolveStartingPointRendererCoverage({
        item: {
          ...canonical,
          id: "unsupported-renderer-proof",
          stimulus: { type: "unmapped-electronic-visual", data: {} },
        },
        assessmentRole: "anchor",
        form: "initial-placement",
      }),
    ).toThrow(/unsupported electronic stimulus/i);
  });

  it("produces an auditable matrix row for every canonical item", () => {
    const report = formatStartingPointRendererCoverageMatrix();
    expect(report.split("\n")).toHaveLength(inventory.length + 1);
    expect(report).toContain(
      "continuum\tprogression\titem_id\tversion\trole\tform\tresponse\tstimulus\tevidence\trenderer\tdevelopmental_stage\tread_aloud\tstimulus_coverage",
    );
    for (const continuum of [
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
    ]) {
      expect(report).toContain(continuum);
    }
  });
});
