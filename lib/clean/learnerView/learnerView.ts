import type { CleanCalendarItem } from "@/lib/clean/calendar/types";

export function getLearnerViewTodayItems(
  items: readonly CleanCalendarItem[],
  learnerId: string,
  today: string,
) {
  const expectedLearnerId = learnerId.trim();
  return items.filter(
    (item) =>
      item.plannedDate === today &&
      (item.learnerId === expectedLearnerId || item.learnerId === null),
  );
}

export function sortLearnerViewTodayItems(items: readonly CleanCalendarItem[]) {
  return [...items].sort((left, right) => {
    if (left.startsAt && right.startsAt) return left.startsAt.localeCompare(right.startsAt);
    if (left.startsAt) return -1;
    if (right.startsAt) return 1;
    return left.title.localeCompare(right.title);
  });
}
