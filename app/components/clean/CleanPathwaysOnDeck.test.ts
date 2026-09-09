import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
  "utf8",
);
const actionRowSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwayStepActionRow.tsx"),
  "utf8",
);

describe("Pathways On Deck action", () => {
  it("loads On Deck from its own queue table rather than Calendar or evidence", () => {
    expect(workspaceSource).toContain("listLearningQueueItems");
    expect(workspaceSource).toContain("setOnDeckItems(nextItems)");
    expect(workspaceSource).toContain("LearningQueueItem");
    expect(workspaceSource).not.toContain("calendar_items");
    expect(workspaceSource).not.toContain("createCleanCalendarItem");
  });

  it("passes Put on deck state through the real detailed step action path", () => {
    expect(workspaceSource).toContain("onPutStepOnDeck={handlePutStepOnDeck}");
    expect(workspaceSource).toContain("onRemoveStepFromDeck={handleRemoveStepFromDeck}");
    expect(workspaceSource).toContain("hasLearningQueueItemForStep");
    expect(workspaceSource).toContain('onDeck={stepOnDeck}');
    expect(workspaceSource).toContain('onDeck={Boolean(selectedPlacementOnDeckItem)}');
    expect(workspaceSource).toContain("onDeckBusy={onDeckBusyStepId === selectedPlacementStep.id}");
    expect(workspaceSource).toContain("handlePutStepOnDeck(selectedPlacementStep)");
    expect(workspaceSource).toContain("selectedPlacementOnDeckItem.id");
    expect(actionRowSource).toContain("Put on deck");
    expect(actionRowSource).toContain("On deck");
    expect(actionRowSource).toContain("Remove from deck");
  });

  it("does not turn On Deck into completion, evidence, or Pathway advancement", () => {
    const putHandler = workspaceSource.slice(
      workspaceSource.indexOf("const handlePutStepOnDeck"),
      workspaceSource.indexOf("const handleRemoveStepFromDeck"),
    );
    const removeHandler = workspaceSource.slice(
      workspaceSource.indexOf("const handleRemoveStepFromDeck"),
      workspaceSource.indexOf("const reloadUnifiedPathwayStepState"),
    );

    expect(putHandler).toContain("addPathwayStepToLearningQueue");
    expect(putHandler).not.toContain("savePathwayPlacement");
    expect(putHandler).not.toContain("createCleanEvidenceEntry");
    expect(putHandler).not.toContain("createCleanCalendarItem");
    expect(removeHandler).toContain("removeLearningQueueItem");
    expect(removeHandler).not.toContain("savePathwayPlacement");
    expect(removeHandler).not.toContain("createCleanEvidenceEntry");
    expect(removeHandler).not.toContain("createCleanCalendarItem");
  });
});
