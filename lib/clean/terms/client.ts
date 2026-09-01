import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import type {
  CleanAcademicYear,
  CleanAcademicYearInput,
  CleanAcademicYearsOptions,
  CleanAcademicYearUpdate,
  CleanBlackoutDay,
  CleanBlackoutDayInput,
  CleanBlackoutDaysOptions,
  CleanBlackoutDayUpdate,
  CleanLearningPeriod,
  CleanLearningPeriodInput,
  CleanLearningPeriodsOptions,
  CleanLearningPeriodType,
  CleanLearningPeriodUpdate,
} from "@/lib/clean/terms/types";

type AcademicYearRow = {
  id: string;
  family_id: string;
  title: string;
  country_code?: string | null;
  jurisdiction_code?: string | null;
  starts_on: string;
  ends_on: string;
  week_start?: string | null;
  notes?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type LearningPeriodRow = {
  id: string;
  family_id: string;
  academic_year_id: string;
  title: string;
  period_type?: string | null;
  starts_on: string;
  ends_on: string;
  is_break?: boolean | null;
  notes?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type BlackoutDayRow = {
  id: string;
  family_id: string;
  academic_year_id?: string | null;
  learning_period_id?: string | null;
  title: string;
  starts_on: string;
  ends_on: string;
  reason?: string | null;
  is_learning_blocked?: boolean | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizeBoolean(value: unknown) {
  return value === true;
}

function normalizeWeekStart(value: unknown): "monday" | "sunday" {
  return safe(value) === "sunday" ? "sunday" : "monday";
}

function normalizePeriodType(value: unknown): CleanLearningPeriodType {
  const periodType = safe(value);
  if (
    periodType === "semester" ||
    periodType === "unit" ||
    periodType === "break" ||
    periodType === "custom"
  ) {
    return periodType;
  }
  return "term";
}

function normalizeLearningPeriodIsBreak(
  periodType: CleanLearningPeriodType | undefined,
  requested: unknown,
) {
  if (periodType === "break") return true;
  if (periodType === "term" || periodType === "semester" || periodType === "unit") {
    return false;
  }
  return requested === true;
}

function toCleanAcademicYear(row: AcademicYearRow): CleanAcademicYear {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    title: safe(row.title),
    countryCode: normalizeNullString(row.country_code),
    jurisdictionCode: normalizeNullString(row.jurisdiction_code),
    startsOn: safe(row.starts_on),
    endsOn: safe(row.ends_on),
    weekStart: normalizeWeekStart(row.week_start),
    notes: normalizeNullString(row.notes),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toCleanLearningPeriod(row: LearningPeriodRow): CleanLearningPeriod {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    academicYearId: safe(row.academic_year_id),
    title: safe(row.title),
    periodType: normalizePeriodType(row.period_type),
    startsOn: safe(row.starts_on),
    endsOn: safe(row.ends_on),
    isBreak: normalizeBoolean(row.is_break),
    notes: normalizeNullString(row.notes),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function toCleanBlackoutDay(row: BlackoutDayRow): CleanBlackoutDay {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    academicYearId: normalizeNullString(row.academic_year_id),
    learningPeriodId: normalizeNullString(row.learning_period_id),
    title: safe(row.title),
    startsOn: safe(row.starts_on),
    endsOn: safe(row.ends_on),
    reason: normalizeNullString(row.reason),
    isLearningBlocked: normalizeBoolean(row.is_learning_blocked),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortAcademicYears(items: CleanAcademicYear[]) {
  return [...items].sort((left, right) => left.startsOn.localeCompare(right.startsOn));
}

function sortLearningPeriods(items: CleanLearningPeriod[]) {
  return [...items].sort((left, right) => {
    const dateCompare = left.startsOn.localeCompare(right.startsOn);
    if (dateCompare !== 0) return dateCompare;
    return left.title.localeCompare(right.title);
  });
}

function sortBlackoutDays(items: CleanBlackoutDay[]) {
  return [...items].sort((left, right) => {
    const dateCompare = left.startsOn.localeCompare(right.startsOn);
    if (dateCompare !== 0) return dateCompare;
    return left.title.localeCompare(right.title);
  });
}

function sanitizeAcademicYearInput(
  input: CleanAcademicYearInput | CleanAcademicYearUpdate,
) {
  return {
    title: "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    country_code:
      "countryCode" in input ? normalizeNullString(input.countryCode) : undefined,
    jurisdiction_code:
      "jurisdictionCode" in input
        ? normalizeNullString(input.jurisdictionCode)
        : undefined,
    starts_on:
      "startsOn" in input && input.startsOn !== undefined ? safe(input.startsOn) || null : undefined,
    ends_on:
      "endsOn" in input && input.endsOn !== undefined ? safe(input.endsOn) || null : undefined,
    week_start:
      "weekStart" in input && input.weekStart !== undefined
        ? normalizeWeekStart(input.weekStart)
        : undefined,
    notes: "notes" in input ? normalizeNullString(input.notes) : undefined,
  };
}

function sanitizeLearningPeriodInput(
  input: CleanLearningPeriodInput | CleanLearningPeriodUpdate,
) {
  const periodType =
    "periodType" in input && input.periodType !== undefined
      ? normalizePeriodType(input.periodType)
      : undefined;
  const requestedBreak = "isBreak" in input && input.isBreak !== undefined
    ? input.isBreak === true
    : undefined;

  return {
    academic_year_id:
      "academicYearId" in input && input.academicYearId !== undefined
        ? normalizeNullString(input.academicYearId)
        : undefined,
    title: "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    period_type: periodType,
    starts_on:
      "startsOn" in input && input.startsOn !== undefined ? safe(input.startsOn) || null : undefined,
    ends_on:
      "endsOn" in input && input.endsOn !== undefined ? safe(input.endsOn) || null : undefined,
    is_break:
      periodType !== undefined
        ? normalizeLearningPeriodIsBreak(periodType, requestedBreak)
        : requestedBreak,
    notes: "notes" in input ? normalizeNullString(input.notes) : undefined,
  };
}

function sanitizeBlackoutDayInput(
  input: CleanBlackoutDayInput | CleanBlackoutDayUpdate,
) {
  return {
    academic_year_id:
      "academicYearId" in input
        ? normalizeNullString(input.academicYearId)
        : undefined,
    learning_period_id:
      "learningPeriodId" in input
        ? normalizeNullString(input.learningPeriodId)
        : undefined,
    title: "title" in input && input.title !== undefined ? safe(input.title) || null : undefined,
    starts_on:
      "startsOn" in input && input.startsOn !== undefined ? safe(input.startsOn) || null : undefined,
    ends_on:
      "endsOn" in input && input.endsOn !== undefined ? safe(input.endsOn) || null : undefined,
    reason: "reason" in input ? normalizeNullString(input.reason) : undefined,
    is_learning_blocked:
      "isLearningBlocked" in input && input.isLearningBlocked !== undefined
        ? input.isLearningBlocked === true
        : undefined,
  };
}

export async function listCleanAcademicYears(
  familyId: string,
  options: CleanAcademicYearsOptions = {},
) {
  let query = supabase
    .from("academic_years")
    .select(
      "id,family_id,title,country_code,jurisdiction_code,starts_on,ends_on,week_start,notes,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("starts_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;
  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean academic years just now.",
      ),
    );
  }

  return sortAcademicYears(
    (response.data ?? []).map((row) => toCleanAcademicYear(row as AcademicYearRow)),
  );
}

export async function createCleanAcademicYear(
  familyId: string,
  input: CleanAcademicYearInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before creating an academic year.");
  }

  const payload = sanitizeAcademicYearInput(input);
  if (!safe(payload.title)) throw new Error("An academic year title is required.");
  if (!safe(payload.starts_on) || !safe(payload.ends_on)) {
    throw new Error("Start and end dates are required.");
  }

  const response = await supabase
    .from("academic_years")
    .insert({
      family_id: familyId,
      title: payload.title,
      country_code: payload.country_code ?? null,
      jurisdiction_code: payload.jurisdiction_code ?? null,
      starts_on: payload.starts_on,
      ends_on: payload.ends_on,
      week_start: payload.week_start ?? "monday",
      notes: payload.notes ?? null,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,title,country_code,jurisdiction_code,starts_on,ends_on,week_start,notes,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean academic year.",
      ),
    );
  }

  return toCleanAcademicYear(response.data as AcademicYearRow);
}

export async function updateCleanAcademicYear(
  familyId: string,
  academicYearId: string,
  input: CleanAcademicYearUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeAcademicYearInput(input)).filter(([, value]) => value !== undefined),
  );

  const response = await supabase
    .from("academic_years")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", academicYearId)
    .select(
      "id,family_id,title,country_code,jurisdiction_code,starts_on,ends_on,week_start,notes,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean academic year.",
      ),
    );
  }

  return toCleanAcademicYear(response.data as AcademicYearRow);
}

