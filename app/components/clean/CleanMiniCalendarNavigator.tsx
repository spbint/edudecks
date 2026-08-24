"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type CleanMiniCalendarNavigatorMode = "operational" | "structural";

export type CleanMiniCalendarNavigatorProps = {
  selectedDate: string;
  today?: string;
  onSelectDate: (dateValue: string) => void;
  onToday?: () => void;
  minDate?: string;
  maxDate?: string;
  mode?: CleanMiniCalendarNavigatorMode;
  ariaLabel?: string;
  disabled?: boolean;
  triggerLabel?: string;
};

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3])
    ? date
    : null;
}

export function cleanDateToValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function cleanAddCalendarDays(value: string, amount: number) {
  const date = parseDate(value);
  if (!date) return value;
  date.setDate(date.getDate() + amount);
  return cleanDateToValue(date);
}

function addCalendarMonths(value: string, amount: number) {
  const date = parseDate(value);
  if (!date) return value;
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return cleanDateToValue(date);
}

function monthStart(value: string) {
  const date = parseDate(value);
  if (!date) return value;
  date.setDate(1);
  return cleanDateToValue(date);
}

export function getCleanMiniCalendarDates(monthValue: string) {
  const start = parseDate(monthStart(monthValue));
  if (!start) return [];
  const mondayOffset = (start.getDay() + 6) % 7;
  const first = cleanAddCalendarDays(cleanDateToValue(start), -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => cleanAddCalendarDays(first, index));
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString(undefined, options) : value;
}

function isDisabled(value: string, minDate?: string, maxDate?: string) {
  return Boolean((minDate && value < minDate) || (maxDate && value > maxDate));
}

export default function CleanMiniCalendarNavigator({
  selectedDate,
  today,
  onSelectDate,
  onToday,
  minDate,
  maxDate,
  mode = "operational",
  ariaLabel = "Choose date",
  disabled = false,
  triggerLabel,
}: CleanMiniCalendarNavigatorProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(monthStart(selectedDate));

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!popoverRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const displayMonth = open ? visibleMonth : monthStart(selectedDate);
  const dates = useMemo(() => getCleanMiniCalendarDates(displayMonth), [displayMonth]);
  const todayValue = today ?? "";
  const triggerText = triggerLabel ?? formatDate(selectedDate, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  function selectDate(value: string) {
    if (isDisabled(value, minDate, maxDate)) return;
    onSelectDate(value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleGridKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, value: string) {
    let nextValue: string | null = null;
    if (event.key === "ArrowLeft") nextValue = cleanAddCalendarDays(value, -1);
    if (event.key === "ArrowRight") nextValue = cleanAddCalendarDays(value, 1);
    if (event.key === "ArrowUp") nextValue = cleanAddCalendarDays(value, -7);
    if (event.key === "ArrowDown") nextValue = cleanAddCalendarDays(value, 7);
    if (event.key === "PageUp") nextValue = addCalendarMonths(value, event.shiftKey ? -12 : -1);
    if (event.key === "PageDown") nextValue = addCalendarMonths(value, event.shiftKey ? 12 : 1);
    const parsedDate = parseDate(value);
    const weekdayIndex = parsedDate ? (parsedDate.getDay() + 6) % 7 : 0;
    if (event.key === "Home") nextValue = cleanAddCalendarDays(value, -weekdayIndex);
    if (event.key === "End") nextValue = cleanAddCalendarDays(value, 6 - weekdayIndex);
    if (!nextValue) return;
    event.preventDefault();
    const nextMonth = monthStart(nextValue);
    if (nextMonth !== displayMonth) {
      setVisibleMonth(nextMonth);
      window.setTimeout(() => {
        popoverRef.current?.querySelector<HTMLButtonElement>(`[data-date="${nextValue}"]`)?.focus();
      }, 0);
    } else {
      popoverRef.current?.querySelector<HTMLButtonElement>(`[data-date="${nextValue}"]`)?.focus();
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => {
          if (!open) setVisibleMonth(monthStart(selectedDate));
          setOpen((value) => !value);
        }}
        style={{
          minHeight: 40,
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          background: "#ffffff",
          color: "#0f172a",
          padding: "8px 12px",
          fontWeight: 700,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {triggerText}
      </button>
      {open ? (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={mode === "structural" ? "Choose structural date" : "Choose date"}
          style={{
            position: "absolute",
            zIndex: 30,
            top: "calc(100% + 8px)",
            left: 0,
            width: "min(292px, calc(100vw - 24px))",
            padding: 14,
            border: "1px solid #cbd5e1",
            borderRadius: 14,
            background: "#ffffff",
            boxShadow: "0 18px 40px rgba(15,23,42,0.16)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <strong style={{ color: "#0f172a" }}>{formatDate(displayMonth, { month: "long", year: "numeric" })}</strong>
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" aria-label="Previous month" onClick={() => setVisibleMonth(addCalendarMonths(displayMonth, -1))} style={monthButtonStyle}>‹</button>
              <button type="button" aria-label="Next month" onClick={() => setVisibleMonth(addCalendarMonths(displayMonth, 1))} style={monthButtonStyle}>›</button>
            </div>
          </div>
          <div role="grid" aria-label="Month calendar" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`} role="columnheader" style={weekdayStyle}>{day}</span>)}
            {dates.map((value) => {
              const inMonth = monthStart(value) === displayMonth;
              const selected = value === selectedDate;
              const isToday = value === todayValue;
              const unavailable = isDisabled(value, minDate, maxDate);
              return (
                <button
                  key={value}
                  type="button"
                  role="gridcell"
                  data-date={value}
                  aria-label={formatDate(value, { dateStyle: "full" })}
                  aria-current={isToday ? "date" : undefined}
                  aria-selected={selected}
                  disabled={unavailable}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectDate(value)}
                  onKeyDown={(event) => handleGridKeyDown(event, value)}
                  style={{
                    minWidth: 32,
                    minHeight: 32,
                    border: selected ? "2px solid #2563eb" : isToday ? "1px solid #60a5fa" : "1px solid transparent",
                    borderRadius: 999,
                    background: selected ? "#dbeafe" : "#ffffff",
                    color: unavailable ? "#cbd5e1" : inMonth ? "#0f172a" : "#94a3b8",
                    fontWeight: selected || isToday ? 800 : 600,
                    cursor: unavailable ? "not-allowed" : "pointer",
                  }}
                >
                  {parseDate(value)?.getDate()}
                </button>
              );
            })}
          </div>
          {mode === "operational" && onToday ? (
            <button type="button" onClick={() => { onToday(); setOpen(false); triggerRef.current?.focus(); }} style={{ ...todayButtonStyle, marginTop: 10 }}>
              Today
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const monthButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  fontSize: 20,
  lineHeight: 1,
  cursor: "pointer",
};

const weekdayStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  textAlign: "center",
};

const todayButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 36,
  border: "1px solid #cbd5e1",
  borderRadius: 9,
  background: "#f8fafc",
  color: "#0f172a",
  fontWeight: 800,
  cursor: "pointer",
};
