export type CalendarBoardView = "week" | "month";

function sameIsoMonth(left: string, right: string) {
  return left.slice(0, 7) === right.slice(0, 7);
}

export function resolveCalendarPageLevelCreateDate({
  boardView,
  focusedDate,
  selectedMonthStart,
  selectedWeekEnd,
  selectedWeekStart,
  today,
}: {
  boardView: CalendarBoardView;
  focusedDate: string;
  selectedMonthStart: string;
  selectedWeekEnd: string;
  selectedWeekStart: string;
  today: string;
}) {
  if (boardView === "month") {
    if (sameIsoMonth(today, selectedMonthStart)) return today;
    if (sameIsoMonth(focusedDate, selectedMonthStart)) return focusedDate;
    return selectedMonthStart;
  }

  return today >= selectedWeekStart && today <= selectedWeekEnd
    ? today
    : selectedWeekStart;
}
