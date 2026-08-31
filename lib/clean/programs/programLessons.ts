import type { CleanProgramLesson } from "@/lib/clean/programs/types";

function cleanTitle(value: unknown) {
  return String(value ?? "").trim();
}

export function parsePastedProgramLessonTitles(value: string) {
  return value
    .split(/\r?\n/)
    .map((title) => cleanTitle(title))
    .filter(Boolean);
}

export function moveProgramLesson(
  lessons: CleanProgramLesson[],
  lessonId: string,
  direction: -1 | 1,
) {
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= lessons.length) return lessons;

  const reordered = [...lessons];
  [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
  return reordered;
}

export function resequenceProgramLessons(lessons: CleanProgramLesson[]) {
  return lessons.map((lesson, index) => ({ ...lesson, position: index + 1 }));
}
