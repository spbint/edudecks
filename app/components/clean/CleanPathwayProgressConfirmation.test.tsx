// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import CleanPathwayProgressConfirmation from "@/app/components/clean/CleanPathwayProgressConfirmation";
import { upsertCleanAssessmentSkillStatus } from "@/lib/clean/assessments/client";

vi.mock("@/lib/clean/assessments/client", () => ({
  upsertCleanAssessmentSkillStatus: vi.fn(),
}));

const mockedUpsert = vi.mocked(upsertCleanAssessmentSkillStatus);

const statusRecord: CleanAssessmentSkillStatus = {
  id: "status-1",
  familyId: "family-1",
  learnerId: "learner-1",
  subjectKey: "mathematics",
  skillKey: "mathematics::number-and-place-value::middle-primary::step-one",
  stageKey: "middle-primary",
  status: "Strong",
  note: null,
  createdByUserId: "user-1",
  createdAt: "2026-08-13T00:00:00.000Z",
  updatedAt: "2026-08-13T00:00:00.000Z",
  pathwayStepId: "mathematics::number-and-place-value::middle-primary::step-one",
  strandKey: "number-and-place-value",
  stepKey: "step-one",
};

function renderControl(overrides: Partial<React.ComponentProps<typeof CleanPathwayProgressConfirmation>> = {}) {
  return render(
    <CleanPathwayProgressConfirmation
      familyId="family-1"
      learnerId="learner-1"
      subjectKey="mathematics"
      stageKey="middle-primary"
      strandKey="number-and-place-value"
      stepKey="step-one"
      pathwayStepId="mathematics::number-and-place-value::middle-primary::step-one"
      {...overrides}
    />,
  );
}

describe("CleanPathwayProgressConfirmation", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows an evidence suggestion without saving it", () => {
    renderControl({ evidenceSuggestion: "Developing" });

    expect(screen.getByText("Evidence suggests: Developing. This is only a suggestion until you confirm it.")).toBeTruthy();
    expect(mockedUpsert).not.toHaveBeenCalled();
  });

  it("saves the parent selection with canonical step context", async () => {
    const onSaved = vi.fn();
    mockedUpsert.mockResolvedValue(statusRecord);
    renderControl({ onSaved });

    fireEvent.click(screen.getByRole("button", { name: "Confirm progress" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Parent-confirmed progress" }), {
      target: { value: "Secure" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save progress" }));

    await waitFor(() => expect(mockedUpsert).toHaveBeenCalledTimes(1));
    expect(mockedUpsert).toHaveBeenCalledWith("family-1", {
      learnerId: "learner-1",
      subjectKey: "mathematics",
      skillKey: "mathematics::number-and-place-value::middle-primary::step-one",
      stageKey: "middle-primary",
      status: "Strong",
      note: null,
      pathwayStepId: "mathematics::number-and-place-value::middle-primary::step-one",
      strandKey: "number-and-place-value",
      stepKey: "step-one",
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(statusRecord));
    expect(screen.getByText("Parent confirmation: Secure")).toBeTruthy();
  });

  it("keeps the prior confirmed value and reports a save failure", async () => {
    const onSaved = vi.fn();
    mockedUpsert.mockRejectedValue(new Error("offline"));
    renderControl({ confirmedStatus: "Strong", onSaved });

    expect(screen.getByText("Parent confirmation: Secure")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm progress" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Parent-confirmed progress" }), {
      target: { value: "Needs support" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save progress" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByText("Parent confirmation: Secure")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Parent-confirmed progress" })).toHaveProperty("value", "Needs support");
    expect(onSaved).not.toHaveBeenCalled();
  });
});
