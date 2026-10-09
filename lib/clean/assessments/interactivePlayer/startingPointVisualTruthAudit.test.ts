import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUSTRALIAN_COIN_DENOMINATIONS,
  AUSTRALIAN_COIN_SPECIFICATIONS,
  BASE_TEN_MANIPULATIVE_SPEC,
} from "@/lib/clean/assessments/visualTemplates/trustedMathAssetSpecifications";
import { adaptAssessmentItemForStartingPointPlayer } from "./startingPointPlayerContract";
import { getStartingPointRendererQaItems } from "./startingPointRendererCoverage";
import {
  deriveStartingPointPlayerVisualTruthSignature,
  formatStartingPointVisualTruthInventory,
  getStartingPointTextOnlyCandidateAudit,
  getStartingPointVisualTruthAuditSummary,
  getStartingPointVisualTruthInventory,
} from "./startingPointVisualTruthAudit";

describe("Starting Point visual truth audit", () => {
  const estate = getStartingPointRendererQaItems();
  const inventory = getStartingPointVisualTruthInventory();
  const summary = getStartingPointVisualTruthAuditSummary();

  it("resolves a visual classification for the complete 220-item estate", () => {
    expect(estate).toHaveLength(220);
    expect([...summary.classificationCounts.entries()]).toEqual([
      ["presentation-visual", 30],
      ["text-or-symbol-sufficient", 171],
      ["canonical-visual", 19],
    ]);
    expect(inventory).toHaveLength(49);
    expect(summary.unresolvedItems).toEqual([]);
    expect(summary.conclusion).toBe("pass");
  });

  it("derives every renderer-family signature without copying the item bank", () => {
    expect(Object.fromEntries(summary.familyCounts)).toEqual({
      "counter-groups": 17,
      "closed-groups": 8,
      "counter-set": 10,
      "place-value": 3,
      currency: 6,
      "currency-repeat": 5,
    });
    for (const entry of inventory) {
      const playerModel = adaptAssessmentItemForStartingPointPlayer(entry.item);
      expect(
        deriveStartingPointPlayerVisualTruthSignature(playerModel),
        entry.item.id,
      ).toEqual(entry.truthSignature);
      expect(entry.promptStimulusResponseCoherence).toBe("resolved");
      expect(entry.answerSafety).toBe("resolved");
      expect(entry.auditResult).toBe("pass");
    }
  });

  it("keeps renderer loops bound to the audited semantic quantities", () => {
    const stageSource = readFileSync(
      join(process.cwd(), "app/components/clean/assessment-starting-point/interactive/PhaserAssessmentStage.tsx"),
      "utf8",
    );
    expect(stageSource).toContain("for (let index = 0; index < quantity; index += 1)");
    expect(stageSource).toContain("index >= quantity - (stimulus.removeCount ?? 0)");
    expect(stageSource).toContain("for (let index = 0; index < recipientCount; index += 1)");
    expect(stageSource).toContain("Array.from({ length: stimulus.count })");
    expect(stageSource).toContain("const tokens = data.tokens.slice(0, 8)");
    expect(stageSource).toContain("for (let i = 0; i < (data.thousands || 0); i += 1)");
    expect(stageSource).toContain("for (let i = 0; i < (data.hundreds || 0); i += 1)");
    expect(stageSource).toContain("for (let i = 0; i < (data.tens || 0); i += 1)");
    expect(stageSource).toContain("for (let i = 0; i < (data.ones || 0); i += 1)");
  });

  it("preserves every counter set and counter-group quantity", () => {
    for (const entry of inventory) {
      const signature = entry.truthSignature;
      if (signature.kind === "counter-set") {
        expect(signature.quantity, entry.item.id).toBeGreaterThan(0);
      }
      if (signature.kind === "counter-groups") {
        expect(signature.groups.every(Number.isInteger), entry.item.id).toBe(true);
        expect(signature.groups.every((quantity) => quantity >= 0), entry.item.id).toBe(true);
        if (signature.action === "remove") {
          expect(signature.removeCount, entry.item.id).toBeGreaterThan(0);
          expect(signature.remainingCount, entry.item.id).toBe(
            signature.groups.reduce((sum, quantity) => sum + quantity, 0) - signature.removeCount,
          );
        }
        if (signature.action === "share") {
          expect(signature.recipientCount, entry.item.id).toBeGreaterThan(0);
          expect(signature.groups.reduce((sum, quantity) => sum + quantity, 0)).toBe(
            Number(entry.item.prompt.match(/^\d+/)?.[0]),
          );
        }
      }
    }
  });

  it("preserves each closed-group structure and total", () => {
    const entries = inventory.filter((entry) => entry.truthSignature.kind === "closed-groups");
    expect(entries).toHaveLength(8);
    for (const entry of entries) {
      const signature = entry.truthSignature;
      if (signature.kind !== "closed-groups") throw new Error("Unexpected truth family.");
      expect(signature.groupCount, entry.item.id).toBe(signature.groups.length);
      expect(signature.totalCount, entry.item.id).toBe(
        signature.groups.reduce((sum, quantity) => sum + quantity, 0),
      );
    }
  });

  it("computes every place-value representation from trusted subdivisions", () => {
    const entries = inventory.filter((entry) => entry.truthSignature.kind === "place-value");
    expect(entries).toHaveLength(3);
    for (const entry of entries) {
      const signature = entry.truthSignature;
      if (signature.kind !== "place-value") throw new Error("Unexpected truth family.");
      expect(signature.representedValue, entry.item.id).toBe(
        signature.thousands * 1000 + signature.hundreds * 100 + signature.tens * 10 + signature.ones,
      );
    }
    expect(BASE_TEN_MANIPULATIVE_SPEC).toMatchObject({
      tenUnits: 10,
      hundredRows: 10,
      hundredColumns: 10,
      thousandRows: 10,
      thousandColumns: 10,
    });
  });

  it("preserves canonical and repeated Australian currency mathematics", () => {
    const cents = { "5c": 5, "10c": 10, "20c": 20, "50c": 50, "$1": 100, "$2": 200 } as const;
    for (const entry of inventory) {
      const signature = entry.truthSignature;
      if (signature.kind === "currency") {
        expect(signature.totalCents, entry.item.id).toBe(
          signature.denominations.reduce((sum, denomination) => sum + cents[denomination], 0),
        );
      }
      if (signature.kind === "currency-repeat") {
        expect(signature.totalCents, entry.item.id).toBe(
          signature.count * cents[signature.denomination],
        );
      }
    }
    expect(Object.keys(AUSTRALIAN_COIN_SPECIFICATIONS)).toEqual(
      AUSTRALIAN_COIN_DENOMINATIONS,
    );
    expect(AUSTRALIAN_COIN_SPECIFICATIONS["50c"].sides).toBe(12);
    expect(
      AUSTRALIAN_COIN_DENOMINATIONS.filter(
        (denomination) => AUSTRALIAN_COIN_SPECIFICATIONS[denomination].sides === 12,
      ),
    ).toEqual(["50c"]);
  });

  it("explicitly resolves every likely visual-reference text-only candidate", () => {
    const candidates = getStartingPointTextOnlyCandidateAudit();
    expect(candidates).toHaveLength(32);
    expect(new Set(candidates.map((entry) => entry.itemId)).size).toBe(32);
    expect(candidates.every((entry) => entry.reason.length > 0)).toBe(true);
  });

  it("keeps all visual item provenance and practical-accessibility state attached", () => {
    expect(inventory.every((entry) => entry.item.id === entry.coverage.itemId)).toBe(true);
    expect(inventory.every((entry) => entry.item.version === entry.coverage.itemVersion)).toBe(true);
    expect(inventory.every((entry) => entry.coverage.form === "initial-placement" || entry.coverage.form === "fresh-recheck")).toBe(true);
    expect(inventory.every((entry) => typeof entry.coverage.accessibilityLimited === "boolean")).toBe(true);
    expect(formatStartingPointVisualTruthInventory().split("\n")).toHaveLength(50);
  });

  it("protects staff truth before the inventory can enter a client payload", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "app/(auth)/assessments/maths-starting-point/visual-truth/page.tsx"),
      "utf8",
    );
    expect(routeSource).toContain("await requireAssessmentLabAccess(VISUAL_TRUTH_ROUTE)");
    expect(routeSource.indexOf("await requireAssessmentLabAccess")).toBeLessThan(
      routeSource.lastIndexOf("getStartingPointVisualTruthInventory()"),
    );
    expect(routeSource).not.toContain("correctOptionIds");
    expect(routeSource).not.toContain("correctValue");
  });
});
