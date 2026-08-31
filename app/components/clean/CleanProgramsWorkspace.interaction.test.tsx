// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CleanProgramsWorkspace from "@/app/components/clean/CleanProgramsWorkspace";
import {
  assignLearnersToCleanProgram,
  listCleanProgramLessonCounts,
  listCleanProgramLessons,
  listLearnerProgramAssignments,
  listCleanPrograms,
  removeLearnerProgramAssignment,
  updateCleanProgramLesson,
} from "@/lib/clean/programs/client";
import type {
  CleanProgram,
  CleanProgramLesson,
  LearnerProgramAssignment,
} from "@/lib/clean/programs/types";

vi.mock("@/app/components/clean/CleanFamilyWorkspaceProvider", () => ({
  useCleanFamilyWorkspace: () => ({
    loading: false,
    schemaMissing: false,
    requiresFamilyCreation: false,
    profile: { id: "family-1" },
    learners: [
      { id: "learner-james", familyId: "family-1", firstName: "James", preferredName: null },
      { id: "learner-emily", familyId: "family-1", firstName: "Emily", preferredName: null },
    ],
  }),
}));

vi.mock("@/app/components/clean/design-v2/V2LoadingState", () => ({
  default: () => null,
}));

vi.mock("@/lib/clean/programs/client", () => ({
  addCleanProgramLessons: vi.fn(),
  assignLearnersToCleanProgram: vi.fn(),
  listCleanProgramLessonCounts: vi.fn(),
  listCleanProgramLessons: vi.fn(),
  listLearnerProgramAssignments: vi.fn(),
  listCleanPrograms: vi.fn(),
  normalizeBulkProgramLessonTitles: vi.fn(),
  removeCleanProgramLesson: vi.fn(),
  removeLearnerProgramAssignment: vi.fn(),
  reorderCleanProgramLessons: vi.fn(),
  updateCleanProgram: vi.fn(),
  updateCleanProgramLesson: vi.fn(),
  createCleanProgram: vi.fn(),
}));

const program: CleanProgram = {
  id: "program-english",
  familyId: "family-1",
  learnerId: null,
  title: "English",
  description: null,
  learningArea: "English",
  curriculumNodeIds: [],
  status: "active",
  createdByUserId: "user-1",
  createdAt: "2026-08-31T00:00:00.000Z",
  updatedAt: "2026-08-31T00:00:00.000Z",
};

const initialLesson: CleanProgramLesson = {
  id: "lesson-initial-sounds",
  familyId: "family-1",
  programId: "program-english",
  position: 1,
  title: "Initial sounds",
  instructions: "Use picture cards.",
  estimatedDurationMinutes: 20,
  createdAt: "2026-08-31T00:00:00.000Z",
  updatedAt: "2026-08-31T00:00:00.000Z",
};

const mockedListPrograms = vi.mocked(listCleanPrograms);
const mockedListCounts = vi.mocked(listCleanProgramLessonCounts);
const mockedListLessons = vi.mocked(listCleanProgramLessons);
const mockedListAssignments = vi.mocked(listLearnerProgramAssignments);
const mockedUpdateLesson = vi.mocked(updateCleanProgramLesson);
const mockedAssignLearners = vi.mocked(assignLearnersToCleanProgram);
const mockedRemoveAssignment = vi.mocked(removeLearnerProgramAssignment);