export async function deleteCleanAcademicYear(
  familyId: string,
  academicYearId: string,
) {
  const response = await supabase
    .from("academic_years")
    .delete()
    .eq("family_id", familyId)
    .eq("id", academicYearId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean academic year.",
      ),
    );
  }
}

export async function listCleanLearningPeriods(
  familyId: string,
  options: CleanLearningPeriodsOptions = {},
) {
  let query = supabase
    .from("learning_periods")
    .select(
      "id,family_id,academic_year_id,title,period_type,starts_on,ends_on,is_break,notes,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("starts_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (safe(options.academicYearId)) {
    query = query.eq("academic_year_id", safe(options.academicYearId));
  }

  if (safe(options.fromDate)) {
    query = query.gte("starts_on", safe(options.fromDate));
  }

  if (safe(options.toDate)) {
    query = query.lte("ends_on", safe(options.toDate));
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;
  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean learning periods just now.",
      ),
    );
  }

  return sortLearningPeriods(
    (response.data ?? []).map((row) => toCleanLearningPeriod(row as LearningPeriodRow)),
  );
}

export async function createCleanLearningPeriod(
  familyId: string,
  input: CleanLearningPeriodInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before creating a learning period.");
  }

  const payload = sanitizeLearningPeriodInput(input);
  if (!safe(payload.academic_year_id)) throw new Error("An academic year is required.");
  if (!safe(payload.title)) throw new Error("A learning period title is required.");
  if (!safe(payload.starts_on) || !safe(payload.ends_on)) {
    throw new Error("Start and end dates are required.");
  }

  const response = await supabase
    .from("learning_periods")
    .insert({
      family_id: familyId,
      academic_year_id: payload.academic_year_id,
      title: payload.title,
      period_type: payload.period_type ?? "term",
      starts_on: payload.starts_on,
      ends_on: payload.ends_on,
      is_break: payload.is_break ?? false,
      notes: payload.notes ?? null,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,academic_year_id,title,period_type,starts_on,ends_on,is_break,notes,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean learning period.",
      ),
    );
  }

  return toCleanLearningPeriod(response.data as LearningPeriodRow);
}

