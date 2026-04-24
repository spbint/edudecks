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

function toDatetimeLocal(value: string | null | undefined) {
  const clean = safe(value);
  if (!clean) return "";
  const date = new Date(clean);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string) {
  const clean = safe(value);
  if (!clean) return null;
  const date = new Date(clean);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function behaviorLabel(model: ReportsBuilderModel | null) {
  const behaviour = model?.jurisdictionBehaviour;
  if (!behaviour) return "Not required by your current setup";
  if (behaviour.portfolioModeEnabled) return "Optional support";
  if (behaviour.strictGateEnabled) return "Required before export";
  return "Recommended";
}

function requiredCopy(model: ReportsBuilderModel | null) {
  const requiresNotification = model?.ruleSet?.requiresNotification;
  if (requiresNotification === true) return behaviorLabel(model);
  return "Not required by your current setup";
}

type NotificationRow = Record<string, unknown>;

type NotificationComplianceCardProps = {
  learner: FamilyLearner | null;
  reportsModel: ReportsBuilderModel | null;
  userId: string | null;
  onSaved?: () => Promise<void> | void;
  loading?: boolean;
};

function normalizeStatus(value: unknown) {
  const status = safe(value).toLowerCase();
  if (status === "draft" || status === "submitted" || status === "acknowledged") {
    return status;
  }
  return "not_started";
}

function statusTone(status: string, model: ReportsBuilderModel | null) {
  if (status === "acknowledged" || status === "submitted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
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

async function loadLatestNotification(learnerId: string) {
  const attempts = [
    () =>
      supabase
        .from("homeschool_notifications")
        .select("*")
        .eq("learner_id", learnerId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    () =>
      supabase
        .from("homeschool_notifications")
        .select("*")
        .eq("learner_id", learnerId)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    () =>
      supabase
        .from("homeschool_notifications")
        .select("*")
        .eq("learner_id", learnerId)
        .limit(1)
        .maybeSingle(),
  ];

  let lastError: unknown = null;

  for (const attempt of attempts) {
    const response = await attempt();
    if (!response.error) {
      return response.data as NotificationRow | null;
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The notification table could not be queried.");
}

async function writeNotificationRecord(
  existingId: string | null,
  payloads: NotificationRow[],
) {
  let lastError: unknown = null;

  for (const payload of payloads) {
    const response = existingId
      ? await supabase
          .from("homeschool_notifications")
          .update(payload)
          .eq("id", existingId)
      : await supabase.from("homeschool_notifications").insert(payload);

    if (!response.error) {
      return;
    }

    lastError = response.error;
    if (!isMissingColumnError(response.error)) {
      throw response.error;
    }
  }

  throw lastError ?? new Error("The notification record could not be saved.");
}

export function NotificationComplianceCard({
  learner,
  reportsModel,
  userId,
  onSaved,
  loading = false,
}: NotificationComplianceCardProps) {
  const [record, setRecord] = useState<NotificationRow | null>(null);
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [notificationType, setNotificationType] = useState("notice_of_intent");
  const [status, setStatus] = useState("not_started");
  const [submittedAt, setSubmittedAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tableUnavailable, setTableUnavailable] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const behaviour = reportsModel?.jurisdictionBehaviour ?? null;
  const requiredText = useMemo(() => requiredCopy(reportsModel), [reportsModel]);
  const summaryText = useMemo(() => {
    if (!learner) return "Select a learner to view notification compliance.";
    if (tableUnavailable) return "Notification tracking is not available in your current setup.";
    if (requiredText === "Not required by your current setup") {
      return "Notification tracking is visible here, but it is not required by your current setup.";
    }
    if (status === "acknowledged" || status === "submitted") {
      return "The notification record looks up to date.";
    }
    if (status === "draft") {
      return "A draft notification record is in progress.";
    }
    return "This notification record still needs attention.";
  }, [learner, requiredText, status, tableUnavailable]);

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
        const latest = await loadLatestNotification(learner.id);
        if (!mounted) return;

        setRecord(latest);
        setTableUnavailable(false);
        setAcademicYear(safe(latest?.academic_year) || currentAcademicYear());
        setNotificationType(safe(latest?.notification_type) || "notice_of_intent");
        setStatus(normalizeStatus(latest?.status));
        setSubmittedAt(toDatetimeLocal(safe(latest?.submitted_at)));
      } catch (err) {
        if (!mounted) return;
        setRecord(null);
        setTableUnavailable(true);
        setError(
          err instanceof Error
            ? err.message
            : "Notification tracking is not available in your current setup.",
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
      setError("A signed-in session is required to save notification records.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const payloadBase: NotificationRow = {
      learner_id: learner.id,
      user_id: userId || undefined,
      academic_year: academicYear || currentAcademicYear(),
      notification_type: notificationType || "notice_of_intent",
      status,
      submitted_at: fromDatetimeLocal(submittedAt),
      registration_cycle_id: reportsModel?.registrationCycle?.id ?? undefined,
    };

    const payloads: NotificationRow[] = [
      payloadBase,
      {
        learner_id: learner.id,
        academic_year: academicYear || currentAcademicYear(),
        notification_type: notificationType || "notice_of_intent",
        status,
        submitted_at: fromDatetimeLocal(submittedAt),
      },
      {
        learner_id: learner.id,
        notification_type: notificationType || "notice_of_intent",
        status,
      },
    ];

    try {
      await writeNotificationRecord(safe(record?.id), payloads);
      setMessage("Notification record saved.");
      setRefreshTick((current) => current + 1);
      await onSaved?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The notification record could not be saved right now.",
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
            Notification
          </div>
          <h3 className="text-[18px] font-bold tracking-tight text-slate-950">
            Notification compliance
          </h3>
          <div className="text-sm leading-6 text-slate-600">{summaryText}</div>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${statusTone(status, reportsModel)}`}
        >
          {requiredText}
        </span>
      </div>

      <div className="grid gap-2 rounded-[16px] border border-white/80 bg-white/80 p-4 text-sm leading-6 text-slate-600">
        <div className="font-semibold text-slate-950">
          {requiredText === "Not required by your current setup"
            ? "Notification tracking is optional for this learner's current jurisdiction setup."
            : behaviour?.strictGateEnabled
              ? "Missing notification records can hold export readiness back in strict jurisdictions."
              : behaviour?.portfolioModeEnabled
                ? "This is supportive documentation in portfolio mode."
                : "Notification tracking is recommended in guided jurisdictions."}
        </div>
        <div>
          Current status: <span className="font-semibold text-slate-950">{status}</span>
        </div>
        <div>
          Latest record:{" "}
          <span className="font-semibold text-slate-950">
            {record ? "Loaded" : "No saved record yet"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
            Notification type
          </span>
          <input
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={notificationType}
            onChange={(event) => setNotificationType(event.target.value)}
            placeholder="notice_of_intent"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Status
          </span>
          <select
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="not_started">not_started</option>
            <option value="draft">draft</option>
            <option value="submitted">submitted</option>
            <option value="acknowledged">acknowledged</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Submitted at
          </span>
          <input
            type="datetime-local"
            className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-100"
            value={submittedAt}
            onChange={(event) => setSubmittedAt(event.target.value)}
          />
        </label>
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
          {saving ? "Saving..." : "Save notification"}
        </button>
      </div>
    </article>
  );
}
