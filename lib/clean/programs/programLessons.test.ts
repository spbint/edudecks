import { describe, expect, it } from "vitest";
import type { CleanProgramLesson } from "@/lib/clean/programs/types";
import {
  moveProgramLesson,
  parsePastedProgramLessonTitles,
  resequenceProgramLessons,
} from "@/lib/clean/programs/programLessons";

function lesson(id: string, position: number, title = id): CleanProgramLesson {
  return {
    id,
    familyId: "family-a",
    programId: "program-a",
    position,
    title,
    instructions: null,
    estimatedDurationMinutes: null,
    createdAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
  };
}

describe("program lesson foundation", () => {
  it("parses multiline titles in order while trimming and ignoring blank lines", () => {
    expect(parsePastedProgramLessonTitles(" Lesson A \n\nLesson B\r\n  Lesson C  ")).toEqual([
      "Lesson A",
      "Lesson B",
      "Lesson C",
    ]);
  });

  it("moves durable lesson identities and resequences positions", () => {
    const initial = [lesson("a", 1, "A"), lesson("b", 2, "B"), lesson("c", 3, "C")];
    const reordered = resequenceProgramLessons(moveProgramLesson(initial, "c", -1));
    const movedAgain = resequenceProgramLessons(moveProgramLesson(reordered, "c", -1));

    expect(movedAgain.map((item) => [item.id, item.position])).toEqual([
      ["c", 1],
      ["a", 2],
      ["b", 3],
    ]);
    expect(movedAgain.find((item) => item.id === "c")?.title).toBe("C");
  });

  it("closes an ordering gap after removal without changing surviving identities", () => {
    const remaining = resequenceProgramLessons([lesson("a", 1), lesson("c", 3)]);
    expect(remaining.map((item) => [item.id, item.position])).toEqual([
      ["a", 1],
      ["c", 2],
    ]);
  });
});
