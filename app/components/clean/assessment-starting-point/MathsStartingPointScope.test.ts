import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NUMBER_OPERATIONS_STARTING_POINT_PRODUCT } from "@/lib/clean/assessments/numberOperationsStartingPointProduct";

const assessmentPage = readFileSync(
  join(process.cwd(), "app/(auth)/assessments/maths-starting-point/page.tsx"),
  "utf8",
);
const practicePage = readFileSync(
  join(process.cwd(), "app/(auth)/practice/maths-starting-point/page.tsx"),
  "utf8",
);
const resultCard = readFileSync(
  join(
    process.cwd(),
    "app/components/clean/assessment-starting-point/AssessmentNumberOperationsParentUtilityCard.tsx",
  ),
  "utf8",
);
const pathways = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
  "utf8",
);

describe("Maths starting-point v1 scope language", () => {
  it("states that v1 covers Number & Operations rather than all Mathematics", () => {
    expect(assessmentPage).toContain(
      "NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.commercialDisplayName",
    );
    expect(assessmentPage).not.toContain(
      "Find a useful starting point in Maths",
    );
    expect(resultCard).toContain(
      "Number & Operations starting point",
    );
    expect(practicePage).toContain(
      "Number & Operations Starting Point Practice",
    );
    expect(pathways).toContain(
      "Staff preview · Number & Operations starting point",
    );
  });

  it("does not advertise the v1 entry inside unrelated Mathematics strands", () => {
    expect(pathways).toContain("MATHS_STARTING_POINT_STRANDS");
    expect(pathways).toContain('"number-and-place-value"');
    expect(pathways).toContain('"operations-and-calculation"');
    expect(pathways).toContain('"financial-and-real-world-mathematics"');
  });
});


it("offers a full picture or one focused Number & Operations area", () => {
  const workspaceSource = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/MathsStartingPointWorkspace.tsx",
    ),
    "utf8",
  );
  const runnerSource = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(workspaceSource).toContain('searchParams.get("area")');
  expect(workspaceSource).toContain("Full five-area picture");
  expect(NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.assessedAreas.map((area) => area.key)).toEqual([
    "number-place-value",
    "counting-processes",
    "additive-strategies",
    "multiplicative-strategies",
    "understanding-money",
  ]);
  expect(workspaceSource).toContain(
    "subElementKeys={selectedArea ? [selectedArea.key] : undefined}",
  );
  expect(runnerSource).toContain("subElementKeys?: NumberOperationsSubElementKey[]");
  expect(runnerSource).toContain("One focused Number & Operations area");
  expect(runnerSource).toContain("scopeStorageSuffix");
});


it("treats a focused area as complete for that selected scope rather than inherently partial", () => {
  const workspaceSource = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/MathsStartingPointWorkspace.tsx",
    ),
    "utf8",
  );
  const runnerSource = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(workspaceSource).toContain(
    "The result is complete for this selected area only",
  );
  expect(workspaceSource).not.toContain("The result is deliberately partial");
  expect(runnerSource).toContain("expectedSubElementKeys: order");
});
