// @vitest-environment jsdom

import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildNumberOperationsCandidateBandResult } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import { buildNumberOperationsSubElementAttemptTrace } from "@/lib/clean/assessments/placement/numberOperationsAttemptTrace";
import { NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY } from "@/lib/clean/assessments/placement/numberOperationsBaselineDraft";

vi.mock("./AssessmentAnchorPlacementRunner", () => ({
  default: ({
    anchorSetKey,
    onResult,
    onAttemptTrace,
  }: {
    anchorSetKey: string;
    onResult?: (result: unknown) => void;
    onAttemptTrace?: (trace: unknown) => void;
  }) =>
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const subElementKey = anchorSetKey as
            | "number-place-value"
            | "counting-processes"
            | "additive-strategies"
            | "multiplicative-strategies"
            | "understanding-money";
          const result = buildNumberOperationsCandidateBandResult({
            subElementKey,
            lowerP: 5,
            upperP: 6,
          });
          onResult?.(result);
          onAttemptTrace?.(
            buildNumberOperationsSubElementAttemptTrace({
              subElementKey,
              subElementLabel: anchorSetKey,
              stages: [
                {
                  stage: "initial",
                  pLevel: 5,
                  responses: [
                    {
                      itemId: `${anchorSetKey}-item`,
                      selectedOptionIds: ["a"],
                      correct: true,
                      skillId: `${anchorSetKey}-skill`,
                      misconceptionTags: [],
                    },
                  ],
                },
              ],
              routeTrace: [],
              result,
            }),
          );
        },
      },
      `Complete ${anchorSetKey}`,
    ),
}));

import AssessmentNumberOperationsBaselineRunner from "./AssessmentNumberOperationsBaselineRunner";

beforeEach(() => window.sessionStorage.clear());
afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("AssessmentNumberOperationsBaselineRunner", () => {
  it("collects five independent area results into one profile", () => {
    render(React.createElement(AssessmentNumberOperationsBaselineRunner));

    expect(screen.getByText("Adaptive question budget")).toBeTruthy();
    expect(screen.getByText(/bounded between \d+ and \d+ questions/i)).toBeTruthy();

    const keys = [
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
    ];

    for (let index = 0; index < keys.length; index += 1) {
      fireEvent.click(
        screen.getByRole("button", { name: `Complete ${keys[index]}` }),
      );
      const continueLabel =
        index === keys.length - 1
          ? "See the starting-point profile"
          : "Continue to the next area";
      fireEvent.click(screen.getByRole("button", { name: continueLabel }));
    }

    expect(screen.getByText("A profile, not one averaged level")).toBeTruthy();
    expect(screen.getByText(/5 of 5 sub-elements/i)).toBeTruthy();
    expect(screen.getAllByText("P5–P6")).toHaveLength(10);
    expect(screen.getByText("Assessment evidence preview")).toBeTruthy();
    expect(screen.getByText("Not saved yet")).toBeTruthy();
    expect(
      screen.getByText(/can become Portfolio and report evidence after explicit parent confirmation/i),
    ).toBeTruthy();
    expect(screen.getByText(/Baseline data handoff · schema v1/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/Baseline data handoff · schema v1/i));
    expect(screen.getByText(/not written to the existing pathway-scoped assessment_attempts table/i)).toBeTruthy();
    expect(screen.getByText(/"pathwayAttemptCompatible": false/i)).toBeTruthy();
    expect(screen.getByText(/Future persistence rows · 5 responses/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/Future persistence rows · 5 responses/i));
    expect(
      screen.getByText(/No family ID, learner ID, database ID or user ID is created here/i),
    ).toBeTruthy();
    const completedRaw = window.sessionStorage.getItem(
      NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY,
    );
    expect(completedRaw).toBeTruthy();
    expect(JSON.parse(completedRaw || "{}")).toMatchObject({
      status: "complete",
      currentIndex: 4,
      tracesByKey: {},
    });
  });

  it("resumes completed areas from browser-local session storage", async () => {
    const first = render(
      React.createElement(AssessmentNumberOperationsBaselineRunner),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Complete number-place-value" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to next area" }),
    );

    await waitFor(() => {
      const raw = window.sessionStorage.getItem(
        NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY,
      );
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw || "{}").currentIndex).toBe(1);
    });

    first.unmount();

    render(React.createElement(AssessmentNumberOperationsBaselineRunner));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Complete counting-processes" }),
      ).toBeTruthy();
    });
    expect(screen.getByText(/Area 2 of 5/i)).toBeTruthy();
    expect(
      screen.getByText(/Progress and the completed starting-point profile stay in this browser tab/i),
    ).toBeTruthy();
  });
});


it("keeps a completed browser-only profile available for the practice-return loop", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain('draft.status === "complete"');
  expect(source).toContain('setComplete(true)');
  expect(source).toContain('status: complete ? "complete" : "in_progress"');
  expect(source).not.toContain(
    "if (complete) {\n      window.sessionStorage.removeItem",
  );
  expect(source).toContain("hydratedCompleteRef.current");
});


