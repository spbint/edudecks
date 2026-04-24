"use client";

import React, { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabaseClient";
import type { ReportsBuilderModel } from "@/lib/reporting";
import type { FamilyLearner } from "@/lib/familyWorkspace";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isMissingColumnError(error: unknown) {
  const message = safe((error as { message?: unknown })?.message).toLowerCase();
  return message.includes("does not exist") || message.includes("column");
}

function currentAcademicYear() {
  return String(new Date().getFullYear());
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberInputValue(value: number | null) {
  return value == null ? "" : String(value);
}

function toDateInput(value: string | null | undefined) {
  const clean = safe(value);
  if (!clean) return "";
  const date = new Date(clean);
  if (Number.isNaN(date.getTime())) return clean.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function fromDateInput(value: string) {
  const clean = safe(value);
  return clean || null;
}

function behaviorLabel(model: ReportsBuilderModel | null) {
  const behaviour = model?.jurisdictionBehaviour;
  if (!behaviour) return "Optional record";
  if (behaviour.portfolioModeEnabled) return "Portfolio support";
  if (behaviour.strictGateEnabled) return "Required before export";
  return "Recommended";
}

function requiredCopy(model: ReportsBuilderModel | null) {
  const requiresAttendance =
    model?.ruleSet?.requiresAttendanceTracking === true ||
    model?.ruleSet?.requiresInstructionHours === true;
  if (requiresAttendance) return behaviorLabel(model);
  return "Optional record";
}

function requirementTone(model: ReportsBuilderModel | null) {
  const requiresAttendance =
    model?.ruleSet?.requiresAttendanceTracking === true ||
    model?.ruleSet?.requiresInstructionHours === true;
  if (!requiresAttendance) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  if (model?.jurisdictionBehaviour?.strictGateEnabled) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (model?.jurisdictionBehaviour?.portfolioModeEnabled) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function panelTone(model: ReportsBuilderModel | null) {
  if (model?.jurisdictionBehaviour?.portfolioModeEnabled) {
    return "border-slate-200 bg-slate-50/80";
  }
  if (model?.jurisdictionBehaviour?.strictGateEnabled) {
    return "border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(239,246,255,0.94)_58%,rgba(248,250,252,0.96)_100%)]";
  }
  return "border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(243,244,246,0.95)_58%,rgba(248,250,252,0.96)_100%)]";
}

type AttendanceDayRow = Record<string, unknown>;
type AttendanceSummaryRow = Record<string, unknown>;

type AttendanceComplianceCardProps = {
  learner: FamilyLearner | null;
  reportsModel: ReportsBuilderModel | null;
  familyProfileId: string | null;
  jurisdictionId: string | null;
  registrationCycleId: string | null;
  userId: string | null;
  onSaved?: () => Promise<void> | void;
  loading?: boolean;
};

function daysPresentFromRow(row: AttendanceDayRow) {
  const presentValue =
    row.present ??
    row.is_present ??
    row.attended ??
    row.school_day ??
    row.status ??
    row.attendance_status;

  if (
    presentValue === true ||
    presentValue === 1 ||
    presentValue === "1" ||
    presentValue === "true"
  ) {
    return true;
  }

  const status = safe(presentValue).toLowerCase();
  if (
    status === "present" ||
    status === "attended" ||
    status === "school_day" ||
    status === "complete"
  ) {
    return true;
  }

  return false;
}

function summarizeAttendanceDays(rows: AttendanceDayRow[]) {
  const presentRows = rows.filter(daysPresentFromRow);
  const totalMinutes = rows.reduce(
    (sum, row) =>
      sum + toNumber(row.total_instruction_minutes ?? row.instructional_minutes ?? row.minutes),
    0,
  );

  return {
    days: presentRows.length || rows.length,
    minutes: totalMinutes,
    records: rows.length,
  };
}

function summarizeAttendanceSummaryRows(rows: AttendanceSummaryRow[]) {
  const days = rows.reduce(
    (max, row) =>
      Math.max(
        max,
        toNumber(row.days_present),
        toNumber(row.total_days),
        toNumber(row.days),
        toNumber(row.instructional_days),
      ),
    0,
  );

  const minutes = rows.reduce(
    (max, row) =>
      Math.max(
        max,
        toNumber(row.total_instruction_minutes),
        toNumber(row.instructional_minutes),
        toNumber(row.minutes),
        toNumber(row.total_hours) * 60,
        toNumber(row.hours) * 60,
      ),
    0,
  );

  return {
    days,
    minutes,
    records: rows.length,
  };
}

async function loadAttendanceDays(
  learnerId: string,
  familyProfileId: string | null,
  jurisdictionId: string | null,
  registrationCycleId: string | null,
) {
  const attempts = [
    () => {
      let query = supabase.from("homeschool_attendance_days").select("*").eq("learner_id", learnerId);
      if (familyProfileId) query = query.eq("family_id", familyProfileId);
      if (jurisdictionId) query = query.eq("jurisdiction_id", jurisdictionId);
      if (registrationCycleId) query = query.eq("registration_cycle_id", registrationCycleId);
      return query;
    },
    () => supabase.from("homeschool_attendance_days").select("*").eq("learner_id", learnerId),
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const response = await attempt();
    if (!response.error) {
      const data = Array.isArray(response.data)
        ? response.data
        : response.data
          ? [response.data]
          : [];
      return data as AttendanceDayRow[];
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The attendance day table could not be queried.");
}

async function loadLatestAttendanceSummary(
  learnerId: string,
  familyProfileId: string | null,
  jurisdictionId: string | null,
  registrationCycleId: string | null,
) {
  const attempts = [
    () => {
      let query = supabase
        .from("homeschool_attendance_summaries")
        .select("*")
        .eq("learner_id", learnerId)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (familyProfileId) query = query.eq("family_id", familyProfileId);
      if (jurisdictionId) query = query.eq("jurisdiction_id", jurisdictionId);
      if (registrationCycleId) query = query.eq("registration_cycle_id", registrationCycleId);
      return query.maybeSingle();
    },
    () =>
      supabase
        .from("homeschool_attendance_summaries")
        .select("*")
        .eq("learner_id", learnerId)
        .order("academic_year", { ascending: false })
        .limit(1)
        .maybeSingle(),
    () =>
      supabase
        .from("homeschool_attendance_summaries")
        .select("*")
        .eq("learner_id", learnerId)
        .limit(1)
        .maybeSingle(),
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const response = await attempt();
    if (!response.error) {
      return response.data as AttendanceSummaryRow | null;
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The attendance summary table could not be queried.");
}

async function writeAttendanceSummary(
  existingId: string | null,
  payloads: AttendanceSummaryRow[],
) {
  let lastError: unknown = null;

  for (const payload of payloads) {
    const response = existingId
      ? await supabase
          .from("homeschool_attendance_summaries")
          .update(payload)
          .eq("id", existingId)
      : await supabase.from("homeschool_attendance_summaries").insert(payload);

    if (!response.error) {
      return;
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The attendance summary could not be saved.");
}

function currentMessage(
  required: boolean,
  hasJurisdiction: boolean,
  tableUnavailable: boolean,
  days: number,
  minutes: number,
  requiredDays: number | null,
  requiredHours: number | null,
) {
  if (!hasJurisdiction) {
    return "Set your jurisdiction to enable compliance tracking.";
  }
  if (tableUnavailable) {
    return "Attendance tracking is not available in this setup yet.";
  }
  if (days > 0 || minutes > 0) {
    return "Attendance tracking is underway and can be refined with a simple summary.";
  }
  if (!required) {
    return "This record is optional for your current setup, but it can still strengthen your family record.";
  }
  if (requiredDays != null || requiredHours != null) {
    return "Add a simple summary so the readiness engine can see your progress more clearly.";
  }
  return "Attendance tracking has not been started yet.";
}

export function AttendanceComplianceCard({
  learner,
  reportsModel,
  familyProfileId,
  jurisdictionId,
  registrationCycleId,
  userId,
  onSaved,
  loading = false,
}: AttendanceComplianceCardProps) {
  const [summaryRecord, setSummaryRecord] = useState<AttendanceSummaryRow | null>(null);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceDayRow[]>([]);
  const [schoolYearLabel, setSchoolYearLabel] = useState(currentAcademicYear());
  const [periodLabel, setPeriodLabel] = useState("");
  const [periodType, setPeriodType] = useState<"year" | "cycle">("year");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [daysPresent, setDaysPresent] = useState<number | null>(null);
  const [hoursInput, setHoursInput] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tableUnavailable, setTableUnavailable] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const hasJurisdiction = Boolean(reportsModel?.effectiveJurisdiction?.code);
  const required =
    reportsModel?.ruleSet?.requiresAttendanceTracking === true ||
    reportsModel?.ruleSet?.requiresInstructionHours === true;
  const requiredText = useMemo(() => requiredCopy(reportsModel), [reportsModel]);
  const requiredDays = reportsModel?.ruleSet?.requiredInstructionDaysPerYear ?? null;
  const requiredHours = reportsModel?.ruleSet?.requiredInstructionHoursPerYear ?? null;
  const currentDays = daysPresent ?? summarizeAttendanceSummaryRows(
    summaryRecord ? [summaryRecord] : [],
  ).days;
  const currentMinutes =
    Number.isFinite(Number(hoursInput)) && hoursInput !== ""
      ? Math.max(0, Math.round(Number(hoursInput) * 60))
      : summarizeAttendanceSummaryRows(summaryRecord ? [summaryRecord] : []).minutes;

  const summaryText = useMemo(() => {
    if (!learner) return "Select a learner to view attendance and hours.";
    if (!hasJurisdiction) return "Set your jurisdiction to enable compliance tracking.";
    return currentMessage(
      required,
      hasJurisdiction,
      tableUnavailable,
      currentDays,
      currentMinutes,
      requiredDays,
      requiredHours,
    );
  }, [currentDays, currentMinutes, hasJurisdiction, learner, required, requiredDays, requiredHours, tableUnavailable]);

  const currentHours = Math.round((currentMinutes / 60) * 10) / 10;

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!learner) {
        if (mounted) {
          setSummaryRecord(null);
          setAttendanceRows([]);
          setTableUnavailable(false);
        }
        return;
      }

      if (mounted) {
        setError("");
        setMessage("");
      }

      try {
        const [latestSummary, dayRows] = await Promise.all([
          loadLatestAttendanceSummary(
            learner.id,
            familyProfileId,
            jurisdictionId,
            registrationCycleId,
          ),
          loadAttendanceDays(
            learner.id,
            familyProfileId,
            jurisdictionId,
            registrationCycleId,
          ),
        ]);

        if (!mounted) return;

        setSummaryRecord(latestSummary);
        setAttendanceRows(dayRows);
        setTableUnavailable(false);
        setSchoolYearLabel(
          safe(latestSummary?.school_year_label) ||
            safe(latestSummary?.academic_year) ||
            currentAcademicYear(),
        );
        setPeriodLabel(
          safe(latestSummary?.period_label) || safe(latestSummary?.academic_year) || "",
        );
        setPeriodType(
          safe(latestSummary?.period_type).toLowerCase() === "cycle" ? "cycle" : "year",
        );
        setDateStart(toDateInput(safe(latestSummary?.date_start)));
        setDateEnd(toDateInput(safe(latestSummary?.date_end)));
        setDaysPresent(
          latestSummary?.days_present == null &&
            latestSummary?.total_days == null &&
            latestSummary?.days == null &&
            latestSummary?.instructional_days == null
            ? dayRows.length || null
            : Math.max(
                toNumber(latestSummary?.days_present),
                toNumber(latestSummary?.total_days),
                toNumber(latestSummary?.days),
                toNumber(latestSummary?.instructional_days),
                dayRows.filter((row) => daysPresentFromRow(row)).length,
              ),
        );
        const summaryHours = Math.max(
          toNumber(latestSummary?.total_instruction_minutes),
          toNumber(latestSummary?.instructional_minutes),
          toNumber(latestSummary?.minutes),
          toNumber(latestSummary?.total_hours) * 60,
          toNumber(latestSummary?.hours) * 60,
        );
        setHoursInput(summaryHours > 0 ? String(Math.round((summaryHours / 60) * 10) / 10) : "");
      } catch (err) {
        if (!mounted) return;
        setSummaryRecord(null);
        setAttendanceRows([]);
        setTableUnavailable(true);
        console.error("Attendance card hydrate failed", err);
        setError("Attendance tracking is not available in this setup yet.");
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [familyProfileId, jurisdictionId, learner?.id, refreshTick, registrationCycleId]);

  async function handleSave() {
    if (!learner || !hasJurisdiction) return;
    if (!userId) {
      setError("A signed-in session is required to save attendance summaries.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const minutes = hoursInput === "" ? null : Math.max(0, Math.round(Number(hoursInput) * 60));

    const payloadBase: AttendanceSummaryRow = {
      learner_id: learner.id,
      user_id: userId || undefined,
      family_id: familyProfileId || undefined,
      jurisdiction_id: jurisdictionId || undefined,
      registration_cycle_id: registrationCycleId || undefined,
      period_label: periodLabel || null,
      period_type: periodType,
      date_start: fromDateInput(dateStart),
      date_end: fromDateInput(dateEnd),
      days_present: daysPresent,
      total_instruction_minutes: minutes,
      school_year_label: schoolYearLabel || currentAcademicYear(),
      academic_year: schoolYearLabel || currentAcademicYear(),
    };

    const payloads: AttendanceSummaryRow[] = [
      payloadBase,
      {
        learner_id: learner.id,
        registration_cycle_id: registrationCycleId || undefined,
        period_label: periodLabel || null,
        period_type: periodType,
        date_start: fromDateInput(dateStart),
        date_end: fromDateInput(dateEnd),
        days_present: daysPresent,
        total_instruction_minutes: minutes,
        school_year_label: schoolYearLabel || currentAcademicYear(),
        academic_year: schoolYearLabel || currentAcademicYear(),
      },
      {
        learner_id: learner.id,
        period_label: periodLabel || null,
        period_type: periodType,
        date_start: fromDateInput(dateStart),
        date_end: fromDateInput(dateEnd),
        days_present: daysPresent,
        total_instruction_minutes: minutes,
      },
    ];

    try {
      await writeAttendanceSummary(safe(summaryRecord?.id), payloads);
      setMessage("Attendance summary saved.");
      setRefreshTick((current) => current + 1);
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The attendance summary could not be saved right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  const progressText =
    requiredDays != null || requiredHours != null
      ? `${requiredDays != null ? `${currentDays}/${requiredDays} days` : "Days not seeded"} | ${
          requiredHours != null ? `${currentHours}/${requiredHours} hours` : "Hours not seeded"
        }`
      : "No seeded target was returned for this jurisdiction.";

  if (loading) {
    return (
      <article className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-5">
        <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
        <div className="h-8 w-56 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-200" />
        <div className="grid gap-3">
          <div className="h-11 animate-pulse rounded-[14px] bg-slate-100" />
          <div className="h-11 animate-pulse rounded-[14px] bg-slate-100" />
          <div className="h-11 animate-pulse rounded-[14px] bg-slate-100" />
        </div>
      </article>
    );
  }

  return (
    <article className={`grid gap-4 rounded-[22px] border p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${panelTone(reportsModel)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Attendance / hours
          </div>
          <h3 className="text-[18px] font-bold tracking-tight text-slate-950">
            Attendance and instructional hours
          </h3>
          <div className="text-sm leading-6 text-slate-600">{summaryText}</div>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${requirementTone(reportsModel)}`}
        >
          {requiredText}
        </span>
      </div>

      <div className="grid gap-2 rounded-[16px] border border-white/80 bg-white/80 p-4 text-sm leading-6 text-slate-600">
        <div className="font-semibold text-slate-950">
          {required
            ? behaviorLabel(reportsModel)
            : "Attendance tracking is optional in this setup, but it still helps keep the record steady."}
        </div>
        <div>
          Current days present:{" "}
          <span className="font-semibold text-slate-950">{currentDays}</span>
        </div>
        <div>
          Current instructional hours:{" "}
          <span className="font-semibold text-slate-950">{currentHours}</span>
        </div>
        <div>
          Progress: <span className="font-semibold text-slate-950">{progressText}</span>
        </div>
        {attendanceRows.length ? (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              Daily records: {attendanceRows.length}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            School year
          </span>
          <input
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={schoolYearLabel}
            onChange={(event) => setSchoolYearLabel(event.target.value)}
            placeholder={currentAcademicYear()}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Period label
          </span>
          <input
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={periodLabel}
            onChange={(event) => setPeriodLabel(event.target.value)}
            placeholder="2025 annual summary"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Period type
          </span>
          <select
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={periodType}
            onChange={(event) => setPeriodType(event.target.value === "cycle" ? "cycle" : "year")}
          >
            <option value="year">year</option>
            <option value="cycle">cycle</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Days present
          </span>
          <input
            type="number"
            min="0"
            step="1"
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={numberInputValue(daysPresent)}
            onChange={(event) =>
              setDaysPresent(
                event.target.value === ""
                  ? null
                  : Number.isFinite(Number(event.target.value))
                    ? Number(event.target.value)
                    : null,
              )
            }
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Date start
          </span>
          <input
            type="date"
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={dateStart}
            onChange={(event) => setDateStart(event.target.value)}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Date end
          </span>
          <input
            type="date"
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={dateEnd}
            onChange={(event) => setDateEnd(event.target.value)}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Total hours
          </span>
          <input
            type="number"
            min="0"
            step="0.5"
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={hoursInput}
            onChange={(event) => setHoursInput(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-[16px] border border-slate-200 bg-white/80 p-4 text-sm leading-6 text-slate-600">
        <div className="font-semibold text-slate-950">Required versus actual</div>
        <div>
          Days:{" "}
          <span className="font-semibold text-slate-950">
            {requiredDays == null ? "Not required by your current setup" : `${currentDays} / ${requiredDays}`}
          </span>
        </div>
        <div>
          Hours:{" "}
          <span className="font-semibold text-slate-950">
            {requiredHours == null ? "Not required by your current setup" : `${currentHours} / ${requiredHours}`}
          </span>
        </div>
      </div>

      {message ? (
        <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm leading-6 text-slate-600">
          {!userId
            ? "Save unavailable until sign-in"
            : !hasJurisdiction
              ? "Set your jurisdiction first"
              : behaviorLabel(reportsModel)}
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !learner || !userId || !hasJurisdiction}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save attendance"}
        </button>
      </div>
    </article>
  );
}
