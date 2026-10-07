// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./AssessmentPlayerV1", () => ({
  default: ({
    title,
    onComplete,
  }: {
    title: string;
    onComplete?: (responses: Array<{ correct: boolean }>) => void;
  }) => {
    const correctness = title.includes("P6 initial anchor")
      ? [false, false]
      : title.includes("P3 branch anchor")
        ? [true, false]
        : title.includes("P4 boundary probes")
          ? [true, true, false]
          : [false, false, false];
    return (
      <button
        type="button"
        onClick={() =>
          onComplete?.(
            correctness.map((correct, index) => ({
              itemId: `protected-item-${index}`,
              selectedOptionIds: [],
              correct,
              skillId: `protected-skill-${index}`,
              misconceptionTags: [],
            })),
          )
        }
      >
        Complete protected set
      </button>
    );
  },
}));

import AssessmentAnchorPlacementRunner from "./AssessmentAnchorPlacementRunner";

afterEach(() => cleanup());

describe("AssessmentAnchorPlacementRunner", () => {
  it("routes a learner from NPV P6 down to a P3-P6 candidate neighbourhood", () => {
    render(
      React.createElement(AssessmentAnchorPlacementRunner, {
        anchorSetKey: "number-place-value",
      }),
    );

    expect(screen.getByText("Initial anchor · P6")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Complete protected set" }));

    expect(screen.getByText("Lower branch · P3")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Complete protected set" }));

    expect(screen.getByText(/Boundary search · P4 within P3–P6/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Complete protected set" }));

    expect(screen.getByText(/Boundary search · P5 within P4–P6/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Complete protected set" }));

    expect(screen.getByText("P4–P5")).toBeTruthy();
    expect(
      screen.getByText(/current assessment evidence is concentrated between P4 and P5/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/verify P5 across more than one construct/i),
    ).toBeTruthy();
    expect(screen.queryByText(/100%/)).toBeNull();
  });
});


describe("parent presentation", () => {
  it("keeps adaptive routing language and P-level detail out of the parent shell", () => {
    render(
      React.createElement(AssessmentAnchorPlacementRunner, {
        anchorSetKey: "number-place-value",
        presentation: "parent",
        allowBandConfirmation: false,
      }),
    );

    expect(screen.getByText("Adaptive Number & Operations check")).toBeTruthy();
    expect(screen.queryByText("Automatic routing proof")).toBeNull();
    expect(screen.queryByText(/Initial anchor · P/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Restart this area" })).toBeTruthy();
  });
});


it("keeps the first parent cluster deliberate but auto-starts internal adaptive probes", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner.tsx",
    ),
    "utf8",
  );

  const initialBlock = source.slice(
    source.indexOf('if (stage.kind === "initial")'),
    source.indexOf('} else if (stage.kind === "reserve")'),
  );
  expect(initialBlock).not.toContain("autoStart={parentPresentation}");

  for (const stage of ["reserve", "branch", "search", "boundary"]) {
    const start = source.indexOf(`} else if (stage.kind === "${stage}")`);
    expect(start, stage).toBeGreaterThan(-1);
    const next = source.indexOf("} else if", start + 10);
    const block = source.slice(start, next > start ? next : source.length);
    expect(block, stage).toContain("autoStart={parentPresentation}");
  }
});


it("lets the parent baseline own the area-complete message instead of duplicating it inside routing", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner.tsx",
    ),
    "utf8",
  );

  expect(source.replace(/\r\n/g, "\n")).toContain(
    'stage.kind === "result" ? (\n        parentPresentation ? null',
  );
});

it("routes the accessible-form escape hatch to unresolved observed evidence instead of a score", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner.tsx",
    ),
    "utf8",
  );

  const handlerStart = source.indexOf(
    "const handlePracticalObservationAlternative",
  );
  const handlerEnd = source.indexOf("let player = null", handlerStart);
  const handler = source.slice(handlerStart, handlerEnd);

  expect(handlerStart).toBeGreaterThan(-1);
  expect(handlerEnd).toBeGreaterThan(handlerStart);
  expect(handler).toContain(
    "parent chose practical observation instead of a visual-dependent item",
  );
  expect(handler).toContain(
    'headline: "Practical observation required."',
  );
  expect(handler).not.toContain("placementResult:");
  expect(handler).not.toContain("buildNumberOperationsCandidateBandResult");
  expect(source).toContain("onUsePracticalObservation={");
});


it("enforces mayRoute before entering asset-review progression levels", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("blockUnapprovedProgressionLevel");
  expect(source).toContain("if (policy.mayRoute) return false");
  expect(source).toContain(
    "if (blockUnapprovedProgressionLevel(route.targetP)) return",
  );
  expect(source).toContain(
    "if (blockUnapprovedProgressionLevel(targetP)) return",
  );
  expect(source).toContain(
    "setStage(resultForUnavailableTarget(anchorSet, pLevel))",
  );
});


it("never embeds a state-changing evidence gate inside a boolean boundary condition", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner.tsx",
    ),
    "utf8",
  );

  expect(source).not.toContain(
    "!blockUnapprovedProgressionLevel",
  );
  expect(source).toContain(
    "if (blockUnapprovedProgressionLevel(nextP)) return",
  );
});


it("uses the explicit trusted-asset approval registry for asset-review levels", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("isNumberOperationsAssetApproved");
  expect(source).toContain("assetApproved,");
  expect(source).toContain(
    "subElementKey: anchorSet.key as NumberOperationsSubElementKey",
  );
});