it("drops raw response traces from the completed browser-only draft", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain(
    "tracesByKey: complete ? {} : tracesByKey",
  );
});


it("makes the bounded parent question load explicit without inventing a duration", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("Five separate Maths areas");
  expect(source).toContain("budget.bySubElement[currentIndex]?.minimumQuestions");
  expect(source).toContain("budget.bySubElement[currentIndex]?.maximumQuestions");
  expect(source).toContain("MyLearna pauses between areas");
  expect(source).not.toMatch(/\b\d+\s*(?:minute|minutes|min)\b/i);
});


it("turns unresolved areas into concrete practical-observation guidance", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("buildNumberOperationsUnresolvedGuidance");
  expect(source).toContain("A few areas need real-life evidence");
  expect(source).toContain("What to notice");
  expect(source).toContain("guidance.evidenceToLookFor.map");
});


it("offers a learner-preserving pause point only between completed areas", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain('currentIndex > 0 && pendingResult === undefined');
  expect(source).toContain("Pause here and return to My Pathways");
  expect(source).toContain('subjectKey: "mathematics"');
  expect(source).toContain('params.set("learnerId", cleanLearnerId)');
});


it("can complete one focused area without forcing the other four areas", () => {
  render(
    React.createElement(AssessmentNumberOperationsBaselineRunner, {
      subElementKeys: ["additive-strategies"],
      mode: "parent-preview",
      learnerId: "learner-focused",
    }),
  );

  expect(screen.getByText(/Area 1 of 1/i)).toBeTruthy();
  expect(screen.getByText("One focused Maths area")).toBeTruthy();
  expect(
    screen.getByRole("progressbar", {
      name: "Starting-point areas completed",
    }),
  ).toHaveAttribute("aria-valuenow", "0");
  expect(
    screen.getByRole("button", { name: "Complete additive-strategies" }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Complete number-place-value" }),
  ).toBeNull();

  fireEvent.click(
    screen.getByRole("button", { name: "Complete additive-strategies" }),
  );
  expect(
    screen.getByRole("progressbar", {
      name: "Starting-point areas completed",
    }),
  ).toHaveAttribute("aria-valuenow", "1");
  fireEvent.click(
    screen.getByRole("button", { name: "See the starting-point profile" }),
  );

  expect(
    screen.getByText("A clear starting point for what to do next"),
  ).toBeTruthy();
});

it("namespaces focused-area browser drafts separately from the full five-area draft", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain('scopeStorageSuffix');
  expect(source).toContain(':scope-');
  expect(source).toContain('order.join("+")');
  expect(source).toContain('isFullScope ? ""');
});


it("explains adaptive difficulty without implying year-based placement", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("Some questions may feel unusually easy or hard");
  expect(source).toContain(
    "rather than assuming a level from the learner&apos;s age or year",
  );
});


it("keeps unresolved observation capture attached to the same learner and focused scope", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("Capture what you noticed");
  expect(source).toContain('learningArea: "mathematics"');
  expect(source).toContain('learningAreaLabel: "Mathematics"');
  expect(source).toContain("returnTo: startingPointReturnHref");
  expect(source).toContain('if (order.length === 1 && order[0]) params.set("area", order[0])');
  expect(source).toContain('if (cleanLearnerId) params.set("learnerId", cleanLearnerId)');
});


it("builds focused profiles against the requested scope rather than the full five-area contract", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain(
    "expectedSubElementKeys: order",
  );
  expect(source).not.toContain(
    "buildNumberOperationsProfile(Object.values(resultsByKey))",
  );
  expect(source).not.toContain(
    "buildNumberOperationsProfile(finalResults);",
  );
});


it("does not allow a rehydrated completed summary to bypass trusted route replay", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("replayTraceCount");
  expect(source).toContain("replayTraceCount === order.length");
  expect(source).toContain("persistenceReplayRequired");
  expect(source).toContain(
    "Completed browser summaries deliberately drop raw response traces",
  );
  expect(source).toContain(
    "MyLearna will not persist a rehydrated summary without those traces",
  );
});

it("keeps the persistence smoke control staff-only, idempotent and tied to canonical family/learner context", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );
  const workspaceSource = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/MathsStartingPointWorkspace.tsx",
    ),
    "utf8",
  );

  expect(source).toContain("MATHS_STARTING_POINT_RELEASE.persistenceEnabled");
  expect(source).toContain("!MATHS_STARTING_POINT_RELEASE.customerVisible");
  expect(source).toContain("saveNumberOperationsBaseline");
  expect(source).toContain("persistenceSubmissionIdRef.current");
  expect(source).toContain("maths-start-");
  expect(source).toContain("Run staff persistence smoke");
  expect(workspaceSource).toContain("familyId={workspace.profile.id}");
  expect(workspaceSource).toContain("familyStorageMode={workspace.storageMode}");
  expect(source).toContain('familyStorageMode === "database"');
  expect(source).toContain("familyId: String(familyId)");
  expect(source).toContain("learnerId: String(learnerId)");
});
