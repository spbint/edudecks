import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pathwaysSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
  "utf8",
);
const bookletBuilderSource = readFileSync(
  join(process.cwd(), "lib/clean/resources/classicalBookletPdf.server.ts"),
  "utf8",
);
const bookletRouteSource = readFileSync(
  join(process.cwd(), "app/api/classical/booklets/[bookletKey]/route.ts"),
  "utf8",
);

describe("MyLearna Classical Encounter 1 release gate", () => {
  it("does not mark a Classical band current for an unrecognised learner year", () => {
    expect(pathwaysSource).toContain(
      'selectedSubjectKey === "classical" &&',
    );
    expect(pathwaysSource).toContain("!recognisedLearnerFocusStageKey");
    expect(pathwaysSource).toContain("return -1;");
    expect(pathwaysSource).toContain(
      "const currentStageIndex = selectedSubjectWorkspace.stages.findIndex",
    );
  });

  it("uses an explicit curriculum step key throughout detailed-card actions", () => {
    expect(pathwaysSource).toContain(
      "step.stepKey || buildPathwayRegistryStepKey(step.title, step.id)",
    );
    expect(pathwaysSource).toContain("[step.id, step.stepKey, step.title]");
  });

  it("fetches booklet page assets concurrently and embeds them in source order", () => {
    expect(bookletBuilderSource).toContain("const pageBuffers = await Promise.all(");
    expect(bookletBuilderSource).toContain("encounter.resource.pageImageUrls.map(async (imageUrl)");
    expect(bookletBuilderSource).toContain("for (const pageBytes of pageBuffers)");
  });

  it("resolves only trusted registry booklet keys through the scalable route", () => {
    expect(bookletRouteSource).toContain("context.params");
    expect(bookletRouteSource).toContain("buildClassicalBookletPdfResponse(bookletKey)");
    expect(bookletRouteSource).not.toContain("searchParams");
  });
});
