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

function behaviorLabel(model: ReportsBuilderModel | null) {
  const behaviour = model?.jurisdictionBehaviour;
  if (!behaviour) return "Not required by your current setup";
  if (behaviour.portfolioModeEnabled) return "Optional support";
  if (behaviour.strictGateEnabled) return "Required before export";
  return "Recommended";
}

function requiredCopy(model: ReportsBuilderModel | null) {
  const requiresAttendance =
    model?.ruleSet?.requiresAttendanceTracking === true ||
    model?.ruleSet?.requiresInstructionHours === true;
  if (requiresAttendance) return behaviorLabel(model);
  return "Not required by your current setup";
}

type AttendanceSummaryRow = Record<string, unknown>;

type AttendanceComplianceCardProps = {
  learner: FamilyLearner | null;
  reportsModel: ReportsBuilderModel | null;
  userId: string | null;
  onSaved?: () => Promise<void> | void;
  loading?: boolean;
};

function statusTone(model: ReportsBuilderModel | null) {
  if (model?.jurisdictionBehaviour?.portfolioModeEnabled) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  if (model?.jurisdictionBehaviour?.strictGateEnabled) {
    return "border-amber-200 bg-amber-50 text-amber-700";
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

async function loadLatestAttendanceSummary(learnerId: string) {
  const attempts = [
    () =>
      supabase
        .from("homeschool_attendance_summaries")
        .select("*")
        .eq("learner_id", learnerId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
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

export function AttendanceComplianceCard({
  learner,
  reportsModel,
  userId,
  onSaved,
  loading = false,
}: AttendanceComplianceCardProps) {
  const [record, setRecord] = useState<AttendanceSummaryRow | null>(null);
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [totalDays, setTotalDays] = useState<number | null>(null);
  const [totalHours, setTotalHours] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tableUnavailable, setTableUnavailable] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const behaviour = reportsModel?.jurisdictionBehaviour ?? null;
  const requiredText = useMemo(() => requiredCopy(reportsModel), [reportsModel]);
  const requiredDays = reportsModel?.ruleSet?.requiredInstructionDaysPerYear ?? null;
  const requiredHours = reportsModel?.ruleSet?.requiredInstructionHoursPerYear ?? null;
  const currentDays = totalDays ?? toNumber(record?.total_days ?? record?.days);
  const currentHours = totalHours ?? toNumber(record?.total_hours ?? record?.hours);

  const summaryText = useMemo(() => {
    if (!learner) return "Select a learner to view attendance and hours.";
    if (tableUnavailable) return "Attendance summaries are not available in your current setup.";
    if (requiredText === "Not required by your current setup") {
      return "Attendance and hours tracking is visible here, but it is not required by your current setup.";
    }
    if (
      (requiredDays != null && currentDays >= requiredDays) ||
      (requiredHours != null && currentHours >= requiredHours)
    ) {
      return "Current totals are on track for the requirement shown here.";
    }
    if (currentDays > 0 || currentHours > 0) {
      return "Attendance tracking is underway, but the current totals still need attention.";
    }
    return "Attendance tracking has not been started yet.";
  }, [currentDays, currentHours, learner, requiredDays, requiredHours, requiredText, tableUnavailable]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      if (!learner) {
        if (mounted) {
          setRecord(null);
          setTableUnavailable(false);
        }
        return;
      }

      if (mounted) {
        setError("");
        setMessage("");
      }

      try {
        const latest = await loadLatestAttendanceSummary(learner.id);
        if (!mounted) return;

        setRecord(latest);
        setTableUnavailable(false);
        setAcademicYear(safe(latest?.academic_year) || currentAcademicYear());
        setTotalDays(
          latest?.total_days == null && latest?.days == null
            ? null
            : toNumber(latest?.total_days ?? latest?.days),
        );
        setTotalHours(
          latest?.total_hours == null && latest?.hours == null
            ? null
            : toNumber(latest?.total_hours ?? latest?.hours),
        );
      } catch (err) {
        if (!mounted) return;
        setRecord(null);
        setTableUnavailable(true);
        setError(
          err instanceof Error
            ? err.message
            : "Attendance summaries are not available in your current setup.",
        );
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [learner?.id, refreshTick]);

  async function handleSave() {
    if (!learner) return;
    if (!userId) {
      setError("A signed-in session is required to save attendance summaries.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const payloadBase: AttendanceSummaryRow = {
      learner_id: learner.id,
      user_id: userId || undefined,
      academic_year: academicYear || currentAcademicYear(),
      total_days: totalDays,
      total_hours: totalHours,
      registration_cycle_id: reportsModel?.registrationCycle?.id ?? undefined,
    };

    const payloads: AttendanceSummaryRow[] = [
      payloadBase,
      {
        learner_id: learner.id,
        academic_year: academicYear || currentAcademicYear(),
        days: totalDays,
        hours: totalHours,
      },
      {
        learner_id: learner.id,
        academic_year: academicYear || currentAcademicYear(),
        instructional_days: totalDays,
        instructional_hours: totalHours,
      },
    ];

    try {
      await writeAttendanceSummary(safe(record?.id), payloads);
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
          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${statusTone(reportsModel)}`}
        >
          {requiredText}
        </span>
      </div>

      <div className="grid gap-2 rounded-[16px] border border-white/80 bg-white/80 p-4 text-sm leading-6 text-slate-600">
        <div className="font-semibold text-slate-950">
          {requiredText === "Not required by your current setup"
            ? "Attendance summaries are optional for this learner's current jurisdiction setup."
            : behaviour?.strictGateEnabled
              ? "Missing attendance or hours can hold export readiness back in strict jurisdictions."
              : behaviour?.portfolioModeEnabled
                ? "This is supportive documentation in portfolio mode."
                : "Attendance and hours tracking is recommended in guided jurisdictions."}
        </div>
        <div>
          Current totals:{" "}
          <span className="font-semibold text-slate-950">
            {currentDays} days / {currentHours} hours
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {requiredDays != null ? (
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              Required days: {requiredDays}
            </span>
          ) : null}
          {requiredHours != null ? (
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              Required hours: {requiredHours}
            </span>
          ) : null}
          {requiredDays == null && requiredHours == null ? (
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              No rule values were returned for this setup.
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Academic year
          </span>
          <input
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
            placeholder={currentAcademicYear()}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Total days
          </span>
          <input
            type="number"
            min="0"
            step="1"
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={numberInputValue(totalDays)}
            onChange={(event) =>
              setTotalDays(
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
            Total hours
          </span>
          <input
            type="number"
            min="0"
            step="0.5"
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={numberInputValue(totalHours)}
            onChange={(event) =>
              setTotalHours(
                event.target.value === ""
                  ? null
                  : Number.isFinite(Number(event.target.value))
                    ? Number(event.target.value)
                    : null,
              )
            }
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
            : behaviour?.strictGateEnabled
              ? "Required before export"
              : behaviour?.portfolioModeEnabled
                ? "Optional support"
                : "Recommended"}
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !learner || !userId}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save attendance"}
        </button>
      </div>
    </article>
  );
}