describe("CleanProgramsWorkspace lesson editing", () => {
  let lessons: CleanProgramLesson[];
  let assignments: LearnerProgramAssignment[];

  beforeEach(() => {
    lessons = [{ ...initialLesson }];
    assignments = [];
    mockedListPrograms.mockResolvedValue([program]);
    mockedListCounts.mockResolvedValue({ [program.id]: 1 });
    mockedListLessons.mockImplementation(async () => lessons);
    mockedListAssignments.mockImplementation(async () => assignments);
    mockedAssignLearners.mockImplementation(async (_familyId, programId, learnerIds) => {
      assignments = [...assignments, ...learnerIds
        .filter((learnerId) => !assignments.some((assignment) => assignment.programId === programId && assignment.learnerId === learnerId))
        .map((learnerId) => ({
          id: `assignment-${learnerId}`,
          familyId: "family-1",
          programId,
          learnerId,
          createdAt: "2026-08-31T00:00:00.000Z",
          updatedAt: "2026-08-31T00:00:00.000Z",
        }))];
    });
    mockedRemoveAssignment.mockImplementation(async (_familyId, programId, learnerId) => {
      assignments = assignments.filter((assignment) => !(assignment.programId === programId && assignment.learnerId === learnerId));
    });
    mockedUpdateLesson.mockImplementation(async (_familyId, lessonId, input) => {
      lessons = lessons.map((lesson) => lesson.id === lessonId ? {
        ...lesson,
        title: input.title ?? lesson.title,
        instructions: input.instructions === undefined ? lesson.instructions : input.instructions,
        estimatedDurationMinutes: input.estimatedDurationMinutes === undefined
          ? lesson.estimatedDurationMinutes
          : input.estimatedDurationMinutes,
      } : lesson);
      return lessons.find((lesson) => lesson.id === lessonId)!;
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  async function openEnglishProgram() {
    render(<CleanProgramsWorkspace />);
    await screen.findByRole("button", { name: "Open / Edit" });
    fireEvent.click(screen.getByRole("button", { name: "Open / Edit" }));
    await screen.findByText("Initial sounds");
  }

  it("opens an inline prefilled editor and persists a title change without changing identity or position", async () => {
    await openEnglishProgram();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const editor = screen.getByRole("form", { name: "Edit lesson: Initial sounds" });
    const title = screen.getByRole("textbox", { name: "Lesson title" });
    expect((title as HTMLInputElement).value).toBe("Initial sounds");
    expect((screen.getByRole("textbox", { name: /Instructions/i }) as HTMLTextAreaElement).value).toBe("Use picture cards.");
    expect((screen.getByRole("spinbutton", { name: /Estimated minutes/i }) as HTMLInputElement).value).toBe("20");

    fireEvent.change(title, { target: { value: "Initial and final sounds" } });
    fireEvent.submit(editor);

    await waitFor(() => expect(mockedUpdateLesson).toHaveBeenCalledWith("family-1", "lesson-initial-sounds", {
      title: "Initial and final sounds",
      instructions: "Use picture cards.",
      estimatedDurationMinutes: 20,
    }));
    await screen.findByText("Initial and final sounds");
    expect(lessons[0]).toMatchObject({
      id: "lesson-initial-sounds",
      programId: "program-english",
      position: 1,
      title: "Initial and final sounds",
    });
  });

  it("cancels an edit without mutating the lesson", async () => {
    await openEnglishProgram();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Lesson title" }), {
      target: { value: "Initial and final sounds" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockedUpdateLesson).not.toHaveBeenCalled();
    expect(screen.queryByRole("form", { name: "Edit lesson: Initial sounds" })).toBeNull();
    expect(lessons[0]).toEqual(initialLesson);
  });

  it("assigns multiple family learners without changing the shared program or lessons", async () => {
    await openEnglishProgram();

    expect(screen.getByText(/No learners assigned yet/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Assign learner" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "James" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Emily" }));
    fireEvent.click(screen.getByRole("button", { name: "Assign selected learners" }));

    await waitFor(() => expect(mockedAssignLearners).toHaveBeenCalledWith("family-1", "program-english", ["learner-james", "learner-emily"]));
    expect(await screen.findByText("James")).toBeTruthy();
    expect(screen.getByText("Emily")).toBeTruthy();
    expect(assignments).toHaveLength(2);
    expect(lessons).toEqual([initialLesson]);

    fireEvent.click(screen.getAllByRole("button", { name: "Remove learner" })[0]);
    await waitFor(() => expect(mockedRemoveAssignment).toHaveBeenCalledWith("family-1", "program-english", "learner-james"));
    expect(assignments).toEqual([expect.objectContaining({ learnerId: "learner-emily" })]);
  });
});
