import type { CleanLearningPeriod } from "@/lib/clean/terms/types";

export const CONTROLLED_LEARNING_AREAS = [
  "Mathematics",
  "English",
  "Science",
  "Humanities and Social Sciences",
  "Technologies",
  "The Arts",
  "Health and Physical Education",
  "Other",
] as const;

export type ControlledLearningArea = (typeof CONTROLLED_LEARNING_AREAS)[number];
export type CalendarTimeMode = "timed" | "untimed";

type TimeValidationInput = {
  mode: CalendarTimeMode;
  startTime: string;
  endTime: string;
};

type TimeValidationResult =
  | {
      ok: true;
      startsAt: string | null;
      endsAt: string | null;
    }
  | {
      ok: false;
      message: string;
    };

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function isDateWithinRange(dateValue: string, startsOn: string, endsOn: string) {
  return dateValue >= startsOn && dateValue <= endsOn;
}

export function isBreakPeriod(period: Pick<CleanLearningPeriod, "isBreak" | "periodType">) {
  return period.isBreak || period.periodType === "break";
}

export function findBreakForDate(
  dateValue: string,
  periods: Array<Pick<CleanLearningPeriod, "title" | "startsOn" | "endsOn" | "isBreak" | "periodType">>,
) {
  return (
    periods.find(
      (period) => isBreakPeriod(period) && isDateWithinRange(dateValue, period.startsOn, period.endsOn),
    ) ?? null
  );
}

export function parseTimeToMinutes(value: string) {
  const time = safe(value);
  if (!/^\d{2}:\d{2}$/.test(time)) return null;

  const [hoursText, minutesText] = time.split(":");
  const hours = Number.parseInt(hoursText, 10);
  const minutes = Number.parseInt(minutesText, 10);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function validateCalendarTimeMode(input: TimeValidationInput): TimeValidationResult {
  if (input.mode === "untimed") {
    return { ok: true, startsAt: null, endsAt: null };
  }

  const startMinutes = parseTimeToMinutes(input.startTime);
  const endMinutes = parseTimeToMinutes(input.endTime);

  if (startMinutes === null || endMinutes === null) {
    return {
      ok: false,
      message: "Choose both a start time and an end time, or use No specific time.",
    };
  }

  if (startMinutes >= endMinutes) {
    return {
      ok: false,
      message: "End time must be after the start time.",
    };
  }

  return {
    ok: true,
    startsAt: input.startTime,
    endsAt: input.endTime,
  };
}

export function formatClockTimeLabel(value: string | null | undefined) {
  const time = safe(value).slice(0, 5);
  if (!time) return "";

  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return "";

  const hours = Math.floor(minutes / 60);
  const minutePart = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutePart).padStart(2, "0")}`;
}

function formatTimestampTimeLabel(value: string | null | undefined) {
  const clean = safe(value);
  if (!clean) return "";

  const timestamp = new Date(clean);
  if (!Number.isNaN(timestamp.getTime())) {
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return formatClockTimeLabel(clean);
}

export function formatCalendarTimeRange(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
) {
  const start = formatTimestampTimeLabel(startsAt);
  const end = formatTimestampTimeLabel(endsAt);

  if (start && end) return `${start}\u2013${end}`;
  return "Any time";
}

export function resolveStoredLearningArea(
  area: ControlledLearningArea | "",
  customLabel: string,
) {
  if (!area) return null;
  const custom = safe(customLabel);
  if (area === "Other") return custom || "Other";
  return area;
}

export function resolveLearningAreaControl(value: string | null | undefined) {
  const label = safe(value);
  if (!label) return { area: "" as const, customLabel: "" };

  if ((CONTROLLED_LEARNING_AREAS as readonly string[]).includes(label) && label !== "Other") {
    return { area: label as ControlledLearningArea, customLabel: "" };
  }

  return { area: "Other" as ControlledLearningArea, customLabel: label };
}

export function normalizeLearningAreaLabel(value: string | null | undefined) {
  const label = safe(value);
  const normalized = label.toLowerCase().replace(/[^a-z]+/g, " ").trim();

  if (!normalized) return "";
  if (["math", "maths", "mathematics", "numeracy", "number"].includes(normalized)) return "Mathematics";
  if (["english", "literacy", "reading", "writing", "language arts", "ela"].includes(normalized)) {
    return "English";
  }
  if (["science"].includes(normalized)) return "Science";
  if (["hass", "humanities", "social studies", "history", "geography"].includes(normalized)) {
    return "Humanities and Social Sciences";
  }
  if (["technology", "technologies", "digital technologies", "design technologies"].includes(normalized)) {
    return "Technologies";
  }
  if (["art", "arts", "the arts", "music", "drama", "dance", "visual arts"].includes(normalized)) {
    return "The Arts";
  }
  if (["pe", "hpe", "health", "physical education", "health physical education"].includes(normalized)) {
    return "Health and Physical Education";
  }

  return label;
}