export async function updateCleanLearningPeriod(
  familyId: string,
  learningPeriodId: string,
  input: CleanLearningPeriodUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeLearningPeriodInput(input)).filter(([, value]) => value !== undefined),
  );

  const response = await supabase
    .from("learning_periods")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", learningPeriodId)
    .select(
      "id,family_id,academic_year_id,title,period_type,starts_on,ends_on,is_break,notes,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean learning period.",
      ),
    );
  }

  return toCleanLearningPeriod(response.data as LearningPeriodRow);
}

export async function deleteCleanLearningPeriod(
  familyId: string,
  learningPeriodId: string,
) {
  const response = await supabase
    .from("learning_periods")
    .delete()
    .eq("family_id", familyId)
    .eq("id", learningPeriodId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean learning period.",
      ),
    );
  }
}

export async function listCleanBlackoutDays(
  familyId: string,
  options: CleanBlackoutDaysOptions = {},
) {
  let query = supabase
    .from("blackout_days")
    .select(
      "id,family_id,academic_year_id,learning_period_id,title,starts_on,ends_on,reason,is_learning_blocked,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("starts_on", { ascending: true })
    .order("created_at", { ascending: true });

  if (safe(options.academicYearId)) {
    query = query.eq("academic_year_id", safe(options.academicYearId));
  }

  if (safe(options.learningPeriodId)) {
    query = query.eq("learning_period_id", safe(options.learningPeriodId));
  }

  if (safe(options.fromDate)) {
    query = query.gte("starts_on", safe(options.fromDate));
  }

  if (safe(options.toDate)) {
    query = query.lte("ends_on", safe(options.toDate));
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;
  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load clean blackout days just now.",
      ),
    );
  }

  return sortBlackoutDays(
    (response.data ?? []).map((row) => toCleanBlackoutDay(row as BlackoutDayRow)),
  );
}

export async function createCleanBlackoutDay(
  familyId: string,
  input: CleanBlackoutDayInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before creating a blackout day.");
  }

  const payload = sanitizeBlackoutDayInput(input);
  if (!safe(payload.title)) throw new Error("A blackout day title is required.");
  if (!safe(payload.starts_on) || !safe(payload.ends_on)) {
    throw new Error("Start and end dates are required.");
  }

  const response = await supabase
    .from("blackout_days")
    .insert({
      family_id: familyId,
      academic_year_id: payload.academic_year_id ?? null,
      learning_period_id: payload.learning_period_id ?? null,
      title: payload.title,
      starts_on: payload.starts_on,
      ends_on: payload.ends_on,
      reason: payload.reason ?? null,
      is_learning_blocked: payload.is_learning_blocked ?? true,
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,academic_year_id,learning_period_id,title,starts_on,ends_on,reason,is_learning_blocked,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the clean blackout day.",
      ),
    );
  }

  return toCleanBlackoutDay(response.data as BlackoutDayRow);
}

export async function updateCleanBlackoutDay(
  familyId: string,
  blackoutDayId: string,
  input: CleanBlackoutDayUpdate,
) {
  const payload = Object.fromEntries(
    Object.entries(sanitizeBlackoutDayInput(input)).filter(([, value]) => value !== undefined),
  );

  const response = await supabase
    .from("blackout_days")
    .update(payload)
    .eq("family_id", familyId)
    .eq("id", blackoutDayId)
    .select(
      "id,family_id,academic_year_id,learning_period_id,title,starts_on,ends_on,reason,is_learning_blocked,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to update the clean blackout day.",
      ),
    );
  }

  return toCleanBlackoutDay(response.data as BlackoutDayRow);
}

export async function deleteCleanBlackoutDay(
  familyId: string,
  blackoutDayId: string,
) {
  const response = await supabase
    .from("blackout_days")
    .delete()
    .eq("family_id", familyId)
    .eq("id", blackoutDayId);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to delete the clean blackout day.",
      ),
    );
  }
}
