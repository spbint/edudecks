// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CleanMiniCalendarNavigator, {
  cleanAddCalendarDays,
  getCleanMiniCalendarDates,
} from "@/app/components/clean/CleanMiniCalendarNavigator";

afterEach(cleanup);

describe("CleanMiniCalendarNavigator", () => {
  it("renders a Monday-first six-row month and identifies selected/today dates", () => {
    render(
      <CleanMiniCalendarNavigator
        selectedDate="2026-08-24"
        today="2026-08-24"
        onSelectDate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /choose date/i }));
    expect(screen.getByRole("dialog", { name: "Choose date" })).toBeTruthy();
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);
    expect(screen.getByRole("gridcell", { name: /Monday, 24 August 2026/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("gridcell", { name: /Monday, 24 August 2026/i }).getAttribute("aria-current")).toBe("date");
  });

  it("changes month without selecting a date, then selects an adjacent-month date", () => {
    const onSelectDate = vi.fn();
    render(<CleanMiniCalendarNavigator selectedDate="2026-08-24" onSelectDate={onSelectDate} />);
    fireEvent.click(screen.getByRole("button", { name: /choose date/i }));
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("September 2026")).toBeTruthy();
    fireEvent.click(screen.getByRole("gridcell", { name: /Wednesday, 30 September 2026/i }));
    expect(onSelectDate).toHaveBeenCalledWith("2026-09-30");
  });

  it("supports keyboard day navigation and Escape focus restoration", () => {
    render(<CleanMiniCalendarNavigator selectedDate="2026-08-24" onSelectDate={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: /choose date/i });
    fireEvent.click(trigger);
    const selected = screen.getByRole("gridcell", { name: /Monday, 24 August 2026/i });
    selected.focus();
    fireEvent.keyDown(selected, { key: "ArrowRight" });
    expect(document.activeElement?.getAttribute("data-date")).toBe("2026-08-25");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
  });

  it("uses local date arithmetic without a UTC day shift", () => {
    expect(cleanAddCalendarDays("2026-08-24", 1)).toBe("2026-08-25");
    expect(getCleanMiniCalendarDates("2026-08-24")).toContain("2026-08-31");
  });
});
