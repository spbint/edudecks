import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
      "Find a useful starting point in Number & Operations",
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
